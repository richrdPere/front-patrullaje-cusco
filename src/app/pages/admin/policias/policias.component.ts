import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Service
import { PoliciasService } from 'src/app/services/policias.service';
import { PoliciaFormComponent } from "./policia-form/policia-form.component";
import { PoliciaInfoComponent } from "./policia-info/policia-info.component";

@Component({
  selector: 'app-policias',
  imports: [DatePipe, FormsModule, CommonModule, UppercaseDirective, PoliciaFormComponent, PoliciaInfoComponent],
  templateUrl: './policias.component.html',
  styles: ``
})
export class PoliciasComponent implements OnInit {


  // Policias
  policias: any[] = [];
  policia_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;
  policiaSeleccionado: any = null;

  searchTimeout: any;

  // Search
  nombreBusqueda: string = '';
  dniBusqueda: string = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(private policiasService: PoliciasService
  ) { }


  ngOnInit(): void {
    this.getPoliciasPaginated();

  }

  // Methods

  // - Policias paginated
  getPoliciasPaginated() {
    this.isLoading = true;

    this.policiasService.getPoliciasPaginated({
      page: this.page,
      limit: this.limit,
      nombres: this.nombreBusqueda?.trim() || undefined,
      dni: this.dniBusqueda?.trim() || undefined,
    }
    ).subscribe({
      next: (res) => {

        this.policias = res.data;
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

  // - Buscador
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getPoliciasPaginated();
    }, 300);
  }

  // - Eliminar policia
  eliminarPolicia(poli: any) {
    Swal.fire({
      title: '¿Eliminar policia?',
      text: `Se eliminará el policia ${poli.nombre}`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.policiasService.deletePolicia(poli.id)
          .subscribe({
            next: (resp) => {

              Swal.fire({
                icon: 'success',
                title: 'Policia eliminado',
                text: resp.message,
                timer: 2000,
                showConfirmButton: false
              });

              this.getPoliciasPaginated();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el policia'
              });

            }
          });

      }

    });
  }

  // - Editar policia
  editarPolicia(poli: any) {
    this.modoEdicion = true;
    this.policiaSeleccionado = { ...poli };
    this.mostrarModal = true;
  }

  // - Ver policia
  verPolicia(poli: any) {
    this.policia_id = poli.id;
    this.mostrarModalInfo = true;
  }


  // Helpers methods
  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getPoliciasPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getPoliciasPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getPoliciasPaginated();
  }

  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // - Modales
  abrirModal() {
    this.modoEdicion = false;
    this.policiaSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalInfo = false;
    this.policia_id = null;
  }

}
