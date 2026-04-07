import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';

// interface MenuOptions {
//   icon: string;
//   label: string;
//   route: string;
//   sublabel: string;
//   roles: string[];  //  NUEVO
// }

type NavItem = {
  name: string;
  icon: string;
  roles: string[];
  path?: string;
  new?: boolean;
  subItems?: { name: string; path: string; pro?: boolean; new?: boolean }[];
};

@Component({
  selector: 'side-menu-options',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './side-menu-options.component.html',
  styles: ``
})
export class SideMenuOptionsComponent {

  // Main nav items
  navItems: NavItem[] = [
    {
      icon: "assets/icons/sidebar/dashboard.svg",
      name: "Mapa",
      path: "/admin/mapas",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
    },
    {
      icon: "assets/icons/sidebar/user.svg",
      name: "Serenos",
      path: "/admin/usuarios",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
    },
    {
      icon: "assets/icons/sidebar/dashboard.svg",
      name: "Controles",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Patrullajes", path: "/admin/unidad-patrullaje" },
        { name: "Zonas de Control", path: "/admin/zonas" },

      ],
    },
    {
      icon: "assets/icons/sidebar/company.svg",
      name: "Racks",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
      path: "/admin/patrullaje-programado",
    },


  ];
  // Others nav items
  othersItems: NavItem[] = [
    {
      icon: "assets/icons/sidebar/empresa.svg",
      name: "Estados",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Reportes", path: "/admin/reportes" },
        { name: "Alertas", path: "/admin/alertas" },
        { name: "Etiquetas", path: "/admin/etiquetas" },
      ],
    },
    {
      icon: "assets/icons/sidebar/company.svg",
      name: "Calendario",
      roles: ['GERENTE_SERENAZGO', 'SERENO'],
      path: "/admin/calendario",
    },


  ];

  rolesUsuario = '';

  private subscription: Subscription = new Subscription();

  constructor(private router: Router) {
    const user = JSON.parse(localStorage.getItem('usuario') || '{}');
    this.rolesUsuario = user?.roles || [];
  }

  //Methods
  isActive(path?: string) {
    if (!path) return false;
    return this.router.url === path;
  }

  isParentActive(nav: any) {
    if (!nav.subItems) return false;

    return nav.subItems.some(
      (sub: any) => this.router.url === sub.path
    );
  }

  get filteredMenu() {
    return this.navItems.filter(item =>
      item.roles.some(role => this.rolesUsuario.includes(role))
    );
  }

  get othersMenu() {
    return this.othersItems.filter(item =>
      item.roles.some(role => this.rolesUsuario.includes(role))
    );
  }

  logout() {
    localStorage.removeItem('usuario');
    this.router.navigate(['/login']);
  }

}
