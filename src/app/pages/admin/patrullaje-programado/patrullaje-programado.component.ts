import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Service
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';
import { PatrullajeProgramFormComponent } from "./patrullaje-program-form/patrullaje-program-form.component";

@Component({
  selector: 'app-patrullaje-programado',
  imports: [DatePipe, FormsModule, PatrullajeProgramFormComponent, CommonModule],
  templateUrl: './patrullaje-programado.component.html',
  styles: ``
})
export class PatrullajeProgramadoComponent implements OnInit {


  // Unidad patrullaje
  patrullajes: any[] = [];
  isLoading = true;

  mostrarModal = false;
  modoEdicion = false;
  patrullajeSeleccionado: any = null;

  searchTimeout: any;

  // Search
  placaBusqueda: string = '';


  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private patrullajeService: PatrullajeProgramadoService
  ) { }


  ngOnInit(): void {
    this.getPatrullajePaginado();

  }

  getPatrullajePaginado() {
    this.isLoading = true;

    this.patrullajeService.getPatrullajesPaginado({
    page: this.page,
    limit: this.limit,

    }).subscribe({
      next: (res) => {

        console.log("UNIDADES: ", res);
        this.patrullajes = res.data;

        this.totalItems = res.total;
        this.currentPage = res.page;

        this.totalPages = Math.ceil(res.total / res.limit);

        this.isLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.isLoading = false;
      }
    });
  }

  eliminarPatrullaje(_t44: any) {
    throw new Error('Method not implemented.');
  }
  editarPatrullaje(_t44: any) {
    throw new Error('Method not implemented.');
  }
  verPatrullaje(_t44: any) {
    throw new Error('Method not implemented.');
  }



  abrirModal() {
    this.modoEdicion = false;
    this.patrullajeSeleccionado = null;
    this.mostrarModal = true;
  }


  // ================================
  // Helpers methods
  // ================================

  onSearchChange() {
    throw new Error('Method not implemented.');
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getPatrullajePaginado();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getPatrullajePaginado();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getPatrullajePaginado();
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

}
