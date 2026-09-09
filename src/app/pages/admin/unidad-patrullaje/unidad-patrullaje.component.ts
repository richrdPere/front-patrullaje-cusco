import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';


// Services
import { UnidadPatrullajeService } from 'src/app/services/unidad/unidad-patrullaje.service';

// Interface
import { GetUnidadesPaginatedParams } from 'src/app/interfaces/unidad-patrullaje/get-unidades-paginated.model';

// Componentes
import { UnidadFormComponent } from "./unidad-form/unidad-form.component";
import { UnidadInfoComponent } from "./unidad-info/unidad-info.component";

@Component({
  selector: 'app-unidad-patrullaje',
  imports: [DatePipe, FormsModule, UnidadFormComponent, CommonModule, UnidadInfoComponent, UppercaseDirective],
  templateUrl: './unidad-patrullaje.component.html',
  styles: ``
})
export class UnidadPatrullajeComponent implements OnInit {

  // Unidad patrullaje
  unidades: any[] = [];
  unidad_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalInfo = false;
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
    this.getUnidadesPaginated();

  }

  // ================================
  // Methods
  // ================================
  getUnidadesPaginated() {
    const params: GetUnidadesPaginatedParams = {
      page: this.page,
      limit: this.limit,
      placa: this.placaBusqueda,
      descripcion: this.descripcionBusqueda
    };

    this.isLoading = true;

    this.unidadService.getUnidadesPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {

          const paginacion = res.data;

          this.unidades = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.totalPages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.unidades = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  // - Eliminar unidad
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

        this.unidadService.deleteUnidadPatrullaje(unidad.id)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Unidad eliminada',
                text: 'La unidad fue eliminada correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getUnidadesPaginated();
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

  // Editar unidad
  editarUnidad(unidad: any) {
    this.modoEdicion = true;
    this.unidadSeleccionado = { ...unidad };
    this.mostrarModal = true;
  }

  // Ver unidad
  verUnidad(unidad: any) {
    this.unidad_id = unidad.id;
    this.mostrarModalInfo = true;
  }


  getIconoUnidad(
    tipo: string | null | undefined,
  ): string {
    const tipoNormalizado =
      tipo?.trim().toUpperCase() ?? '';

    if (
      tipoNormalizado.includes('MOTO')
    ) {
      return 'fa-motorcycle';
    }

    return 'fa-truck-field-un';
  }

  // ================================
  // Helpers methods
  // ================================
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getUnidadesPaginated();
    }, 300);
  }

  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getUnidadesPaginated();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getUnidadesPaginated();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getUnidadesPaginated();
  }

  getEstadoInfo(estado: string) {
    const map: any = {
      DISPONIBLE: {
        label: 'DISPONIBLE',
        class: 'badge-info'
      },
      EN_PATRULLAJE: {
        label: 'EN_PATRULLAJE',
        class: 'badge-success'
      },
      MANTENIMIENTO: {
        label: 'MANTENIMIENTO',
        class: 'badge-accent'
      },
      FUERA_DE_SERVICIO: {
        label: 'FUERA_DE_SERVICIO',
        class: 'badge-error'
      }
    };

    return map[estado] || {
      label: estado,
      class: 'badge-neutral'
    };
  }

  // ================================
  // Modales methods
  // ================================
  abrirModal() {
    this.modoEdicion = false;
    this.unidadSeleccionado = null;
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  cerrarModalInfo() {
    this.mostrarModalInfo = false;
    this.unidad_id = null;
  }
}
