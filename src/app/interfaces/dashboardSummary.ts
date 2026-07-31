export interface DashboardSummary {
  patrullajes: PatrullajeSummary;
  unidades: UnidadSummary;
  incidencias: IncidenciaSummary;
  alertas: AlertaSummary;
  ultima_actualizacion: string;
}

export interface PatrullajeSummary {
  programados: number;
  asignados: number;
  en_curso: number;
  finalizados_hoy: number;
}

export interface UnidadSummary {
  total: number;
  conectadas: number;
  inactivas: number;
  desconectadas: number;
}

export interface IncidenciaSummary {
  total_hoy: number;
  reportadas: number;
  en_proceso: number;
  atendidas: number;
  recientes: IncidenciaReciente[];
}

export interface IncidenciaReciente {
  id: number;
  tipo: string;
  estado: string;
  descripcion: string;
  fecha_hora: string;
  latitud?: number;
  longitud?: number;
  usuario?: {
    id: number;
    username: string;
  };
}

export interface AlertaSummary {
  pendientes: number;
  criticas: number;
  atendidas_hoy: number;
  recientes: AlertaReciente[];
}

export interface AlertaReciente {
  id: number;
  titulo: string;
  prioridad: string;
  estado: string;
  fecha_hora: string;
}
