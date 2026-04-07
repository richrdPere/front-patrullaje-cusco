import { Routes } from '@angular/router';
import { DashAdminComponent } from './dash-admin/dash-admin.component';
import { RoleGuard } from '../../guards/role.guard';

export const adminRoutes: Routes = [
  // --- Layout trazabilidad ----
  {
    path: '',
    component: DashAdminComponent,
    canActivate: [RoleGuard],
    data: { roles: ['SERENO', 'SUPERVISOR_SERENAZGO', 'GERENTE_SERENAZGO', 'OPERADOR'] },
    children: [

      // Mapa
      {
        path: 'mapas',
        loadComponent: () => import('../../pages/admin/mapa-patrullaje/mapa-patrullaje.component').then(m => m.MapaPatrullajeComponent),
        data: { roles: ['OPERADOR', 'GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Panel
      {
        path: 'panel-control',
        loadComponent: () => import('../../pages/admin/panel-patrullaje/panel-patrullaje.component').then(m => m.PanelPatrullajeComponent),
        data: { roles: ['OPERADOR', 'GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Rutas
      {
        path: 'ruta-patrullaje',
        loadComponent: () => import('../../pages/admin/rutas-patrullaje/rutas-patrullaje.component').then(m => m.RutasPatrullajeComponent),
        data: { roles: ['OPERADOR', 'GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Unidad - patrullaje
      {
        path: 'unidad-patrullaje',
        loadComponent: () => import('../../pages/admin/unidad-patrullaje/unidad-patrullaje.component').then(m => m.UnidadPatrullajeComponent),
        data: { roles: ['OPERADOR', 'GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Zonas
      {
        path: 'zonas',
        loadComponent: () => import('../../pages/admin/zonas/zonas.component').then(m => m.ZonasComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

       // Patrullaje programado
      {
        path: 'patrullaje-programado',
        loadComponent: () => import('../../pages/admin/patrullaje-programado/patrullaje-programado.component').then(m => m.PatrullajeProgramadoComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Perfil
      {
        path: 'perfil',
        loadComponent: () =>
          import('../../pages/admin/perfil/components/perfil/perfil.component')
            .then(m => m.PerfilComponent),
        data: { roles: ['SERENO', 'OPERADOR', 'GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Usuarios
      {
        path: 'usuarios',
        loadComponent: () =>
          import('../../pages/admin/usuarios/usuarios.component')
            .then(m => m.UsuariosComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Reportes
      {
        path: 'reportes',
        loadComponent: () => import('../../pages/admin/reportes/reportes.component').then(m => m.ReportesComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Almacen
      {
        path: 'almacen',
        loadComponent: () => import('../../pages/admin/almacen/almacen.component').then(m => m.AlmacenComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Chats
      {
        path: 'chats',
        loadComponent: () => import('../../pages/admin/chats/chats.component').then(m => m.ChatsComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Calendario
      {
        path: 'calendario',
        loadComponent: () => import('../../pages/admin/calendario/calendario.component').then(m => m.CalendarioComponent),
        data: { roles: ['GERENTE_SERENAZGO', 'SUPERVISOR_SERENAZGO'] }
      },

      // Redirect
      { path: '', redirectTo: 'mapas', pathMatch: 'full' }
    ]
  }
];

export default adminRoutes;
