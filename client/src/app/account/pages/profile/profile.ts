import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { AccountProfile, apiErrorMessage, Reservation } from '../../../core/models';

@Component({
  selector: 'app-profile',
  standalone: false,
  styleUrl: './profile.css',
  templateUrl: './profile.html',
})
export class Profile implements OnInit {
  profile: AccountProfile | null = null;
  nome = '';
  telefone = '';
  purchases: Reservation[] = [];
  loading = true;
  purchasesLoading = true;
  saving = false;
  errorMessage = '';
  purchasesError = '';
  successMessage = '';

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.api.profile().subscribe({
      next: profile => {
        this.profile = profile;
        this.nome = profile.nome;
        this.telefone = profile.telefone ?? '';
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar seu perfil.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });

    this.api.reservations().subscribe({
      next: purchases => {
        this.purchases = purchases;
        this.purchasesLoading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.purchasesError = apiErrorMessage(error, 'Não foi possível carregar o resumo das compras.');
        this.purchasesLoading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  get confirmedPurchases(): Reservation[] {
    return this.purchases.filter(purchase => purchase.status === 'Confirmada');
  }

  get confirmedTotal(): number {
    return this.confirmedPurchases.reduce((total, purchase) => total + Number(purchase.total), 0);
  }

  get recentPurchases(): Reservation[] {
    return this.purchases.slice(0, 3);
  }

  formatDate(value: string): string {
    const [year, month, day] = value.slice(0, 10).split('-');
    return year && month && day ? `${day}/${month}/${year}` : value;
  }

  save(): void {
    if (this.saving) return;
    this.saving = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.api.updateProfile({ nome: this.nome, telefone: this.telefone }).subscribe({
      next: profile => {
        this.profile = profile;
        this.nome = profile.nome;
        this.telefone = profile.telefone ?? '';
        this.auth.updateCurrentProfile(profile);
        this.successMessage = 'Seu perfil foi atualizado.';
        this.saving = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível salvar seu perfil.');
        this.saving = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
