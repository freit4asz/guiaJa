import { ChangeDetectorRef, Component } from '@angular/core';
import { ApiService } from '../../../core/api.service';
import {
  apiErrorMessage,
  DashboardData,
  EmailNotification,
  Guide,
  GuideApplication,
  Reservation,
  SiteAccess,
} from '../../../core/models';

@Component({
  selector: 'app-admin-dashboard',
  standalone: false,
  styleUrl: './admin-dashboard.css',
  templateUrl: './admin-dashboard.html',
})
export class AdminDashboard {
  data: DashboardData | null = null;
  purchases: Reservation[] = [];
  guides: Guide[] = [];
  guideSelections: Record<number, number | null> = {};
  accesses: SiteAccess[] = [];
  applications: GuideApplication[] = [];
  notifications: EmailNotification[] = [];
  loading = true;
  errorMessage = '';
  operationsError = '';

  constructor(private readonly api: ApiService, private readonly changeDetector: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.api.dashboard().subscribe({
      next: data => {
        this.data = data;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar o painel.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
    this.api.reservations().subscribe({
      next: purchases => {
        this.purchases = purchases;
        this.guideSelections = Object.fromEntries(purchases.map(purchase => [purchase.id, purchase.idGuia ?? null]));
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível carregar as compras.');
        this.changeDetector.markForCheck();
      },
    });
    this.api.guides().subscribe({
      next: guides => {
        this.guides = guides;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível carregar os guias.');
        this.changeDetector.markForCheck();
      },
    });
    this.api.accesses().subscribe({
      next: result => {
        this.accesses = result.items;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível carregar os acessos.');
        this.changeDetector.markForCheck();
      },
    });
    this.api.guideApplications().subscribe({
      next: applications => {
        this.applications = applications;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível carregar as candidaturas.');
        this.changeDetector.markForCheck();
      },
    });
    this.api.emailNotifications().subscribe({
      next: notifications => {
        this.notifications = notifications;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível carregar as notificações.');
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

  updateGuide(purchase: Reservation): void {
    this.api.updateReservationGuide(purchase.id, this.guideSelections[purchase.id] ?? null).subscribe({
      next: () => {
        this.operationsError = '';
        this.purchases = this.purchases.map(item => item.id === purchase.id
          ? { ...item, idGuia: this.guideSelections[purchase.id] ?? null }
          : item);
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.operationsError = apiErrorMessage(error, 'Não foi possível atualizar o guia desta compra.');
        this.changeDetector.markForCheck();
      },
    });
  }
}
