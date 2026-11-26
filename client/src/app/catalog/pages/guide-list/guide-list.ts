import { ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/api.service';
import { AuthService } from '../../../core/auth.service';
import { apiErrorMessage, Guide } from '../../../core/models';

@Component({
  selector: 'app-guide-list',
  standalone: false,
  styleUrl: './guide-list.css',
  templateUrl: './guide-list.html',
})
export class GuideList {
  guides: Guide[] = [];
  loading = true;
  errorMessage = '';
  applicationMessage = '';
  applicationName = '';
  applicationEmail = '';
  applicationResume = '';
  applicationError = '';
  applicationSubmitting = false;
  selectedGuideId: number | null = null;
  messageText = '';
  messageSuccess = '';
  messageError = '';
  messageSubmitting = false;

  constructor(
    private readonly api: ApiService,
    private readonly auth: AuthService,
    private readonly router: Router,
    private readonly changeDetector: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.api.guides().subscribe({
      next: guides => {
        this.guides = guides;
        this.loading = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.errorMessage = apiErrorMessage(error, 'Não foi possível carregar os guias.');
        this.loading = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  apply(): void {
    this.applicationError = '';
    this.applicationMessage = '';
    this.applicationSubmitting = true;
    this.api.applyAsGuide({
      nome: this.applicationName,
      email: this.applicationEmail,
      curriculo: this.applicationResume,
    }).subscribe({
      next: () => {
        this.applicationMessage = 'Candidatura enviada. A equipe GuiaJa recebeu seus dados.';
        this.applicationName = '';
        this.applicationEmail = '';
        this.applicationResume = '';
        this.applicationSubmitting = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.applicationError = apiErrorMessage(error, 'Não foi possível enviar sua candidatura.');
        this.applicationSubmitting = false;
        this.changeDetector.markForCheck();
      },
    });
  }

  openMessage(guide: Guide): void {
    if (!this.auth.currentUser) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: '/guias' } });
      return;
    }
    this.selectedGuideId = guide.id;
    this.messageText = '';
    this.messageSuccess = '';
    this.messageError = '';
  }

  closeMessage(): void {
    this.selectedGuideId = null;
    this.messageText = '';
    this.messageSuccess = '';
    this.messageError = '';
  }

  sendMessage(guide: Guide): void {
    const conteudo = this.messageText.trim();
    if (!conteudo || this.messageSubmitting) return;
    this.messageSubmitting = true;
    this.messageError = '';
    this.messageSuccess = '';
    this.api.sendGuideMessage({ idGuia: guide.id, conteudo }).subscribe({
      next: result => {
        this.messageText = '';
        this.messageSuccess = result.emailStatus === 'pendente'
          ? `Mensagem registrada; o aviso para ${guide.nome} está na fila de envio.`
          : 'Mensagem registrada. O aviso ao guia será enviado quando o e-mail do sistema estiver configurado.';
        this.messageSubmitting = false;
        this.changeDetector.markForCheck();
      },
      error: error => {
        this.messageError = apiErrorMessage(error, 'Não foi possível enviar a mensagem.');
        this.messageSubmitting = false;
        this.changeDetector.markForCheck();
      },
    });
  }
}
