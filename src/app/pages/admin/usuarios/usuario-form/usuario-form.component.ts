import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UsuarioService } from '../../../../services/usuarios/usuarios.service';
import { UbigeoService } from 'src/app/services/ubigeo.service';

// Interface
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';
import { UsuarioData } from 'src/app/interfaces/usuarios/get-usuarios-paginated.model';


@Component({
  selector: 'usuarios-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './usuario-form.component.html',
  styles: ``
})
export class UsuarioFormComponent implements OnInit, OnChanges {
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() usuarioSeleccionado: UsuarioData | null = null;

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

  // Selectores
  departamentos: any[] = [];
  provincias: any[] = [];
  distritos: any[] = [];


  constructor(
    private fb: FormBuilder,
    private usuarioService: UsuarioService,
    private ubigeoService: UbigeoService,
  ) { }

  ngOnInit(): void {
    this.initFormUsuarios();
    this.setModalWidth('lg');

    // - listen
    this.initUbigeo();
    this.listenUbigeoChanges();
  }

  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formUsuario) return;

    // EDITAR
    if (changes['usuarioSeleccionado'] && this.usuarioSeleccionado) {
      this.modoEdicion = true;

      const user = this.usuarioSeleccionado;

      console.log('Usuario seleccionado para edición:', user);

      // Campos comunes
      const formData = {
        id: user.id,
        nombres: user.persona.nombres,
        apellidos: user.persona.apellidos,
        correo: user.correo,
        roles: user.roles,
        telefono: user.persona.telefono,
        documento_identidad: user.persona.documento_identidad,
        direccion: user.persona.direccion,
        departamento: user.persona.departamento,
        provincia: user.persona.provincia,
        distrito: user.persona.distrito
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
  // LISTENERS UBIDEO, DEPARTAMENTO, PROVINCIA Y DISTRITO
  // ====================================
  initUbigeo() {
    this.ubigeoService.loadData().subscribe(data => {
      this.departamentos = data;

      console.log('Departamentos cargados:', this.departamentos);
    });
  }


  listenUbigeoChanges() {
    // Departamento → Provincias
    this.formUsuario.get('departamento')?.valueChanges.subscribe(depUbigeo => {
      if (!depUbigeo) return;

      this.provincias = this.ubigeoService.getProvincias(depUbigeo);
      this.distritos = [];

      this.formUsuario.patchValue({
        provincia: null,
        distrito: null
      }, { emitEvent: false });
    });

    // Provincia → Distritos
    this.formUsuario.get('provincia')?.valueChanges.subscribe(provUbigeo => {
      const depUbigeo = this.formUsuario.value.departamento;
      if (!depUbigeo || !provUbigeo) return;

      console.log('Provincia seleccionada:', provUbigeo, 'en departamento:', depUbigeo);
      this.distritos = this.ubigeoService.getDistritos(depUbigeo, provUbigeo);
      console.log('Distritos cargados:', this.distritos);
      this.formUsuario.patchValue({
        distrito: null
      }, { emitEvent: false });
    });
  }

  onDepartamentoChange(depUbigeo: string) {
    this.provincias = this.ubigeoService.getProvincias(depUbigeo);
    this.distritos = [];
  }

  onProvinciaChange(depUbigeo: string, provUbigeo: string) {
    this.distritos = this.ubigeoService.getDistritos(depUbigeo, provUbigeo);
  }

  // ====================================
  // Formulario
  // ====================================
  initFormUsuarios() {
    this.formUsuario = this.fb.group({
      id: [null],
      nombres: ['', Validators.required],
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
      departamento: [null, Validators.required,],
      provincia: [null, Validators.required,],
      distrito: [null, Validators.required,],
    });
  }

  // ====================================
  // Methods
  // ====================================

  // Crear o Editar usuario
  crearOEditarUsuario() {

    if (this.formUsuario.invalid) {
      this.formUsuario.markAllAsTouched();
      return;
    }

    const form = this.formUsuario.value;

    // PAYLOAD COMÚN para CREAR y EDITAR
    const payload = {
      nombres: form.nombres,
      apellidos: form.apellidos,
      documento_identidad: form.documento_identidad,
      telefono: form.telefono,
      direccion: form.direccion,
      departamento: form.departamento,
      provincia: form.provincia,
      distrito: form.distrito,
      correo: form.correo,
      roles: form.roles
    };

    this.isLoading = true;

    // ==========================
    // EDITAR
    // ==========================
    if (this.modoEdicion && form.id) {

      this.usuarioService.updateUsuario(form.id, payload).subscribe({
        next: () => {

          this.isLoading = false;

          Swal.fire({
            icon: 'success',
            title: 'Usuario actualizado correctamente'
          });

          this.usuarioCreado.emit();
          this.cerrarModal();
        },
        error: (err) => {

          this.isLoading = false;

          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar usuario',
            text: err.error?.message
          });
        },
      });

      return;
    }

    // ==========================
    // CREAR
    // ==========================
    this.usuarioService.newUsuario(payload).subscribe({
      next: () => {

        this.isLoading = false;

        Swal.fire({
          icon: 'success',
          title: 'Usuario creado correctamente'
        });

        this.usuarioCreado.emit();
        this.cerrarModal();
      },
      error: (err) => {

        this.isLoading = false;

        Swal.fire({
          icon: 'error',
          title: 'Error al crear usuario',
          text: err.error?.message
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
