export interface ZonaPatrullaje {
  id: string;
  nombre: string;
  descripcion: string;
  coordenadas: { lat: number; lng: number }[];
  riesgo: string;
}
