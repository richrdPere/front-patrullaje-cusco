// src/app/interfaces/reportes/reporte-zonas-criticas.interface.ts

// =========================================================
// TIPOS
// =========================================================

export type NivelCriticidad =
  | 'BAJO'
  | 'MEDIO'
  | 'ALTO'
  | 'CRITICO';

export type RiesgoZona =
  | 'bajo'
  | 'medio'
  | 'alto'
  | 'critico';

export type TipoIncidenciaZonaCritica =
  | 'ROBO'
  | 'ACCIDENTE'
  | 'INCENDIO'
  | 'VIOLENCIA'
  | 'SOSPECHOSO'
  | 'OTRO';

export type EstadoIncidenciaZonaCritica =
  | 'REPORTADO'
  | 'EN_PROCESO'
  | 'ATENDIDO'
  | 'CERRADO'
  | 'ELIMINADO';

export type TipoHistorialZonaCritica =
  | 'OBSERVACION'
  | 'NOVEDAD'
  | 'ALERTA'
  | 'RECOMENDACION'
  | 'PUNTO_CRITICO'
  | 'CAMBIO_TURNO';

export type TipoAlertaZonaCritica =
  | 'PANICO'
  | 'INCIDENCIA'
  | 'EMERGENCIA'
  | 'SOS'
  | 'INFORMATIVA'
  | 'PREVENTIVA'
  | 'CAMBIO_RUTA'
  | 'APOYO_REQUERIDO'
  | 'MENSAJE_CENTRAL';

export type EstadoAlertaZonaCritica =
  | 'PENDIENTE'
  | 'EN_ATENCION'
  | 'ATENDIDA'
  | 'CANCELADA'
  | 'EXPIRADA';

export type PrioridadZonaCritica =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type FuentePuntoGeografico =
  | 'INCIDENCIA'
  | 'HISTORIAL'
  | 'ALERTA';

// =========================================================
// RESPUESTA PRINCIPAL
// =========================================================

export interface ReporteZonasCriticasData {
  criterio: ReporteZonasCriticasCriterio;

  resumen: ReporteZonasCriticasResumen;

  ranking: ReporteZonaCriticaRanking[];

  por_fecha: ReporteZonasCriticasPorFecha[];

  filters: ReporteZonasCriticasAppliedFilters;
}

// =========================================================
// CRITERIO
// =========================================================

export interface ReporteZonasCriticasCriterio {
  descripcion: string;

  niveles: ReporteZonasCriticasNiveles;
}

export interface ReporteZonasCriticasNiveles {
  BAJO: ReporteNivelCriticidadRango;
  MEDIO: ReporteNivelCriticidadRango;
  ALTO: ReporteNivelCriticidadRango;
  CRITICO: ReporteNivelCriticidadRango;
}

export interface ReporteNivelCriticidadRango {
  min: number;
  max: number | null;
}

// =========================================================
// RESUMEN
// =========================================================

export interface ReporteZonasCriticasResumen {
  zonas_analizadas: number;

  zonas_bajas: number;
  zonas_medias: number;
  zonas_altas: number;
  zonas_criticas: number;

  total_eventos: number;
  total_incidencias: number;
  total_historiales: number;
  total_alertas: number;

  total_puntos_criticos: number;
  total_alertas_emergencia: number;

  puntaje_total: number;

  zona_mas_critica: ReporteZonaMasCritica | null;
}

export interface ReporteZonaMasCritica {
  zona_id: number;
  zona: string;

  nivel_criticidad: NivelCriticidad;

  puntaje: number;
  total_eventos: number;
}

// =========================================================
// RANKING
// =========================================================

export interface ReporteZonaCriticaRanking {
  posicion: number;

  zona_id: number;
  zona: string;
  descripcion: string | null;

  riesgo_configurado: RiesgoZona;
  estado_zona: boolean;

  coordenadas: ReporteZonaCoordenada[];

  total_eventos: number;
  total_incidencias: number;
  total_historiales: number;
  total_alertas: number;

  puntos_criticos: number;
  alertas_emergencia: number;

  incidencias_por_tipo:
  Partial<Record<TipoIncidenciaZonaCritica, number>>;

  incidencias_por_estado:
  Partial<Record<EstadoIncidenciaZonaCritica, number>>;

  historiales_por_tipo:
  Partial<Record<TipoHistorialZonaCritica, number>>;

  alertas_por_tipo:
  Partial<Record<TipoAlertaZonaCritica, number>>;

  alertas_por_prioridad:
  Partial<Record<PrioridadZonaCritica, number>>;

  tipo_incidencia_predominante:
  ReporteValorPredominante<TipoIncidenciaZonaCritica> | null;

  tipo_alerta_predominante:
  ReporteValorPredominante<TipoAlertaZonaCritica> | null;

  puntaje: ReporteZonaCriticaPuntaje;

  nivel_criticidad: NivelCriticidad;

  ultima_actividad: string | null;

  puntos_geograficos: ReportePuntoGeografico[];
}

export interface ReporteZonaCoordenada {
  lat: number;
  lng: number;
}

export interface ReporteValorPredominante<T extends string> {
  valor: T;
  total: number;
}

export interface ReporteZonaCriticaPuntaje {
  incidencias: number;
  historiales: number;
  alertas: number;
  total: number;
}

// =========================================================
// PUNTOS GEOGRÁFICOS
// =========================================================

export interface ReportePuntoGeografico {
  fuente: FuentePuntoGeografico;

  id: number;

  tipo:
  | TipoIncidenciaZonaCritica
  | TipoHistorialZonaCritica
  | TipoAlertaZonaCritica;

  estado:
  | EstadoIncidenciaZonaCritica
  | EstadoAlertaZonaCritica
  | 'ACTIVO'
  | 'ARCHIVADO';

  prioridad: PrioridadZonaCritica | null;

  titulo: string;
  descripcion: string;

  latitud: number;
  longitud: number;

  fecha_hora: string;

  puntaje: number;
}

// =========================================================
// AGRUPACIÓN POR FECHA
// =========================================================

export interface ReporteZonasCriticasPorFecha {
  /**
   * Formato esperado: YYYY-MM-DD
   */
  fecha: string;

  incidencias: number;
  historiales: number;
  alertas: number;

  total_eventos: number;
}

// =========================================================
// FILTROS PARA CONSULTA
// =========================================================

export interface ReporteZonasCriticasFilters {
  fecha_inicio?: string;
  fecha_fin?: string;

  zona_id?: number | null;
  unidad_id?: number | null;
  patrullaje_id?: number | null;
  usuario_id?: number | null;

  tipo_incidencia?: TipoIncidenciaZonaCritica | '';
  estado_incidencia?: EstadoIncidenciaZonaCritica | '';

  prioridad?: PrioridadZonaCritica | '';

  tipo_alerta?: TipoAlertaZonaCritica | '';
  estado_alerta?: EstadoAlertaZonaCritica | '';

  nivel_criticidad?: NivelCriticidad | '';

  incluir_sin_eventos?: boolean | null;
  incluir_puntos?: boolean | null;

  limite?: number;
}

// =========================================================
// FILTROS RETORNADOS POR EL BACKEND
// =========================================================

export interface ReporteZonasCriticasAppliedFilters {
  fecha_inicio: string | null;
  fecha_fin: string | null;

  zona_id: number | null;
  unidad_id: number | null;
  patrullaje_id: number | null;
  usuario_id: number | null;

  tipo_incidencia: TipoIncidenciaZonaCritica | null;
  estado_incidencia: EstadoIncidenciaZonaCritica | null;

  prioridad: PrioridadZonaCritica | null;

  tipo_alerta: TipoAlertaZonaCritica | null;
  estado_alerta: EstadoAlertaZonaCritica | null;

  nivel_criticidad: NivelCriticidad | null;

  incluir_sin_eventos: boolean;
  incluir_puntos: boolean;

  limite: number;
}
