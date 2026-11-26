import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage, Flight } from '../../../core/models';

@Component({
  selector: 'app-flight-list',
  standalone: false,
  styleUrl: './flight-list.css',
  templateUrl: './flight-list.html',
})
export class FlightList {
  flights: Flight[] = [];
  loading = true;
  errorMessage = '';
  readonly minDate = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.api.flights().subscribe({
      next: flights => {
        this.flights = flights;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar os voos.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  buy(flight: Flight): void {
    if (!this.auth.currentUser) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.api.createReservation({ tipo: 'voo', idPassagem: flight.id, dataIda: flight.dataVoo }).subscribe({
      next: purchase => {
        void this.router.navigate(['/minhas-compras'], { queryParams: { id: purchase.id } });
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível comprar esta passagem.');
        this.changeDetector.markForCheck();
      },
    });
  }
}
