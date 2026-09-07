// login-response.interface.ts

import { ApiResponse } from "../alertas.interface";
import { TipoDispositivo } from "./login-request";
import { Usuario } from "./usuarioResponse";


export type RolUsuario =
  | 'ADMIN'
  | 'SERENO'
  | 'SUPERVISOR_SERENAZGO'
  | 'GERENTE_SERENAZGO'
  | 'OPERADOR';

export interface LoginResponseData {
  accessToken: string;
  refreshToken: string;
  expiresIn: LoginExpiresIn;
  sesion: LoginSesion;
  roles: RolUsuario[];
  // usuario: LoginUsuario;
  usuario: Usuario;
}

export interface LoginExpiresIn {
  accessToken: string;
  refreshToken: string;
}

export interface LoginSesion {
  id: number;
  dispositivoId: string | null;
  tipoDispositivo: TipoDispositivo;
  fechaExpiracion: string;
}

export interface LoginUsuario {
  id: number;
  username: string;
  correo: string;
  estado: boolean;
  persona: LoginPersona;
}

export interface LoginPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  foto_perfil: string | null;
  foto_perfil_key: string | null;
}

export type LoginResponse = ApiResponse<LoginResponseData>;
