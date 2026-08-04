import {
  EstadoPatrullaje,
  TrackingTipo
} from '../tracking.interface';

export interface PatrullajeRecorrido {
  id: number;
  estado: EstadoPatrullaje;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface ResumenRecorridoPatrullaje {
  totalPuntos: number;
  distanciaMetros: number;
  distanciaKilometros: number;
  velocidadPromedioKmh: number;
  ultimaActualizacion: string | null;
}

export interface PuntoRecorridoPatrullaje {
  id: number;
  usuarioId: number;

  lat: number;
  lng: number;

  velocidad: number | null;
  precision: number | null;

  fechaHora: string;
  tipo: TrackingTipo;
}

export interface RecorridoPatrullajeData {
  patrullaje: PatrullajeRecorrido;
  resumen: ResumenRecorridoPatrullaje;
  puntos: PuntoRecorridoPatrullaje[];
}
