// src/app/interfaces/reportes/reporte-recorridos.interface.ts

// =========================================================
// TIPOS
// =========================================================

export type EstadoPatrullajeReporte =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

export type TipoGpsReporte =
  | 'TRACKING'
  | 'EMERGENCIA'
  | 'MANUAL';

export type EstadoAsignacionReporte =
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'EN_SERVICIO'
  | 'FINALIZADO';

export type EstadoUnidadReporte =
  | 'DISPONIBLE'
  | 'EN_PATRULLAJE'
  | 'MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

export type RiesgoZonaReporte =
  | 'bajo'
  | 'medio'
  | 'alto'
  | 'critico';

// =========================================================
// RESPUESTA PRINCIPAL
// =========================================================

export interface ReporteRecorridosData {
  resumen: ReporteRecorridosResumen;

  por_unidad: ReporteRecorridosPorUnidad[];
  por_zona: ReporteRecorridosPorZona[];
  por_fecha: ReporteRecorridosPorFecha[];
  por_sereno: ReporteRecorridosPorSereno[];

  detalle: ReporteRecorridosDetallePaginado;

  filters: ReporteRecorridosAppliedFilters;
}

// =========================================================
// RESUMEN GENERAL
// =========================================================

export interface ReporteRecorridosResumen {
  total_recorridos: number;

  recorridos_finalizados: number;
  recorridos_en_curso: number;

  recorridos_con_gps: number;
  recorridos_sin_gps: number;

  total_puntos_gps: number;

  distancia_total_metros: number;
  distancia_total_km: number;

  duracion_total_segundos: number;
  horas_totales: number;

  velocidad_maxima: number | null;

  puntos_emergencia: number;
  puntos_manuales: number;
}

// =========================================================
// AGRUPACIÓN POR UNIDAD
// =========================================================

export interface ReporteRecorridosPorUnidad {
  unidad_id: number | null;

  codigo: string;
  placa: string | null;
  tipo: string | null;

  recorridos: number;
  puntos_gps: number;

  distancia_metros: number;
  distancia_km: number;

  duracion_segundos: number;
  horas_recorrido: number;
}

// =========================================================
// AGRUPACIÓN POR ZONA
// =========================================================

export interface ReporteRecorridosPorZona {
  zona_id: number | null;

  zona: string;
  riesgo: RiesgoZonaReporte | null;

  recorridos: number;
  puntos_gps: number;

  distancia_metros: number;
  distancia_km: number;

  duracion_segundos: number;
  horas_recorrido: number;
}

// =========================================================
// AGRUPACIÓN POR FECHA
// =========================================================

export interface ReporteRecorridosPorFecha {
  /**
   * Fecha en formato YYYY-MM-DD.
   */
  fecha: string;

  recorridos: number;
  puntos_gps: number;

  distancia_metros: number;
  distancia_km: number;

  duracion_segundos: number;
  horas_recorrido: number;
}

// =========================================================
// AGRUPACIÓN POR SERENO
// =========================================================

export interface ReporteRecorridosPorSereno {
  usuario_id: number;

  username: string | null;
  nombre: string;
  documento: string | null;

  recorridos: number;
  puntos_gps: number;

  distancia_metros: number;
  distancia_km: number;

  duracion_segundos: number;
  horas_recorrido: number;
}

// =========================================================
// DETALLE PAGINADO
// =========================================================

export interface ReporteRecorridosDetallePaginado {
  data: ReporteRecorridoDetalle[];
  pagination: ReporteRecorridosPagination;
}

export interface ReporteRecorridoDetalle {
  patrullaje_id: number;

  fecha: string;
  hora_inicio: string;
  hora_fin: string;

  estado: EstadoPatrullajeReporte;
  descripcion: string | null;

  zona: ReporteRecorridoZona | null;
  unidad: ReporteRecorridoUnidad | null;

  serenos: ReporteRecorridoSereno[];

  metricas: ReporteRecorridoMetricas;

  inicio: ReportePuntoGps | null;
  fin: ReportePuntoGps | null;

  resumen_oficial: ReporteRecorridoResumenOficial | null;

  recorrido: ReportePuntoGps[];

  createdAt: string;
  updatedAt: string;
}

// =========================================================
// ZONA
// =========================================================

export interface ReporteRecorridoZona {
  id: number;
  nombre: string;
  descripcion: string | null;
  riesgo: RiesgoZonaReporte;
  estado: boolean;
}

// =========================================================
// UNIDAD
// =========================================================

export interface ReporteRecorridoUnidad {
  id: number;
  codigo: string;
  tipo: string;
  placa: string | null;
  estado: EstadoUnidadReporte;
  descripcion: string | null;
}

// =========================================================
// SERENO ASIGNADO
// =========================================================

export interface ReporteRecorridoSereno {
  asignacion_id: number;
  usuario_id: number;

  username: string | null;
  nombre: string;
  documento: string | null;
  telefono: string | null;
  foto_perfil: string | null;

  estado_asignacion: EstadoAsignacionReporte;
  fecha_asignacion: string;
}

// =========================================================
// MÉTRICAS
// =========================================================

export interface ReporteRecorridoMetricas {
  puntos_gps: number;

  distancia_metros: number;
  distancia_km: number;

  duracion_segundos: number;
  duracion_horas: number;

  velocidad_promedio: number | null;
  velocidad_maxima: number | null;
  precision_promedio: number | null;

  primer_reporte: string | null;
  ultimo_reporte: string | null;

  puntos_tracking: number;
  puntos_emergencia: number;
  puntos_manuales: number;
}

// =========================================================
// PUNTO GPS
// =========================================================

export interface ReportePuntoGps {
  id: number;

  patrullaje_id: number;
  usuario_id: number;

  latitud: number;
  longitud: number;

  velocidad: number | null;
  precision: number | null;

  fecha_hora: string;

  tipo: TipoGpsReporte;
}

// =========================================================
// RESUMEN OFICIAL
// =========================================================

export interface ReporteRecorridoResumenOficial {
  id: number;

  fecha_inicio: string;
  fecha_fin: string;

  duracion_segundos: number;
  distancia_total_metros: number;

  total_puntos_recorrido: number;

  observacion_final: string | null;
}

// =========================================================
// PAGINACIÓN
// =========================================================

export interface ReporteRecorridosPagination {
  page: number;
  limit: number;

  totalItems: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// =========================================================
// FILTROS PARA CONSULTA
// =========================================================

export interface ReporteRecorridosFilters {
  page?: number;
  limit?: number;

  fecha_inicio?: string;
  fecha_fin?: string;

  patrullaje_id?: number | null;
  zona_id?: number | null;
  unidad_id?: number | null;
  usuario_id?: number | null;

  estado_patrullaje?: EstadoPatrullajeReporte | '';
  tipo_gps?: TipoGpsReporte | '';

  precision_maxima?: number | null;

  con_recorrido?: boolean | null;
}

// =========================================================
// FILTROS RETORNADOS POR BACKEND
// =========================================================

export interface ReporteRecorridosAppliedFilters {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  patrullaje_id: number | null;
  zona_id: number | null;
  unidad_id: number | null;
  usuario_id: number | null;

  estado_patrullaje: EstadoPatrullajeReporte | null;
  tipo_gps: TipoGpsReporte | null;

  precision_maxima: number | null;

  con_recorrido: boolean | null;
}
