import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Service
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';
import { PatrullajeProgramFormComponent } from "./patrullaje-program-form/patrullaje-program-form.component";
import { PatrullajeProgramInfoComponent } from "./patrullaje-program-info/patrullaje-program-info.component";
import { PatrullajeRecorridoComponent } from "./patrullaje-recorrido/patrullaje-recorrido.component";
import { GetPatrullajesPaginatedParams } from 'src/app/interfaces/patrullaje_programado/get-patrullajes-paginated.model';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-patrullaje-programado',
  imports: [DatePipe, FormsModule, PatrullajeProgramFormComponent, CommonModule, PatrullajeProgramInfoComponent, PatrullajeRecorridoComponent],
  templateUrl: './patrullaje-programado.component.html',
  styles: ``
})
export class PatrullajeProgramadoComponent implements OnInit {

  // Unidad patrullaje
  patrullajes: any[] = [];
  patrullaje_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;
  patrullajeSeleccionado: any = null;
  mostrarModalRecorrido = false;
  patrullajeRecorridoId: number | null = null;

  searchTimeout: any;

  menuActivo: any = null;
  dropdownStyle: any = {};

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
    private patrullajeService: PatrullajeProgramadoService,
    private router: Router
  ) { }


  ngOnInit(): void {
    this.getPatrullajePaginado();

  }

  // ================================
  // Methods
  // ================================
  getPatrullajePaginado() {

    const params: GetPatrullajesPaginatedParams = {
      page: this.page,
      limit: this.limit,
      descripcion: this.descripcionBusqueda?.trim() || '',
      fecha: this.fechaBusqueda?.trim() || '',
    };

    this.isLoading = true;

    this.patrullajeService.getPatrullajesPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const paginacion = res.data;

          this.patrullajes = paginacion.items;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.totalPages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
        }
      });
  }

  // - Eliminar patrullaje
  eliminarPatrullaje(patrullaje: any) {
    Swal.fire({
      title: '¿Eliminar Programación?',
      text: `Se eliminará el operativo programado`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.patrullajeService.deletePatrullajeProgramado(patrullaje.id)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Operativo eliminado',
                text: 'El operativo fue eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getPatrullajePaginado();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el operativo'
              });

            }
          });

      }

    });
  }

  // - Editar patrullaje
  editarPatrullaje(patrullaje: any) {
    this.modoEdicion = true;
    this.patrullajeSeleccionado = { ...patrullaje };
    this.mostrarModal = true;
  }

  // - Ver historial
  verHistorial(patrulla: any): void {
    if (!patrulla?.id) {
      return;
    }

    this.router.navigate([
      '/admin',
      'patrullaje-programado',
      patrulla.id
    ]);
  }

  // - Finalizar patrullaje
  finishedPatrullaje(_t73: any) {
    throw new Error('Method not implemented.');
  }

  // - Ver patrullaje
  verPatrullaje(patrullaje: any) {
    this.patrullaje_id = patrullaje.id;
    this.mostrarModalInfo = true;
  }

  // - Crear patrullaje
  abrirModal() {
    this.modoEdicion = false;
    this.patrullajeSeleccionado = null;
    this.mostrarModal = true;
  }


  // - Ver modal de recorrido de patrullaje
  verRecorrido(
    patrullajeId: number
  ): void {

    this.patrullajeRecorridoId =
      patrullajeId;

    this.mostrarModalRecorrido =
      true;
  }

  // - Buscador
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getPatrullajePaginado();
    }, 300);
  }

  // ================================
  // Helpers methods
  // ================================
  toggleDropdown(event: MouseEvent, opciones: any) {
    event.stopPropagation();

    const button = event.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();

    this.menuActivo = opciones;

    this.dropdownStyle = {
      top: `${rect.bottom + 8}px`,
      left: `${rect.right - 200}px`, // ancho del menú
    };
  }

  // Cerrar al hacer click fuera
  @HostListener('document:click')
  cerrarDropdown() {
    this.menuActivo = null;
  }

  getEstadoClass(estado: string): string {

    switch (estado) {

      case 'PROGRAMADO':
        return 'badge-soft badge-secondary';

      case 'ASIGNADO':
        return 'badge-soft badge-primary';

      case 'ACEPTADO':
        return 'badge-soft badge-info';

      case 'EN_CURSO':
        return 'badge-soft badge-success';

      case 'FINALIZADO':
        return 'badge-soft badge-dark';

      default:
        return 'badge-soft badge-light';
    }
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

  cerrarModalInfo() {
    this.mostrarModalInfo = false;
    this.patrullaje_id = null;
  }

  cerrarModalRecorrido(): void {
    this.mostrarModalRecorrido = false;
    this.patrullajeRecorridoId = null;
  }

}
