import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Interface
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';

// Service
import { UsuarioService } from 'src/app/services/usuarios/usuarios.service';
import { UsuarioFormComponent } from "./usuario-form/usuario-form.component";
import { UsuarioInfoComponent } from "./usuario-info/usuario-info.component";
import { UsuarioData, UsuariosPaginatedQueryParams } from 'src/app/interfaces/usuarios/get-usuarios-paginated.model';
import { UsuarioRol } from 'src/app/interfaces/usuarios/create-usuario.model';
import { finalize } from 'rxjs';


@Component({
  selector: 'app-usuarios',
  imports: [DatePipe, FormsModule, UsuarioFormComponent, CommonModule, UppercaseDirective, UsuarioInfoComponent],
  templateUrl: './usuarios.component.html',
  styles: ``
})
export class UsuariosComponent implements OnInit {

  // Usuarios
  usuarios: UsuarioData[] = [];
  usuario_id: number | null = null;
  isLoading = true;
  usuarioSeleccionado: UsuarioData | null = null;

  // Modales
  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;

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

  constructor(private usuarioService: UsuarioService
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

    const params: UsuariosPaginatedQueryParams = {
      page: this.page,
      limit: this.limit,
      nombres: this.nombreBusqueda.trim() || undefined,
      dni: this.dniBusqueda.trim() || undefined,
      rol: this.rolesBusqueda || undefined,
    };

    this.isLoading = true;

    this.usuarioService.getUsuariosPaginados(params)
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

          // this.isLoading = false;
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

  // BUSCADOR
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getUsuariosPaginados();
    }, 300);
  }

  // EDITAR USUARIO
  editarUsuario(user: UsuarioData) {

    this.modoEdicion = true;
    this.usuarioSeleccionado = { ...user };
    this.mostrarModal = true;
  }

  // ELIMINAR USUARIO
  eliminarUsuario(usuario: UsuarioData) {
    Swal.fire({
      title: '¿Eliminar usuario?',
      text: `Se eliminará el usuario`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    }).then((result) => {

      if (result.isConfirmed) {

        this.usuarioService.deleteUsuario(usuario.id)
          .subscribe({
            next: () => {

              Swal.fire({
                icon: 'success',
                title: 'Usuario eliminado',
                text: 'El usuario fue eliminado correctamente',
                timer: 2000,
                showConfirmButton: false
              });

              this.getUsuariosPaginados();
            },
            error: (err) => {

              console.error(err);

              Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo eliminar el usuario'
              });

            }
          });

      }

    });
  }

  // RESETEAR  USUARIO
  // ========================================================
  // RESETEAR CONTRASEÑA DEL USUARIO
  // ========================================================

  resetPassword(
    id: number,
  ): void {
    Swal.fire({
      icon: 'warning',
      title: '¿Restablecer contraseña?',
      html: `
      <p>
        La contraseña del usuario volverá a ser
        su <strong>DNI</strong>.
      </p>

      <p class="mt-2">
        Sus sesiones activas serán cerradas y deberá
        cambiar la contraseña en su próximo inicio
        de sesión.
      </p>
    `,

      showCancelButton: true,
      confirmButtonText: 'Sí, restablecer',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#f59e0b',
      cancelButtonColor: '#64748b',

      reverseButtons: true,

      focusCancel: true,
    }).then((result) => {
      if (!result.isConfirmed) {
        return;
      }

      // Mostrar carga mientras se procesa.
      Swal.fire({
        title:
          'Restableciendo contraseña...',

        text:
          'Espera un momento.',

        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,

        didOpen: () => {
          Swal.showLoading();
        },
      });

      this.usuarioService
        .resetPasswordUsuario(id)
        .subscribe({
          next: (response) => {
            Swal.fire({
              icon: 'success',
              title: 'Contraseña restablecida',
              text: response.message,
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#3085d6',
            });
          },

          error: (error) => {
            console.error(
              'Error restableciendo contraseña:',
              error,
            );

            Swal.fire({
              icon: 'error',
              title: 'No se pudo restablecer',
              text: error?.error?.message ??
                error?.message ??
                'Ocurrió un error al restablecer la contraseña del usuario.',
              confirmButtonText: 'Aceptar',
              confirmButtonColor: '#d33',
            });
          },
        });
    });
  }


  // VER USUARIO
  verUsuario(user: UsuarioData) {
    this.usuario_id = user.id;
    this.mostrarModalInfo = true;
  }

  // CAMBIAR ESTADO
  cambiarEstado(usuario: UsuarioData) {

    this.usuarioService
      .changeStateUsuario(usuario.id, !usuario.estado)
      .subscribe({
        next: (res) => {

          usuario.estado = res.data.estado;

          Swal.fire({
            icon: 'success',
            title: res.message,
            timer: 1500,
            showConfirmButton: false
          });
        },
        error: (err) => console.error(err)
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

  // MODAL
  abrirModal() {
    this.modoEdicion = false;
    this.usuarioSeleccionado = null;
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
