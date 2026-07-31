import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [

  // =========================================================
  // Layout público
  // =========================================================
  {
    path: '',
    loadChildren: () => import('./layout/dashboard-auth/auth.routes'),
  },

  // =========================================================
  // Acceso denegado
  // =========================================================
  {
    path: 'acceso-denegado',
    loadComponent: () =>
      import(
        './pages/shared/components/access-denied/access-denied.component'
      ).then(m => m.AccessDeniedComponent),
  },


  // =========================================================
  // Layout administrativo
  // =========================================================
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: ["ADMIN", "SERENO", "SUPERVISOR_SERENAZGO", "GERENTE_SERENAZGO", "OPERADOR"] },
    loadChildren: () => import('./layout/dashboard-admin/admin.routes'),
  },


  // =========================================================
  // Página no encontrada
  // =========================================================
  {
    path: '**',
    loadComponent: () =>
      import('./pages/shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },


];
