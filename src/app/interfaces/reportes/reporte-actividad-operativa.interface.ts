// src/app/interfaces/reportes/reporte-actividad-operativa.interface.ts

// =========================================================
// TIPOS
// =========================================================

export type EstadoPatrullajeActividad =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

export type EstadoAsignacionActividad =
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'EN_SERVICIO'
  | 'FINALIZADO';

export type TipoPersonalActividad =
  | 'SERENO'
  | 'POLICIA';

export type EstadoUnidadActividad =
  | 'DISPONIBLE'
  | 'EN_PATRULLAJE'
  | 'MANTENIMIENTO'
  | 'FUERA_DE_SERVICIO';

export type RiesgoZonaActividad =
  | 'bajo'
  | 'medio'
  | 'alto'
  | 'critico';

// =========================================================
// RESPUESTA PRINCIPAL
// =========================================================

export interface ReporteActividadOperativaData {
  resumen: ReporteActividadOperativaResumen;

  por_sereno: ReporteActividadPorSereno[];
  por_unidad: ReporteActividadPorUnidad[];
  por_zona: ReporteActividadPorZona[];
  por_fecha: ReporteActividadPorFecha[];

  detalle: ReporteActividadDetallePaginado;

  filters: ReporteActividadAppliedFilters;
}

// =========================================================
// RESUMEN GENERAL
// =========================================================

export interface ReporteActividadOperativaResumen {
  total_patrullajes: number;

  programados: number;
  asignados: number;
  aceptados: number;
  en_curso: number;
  finalizados: number;

  duracion_total_segundos: number;
  distancia_total_metros: number;

  total_puntos_gps: number;

  incidencias_registradas: number;
  historiales_registrados: number;
  alertas_generadas: number;

  horas_operativas: number;
  distancia_total_km: number;
}

// =========================================================
// AGRUPACIÓN POR SERENO
// =========================================================

export interface ReporteActividadPorSereno {
  usuario_id: number;

  username: string | null;
  nombre: string;
  documento: string | null;

  patrullajes: number;
  incidencias: number;
  historiales: number;
  alertas: number;

  duracion_segundos: number;
  horas_operativas: number;

  distancia_metros: number;
  distancia_km: number;
}

// =========================================================
// AGRUPACIÓN POR UNIDAD
// =========================================================

export interface ReporteActividadPorUnidad {
  unidad_id: number | null;

  codigo: string;
  placa: string | null;
  tipo: string | null;

  patrullajes: number;
  finalizados: number;
  incidencias: number;

  duracion_segundos: number;
  horas_operativas: number;

  distancia_metros: number;
  distancia_km: number;
}

// =========================================================
// AGRUPACIÓN POR ZONA
// =========================================================

export interface ReporteActividadPorZona {
  zona_id: number;

  zona: string;
  riesgo: RiesgoZonaActividad | null;

  patrullajes: number;
  incidencias: number;
  historiales: number;
  alertas: number;

  horas_operativas: number;
  duracion_segundos: number;
}

// =========================================================
// AGRUPACIÓN POR FECHA
// =========================================================

export interface ReporteActividadPorFecha {
  /**
   * Formato esperado: YYYY-MM-DD
   */
  fecha: string;

  patrullajes: number;
  finalizados: number;

  incidencias: number;
  historiales: number;
  alertas: number;

  horas_operativas: number;
  duracion_segundos: number;
}

// =========================================================
// DETALLE PAGINADO
// =========================================================

export interface ReporteActividadDetallePaginado {
  data: ReporteActividadDetalle[];
  pagination: ReporteActividadPagination;
}

export interface ReporteActividadDetalle {
  id: number;

  unidad_id: number | null;
  zona_id: number;

  fecha: string;
  hora_inicio: string;
  hora_fin: string;

  estado: EstadoPatrullajeActividad;
  descripcion: string | null;

  zona: ReporteActividadZona | null;
  unidad: ReporteActividadUnidad | null;

  personal: ReporteActividadPersonal[];

  resumen: ReporteActividadResumenPatrullaje;
  actividad: ReporteActividadMetricas;

  createdAt: string;
  updatedAt: string;
}

// =========================================================
// ZONA
// =========================================================

export interface ReporteActividadZona {
  id: number;

  nombre: string;
  descripcion: string | null;

  riesgo: RiesgoZonaActividad;
  estado: boolean;
}

// =========================================================
// UNIDAD
// =========================================================

export interface ReporteActividadUnidad {
  id: number;

  codigo: string;
  tipo: string;
  placa: string | null;

  estado: EstadoUnidadActividad;
  descripcion: string | null;
}

// =========================================================
// PERSONAL
// =========================================================

export interface ReporteActividadPersonal {
  id: number;

  patrullaje_id: number;

  usuario_id: number | null;
  policia_id: number | null;

  tipo_personal: TipoPersonalActividad;
  estado: EstadoAsignacionActividad;

  fecha_asignacion: string;

  usuario: ReporteActividadUsuario | null;
}

// =========================================================
// USUARIO Y PERSONA
// =========================================================

export interface ReporteActividadUsuario {
  id: number;

  username: string | null;
  correo: string | null;
  estado: boolean;

  persona: ReporteActividadPersona | null;
}

export interface ReporteActividadPersona {
  id: number;

  nombres: string;
  apellidos: string;

  documento_identidad: string;
  telefono: string | null;
  foto_perfil: string | null;
}

// =========================================================
// RESUMEN POR PATRULLAJE
// =========================================================

export interface ReporteActividadResumenPatrullaje {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  duracion_segundos: number;
  distancia_total_metros: number;

  total_puntos_recorrido: number;
  total_incidencias: number;
  total_observaciones: number;

  observacion_final: string | null;
}

// =========================================================
// ACTIVIDAD DEL PATRULLAJE
// =========================================================

export interface ReporteActividadMetricas {
  incidencias: number;
  historiales: number;
  alertas: number;

  puntos_gps: number;

  velocidad_promedio: number | null;
  velocidad_maxima: number | null;

  primer_reporte_gps: string | null;
  ultimo_reporte_gps: string | null;
}

// =========================================================
// PAGINACIÓN
// =========================================================

export interface ReporteActividadPagination {
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

export interface ReporteActividadFilters {
  page?: number;
  limit?: number;

  fecha_inicio?: string;
  fecha_fin?: string;

  patrullaje_id?: number | null;
  zona_id?: number | null;
  unidad_id?: number | null;
  usuario_id?: number | null;

  estado_patrullaje?: EstadoPatrullajeActividad | '';
  estado_asignacion?: EstadoAsignacionActividad | '';

  solo_con_incidencias?: boolean | null;
  solo_finalizados?: boolean | null;

  search?: string;
}

// =========================================================
// FILTROS RETORNADOS POR EL BACKEND
// =========================================================

export interface ReporteActividadAppliedFilters {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  patrullaje_id: number | null;
  zona_id: number | null;
  unidad_id: number | null;
  usuario_id: number | null;

  estado_patrullaje: EstadoPatrullajeActividad | null;
  estado_asignacion: EstadoAsignacionActividad | null;

  solo_con_incidencias: boolean | null;
  solo_finalizados: boolean | null;

  search: string | null;
}
