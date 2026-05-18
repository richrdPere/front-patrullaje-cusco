import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

// Interfaces
import {
  PerfilResponse,
  UpdatePerfilRequest,
  UpdatePerfilResponse,
  ChangePasswordRequest,
  ChangePasswordResponse,
  ChangePhotoResponse
} from '../interfaces/profile';

// Environment
import { environment } from '@environments/environment';
// import { PerfilResponse } from '../interfaces/profile';

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  // 1.- Enviroment
  envs = environment;

  // 2.- variables publicas
  API_BASE: string = this.envs.main_url + "profile";

  API_GET_PROFILE: string = this.API_BASE + '/me';
  API_UPDATE_PROFILE: string = this.API_BASE + '/update';
  API_CHANGED_PASSWORD: string = this.API_BASE + '/password';
  API_CHANGED_PHOTO: string = this.API_BASE + '/photo';


  constructor(private http: HttpClient) { }

  // ======= HEADER CON TOKEN =======
  private getAuthHeaders(): { headers: HttpHeaders } {
    const token = localStorage.getItem('token'); // o sessionStorage según tu login
    let headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return { headers };
  }

  // =========================================================
  // 1. Crear perfil
  // =========================================================
  getProfile(): Observable<PerfilResponse> {
    return this.http.get<PerfilResponse>(this.API_GET_PROFILE, this.getAuthHeaders());
  }

  // =========================================================
  // 2. Actualizar perfil
  // =========================================================
  updateProfile(data: any): Observable<UpdatePerfilResponse> {
    return this.http.put<UpdatePerfilResponse>(this.API_UPDATE_PROFILE, data, this.getAuthHeaders());
  }

  // =========================================================
  // 3. Cambiar contraseña
  // =========================================================
  changePassword(data: ChangePasswordRequest): Observable<ChangePasswordResponse> {
    return this.http.put<ChangePasswordResponse>(this.API_CHANGED_PASSWORD, data, this.getAuthHeaders());
  }

  // =========================================================
  // 4. Subir foto de perfil
  // =========================================================
  changePhoto(foto: File): Observable<ChangePhotoResponse> {
    const formData = new FormData();
    formData.append('foto', foto);

    // IMPORTANTE:
    // NO enviar Content-Type manualmente
    // Angular lo genera automáticamente
    const token = localStorage.getItem('token');
    let headers = new HttpHeaders();
    if (token) {
      headers = headers.set(
        'Authorization',
        `Bearer ${token}`
      );
    }

    return this.http.put<ChangePhotoResponse>(this.API_CHANGED_PHOTO, formData, { headers });
  }
}
