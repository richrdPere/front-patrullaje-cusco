import { ApiResponse } from "../alertas.interface";

// Estados del policía
export type EstadoPolicia =
  | 'ACTIVO'
  | 'INACTIVO';

// Request para crear policía
export interface CreartePoliciaRequest {
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
}

// Persona creada
export interface PersonaPoliciaCreada {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  direccion: string | null;
  departamento: string | null;
  provincia: string | null;
  distrito: string | null;
  createdAt: string;
  updatedAt: string;
}

// Policía creado
export interface PoliciaCreado {
  id: number;
  persona_id: number;
  grado: string;
  comisaria: string;
  codigo_institucional: string;

  /*
   * El backend todavía no devuelve estado en la respuesta
   * mostrada. Por eso se mantiene opcional.
   */
  estado?: EstadoPolicia;
}

// Data de creación
export interface CrearPoliciaData {
  policia: PoliciaCreado;
  persona: PersonaPoliciaCreada;
}

// Response para crear policía
export type CreatePoliciaResponse = ApiResponse<CrearPoliciaData>;
