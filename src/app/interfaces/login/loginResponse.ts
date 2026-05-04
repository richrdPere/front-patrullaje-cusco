import { Usuario } from "./usuarioResponse";

export interface LoginResponse {
  message: string;
  token: string;
  roles: string[];
  usuario: Usuario;
}

export interface PaginadoResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}
