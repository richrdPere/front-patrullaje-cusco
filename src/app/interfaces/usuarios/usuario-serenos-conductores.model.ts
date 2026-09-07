import { UsuarioRol } from "./create-usuario.model";

// ==========================================================
// PERSONA
// ==========================================================
export interface SerenoConductorPersona {
  id: number;
  nombres: string;
  apellidos: string;
  documento_identidad: string;
  telefono: string | null;
  foto_perfil: string | null;
}

// ==========================================================
// CAPACIDADES OPERATIVAS
// ==========================================================

export interface SerenoConductorCapacidades {
  esSereno: boolean;
  esConductor: boolean;
}

// ==========================================================
// USUARIO DISPONIBLE PARA SELECCIÓN
// ==========================================================

export interface SerenoConductorData {
  id: number;
  username: string | null;
  estado: boolean;

  /*
   * label puede utilizarse directamente
   * en un select, autocomplete o dropdown.
   */
  label: string;
  nombreCompleto: string;

  persona: SerenoConductorPersona;
  roles: UsuarioRol[];
  capacidades: SerenoConductorCapacidades;
}

// ==========================================================
// RESPONSE
// ==========================================================

export interface SerenosConductoresResponse {
  success: boolean;
  total: number;
  data: SerenoConductorData[];
}
