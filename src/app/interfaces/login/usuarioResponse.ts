export interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
  username: string;
  correo: string;
  telefono: string;
  documento_identidad: string;
  direccion: string;
  departamento: string;
  provincia: string;
  distrito: string;
  estado: boolean;
  foto_perfil: string | null;
  online: boolean;
  createdAt: string; // puedes convertir a Date si quieres
  updatedAt: string;
  roles: string[];
}

export interface UsuarioResponse {
  data: Usuario[];
  total: number;
  page: number;
  limit: number;
}
