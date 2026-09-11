import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Interface
import { UsuarioData, UsuariosPaginatedQueryParams } from 'src/app/interfaces/usuarios/get-usuarios-paginated.model';
import { UsuarioRol } from 'src/app/interfaces/usuarios/create-usuario.model';

// Service
import { IncidenciasService } from 'src/app/services/incidencia/incidencias.service';
import { SerenoIncidenciasItemData, SerenosIncidenciasPaginatedQueryParams } from 'src/app/interfaces/incidencia/get-serenos-incidencias-paginated.interface';

@Component({
  selector: 'app-incidencias-serenos',
  imports: [FormsModule, CommonModule, UppercaseDirective],
  templateUrl: './incidencias-serenos.component.html',
  styles: ``
})
export class IncidenciasSerenosComponent implements OnInit {

  // Usuarios
  usuarios: SerenoIncidenciasItemData[] = [];
  usuario_id: number | null = null;
  isLoading = true;
  usuarioSeleccionado: UsuarioData | null = null;

  searchTimeout: any;

  // Search
  nombreBusqueda: string = '';
  dniBusqueda: string = '';
  rolesBusqueda: UsuarioRol | '' = '';

  // Paginado
  page = 1;
  limit = 5;
  totalItems = 0;
  totalPages = 0;
  currentPage = 1;

  pageSizeOptions = [5, 10, 20, 50];

  constructor(
    private incidenciaService: IncidenciasService,
    private readonly router: Router,
  ) { }

  ngOnInit(): void {
    this.getUsuariosPaginados();
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
  getUsuariosPaginados() {
    const params: SerenosIncidenciasPaginatedQueryParams = {
      page: this.page,
      limit: this.limit,
      nombres: this.nombreBusqueda.trim() || undefined,
      dni: this.dniBusqueda.trim() || undefined,
    };

    this.isLoading = true;

    this.incidenciaService.getSerenosIncidenciasPaginated(params)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (res) => {
          const paginacion = res.data;

          this.usuarios = paginacion.rows;
          this.totalItems = paginacion.total;
          this.currentPage = paginacion.page;

          this.page = paginacion.page;
          this.limit = paginacion.limit;
          this.totalPages = paginacion.totalPages;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;

          this.usuarios = [];
          this.totalItems = 0;
          this.totalPages = 0;
        }
      });
  }

  // VER INCIDENCIA SERENO
  verIncidenciasSereno(usuario: UsuarioData) {
    if (!usuario?.id) {
      return;
    }

    const nombreCompleto = [
      usuario.persona.nombres,
      usuario.persona.apellidos,
    ]
      .filter(Boolean)
      .join(' ');

    void this.router.navigate(
      [
        '/admin',
        'incidentes-serenos',
        usuario.id,
      ],
      {
        state: {
          nombreSereno: nombreCompleto,
          documentoSereno:
            usuario.persona.documento_identidad,
        },
      },
    );
  }


  // BUSCADOR
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getUsuariosPaginados();
    }, 300);
  }

  // CERRAR EXPEDIENTE Y VOLVER A LAS CARDS
  cerrarListadoIncidencias(): void {
    this.usuario_id = null;
    this.usuarioSeleccionado = null;

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  // ================================
  // Helpers methods
  // ================================
  onPageSizeChange() {
    this.currentPage = 1; // vuelve a la primera página
  }

  onFiltroChange() {
    this.page = 1;
    this.getUsuariosPaginados();
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina < 1 || nuevaPagina > this.totalPages) return;
    this.page = nuevaPagina;
    this.getUsuariosPaginados();
  }

  cambiarLimite() {
    this.limit = Number(this.limit);
    this.page = 1;
    this.getUsuariosPaginados();
  }

  soloNumeros(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  limpiarFiltros(): void {
    this.nombreBusqueda = '';
    this.dniBusqueda = '';
    this.rolesBusqueda = '';
    this.page = 1;

    this.getUsuariosPaginados();
  }
}
