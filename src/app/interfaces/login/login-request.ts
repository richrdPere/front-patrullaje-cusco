// login-request.ts

export type TipoDispositivo = 'WEB' | 'ANDROID' | 'IOS';

export interface LoginRequest {
  username: string;
  password: string;
  dispositivoId: string;
  tipoDispositivo: TipoDispositivo;
  nombreDispositivo: string;
}
