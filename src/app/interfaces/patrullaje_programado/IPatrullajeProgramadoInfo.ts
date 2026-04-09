// =========================
// USUARIO (para policía)
// =========================
interface Usuario {
  id: number;
  nombre: string;
  apellidos: string;
}

// =========================
// SERENO
// =========================
interface Sereno {
  id: number;
  nombre: string;
  apellidos: string;
  roles: string[];
}

// =========================
// POLICIA
// =========================
interface Policia {
  id: number;
  grado: string;
  comisaria: string;
  usuario: Usuario;
}

// =========================
// UNIDAD
// =========================
interface Unidad {
  id: number;
  codigo: string;
  tipo: string;
  placa: string;
  estado: string;
}

// =========================
// ZONA
// =========================
interface Zona {
  id: number;
  nombre: string;
  descripcion: string;
  riesgo: 'bajo' | 'medio' | 'alto' | 'critico';
}

// =========================
// PATRULLAJE
// =========================
export interface IPatrullajeDetalle {
  id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  descripcion: string;
  estado: string;

  createdAt: string;
  updatedAt: string;

  unidad: Unidad;
  zona: Zona;

  serenos: Sereno[];
  policias: Policia[];
}
