import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { JwtHelperService } from "@auth0/angular-jwt";

// Environment
import { environment } from '@environments/environment';

// Interface
import { LoginResponse } from '../interfaces/login/loginResponse';
import { Usuario } from '../interfaces/login/usuarioResponse';


@Injectable({
  providedIn: 'root'
})
export class AuthService {

  // 1. Environment
  envs = environment;

  // 2. Variables globales
  private currentUserSubject = new BehaviorSubject<LoginResponse['usuario'] | null>(null);
  currentUser$ = this.currentUserSubject.asObservable();

  API_BASE = this.envs.main_url + 'auth';

  API_LOGIN: string = this.API_BASE + '/login';
  API_CONFIRMAR = this.API_BASE + '/confirmar';
  API_RECUPERAR = this.API_BASE + '/recuperar';
  API_RESET_PASSWORD = this.API_BASE + '/reset-password';

  private jwtHelper = new JwtHelperService();

  // 3. inicializar
  constructor(private _http: HttpClient) {
    // Restaurar sesión si ya existe en localStorage
    const savedUser = localStorage.getItem('usuario');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  // ===========================================================
  // 1.- LOGIN
  // ===========================================================
  login(username: string, password: string): Observable<LoginResponse> {

    const headers = new HttpHeaders().set('Content-Type', 'application/json');

    return this._http.post<LoginResponse>(
      this.API_LOGIN,
      { username, password },
      { headers }
    ).pipe(

      tap((res) => {

        const usuarioCompleto = {
          ...res.usuario,
          roles: res.roles
        };

        localStorage.setItem('token', res.token);
        localStorage.setItem('usuario', JSON.stringify(usuarioCompleto));
        localStorage.setItem('roles', JSON.stringify(res.roles))

        this.currentUserSubject.next(usuarioCompleto);
      })
    );
  }

  // ===========================================================
  // 2.- CONFIRMAR CUENTA
  // ===========================================================
  confirmarCuenta(token: string): Observable<any> {

    return this._http.get(`${this.API_CONFIRMAR}/${token}`);

  }

  // ===========================================================
  // 3.- SOLICITAR RECUPERACION DE CONTRASEÑA
  // ===========================================================
  recuperarCuenta(username: string): Observable<any> {

    return this._http.post(this.API_RECUPERAR, {
      username
    });

  }

  // ===========================================================
  // 4.- RESET PASSWORD
  // ===========================================================
  resetPassword(token: string, nuevaPassword: string): Observable<any> {

    return this._http.put(`${this.API_RESET_PASSWORD}/${token}`, {
      nuevaPassword
    });

  }

  // ===========================================================
  // 5.- LOGOUT
  // ===========================================================
  logout(): void {

    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.currentUserSubject.next(null);

  }

  // ===========================================================
  // 6.- OBTENER TOKEN
  // ===========================================================
  getToken(): string | null {

    return localStorage.getItem('token');

  }

  // ===========================================================
  // 7.- VERIFICAR LOGIN
  // ===========================================================
  isAuthenticated(): boolean {

    const token = this.getToken();

    if (!token) {
      return false;
    }

    return !this.jwtHelper.isTokenExpired(token);

  }

  // ===========================================================
  // 8.- OBTENER USUARIO ACTUAL
  // ===========================================================
  getCurrentUser(): Usuario | null {
    return this.currentUserSubject.value;
  }
}
