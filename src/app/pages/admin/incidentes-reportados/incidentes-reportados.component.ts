import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';

// Service
import { IncidenciasService } from 'src/app/services/incidencias.service';

// Interfaces
import {
  IncidenciaPaginada,
  IncidenciasPaginadasData,
  IncidenciasPaginadasFilters,
} from 'src/app/interfaces/incidencia/incidencias.interface';
import { IncidenciaDetalleComponent } from "./incidencia-detalle/incidencia-detalle.component";
import { IncidenciaDetalle } from 'src/app/interfaces/incidencia/incidencia_detalle.interface';
import { IncidenciaMapaComponent } from "./incidencia-mapa/incidencia-mapa.component";
import { IncidenciaArchivosComponent } from "./incidencia-archivos/incidencia-archivos.component";

@Component({
  selector: 'app-incidentes-reportados',
  imports: [DatePipe, FormsModule, CommonModule, IncidenciaDetalleComponent, IncidenciaMapaComponent, IncidenciaArchivosComponent],
  templateUrl: './incidentes-reportados.component.html',
  styles: ``
})
export class IncidentesReportadosComponent implements OnInit, OnDestroy {

  // Incidentes Reportados
  incidentes: IncidenciasPaginadasData['data'] = [];
  incidente_id: number | null = null;
  isLoading = true;
  errorMessage = '';


  // Modal
  mostrarModalInfo = false;

  // - Archivos modal
  mostrarArchivos = false;
  incidenciaArchivoId: number | null = null;

  // - Detalle modal
  mostrarModalDetalle = false;
  incidenciaDetalleId: number | null = null;

  // - Mapa modal
  mostrarModalMapa = false;
  incidenciaSeleccionada: IncidenciaPaginada | null = null;

  // Search
  descripcionBusqueda: string = '';
  fechaBusqueda: string = '';

  searchTimeout: ReturnType<typeof setTimeout> | null = null;

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private incidenciasService: IncidenciasService
  ) { console.log('1. Constructor IncidentesReportadosComponent'); }


  ngOnInit(): void {
    console.log('2. ngOnInit IncidentesReportadosComponent');
    this.getIncidentesPaginado();

  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  // - Patrullaje paginado
  getIncidentesPaginado() {
    this.isLoading = true;
    this.errorMessage = '';

    const filters: IncidenciasPaginadasFilters = {
      page: this.page,
      limit: this.limit,
      mode: "web"
    };


    this.incidenciasService.getIncidentesPaginated(filters).subscribe({
      next: (res) => {

        console.log("INCIEDENTES: ", res);
        const paginacion = res.data;


        this.incidentes = paginacion.data ?? [];

        this.totalItems = paginacion.total ?? 0;
        this.currentPage = paginacion.page ?? this.page;
        this.limit = paginacion.limit ?? this.limit;
        this.totalPages = paginacion.totalPages ?? 0;

        this.page = this.currentPage;

        console.log('Incidencias paginadas:', this.incidentes);

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;

        this.incidentes = [];
        this.totalItems = 0;
        this.totalPages = 0;

        this.errorMessage =
          err?.error?.message ||
          err?.message ||
          'No se pudieron obtener las incidencias.';
      }
    });
  }

  // - Ver incidente
  verIncidente(
    incidente: IncidenciasPaginadasData['data'][number]
  ): void {
    this.incidente_id = incidente.id;
    this.mostrarModalInfo = true;
  }

  // - Buscador
  onSearchChange() {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getIncidentesPaginado();
    }, 300);
  }


  // ================================
  // Helpers methods
  // ================================
  recargarIncidencias(): void {
    this.getIncidentesPaginado();
  }

  onPageSizeChange(): void {
    this.cambiarLimite();
  }

  onFiltroChange() {
    this.page = 1;
    this.getIncidentesPaginado();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages || nuevaPagina === this.page ||
      this.isLoading) return;
    this.page = nuevaPagina;
    this.getIncidentesPaginado();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getIncidentesPaginado();
  }


  cerrarModalInfo() {
    this.mostrarModalInfo = false;
    this.incidente_id = null;
  }

  limpiarFiltros(): void {
    this.descripcionBusqueda = '';
    this.fechaBusqueda = '';

    this.page = 1;

    this.getIncidentesPaginado();
  }

  /*
  |--------------------------------------------------------------------------
  | Modal de archivos
  |--------------------------------------------------------------------------
  */
  abrirArchivos(incidenciaId: number,): void {

    this.incidenciaArchivoId = incidenciaId;
    this.mostrarArchivos = true;
  }

  cerrarArchivos(): void {
    this.mostrarArchivos = false;
  }
  /*
  |--------------------------------------------------------------------------
  | Modal de detalle
  |--------------------------------------------------------------------------
  */
  abrirDetalleIncidencia(
    incidenciaId: number,
  ): void {

    this.incidenciaDetalleId = incidenciaId;
    this.mostrarModalDetalle = true;
  }

  cerrarDetalleIncidencia(): void {

    this.mostrarModalDetalle = false;
    this.incidenciaDetalleId = null;
  }

  onIncidenciaDetalleCargada(
    incidencia: IncidenciaDetalle,
  ): void {

    console.log(
      'Incidencia consultada:',
      incidencia,
    );
  }

  /*
  |--------------------------------------------------------------------------
  | Modal de mapa
  |--------------------------------------------------------------------------
  */
  abrirMapaIncidencia(
    incidencia: IncidenciaPaginada,
  ): void {

    this.incidenciaSeleccionada = incidencia;
    this.mostrarModalMapa = true;
  }

  cerrarMapaIncidencia(): void {

    this.mostrarModalMapa = false;
    this.incidenciaSeleccionada = null;
  }

  /*
  |--------------------------------------------------------------------------
  | Helpers de paginación
  |--------------------------------------------------------------------------
  */

  get desdeRegistro(): number {
    if (this.totalItems === 0) {
      return 0;
    }

    return (
      (this.currentPage - 1) * this.limit + 1
    );
  }

  get hastaRegistro(): number {
    return Math.min(
      this.currentPage * this.limit,
      this.totalItems
    );
  }

  get paginasVisibles(): number[] {
    if (this.totalPages <= 0) {
      return [];
    }

    const rango = 2;

    const inicio = Math.max(
      1,
      this.currentPage - rango
    );

    const fin = Math.min(
      this.totalPages,
      this.currentPage + rango
    );

    return Array.from(
      {
        length: fin - inicio + 1,
      },
      (_, index) => inicio + index
    );
  }

  /*
  |--------------------------------------------------------------------------
  | TrackBy
  |--------------------------------------------------------------------------
  */

  trackByIncidenciaId(
    index: number,
    incidente: IncidenciasPaginadasData['data'][number]
  ): number {
    return incidente.id;
  }


}
