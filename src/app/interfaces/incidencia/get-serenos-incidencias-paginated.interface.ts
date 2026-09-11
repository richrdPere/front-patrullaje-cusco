// src/app/interfaces/incidencia/
// get-serenos-incidencias-paginated.interface.ts

import { ApiResponse } from
  'src/app/interfaces/alertas.interface';

import { UsuarioRol } from
  'src/app/interfaces/usuarios/create-usuario.model';

// ==========================================================
// QUERY PARAMS
// ==========================================================

export interface SerenosIncidenciasPaginatedQueryParams {
  page?: number;
  limit?: number;
  nombres?: string;
  dni?: string;
}

// ==========================================================
// PERSONA
// ==========================================================

export interface SerenoIncidenciasPersonaData {
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
// SERENO
// ==========================================================

export interface SerenoIncidenciasItemData {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  /**
   * Cantidad de incidencias activas registradas
   * por el usuario.
   */
  total_incidencias: number;

  createdAt: string;
  updatedAt: string;

  persona: SerenoIncidenciasPersonaData;
  roles: UsuarioRol[];
}

// ==========================================================
// PAGINACIÓN
// ==========================================================

export interface SerenosIncidenciasPaginatedData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  rows: SerenoIncidenciasItemData[];
}

// ==========================================================
// RESPONSE
// ==========================================================

export type SerenosIncidenciasPaginatedResponse = ApiResponse<SerenosIncidenciasPaginatedData>;
