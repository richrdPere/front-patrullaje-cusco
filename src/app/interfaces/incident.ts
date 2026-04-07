export interface Incident {
  id: string;
  descripcion: string;
  tipo: string;
  ubicacion: {
    lat: number | null;
    lon: number | null;
    direccion: string | null;
  };
  fecha: Date | string | null;
  estado: 'pendiente' | 'atendido' | 'cerrado' | 'falso' | string;
  prioridad: 'alta' | 'media' | 'baja' | string;
  serenoId: string;
  media: {
    imagenURL: string | null;
    videoURL: string | null;
    audioURL: string | null;
  };
  timestamp: any; // puedes tiparlo como `firebase.firestore.Timestamp` si usas Firestore en Angular
}
