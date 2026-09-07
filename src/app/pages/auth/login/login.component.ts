import {
  Component,
  OnInit,
} from '@angular/core';

import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';

import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

// Izitoast
import iziToast from 'izitoast';

// Service
import {
  AuthService,
} from 'src/app/services/auth/auth.service';

// Interfaces
import {
  LoginRequest,
} from 'src/app/interfaces/login/login-request';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    CommonModule,
  ],
  templateUrl: './login.component.html',
  styles: ``,
})
export class LoginComponent implements OnInit {

  formLogin!: FormGroup;

  loading = false;
  showPassword = false;
  errorMessage = '';

  private readonly DEVICE_ID_KEY =
    'patrullaje_web_device_id';

  constructor(
    private readonly fb: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.initLoginForm();

    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/admin']);
    }
  }

  // =========================================================
  // INICIALIZAR FORMULARIO
  // =========================================================

  private initLoginForm(): void {
    this.formLogin = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required]],
    });
  }

  // =========================================================
  // MOSTRAR/OCULTAR CONTRASEÑA
  // =========================================================

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // =========================================================
  // LOGIN
  // =========================================================
  login(): void {
    if (this.formLogin.invalid || this.loading) {
      this.formLogin.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const username = String(
      this.formLogin.get('username')?.value ?? '',
    ).trim();

    const password = String(
      this.formLogin.get('password')?.value ?? '',
    );

    const request: LoginRequest = {
      username,
      password,
      dispositivoId: this.getOrCreateDeviceId(),
      tipoDispositivo: 'WEB',
      nombreDispositivo: this.getDeviceName(),
    };

    this.authService.login(request)
      .pipe(
        /*
         * finalize se ejecuta tanto en éxito como en error.
         * complete no se ejecuta cuando ocurre un error.
         */
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          iziToast.success({
            title: 'Éxito',
            message:
              response.message ||
              'Inicio de sesión exitoso.',
            position: 'bottomRight',
          });

          this.redirectByRole(response.data.roles);
        },

        error: (error) => {
          this.errorMessage =
            error.error?.message ||
            error.error?.error ||
            'No se pudo iniciar sesión.';

          iziToast.error({
            title: 'Error',
            message: this.errorMessage,
            position: 'bottomRight',
          });
        },
      });
  }

  // =========================================================
  // IDENTIFICADOR DEL DISPOSITIVO
  // =========================================================
  private getOrCreateDeviceId(): string {
    const savedDeviceId =
      localStorage.getItem(this.DEVICE_ID_KEY);

    if (savedDeviceId) {
      return savedDeviceId;
    }

    const uuid =
      typeof crypto !== 'undefined' &&
        typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2, 15)}`;

    const deviceId = `web-${uuid}`;

    localStorage.setItem(
      this.DEVICE_ID_KEY,
      deviceId,
    );

    return deviceId;
  }

  // =========================================================
  // NOMBRE DEL DISPOSITIVO
  // =========================================================
  private getDeviceName(): string {
    const browser = this.detectBrowser();
    const operatingSystem =
      this.detectOperatingSystem();

    return `${browser} en ${operatingSystem}`;
  }

  private detectBrowser(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Edg/')) {
      return 'Microsoft Edge';
    }

    if (userAgent.includes('OPR/')) {
      return 'Opera';
    }

    if (
      userAgent.includes('Chrome/') &&
      !userAgent.includes('Edg/')
    ) {
      return 'Google Chrome';
    }

    if (userAgent.includes('Firefox/')) {
      return 'Mozilla Firefox';
    }

    if (
      userAgent.includes('Safari/') &&
      !userAgent.includes('Chrome/')
    ) {
      return 'Safari';
    }

    return 'Naveavegador web';
  }

  private detectOperatingSystem(): string {
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Windows')) {
      return 'Windows';
    }

    if (userAgent.includes('Android')) {
      return 'Android';
    }

    if (
      userAgent.includes('iPhone') ||
      userAgent.includes('iPad')
    ) {
      return 'iOS';
    }

    if (userAgent.includes('Mac OS')) {
      return 'macOS';
    }

    if (userAgent.includes('Linux')) {
      return 'Linux';
    }

    return 'dispositivo desconocido';
  }

  // =========================================================
  // REDIRECCIÓN SEGÚN ROL
  // =========================================================
  private redirectByRole(roles: string[]): void {
    if (roles.includes('ADMIN')) {
      this.router.navigate(['/admin']);
      return;
    }

    if (roles.includes('OPERADOR')) {
      this.router.navigate(['/operador']);
      return;
    }

    if (
      roles.includes('SUPERVISOR_SERENAZGO') ||
      roles.includes('GERENTE_SERENAZGO')
    ) {
      this.router.navigate(['/monitoreo']);
      return;
    }

    if (roles.includes('SERENO')) {
      this.router.navigate(['/patrullajes']);
      return;
    }

    this.router.navigate(['/']);
  }
}
