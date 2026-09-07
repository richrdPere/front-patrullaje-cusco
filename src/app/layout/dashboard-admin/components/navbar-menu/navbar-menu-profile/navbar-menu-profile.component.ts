import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// IziToast
import iziToast from 'izitoast';
import { finalize } from 'rxjs';

// Servicio
import { AuthService } from 'src/app/services/auth/auth.service';
import { PerfilService } from 'src/app/services/profile.service';

// Interface
export interface MenuOptions {
  label: string;
  icon: string; // Ruta al SVG
  route: string;
}

@Component({
  selector: 'navbar-menu-profile',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar-menu-profile.component.html',
  styles: ``
})
export class NavbarMenuProfileComponent {

  // variables
  public name: string = '';
  public email: string = '';
  public avatar: string | null = null;
  loadingLogout = false;

  menuOptions: MenuOptions[] = [
    {
      icon: 'assets/icons/navbar/perfil.svg',
      label: 'Perfil',
      route: '/admin/perfil',
    },
    {
      icon: 'assets/icons/navbar/settings.svg',
      label: 'Configuración',
      route: '/admin/configuracion',
    },
    {
      icon: 'assets/icons/navbar/sign_out.svg',
      label: 'Cerrar Sesión',
      route: '/login',  //   route: '/login',
    },

  ];

  constructor(
    private authService: AuthService,
    private perfilService: PerfilService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.authService.currentUser$
      .subscribe((usuario) => {
        if (!usuario) {
          this.name = '';
          this.email = '';
          this.avatar = null;
          return;
        }

        this.name = [
          usuario.persona?.nombres,
          usuario.persona?.apellidos,
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        this.email = usuario.correo;

        this.avatar =
          usuario.persona?.foto_perfil || null;
      });
  }

  logout(): void {
    if (this.loadingLogout) {
      return;
    }

    this.loadingLogout = true;

    this.authService.logout()
      .pipe(
        finalize(() => {
          this.loadingLogout = false;
        }),
      )
      .subscribe({
        next: () => {
          iziToast.success({
            title: 'Sesión cerrada',
            message:
              'La sesión se cerró correctamente.',
            position: 'bottomRight',
          });

          this.router.navigate(['/login']);
        },

        error: () => {
          /*
           * AuthService utiliza finalize para eliminar
           * igualmente la sesión local.
           */
          iziToast.warning({
            title: 'Sesión finalizada',
            message:
              'La sesión local fue cerrada, pero no se pudo contactar al servidor.',
            position: 'bottomRight',
          });

          this.router.navigate(['/login']);
        },
      });
  }

  // logout() {
  //   this._authService.logout();

  //   iziToast.info({
  //     title: 'Sesión cerrada',
  //     message: 'Has cerrado sesión correctamente',
  //     position: 'bottomRight',
  //   });
  //   this._router.navigate(['/login']);   //  this._router.navigate(['/login']);
  // }


}
