import { Routes } from '@angular/router';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [

  // --- Layout publico ----
  {
    path: '',
    loadChildren: () => import('./layout/dashboard-auth/auth.routes'),
  },

  // --- Layout Admin ----
  {
    path: 'admin',
    canActivate: [RoleGuard],
    data: { roles: ["ADMIN", "SERENO", "SUPERVISOR_SERENAZGO", "GERENTE_SERENAZGO", "OPERADOR"] },
    loadChildren: () => import('./layout/dashboard-admin/admin.routes'),
  },


  // --- Ruta Not Page ----
  {
    path: '**',
    loadComponent: () =>
      import('./pages/shared/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },


];
