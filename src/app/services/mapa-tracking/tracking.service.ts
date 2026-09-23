import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Service
import { SocketService } from '../socket.service';


// Interface
import { CentralTrackingData, SerenoOfflinePayload, SerenoOnlinePayload, TrackingPayload } from 'src/app/interfaces/tracking.interface';

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
   * Escucha serenos desconectados.
   */
  listenSerenoOffline(): Observable<SerenoOfflinePayload> {
    return this.socketService.listen<SerenoOfflinePayload>(
      'tracking:sereno-offline'
    );
  }

  /**
    * Escucha serenos conectados.
    */
  listenSerenoOnline():
    Observable<SerenoOnlinePayload> {

    return this.socketService
      .listen<SerenoOnlinePayload>(
        'tracking:sereno-online',
      );
  }

  /**
   * Unir y centrar los trackings.
   */
  unirseCentralTracking(
    onSuccess?: (data: CentralTrackingData) => void
  ): void {
    this.socketService.emit(
      'tracking:unirse-central',
      {},
      (response: SocketResponse<CentralTrackingData>) => {
        if (!response?.success) {
          console.error(
            '❌ No se pudo ingresar a central_tracking:',
            response?.message ?? 'Respuesta inválida del backend.'
          );

          return;
        }

        const data = response.data;

        if (
          !data ||
          !Array.isArray(data.trackings) ||
          !Array.isArray(data.serenosActivos)
        ) {
          console.error(
            '❌ Respuesta de central_tracking incompleta:',
            data
          );

          return;
        }

        console.log('✅ Central tracking recuperada:', {
          activos: data.cantidadActivos,
          conectados: data.cantidadConectados,
          conUbicacion: data.cantidadConUbicacion,
        });

        onSuccess?.(data);
      }
    );
  }
  // unirseCentralTracking(): void {
  //   this.socketService.emit(
  //     'tracking:unirse-central',
  //     {},
  //     (response: SocketResponse) => {
  //       if (!response?.success) {
  //         console.error(
  //           '❌ No se pudo ingresar a central_tracking:',
  //           response
  //         );

  //         return;
  //       }

  //       console.log(
  //         '✅ Socket unido a central_tracking:',
  //         response.message
  //       );
  //     }
  //   );
  // }
}
