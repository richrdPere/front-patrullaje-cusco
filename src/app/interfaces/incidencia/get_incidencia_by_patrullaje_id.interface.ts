// src/app/interfaces/incidencias/incidencias-by-patrullaje.interface.ts

import { EstadoIncidencia, OrigenIncidencia, TipoArchivoIncidencia, TipoIncidencia } from "./incidencias.interface";

/*
|--------------------------------------------------------------------------
| Bloque paginado
|--------------------------------------------------------------------------
*/
export interface IncidenciasByPatrullajeData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: IncidenciaByPatrullaje[];
}

/*
|--------------------------------------------------------------------------
| Incidencia del patrullaje
|--------------------------------------------------------------------------
*/
export interface IncidenciaByPatrullaje {
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

  usuario: IncidenciaPatrullajeUsuario | null;
  zona: IncidenciaPatrullajeZona | null;
  archivos: IncidenciaPatrullajeArchivo[];
}

/*
|--------------------------------------------------------------------------
| Usuario relacionado
|--------------------------------------------------------------------------
*/
export interface IncidenciaPatrullajeUsuario {
  id: number;
  username: string;
  persona: IncidenciaPatrullajePersona | null;
}

/*
|--------------------------------------------------------------------------
| Persona relacionada
|--------------------------------------------------------------------------
*/
export interface IncidenciaPatrullajePersona {
  id: number;
  nombres: string;
  apellidos: string;
}

/*
|--------------------------------------------------------------------------
| Zona relacionada
|--------------------------------------------------------------------------
*/
export interface IncidenciaPatrullajeZona {
  id: number;
  nombre: string;
}

/*
|--------------------------------------------------------------------------
| Archivo relacionado
|--------------------------------------------------------------------------
*/
export interface IncidenciaPatrullajeArchivo {
  id: number;
  url_archivo: string;
  tipo_archivo: TipoArchivoIncidencia;
  mime_type: string;
  peso: number;
  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| Filtros
|--------------------------------------------------------------------------
*/
export interface IncidenciasByPatrullajeFilters {
  page?: number;
  limit?: number;
  mode?: 'app' | 'web';

  estado?: EstadoIncidencia;
  tipo?: TipoIncidencia;
  origen?: OrigenIncidencia;

  incluirArchivos?: boolean;
}
