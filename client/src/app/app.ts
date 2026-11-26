import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: false,
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  constructor(public readonly auth: AuthService, private readonly router: Router) {}

  logout(): void {
    this.auth.logout();
    void this.router.navigateByUrl('/');
  }
}
