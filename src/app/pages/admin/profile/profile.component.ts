import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
// Sweet Alert
import Swal from 'sweetalert2';

// Interfaces
import { PerfilResponse, UpdatePerfilRequest, ChangePasswordRequest } from 'src/app/interfaces/profile.js';

// Service
import { PerfilService } from 'src/app/services/profile.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'profile',
    standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './profile.component.html',
  styles: ``
})
export class ProfileComponent implements OnInit, OnDestroy {

  // DESTROY
  private destroy$ = new Subject<void>();

  // DATA
  usuario!: PerfilResponse;

  cargando: boolean = false;
  subiendoFoto: boolean = false;
  cambiandoPassword: boolean = false;

  previewFoto: string | ArrayBuffer | null = null;

  // FORMS
  profileForm!: FormGroup;
  passwordForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private perfilService: PerfilService
  ) { }

  ngOnInit(): void {
    this.initForms();
    this.obtenerPerfil();
  }


  // INIT FORMS
  initForms(): void {
    this.profileForm = this.fb.group({
      nombres: ['', [Validators.required]],
      apellidos: ['', [Validators.required]],
      telefono: [''],
      direccion: [''],
      departamento: [''],
      provincia: [''],
      distrito: [''],
      correo: ['', [Validators.email]]
    });

    // - FORM PASSWORD
    this.passwordForm = this.fb.group({
      password_actual: ['', [Validators.required, Validators.minLength(6)]],
      password_nueva: ['', [Validators.required, Validators.minLength(6)]],
      confirmar_password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // ======================================================
  // GET PROFILE
  // ======================================================
  obtenerPerfil(): void {
    this.cargando = true;

    this.perfilService
      .getProfile()
      .pipe(takeUntil(this.destroy$))
      .subscribe({

        next: (resp: PerfilResponse) => {
          this.usuario = resp;
          this.previewFoto =
            this.usuario.persona?.foto_perfil || null;
          this.profileForm.patchValue({
            nombres: resp.persona.nombres,
            apellidos: resp.persona.apellidos,
            telefono: resp.persona.telefono,
            direccion: resp.persona.direccion,
            departamento: resp.persona.departamento,
            provincia: resp.persona.provincia,
            distrito: resp.persona.distrito,
            correo: resp.correo
          });

          this.cargando = false;
        },

        error: (error) => {
          console.log(error);
          this.cargando = false;

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo cargar el perfil'
          });
        }
      });
  }

  // ======================================================
  // UPDATE PROFILE
  // ======================================================
  actualizarPerfil(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const payload: UpdatePerfilRequest = {
      ...this.profileForm.value
    };

    this.cargando = true;

    this.perfilService
      .updateProfile(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.cargando = false;

          Swal.fire({
            icon: 'success',
            title: 'Perfil actualizado',
            text: resp.message,
            timer: 2000,
            showConfirmButton: false
          });

          this.obtenerPerfil();

        },
        error: (error) => {
          console.log(error);
          this.cargando = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              error.error?.message ||
              'No se pudo actualizar el perfil'
          });
        }
      });

  }

  // ======================================================
  // CHANGE PASSWORD
  // ======================================================
  cambiarPassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }

    const {
      password_actual,
      password_nueva,
      confirmar_password
    } = this.passwordForm.value;

    // ==========================
    // VALIDAR PASSWORDS
    // ==========================
    if (password_nueva !== confirmar_password) {

      Swal.fire({
        icon: 'warning',
        title: 'Contraseñas distintas',
        text: 'La nueva contraseña no coincide'
      });

      return;
    }

    const payload: ChangePasswordRequest = {
      password_actual,
      password_nueva
    };

    this.cambiandoPassword = true;

    this.perfilService
      .changePassword(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {

          this.cambiandoPassword = false;

          Swal.fire({
            icon: 'success',
            title: 'Contraseña actualizada',
            text: resp.message,
            timer: 2000,
            showConfirmButton: false
          });

          this.passwordForm.reset();
        },
        error: (error) => {
          console.log(error);
          this.cambiandoPassword = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              error.error?.message ||
              'No se pudo actualizar la contraseña'
          });
        }
      });
  }

  // ======================================================
  // CHANGE PHOTO
  // ======================================================
  onChangePhoto(event: Event): void {
    const input = event.target as HTMLInputElement;

    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];

    // ==========================
    // VALIDAR TIPO
    // ==========================
    const tiposPermitidos = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp'
    ];

    if (!tiposPermitidos.includes(file.type)) {

      Swal.fire({
        icon: 'warning',
        title: 'Archivo inválido',
        text: 'Solo se permiten imágenes'
      });
      return;
    }

    // - PREVIEW
    const reader = new FileReader();

    reader.onload = () => {
      this.previewFoto = reader.result;
    };

    reader.readAsDataURL(file);

    // - SUBIR FOTO
    this.subiendoFoto = true;

    this.perfilService
      .changePhoto(file)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (resp) => {
          this.subiendoFoto = false;
          this.usuario.persona.foto_perfil =
            resp.foto_perfil;
          this.previewFoto =
            resp.foto_perfil;
          Swal.fire({
            icon: 'success',
            title: 'Foto actualizada',
            text: resp.message,
            timer: 2000,
            showConfirmButton: false
          });
        },

        error: (error) => {
          console.log(error);
          this.subiendoFoto = false;
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text:
              error.error?.message ||
              'No se pudo subir la imagen'
          });
        }
      });
  }

  // ======================================================
  // HELPERS
  // ======================================================
  campoInvalido(campo: string): boolean {
    const control = this.profileForm.get(campo);
    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }

  passwordCampoInvalido(campo: string): boolean {
    const control = this.passwordForm.get(campo);
    return !!(
      control &&
      control.invalid &&
      control.touched
    );
  }
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
