import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad-patrullaje.service';
import { ZonaService } from 'src/app/services/zona.service';

import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';
import { UsuarioService } from 'src/app/services/usuarios.service';
import { PoliciasService } from 'src/app/services/policias.service';

@Component({
  selector: 'patrullaje-program-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './patrullaje-program-form.component.html',
  styles: ``
})
export class PatrullajeProgramFormComponent implements OnInit, OnChanges {
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() patrullajeSeleccionado: any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() patrullajeCreado = new EventEmitter<void>();

  // listas dinamicas
  zonas: any[] = [];
  unidades: any[] = [];
  serenos: any[] = [];
  policias: any[] = [];

  // Formulario
  formPatrullaje!: FormGroup;



  // Ancho del modal
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
    private zonaService: ZonaService,
    private usuarioService: UsuarioService,
    private policiaService: PoliciasService,
    private patrullajeService: PatrullajeProgramadoService,
  ) { }

  ngOnInit(): void {
    this.initFormPatrullaje();
    this.getAllData();

    this.setModalWidth('lg');
  }

  // =====================================
  // Form
  // =====================================
  initFormPatrullaje() {
    this.formPatrullaje = this.fb.group({
      id: [null],
      unidad_id: [null, Validators.required],
      zona_id: [null, Validators.required],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      descripcion: ['', Validators.required],
      serenos: [[], Validators.required],
      policias: [[], Validators.required],
    });
  }

  toggleSereno(id: number, event: any) {
    const control = this.formPatrullaje.get('serenos');
    let selected = control?.value || [];

    if (event.target.checked) {
      selected = [...selected, id];
    } else {
      selected = selected.filter((item: number) => item !== id);
    }

    control?.setValue(selected);
  }

  togglePolicia(id: number, event: any) {
    const control = this.formPatrullaje.get('policias');
    let selected = control?.value || [];

    if (event.target.checked) {
      selected = [...selected, id];
    } else {
      selected = selected.filter((item: number) => item !== id);
    }

    control?.setValue(selected);
  }

  esRequerido(campo: string): boolean {
    const control = this.formPatrullaje.get(campo);
    return control?.hasValidator(Validators.required) ?? false;
  }

  ngOnChanges(changes: SimpleChanges): void {
    //  Si el formulario aún no está creado, salir
    if (!this.formPatrullaje) return;

    // EDITAR
    if (changes['patrullajeSeleccionado'] && this.patrullajeSeleccionado) {
      this.modoEdicion = true;

      const patrullaje = this.patrullajeSeleccionado;

      // Transformando a ids
      const serenosIds = patrullaje.serenos.map((s: any) => s.id);
      const policiasIds = patrullaje.policias.map((p: any) => p.id);

      // Campos comunes
      let formData: any = {
        id: patrullaje.id,
        unidad_id: patrullaje.unidad?.id || null,
        zona_id: patrullaje.zona?.id || null,
        fecha: patrullaje.fecha,
        hora_inicio: patrullaje.hora_inicio,
        hora_fin: patrullaje.hora_fin,
        descripcion: patrullaje.descripcion,
        serenos: serenosIds,
        policias: policiasIds,
      };

      // Aplicar al formulario
      this.formPatrullaje.patchValue(formData);

    }

    // CREAR / CERRAR MODAL
    if (changes['mostrarModal'] && !this.mostrarModal) {
      this.formPatrullaje.reset();
      this.modoEdicion = false;
    }
  }

  // =====================================
  // Methods
  // =====================================
  // - Obtener todos los datos
  getAllData() {
    forkJoin({
      zonas: this.zonaService.obtenerZonas(),
      unidades: this.unidadService.getAllUnidades(),
      serenos: this.usuarioService.getSerenosAndConductores(),
      policias: this.policiaService.getAllPolicias()
    }).subscribe({
      next: (resp: any) => {
        this.zonas = resp.zonas.zonas;
        this.unidades = resp.unidades.unidades;
        this.serenos = resp.serenos.serenos;
        this.policias = resp.policias.policias;
      },
      error: (err) => {
        console.error('Error cargando datos', err);
      }
    });
  }

  onUnidadChange(event: any) {

    const unidadId = event.target.value;

    this.unidadService.getUnidadByID(unidadId)
      .subscribe({
        next: (resp: any) => {

          this.serenos = resp.unidad.serenos_unidad;

        }
      });
  }

  crearOEditarPatrullaje() {

    const patrullaje: any = { ...this.formPatrullaje.value };

    // ============================
    // MODO EDICIÓN
    // ============================
    if (this.modoEdicion && patrullaje.id) {

      this.patrullajeService.updatePatrullajeProgramado(patrullaje.id, patrullaje).subscribe({
        next: () => {
          Swal.fire({ icon: 'success', title: 'Policia actualizado correctamente' });
          this.patrullajeCreado.emit(); // refrescar tabla
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
    if (this.formPatrullaje.invalid) {
      this.formPatrullaje.markAllAsTouched();
      return;
    }

    this.patrullajeService.newPatrullajeProgramado(patrullaje).subscribe({
      next: (resp) => {
        Swal.fire({
          icon: 'success',
          title: 'Patrullaje programado correctamente',
          text: resp.message
        });

        this.patrullajeCreado.emit(); // refrescar tabla
        this.cerrarModal();
      },
      error: (err) => {
        Swal.fire({
          icon: 'error',
          title: 'Error al crear el patrullaje',
          text: err.error?.message || 'Error desconocido',
        });
      }
    });
  }

  // ====================================
  // Helpers methods
  // ====================================
  cerrarModal() {
    this.formPatrullaje.reset();
    this.modoEdicion = false;
    this.patrullajeSeleccionado = null;
    this.modalCerrado.emit();
  }
}
