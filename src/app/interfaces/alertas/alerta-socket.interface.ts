export interface AlertaTiempoReal {
  id: number;
  emisor_id: number;
  patrullaje_id: number | null;
  zona_id: number | null;
  incidencia_id: number | null;

  titulo: string;
  tipo: string;
  prioridad: string;
  descripcion: string;

  // Algunos campos DECIMAL pueden llegar como texto.
  latitud: number | string | null;
  longitud: number | string | null;

  requiere_confirmacion: boolean;
  fecha_expiracion: string | null;
  estado: string;

  // Las fechas se reciben como texto a través del socket.
  createdAt: string;
  updatedAt: string;
}

export interface NuevaAlertaSocketPayload {
  success: boolean;
  message: string;
  data: AlertaTiempoReal;
  timestamp: string;
}


export interface AlertaMapaPayload {
  lat: number;
  lng: number;
  userId?: number;
  usuarioId?: number;
  titulo?: string;
  descripcion?: string;
}
