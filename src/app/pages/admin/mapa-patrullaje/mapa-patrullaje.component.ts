import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  OnDestroy,
  ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';

// Interfaces
import { Lugar } from 'src/app/interfaces/lugar';
import { ZonaPatrullaje } from 'src/app/interfaces/zonaPatrullaje';
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';
import { GetZonasSelectResponse, ZonaSelectItem } from 'src/app/interfaces/zona/get-zonas-select.model';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona/zona.service';
import { TrackingService } from 'src/app/services/mapa-tracking/tracking.service';
import { MapaTrackingService } from 'src/app/services/mapa-tracking/mapa-tracking.service';
import { TrackingStoreService } from 'src/app/services/mapa-tracking/tracking-store.service';
import { SocketService } from 'src/app/services/socket.service';
import { AlertasStoreService } from 'src/app/services/alertas/alerta-store.service';
import { AlertaTiempoReal } from 'src/app/interfaces/alertas/alerta-socket.interface';
import { MapaPatrullajeToolbarComponent } from './components/mapa-patrullaje-toolbar/mapa-patrullaje-toolbar.component';
import { MapaTrackingResumenComponent } from './components/mapa-tracking-resumen/mapa-tracking-resumen.component';
import { MapaZonasPanelComponent } from './components/mapa-zonas-panel/mapa-zonas-panel.component';

@Component({
  selector: 'mapa-patrullaje',
  imports: [CommonModule, MapaPatrullajeToolbarComponent, MapaTrackingResumenComponent, MapaZonasPanelComponent],
  templateUrl: './mapa-patrullaje.component.html',
  styles: `
  :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
    }
  `
})
export class MapaPatrullajeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('map')
  mapaElement!: ElementRef<HTMLDivElement>;

  @ViewChild('zonaPanel')
  zonaPanel!: ElementRef<HTMLElement>;

  // =====================================================
  // DESTRUCCIÓN DE OBSERVABLES
  // =====================================================
  private readonly destroy$ = new Subject<void>();

  // =====================================================
  // MAPA
  // =====================================================

  map!: google.maps.Map;

  mapaCargado = false;
  panelVisible = true;

  // =====================================================
  // TRACKING
  // =====================================================

  trackingActivo = false;
  cantidadSerenos = 0;

  /**
   * Último timestamp procesado por sereno.
   *
   * Evita volver a actualizar marcadores
   * cuando el store emite nuevamente todo el Map.
   */
  // private readonly ultimoTrackingProcesado = new Map<number, number>();
  private destruido = false;

  socketConectado = false;

  // El store reemplaza el objeto cuando cambia el GPS
  // o el estado online/offline.
  private readonly ultimoTrackingProcesado = new Map<number, TrackingPayload>();

  private readonly alertaInfoWindows = new Set<google.maps.InfoWindow>();

  private readonly poligonosTemporales = new Set<google.maps.Polygon>();

  // =====================================================
  // ALERTAS
  // =====================================================

  alertMarkers: google.maps.Marker[] = [];

  /**
   * Timeouts usados para retirar marcadores de alerta.
   * Se limpian cuando el componente es destruido.
   */
  private readonly alertaTimeouts =
    new Set<ReturnType<typeof setTimeout>>();

  // =====================================================
  // ZONAS
  // =====================================================
  zonas: ZonaSelectItem[] = [];
  zonasVisibles: Record<number, boolean> = {};
  poligonos: Record<number, google.maps.Polygon> = {};

  // =====================================================
  // PANEL ARRASTRABLE
  // =====================================================

  private isDragging = false;

  private offset = {
    x: 0,
    y: 0
  };

  constructor(
    private readonly mapsLoader: GoogleMapsLoaderService,
    private readonly zonaService: ZonaService,
    // private readonly trackingService: TrackingService,
    private readonly mapaTrackingService: MapaTrackingService,
    private readonly trackingStoreService: TrackingStoreService,
    private readonly socketService: SocketService,
    private readonly alertasStoreService: AlertasStoreService,
  ) { }

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  async ngAfterViewInit(): Promise<void> {
    try {
      // 1. Cargar API Google Maps
      await this.mapsLoader.load();

      if (this.destruido) return;

      // 2. Crear mapa
      this.initMapa();

      // 3. Reconstruir marcadores persistidos
      // this.mapaTrackingService.reconstruirMarcadores(this.map);
      this.mapaTrackingService.limpiarTodo();
      this.ultimoTrackingProcesado.clear();

      // 4. Cargar zonas
      this.loadZonas();

      // 5. Escuchar tracking y alertas
      this.initTracking();

      // 6. Sincronizar estado inicial
      this.cantidadSerenos = this.mapaTrackingService.obtenerCantidadSerenos();

      this.trackingActivo = this.cantidadSerenos > 0;

      this.mapaCargado = true;

      // 7. Los listeners ya están registrados.
      this.socketService.connect();


    } catch (error) {
      if (this.destruido) return;

      this.mapaCargado = false;

      console.error(
        '❌ No se pudo inicializar el mapa:',
        error
      );

    }
  }

  ngOnDestroy(): void {
    this.destruido = true;

    this.destroy$.next();
    this.destroy$.complete();

    this.isDragging = false;

    this.alertaTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });
    this.alertaTimeouts.clear();

    this.alertaInfoWindows.forEach(infoWindow => {
      infoWindow.close();
    });
    this.alertaInfoWindows.clear();

    this.alertMarkers.forEach(marker => {
      marker.setMap(null);
      google.maps.event.clearInstanceListeners(marker);
    });
    this.alertMarkers = [];

    Object.values(this.poligonos).forEach(polygon => {
      polygon.setMap(null);
    });
    this.poligonos = {};

    this.poligonosTemporales.forEach(polygon => {
      polygon.setMap(null);
    });
    this.poligonosTemporales.clear();

    this.mapaTrackingService.limpiarTodo();
    this.ultimoTrackingProcesado.clear();

    // El store conserva los datos para volver a entrar.
    // El socket global continúa disponible para otros módulos.
  }

  // =====================================================
  // INICIALIZAR TRACKING
  // =====================================================
  private initTracking(): void {
    this.socketService.connected$
      .pipe(takeUntil(this.destroy$))
      .subscribe(connected => {
        this.socketConectado = connected;
      });

    this.trackingStoreService.tracking$
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: trackingMap => {
          this.procesarTrackingMap(trackingMap);
        },
        error: error => {
          console.error(
            '❌ Error recibiendo el estado de tracking:',
            error
          );
        }
      });

    this.alertasStoreService.nuevaAlerta$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (alerta) => {
          this.mostrarNuevaAlertaEnMapa(alerta);
        },
        error: (error) => {
          console.error(
            '❌ Error recibiendo alerta en el mapa:',
            error
          );
        },
      });
  }

  // =====================================================
  // PROCESAR ESTADO DE TRACKING
  // =====================================================
  private mostrarNuevaAlertaEnMapa(
    alerta: AlertaTiempoReal
  ): void {
    this.mostrarAlerta(alerta);
  }

  private procesarTrackingMap(
    trackingMap: ReadonlyMap<number, TrackingPayload>
  ): void {
    if (this.destruido || !this.map) return;

    // Retirar usuarios eliminados del store.
    for (const usuarioId of this.ultimoTrackingProcesado.keys()) {
      if (!trackingMap.has(usuarioId)) {
        this.mapaTrackingService.removerSereno(usuarioId);
        this.ultimoTrackingProcesado.delete(usuarioId);
      }
    }

    for (const [usuarioId, tracking] of trackingMap) {
      const anterior =
        this.ultimoTrackingProcesado.get(usuarioId);

      if (anterior === tracking) {
        continue;
      }

      // No mezclar rutas de distintos patrullajes.
      if (
        anterior &&
        anterior.patrullaje.id !== tracking.patrullaje.id
      ) {
        this.mapaTrackingService.removerSereno(usuarioId);
      }

      this.mapaTrackingService.actualizarTracking(
        this.map,
        tracking
      );

      this.ultimoTrackingProcesado.set(
        usuarioId,
        tracking
      );
    }

    // Cantidad de serenos con ubicación guardada,
    // no necesariamente conectados.
    this.cantidadSerenos = trackingMap.size;
    this.trackingActivo = this.cantidadSerenos > 0;
  }

  // =====================================================
  // MAPA
  // =====================================================
  private initMapa(): void {
    const center = {
      lat: -13.518219, // -13.540348,
      lng: -71.978301 //-71.982898
    };


    this.map = new google.maps.Map(
      this.mapaElement.nativeElement,
      {
        center,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        fullscreenControl: true,
        mapTypeControl: true,

        gestureHandling: 'greedy'
      }
    );
  }

  // =====================================================
  // ALERTAS
  // =====================================================
  private mostrarAlerta(data: AlertaTiempoReal): void {

    if (!this.map) {
      return;
    }

    const lat = Number(data?.latitud);

    const lng = Number(data?.longitud);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      console.warn(
        '⚠️ Alerta sin coordenadas válidas:',
        data
      );

      return;
    }

    if (
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      console.warn(
        '⚠️ Coordenadas de alerta fuera de rango:',
        data
      );

      return;
    }

    const usuarioId = data.emisor_id ?? null;

    const marker = new google.maps.Marker({
      position: {
        lat,
        lng
      },
      map: this.map,
      title: data.titulo ?? 'Alerta de serenazgo',
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
        scaledSize: new google.maps.Size(
          44,
          44
        )
      },
      animation: google.maps.Animation.BOUNCE
    });

    this.alertMarkers.push(
      marker
    );

    const infoWindow = new google.maps.InfoWindow({
      content: `
          <div style="
            width:240px;
            font-family:Arial,sans-serif;
          ">
            <div style="
              color:#DC2626;
              font-weight:700;
              font-size:15px;
              margin-bottom:8px;
            ">
              🚨 ${this.escapeHtml(
        data.titulo ??
        'ALERTA DE SERENAZGO'
      )}
            </div>

            ${data.descripcion
          ? `
                  <div style="
                    margin-bottom:8px;
                    color:#374151;
                  ">
                    ${this.escapeHtml(
            data.descripcion
          )}
                  </div>
                `
          : ''
        }

            <div style="
              font-size:12px;
              color:#6B7280;
            ">
              ${usuarioId !== null
          ? `Sereno ID: ${usuarioId}`
          : 'Usuario no identificado'
        }
            </div>
          </div>
        `
    });

    this.alertaInfoWindows.add(infoWindow);

    infoWindow.open({
      map: this.map,
      anchor: marker
    });

    this.map.panTo({
      lat,
      lng
    });

    const timeout = setTimeout(() => {

      marker.setMap(null);
      infoWindow.close();
      this.alertaInfoWindows.delete(infoWindow);

      this.alertMarkers = this.alertMarkers.filter(
        currentMarker =>
          currentMarker !== marker
      );

      this.alertaTimeouts.delete(
        timeout
      );

    }, 10_000);

    this.alertaTimeouts.add(
      timeout
    );
  }

  // =====================================================
  // ZONAS
  // =====================================================
  loadZonas(): void {
    this.zonaService.getZonasSelect({})
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (res: GetZonasSelectResponse) => {
          this.zonas = res.data.items;
        },

        error: error => {
          console.error(
            '❌ Error obteniendo zonas:',
            error
          );
        }
      });
  }

  toggleZona(zona: ZonaSelectItem): void {

    const visible =
      this.zonasVisibles[
      zona.value
      ];

    if (visible) {
      const poligono =
        this.poligonos[
        zona.value
        ];

      if (poligono) {
        poligono.setMap(null);
      }

      this.zonasVisibles[
        zona.value
      ] = false;

      return;
    }

    this.showZona(zona);
  }

  private showZona(zona: ZonaSelectItem): void {

    if (!Array.isArray(zona.coordenadas) || zona.coordenadas.length === 0) {
      console.warn(
        '⚠️ Zona sin coordenadas:',
        zona
      );

      return;
    }

    const color = this.getColorByRiesgo(zona.riesgo);

    /*
     * Reutilizar polígono si ya fue creado.
     */
    const poligonoExistente = this.poligonos[zona.value];

    if (poligonoExistente) {
      poligonoExistente.setMap(
        this.map
      );

      this.zonasVisibles[zona.value] = true;

      this.fitZonaBounds(zona);

      return;
    }

    const polygon = new google.maps.Polygon({
      paths: zona.coordenadas,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.35,
      clickable: true
    });

    polygon.setMap(
      this.map
    );

    this.poligonos[zona.value] = polygon;

    this.zonasVisibles[zona.value] = true;

    this.fitZonaBounds(
      zona
    );
  }

  private getColorByRiesgo(
    riesgo: string
  ): string {

    switch (
    riesgo?.toLowerCase()
    ) {
      case 'alto':
        return '#DC2626';

      case 'medio':
        return '#F59E0B';

      default:
        return '#16A34A';
    }
  }

  private fitZonaBounds(zona: ZonaSelectItem): void {

    if (!zona.coordenadas?.length) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    zona.coordenadas
      .forEach(coord => {

        const lat = Number(coord.lat);
        const lng = Number(coord.lng);

        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          bounds.extend({
            lat,
            lng
          });
        }
      });

    if (!bounds.isEmpty()) {
      this.map.fitBounds(
        bounds
      );
    }
  }

  // =====================================================
  // MÉTODO OPCIONAL PARA DIBUJAR ZONA DIRECTAMENTE
  // =====================================================

  dibujarZonaPatrullaje(
    zona: {
      coordenadas:
      google.maps.LatLngLiteral[];
    }
  ): void {

    if (
      !this.map ||
      !zona?.coordenadas?.length
    ) {
      return;
    }

    const polygon = new google.maps.Polygon({
      paths: zona.coordenadas,
      strokeColor: '#0AD962',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0AD962',
      fillOpacity: 0.25,
      map: this.map
    });


    /*
     * Este método crea un polígono temporal.
     * Si luego quieres eliminarlo, debes guardarlo.
     */
    this.poligonosTemporales.add(polygon);

    console.log('🟢 Zona temporal dibujada:', polygon);
  }

  // =====================================================
  // PANEL
  // =====================================================

  mostrarPanel(): void {
    this.panelVisible = true;
  }

  ocultarPanel(): void {
    this.panelVisible = false;
  }

  // =====================================================
  // DRAG PANEL
  // =====================================================
  @HostListener(
    'document:mousedown',
    ['$event']
  )
  onMouseDown(
    event: MouseEvent
  ): void {

    const panel =
      this.zonaPanel
        ?.nativeElement;

    if (
      !panel ||
      !panel.contains(
        event.target as Node
      )
    ) {
      return;
    }

    /*
     * Evitar arrastrar el panel cuando
     * se interactúa con inputs o botones.
     */
    const target =
      event.target as HTMLElement;

    if (
      target.closest(
        'button, input, select, textarea, a'
      )
    ) {
      return;
    }

    this.isDragging = true;

    const rect =
      panel.getBoundingClientRect();

    this.offset = {
      x:
        event.clientX -
        rect.left,

      y:
        event.clientY -
        rect.top
    };
  }

  @HostListener(
    'document:mousemove',
    ['$event']
  )
  onMouseMove(
    event: MouseEvent
  ): void {

    if (
      !this.isDragging
    ) {
      return;
    }

    const panel = this.zonaPanel?.nativeElement;

    if (!panel) {
      return;
    }

    const maxLeft = window.innerWidth - panel.offsetWidth;

    const maxTop = window.innerHeight - panel.offsetHeight;

    const left = Math.min(Math.max(event.clientX - this.offset.x, 0),
      Math.max(maxLeft, 0)
    );

    const top = Math.min(
      Math.max(event.clientY - this.offset.y, 0),
      Math.max(maxTop, 0)
    );

    panel.style.left = `${left}px`;

    panel.style.top = `${top}px`;

    panel.style.right = 'auto';
  }

  @HostListener(
    'document:mouseup'
  )
  onMouseUp(): void {
    this.isDragging = false;
  }

  // =====================================================
  // SEGURIDAD HTML
  // =====================================================
  private escapeHtml(
    value: string
  ): string {

    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
