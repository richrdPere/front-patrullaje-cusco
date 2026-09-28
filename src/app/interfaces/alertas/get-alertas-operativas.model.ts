export type AlertaOperativaTipo =
  | 'PANICO'
  | 'SOS'
  | 'EMERGENCIA'
  | 'INCIDENCIA';

export type AlertaOperativaPrioridad =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type AlertaOperativaEstado =
  | 'PENDIENTE'
  | 'EN_ATENCION'
  | 'ATENDIDA'
  | 'CANCELADA'
  | 'EXPIRADA';

export type EstadoDestinatarioAlerta =
  | 'PENDIENTE'
  | 'RECIBIDA'
  | 'LEIDA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'ATENDIDA';

export interface GetAlertasOperativasParams {
  page?: number;
  limit?: number;

  estado?: AlertaOperativaEstado;
  tipo?: AlertaOperativaTipo;
  prioridad?: AlertaOperativaPrioridad;

  zona_id?: number;
  patrullaje_id?: number;

  fecha_inicio?: string;
  fecha_fin?: string;

  search?: string;
}

export interface AlertaOperativaPersona {
  id: number;
  nombres: string;
  apellidos: string;
}

export interface AlertaOperativaEmisor {
  id: number;
  username: string;
  correo: string;
  persona: AlertaOperativaPersona | null;
}

export interface AlertaOperativaZona {
  id: number;
  nombre: string;
  riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
}

export interface AlertaOperativaPatrullaje {
  id: number;
  estado: string;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
}

export interface AlertaOperativaIncidencia {
  id: number;
  tipo: string;
  descripcion: string;
  estado: string;
  fecha_hora: string;
}

export interface AlertaOperativaDestinatario {
  id: number;
  usuario_id: number;
  estado: EstadoDestinatarioAlerta;

  fecha_recibida: string | null;
  fecha_leida: string | null;
  fecha_respuesta: string | null;
  fecha_atendida: string | null;
}

export interface ResumenDestinatariosAlerta {
  total: number;
  pendientes: number;
  recibidas: number;
  leidas: number;
  aceptadas: number;
  rechazadas: number;
  atendidas: number;
}

export interface AlertaOperativaItem {
  id: number;
  emisor_id: number;

  patrullaje_id: number | null;
  zona_id: number | null;
  incidencia_id: number | null;

  titulo: string;
  tipo: AlertaOperativaTipo;
  prioridad: AlertaOperativaPrioridad;
  descripcion: string;

  // Sequelize devuelve DECIMAL como string.
  latitud: string | null;
  longitud: string | null;

  requiere_confirmacion: boolean;
  fecha_expiracion: string | null;
  estado: AlertaOperativaEstado;

  createdAt: string;
  updatedAt: string;

  emisor: AlertaOperativaEmisor | null;
  zona: AlertaOperativaZona | null;
  patrullaje: AlertaOperativaPatrullaje | null;
  incidencia: AlertaOperativaIncidencia | null;

  destinatarios: AlertaOperativaDestinatario[];
  resumen_destinatarios: ResumenDestinatariosAlerta;
}

export interface GetAlertasOperativasData {
  items: AlertaOperativaItem[];

  page: number;
  limit: number;
  total: number;
  totalPages: number;

  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface GetAlertasOperativasResponse {
  success: boolean;
  message: string;
  data: GetAlertasOperativasData;
}
