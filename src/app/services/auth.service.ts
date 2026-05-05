import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { JwtHelperService } from "@auth0/angular-jwt";
import { SocketService } from './socket.service';

// Environment
import { environment } from '@environments/environment';

// Interface
import { LoginResponse } from '../interfaces/login/loginResponse';
import { Usuario } from '../interfaces/login/usuarioResponse';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 1. CONFIG
  private API_BASE = environment.main_url + 'auth';

  API_LOGIN: string = this.API_BASE + '/login';
  API_CONFIRMAR = this.API_BASE + '/confirmar';
  API_RECUPERAR = this.API_BASE + '/recuperar';
  API_RESET_PASSWORD = this.API_BASE + '/reset-password';

  private jwtHelper = new JwtHelperService();

  // 2. STATE
  private currentUserSubject = new BehaviorSubject<LoginResponse['usuario'] | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {
    this.restoreSession();
  }

  // RESTORE SESSION (IMPORTANTE)
  private restoreSession(): void {
    const savedUser = localStorage.getItem('usuario');
    const token = localStorage.getItem('token');

    if (savedUser && token && !this.jwtHelper.isTokenExpired(token)) {

      this.currentUserSubject.next(JSON.parse(savedUser));

      // CONECTAR SOCKET AUTOMÁTICAMENTE
      this.socketService.connect();

    } else {
      this.logout();
    }
  }

  // ===========================================================
  // 1.- LOGIN
  // ===========================================================
  login(username: string, password: string): Observable<LoginResponse> {

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this.http.post<LoginResponse>(
      this.API_LOGIN,
      { username, password },
      { headers }
    ).pipe(

      tap((res) => {

        const usuarioCompleto: Usuario = {
          ...res.usuario,
          roles: res.roles
        };

        // GUARDAR
        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));
        localStorage.setItem('roles', JSON.stringify(res.roles))

        // STATE
        this.currentUserSubject.next(usuarioCompleto);

        // CONECTAR SOCKET DESPUÉS DE LOGIN
        this.socketService.connect();
      })
    );
  }

  // ===========================================================
  // 2.- CONFIRMAR CUENTA
  // ===========================================================
  confirmarCuenta(token: string): Observable<any> {

    return this.http.get(`${this.API_CONFIRMAR}/${token}`);

  }

  // ===========================================================
  // 3.- SOLICITAR RECUPERACION DE CONTRASEÑA
  // ===========================================================
  recuperarCuenta(username: string): Observable<any> {

    return this.http.post(this.API_RECUPERAR, {
      username
    });

  }

  // ===========================================================
  // 4.- RESET PASSWORD
  // ===========================================================
  resetPassword(token: string, nuevaPassword: string): Observable<any> {

    return this.http.put(`${this.API_RESET_PASSWORD}/${token}`, {
      nuevaPassword
    });

  }

  // ===========================================================
  // 5.- UTILIDADES
  // ===========================================================

  // LOGOUT
  logout(): void {

    // DESCONECTAR SOCKET
    this.socketService.disconnect();

    // LIMPIAR STORAGE
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    localStorage.removeItem('roles');

    // LIMPIAR STATE
    this.currentUserSubject.next(null);
  }

  // OBTENER TOKEN
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // VERIFICAR LOGIN
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token ? !this.jwtHelper.isTokenExpired(token) : false;

  }

  // OBTENER USUARIO ACTUAL
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }
}
