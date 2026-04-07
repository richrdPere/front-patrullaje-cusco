import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

// IziToast
import iziToast from 'izitoast';

// Servicio
import { AuthService } from 'src/app/services/auth.service';
import { PerfilService } from 'src/app/services/perfil.service';

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
  public avatar: string = '';


  constructor(
    private _authService: AuthService,
    private perfilService: PerfilService,
    private _router: Router
  ) {


  }
  ngOnInit(): void {
    this._authService.currentUser$.subscribe(usuario => {
      if (usuario) {
        this.name = usuario.nombre;
        this.email = usuario.correo;
        // this.avatar = `${this.perfilService.envs.url_image}${usuario.foto_perfil}?t=${Date.now()}`;
        //        ↑ evita cache del navegador
      }

      console.log('Perfil:', this.avatar);
    });
  }

  menuOptions: MenuOptions[] = [
    {
      icon: 'assets/icons/navbar/perfil.svg',
      label: 'Perfil',
      route: '/app/perfil',
    },
    {
      icon: 'assets/icons/navbar/settings.svg',
      label: 'Configuración',
      route: '/app/configuracion',
    },
    {
      icon: 'assets/icons/navbar/sign_out.svg',
      label: 'Cerrar Sesión',
      route: '/login',  //   route: '/login',
    },

  ];

  logout() {
    this._authService.logout();

    iziToast.info({
      title: 'Sesión cerrada',
      message: 'Has cerrado sesión correctamente',
      position: 'bottomRight',
    });
    this._router.navigate(['/login']);   //  this._router.navigate(['/login']);
  }


}
