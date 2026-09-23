import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import {
  BehaviorSubject,
  Observable,
  distinctUntilChanged
} from 'rxjs';

import { environment } from '@environments/environment';

type SocketHandler = (...args: any[]) => void;

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;

  private readonly connectedSubject =
    new BehaviorSubject<boolean>(false);

  readonly connected$ = this.connectedSubject
    .asObservable()
    .pipe(distinctUntilChanged());

  // Crear una sola instancia. No conecta todavía.
  private ensureSocket(): Socket {
    if (this.socket) {
      return this.socket;
    }

    const socket = io(environment.socket_url, {
      autoConnect: false,
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,

      // Lee el token vigente en cada autenticación.
      auth: callback => {
        callback({
          token: localStorage.getItem('accessToken')
        });
      }
    });

    this.socket = socket;

    socket.on('connect', () => {
      console.log('🟢 Socket conectado:', socket.id);
      this.connectedSubject.next(true);
    });

    socket.on('disconnect', reason => {
      console.log('🔴 Socket desconectado:', reason);
      this.connectedSubject.next(false);
    });

    socket.on('connect_error', error => {
      console.error(
        '❌ Error de conexión Socket.IO:',
        error.message
      );

      this.connectedSubject.next(false);
    });

    socket.io.on('reconnect_attempt', attempt => {
      console.log(
        `🟠 Intento de reconexión #${attempt}`
      );
    });

    return socket;
  }

  connect(): void {
    const token = localStorage.getItem('accessToken');

    if (!token?.trim()) {
      console.warn(
        '⚠️ No se conecta Socket.IO: falta el access token.'
      );
      return;
    }

    const socket = this.ensureSocket();

    if (socket.connected || socket.active) {
      return;
    }

    socket.connect();
  }

  disconnect(): void {
    // Conserva los listeners y la instancia.
    this.socket?.disconnect();
    this.connectedSubject.next(false);
  }

  reconnect(): void {
    // Después de guardar el token renovado, reutiliza
    // la instancia y realiza otra autenticación.
    this.disconnect();
    this.connect();
  }

  emit(
    event: string,
    payload?: any,
    callback?: SocketHandler
  ): void {
    if (!this.socket) {
      console.warn(
        `⚠️ No se emitió ${event}: socket no inicializado.`
      );
      return;
    }

    if (callback) {
      this.socket.emit(event, payload, callback);
    } else {
      this.socket.emit(event, payload);
    }
  }

  on(
    event: string,
    callback: SocketHandler
  ): void {
    this.ensureSocket().on(event, callback);
  }

  off(
    event: string,
    callback?: SocketHandler
  ): void {
    if (!this.socket) return;

    if (callback) {
      this.socket.off(event, callback);
    } else {
      this.socket.off(event);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  listen<T = unknown>(event: string): Observable<T> {
    return new Observable<T>(observer => {
      const socket = this.ensureSocket();

      const handler = (data: T) => {
        observer.next(data);
      };

      // Registrar antes de iniciar la conexión.
      socket.on(event, handler);

      // La conexión se inicia explícitamente desde
      // el login o el inicio del monitoreo.
      return () => {
        // Retira únicamente este listener.
        socket.off(event, handler);
      };
    });
  }
}
// import { Injectable } from '@angular/core';
// import { io, Socket } from 'socket.io-client';
// import { Observable } from 'rxjs';

// // Environment
// import { environment } from '@environments/environment';



// @Injectable({
//   providedIn: 'root'
// })
// export class SocketService {

//   // 1. URL backend socket
//   private API_BASE = environment.socket_url;

//   // 2. Instancia única
//   private socket: Socket | null = null;

//   // =========================================================
//   // CONECTAR SOCKET
//   // =========================================================
//   connect(): void {

//     // YA CONECTADO
//     if (this.socket?.connected) {
//       console.log('⚠️ Socket ya conectado');
//       return;
//     }

//     // YA INTENTANDO CONECTAR
//     if (this.socket?.active) {
//       console.log('⚠️ Socket reconectando...');
//       return;
//     }

//     const token = localStorage.getItem('token');

//     this.socket = io(this.API_BASE, {
//       auth: { token },
//       transports: ['websocket'],
//       reconnection: true,
//       reconnectionAttempts: 5,
//       reconnectionDelay: 2000
//     });

//     this.socket.on('connect', () => {
//       console.log('🟢 Socket conectado:', this.socket?.id);
//     });

//     this.socket.on('disconnect', (reason) => {
//       console.log('🔴 Socket desconectado:', reason);
//     });

//     this.socket.on('connect_error', (err) => {
//       console.error('❌ Error conexión socket:', err.message);
//     });

//   }

//   // =========================================================
//   // DESCONECTAR SOCKET (IMPORTANTE)
//   // =========================================================
//   disconnect(): void {
//     if (this.socket) {
//       this.socket.disconnect();
//       this.socket = null;
//       console.log('🛑 Socket desconectado manualmente');
//     }
//   }

//   // EMITIR EVENTO
//   emit(event: string, payload?: any, callback?: Function): void {
//     if (!this.socket) return;

//     this.socket.emit(event, payload, callback);
//   }

//   // ESCUCHAR EVENTO
//   on(event: string, callback: (...args: any[]) => void): void {
//     if (!this.socket) return;

//     this.socket.on(event, callback);
//   }

//   // REMOVER EVENTO (MUY IMPORTANTE)
//   off(event: string): void {
//     if (!this.socket) return;

//     this.socket.off(event);
//   }

//   // =========================================================
//   // OBTENER INSTANCIA
//   // =========================================================
//   getSocket(): Socket | null {
//     return this.socket;
//   }

//   // =========================================================
//   // REINICIAR CONEXIÓN (LOGIN / REFRESH TOKEN)
//   // =========================================================
//   reconnect(): void {
//     this.disconnect();
//     this.connect();
//   }


//   // =========================================================
//   // LISTEN HANDLERS
//   // =========================================================
//   listen<T = any>(event: string): Observable<T> {

//     return new Observable((observer) => {

//       // AUTO CONECTAR
//       if (!this.socket) {
//         this.connect();
//       }

//       if (!this.socket) {
//         observer.error('Socket no inicializado');
//         return;
//       }

//       const handler = (data: T) => {
//         observer.next(data);
//       };

//       this.socket.on(event, handler);

//       // CLEANUP
//       return () => {
//         this.socket?.off(event, handler);
//       };

//     });

//   }
// }
