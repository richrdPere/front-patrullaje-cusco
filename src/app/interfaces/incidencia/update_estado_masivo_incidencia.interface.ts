// src/app/interfaces/incidencias/incidencia-estado-masivo.interface.ts

import { ApiResponse } from "../alertas.interface";
import { EstadoIncidencia } from "./get-incidencias-paginated.interface";

/*
|--------------------------------------------------------------------------
| Request
|--------------------------------------------------------------------------
*/
export interface UpdateEstadoMasivoRequest {
  ids: number[];
  estado: EstadoIncidencia;
}

/*
|--------------------------------------------------------------------------
| Respuesta general
|--------------------------------------------------------------------------
*/
export interface UpdateEstadoMasivoResponse {
  success: boolean;
  message: string;
  data: UpdateEstadoMasivoData;
}

/*
|--------------------------------------------------------------------------
| Data del endpoint
|--------------------------------------------------------------------------
*/
export interface UpdateEstadoMasivoData {
  estado: EstadoIncidencia;
  total_solicitadas: number;
  total_encontradas: number;
  total_actualizadas: number;
  incidencias: IncidenciaEstadoActualizado[];
  no_encontradas: number[];
}

/*
|--------------------------------------------------------------------------
| Incidencia resumida
|--------------------------------------------------------------------------
*/
export interface IncidenciaEstadoActualizado {
  id: number;
  estado: EstadoIncidencia;
}

// ============================================================
// RESPONSE
// ============================================================
export type UpdateIncidentesResponse = ApiResponse<UpdateEstadoMasivoData>;

