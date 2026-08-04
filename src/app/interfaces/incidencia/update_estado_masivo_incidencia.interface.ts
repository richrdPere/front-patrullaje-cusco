// src/app/interfaces/incidencias/incidencia-estado-masivo.interface.ts

import { EstadoIncidencia } from "./incidencias.interface";

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
