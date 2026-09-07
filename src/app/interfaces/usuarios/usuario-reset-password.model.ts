import { ApiResponse } from "../alertas.interface";

// ==========================================================
// PERSONA
// ==========================================================
export interface ResetPasswordUsuarioPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
}

// ==========================================================
// DATA
// ==========================================================
export interface ResetPasswordUsuarioData {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  persona: ResetPasswordUsuarioPersona;

  nombreCompleto: string;
  passwordRestablecido: boolean;
  requiereCambioPassword: boolean;
  sesionesRevocadas: number;

  updatedAt: string;
}

// ==========================================================
// RESPONSE
// ==========================================================
export type ResetPasswordUsuarioResponse = ApiResponse<ResetPasswordUsuarioData>;
