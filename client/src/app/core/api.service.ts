import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreatedReservation,
  AccountProfile,
  DashboardData,
  Destination,
  EmailNotification,
  Flight,
  GuideApplication,
  Guide,
  Hotel,
  Reservation,
  ResourceKey,
  ResourceRow,
  SiteAccess,
  TravelPackage,
} from './models';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient, private readonly auth: AuthService) {}

  packages(): Observable<TravelPackage[]> {
    return this.http.get<TravelPackage[]>('/api/pacotes');
  }

  package(id: number): Observable<TravelPackage> {
    return this.http.get<TravelPackage>(`/api/pacotes/${id}`);
  }

  guides(): Observable<Guide[]> {
    return this.http.get<Guide[]>('/api/guias');
  }

  hotels(): Observable<Hotel[]> {
    return this.http.get<Hotel[]>('/api/hoteis');
  }

  flights(): Observable<Flight[]> {
    return this.http.get<Flight[]>('/api/voos');
  }

  applyAsGuide(data: { nome: string; email: string; curriculo: string }): Observable<{ ok: boolean; id: number; emailStatus: string }> {
    return this.http.post<{ ok: boolean; id: number; emailStatus: string }>('/api/guias/candidatura', data);
  }

  profile(): Observable<AccountProfile> {
    return this.http.get<AccountProfile>('/api/perfil', this.authOptions());
  }

  updateProfile(data: { nome: string; telefone: string }): Observable<AccountProfile> {
    return this.http.put<AccountProfile>('/api/perfil', data, this.authOptions());
  }

  sendGuideMessage(data: { idGuia: number; conteudo: string }): Observable<{ ok: boolean; emailStatus: string }> {
    return this.http.post<{ ok: boolean; emailStatus: string }>('/api/mensagens', data, this.authOptions());
  }

  createReservation(input: Record<string, string | number | null>): Observable<CreatedReservation> {
    return this.http.post<CreatedReservation>('/api/reservas', input, this.authOptions());
  }

  reservations(): Observable<Reservation[]> {
    return this.http.get<Reservation[]>('/api/reservas', this.authOptions());
  }

  updateReservationGuide(id: number, idGuia: number | null): Observable<{ id: number; idGuia: number | null }> {
    return this.http.patch<{ id: number; idGuia: number | null }>(
      `/api/admin/reservas/${id}/guia`,
      { idGuia },
      this.authOptions(),
    );
  }

  updateReservationDate(id: number, dataIda: string): Observable<{ id: number; dataIda: string }> {
    return this.http.put<{ id: number; dataIda: string }>(
      `/api/reservas/${id}`,
      { dataIda },
      this.authOptions(),
    );
  }

  cancelReservation(id: number): Observable<void> {
    return this.http.delete<void>(`/api/reservas/${id}`, this.authOptions());
  }

  dashboard(): Observable<DashboardData> {
    return this.http.get<DashboardData>('/api/admin/dashboard', this.authOptions());
  }

  accesses(): Observable<{ items: SiteAccess[]; total: number }> {
    return this.http.get<{ items: SiteAccess[]; total: number }>('/api/admin/accesses?page=1&limit=50', this.authOptions());
  }

  guideApplications(): Observable<GuideApplication[]> {
    return this.http.get<GuideApplication[]>('/api/admin/candidaturas', this.authOptions());
  }

  emailNotifications(): Observable<EmailNotification[]> {
    return this.http.get<EmailNotification[]>('/api/admin/notificacoes-email', this.authOptions());
  }

  resource(resource: ResourceKey): Observable<ResourceRow[]> {
    return this.http.get<ResourceRow[]>(`/api/admin/${resource}`, this.authOptions());
  }

  createResource(resource: ResourceKey, data: ResourceRow): Observable<ResourceRow> {
    return this.http.post<ResourceRow>(`/api/admin/${resource}`, data, this.authOptions());
  }

  updateResource(resource: ResourceKey, id: number, data: ResourceRow): Observable<ResourceRow> {
    return this.http.put<ResourceRow>(`/api/admin/${resource}/${id}`, data, this.authOptions());
  }

  deleteResource(resource: ResourceKey, id: number): Observable<void> {
    return this.http.delete<void>(`/api/admin/${resource}/${id}`, this.authOptions());
  }

  destinations(): Observable<Destination[]> {
    return this.http.get<Destination[]>('/api/admin/destinos', this.authOptions());
  }

  private authOptions(): { headers: HttpHeaders } {
    const authorization = this.auth.authorization;
    return {
      headers: authorization ? new HttpHeaders({ Authorization: authorization }) : new HttpHeaders(),
    };
  }
}
