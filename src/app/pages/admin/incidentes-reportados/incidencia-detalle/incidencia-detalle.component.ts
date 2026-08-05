import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { finalize } from 'rxjs';

// Service
import { IncidenciasService } from 'src/app/services/incidencias.service';

// Interfaces
import { IncidenciaDetalle } from 'src/app/interfaces/incidencia/incidencia_detalle.interface';


@Component({
  selector: 'incidencia-detalle',
  standalone: true,
  imports: [CommonModule,
    DatePipe,],
  templateUrl: './incidencia-detalle.component.html',
  styles: ``
})
export class IncidenciaDetalleComponent implements OnChanges {


  // INPUTS
  @Input() incidenciaId: number | null = null;
  @Input() visible = false;

  // OUTPUTS
  @Output() cerrar = new EventEmitter<void>();
  @Output() incidenciaCargada = new EventEmitter<IncidenciaDetalle>();


  // ESTADO DEL COMPONENTE
  incidencia: IncidenciaDetalle | null = null;

  isLoading = false;
  errorMessage = '';

  constructor(
    private incidenciasService: IncidenciasService,
  ) { }


  // CICLO DE VIDA
  ngOnChanges(changes: SimpleChanges): void {

    const cambioIncidencia = changes['incidenciaId'];
    const cambioVisible = changes['visible'];

    const debeConsultar =
      this.visible &&
      this.incidenciaId !== null &&
      (
        cambioIncidencia ||
        cambioVisible?.currentValue === true
      );

    if (debeConsultar) {
      this.getIncidenciaDetalle();
    }

    if (
      cambioVisible &&
      cambioVisible.currentValue === false
    ) {
      this.limpiarDetalle();
    }
  }

  // =========================================================
  // CONSULTAR DETALLE
  // =========================================================
  getIncidenciaDetalle(): void {

    if (!this.incidenciaId || this.isLoading) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.incidencia = null;

    this.incidenciasService
      .getIncidenteById(this.incidenciaId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {

          if (!response.success || !response.data) {
            this.errorMessage =
              response.message ||
              'No fue posible obtener el detalle de la incidencia.';

            return;
          }

          this.incidencia = this.extraerIncidencia(response.data);

          if (!this.incidencia) {
            this.errorMessage =
              'La respuesta no contiene información de la incidencia.';

            return;
          }

          this.incidenciaCargada.emit(this.incidencia);
        },

        error: (error) => {

          console.error(
            'Error al obtener el detalle de incidencia:',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar la incidencia.';
        },
      });
  }

  /**
   * Extrae la incidencia del objeto IncidenciaDetalleResponse.
   *
   * Se asume que la respuesta tiene la estructura:
   *
   * data: {
   *   incidencia: { ... }
   * }
   */
  private extraerIncidencia(
    data: IncidenciaDetalle,
  ): IncidenciaDetalle | null {

    return data ?? null;
  }

  // =========================================================
  // CERRAR MODAL
  // =========================================================
  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }
    this.cerrar.emit();
  }

  // =========================================================
  // REINTENTAR CONSULTA
  // =========================================================
  reintentar(): void {
    this.getIncidenciaDetalle();
  }

  // =========================================================
  // LIMPIAR ESTADO
  // =========================================================
  private limpiarDetalle(): void {
    this.incidencia = null;
    this.errorMessage = '';
    this.isLoading = false;
  }

  // =========================================================
  // PRESENTACIÓN
  // =========================================================
  getEstadoClass(estado?: string | null): string {

    switch (estado) {
      case 'REPORTADO':
        return 'badge-warning';

      case 'EN_PROCESO':
        return 'badge-info';

      case 'ATENDIDO':
        return 'badge-success';

      case 'CERRADO':
        return 'badge-neutral';

      case 'ELIMINADO':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  getEstadoLabel(estado?: string | null): string {

    switch (estado) {
      case 'REPORTADO':
        return 'Reportado';

      case 'EN_PROCESO':
        return 'En proceso';

      case 'ATENDIDO':
        return 'Atendido';

      case 'CERRADO':
        return 'Cerrado';

      case 'ELIMINADO':
        return 'Eliminado';

      default:
        return estado || 'Sin estado';
    }
  }

  getTipoLabel(tipo?: string | null): string {

    switch (tipo) {
      case 'ROBO':
        return 'Robo';

      case 'ACCIDENTE':
        return 'Accidente';

      case 'INCENDIO':
        return 'Incendio';

      case 'VIOLENCIA':
        return 'Violencia';

      case 'SOSPECHOSO':
        return 'Persona o actividad sospechosa';

      case 'OTRO':
        return 'Otro';

      default:
        return tipo || 'No especificado';
    }
  }

  getTipoIcon(tipo?: string | null): string {

    switch (tipo) {
      case 'ROBO':
        return 'fa-solid fa-mask-face';

      case 'ACCIDENTE':
        return 'fa-solid fa-car-burst';

      case 'INCENDIO':
        return 'fa-solid fa-fire-flame-curved';

      case 'VIOLENCIA':
        return 'fa-solid fa-person-circle-exclamation';

      case 'SOSPECHOSO':
        return 'fa-solid fa-user-secret';

      default:
        return 'fa-solid fa-circle-exclamation';
    }
  }

  /**
   * Devuelve las coordenadas listas para mostrarse.
   */
  get coordenadas(): string {

    if (
      this.incidencia?.latitud === null ||
      this.incidencia?.latitud === undefined ||
      this.incidencia?.longitud === null ||
      this.incidencia?.longitud === undefined
    ) {
      return 'No registradas';
    }

    return `${this.incidencia.latitud}, ${this.incidencia.longitud}`;
  }

  /**
   * Abre la ubicación en Google Maps.
   */
  abrirUbicacion(): void {

    if (
      this.incidencia?.latitud === null ||
      this.incidencia?.latitud === undefined ||
      this.incidencia?.longitud === null ||
      this.incidencia?.longitud === undefined
    ) {
      return;
    }

    const url = `https://www.google.com/maps/search/?api=1&query=` + `${this.incidencia.latitud},${this.incidencia.longitud}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }

}
