export type RiesgoZona =
  | 'bajo'
  | 'medio'
  | 'alto'
  | 'critico';

export interface CoordenadaZona {
  lat: number;
  lng: number;
}

export interface ZonaData {
  id: number;
  nombre: string;
  descripcion: string | null;
  coordenadas: CoordenadaZona[];
  riesgo: RiesgoZona;
  estado: boolean;
  createdAt: string;
  updatedAt: string;
}

// export interface ZonaApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }
