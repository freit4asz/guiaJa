import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage, Hotel } from '../../../core/models';
import { hotelImageUrl } from '../../../core/image-assets';

@Component({
  selector: 'app-hotel-list',
  standalone: false,
  styleUrl: './hotel-list.css',
  templateUrl: './hotel-list.html',
})
export class HotelList {
  hotels: Hotel[] = [];
  hotelDates: Record<number, string> = {};
  hotelNights: Record<number, number> = {};
  bookingErrors: Record<number, string> = {};
  loading = true;
  errorMessage = '';
  submittingHotelId: number | null = null;
  readonly minDate = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  imageFor(item: Hotel): string {
    return hotelImageUrl(item);
  }

  get isAuthenticated(): boolean {
    return Boolean(this.auth.currentUser);
  }

  ngOnInit(): void {
    this.api.hotels().subscribe({
      next: hotels => {
        this.hotels = hotels;
        this.hotelDates = Object.fromEntries(hotels.map(hotel => [hotel.id, '']));
        this.hotelNights = Object.fromEntries(hotels.map(hotel => [hotel.id, 1]));
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar as hospedagens.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  purchase(hotel: Hotel): void {
    const dataIda = this.hotelDates[hotel.id];
    const noites = Number(this.hotelNights[hotel.id]);
    if (!dataIda) {
      this.bookingErrors[hotel.id] = 'Escolha a data de check-in.';
      return;
    }
    if (!Number.isInteger(noites) || noites < 1 || noites > 30) {
      this.bookingErrors[hotel.id] = 'Escolha de 1 a 30 noites.';
      return;
    }
    if (!this.auth.currentUser) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/hospedagens' } });
      return;
    }
    if (this.submittingHotelId !== null) return;

    this.bookingErrors[hotel.id] = '';
    this.submittingHotelId = hotel.id;
    this.api.createReservation({
      tipo: 'hotel',
      idHospedagem: hotel.id,
      dataIda,
      noites,
    }).subscribe({
      next: purchase => {
        void this.router.navigate(['/minhas-compras'], { queryParams: { id: purchase.id } });
      },
      error: error => {
        this.bookingErrors[hotel.id] = apiErrorMessage(error, 'Não foi possível reservar esta hospedagem.');
        this.submittingHotelId = null;
        this.changeDetector.markForCheck();
      },
    });
  }
}
