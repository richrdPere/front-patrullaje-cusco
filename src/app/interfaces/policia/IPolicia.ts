import { Usuario } from "../login/usuarioResponse";

export interface Policia {
  id: number;
  usuario_id: number;
  grado: string;
  comisaria: string;
  codigo_institucional: string;
  usuario: Usuario;
}
