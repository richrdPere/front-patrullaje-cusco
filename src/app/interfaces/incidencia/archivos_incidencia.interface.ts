// src/app/interfaces/incidencias/archivos-incidencia.interface.ts

import { ApiResponse } from "../alertas.interface";
import { TipoArchivoIncidencia } from "./get-incidencias-paginated.interface";

export interface ArchivosIncidenciaData {
  incidencia_id: number;
  total: number;
  total_evidencias: number;
  items: IncidenciaArchivoDetalle[];
}

export interface IncidenciaArchivoDetalle {
  id: number;
  incidencia_id: number;
  url_archivo: string;
  tipo_archivo: TipoArchivoIncidencia;
  mime_type: string;
  peso: number;
  sereno_id: number | null;
  estado: EstadoArchivoIncidencia;
  createdAt: string;
  updatedAt: string;
}

export type EstadoArchivoIncidencia =
  | 'ACTIVO'
  | 'INACTIVO'
  | 'ELIMINADO';

// ============================================================
// RESPONSE
// ============================================================
export type GetArchivosIncidenciaResponse = ApiResponse<ArchivosIncidenciaData>;


