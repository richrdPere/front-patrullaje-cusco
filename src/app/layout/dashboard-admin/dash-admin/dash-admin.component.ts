import {
  Component,
  DestroyRef,
  OnInit,
  inject,
} from '@angular/core';

import { RouterOutlet } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Pipes
import { CapitalizePipe } from 'src/app/pipes/capitalize.pipe';

// Components
import { SidebarMenuComponent } from '../components/sidebar-menu/sidebar-menu.component';

import { NavbarMenuComponent } from '../components/navbar-menu/navbar-menu.component';

// Services
import {
  AuthService,
} from 'src/app/services/auth/auth.service';

@Component({
  selector: 'app-dash-admin',
  standalone: true,
  imports: [
    RouterOutlet,
    SidebarMenuComponent,
    NavbarMenuComponent,
    CapitalizePipe,
  ],
  templateUrl: './dash-admin.component.html',
  styles: ``,
})
export class DashAdminComponent implements OnInit {

  nombre = '';
  rol = '';

  private readonly destroyRef = inject(DestroyRef);

  constructor(
    private readonly authService: AuthService,
  ) { }

  ngOnInit(): void {
    this.listenCurrentUser();
  }

  private listenCurrentUser(): void {
    this.authService.currentUser$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((usuario) => {
        if (!usuario) {
          this.nombre = '';
          this.rol = '';
          return;
        }

        this.nombre = usuario.persona?.nombres?.trim() ||
          usuario.username ||
          'Usuario';

        this.rol = usuario.roles?.join(', ') || '';
      });
  }
}
