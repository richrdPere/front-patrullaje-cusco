import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';

@Component({
  selector: 'mapa-tracking-resumen',
  standalone: true,
  imports: [NgClass],
  templateUrl: './mapa-tracking-resumen.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaTrackingResumenComponent {
  @Input() mapaCargado = false;

  @Input() socketConectado = false;

  @Input() trackingActivo = false;

  @Input() cantidadSerenos = 0;

  get estadoPrincipal(): string {
    if (!this.mapaCargado) {
      return 'Preparando monitoreo';
    }

    if (!this.socketConectado) {
      return 'Sin conexión con central';
    }

    if (!this.trackingActivo) {
      return 'Esperando ubicaciones';
    }

    return 'Monitoreo activo';
  }

  get claseEstado(): string {
    if (!this.mapaCargado) {
      return 'text-warning';
    }

    if (!this.socketConectado) {
      return 'text-error';
    }

    if (this.trackingActivo) {
      return 'text-success';
    }

    return 'text-base-content/55';
  }

  get clasePunto(): string {
    if (!this.mapaCargado) {
      return 'bg-warning';
    }

    if (!this.socketConectado) {
      return 'bg-error';
    }

    if (this.trackingActivo) {
      return 'bg-success animate-pulse';
    }

    return 'bg-base-content/35';
  }

  get textoSerenos(): string {
    if (this.cantidadSerenos === 1) {
      return '1 sereno en mapa';
    }

    return `${this.cantidadSerenos} serenos en mapa`;
  }
}
