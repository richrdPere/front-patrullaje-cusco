import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

// Service
import { SocketService } from '../socket.service';

// Interfaces
import { NuevaAlertaSocketPayload } from 'src/app/interfaces/alertas/alerta-socket.interface';

// Deben coincidir exactamente con los eventos del backend.
const EVENTO_NUEVA_ALERTA = 'alerta:nueva';
const EVENTO_ALERTA_ACTUALIZADA = 'alerta:actualizada';
const EVENTO_ALERTA_CANCELADA = 'alerta:cancelada';

@Injectable({
  providedIn: 'root',
})
export class AlertaSocketService {
  constructor(
    private readonly socketService: SocketService
  ) { }

  /**
   * Se emite cuando se registra una nueva alerta,
   * por ejemplo desde el botón de pánico móvil.
   */
  escucharNuevaAlerta(): Observable<NuevaAlertaSocketPayload> {
    return this.socketService.listen<NuevaAlertaSocketPayload>(
      EVENTO_NUEVA_ALERTA
    );
  }

  /**
   * Se emite cuando cambia una alerta:
   * PENDIENTE -> EN_ATENCION -> ATENDIDA.
   */
  escucharAlertaActualizada(): Observable<NuevaAlertaSocketPayload> {
    return this.socketService.listen<NuevaAlertaSocketPayload>(
      EVENTO_ALERTA_ACTUALIZADA
    );
  }

  /**
   * Se emite cuando una alerta queda cancelada.
   */
  escucharAlertaCancelada(): Observable<NuevaAlertaSocketPayload> {
    return this.socketService.listen<NuevaAlertaSocketPayload>(
      EVENTO_ALERTA_CANCELADA
    );
  }
}

// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';

// import { SocketService } from '../socket.service';
// import { NuevaAlertaSocketPayload } from 'src/app/interfaces/alertas/alerta-socket.interface';

// // Debe coincidir exactamente con el evento emitido
// // por emitirAlertaAOperadores() en el backend.
// const EVENTO_NUEVA_ALERTA = 'alerta:nueva';

// @Injectable({
//   providedIn: 'root',
// })
// export class AlertaSocketService {
//   constructor(
//     private readonly socketService: SocketService
//   ) { }

//   escucharNuevaAlerta(): Observable<NuevaAlertaSocketPayload> {
//     return this.socketService.listen<NuevaAlertaSocketPayload>(
//       EVENTO_NUEVA_ALERTA
//     );
//   }
// }
