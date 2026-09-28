import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

// Interface
import { ZonaSelectItem } from 'src/app/interfaces/zona/get-zonas-select.model';

@Component({
  selector: 'mapa-zonas-panel',
  imports: [],
  templateUrl: './mapa-zonas-panel.component.html',
  styles: ``,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapaZonasPanelComponent {
  @Input() zonas: ZonaSelectItem[] = [];
  @Input() zonasVisibles: Record<number, boolean> = {};

  @Output() zonaCambiada = new EventEmitter<ZonaSelectItem>();

  panelAbierto = false;

  abrirPanel(): void {
    this.panelAbierto = true;
  }

  cerrarPanel(): void {
    this.panelAbierto = false;
  }

  alternarZona(zona: ZonaSelectItem): void {
    this.zonaCambiada.emit(zona);
  }

  estaVisible(zona: ZonaSelectItem): boolean {
    return Boolean(
      this.zonasVisibles[zona.value]
    );
  }
}
