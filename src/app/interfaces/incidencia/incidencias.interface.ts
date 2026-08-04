// src/app/interfaces/incidencias.interface.ts

export type TipoIncidencia =
  | 'ROBO'
  | 'ACCIDENTE'
  | 'INCENDIO'
  | 'VIOLENCIA'
  | 'SOSPECHOSO'
  | 'OTRO';

export type EstadoIncidencia =
  | 'REPORTADO'
  | 'EN_PROCESO'
  | 'ATENDIDO'
  | 'CERRADO'
  | 'ELIMINADO';

export type OrigenIncidencia =
  | 'APP_MOVIL'
  | 'CENTRAL'
  | 'SISTEMA';

export type TipoArchivoIncidencia =
  | 'IMAGEN'
  | 'VIDEO'
  | 'PDF'
  | 'OTRO';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: string;
}

export interface PersonaIncidencia {
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
}

export interface UsuarioIncidencia {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;
  persona: PersonaIncidencia | null;
}

export interface ZonaIncidencia {
  id: number;
  nombre: string;
}

export interface PatrullajeIncidencia {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: string;
}

export interface IncidenciaArchivo {
  id: number;
  url_archivo: string;
  tipo_archivo: TipoArchivoIncidencia;
  mime_type: string;
  peso: number | null;
}

export interface IncidenciaPaginada {
  id: number;

  usuario_id: number;
  patrullaje_id: number | null;
  zona_id: number;

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

  usuario: UsuarioIncidencia | null;
  zona: ZonaIncidencia | null;
  patrullaje: PatrullajeIncidencia | null;
  archivos: IncidenciaArchivo[];
}

export interface IncidenciasPaginadasData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: IncidenciaPaginada[];
}

export interface IncidenciasPaginadasFilters {
  page?: number;
  limit?: number;

  tipo?: TipoIncidencia | '';
  estado?: EstadoIncidencia | '';

  zona_id?: number | null;
  usuario_id?: number | null;
  patrullaje_id?: number | null;

  fecha_inicio?: string;
  fecha_fin?: string;

  origen?: OrigenIncidencia | '';

  mode?: 'web' | 'app';
}
