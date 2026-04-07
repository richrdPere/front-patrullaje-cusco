import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad-patrullaje.service';
import { ZonaService } from 'src/app/services/zona.service';
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';

@Component({
  selector: 'patrullaje-program-form',
  imports: [ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './patrullaje-program-form.component.html',
  styles: ``
})
export class PatrullajeProgramFormComponent implements OnInit {
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() patrullajeSeleccionado: any = null;

  @Output() modalCerrado = new EventEmitter<void>();
  @Output() patrullajeCreado = new EventEmitter<void>();

  // listas dinamicas
  zonas: any[] = [];
  unidades: any[] = [];
  serenosUnidad: any[] = [];

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
    private patrullajeService: PatrullajeProgramadoService,
  ) { }

  ngOnInit(): void {
    this.initFormPatrullaje();
    this.getZonas();
    this.getAllUnidades();

    this.setModalWidth('lg');
  }


  // Methods
  initFormPatrullaje() {
    this.formPatrullaje = this.fb.group({
      tipo_patrullaje: ['unidad', Validators.required],
      unidad_id: ['', Validators.required],
      zona_id: [''],
      usuario_id: [''],
      fecha: ['', Validators.required],
      hora_inicio: ['', Validators.required],
      hora_fin: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  getZonas() {
    this.zonaService.obtenerZonas()
      .subscribe({
        next: (resp: any) => {
          this.zonas = resp.zonas;

          console.log("ALL ZONAS: ", this.zonas);
        }
      });
  }

  getAllUnidades() {
    this.unidadService.getAllUnidades()
      .subscribe({
        next: (resp: any) => {
          this.unidades = resp.unidades;

          console.log("ALL UNIDADES: ", this.unidades);
        }
      });
  }

  onUnidadChange(event: any) {

    const unidadId = event.target.value;

    this.unidadService.getUnidadByID(unidadId)
      .subscribe({
        next: (resp: any) => {

          this.serenosUnidad = resp.unidad.serenos_unidad;

        }
      });

  }

  registrarPatrullaje() {

    if (this.formPatrullaje.invalid) {
      this.formPatrullaje.markAllAsTouched();
      return;
    }

    const data = this.formPatrullaje.value;

    this.patrullajeService.crearPatrullajeProgramado(data)
      .subscribe({

        next: (resp: any) => {

          Swal.fire({
            icon: 'success',
            title: 'Patrullaje programado',
            text: resp.message
          });

          this.formPatrullaje.reset();

        },

        error: (err) => {

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err.error.message
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
