import { Component, DestroyRef, inject } from '@angular/core';
import { AsyncPipe, NgClass } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import iziToast from 'izitoast';

// Services
import { AlertasStoreService } from 'src/app/services/alertas/alerta-store.service';

// Interfaces
import { AlertaTiempoReal } from 'src/app/interfaces/alertas/alerta-socket.interface';

@Component({
  selector: 'navbar-alertas',
  imports: [
    AsyncPipe,
    NgClass,
    // RouterLink,
  ],
  templateUrl: './navbar-alertas.component.html',
  styles: ``
})
export class NavbarAlertasComponent {

  private readonly destroyRef = inject(DestroyRef);
  private readonly alertasStoreService = inject(AlertasStoreService);
  private readonly router = inject(Router);

  readonly alertas$ = this.alertasStoreService.alertas$;

  readonly pendientes$ = this.alertasStoreService.pendientes$;

  readonly cantidadPendientes$ = this.alertasStoreService.cantidadPendientes$;

  constructor() {
    this.escucharNuevasAlertas();
  }

  private escucharNuevasAlertas(): void {
    this.alertasStoreService.nuevaAlerta$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((alerta) => {
        iziToast.error({
          title: 'ALERTA OPERATIVA',
          message: `${alerta.titulo}: ${alerta.descripcion}`,
          position: 'topRight',
          timeout: 10000,
          close: true,
          displayMode: 2,
          progressBar: true,
        });
      });
  }

  verAlerta(
    alerta: AlertaTiempoReal
  ): void {
    /*
     * Ajusta la ruta cuando implementes el detalle.
     * Por ahora dirige al módulo principal de alertas.
     */
    this.router.navigate(
      ['/admin/alertas'],
      {
        queryParams: {
          alerta_id: alerta.id,
        },
      }
    );
  }

  verTodasLasAlertas(): void {
    this.router.navigate([
      '/admin/alertas',
    ]);
  }

  obtenerClasePrioridad(
    prioridad: string
  ): string {
    switch (prioridad) {
      case 'CRITICA':
        return 'badge-error';

      case 'ALTA':
        return 'badge-warning';

      case 'MEDIA':
        return 'badge-info';

      default:
        return 'badge-ghost';
    }
  }

  formatearHora(
    fecha: string
  ): string {
    const date = new Date(fecha);

    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(
      'es-PE',
      {
        hour: '2-digit',
        minute: '2-digit',
      }
    ).format(date);
  }

  tieneUbicacion(
    alerta: AlertaTiempoReal
  ): boolean {
    return (
      alerta.latitud !== null &&
      alerta.latitud !== undefined &&
      alerta.longitud !== null &&
      alerta.longitud !== undefined
    );
  }
}
