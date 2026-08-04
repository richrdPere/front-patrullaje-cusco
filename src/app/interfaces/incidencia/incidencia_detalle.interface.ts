// src/app/interfaces/incidencias/incidencia-detalle.interface.ts

export interface IncidenciaDetalleResponse {
  success: boolean;
  message: string;
  data: IncidenciaDetalle;
}

export interface IncidenciaDetalle {
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
  patrullaje: IncidenciaPatrullaje | null;
  archivos: IncidenciaArchivo[];
}

export interface IncidenciaUsuario {
  id: number;
  username: string;
  correo?: string;
  estado?: boolean;
  persona: IncidenciaPersona | null;
}

export interface IncidenciaPersona {
  id: number;
  nombres: string;
  apellidos: string;
  telefono?: string | null;
  foto_perfil?: string | null;
}

export interface IncidenciaZona {
  id: number;
  nombre: string;
}

export interface IncidenciaPatrullaje {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string | null;
  estado: EstadoPatrullaje;
}

export interface IncidenciaArchivo {
  id: number;
  url_archivo: string;
  tipo_archivo: TipoArchivoIncidencia;
  mime_type: string;
  peso: number;
  createdAt?: string;
  updatedAt?: string;
}

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
  | 'WEB'
  | 'CENTRAL'
  | string;

export type TipoArchivoIncidencia =
  | 'IMAGEN'
  | 'VIDEO'
  | 'PDF'
  | 'AUDIO';

export type EstadoPatrullaje =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';
