export type TrackingTipo =
  | 'TRACKING'
  | 'EMERGENCIA'
  | 'MANUAL';

export type EstadoPatrullaje =
  | 'PROGRAMADO'
  | 'ASIGNADO'
  | 'ACEPTADO'
  | 'EN_CURSO'
  | 'FINALIZADO';

export interface TrackingPayload {

  // IDENTIFICADOR DEL PUNTO GPS
  id: number;

  // USUARIO
  usuarioId: number;
  username: string;
  correo: string | null;
  roles: string[];

  // SERENO
  sereno: {
    nombres: string;
    apellidos: string;
    nombreCompleto: string;
    documento: string | null;
    telefono: string | null;
    fotoPerfil: string | null;
  };

  // PATRULLAJE
  patrullaje: {
    id: number;
    estado: EstadoPatrullaje;
  };

  // GPS
  gps: {
    lat: number;
    lng: number;
    velocidad: number | null;
    precision: number | null;
  };

  // TIEMPO REAL
  realtime: {
    online: boolean;
    timestamp: string;
  };

  // TIPO DE UBICACIÓN
  tipo: TrackingTipo;
}
