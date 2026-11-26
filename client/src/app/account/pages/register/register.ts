import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { switchMap } from 'rxjs';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: false,
  styleUrl: './register.css',
  templateUrl: './register.html',
})
export class Register {
  nome = '';
  email = '';
  telefone = '';
  senha = '';
  errorMessage = '';
  submitting = false;

  constructor(
    private readonly auth: AuthService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  submit(): void {
    this.errorMessage = '';
    this.submitting = true;
    const data = { nome: this.nome, email: this.email, telefone: this.telefone, senha: this.senha };
    this.auth.register(data).pipe(switchMap(() => this.auth.login(this.email, this.senha))).subscribe({
      next: () => {
        this.submitting = false;
        this.changeDetector.markForCheck();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
        void this.router.navigateByUrl(destination);
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível criar a conta.');
        this.submitting = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
