import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UsuarioService } from '../../../../services/usuarios.service';

// Interface
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';

@Component({
  selector: 'usuarios-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './usuario-form.component.html',
  styles: ``
})
export class UsuarioFormComponent implements OnInit, OnChanges {
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() usuarioSeleccionado: Usuario | any = null ;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() usuarioCreado = new EventEmitter<void>();


  formUsuario!: FormGroup;
  isLoading = false;

  modalWidthClass = 'max-w-4xl'; // default

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full') {
    const map = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]'
    };

    this.modalWidthClass = map[size];
  }


  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
  ) { }



  ngOnInit(): void {
    this.initFormUsuarios();
    this.setModalWidth('lg');
  }


  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formUsuario) return;

    // EDITAR
    if (changes['usuarioSeleccionado'] && this.usuarioSeleccionado) {
      this.modoEdicion = true;

      const user = this.usuarioSeleccionado;

      // Campos comunes
      let formData: any = {
        id: user.id,
        nombre: user.nombre,
        apellidos: user.apellidos,
        correo: user.correo,
        roles: user.roles,
        telefono: user.telefono,
        documento_identidad: user.documento_identidad,
        direccion: user.direccion,
        departamento: user.departamento,
        provincia: user.provincia,
        distrito: user.distrito
      };

      // Aplicar al formulario
      this.formUsuario.patchValue(formData);

    }

    // CREAR / CERRAR MODAL
    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.formUsuario.reset();
      this.modoEdicion = false;
    }
  }

  // ====================================
  // Methods
  // ====================================
  initFormUsuarios() {
    this.formUsuario = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      correo: ['', [Validators.required, Validators.email]],
      roles: [[], Validators.required],
      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
          Validators.minLength(9),
          Validators.maxLength(9),
        ],
      ],
      documento_identidad: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
          Validators.minLength(8),
          Validators.maxLength(8),
        ],
      ],
      // Campos opcionales (dependen del rol)
      direccion: ['', Validators.required,],
      departamento: ['', Validators.required,],
      provincia: ['', Validators.required,],
      distrito: ['', Validators.required,],
    });
  }


  // Crear o Editar usuario
  crearOEditarUsuario() {
    // Clonamos el value para poder manipularlo
    const usuario: any = { ...this.formUsuario.value };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && usuario.id) {

      //  SI NO SE INGRESÓ PASSWORD → NO ENVIARLO
      if (!usuario.password || usuario.password.trim() === '') {
        delete usuario.password;
      }

      this.usuarioService.actualizarUsuario(usuario.id, usuario).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Usuario actualizado correctamente' });
          this.usuarioCreado.emit(); // refrescar tabla
          this.cerrarModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar usuario',
            text: err.error?.message || 'Error desconocido.',
          });
        },
      });

      return;
    }

    // ============================
    // MODO CREACIÓN
    // ============================
    this.usuarioService.crearUsuario(usuario).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado correctamente',
          text: 'Se envió un correo con las credenciales y enlace de confirmación.'
        });

        this.usuarioCreado.emit(); // refrescar tabla
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear usuario',
          text: err.error?.message || 'Error desconocido',
        });
      }
    });
  }


  // ====================================
  // Helpers methods
  // ====================================
  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  cerrarModal() {
    this.formUsuario.reset();
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
    this.modalCerrado.emit();
  }

  toggleRol(rol: string, event: any) {

    const control = this.formUsuario.get('roles');
    let roles: string[] = control?.value || [];

    if (event.target.checked) {
      // Agregar
      roles = [...roles, rol];
    } else {
      // Quitar
      roles = roles.filter(r => r !== rol);
    }

    control?.setValue(roles);
    control?.markAsTouched();
  }

  esRequerido(campo: string): boolean {
    const control = this.formUsuario.get(campo);
    return control?.hasValidator(Validators.required) ?? false;
  }
}
