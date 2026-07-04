import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';

// Service
import { IncidenciasService } from 'src/app/services/incidencias.service';

@Component({
  selector: 'app-incidentes-reportados',
  imports: [DatePipe, FormsModule, CommonModule],
  templateUrl: './incidentes-reportados.component.html',
  styles: ``
})
export class IncidentesReportadosComponent implements OnInit {


  // Incidentes Reportados
  incidentes: any[] = [];
  incidente_id: number | null = null;
  isLoading = true;

  mostrarModalInfo = false;

  searchTimeout: any;

  // Search
  descripcionBusqueda: string = '';
  fechaBusqueda: string = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private incidenciasService: IncidenciasService
  ) { }


  ngOnInit(): void {
    this.getIncidentesPaginado();

  }

  // - Patrullaje paginado
  getIncidentesPaginado() {
    this.isLoading = true;

    this.incidenciasService.getIncidentesPaginated({
      page: this.page,
      limit: this.limit,
      descripcion: this.descripcionBusqueda?.trim() || '',
      fecha: this.fechaBusqueda?.trim() || '',

    }).subscribe({
      next: (res) => {

        console.log("INCIEDENTES: ", res);
        this.incidentes = res.data;

        this.totalItems = res.total;
        this.currentPage = res.page;
        this.totalPages = res.totalPages;
        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  // - Ver incidente
  verPatrullaje(patrullaje: any) {
    this.incidente_id = patrullaje.id;
    this.mostrarModalInfo = true;
  }

  // - Buscador
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getIncidentesPaginado();
    }, 300);
  }

  // ================================
  // Helpers methods
  // ================================

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getIncidentesPaginado();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
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
}
