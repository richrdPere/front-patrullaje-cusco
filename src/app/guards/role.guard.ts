import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const RoleGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const roles = JSON.parse(localStorage.getItem('roles') || '[]');



  // const usuario = JSON.parse(localStorage.getItem('usuario') || '{}');

  if (!roles || roles.length === 0) {
    router.navigate(['/login']);
    return false;
  }

  // Convertir ambos a MAYÚSCULAS para comparar sin errores
  const rolesUsuario = roles.map((r: string) => r.toUpperCase());

  const allowedRoles = (route.data?.['roles'] as string[]).map(r => r.toUpperCase());

  console.log("ROLES USUARIO:", rolesUsuario);
  console.log("ROLES PERMITIDOS:", allowedRoles);

  const tieneAcceso = rolesUsuario.some((rol: string) =>
    allowedRoles.includes(rol)
  );

  if (tieneAcceso) {
    return true;
  }

  router.navigate(['/trazabilidad/denegado']);
  return false;
};
