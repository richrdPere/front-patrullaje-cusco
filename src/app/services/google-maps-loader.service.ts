import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  envs = environment;

  private apiKey: string = this.envs.googleMapsAPI;
  private mapsLoaded = false;
  private mapsLoading: Promise<void> | null = null;

  load(): Promise<void> {
    // Si ya está cargado, resuelve directamente
    if (this.mapsLoaded) {
      return Promise.resolve();
    }

     // Si ya se está cargando, devuelve la misma promesa
    if (this.mapsLoading) {
      return this.mapsLoading;
    }

    // Si el script ya existe en el DOM (por recarga o reutilización de componentes)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      this.mapsLoaded = true;
      return Promise.resolve();
    }

     //  Agregamos la librería 'drawing' al script
    const libraries = 'drawing'; // Puedes añadir más: 'places,geometry,etc'
    const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=${libraries}`;


    // Caso normal: insertar el script
    this.mapsLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      // script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
      script.src = scriptUrl;
      script.defer = true;
      script.async = true;

      script.onload = () => {
        this.mapsLoaded = true;
        resolve();
      };

      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });

    return this.mapsLoading;
  }

}
