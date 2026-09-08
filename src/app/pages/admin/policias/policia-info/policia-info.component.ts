import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { ReactiveFormsModule, } from '@angular/forms';
import { finalize, forkJoin } from 'rxjs';
import Swal from 'sweetalert2';

// Interface
import { PoliciaByIdData } from 'src/app/interfaces/policia/detail-policia.model';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';

// Service
import { PoliciasService } from 'src/app/services/usuarios/policias.service';
import { UbigeoService } from 'src/app/services/ubigeo.service';

@Component({
  selector: 'policia-info',
  imports: [ReactiveFormsModule, CommonModule], // DatePipe
  templateUrl: './policia-info.component.html',
  styles: ``
})
export class PoliciaInfoComponent {
  @Input() mostrarModal = false;
  @Input() policia_id: number | null = null;

  @Output() modalCerrado = new EventEmitter<void>();

  policia!: PoliciaByIdData;
  loading = false;

  departamentoNombre = 'No registrado';
  provinciaNombre = 'No registrado';
  distritoNombre = 'No registrado';

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
    private policiasService: PoliciasService,
    private ubigeoService: UbigeoService
  ) { }

  // CICLO DE VIDA
  ngOnChanges(changes: SimpleChanges): void {
    if (changes['policia_id'] && this.policia_id) {
      this.cargarDatosPolicia();
      this.setModalWidth('lg');
    }
  }

  // *********************************************************
  // 1. CARGAR INFORMACIÓN DEL POLICÍA
  // *********************************************************
  cargarDatosPolicia(): void {
    if (!this.policia_id || this.loading) {
      return;
    }

    this.loading = true;

    forkJoin({
      response: this.policiasService.getPoliciaById(this.policia_id),
      ubigeos: this.ubigeoService.loadData(),
    })
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: ({ response }) => {
          this.policia = response.data;
          this.resolverNombresUbigeo(response.data);
        },

        error: (error: ApiErrorData) => {
          this.limpiarDatos();

          void Swal.fire({
            icon: 'error',
            title: 'No se pudo obtener el policía',
            text: error.message || 'Ocurrió un error al cargar la información.',
          });
        },
      });
  }

  // *********************************************************
  // 2. RESOLVER NOMBRES DEL UBIGEO
  // *********************************************************
  private resolverNombresUbigeo(policia: PoliciaByIdData): void {
    const persona = policia.persona;

    this.departamentoNombre = this.getUbigeoNombre(persona.departamento, 'departamento',);
    this.provinciaNombre = this.getUbigeoNombre(persona.provincia, 'provincia',);
    this.distritoNombre = this.getUbigeoNombre(persona.distrito, 'distrito',);
  }

  // *********************************************************
  // 3. OBTENER NOMBRE POR CÓDIGO
  // *********************************************************
  private getUbigeoNombre(
    codigo:
      | string
      | null
      | undefined,

    tipo:
      | 'departamento'
      | 'provincia'
      | 'distrito',
  ): string {
    if (!codigo) {
      return 'No registrado';
    }

    const resultado = this.ubigeoService.findByUbigeo(codigo);

    switch (tipo) {
      case 'departamento':
        return (resultado?.departamento?.departamento ?? codigo);

      case 'provincia':
        return (resultado?.provincia?.nombre ?? codigo);

      case 'distrito':
        return (resultado?.distrito?.nombre ?? codigo);

      default:
        return codigo;
    }
  }

  cerrarModal(): void {
    this.mostrarModal = false;
    this.modalCerrado.emit();
  }

  // *********************************************************
  // 4. LIMPIAR INFORMACIÓN
  // *********************************************************
  private limpiarDatos(): void {
    this.departamentoNombre = 'No registrado';
    this.provinciaNombre = 'No registrado';
    this.distritoNombre = 'No registrado';
  }
}
