export interface TrackingPayload {

  // USUARIO
  userId: number;
  username: string;
  correo?: string;
  roles: string[];

  // SERENO
  sereno: {
    nombres: string;
    apellidos: string;
    documento?: string;
    telefono?: string;
    fotoPerfil?: string | null;
  };

  // PATRULLAJE
  patrullaje: {
    id: number;
    estado: string;
  };

  // GPS
  gps: {
    lat: number;
    lng: number;
    velocidad: number;
    precision: number;
  };

  // REALTIME
  realtime: {
    online: boolean;
    timestamp: string;
  };

  // EVENTO
  tipo: string;
}
