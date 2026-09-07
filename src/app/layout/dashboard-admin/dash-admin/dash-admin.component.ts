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

// import { Component, OnInit } from '@angular/core';
// import { RouterOutlet } from '@angular/router';
// import { CapitalizePipe } from 'src/app/pipes/capitalize.pipe';

// // Component
// import { SidebarMenuComponent } from "../components/sidebar-menu/sidebar-menu.component";
// import { NavbarMenuComponent } from "../components/navbar-menu/navbar-menu.component";

// // Service
// import { AuthService } from 'src/app/services/auth/auth.service';

// // Interface
// import { Usuario } from 'src/app/interfaces/login/usuarioResponse';

// @Component({
//   selector: 'app-dash-admin',
//   imports: [RouterOutlet, SidebarMenuComponent, CapitalizePipe, NavbarMenuComponent],
//   templateUrl: './dash-admin.component.html',
//   styles: ``
// })
// export class DashAdminComponent implements OnInit {

//   rol: string = '';
//   nombre: string = '';

//   constructor(private _authService: AuthService) { }

//   ngOnInit(): void {

//     // 1. Obtener usuario desde localStorage
//     const usuarioStorage = localStorage.getItem('usuario');

//     if (usuarioStorage) {
//       const usuario: Usuario = JSON.parse(usuarioStorage);

//       this.rol = usuario.roles.join(', ') || '';
//       this.nombre = usuario.persona.nombres || '';
//     }

//     // 2. Escuchar cambios (login, refresh, etc.)
//     this._authService.currentUser$.subscribe(usuario => {

//       if (usuario) {
//         this.rol = usuario.roles?.join(', ') || '';
//         this.nombre = usuario.persona.nombres;
//       }

//       console.log("ROLES (observable):", this.rol);

//     });
//   }
// }
