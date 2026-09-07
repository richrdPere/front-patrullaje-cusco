import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, DestroyRef, Inject, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// Services
import { AuthService } from 'src/app/services/auth/auth.service';

// Interfaces
import { RolUsuario } from 'src/app/interfaces/login/loginResponse';

type NavSubItem = {
  name: string;
  path: string;
  roles?: RolUsuario[];
  new?: boolean;
  pro?: boolean;
};

type NavItem = {
  name: string;
  icon: string;
  roles: RolUsuario[];
  path?: string;
  new?: boolean;
  subItems?: NavSubItem[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

@Component({
  selector: 'side-menu-options',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
  ],
  templateUrl: './side-menu-options.component.html',
  styles: ``,
})
export class SideMenuOptionsComponent implements OnInit {

  private readonly destroyRef = inject(DestroyRef);
  rolesUsuario: RolUsuario[] = [];

  readonly navigationGroups: NavGroup[] = [
    {
      title: 'General',
      items: [
        {
          icon: 'assets/icons/sidebar/panel.svg',
          name: 'Panel de control',
          path: '/admin/panel-control',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
        },
        {
          icon: 'assets/icons/sidebar/map.svg',
          name: 'Mapa en tiempo real',
          path: '/admin/mapas',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
        },
        {
          icon: 'assets/icons/sidebar/alerta.svg',
          name: 'Alertas',
          path: '/admin/alertas',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
        },
      ],
    },
    {
      title: 'Operaciones',
      items: [
        {
          icon: 'assets/icons/sidebar/policy.svg',
          name: 'Patrullaje',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
          subItems: [
            {
              name: 'Operativos programados',
              path: '/admin/patrullaje-programado',
            },
            {
              name: 'Incidentes reportados',
              path: '/admin/incidentes-reportados',
            },
            {
              name: 'Historial de patrullajes',
              path: '/admin/historial-patrullaje',
            },
          ],
        },
        {
          icon: 'assets/icons/sidebar/dashboard.svg',
          name: 'Recursos operativos',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
          subItems: [
            {
              name: 'Serenos',
              path: '/admin/usuarios',
            },
            {
              name: 'Policías registrados',
              path: '/admin/policias',
            },
            {
              name: 'Unidades de patrullaje',
              path: '/admin/unidad-patrullaje',
            },
            {
              name: 'Zonas de control',
              path: '/admin/zonas',
            },
          ],
        },
      ],
    },
    {
      title: 'Análisis',
      items: [
        {
          icon: 'assets/icons/sidebar/statistics.svg',
          name: 'Estadísticas y reportes',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
          ],
          subItems: [
            {
              name: 'Reportes',
              path: '/admin/reportes',
            },
            {
              name: 'Etiquetas',
              path: '/admin/etiquetas',
            },
          ],
        },
        {
          icon: 'assets/icons/sidebar/calendary.svg',
          name: 'Calendario',
          path: '/admin/calendario',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
            'SUPERVISOR_SERENAZGO',
            'OPERADOR',
          ],
        },
      ],
    },
    {
      title: 'Administración',
      items: [
        {
          icon: 'assets/icons/sidebar/configure.svg',
          name: 'Catálogos',
          roles: [
            'ADMIN',
            'GERENTE_SERENAZGO',
          ],
          subItems: [
            {
              name: 'Incidencias',
              path: '/admin/conf_incidencia',
            },
            {
              name: 'Zonas',
              path: '/admin/conf_zonas',
            },
            {
              name: 'Unidades',
              path: '/admin/conf_unidades',
            },
          ],
        },
        {
          icon: 'assets/icons/sidebar/role.svg',
          name: 'Roles y permisos',
          path: '/admin/roles',
          roles: ['ADMIN'],
        },
      ],
    },
  ];

  constructor(
    private readonly router: Router,

    private readonly authService: AuthService,

    @Inject(DOCUMENT)
    private readonly document: Document,
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
        this.rolesUsuario = usuario?.roles ?? [];
      });
  }

  // =========================================================
  // MENÚ FILTRADO
  // =========================================================
  get filteredGroups(): NavGroup[] {
    return this.navigationGroups
      .map((group) => ({
        ...group,

        items: group.items
          .filter((item) =>
            this.hasRequiredRole(item.roles),
          )
          .map((item) => ({
            ...item,

            subItems: item.subItems?.filter(
              (subItem) =>
                !subItem.roles?.length ||
                this.hasRequiredRole(subItem.roles),
            ),
          }))
          .filter(
            (item) =>
              Boolean(item.path) ||
              Boolean(item.subItems?.length),
          ),
      }))
      .filter((group) => group.items.length > 0);
  }

  private hasRequiredRole(
    requiredRoles: RolUsuario[],
  ): boolean {
    return requiredRoles.some((role) =>
      this.rolesUsuario.includes(role),
    );
  }

  // =========================================================
  // ESTADOS ACTIVOS
  // =========================================================
  isActive(path?: string): boolean {
    if (!path) {
      return false;
    }

    const currentUrl =
      this.router.url.split('?')[0].split('#')[0];

    return (
      currentUrl === path ||
      currentUrl.startsWith(`${path}/`)
    );
  }

  isParentActive(nav: NavItem): boolean {
    return nav.subItems?.some((subItem) =>
      this.isActive(subItem.path),
    ) ?? false;
  }

  // =========================================================
  // CERRAR DRAWER MÓVIL
  // =========================================================

  closeMobileSidebar(): void {
    const drawer = this.document.getElementById(
      'admin-sidebar-drawer',
    ) as HTMLInputElement | null;

    if (drawer && window.innerWidth < 1024) {
      drawer.checked = false;
    }
  }
}

// import { CommonModule, DOCUMENT } from '@angular/common';
// import { Component, DestroyRef, ElementRef, QueryList, ViewChildren, ChangeDetectorRef, inject } from '@angular/core';
// import { NavigationEnd, Router, RouterLink, RouterLinkActive } from '@angular/router';
// import { combineLatest, Subscription } from 'rxjs';

// // Interface
// import { RolUsuario } from 'src/app/interfaces/login/loginResponse';

// type NavSubItem = {
//   name: string;
//   path: string;
//   roles?: RolUsuario[];
//   new?: boolean;
//   pro?: boolean;
// };

// type NavItem = {
//   name: string;
//   icon: string;
//   roles: RolUsuario[];
//   path?: string;
//   new?: boolean;
//   subItems?: NavSubItem[];
// };

// type NavGroup = {
//   title: string;
//   items: NavItem[];
// };

// @Component({
//   selector: 'side-menu-options',
//   imports: [RouterLink, RouterLinkActive, CommonModule],
//   templateUrl: './side-menu-options.component.html',
//   styles: ``
// })
// export class SideMenuOptionsComponent implements OnInit {

//   private readonly destroyRef =
//     inject(DestroyRef);

//   rolesUsuario: RolUsuario[] = [];

//   // Main nav items
//   navItems: NavItem[] = [
//     {
//       icon: "assets/icons/sidebar/map.svg",
//       name: "Mapa",
//       path: "/admin/mapas",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//     },
//     {
//       icon: "assets/icons/sidebar/sereno.svg",
//       name: "Serenos",
//       path: "/admin/usuarios",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//     },
//     {
//       icon: "assets/icons/sidebar/panel.svg",
//       name: "Panel de Control",
//       path: "/admin/panel-control",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//     },
//     {
//       icon: "assets/icons/sidebar/alerta.svg",
//       name: "Alertas",
//       path: "/admin/alertas",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO'],
//     },
//     {
//       icon: "assets/icons/sidebar/dashboard.svg",
//       name: "Vigilancia",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       subItems: [
//         { name: "Policias Asignados", path: "/admin/policias" },
//         { name: "Unidades de Patrullaje", path: "/admin/unidad-patrullaje" },
//         { name: "Zonas de Control", path: "/admin/zonas" },

//       ],
//     },
//     {
//       icon: "assets/icons/sidebar/policy.svg",
//       name: "Patrullaje",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       subItems: [
//         { name: "Operativos Programados", path: "/admin/patrullaje-programado" },
//         // { name: "Patrullajes Activos", path: "/admin/patrullaje-activos" },
//         { name: "Incidentes Reportados", path: "/admin/incidentes-reportados" },
//         { name: "Historial de Patrullajes", path: "/admin/historial-patrullaje" },

//       ]
//     },
//   ];

//   // Others nav items
//   othersItems: NavItem[] = [
//     {
//       icon: "assets/icons/sidebar/statistics.svg",
//       name: "Estados",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       subItems: [
//         { name: "Reportes", path: "/admin/reportes" },
//         // { name: "Alertas", path: "/admin/alertas" },
//         { name: "Etiquetas", path: "/admin/etiquetas" },
//       ],
//     },
//     {
//       icon: "assets/icons/sidebar/calendary.svg",
//       name: "Calendario",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       path: "/admin/calendario",
//     },
//   ];

//   // Others nav items
//   configureItems: NavItem[] = [
//     {
//       icon: "assets/icons/sidebar/configure.svg",
//       name: "Catalogos",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       subItems: [
//         { name: "Incidencias", path: "/admin/conf_incidencia" },
//         { name: "Zonas", path: "/admin/conf_zonas" },
//         { name: "Unidades", path: "/admin/conf_unidades" },
//       ],
//     },

//     {
//       icon: "assets/icons/sidebar/role.svg",
//       name: "Roles",
//       roles: ['ADMIN', 'GERENTE_SERENAZGO', 'SERENO'],
//       path: "/admin/roles",
//     },

//   ];

//   rolesUsuario = '';

//   private subscription: Subscription = new Subscription();

//   constructor(private router: Router) {
//     const user = JSON.parse(localStorage.getItem('usuario') || '{}');
//     this.rolesUsuario = user?.roles || [];
//   }

//   //Methods
//   isActive(path?: string) {
//     if (!path) return false;
//     return this.router.url === path;
//   }

//   isParentActive(nav: any) {
//     if (!nav.subItems) return false;

//     return nav.subItems.some(
//       (sub: any) => this.router.url === sub.path
//     );
//   }

//   get filteredMenu() {
//     return this.navItems.filter(item =>
//       item.roles.some(role => this.rolesUsuario.includes(role))
//     );
//   }

//   get othersMenu() {
//     return this.othersItems.filter(item =>
//       item.roles.some(role => this.rolesUsuario.includes(role))
//     );
//   }

//   logout() {
//     localStorage.removeItem('usuario');
//     this.router.navigate(['/login']);
//   }

// }
