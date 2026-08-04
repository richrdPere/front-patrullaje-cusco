import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Service
import { SocketService } from '../socket.service';


// Interface
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';

export interface SocketResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  constructor(private socketService: SocketService) { }
  /**
     * Escucha las actualizaciones de ubicación
     * enviadas por el backend.
     */
  listenTracking(): Observable<TrackingPayload> {
    return this.socketService.listen<TrackingPayload>(
      'tracking_actualizado'
    );
  }

  /**
   * Escucha errores relacionados con tracking.
   */
  listenTrackingErrors(): Observable<{ message: string }> {
    return this.socketService.listen<{ message: string }>(
      'tracking_error'
    );
  }

  /**
   * Escucha alertas enviadas al sereno.
   */
  listenAlertas(): Observable<unknown> {
    return this.socketService.listen(
      'alerta_sereno'
    );
  }

  /**
     * Unir y centrar los trackings.
     */
  unirseCentralTracking(): void {
    this.socketService.emit(
      'tracking:unirse-central',
      {},
      (response: SocketResponse) => {
        if (!response?.success) {
          console.error(
            '❌ No se pudo ingresar a central_tracking:',
            response
          );

          return;
        }

        console.log(
          '✅ Socket unido a central_tracking:',
          response.message
        );
      }
    );
  }
}
