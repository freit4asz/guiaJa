import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { apiErrorMessage, Reservation } from '../../../core/models';

@Component({
  selector: 'app-purchases',
  standalone: false,
  styleUrl: './purchases.css',
  templateUrl: './purchases.html',
})
export class Purchases {
  purchases: Reservation[] = [];
  dateEdits: Record<number, string> = {};
  loading = true;
  errorMessage = '';
  successMessage = '';
  highlightedId: number | null = null;
  readonly minDate = new Date().toISOString().slice(0, 10);

  constructor(
    private readonly api: ApiService,
    route: ActivatedRoute,
    private readonly changeDetector: ChangeDetectorRef,
  ) {
    const id = Number(route.snapshot.queryParamMap.get('id'));
    this.highlightedId = Number.isInteger(id) && id > 0 ? id : null;
  }

  ngOnInit(): void {
    this.load();
  }

  get confirmedPurchase(): Reservation | null {
    const purchase = this.purchases.find(item => item.id === this.highlightedId);
    return purchase && purchase.status !== 'Cancelada' ? purchase : null;
  }

  purchaseTitle(item: Reservation): string {
    if (item.tipoCompra === 'voo') return `Voo ${item.origemVoo} → ${item.destinoVoo}`;
    if (item.tipoCompra === 'hotel') return item.hospedagem || 'Hospedagem';
    return item.pacote || 'Pacote de viagem';
  }

  load(): void {
    this.api.reservations().subscribe({
      next: purchases => {
        this.purchases = purchases;
        this.dateEdits = Object.fromEntries(purchases.map(item => [item.id, item.dataIda.slice(0, 10)]));
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar suas compras.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  updateDate(item: Reservation): void {
    const newDate = this.dateEdits[item.id];
    if (!newDate) return;
    this.api.updateReservationDate(item.id, newDate).subscribe({
      next: () => {
        this.successMessage = 'Data da viagem atualizada.';
        this.load();
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível alterar a data.');
        this.changeDetector.markForCheck();
      },
    });
  }

  cancel(item: Reservation): void {
    if (!window.confirm(`Deseja cancelar a compra ${item.codigo}?`)) return;
    this.api.cancelReservation(item.id).subscribe({
      next: () => {
        this.successMessage = 'Compra cancelada.';
        this.load();
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível cancelar a compra.');
        this.changeDetector.markForCheck();
      },
    });
  }

  purchaseDateTime(value: string | null): string {
    if (!value) return 'Horário não registrado';
    const date = new Date(`${value.replace(' ', 'T')}Z`);
    return Number.isNaN(date.getTime())
      ? 'Horário não registrado'
      : date.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  }
}
