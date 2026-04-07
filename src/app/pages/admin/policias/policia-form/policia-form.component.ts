import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';


// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';
import { PoliciasService } from 'src/app/services/policias.service';



@Component({
  selector: 'policia-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './policia-form.component.html',
  styles: ``
})
export class PoliciaFormComponent implements OnInit, OnChanges {

  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() policiaSeleccionado: any | any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() policiaCreado = new EventEmitter<void>();

  formPolicia!: FormGroup;
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
    private policiasService: PoliciasService,
  ) { }

  ngOnInit(): void {
    this.initFormPolicias();
    this.setModalWidth('lg');
  }

  // ====================================
  // Formulario
  // ====================================
  initFormPolicias() {
    this.formPolicia = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      apellidos: ['', Validators.required],
      documento_identidad: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
        ],
      ],
      telefono: [
        '',
        [
          Validators.required,
          Validators.pattern('^[0-9]+$'),
        ],
      ],
      direccion: ['', Validators.required],
      departamento: ['', Validators.required],
      provincia: ['', Validators.required],
      distrito: ['', Validators.required],
      // Campos opcionales (dependen del rol)

      grado: ['', Validators.required],
      comisaria: ['', Validators.required],
      codigo_institucional: ['', Validators.required],

    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formPolicia) return;

    // EDITAR
    if (changes['policiaSeleccionado'] && this.policiaSeleccionado) {
      this.modoEdicion = true;

      const poli = this.policiaSeleccionado;

      // Campos comunes
      let formData: any = {
        id: poli.id,
        nombre: poli.nombre,
        apellidos: poli.apellidos,
        correo: poli.correo,
        roles: poli.roles,
        telefono: poli.telefono,
        documento_identidad: poli.documento_identidad,
        direccion: poli.direccion,
        departamento: poli.departamento,
        provincia: poli.provincia,
        distrito: poli.distrito,
        grado: poli.grado,
        comisaria: poli.comisaria,
        codigo_institucional: poli.codigo_institucional,
      };

      // Aplicar al formulario
      this.formPolicia.patchValue(formData);

    }

    // CREAR / CERRAR MODAL
    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.formPolicia.reset();
      this.modoEdicion = false;
    }
  }

  // ====================================
  // Methods
  // ====================================

  crearOEditarPolicia() {
    // Clonamos el value para poder manipularlo
    const policia: any = { ...this.formPolicia.value };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && policia.id) {

      this.policiasService.updatePolicia(policia.id, policia).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Policia actualizado correctamente' });
          this.policiaCreado.emit(); // refrescar tabla
          this.cerrarModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar policia',
            text: err.error?.message || 'Error desconocido.',
          });
        },
      });

      return;
    }

    // ============================
    // MODO CREACIÓN
    // ============================
    this.policiasService.newPolicia(policia).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Usuario creado correctamente',
          text: resp.message
        });

        this.policiaCreado.emit(); // refrescar tabla
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
    this.formPolicia.reset();
    this.modoEdicion = false;
    this.policiaSeleccionado = null;
    this.modalCerrado.emit();
  }


  esRequerido(campo: string): boolean {
    const control = this.formPolicia.get(campo);
    return control?.hasValidator(Validators.required) ?? false;
  }
}
