import { Rol, Usuario } from "./usuarioResponse";

export interface LoginResponse {
  message: string;
  token: string;
  usuario: Usuario;
  roles: Rol[];
}

