// ==========================================================
// ROLES DE USUARIO
// ==========================================================

import { ApiResponse } from "../alertas.interface";
import { UsuarioRol } from "./create-usuario.model";

// ==========================================================
// QUERY PARAMS: USUARIOS PAGINADOS
// ==========================================================
export interface UsuariosPaginatedQueryParams {
  page: number;
  limit: number;
  nombres?: string;
  dni?: string;
  rol?: UsuarioRol;
}

// ==========================================================
// PERSONA DEL USUARIO
// ==========================================================

export interface UsuarioPersonaData {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;

  telefono: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  foto_perfil: string | null;

  updatedAt: string;
}

// ==========================================================
// USUARIO
// ==========================================================

export interface UsuarioData {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  createdAt: string;
  updatedAt: string;

  persona: UsuarioPersonaData;
  roles: UsuarioRol[];
}

// ==========================================================
// DATA PAGINADA
// ==========================================================

export interface UsuariosPaginatedData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rows: UsuarioData[];
}

// ==========================================================
// RESPONSE
// ==========================================================
export type UsuariosPaginatedResponse = ApiResponse<UsuariosPaginatedData>;
