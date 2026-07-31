// ============================================================
// TIPOS DE ALERTA
// ============================================================

export type AlertaPrioridad =
  | 'BAJA'
  | 'MEDIA'
  | 'ALTA'
  | 'CRITICA';

export type AlertaEstado =
  | 'PENDIENTE'
  | 'ENVIADA'
  | 'CANCELADA'
  | 'EXPIRADA';

export type AlertaDestinatarioEstado =
  | 'PENDIENTE'
  | 'RECIBIDA'
  | 'LEIDA'
  | 'ACEPTADA'
  | 'RECHAZADA'
  | 'ATENDIDA';


// ============================================================
// PERSONA Y USUARIO
// ============================================================
export interface PersonaAlerta {
  id: number;
  nombres: string;
  apellidos: string;

  documento_identidad?: string | null;
  telefono?: string | null;
  foto_perfil?: string | null;
}

export interface UsuarioAlerta {
  id: number;
  username: string;
  correo?: string | null;
  estado?: boolean;

  persona?: PersonaAlerta | null;
}


// ============================================================
// CREAR ALERTA
// ============================================================
export interface CrearAlertaRequest {
  titulo: string;
  descripcion: string;
  tipo: string;
  prioridad: AlertaPrioridad;

  patrullaje_id?: number | null;
  zona_id?: number | null;
  incidencia_id?: number | null;

  latitud?: number | string | null;
  longitud?: number | string | null;

  requiere_confirmacion: boolean;
  fecha_expiracion?: string | null;

  destinatarios: number[];
}


// ============================================================
// DESTINATARIO
// ============================================================
export interface AlertaDestinatario {
  id: number;
  alerta_id: number;
  usuario_id: number;

  estado: AlertaDestinatarioEstado;

  fecha_recibida?: string | null;
  fecha_leida?: string | null;
  fecha_respuesta?: string | null;
  fecha_atendida?: string | null;

  observacion?: string | null;

  createdAt?: string;
  updatedAt?: string;

  /**
   * El backend devuelve la asociación con alias:
   * "destinatario"
   */
  destinatario?: UsuarioAlerta | null;
}

// ============================================================
// ALERTA
// ============================================================
export interface Alerta {
  id: number;
  emisor_id: number;

  titulo: string;
  descripcion: string;
  tipo: string;

  prioridad: AlertaPrioridad;
  estado: AlertaEstado;

  patrullaje_id?: number | null;
  zona_id?: number | null;
  incidencia_id?: number | null;

  latitud?: string | number | null;
  longitud?: string | number | null;

  requiere_confirmacion: boolean;
  fecha_expiracion?: string | null;

  emisor?: UsuarioAlerta | null;

  destinatarios?: AlertaDestinatario[];

  zona?: unknown | null;
  patrullaje?: unknown | null;
  incidencia?: unknown | null;

  createdAt: string;
  updatedAt: string;
}

// ============================================================
// RESUMEN DE DESTINATARIOS
// ============================================================
export interface ResumenDestinatariosAlerta {
  total: number;
  pendientes: number;
  recibidas: number;
  leidas: number;
  aceptadas: number;
  rechazadas: number;
  atendidas: number;
  no_leidas: number;
  respondidas: number;
  pendientes_de_atencion: number;
}

// ============================================================
// PAGINACIÓN DE DESTINATARIOS
// ============================================================
export interface PaginationDestinatarios {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// ============================================================
// RESPUESTA DETALLE DE DESTINATARIOS
// ============================================================
export interface AlertaDestinatariosDetalle {
  alerta: Alerta;
  resumen: ResumenDestinatariosAlerta;
  destinatarios: AlertaDestinatario[];
  pagination: PaginationDestinatarios;
}

// ============================================================
// RESPUESTA GENERAL API
// ============================================================
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}
