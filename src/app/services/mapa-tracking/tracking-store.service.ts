import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interfaces
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';

// Service
import { SocketService } from '../socket.service';
import { TrackingService } from './tracking.service';

@Injectable({
  providedIn: 'root'
})
export class TrackingStoreService {

  // ESTADO GLOBAL TRACKING
  private trackingMap = new Map<number, TrackingPayload>();

  // OBSERVABLE GLOBAL
  private trackingSubject =
    new BehaviorSubject<Map<number, TrackingPayload>>(
      new Map()
    );

  tracking$ = this.trackingSubject.asObservable();

  constructor(
    // private socketService: SocketService,
    private trackingService: TrackingService
  ) {
    this.initSocketListeners();
  }

  // SOCKET LISTENERS
  // SOLO UNA VEZ
  private initSocketListeners(): void {
    this.trackingService
      .listenTracking()
      .subscribe({
        next: (tracking) => {
          this.actualizarTracking(tracking);
        },

        error: (error) => {
          console.error(
            '❌ Error recibiendo tracking en tiempo real:',
            error
          );
        }
      });

    this.trackingService
      .listenTrackingErrors()
      .subscribe({
        next: (error) => {
          console.error(
            '❌ Error enviado por el backend:',
            error.message
          );
        },

        error: (error) => {
          console.error(
            '❌ Error escuchando tracking_error:',
            error
          );
        }
      });
  }

  /**
   * Agrega o actualiza la posición
   * de un sereno.
   */
  private actualizarTracking(
    tracking: TrackingPayload
  ): void {

    if (!this.esTrackingValido(tracking)) {
      console.warn(
        '⚠️ Payload de tracking inválido:',
        tracking
      );

      return;
    }

    const trackingActual =
      this.trackingMap.get(
        tracking.usuarioId
      );

    /*
     * Evita que una ubicación antigua,
     * por ejemplo sincronizada desde SQLite,
     * reemplace una ubicación más reciente.
     */
    if (
      trackingActual &&
      !this.esTrackingMasReciente(
        trackingActual,
        tracking
      )
    ) {
      console.warn(
        '⚠️ Ubicación antigua descartada:',
        {
          usuarioId: tracking.usuarioId,
          fechaActual: trackingActual.realtime.timestamp,
          fechaRecibida: tracking.realtime.timestamp
        }
      );

      return;
    }

    this.trackingMap.set(
      tracking.usuarioId,
      tracking
    );

    this.emitirEstado();

    console.log(
      '🟢 Tracking actualizado en store:',
      {
        usuarioId: tracking.usuarioId,
        sereno: tracking.sereno.nombreCompleto,
        patrullajeId: tracking.patrullaje.id,
        lat: tracking.gps.lat,
        lng: tracking.gps.lng,
        timestamp: tracking.realtime.timestamp
      }
    );
  }

  /**
   * Verifica que el payload posea
   * la estructura mínima requerida.
   */
  private esTrackingValido(
    tracking: TrackingPayload | null | undefined
  ): tracking is TrackingPayload {

    if (!tracking) {
      return false;
    }

    if (
      !Number.isInteger(tracking.usuarioId) ||
      tracking.usuarioId <= 0
    ) {
      return false;
    }

    if (
      !tracking.sereno ||
      !tracking.patrullaje ||
      !tracking.gps ||
      !tracking.realtime
    ) {
      return false;
    }

    if (
      !Number.isFinite(tracking.gps.lat) ||
      !Number.isFinite(tracking.gps.lng)
    ) {
      return false;
    }

    if (
      tracking.gps.lat < -90 ||
      tracking.gps.lat > 90
    ) {
      return false;
    }

    if (
      tracking.gps.lng < -180 ||
      tracking.gps.lng > 180
    ) {
      return false;
    }

    const timestamp =
      new Date(
        tracking.realtime.timestamp
      ).getTime();

    return Number.isFinite(timestamp);
  }

  /**
   * Determina si el nuevo tracking
   * es igual o más reciente que el actual.
   */
  private esTrackingMasReciente(
    trackingActual: TrackingPayload,
    trackingNuevo: TrackingPayload
  ): boolean {

    const fechaActual =
      new Date(
        trackingActual.realtime.timestamp
      ).getTime();

    const fechaNueva =
      new Date(
        trackingNuevo.realtime.timestamp
      ).getTime();

    if (
      !Number.isFinite(fechaActual) ||
      !Number.isFinite(fechaNueva)
    ) {
      return true;
    }

    return fechaNueva >= fechaActual;
  }

  /**
   * Permite cargar las ubicaciones iniciales
   * obtenidas mediante una petición HTTP.
   */
  cargarTrackingInicial(
    trackings: TrackingPayload[]
  ): void {

    this.trackingMap.clear();

    for (const tracking of trackings) {
      if (!this.esTrackingValido(tracking)) {
        continue;
      }

      const trackingActual =
        this.trackingMap.get(
          tracking.usuarioId
        );

      if (
        !trackingActual ||
        this.esTrackingMasReciente(
          trackingActual,
          tracking
        )
      ) {
        this.trackingMap.set(
          tracking.usuarioId,
          tracking
        );
      }
    }

    this.emitirEstado();
  }

  /**
   * Obtiene una copia del estado actual.
   */
  getTrackingActual():
    ReadonlyMap<number, TrackingPayload> {

    return new Map(
      this.trackingMap
    );
  }

  /**
   * Obtiene el tracking de un sereno.
   */
  getTrackingPorUsuario(
    usuarioId: number
  ): TrackingPayload | null {

    return this.trackingMap.get(
      usuarioId
    ) ?? null;
  }

  /**
   * Elimina el marcador de un sereno.
   */
  eliminarTracking(
    usuarioId: number
  ): void {

    const eliminado =
      this.trackingMap.delete(
        usuarioId
      );

    if (eliminado) {
      this.emitirEstado();
    }
  }

  /**
   * Marca un sereno como desconectado
   * sin eliminar su última ubicación.
   */
  marcarOffline(
    usuarioId: number
  ): void {

    const tracking =
      this.trackingMap.get(
        usuarioId
      );

    if (!tracking) {
      return;
    }

    const trackingActualizado:
      TrackingPayload = {
      ...tracking,

      realtime: {
        ...tracking.realtime,
        online: false
      }
    };

    this.trackingMap.set(
      usuarioId,
      trackingActualizado
    );

    this.emitirEstado();
  }

  // Limpia todo el estado.
  limpiar(): void {
    this.trackingMap.clear();
    this.emitirEstado();
  }

  // Publica una nueva copia del Map.
  private emitirEstado(): void {
    this.trackingSubject.next(
      new Map(
        this.trackingMap
      )
    );
  }
}
