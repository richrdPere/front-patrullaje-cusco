// src/app/interfaces/incidencias/incidencias-by-zona.interface.ts

import { EstadoIncidencia, OrigenIncidencia, TipoArchivoIncidencia, TipoIncidencia } from "./incidencias.interface";


/*
|--------------------------------------------------------------------------
| Respuesta paginada
|--------------------------------------------------------------------------
*/
export interface IncidenciasByZonaData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: IncidenciaByZona[];
}

/*
|--------------------------------------------------------------------------
| Incidencia de la zona
|--------------------------------------------------------------------------
*/
export interface IncidenciaByZona {
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

  usuario: IncidenciaZonaUsuario | null;
  zona: IncidenciaZonaResumen | null;
  archivos: IncidenciaZonaArchivo[];
}

/*
|--------------------------------------------------------------------------
| Usuario relacionado
|--------------------------------------------------------------------------
*/
export interface IncidenciaZonaUsuario {
  id: number;
  username: string;
  correo: string;
  estado: boolean;
  persona: IncidenciaZonaPersona | null;
}

/*
|--------------------------------------------------------------------------
| Persona relacionada
|--------------------------------------------------------------------------
*/
export interface IncidenciaZonaPersona {
  id: number;
  nombres: string;
  apellidos: string;
  telefono: string | null;
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
| Archivo relacionado
|--------------------------------------------------------------------------
*/
export interface IncidenciaZonaArchivo {
  id: number;
  url_archivo: string;
  tipo_archivo: TipoArchivoIncidencia;
  mime_type: string;
  peso: number;
  createdAt: string;
}

/*
|--------------------------------------------------------------------------
| Filtro
|--------------------------------------------------------------------------
*/
export interface IncidenciasByZonaFilters {
  page?: number;
  limit?: number;
  mode?: 'app' | 'web';

  estado?: EstadoIncidencia;
  tipo?: TipoIncidencia;
  origen?: OrigenIncidencia;

  usuarioId?: number;
  incluirArchivos?: boolean;
}
