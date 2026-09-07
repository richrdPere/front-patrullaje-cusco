import { ApiResponse } from "../alertas.interface";
import { UsuarioRol } from "./create-usuario.model";


// ==========================================================
// PERSONA DEL USUARIO
// ==========================================================

export interface UsuarioDetallePersona {
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

  updatedAt: string;
}

// ==========================================================
// DATA: DETALLE DEL USUARIO
// ==========================================================

export interface UsuarioDetalleData {
  id: number;
  username: string | null;
  correo: string | null;
  estado: boolean;

  createdAt: string;
  updatedAt: string;

  persona: UsuarioDetallePersona;
  roles: UsuarioRol[];
}

// ==========================================================
// RESPONSE: DETALLE USUARIO
// ==========================================================

export type UsuarioDetailResponse = ApiResponse<UsuarioDetalleData>;
