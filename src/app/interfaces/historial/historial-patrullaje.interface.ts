
export type TipoHistorialPatrullaje =
  | 'OBSERVACION'
  | 'NOVEDAD'
  | 'ALERTA'
  | 'RECOMENDACION'
  | 'PUNTO_CRITICO'
  | 'CAMBIO_TURNO';

export type PrioridadHistorialPatrullaje =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type EstadoHistorialPatrullaje =
  | 'ACTIVO'
  | 'ARCHIVADO';

export type EstadoPatrullajeProgramado =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

export interface HistorialPatrullaje {
  id: number;

  patrullaje_id: number;
  usuario_id: number | null;
  zona_id: number;
  incidencia_id: number | null;

  tipo: TipoHistorialPatrullaje;

  titulo: string;
  descripcion: string;

  prioridad: PrioridadHistorialPatrullaje;

  latitud: string | number | null;
  longitud: string | number | null;

  visible_para_siguiente_turno: boolean;

  fecha_hora: string;

  estado: EstadoHistorialPatrullaje;

  createdAt: string;
  updatedAt: string;

  usuario: HistorialUsuario | null;
  zona: HistorialZona | null;

  patrullaje_programado:
  HistorialPatrullajeProgramado | null;

  incidencia: HistorialIncidencia | null;
}

export interface HistorialUsuario {
  id: number;
  username: string;
  correo?: string | null;
  estado?: boolean;

  persona?: HistorialPersona | null;
}

export interface HistorialPersona {
  id: number;

  nombres: string;
  apellido_paterno: string;
  apellido_materno?: string | null;

  dni?: string | null;
  telefono?: string | null;
  foto_perfil?: string | null;
}

export interface HistorialZona {
  id: number;
  nombre: string;
  descripcion: string | null;
  estado: boolean;
}

export interface HistorialPatrullajeProgramado {
  id: number;

  zona_id: number;
  unidad_id: number | null;

  fecha: string;
  hora_inicio: string | null;
  hora_fin: string | null;

  estado: EstadoPatrullajeProgramado;

  unidad: HistorialUnidadPatrullaje | null;
}

export interface HistorialUnidadPatrullaje {
  id: number;
  codigo: string;
  placa: string | null;
  tipo: string;
  estado: string;
}

export interface HistorialIncidencia {
  id: number;

  tipo: string;
  descripcion: string;

  estado: string;

  latitud: string | number | null;
  longitud: string | number | null;

  fecha_hora: string;
}

export interface HistorialPagination {
  page: number;
  limit: number;

  totalItems: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface HistorialPatrullajeFilters {
  page?: number;
  limit?: number;

  fecha_inicio?: string;
  fecha_fin?: string;

  unidad_id?: number | null;
  zona_id?: number | null;
  usuario_id?: number | null;
  patrullaje_id?: number | null;
  incidencia_id?: number | null;

  tipo?: TipoHistorialPatrullaje | '';
  prioridad?: PrioridadHistorialPatrullaje | '';
  estado?: EstadoHistorialPatrullaje | '';

  visible_para_siguiente_turno?:
  boolean | null;

  search?: string;
}

export interface HistorialPatrullajeAppliedFilters {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  unidad_id: number | null;
  zona_id: number | null;
  usuario_id: number | null;
  patrullaje_id: number | null;
  incidencia_id: number | null;

  tipo: TipoHistorialPatrullaje | null;
  prioridad: PrioridadHistorialPatrullaje | null;
  estado: EstadoHistorialPatrullaje | null;

  visible_para_siguiente_turno:
  boolean | null;

  search: string | null;
}

export interface HistorialPatrullajePaginadoData {
  data: HistorialPatrullaje[];
  pagination: HistorialPagination;
  filters: HistorialPatrullajeAppliedFilters;
}
