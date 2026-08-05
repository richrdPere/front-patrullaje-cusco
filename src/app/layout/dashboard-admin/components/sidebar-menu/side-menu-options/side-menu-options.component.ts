import { CommonModule } from '@angular/common';
import { Component, ElementRef, QueryList, ViewChildren, ChangeDetectorRef } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { combineLatest, Subscription } from 'rxjs';

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
      icon: "assets/icons/sidebar/map.svg",
      name: "Mapa",
      path: "/admin/mapas",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
    },
    {
      icon: "assets/icons/sidebar/sereno.svg",
      name: "Serenos",
      path: "/admin/usuarios",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
    },
    {
      icon: "assets/icons/sidebar/panel.svg",
      name: "Panel de Control",
      path: "/admin/panel-control",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
    },
    {
      icon: "assets/icons/sidebar/alerta.svg",
      name: "Alertas",
      path: "/admin/alertas",
      roles: ['ADMIN', 'GERENTE_SERENAZGO'],
    },
    {
      icon: "assets/icons/sidebar/dashboard.svg",
      name: "Vigilancia",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Policias Asignados", path: "/admin/policias" },
        { name: "Unidades de Patrullaje", path: "/admin/unidad-patrullaje" },
        { name: "Zonas de Control", path: "/admin/zonas" },

      ],
    },
    {
      icon: "assets/icons/sidebar/policy.svg",
      name: "Patrullaje",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Operativos Programados", path: "/admin/patrullaje-programado" },
        // { name: "Patrullajes Activos", path: "/admin/patrullaje-activos" },
        { name: "Incidentes Reportados", path: "/admin/incidentes-reportados" },
        { name: "Historial de Patrullajes", path: "/admin/historial-patrullaje" },

      ]
    },


  ];

  // Others nav items
  othersItems: NavItem[] = [
    {
      icon: "assets/icons/sidebar/statistics.svg",
      name: "Estados",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Reportes", path: "/admin/reportes" },
        // { name: "Alertas", path: "/admin/alertas" },
        { name: "Etiquetas", path: "/admin/etiquetas" },
      ],
    },
    {
      icon: "assets/icons/sidebar/calendary.svg",
      name: "Calendario",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      path: "/admin/calendario",
    },
  ];

  // Others nav items
  configureItems: NavItem[] = [
    {
      icon: "assets/icons/sidebar/configure.svg",
      name: "Catalogos",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      subItems: [
        { name: "Incidencias", path: "/admin/conf_incidencia" },
        { name: "Zonas", path: "/admin/conf_zonas" },
        { name: "Unidades", path: "/admin/conf_unidades" },
      ],
    },

    {
      icon: "assets/icons/sidebar/role.svg",
      name: "Roles",
      roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
      path: "/admin/roles",
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
