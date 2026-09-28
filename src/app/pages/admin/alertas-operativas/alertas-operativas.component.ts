import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Service
import { AlertaService } from 'src/app/services/alertas/alerta.service';

// Interface

import { AlertaOperativaEstado, AlertaOperativaItem, AlertaOperativaPrioridad, AlertaOperativaTipo, EstadoDestinatarioAlerta, GetAlertasOperativasParams } from 'src/app/interfaces/alertas/get-alertas-operativas.model';

// Components

@Component({
  selector: 'app-alertas-operativas',
  imports: [DatePipe, FormsModule, CommonModule, UppercaseDirective],
  templateUrl: './alertas-operativas.component.html',
  styles: ``
})
export class AlertasOperativasComponent implements OnInit {

  // Usuarios
  alertas: AlertaOperativaItem[] = [];
  usuario_id: number | null = null;
  isLoading = true;
  alertaSeleccionado: AlertaOperativaItem | null = null;

  // Modales
  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;

  searchTimeout: any;

  // Search
  searchBusqueda: string = '';
  estadoBusqueda: AlertaOperativaEstado | '' = '';
  tipoBusqueda: AlertaOperativaTipo | '' = '';
  prioridadBusqueda: AlertaOperativaPrioridad | '' = '';

  // Filtros
  filtros = {
    estado: '',
    tipo: '',
    prioridad: '',
  };

  // Catalogos
  readonly tipos = [
    'PANICO',
    'SOS',
    'EMERGENCIA',
    'INCIDENCIA',
  ];

  readonly prioridades = [
    'BAJA',
    'MEDIA',
    'ALTA',
    'CRITICA',
  ];

  readonly estados = [
    'PENDIENTE',
    'EN_ATENCION',
    'ATENDIDA',
    'CANCELADA',
    'EXPIRADA',
  ];

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];


  constructor(private alertaService: AlertaService
  ) { }


  ngOnInit(): void {
    this.getAlertasOperativosPaginados();
  }

  ngOnDestroy(): void {
    if (this.searchTimeout) {
      clearTimeout(
        this.searchTimeout,
      );
    }
  }

  // ================================
  // Methods
  // ================================
  getAlertasOperativosPaginados() {
    const params: GetAlertasOperativasParams = {
      page: this.page,
      limit: this.limit,
      search: this.searchBusqueda.trim() || undefined,
      estado: this.estadoBusqueda || undefined,
      tipo: this.tipoBusqueda || undefined,
      prioridad: this.prioridadBusqueda || undefined,
    };

    this.isLoading = true;


    this.alertaService.getAlertasOperativas(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const paginacion = res.data;

          this.alertas = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.totalPages;

          // this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.alertas = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      })
  }

  // BUSCADOR
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getAlertasOperativosPaginados();
    }, 300);
  }

  // EDITAR ALERTA


  // CANCELAR ALERTA


  // VER ALERTA
  verAlerta(alerta: AlertaOperativaItem): void {
    this.alertaSeleccionado = alerta;
    this.mostrarModalInfo = true;
  }

  // ================================
  // Helpers methods
  // ================================
  formatearTextoEnum(
    valor: string | null | undefined,
  ): string {
    if (!valor) {
      return 'Sin información';
    }

    return valor
      .toLowerCase()
      .replaceAll('_', ' ')
      .replace(/\b\w/g, (letra) =>
        letra.toUpperCase(),
      );
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getAlertasOperativosPaginados();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getAlertasOperativosPaginados();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getAlertasOperativosPaginados();
  }

  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  limpiarFiltros(): void {
    this.searchBusqueda = '';
    this.estadoBusqueda = '';
    this.tipoBusqueda = '';
    this.prioridadBusqueda = '';
    this.page = 1;

    this.getAlertasOperativosPaginados();
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.alertaSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }


  cerrarModalInfo() {
    this.mostrarModalInfo = false;
    this.usuario_id = null;
  }


}
