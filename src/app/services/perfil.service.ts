import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';


// Environment
import { environment } from '@environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // 1.- Enviroment
  envs = environment;



  // 2.- variables publicas
  private baseUrl: string = this.envs.main_url + "perfil";

  constructor(private http: HttpClient) { }

  // Obtener token desde localStorage o donde lo guardes
  private getHeaders(json = true): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    let headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    if (json) headers = headers.set('Content-Type', 'application/json');
    return headers;
  }

  // Obtener perfil del usuario
  obtenerPerfil(): Observable<any> {
    return this.http.get(`${this.baseUrl}`, { headers: this.getHeaders() });
  }

  // Actualizar datos del perfil
  actualizarPerfil(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}`, data, { headers: this.getHeaders() });
  }

  // Cambiar contraseña
  cambiarPassword(data: { passwordActual: string, nuevaPassword: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/password`, data, { headers: this.getHeaders() });
  }

  // Subir foto de perfil
  subirFoto(foto: File): Observable<any> {
    const formData = new FormData();
    formData.append('foto', foto);

    // No poner Content-Type para FormData
    const headers = this.getHeaders(false);
    return this.http.post(`${this.baseUrl}/foto`, formData, { headers });
  }
}
