import { Routes } from '@angular/router';
import { DashAuthComponent } from './dash-auth/dash-auth.component';


export const authRoutes: Routes = [

  // --- Layout publico ----
  {
    path: '',
    component: DashAuthComponent,
    children: [
      { path: '', redirectTo: '/login', pathMatch: 'full' },
      { path: 'login', loadComponent: () => import('../../pages/auth/login/login.component').then(m => m.LoginComponent) },
    ]
  }

];

export default authRoutes;
