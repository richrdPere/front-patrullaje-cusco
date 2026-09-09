// ============================================================
// ESTADO DE LA UNIDAD

import { ApiResponse } from "../alertas.interface";

// ============================================================
export type EstadoUnidadPatrullaje =
  | 'DISPONIBLE'
  | 'EN_PATRULLAJE'
  | 'MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

// ============================================================
// FILTROS
// ============================================================
export interface GetUnidadesPaginatedParams {
  page?: number;
  limit?: number;
  search?: string;
  codigo?: string;
  tipo?: string;
  placa?: string;
  estado?: EstadoUnidadPatrullaje;
  descripcion?: string;
}

// ============================================================
// ITEM
// ============================================================
export interface UnidadPatrullajeData {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadPatrullaje;
  descripcion: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// DATA PAGINADA
// ============================================================
export interface GetUnidadesPaginatedData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  items: UnidadPatrullajeData[];
}

// ============================================================
// ULTIMO CODIGO
// ============================================================
export interface UltimoCodigoData {
  codigo: string;
}

// ============================================================
// RESPONSE
// ============================================================
export type GetUnidadesPaginatedResponse = ApiResponse<GetUnidadesPaginatedData>;

export type UltimoCodigoResponse = ApiResponse<UltimoCodigoData>;




