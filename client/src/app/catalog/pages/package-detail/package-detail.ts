import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage, Guide, Hotel, TravelPackage } from '../../../core/models';
import { packageImageUrl } from '../../../core/image-assets';

@Component({
  selector: 'app-package-detail',
  standalone: false,
  styleUrl: './package-detail.css',
  templateUrl: './package-detail.html',
})
export class PackageDetail {
  travelPackage: TravelPackage | null = null;
  guides: Guide[] = [];
  hotels: Hotel[] = [];
  loading = true;
  errorMessage = '';
  dataIda = '';
  selectedGuideId: number | null = null;
  selectedHotelId: number | null = null;
  includeHotel = false;
  readonly minDate = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!Number.isInteger(id) || id < 1) {
      this.errorMessage = 'Pacote não encontrado.';
      this.loading = false;
      return;
    }

    forkJoin({
      travelPackage: this.api.package(id),
      guides: this.api.guides(),
      hotels: this.api.hotels(),
    }).subscribe({
      next: result => {
        this.travelPackage = result.travelPackage;
        this.guides = result.guides;
        this.hotels = result.hotels.filter(hotel => hotel.idDestino === result.travelPackage.idDestino);
        this.selectedHotelId = this.hotels[0]?.id ?? null;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar este pacote.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  get total(): number {
    if (!this.travelPackage) return 0;
    const guide = this.guides.find(item => item.id === Number(this.selectedGuideId));
    const hotel = this.includeHotel
      ? this.hotels.find(item => item.id === Number(this.selectedHotelId))
      : undefined;
    return this.travelPackage.preco
      + (guide ? guide.valorHora * 4 * this.travelPackage.dias : 0)
      + (hotel ? hotel.diaria * this.travelPackage.dias : 0);
  }

  imageFor(item: TravelPackage): string | null {
    return packageImageUrl(item);
  }

  buy(): void {
    if (!this.travelPackage || !this.dataIda) {
      this.errorMessage = 'Informe a data de ida para continuar.';
      return;
    }
    if (!this.auth.currentUser) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.errorMessage = '';
    this.api.createReservation({
      tipo: 'pacote',
      idPacote: this.travelPackage.id,
      idGuia: this.selectedGuideId,
      idHospedagem: this.includeHotel ? this.selectedHotelId : null,
      dataIda: this.dataIda,
    }).subscribe({
      next: purchase => {
        void this.router.navigate(['/minhas-compras'], { queryParams: { id: purchase.id } });
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível concluir a compra.');
        this.changeDetector.markForCheck();
      },
    });
  }
}
