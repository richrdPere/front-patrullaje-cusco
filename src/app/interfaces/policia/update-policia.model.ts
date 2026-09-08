import { ApiResponse } from "../alertas.interface";

// Request para actualizar policía
export interface UpdatePoliciaRequest {
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

// Policía actualizado
export interface PoliciaActualizadoData {
  id: number;
  persona_id: number;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
}

// Persona actualizada
export interface PersonaPoliciaActualizadaData {
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
  createdAt: string;
  updatedAt: string;
}

// Data de actualización
export interface ActualizarPoliciaData {
  policia: PoliciaActualizadoData;
  persona: PersonaPoliciaActualizadaData;
}

// Response del endpoint
export type UpdatePoliciaResponse = ApiResponse<ActualizarPoliciaData>;
