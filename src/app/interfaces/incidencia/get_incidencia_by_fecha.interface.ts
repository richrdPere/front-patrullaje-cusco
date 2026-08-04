// src/app/interfaces/incidencias/incidencia-fecha.interface.ts

import { IncidenciaUsuario, IncidenciaZona } from "./incidencia_detalle.interface";
import { EstadoIncidencia, IncidenciaArchivo, OrigenIncidencia, TipoIncidencia } from "./incidencias.interface";

/*
|--------------------------------------------------------------------------
| Respuesta del endpoint
|--------------------------------------------------------------------------
*/
export interface IncidenciasByFechaResponse {
  success: boolean;
  message: string;
  data: IncidenciasByFechaData;
}

/*
|--------------------------------------------------------------------------
| Data paginada
|--------------------------------------------------------------------------
*/
export interface IncidenciasByFechaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;

  fecha_inicio: string;
  fecha_fin: string;

  data: IncidenciaByFecha[];
}

/*
|--------------------------------------------------------------------------
| Incidencia recuperada por rango de fechas
|--------------------------------------------------------------------------
*/
export interface IncidenciaByFecha {
  id: number;
  usuario_id: number;
  patrullaje_id: number | null;
  zona_id: number | null;

  tipo: TipoIncidencia;
  descripcion: string;

  latitud: string;
  longitud: string;

  fecha_hora: string;
  estado: EstadoIncidencia;

  total_evidencias: number;
  origen: OrigenIncidencia;

  createdAt: string;
  updatedAt: string;

  usuario: IncidenciaUsuario | null;
  zona: IncidenciaZona | null;
  archivos: IncidenciaArchivo[];
}

export interface IncidenciasByFechaFilters {
  fechaInicio: string;
  fechaFin?: string;

  page?: number;
  limit?: number;

  estado?: EstadoIncidencia;
  tipo?: TipoIncidencia;
  zonaId?: number;
  usuarioId?: number;
  origen?: OrigenIncidencia;

  incluirArchivos?: boolean;
  mode?: 'web' | 'app';
}
