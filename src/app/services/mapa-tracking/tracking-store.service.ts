import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Interfaces
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';

// Service
import { SocketService } from '../socket.service';

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
    private socketService: SocketService
  ) {
    this.initSocketListeners();
  }

  // SOCKET LISTENERS
  // SOLO UNA VEZ
  private initSocketListeners() {

    this.socketService
      .listen<TrackingPayload>('tracking')
      .subscribe({

        next: (tracking) => {

          this.trackingMap.set(
            tracking.userId,
            tracking
          );

          this.trackingSubject.next(
            new Map(this.trackingMap)
          );
        },

        error: (err) => {
          console.error(
            '❌ Error realtime tracking:',
            err
          );
        }

      });

  }

  // OBTENER TRACKING ACTUAL
  getTrackingActual() {
    return this.trackingMap;
  }

  // LIMPIAR
  limpiar() {
    this.trackingMap.clear();
    this.trackingSubject.next(
      new Map()
    );
  }
}
