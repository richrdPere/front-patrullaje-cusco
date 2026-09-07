// ==========================================================
// ROLES DISPONIBLES
// ==========================================================

import { ApiResponse } from "../alertas.interface";

export type UsuarioRol =
  | 'ADMIN'
  | 'OPERADOR'
  | 'SUPERVISOR_SERENAZGO'
  | 'GERENTE_SERENAZGO'
  | 'SERENO'
  | 'CONDUCTOR';

// ==========================================================
// REQUEST: CREAR USUARIO
// ==========================================================

export interface CrearUsuarioRequest {
  nombres: string;
  apellidos: string;
  correo: string;
  documento_identidad: string;
  telefono: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  roles: UsuarioRol[];
}

// ==========================================================
// RESPONSE: PERSONA CREADA
// ==========================================================

export interface CreateUsuarioPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
}

// ==========================================================
// DATA: USUARIO CREADO
// ==========================================================

export interface CreateUsuarioData {
  id: number;
  username: string;
  correo: string;
  estado: boolean;
  persona: CreateUsuarioPersona;
  roles: UsuarioRol[];
}

// ==========================================================
// RESPONSE: CREAR USUARIO
// ==========================================================

export type CrearUsuarioResponse = ApiResponse<CreateUsuarioData>;

