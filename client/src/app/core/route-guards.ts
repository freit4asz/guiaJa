import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | UrlTree {
    return this.auth.currentUser
      ? true
      : this.router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
  }
}

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService, private readonly router: Router) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.currentUser?.tipo === 'admin') return true;
    return this.auth.currentUser
      ? this.router.createUrlTree(['/'])
      : this.router.createUrlTree(['/login']);
  }
}
