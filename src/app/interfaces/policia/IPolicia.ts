import { Persona } from "../login/usuarioResponse";

export interface Policia {
  id: number;
  grado: string;
  comisaria: string;
  codigo_institucional?: string;
  persona: Persona;
}
