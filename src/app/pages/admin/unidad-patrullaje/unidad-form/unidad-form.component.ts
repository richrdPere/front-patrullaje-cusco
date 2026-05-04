import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Service
import { UnidadPatrullajeService } from 'src/app/services/unidad-patrullaje.service';

@Component({
  selector: 'unidad-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective,],
  templateUrl: './unidad-form.component.html',
  styles: ``
})
export class UnidadFormComponent implements OnInit, OnChanges {
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() unidadSeleccionado: any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() unidadCreado = new EventEmitter<void>();


  codigo: string = '';
  formUnidad!: FormGroup;
  isLoading = false;

  // Selectores
  tipoUnidad = [
    { id: 'CAMIONETA', nombre: 'Camioneta' },
    { id: 'MOTOCICLETA', nombre: 'Motocicleta' }
  ];

  estadoUnidad = [
    { id: 'DISPONIBLE', nombre: 'Disponible' },
    { id: 'EN_PATRULLAJE', nombre: 'En patrullaje' },
    { id: 'MANTENIMIENTO', nombre: 'Mantenimiento' },
    { id: 'FUERA_DE_SERVICIO', nombre: 'Fuera de servicio' }
  ];

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
    private unidadService: UnidadPatrullajeService,
  ) { }

  ngOnInit(): void {
    this.initFormUnidad();
    this.getCodigo();
    this.setModalWidth('lg');
  }

  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formUnidad) return;

    // EDITAR
    if (changes['unidadSeleccionado'] && this.unidadSeleccionado) {
      this.modoEdicion = true;

      const unidad = this.unidadSeleccionado;

      console.log("Unidad seleccionado: ", unidad);

      // Campos comunes
      let formData: any = {
        id: unidad.id,
        placa: unidad.placa,
        tipo: unidad.tipo,
        descripcion: unidad.descripcion,
        estado: unidad.estado,
        codigo: unidad.codigo
      };

      // Aplicar al formulario
      this.formUnidad.patchValue(formData);
    }

    // CREAR / CERRAR MODAL
    if (changes['mostrarModal'] && this.mostrarModal && !this.modoEdicion) {
      this.formUnidad.reset();

      // ACTUALIZANDO EL FORM
      this.formUnidad.patchValue({
        estado: 'DISPONIBLE'
      });

      // OBTENIENDO CODIGO
      this.getCodigo();

      this.modoEdicion = false;
    }

    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.formUnidad.reset();
      this.modoEdicion = false;
    }
  }

  // ====================================
  // Methods
  // ====================================
  initFormUnidad() {
    this.formUnidad = this.fb.group({
      id: [null],
      placa: ['', Validators.required],
      tipo: [null, Validators.required],
      descripcion: ['', Validators.required],
      estado: [null],
      codigo: ['']
    });
  }

  getCodigo() {
    this.unidadService.getUltimoCodigo()
      .subscribe(resp => {


        console.log("codigo: ", resp.codigo);
        this.formUnidad.patchValue({
          codigo: resp.codigo
        });
      });
  }



  // Crear o editar unidad
  crearOEditarUnidad() {
    // Clonamos el value para poder manipularlo
    const unidad: any = { ...this.formUnidad.value };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && unidad.id) {

      this.unidadService.updateUnidad(unidad.id, unidad).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Unidad actualizado correctamente' });
          this.unidadCreado.emit(); // refrescar tabla
          this.cerrarModal();
        },
        error: (err) => {
          Swal.fire({
            icon: 'error',
            title: 'Error al actualizar unidad',
            text: err.error?.message || 'Error desconocido.',
          });
        },
      });
      return;
    }

    // ============================
    // MODO CREACIÓN
    // ============================
    this.unidadService.newUnidad(unidad).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Unidad creado correctamente',
          text: 'La unidad de patrullaje esta disponible para designación.'
        });

        this.unidadCreado.emit(); // refrescar tabla
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear unidad',
          text: err.error?.message || 'Error desconocido',
        });
      }
    });
  }

  // ====================================
  // Helpers methods
  // ====================================
  cerrarModal() {
    this.formUnidad.reset();
    this.modoEdicion = false;
    this.unidadSeleccionado = null;
    this.modalCerrado.emit();
  }

}
