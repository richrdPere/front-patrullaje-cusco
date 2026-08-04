// src/app/interfaces/incidencias/incidencias-by-usuario.interface.ts

import { EstadoIncidencia, OrigenIncidencia, TipoIncidencia } from "./incidencias.interface";

/*
|--------------------------------------------------------------------------
| Respuesta paginada del endpoint
|--------------------------------------------------------------------------
*/
export interface IncidenciasByUsuarioData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  usuario_id: number;
  data: IncidenciaByUsuario[];
}

/*
|--------------------------------------------------------------------------
| Incidencia del usuario
|--------------------------------------------------------------------------
*/
export interface IncidenciaByUsuario {
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

  usuario: IncidenciaUsuarioResumen | null;
  zona: IncidenciaZonaResumen | null;
}

/*
|--------------------------------------------------------------------------
| Usuario relacionado
|--------------------------------------------------------------------------
*/
export interface IncidenciaUsuarioResumen {
  id: number;
  username: string;
  persona: IncidenciaPersonaResumen | null;
}

/*
|--------------------------------------------------------------------------
| Persona relacionada
|--------------------------------------------------------------------------
*/
export interface IncidenciaPersonaResumen {
  id: number;
  nombres: string;
  apellidos: string;
}

/*
|--------------------------------------------------------------------------
| Zona relacionada
|--------------------------------------------------------------------------
*/
export interface IncidenciaZonaResumen {
  id: number;
  nombre: string;
}

/*
|--------------------------------------------------------------------------
| Filtro para incidencias
|--------------------------------------------------------------------------
*/
export interface IncidenciasByUsuarioFilters {
  page?: number;
  limit?: number;
  mode?: 'app' | 'web';
  estado?: EstadoIncidencia;
  tipo?: TipoIncidencia;
  origen?: OrigenIncidencia;
  incluirArchivos?: boolean;
}
