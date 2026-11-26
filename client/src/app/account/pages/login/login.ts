import { ChangeDetectorRef, Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: false,
  styleUrl: './login.css',
  templateUrl: './login.html',
})
export class Login {
  email = '';
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
    this.auth.login(this.email, this.senha).subscribe({
      next: () => {
        this.submitting = false;
        this.changeDetector.markForCheck();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        const destination = returnUrl?.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
        void this.router.navigateByUrl(destination);
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível entrar.');
        this.submitting = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
