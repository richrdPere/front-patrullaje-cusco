import { UsuarioRol } from "./create-usuario.model";

// ==========================================================
// REQUEST: ACTUALIZAR USUARIO
// ==========================================================
export interface updateUsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  documento_identidad: string;
  telefono: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  roles: UsuarioRol[];

  /*
   * Solo se enviará cuando el operador escriba
   * una nueva contraseña.
   */
  password?: string;
}

// ==========================================================
// RESPONSE: ACTUALIZAR USUARIO
// ==========================================================

export interface UpdateUsuarioResponse {
  success: boolean;
  message: string;
}
