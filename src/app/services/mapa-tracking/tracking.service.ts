import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Interface
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';

// Service
import { SocketService } from '../socket.service';


@Injectable({
  providedIn: 'root'
})
export class TrackingService {

  constructor(private socketService: SocketService) { }

  listenTracking(): Observable<TrackingPayload> {
    return this.socketService.listen<TrackingPayload>('tracking');
  }

  listenAlertas(): Observable<any> {
    return this.socketService.listen('alerta_sereno');
  }
}
