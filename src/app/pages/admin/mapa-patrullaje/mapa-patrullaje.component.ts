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

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona.service';
import { TrackingService } from 'src/app/services/mapa-tracking/tracking.service';
import { MapaTrackingService } from 'src/app/services/mapa-tracking/mapa-tracking.service';
import { TrackingStoreService } from 'src/app/services/mapa-tracking/tracking-store.service';



interface AlertaMapaPayload {
  lat: number;
  lng: number;
  userId?: number;
  usuarioId?: number;
  titulo?: string;
  descripcion?: string;
}

@Component({
  selector: 'mapa-patrullaje',
  imports: [CommonModule],
  templateUrl: './mapa-patrullaje.component.html',
  styles: ``
})
export class MapaPatrullajeComponent implements AfterViewInit, OnDestroy {

  @ViewChild('map')
  mapaElement!: ElementRef<HTMLDivElement>;

  @ViewChild('zonaPanel')
  zonaPanel!: ElementRef<HTMLElement>;

  // =====================================================
  // DESTRUCCIÓN DE OBSERVABLES
  // =====================================================

  private readonly destroy$ =
    new Subject<void>();

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
  private readonly ultimoTrackingProcesado =
    new Map<number, number>();

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
  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: Record<number, boolean> = {};
  poligonos: Record<number, google.maps.Polygon> = {};

  // =====================================================
  // LUGARES DE REFERENCIA
  // =====================================================

  lugares: Lugar[] = [
    {
      nombre: 'Unsaac',
      lat: -13.52189,
      lng: -71.95828
    },
    {
      nombre: 'Ex PRONAA',
      lat: -13.53109,
      lng: -71.94069
    },
    {
      nombre: 'Gobierno Regional Cusco',
      lat: -13.52493,
      lng: -71.96274
    }
  ];

  // =====================================================
  // PANEL ARRASTRABLE
  // =====================================================

  private isDragging = false;

  private offset = {
    x: 0,
    y: 0
  };

  constructor(
    private readonly mapsLoader:
      GoogleMapsLoaderService,

    private readonly zonaService:
      ZonaService,

    private readonly trackingService:
      TrackingService,

    private readonly mapaTrackingService:
      MapaTrackingService,

    private readonly trackingStoreService:
      TrackingStoreService
  ) { }

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  async ngAfterViewInit(): Promise<void> {
    try {
      // 1. Cargar API Google Maps
      await this.mapsLoader.load();

      // 2. Crear mapa
      this.initMapa();

      // 3. Reconstruir marcadores persistidos
      this.mapaTrackingService.reconstruirMarcadores(this.map);

      // 4. Cargar zonas
      this.loadZonas();

      // 5. Escuchar tracking y alertas
      this.initTracking();

      // 6. Sincronizar estado inicial
      this.cantidadSerenos = this.mapaTrackingService.obtenerCantidadSerenos();

      this.trackingActivo = this.cantidadSerenos > 0;

      this.mapaCargado = true;

      console.log("Cantidad de serenos activos:", this.cantidadSerenos);
      console.log(
        '🗺️ Mapa de patrullaje cargado correctamente'
      );
    } catch (error) {
      this.mapaCargado = false;

      console.error(
        '❌ No se pudo inicializar el mapa:',
        error
      );
    }
  }

  ngOnDestroy(): void {
    // Finalizar observables
    this.destroy$.next();
    this.destroy$.complete();

    // Detener movimiento del panel
    this.isDragging = false;

    // Limpiar marcadores temporales de alerta
    this.alertMarkers.forEach(marker => {
      marker.setMap(null);
    });

    this.alertMarkers = [];

    // Limpiar timeouts pendientes
    this.alertaTimeouts.forEach(timeout => {
      clearTimeout(timeout);
    });

    this.alertaTimeouts.clear();

    /*
     * No se llama limpiarTodo() porque el servicio
     * conserva los marcadores para reconstruirlos
     * cuando el usuario regrese al componente.
     *
     * limpiarTodo() debe reservarse para logout.
     */
  }

  // =====================================================
  // INICIALIZAR TRACKING
  // =====================================================
  private initTracking(): void {
    this.trackingStoreService
      .tracking$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: trackingMap => {
          this.procesarTrackingMap(
            trackingMap
          );
        },
        error: error => {
          console.error(
            '❌ Error en tracking:',
            error
          );
        }
      });

    this.trackingService.listenAlertas()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: data => {
          this.mostrarAlerta(
            data as AlertaMapaPayload
          );
        },
        error: error => {
          console.error(
            '❌ Error en alertas:',
            error
          );
        }
      });

    this.trackingService.unirseCentralTracking();


    this.trackingService.listenSerenoOffline()
      .subscribe(payload => {
        this.mapaTrackingService.marcarSerenoOffline(
          payload.usuarioId,
          payload.realtime.timestamp,
        );
      });

    this.trackingService
      .listenSerenoOnline()
      .pipe(
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: payload => {

          this.mapaTrackingService
            .marcarSerenoOnline(
              payload.usuarioId,
              payload.realtime.timestamp,
            );
        },

        error: error => {
          console.error(
            'Error escuchando reconexión del sereno:',
            error,
          );
        },
      });
  }

  // =====================================================
  // PROCESAR ESTADO DE TRACKING
  // =====================================================

  private procesarTrackingMap(
    trackingMap:
      ReadonlyMap<number, TrackingPayload>
  ): void {

    if (!this.map) {
      return;
    }

    const usuariosActuales =
      new Set<number>(
        trackingMap.keys()
      );

    /*
     * Eliminar del mapa usuarios que ya no
     * aparecen en el TrackingStoreService.
     */
    for (
      const usuarioId
      of this.ultimoTrackingProcesado.keys()
    ) {
      if (
        !usuariosActuales.has(usuarioId)
      ) {
        this.mapaTrackingService
          .removerSereno(usuarioId);

        this.ultimoTrackingProcesado
          .delete(usuarioId);
      }
    }

    /*
     * Procesar únicamente ubicaciones nuevas.
     */
    trackingMap.forEach(
      (
        tracking: TrackingPayload,
        usuarioId: number
      ) => {

        if (
          !this.debeProcesarTracking(
            tracking
          )
        ) {
          return;
        }

        this.mapaTrackingService
          .actualizarTracking(
            this.map,
            tracking
          );

        const timestamp =
          new Date(
            tracking.realtime.timestamp
          ).getTime();

        this.ultimoTrackingProcesado.set(
          usuarioId,
          timestamp
        );
      }
    );

    this.cantidadSerenos =
      trackingMap.size;

    this.trackingActivo =
      this.cantidadSerenos > 0;
  }

  /**
   * Verifica si el tracking recibido es más
   * reciente que el último procesado.
   */
  private debeProcesarTracking(
    tracking: TrackingPayload
  ): boolean {

    if (
      !tracking ||
      !tracking.realtime ||
      !tracking.gps
    ) {
      return false;
    }

    const timestamp =
      new Date(
        tracking.realtime.timestamp
      ).getTime();

    if (
      !Number.isFinite(timestamp)
    ) {
      console.warn(
        '⚠️ Tracking con fecha inválida:',
        tracking
      );

      return false;
    }

    const ultimoTimestamp =
      this.ultimoTrackingProcesado.get(
        tracking.usuarioId
      );

    if (
      ultimoTimestamp !== undefined &&
      timestamp <= ultimoTimestamp
    ) {
      return false;
    }

    return true;
  }

  // =====================================================
  // MAPA
  // =====================================================

  private initMapa(): void {
    const center = {
      lat: -13.540348,
      lng: -71.982898
    };

    this.map =
      new google.maps.Map(
        this.mapaElement.nativeElement,
        {
          center,
          zoom: 15,
          mapTypeId:
            google.maps.MapTypeId.ROADMAP,

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

  private mostrarAlerta(
    data: AlertaMapaPayload
  ): void {

    if (!this.map) {
      return;
    }

    const lat =
      Number(data?.lat);

    const lng =
      Number(data?.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng)
    ) {
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

    const usuarioId =
      data.usuarioId ??
      data.userId ??
      null;

    const marker =
      new google.maps.Marker({
        position: {
          lat,
          lng
        },

        map: this.map,

        title:
          data.titulo ??
          'Alerta de serenazgo',

        icon: {
          url:
            'https://maps.google.com/mapfiles/ms/icons/red-dot.png',

          scaledSize:
            new google.maps.Size(
              44,
              44
            )
        },

        animation:
          google.maps.Animation.BOUNCE
      });

    this.alertMarkers.push(
      marker
    );

    const infoWindow =
      new google.maps.InfoWindow({
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

    infoWindow.open({
      map: this.map,
      anchor: marker
    });

    this.map.panTo({
      lat,
      lng
    });

    const timeout =
      setTimeout(() => {

        marker.setMap(null);
        infoWindow.close();

        this.alertMarkers =
          this.alertMarkers.filter(
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
    this.zonaService
      .obtenerZonas()
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (response: any) => {
          this.zonas =
            response?.data?.rows ?? [];

          this.zonas.forEach(zona => {
            this.zonasVisibles[
              zona.id
            ] = false;
          });
        },

        error: error => {
          console.error(
            '❌ Error obteniendo zonas:',
            error
          );
        }
      });
  }

  toggleZona(
    zona: ZonaPatrullaje
  ): void {

    const visible =
      this.zonasVisibles[
      zona.id
      ];

    if (visible) {
      const poligono =
        this.poligonos[
        zona.id
        ];

      if (poligono) {
        poligono.setMap(null);
      }

      this.zonasVisibles[
        zona.id
      ] = false;

      return;
    }

    this.showZona(zona);
  }

  private showZona(
    zona: ZonaPatrullaje
  ): void {

    if (
      !Array.isArray(
        zona.coordenadas
      ) ||
      zona.coordenadas.length === 0
    ) {
      console.warn(
        '⚠️ Zona sin coordenadas:',
        zona
      );

      return;
    }

    const color =
      this.getColorByRiesgo(
        zona.riesgo
      );

    /*
     * Reutilizar polígono si ya fue creado.
     */
    const poligonoExistente =
      this.poligonos[
      zona.id
      ];

    if (poligonoExistente) {
      poligonoExistente.setMap(
        this.map
      );

      this.zonasVisibles[
        zona.id
      ] = true;

      this.fitZonaBounds(zona);

      return;
    }

    const polygon =
      new google.maps.Polygon({
        paths:
          zona.coordenadas,

        strokeColor:
          color,

        strokeOpacity:
          0.8,

        strokeWeight:
          2,

        fillColor:
          color,

        fillOpacity:
          0.35,

        clickable:
          true
      });

    polygon.setMap(
      this.map
    );

    this.poligonos[
      zona.id
    ] = polygon;

    this.zonasVisibles[
      zona.id
    ] = true;

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

  private fitZonaBounds(
    zona: ZonaPatrullaje
  ): void {

    if (
      !zona.coordenadas?.length
    ) {
      return;
    }

    const bounds =
      new google.maps.LatLngBounds();

    zona.coordenadas
      .forEach(coord => {

        const lat =
          Number(coord.lat);

        const lng =
          Number(coord.lng);

        if (
          Number.isFinite(lat) &&
          Number.isFinite(lng)
        ) {
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

    const polygon =
      new google.maps.Polygon({
        paths:
          zona.coordenadas,

        strokeColor:
          '#0AD962',

        strokeOpacity:
          0.8,

        strokeWeight:
          2,

        fillColor:
          '#0AD962',

        fillOpacity:
          0.25,

        map:
          this.map
      });

    /*
     * Este método crea un polígono temporal.
     * Si luego quieres eliminarlo, debes guardarlo.
     */
    console.log(
      '🟢 Zona temporal dibujada:',
      polygon
    );
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

    const panel =
      this.zonaPanel
        ?.nativeElement;

    if (!panel) {
      return;
    }

    const maxLeft = window.innerWidth - panel.offsetWidth;

    const maxTop = window.innerHeight - panel.offsetHeight;

    const left =
      Math.min(
        Math.max(
          event.clientX -
          this.offset.x,
          0
        ),
        Math.max(maxLeft, 0)
      );

    const top =
      Math.min(
        Math.max(
          event.clientY -
          this.offset.y,
          0
        ),
        Math.max(maxTop, 0)
      );

    panel.style.left =
      `${left}px`;

    panel.style.top =
      `${top}px`;

    panel.style.right =
      'auto';
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
