export interface Zona {
  id: string;
  nombre: string;
}

export interface Ruta {
  id: string;
  nombre: string;
  zonaId: string;
}

export interface Sereno {
  id: string;
  nombre: string;
  estado: 'disponible' | 'asignado';
}

export type Turno = 'mañana' | 'tarde' | 'noche';

