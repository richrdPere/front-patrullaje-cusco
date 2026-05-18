import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';

// Environment
import { environment } from '@environments/environment';



@Injectable({
  providedIn: 'root'
})
export class SocketService {

  // 1. URL backend socket
  private API_BASE = environment.socket_url;

  // 2. Instancia única
  private socket: Socket | null = null;

  // =========================================================
  // CONECTAR SOCKET
  // =========================================================
  connect(): void {

    // YA CONECTADO
    if (this.socket?.connected) {
      console.log('⚠️ Socket ya conectado');
      return;
    }

    // YA INTENTANDO CONECTAR
    if (this.socket?.active) {
      console.log('⚠️ Socket reconectando...');
      return;
    }

    const token = localStorage.getItem('token');

    this.socket = io(this.API_BASE, {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      console.log('🟢 Socket conectado:', this.socket?.id);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔴 Socket desconectado:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.error('❌ Error conexión socket:', err.message);
    });

  }

  // =========================================================
  // DESCONECTAR SOCKET (IMPORTANTE)
  // =========================================================
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      console.log('🛑 Socket desconectado manualmente');
    }
  }

  // EMITIR EVENTO
  emit(event: string, payload?: any, callback?: Function): void {
    if (!this.socket) return;

    this.socket.emit(event, payload, callback);
  }

  // ESCUCHAR EVENTO
  on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) return;

    this.socket.on(event, callback);
  }

  // REMOVER EVENTO (MUY IMPORTANTE)
  off(event: string): void {
    if (!this.socket) return;

    this.socket.off(event);
  }

  // =========================================================
  // OBTENER INSTANCIA
  // =========================================================
  getSocket(): Socket | null {
    return this.socket;
  }

  // =========================================================
  // REINICIAR CONEXIÓN (LOGIN / REFRESH TOKEN)
  // =========================================================
  reconnect(): void {
    this.disconnect();
    this.connect();
  }


  // =========================================================
  // LISTEN HANDLERS
  // =========================================================
  listen<T = any>(event: string): Observable<T> {

    return new Observable((observer) => {

      // AUTO CONECTAR
      if (!this.socket) {
        this.connect();
      }

      if (!this.socket) {
        observer.error('Socket no inicializado');
        return;
      }

      const handler = (data: T) => {
        observer.next(data);
      };

      this.socket.on(event, handler);

      // CLEANUP
      return () => {
        this.socket?.off(event, handler);
      };

    });

  }
}
