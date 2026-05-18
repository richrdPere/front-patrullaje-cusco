
import { Persona } from "./login/usuarioResponse";

// ======================================================
// PERFIL DEL USUARIO AUTENTICADO
// ======================================================
export interface PerfilResponse {
  id: number;
  username: string;
  correo: string;
  estado: boolean;

  persona: Persona;

  roles: string[];
}

// ======================================================
// ACTUALIZAR PERFIL
// ======================================================
export interface UpdatePerfilRequest {
  nombres: string;
  apellidos: string;

  telefono?: string;
  direccion?: string;

  departamento?: string;
  provincia?: string;
  distrito?: string;

  correo?: string;
}

// ======================================================
// RESPUESTA UPDATE
// ======================================================
export interface UpdatePerfilResponse {
  message: string;
}

// ======================================================
// CAMBIAR PASSWORD
// ======================================================
export interface ChangePasswordRequest {
  password_actual: string;
  password_nueva: string;
}

// ======================================================
// RESPUESTA PASSWORD
// ======================================================
export interface ChangePasswordResponse {
  message: string;
}

// ======================================================
// RESPUESTA FOTO
// ======================================================
export interface ChangePhotoResponse {
  message: string;
  foto_perfil: string;
}
