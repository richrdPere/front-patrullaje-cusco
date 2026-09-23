import { Injectable } from '@angular/core';
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GoogleMapsLoaderService {
  private mapsLoading: Promise<void> | null = null;

  load(): Promise<void> {
    if (!this.mapsLoading) {
      this.mapsLoading = this.loadApi()
        .then(async () => {
          await Promise.all([
            google.maps.importLibrary('maps'),
            google.maps.importLibrary('marker'),
            google.maps.importLibrary('geometry')
          ]);
        })
        .catch(error => {
          // Permite volver a intentar después de un fallo.
          this.mapsLoading = null;
          throw error;
        });
    }

    return this.mapsLoading;
  }

  private apiDisponible(): boolean {
    return (
      typeof google !== 'undefined' &&
      typeof google.maps?.importLibrary === 'function'
    );
  }

  private loadApi(): Promise<void> {
    if (this.apiDisponible()) {
      return Promise.resolve();
    }

    const existingScript =
      document.querySelector<HTMLScriptElement>(
        'script[src*="maps.googleapis.com/maps/api/js"]'
      );

    if (existingScript) {
      return this.waitForExistingScript(existingScript);
    }

    return new Promise<void>((resolve, reject) => {
      const callbackName = '__patrullajeGoogleMapsReady';

      const callbacks = window as unknown as
        Record<string, unknown>;

      const script = document.createElement('script');

      const cleanup = () => {
        clearTimeout(timeout);
        script.onerror = null;

        // Evita errores si un callback tardío llega tras timeout.
        callbacks[callbackName] = () => { };
      };

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(
          new Error('Google Maps no respondió en 30 segundos.')
        );
      }, 30_000);

      callbacks[callbackName] = () => {
        cleanup();
        resolve();
      };

      script.onerror = () => {
        cleanup();
        script.remove();

        reject(
          new Error('No se pudo descargar Google Maps.')
        );
      };

      const params = new URLSearchParams({
        key: environment.googleMapsAPI,
        loading: 'async',
        callback: callbackName,
        v: 'weekly',
        language: 'es',
        region: 'PE'
      });

      script.src = `https://maps.googleapis.com/maps/api/js?${params}`;

      script.async = true;
      document.head.appendChild(script);
    });
  }

  private waitForExistingScript(
    script: HTMLScriptElement
  ): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const cleanup = () => {
        clearInterval(interval);
        clearTimeout(timeout);
        script.removeEventListener('error', onError);
      };

      const onError = () => {
        cleanup();
        reject(
          new Error('Falló la carga existente de Google Maps.')
        );
      };

      const interval = window.setInterval(() => {
        if (this.apiDisponible()) {
          cleanup();
          resolve();
        }
      }, 100);

      const timeout = window.setTimeout(() => {
        cleanup();
        reject(
          new Error('La API existente de Google Maps no está disponible.')
        );
      }, 30_000);

      script.addEventListener('error', onError);

      if (this.apiDisponible()) {
        cleanup();
        resolve();
      }
    });
  }
}
// import { Injectable } from '@angular/core';
// import { environment } from '@environments/environment';

// @Injectable({
//   providedIn: 'root'
// })
// export class GoogleMapsLoaderService {
//   envs = environment;

//   private apiKey: string = this.envs.googleMapsAPI;
//   private mapsLoaded = false;
//   private mapsLoading: Promise<void> | null = null;

//   load(): Promise<void> {
//     // Si ya está cargado, resuelve directamente
//     if (this.mapsLoaded) {
//       return Promise.resolve();
//     }

//      // Si ya se está cargando, devuelve la misma promesa
//     if (this.mapsLoading) {
//       return this.mapsLoading;
//     }

//     // Si el script ya existe en el DOM (por recarga o reutilización de componentes)
//     const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
//     if (existingScript) {
//       this.mapsLoaded = true;
//       return Promise.resolve();
//     }

//      //  Agregamos la librería 'drawing' al script
//     const libraries = 'drawing'; // Puedes añadir más: 'places,geometry,etc'
//     const scriptUrl = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}&libraries=${libraries}`;


//     // Caso normal: insertar el script
//     this.mapsLoading = new Promise((resolve, reject) => {
//       const script = document.createElement('script');
//       // script.src = `https://maps.googleapis.com/maps/api/js?key=${this.apiKey}`;
//       script.src = scriptUrl;
//       script.defer = true;
//       script.async = true;

//       script.onload = () => {
//         this.mapsLoaded = true;
//         resolve();
//       };

//       script.onerror = (err) => reject(err);
//       document.head.appendChild(script);
//     });

//     return this.mapsLoading;
//   }

// }
