export interface Distrito {
  nombre: string;
  id: string;
}

export interface Provincia {
  nombre: string;
  provincia_id: string;
  distritos: Distrito[];
}

export interface Departamento {
  departamento: string;
  departamento_id: string;
  provincias: Provincia[];
}
