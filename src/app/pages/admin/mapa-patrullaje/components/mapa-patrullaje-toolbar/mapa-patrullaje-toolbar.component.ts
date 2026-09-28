import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import {
  NgClass,
} from '@angular/common';

@Component({
  selector: 'mapa-patrullaje-toolbar',
  imports: [NgClass],
  templateUrl: './mapa-patrullaje-toolbar.component.html',
  styles: ``
})
export class MapaPatrullajeToolbarComponent {

  @Input() mapaCargado = false;

  @Input() socketConectado = false;

  @Input() trackingActivo = false;

  @Input() cantidadSerenos = 0;


  get estadoTracking(): string {
    if (!this.mapaCargado) {
      return 'Cargando';
    }

    if (!this.socketConectado) {
      return 'Sin conexión';
    }

    if (this.trackingActivo) {
      return 'Activo';
    }

    return 'En espera';
  }

  get claseEstadoTracking(): string {
    if (!this.mapaCargado) {
      return 'bg-warning';
    }

    if (!this.socketConectado) {
      return 'bg-error';
    }

    if (this.trackingActivo) {
      return 'bg-success';
    }

    return 'bg-base-content/35';
  }

  get textoConexion(): string {
    return this.socketConectado
      ? 'Central conectada'
      : 'Central desconectada';
  }

  get iconoConexion(): string {
    return this.socketConectado
      ? 'fa-solid fa-tower-broadcast'
      : 'fa-solid fa-tower-cell';
  }

}
