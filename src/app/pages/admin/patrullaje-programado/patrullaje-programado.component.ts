import { CommonModule, DatePipe } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';


// Service
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje/patrullaje_programado.service';
import { PatrullajeProgramFormComponent } from "./patrullaje-program-form/patrullaje-program-form.component";
import { PatrullajeProgramInfoComponent } from "./patrullaje-program-info/patrullaje-program-info.component";
import { PatrullajeRecorridoComponent } from "./patrullaje-recorrido/patrullaje-recorrido.component";
import { GetPatrullajesPaginatedParams, PatrullajePaginatedItemData } from 'src/app/interfaces/patrullaje_programado/get-patrullajes-paginated.model';
import { finalize } from 'rxjs';
import { ApiErrorData } from '../../shared/interfaces/api-error-data.model';

@Component({
  selector: 'app-patrullaje-programado',
  imports: [DatePipe, FormsModule, PatrullajeProgramFormComponent, CommonModule, PatrullajeProgramInfoComponent, PatrullajeRecorridoComponent, UppercaseDirective],
  templateUrl: './patrullaje-programado.component.html',
  styles: ``
})
export class PatrullajeProgramadoComponent implements OnInit {

  // Unidad patrullaje
  patrullajes: PatrullajePaginatedItemData[] = [];
  patrullaje_id: number | null = null;
  finalizandoPatrullajeId: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;
  patrullajeSeleccionado: any = null;
  mostrarModalRecorrido = false;
  patrullajeRecorridoId: number | null = null;

  searchTimeout: any;

  // Menú de acciones
  menuActivoId: number | null = null;
  dropdownStyle: Record<string, string> = {};

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
  editarPatrullaje(patrullaje: PatrullajePaginatedItemData) {
    this.modoEdicion = true;
    this.patrullajeSeleccionado = { ...patrullaje };
    this.mostrarModal = true;

    console.log("mostrar modal: ", this.mostrarModal);
    console.log("modo Edicion: ", this.modoEdicion);
    console.log("patrullaje Seleccionado: ", this.patrullajeSeleccionado);
  }

  // - Ver historial
  verHistorial(patrulla: PatrullajePaginatedItemData): void {
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
  async finishedPatrullaje(patrullaje: PatrullajePaginatedItemData): Promise<void> {

    if (patrullaje.estado === 'FINALIZADO') {
      void Swal.fire({
        icon: 'info',
        title: 'Patrullaje finalizado',
        text: 'Este patrullaje ya se encuentra finalizado.',
      });

      return;
    }

    /*
     * Evita solicitudes simultáneas.
     */
    if (this.finalizandoPatrullajeId !== null) {
      return;
    }

    const confirmation = await Swal.fire({
      icon: 'warning',
      title: '¿Finalizar patrullaje?',
      text: `El patrullaje #${patrullaje.id} será marcado como finalizado.`,
      showCancelButton: true,
      confirmButtonText: 'Sí, finalizar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    this.finalizandoPatrullajeId = patrullaje.id;

    this.patrullajeService.finishPatrullajeProgramado(patrullaje.id)
      .pipe(
        finalize(() => {
          this.finalizandoPatrullajeId = null;
        }),
      )
      .subscribe({
        next: (response) => {
          const resultado = response.data;

          void Swal.fire({
            icon: 'success',
            title: response.message || 'Patrullaje finalizado',
            text: `Se finalizaron ${resultado.personal_finalizado} asignaciones de personal.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.getPatrullajePaginado();
        },

        error: (error: ApiErrorData,) => {
          void Swal.fire({
            icon: 'error',
            title: 'No se pudo finalizar el patrullaje',
            text: error.message || 'Ocurrió un error inesperado.',
          });
        },
      });
  }

  // - Ver patrullaje
  verPatrullaje(patrullaje: PatrullajePaginatedItemData) {
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
  verRecorrido(patrullajeId: number): void {
    this.patrullajeRecorridoId = patrullajeId;
    this.mostrarModalRecorrido = true;
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

  toggleMenuAcciones(
    event: MouseEvent,
    patrullajeId: number,
  ): void {
    event.stopPropagation();

    /*
     * Si el menú presionado ya estaba abierto, se cierra.
     */
    if (this.menuActivoId === patrullajeId) {
      this.cerrarMenuAcciones();
      return;
    }

    const button = event.currentTarget as HTMLElement;

    const rect =
      button.getBoundingClientRect();

    const menuWidth = 224;
    const estimatedMenuHeight = 250;
    const margin = 8;
    const separation = 6;

    /*
     * Alinear el borde derecho del menú con el botón.
     */
    let left =
      rect.right -
      menuWidth;

    /*
     * Evitar que salga por los laterales.
     */
    left = Math.max(
      margin,
      Math.min(
        left,
        window.innerWidth -
        menuWidth -
        margin,
      ),
    );

    /*
     * Abrir inicialmente debajo del botón.
     */
    let top = rect.bottom + separation;

    const availableBottom = window.innerHeight - rect.bottom;

    /*
     * Si no existe espacio debajo, abrir hacia arriba.
     */
    if (availableBottom < estimatedMenuHeight) {
      top = rect.top - estimatedMenuHeight - separation;
    }

    top = Math.max(
      margin,
      top,
    );

    this.dropdownStyle = {
      top: `${top}px`,
      left: `${left}px`,
    };

    this.menuActivoId =
      patrullajeId;
  }

  // Cerrar menú
  cerrarMenuAcciones(): void {
    this.menuActivoId = null;
    this.dropdownStyle = {};
  }

  // Cerrar al hacer clic fuera
  @HostListener('document:click')
  onDocumentClick(): void {
    this.cerrarMenuAcciones();
  }

  // Cerrar con Escape
  @HostListener('document:keydown.escape')
  onEscapeMenu(): void {
    this.cerrarMenuAcciones();
  }

  // Cerrar si cambia el tamaño o desplazamiento
  @HostListener('window:resize')
  @HostListener('window:scroll')
  onViewportChange(): void {
    this.cerrarMenuAcciones();
  }
}
