import { inject } from '@angular/core';
import {
  CanActivateFn,
  Router,
  UrlTree
} from '@angular/router';

import { AuthService } from '../services/auth/auth.service';

export const RoleGuard: CanActivateFn = (
  route
): boolean | UrlTree => {

  const router = inject(Router);
  const authService = inject(AuthService);

  // 1. Verificar que exista una sesión válida
  if (!authService.isAuthenticated()) {
    authService.logout();

    return router.createUrlTree(['/login']);
  }

  // 2. Obtener el usuario restaurado por AuthService
  const usuario = authService.getCurrentUser();

  if (!usuario) {
    authService.logout();

    return router.createUrlTree(['/login']);
  }

  // 3. Obtener roles del usuario
  const rolesUsuario = (usuario.roles ?? [])
    .map(role => role.toUpperCase().trim());

  // 4. Obtener roles permitidos en la ruta
  const allowedRoles = (
    route.data?.['roles'] as string[] | undefined
  )?.map(role => role.toUpperCase().trim()) ?? [];

  // Si la ruta no define roles, no permitir el acceso
  if (allowedRoles.length === 0) {
    return router.createUrlTree(['/acceso-denegado']);
  }

  // 5. Verificar coincidencia
  const tieneAcceso = rolesUsuario.some(role =>
    allowedRoles.includes(role)
  );

  if (!tieneAcceso) {
    return router.createUrlTree(['/acceso-denegado']);
  }

  return true;
};

