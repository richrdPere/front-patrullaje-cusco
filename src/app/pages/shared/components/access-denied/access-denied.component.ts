import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { AuthService } from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-access-denied',
  imports: [
    CommonModule,
    // RouterLink
  ],
  templateUrl: './access-denied.component.html',
  styles: ``
})
export class AccessDeniedComponent {
  constructor(
    private router: Router,
    private authService: AuthService
  ) { }

  volver(): void {
    window.history.back();
  }

  irAlInicio(): void {
    this.router.navigate(['/admin']);
  }

  cerrarSesion(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
