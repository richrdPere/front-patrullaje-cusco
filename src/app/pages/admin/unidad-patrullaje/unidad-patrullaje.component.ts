import { DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad-patrullaje.service';
import { UnidadFormComponent } from "./unidad-form/unidad-form.component";

@Component({
  selector: 'app-unidad-patrullaje',
  imports: [DatePipe, FormsModule, UnidadFormComponent],
  templateUrl: './unidad-patrullaje.component.html',
  styles: ``
})
export class UnidadPatrullajeComponent implements OnInit {

  // Unidad patrullaje
  unidades: any[] = [];
  isLoading = true;

  mostrarModal = false;
  modoEdicion = false;
  unidadSeleccionado: any = null;

  searchTimeout: any;

  // Search
  placaBusqueda: string = '';
  descripcionBusqueda: string = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(private unidadService: UnidadPatrullajeService
  ) { }



  ngOnInit(): void {
    this.getUnidadesPaginado();

  }

  // ================================
  // Methods
  // ================================
  getUnidadesPaginado() {
    this.isLoading = true;

    this.unidadService.getUnidadesPaginado({
      page: this.page,
      limit: this.limit,
      placa: this.placaBusqueda,
      descripcion: this.descripcionBusqueda
    }).subscribe({
      next: (res) => {

        console.log("UNIDADES: ", res);
        this.unidades = res.data;

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

  eliminarUnidad(unidad: any) {
    Swal.fire({
      title: '¿Eliminar unidad?',
      text: `Se eliminará la unidad ${unidad.codigo}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.unidadService.deleteUnidad(unidad.id)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Unidad eliminada',
                text: 'La unidad fue eliminada correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getUnidadesPaginado();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar la unidad'
              });

            }
          });

      }

    });
  }
  editarUnidad(unidad: any) {
    this.modoEdicion = true;
    this.unidadSeleccionado = { ...unidad };
    this.mostrarModal = true;
  }
  verUnidad(_t52: any) {
    throw new Error('Method not implemented.');
  }

  abrirModal() {
    this.modoEdicion = false;
    this.unidadSeleccionado = null;
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
    this.getUnidadesPaginado();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getUnidadesPaginado();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getUnidadesPaginado();
  }

  cerrarModal() {
    this.mostrarModal = false;
  }
}
