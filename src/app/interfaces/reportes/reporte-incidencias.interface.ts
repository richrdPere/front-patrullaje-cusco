// src/app/interfaces/reportes/reporte-incidencias.interface.ts

// =========================================================
// TIPOS
// =========================================================

export type TipoIncidenciaReporte =
  | 'ROBO'
  | 'ACCIDENTE'
  | 'INCENDIO'
  | 'VIOLENCIA'
  | 'SOSPECHOSO'
  | 'OTRO';

export type EstadoIncidenciaReporte =
  | 'REPORTADO'
  | 'EN_PROCESO'
  | 'ATENDIDO'
  | 'CERRADO'
  | 'ELIMINADO';

export type OrigenIncidenciaReporte =
  | 'APP_MOVIL'
  | 'CENTRAL'
  | 'SISTEMA';

export type EstadoPatrullajeReporte =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

export type EstadoUnidadReporte =
  | 'DISPONIBLE'
  | 'EN_PATRULLAJE'
  | 'MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

// =========================================================
// RESPUESTA PRINCIPAL
// =========================================================

export interface ReporteIncidenciasData {
  resumen: ReporteIncidenciasResumen;

  por_tipo: ReporteIncidenciasPorTipo[];
  por_estado: ReporteIncidenciasPorEstado[];
  por_zona: ReporteIncidenciasPorZona[];
  por_fecha: ReporteIncidenciasPorFecha[];

  detalle: ReporteIncidenciasDetallePaginado;

  filters: ReporteIncidenciasAppliedFilters;
}

// =========================================================
// RESUMEN
// =========================================================

export interface ReporteIncidenciasResumen {
  total: number;

  reportadas: number;
  en_proceso: number;
  atendidas: number;
  cerradas: number;
  eliminadas: number;

  con_evidencias: number;
  sin_evidencias: number;

  /**
   * Suma de evidencias correspondiente a los registros
   * incluidos en la página actual.
   */
  evidencias_en_pagina: number;
}

// =========================================================
// AGRUPACIONES
// =========================================================

export interface ReporteIncidenciasPorTipo {
  tipo: TipoIncidenciaReporte;
  total: number;
}

export interface ReporteIncidenciasPorEstado {
  estado: EstadoIncidenciaReporte;
  total: number;
}

export interface ReporteIncidenciasPorZona {
  zona_id: number;
  zona: string;
  total: number;
}

export interface ReporteIncidenciasPorFecha {
  /**
   * Formato esperado: YYYY-MM-DD
   */
  fecha: string;
  total: number;
}

// =========================================================
// DETALLE PAGINADO
// =========================================================

export interface ReporteIncidenciasDetallePaginado {
  data: ReporteIncidenciaDetalle[];
  pagination: ReporteIncidenciasPagination;
}

export interface ReporteIncidenciaDetalle {
  id: number;

  usuario_id: number;
  patrullaje_id: number | null;
  zona_id: number;

  tipo: TipoIncidenciaReporte;
  descripcion: string;

  /**
   * Sequelize normalmente devuelve DECIMAL como string.
   */
  latitud: string | number;
  longitud: string | number;

  fecha_hora: string;

  estado: EstadoIncidenciaReporte;

  total_evidencias: number;

  origen: OrigenIncidenciaReporte;

  createdAt: string;
  updatedAt: string;

  usuario: ReporteIncidenciaUsuario | null;
  zona: ReporteIncidenciaZona | null;
  patrullaje: ReporteIncidenciaPatrullaje | null;
}

// =========================================================
// USUARIO Y PERSONA
// =========================================================

export interface ReporteIncidenciaUsuario {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  persona: ReporteIncidenciaPersona | null;
}

export interface ReporteIncidenciaPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  foto_perfil: string | null;
}

// =========================================================
// ZONA
// =========================================================

export interface ReporteIncidenciaZona {
  id: number;
  nombre: string;
  descripcion: string | null;

  riesgo:
  | 'bajo'
  | 'medio'
  | 'alto'
  | 'critico';

  estado: boolean;
}

// =========================================================
// PATRULLAJE Y UNIDAD
// =========================================================

export interface ReporteIncidenciaPatrullaje {
  id: number;

  unidad_id: number | null;
  zona_id: number;

  fecha: string;
  hora_inicio: string;
  hora_fin: string;

  estado: EstadoPatrullajeReporte;

  unidad: ReporteIncidenciaUnidad | null;
}

export interface ReporteIncidenciaUnidad {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadReporte;
}

// =========================================================
// PAGINACIÓN
// =========================================================

export interface ReporteIncidenciasPagination {
  page: number;
  limit: number;

  totalItems: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =========================================================
// FILTROS DE CONSULTA
// =========================================================

export interface ReporteIncidenciasFilters {
  page?: number;
  limit?: number;

  fecha_inicio?: string;
  fecha_fin?: string;

  usuario_id?: number | null;
  patrullaje_id?: number | null;
  zona_id?: number | null;
  unidad_id?: number | null;

  tipo?: TipoIncidenciaReporte | '';
  estado?: EstadoIncidenciaReporte | '';
  origen?: OrigenIncidenciaReporte | '';

  con_evidencias?: boolean | null;

  search?: string;
}

// =========================================================
// FILTROS RETORNADOS POR EL BACKEND
// =========================================================

export interface ReporteIncidenciasAppliedFilters {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  usuario_id: number | null;
  patrullaje_id: number | null;
  zona_id: number | null;
  unidad_id: number | null;

  tipo: TipoIncidenciaReporte | null;
  estado: EstadoIncidenciaReporte | null;
  origen: OrigenIncidenciaReporte | null;

  con_evidencias: boolean | null;

  search: string | null;
}
