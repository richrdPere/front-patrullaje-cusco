export interface ZonaPatrullaje {
  id: number;
  nombre: string;
  descripcion: string;
  coordenadas: { lat: number; lng: number }[];
  riesgo: string;
}
