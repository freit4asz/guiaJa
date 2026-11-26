import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AccountProfile, AppUser } from './models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'guiaja.basic';
  private readonly userKey = 'guiaja.angular.user';
  private readonly userSubject = new BehaviorSubject<AppUser | null>(this.readUser());
  readonly user$ = this.userSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  get currentUser(): AppUser | null {
    return this.userSubject.value;
  }

  get authorization(): string | null {
    return sessionStorage.getItem(this.tokenKey);
  }

  updateCurrentProfile(profile: Pick<AccountProfile, 'nome' | 'telefone'>): void {
    const user = this.userSubject.value;
    if (!user) return;
    const updatedUser = { ...user, ...profile };
    sessionStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    this.userSubject.next(updatedUser);
  }

  login(email: string, senha: string): Observable<AppUser> {
    return this.http.post<AppUser>('/api/login', { email, senha }).pipe(
      tap(user => {
        sessionStorage.setItem(this.tokenKey, user.authorization);
        sessionStorage.setItem(this.userKey, JSON.stringify(user));
        this.userSubject.next(user);
      }),
    );
  }

  register(data: { nome: string; email: string; telefone: string; senha: string }): Observable<{ ok: boolean }> {
    return this.http.post<{ ok: boolean }>('/api/cadastro', data);
  }

  logout(): void {
    sessionStorage.removeItem(this.tokenKey);
    sessionStorage.removeItem(this.userKey);
    localStorage.removeItem('sessao');
    this.userSubject.next(null);
  }

  private readUser(): AppUser | null {
    if (!sessionStorage.getItem(this.tokenKey)) return null;
    try {
      const saved = sessionStorage.getItem(this.userKey) || localStorage.getItem('sessao');
      return saved ? JSON.parse(saved) as AppUser : null;
    } catch {
      sessionStorage.removeItem(this.tokenKey);
      sessionStorage.removeItem(this.userKey);
      localStorage.removeItem('sessao');
      return null;
    }
  }
}
