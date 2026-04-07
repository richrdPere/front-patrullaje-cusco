import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CapitalizePipe } from 'src/app/pipes/capitalize.pipe';

// Component
import { SidebarMenuComponent } from "../components/sidebar-menu/sidebar-menu.component";
import { NavbarMenuComponent } from "../components/navbar-menu/navbar-menu.component";

// Service
import { AuthService } from 'src/app/services/auth.service';

// Interface
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';




@Component({
  selector: 'app-dash-admin',
  imports: [RouterOutlet, SidebarMenuComponent, CapitalizePipe, NavbarMenuComponent],
  templateUrl: './dash-admin.component.html',
  styles: ``
})
export class DashAdminComponent implements OnInit {

  rol: string = '';
  nombre: string = '';

  constructor(private _authService: AuthService) { }

  ngOnInit(): void {

    // 1. Obtener usuario desde localStorage
    const usuarioStorage = localStorage.getItem('usuario');

    if (usuarioStorage) {
      const usuario: Usuario = JSON.parse(usuarioStorage);

      console.log("USUARIO (localStorage):", usuario);

      this.rol = usuario.roles.join(', ') || '';
      this.nombre = usuario.nombre;
    }

    // 2. Escuchar cambios (login, refresh, etc.)
    this._authService.currentUser$.subscribe(usuario => {

      if (usuario) {
        this.rol = usuario.roles?.join(', ') || '';
        this.nombre = usuario.nombre;
      }

      console.log("ROLES (observable):", this.rol);

    });
  }
}
