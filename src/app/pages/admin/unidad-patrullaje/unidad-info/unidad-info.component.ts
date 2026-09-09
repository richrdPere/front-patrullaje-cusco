import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

// Interface
import { UnidadPatrullajeData } from 'src/app/interfaces/unidad-patrullaje/get-unidades-paginated.model';
import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';

@Component({
  selector: 'unidad-info',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './unidad-info.component.html',
  styles: ``
})
export class UnidadInfoComponent {

  @Input() mostrarModal = false;
  @Input() unidad_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  unidad!: UnidadPatrullajeData;
  loading = false;


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
    private unidadService: UnidadPatrullajeService,
  ) { }

  // CICLO DE VIDA
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['unidad_id'] && this.unidad_id) {
      this.cargarDatosUnidad();
      this.setModalWidth('lg');
    }
  }

  // *********************************************************
  // 1. CARGAR INFORMACIÓN DE LA UNIDAD
  // *********************************************************
  cargarDatosUnidad() {
    if (!this.unidad_id || this.loading) {
      return;
    }

    this.loading = true;

    forkJoin({
      response: this.unidadService.getUnidadById(this.unidad_id),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: ({ response }) => {
          this.unidad = response.data;

        },

        error: (error: ApiErrorData) => {


          void Swal.fire({
            icon: 'error',
            title: 'No se pudo obtener los datos de la unidad',
            text: error.message || 'Ocurrió un error al cargar la unidad.',
          });
        },
      });
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modalCerrado.emit();
  }
}
