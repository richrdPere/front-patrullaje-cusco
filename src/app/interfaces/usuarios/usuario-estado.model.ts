import { ApiResponse } from "../alertas.interface";

// ==========================================================
// REQUEST: CAMBIAR ESTADO
// ==========================================================
export interface CambiarEstadoUsuarioRequest {
  estado: boolean;
}

// ==========================================================
// PERSONA
// ==========================================================

export interface EstadoUsuarioPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  foto_perfil: string | null;
}

// ==========================================================
// DATA: RESULTADO DEL CAMBIO
// ==========================================================

export interface EstadoUsuarioData {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  persona: EstadoUsuarioPersona;

  estadoAnterior: boolean;
  estadoActual: boolean;
  estadoModificado: boolean;
  yaTeniaEstado: boolean;

  sesionesRevocadas: number;
  updatedAt: string;
}

// ==========================================================
// RESPONSE
// ==========================================================

export type EstadoUsuarioResponse = ApiResponse<EstadoUsuarioData>;
