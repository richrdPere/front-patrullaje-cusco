import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';


// Interface
import { Usuario } from 'src/app/interfaces/login/usuarioResponse';

// Service
import { UsuarioService } from 'src/app/services/usuarios.service';
import { UsuarioFormComponent } from "./usuario-form/usuario-form.component";
import { UsuarioInfoComponent } from "./usuario-info/usuario-info.component";


@Component({
  selector: 'app-usuarios',
  imports: [DatePipe, FormsModule, UsuarioFormComponent, CommonModule, UppercaseDirective, UsuarioInfoComponent],
  templateUrl: './usuarios.component.html',
  styles: ``
})
export class UsuariosComponent implements OnInit {


  // Usuarios
  usuarios: Usuario[] = [];
  usuario_id: number | null = null;
  isLoading = true;

  mostrarModal = false;
  mostrarModalInfo = false;
  modoEdicion = false;
  usuarioSeleccionado: Usuario | null = null;

  searchTimeout: any;

  // Search
  nombreBusqueda: string = '';
  dniBusqueda: string = '';
  rolesBusqueda: string = '';

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

  // ================================
  // Methods
  // ================================
  getUsuariosPaginados() {
    this.isLoading = true;

    this.usuarioService.getUsuariosPaginados({
      page: this.page,
      limit: this.limit,
      nombres: this.nombreBusqueda?.trim() || undefined,
      dni: this.dniBusqueda?.trim() || undefined,
      rol: this.rolesBusqueda?.trim() || undefined,
    }
    ).subscribe({
      next: (res) => {

        this.usuarios = res.data;
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

  // BUSCADOR
  onSearchChange() {
    clearTimeout(this.searchTimeout);

    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.getUsuariosPaginados();
    }, 300);
  }

  // EDITAR USUARIO
  editarUsuario(user: Usuario) {

    this.modoEdicion = true;
    this.usuarioSeleccionado = { ...user };
    this.mostrarModal = true;
  }

  // ELIMINAR USUARIO
  eliminarUsuario(usuario: Usuario) {
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

  // VER USUARIO
  verUsuario(user: Usuario) {
    this.usuario_id = user.id;
    this.mostrarModalInfo = true;
  }


  // CAMBIAR ESTADO
  cambiarEstado(usuario: Usuario) {

    this.usuarioService
      .changeStateUsuario(usuario.id, !usuario.estado)
      .subscribe({
        next: (res) => {

          usuario.estado = res.usuario.estado;

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
