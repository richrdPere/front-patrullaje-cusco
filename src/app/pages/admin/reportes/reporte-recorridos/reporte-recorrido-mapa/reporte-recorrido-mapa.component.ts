import {
  CommonModule,
  DatePipe,
  DecimalPipe,
} from '@angular/common';

import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

// Service
import {
  GoogleMapsLoaderService,
} from 'src/app/services/google-maps-loader.service';

// Interfaces
import {
  ReportePuntoGps,
  ReporteRecorridoDetalle,
  TipoGpsReporte,
} from 'src/app/interfaces/reportes/reporte-recorridos.interface';

@Component({
  selector: 'reporte-recorrido-mapa',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe,
  ],
  templateUrl:
    './reporte-recorrido-mapa.component.html',
  styles: ``,
})
export class ReporteRecorridoMapaComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  // =========================================================
  // CONTENEDOR DEL MAPA
  // =========================================================

  private mapContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('mapContainer')
  set mapContainerRef(
    element: ElementRef<HTMLDivElement> | undefined,
  ) {
    this.mapContainer = element;

    if (
      element &&
      this.visible &&
      this.recorrido
    ) {
      setTimeout(() => {
        void this.tryInitializeMap();
      }, 0);
    }
  }

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() visible = false;

  @Input()
  recorrido: ReporteRecorridoDetalle | null = null;

  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output()
  cerrar = new EventEmitter<void>();

  // =========================================================
  // INSTANCIAS DE GOOGLE MAPS
  // =========================================================

  map: google.maps.Map | null = null;

  polyline: google.maps.Polyline | null = null;

  inicioMarker: google.maps.Marker | null = null;
  finMarker: google.maps.Marker | null = null;

  puntosEspecialesMarkers: google.maps.Marker[] = [];

  infoWindow: google.maps.InfoWindow | null = null;

  // =========================================================
  // ESTADOS
  // =========================================================

  isLoadingMap = false;
  errorMessage = '';

  private viewInitialized = false;
  private initializationToken = 0;

  constructor(
    private readonly googleMapsLoaderService:
      GoogleMapsLoaderService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    if (
      this.visible &&
      this.recorrido
    ) {
      setTimeout(() => {
        void this.tryInitializeMap();
      }, 0);
    }
  }

  ngOnChanges(
    changes: SimpleChanges,
  ): void {

    const visibleChange =
      changes['visible'];

    const recorridoChange =
      changes['recorrido'];

    if (
      this.visible &&
      this.recorrido &&
      (
        visibleChange?.currentValue === true ||
        recorridoChange
      )
    ) {
      setTimeout(() => {
        void this.tryInitializeMap();
      }, 0);
    }

    if (
      visibleChange?.currentValue === false
    ) {
      this.destroyMap();
    }
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  // =========================================================
  // TECLADO
  // =========================================================

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {

    if (this.visible) {
      this.cerrarModal();
    }
  }

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================

  private async tryInitializeMap(): Promise<void> {

    if (
      !this.visible ||
      !this.recorrido ||
      !this.mapContainer?.nativeElement ||
      !this.viewInitialized
    ) {
      return;
    }

    const token =
      ++this.initializationToken;

    this.isLoadingMap = true;
    this.errorMessage = '';

    try {

      await this.googleMapsLoaderService.load();

      await this.waitUntilGoogleMapsIsAvailable();

      if (
        token !== this.initializationToken ||
        !this.visible ||
        !this.recorrido
      ) {
        return;
      }

      this.initializeMap();

    } catch (error) {

      console.error(
        'Error al inicializar el mapa del recorrido:',
        error,
      );

      this.errorMessage =
        error instanceof Error
          ? error.message
          : 'No se pudo cargar Google Maps.';

    } finally {

      if (
        token === this.initializationToken
      ) {
        this.isLoadingMap = false;
      }
    }
  }

  /**
   * El loader puede encontrar el script en el DOM antes de que
   * la API haya terminado de crear window.google.maps.
   */
  private waitUntilGoogleMapsIsAvailable(
    timeoutMilliseconds = 10000,
  ): Promise<void> {

    return new Promise(
      (
        resolve,
        reject,
      ) => {

        const startTime =
          Date.now();

        const check = (): void => {

          if (
            typeof google !== 'undefined' &&
            google.maps
          ) {
            resolve();
            return;
          }

          if (
            Date.now() - startTime >=
            timeoutMilliseconds
          ) {
            reject(
              new Error(
                'Google Maps no terminó de cargar dentro del tiempo esperado.',
              ),
            );

            return;
          }

          window.setTimeout(
            check,
            100,
          );
        };

        check();
      },
    );
  }

  private initializeMap(): void {

    if (
      !this.recorrido ||
      !this.mapContainer?.nativeElement
    ) {
      return;
    }

    const puntos =
      this.getPuntosValidos();

    if (puntos.length === 0) {
      this.errorMessage =
        'El recorrido no contiene coordenadas GPS válidas.';

      return;
    }

    /*
     * Limpiamos overlays anteriores sin borrar el mensaje
     * de error ni el estado de carga del proceso actual.
     */
    this.clearMapObjects();

    const puntoInicial =
      puntos[0];

    const center:
      google.maps.LatLngLiteral = {
      lat: Number(
        puntoInicial.latitud,
      ),
      lng: Number(
        puntoInicial.longitud,
      ),
    };

    this.map =
      new google.maps.Map(
        this.mapContainer.nativeElement,
        {
          center,
          zoom: 16,

          mapTypeId:
            google.maps.MapTypeId.ROADMAP,

          fullscreenControl: true,
          streetViewControl: false,
          mapTypeControl: true,
          zoomControl: true,

          gestureHandling: 'greedy',
        },
      );

    this.infoWindow =
      new google.maps.InfoWindow();

    this.drawPolyline(puntos);
    this.drawStartAndEndMarkers(puntos);
    this.drawSpecialMarkers(puntos);
    this.fitMapToRoute(puntos);

    /*
     * El modal puede terminar de calcular sus dimensiones
     * después de crear el mapa.
     */
    window.setTimeout(() => {

      if (!this.map) {
        return;
      }

      google.maps.event.trigger(
        this.map,
        'resize',
      );

      this.fitMapToRoute(
        puntos,
      );

    }, 200);
  }

  // =========================================================
  // POLYLINE
  // =========================================================

  private drawPolyline(
    puntos: ReportePuntoGps[],
  ): void {

    if (!this.map) {
      return;
    }

    const path:
      google.maps.LatLngLiteral[] =
      puntos.map(
        punto => ({
          lat: Number(
            punto.latitud,
          ),
          lng: Number(
            punto.longitud,
          ),
        }),
      );

    this.polyline =
      new google.maps.Polyline({
        map: this.map,
        path,

        geodesic: true,

        strokeColor: '#2563eb',
        strokeOpacity: 0.9,
        strokeWeight: 5,

        clickable: false,
      });
  }

  // =========================================================
  // MARCADORES DE INICIO Y FIN
  // =========================================================

  private drawStartAndEndMarkers(
    puntos: ReportePuntoGps[],
  ): void {

    if (
      !this.map ||
      puntos.length === 0
    ) {
      return;
    }

    const inicio =
      puntos[0];

    const fin =
      puntos[
      puntos.length - 1
      ];

    this.inicioMarker =
      new google.maps.Marker({
        map: this.map,

        position: {
          lat: Number(
            inicio.latitud,
          ),
          lng: Number(
            inicio.longitud,
          ),
        },

        title:
          'Inicio del recorrido',

        label: {
          text: 'I',
          color: '#ffffff',
          fontWeight: 'bold',
        },

        icon:
          this.buildCircularIcon(
            '#16a34a',
            11,
          ),

        zIndex: 20,
      });

    this.finMarker =
      new google.maps.Marker({
        map: this.map,

        position: {
          lat: Number(
            fin.latitud,
          ),
          lng: Number(
            fin.longitud,
          ),
        },

        title:
          'Fin del recorrido',

        label: {
          text: 'F',
          color: '#ffffff',
          fontWeight: 'bold',
        },

        icon:
          this.buildCircularIcon(
            '#dc2626',
            11,
          ),

        zIndex: 20,
      });

    this.inicioMarker.addListener(
      'click',
      () => {
        this.openPointInfo(
          inicio,
          this.inicioMarker,
          'Inicio del recorrido',
        );
      },
    );

    this.finMarker.addListener(
      'click',
      () => {
        this.openPointInfo(
          fin,
          this.finMarker,
          'Fin del recorrido',
        );
      },
    );
  }

  // =========================================================
  // MARCADORES ESPECIALES
  // =========================================================

  private drawSpecialMarkers(
    puntos: ReportePuntoGps[],
  ): void {

    if (!this.map) {
      return;
    }

    const especiales =
      puntos.filter(
        punto =>
          punto.tipo === 'EMERGENCIA' ||
          punto.tipo === 'MANUAL',
      );

    for (
      const punto of especiales
    ) {

      const marker =
        new google.maps.Marker({
          map: this.map,

          position: {
            lat: Number(
              punto.latitud,
            ),
            lng: Number(
              punto.longitud,
            ),
          },

          title:
            this.getTipoGpsLabel(
              punto.tipo,
            ),

          icon:
            this.getSpecialMarkerIcon(
              punto.tipo,
            ),

          zIndex:
            punto.tipo === 'EMERGENCIA'
              ? 30
              : 15,
        });

      marker.addListener(
        'click',
        () => {
          this.openPointInfo(
            punto,
            marker,
            this.getTipoGpsLabel(
              punto.tipo,
            ),
          );
        },
      );

      this.puntosEspecialesMarkers.push(
        marker,
      );
    }
  }

  private getSpecialMarkerIcon(
    tipo: TipoGpsReporte,
  ): google.maps.Symbol {

    switch (tipo) {

      case 'EMERGENCIA':
        return this.buildCircularIcon(
          '#dc2626',
          9,
        );

      case 'MANUAL':
        return this.buildCircularIcon(
          '#f59e0b',
          8,
        );

      case 'TRACKING':
      default:
        return this.buildCircularIcon(
          '#2563eb',
          7,
        );
    }
  }

  private buildCircularIcon(
    fillColor: string,
    scale: number,
  ): google.maps.Symbol {

    return {
      path:
        google.maps.SymbolPath.CIRCLE,

      fillColor,
      fillOpacity: 1,

      strokeColor: '#ffffff',
      strokeOpacity: 1,
      strokeWeight: 2,

      scale,
    };
  }

  // =========================================================
  // INFORMACIÓN DE PUNTOS
  // =========================================================

  private openPointInfo(
    punto: ReportePuntoGps,
    marker: google.maps.Marker | null,
    title: string,
  ): void {

    if (
      !this.map ||
      !this.infoWindow ||
      !marker
    ) {
      return;
    }

    const velocidad =
      punto.velocidad !== null
        ? `${Number(punto.velocidad).toFixed(2)} m/s`
        : 'No disponible';

    const precision =
      punto.precision !== null
        ? `${Number(punto.precision).toFixed(1)} m`
        : 'No disponible';

    const fecha =
      this.formatDateTime(
        punto.fecha_hora,
      );

    const contenido = `
      <div style="
        min-width: 220px;
        max-width: 280px;
        padding: 4px;
        color: #111827;
        font-family: Arial, sans-serif;
      ">
        <strong style="
          display: block;
          margin-bottom: 8px;
          font-size: 14px;
        ">
          ${this.escapeHtml(title)}
        </strong>

        <div style="
          display: grid;
          gap: 5px;
          font-size: 12px;
          line-height: 1.4;
        ">
          <span>
            <strong>Tipo:</strong>
            ${this.escapeHtml(
      this.getTipoGpsLabel(
        punto.tipo,
      ),
    )}
          </span>

          <span>
            <strong>Fecha:</strong>
            ${this.escapeHtml(fecha)}
          </span>

          <span>
            <strong>Velocidad:</strong>
            ${this.escapeHtml(velocidad)}
          </span>

          <span>
            <strong>Precisión:</strong>
            ${this.escapeHtml(precision)}
          </span>

          <span>
            <strong>Coordenadas:</strong>
            ${Number(punto.latitud).toFixed(6)},
            ${Number(punto.longitud).toFixed(6)}
          </span>
        </div>
      </div>
    `;

    this.infoWindow.setContent(
      contenido,
    );

    this.infoWindow.open({
      map: this.map,
      anchor: marker,
    });
  }

  // =========================================================
  // AJUSTAR MAPA
  // =========================================================

  centrarRecorrido(): void {

    const puntos =
      this.getPuntosValidos();

    if (puntos.length === 0) {
      return;
    }

    this.fitMapToRoute(
      puntos,
    );
  }

  private fitMapToRoute(
    puntos: ReportePuntoGps[],
  ): void {

    if (
      !this.map ||
      puntos.length === 0
    ) {
      return;
    }

    if (puntos.length === 1) {

      this.map.setCenter({
        lat: Number(
          puntos[0].latitud,
        ),
        lng: Number(
          puntos[0].longitud,
        ),
      });

      this.map.setZoom(17);

      return;
    }

    const bounds =
      new google.maps.LatLngBounds();

    for (
      const punto of puntos
    ) {
      bounds.extend({
        lat: Number(
          punto.latitud,
        ),
        lng: Number(
          punto.longitud,
        ),
      });
    }

    this.map.fitBounds(
      bounds,
      60,
    );

    /*
     * Impide que recorridos con puntos prácticamente iguales
     * queden con un zoom exagerado.
     */
    google.maps.event.addListenerOnce(
      this.map,
      'idle',
      () => {

        if (
          this.map &&
          (
            this.map.getZoom() ?? 0
          ) > 19
        ) {
          this.map.setZoom(19);
        }
      },
    );
  }

  // =========================================================
  // GOOGLE MAPS EXTERNO
  // =========================================================

  abrirEnGoogleMaps(): void {

    const puntos =
      this.getPuntosValidos();

    if (puntos.length === 0) {
      return;
    }

    const inicio =
      puntos[0];

    const fin =
      puntos[
      puntos.length - 1
      ];

    const origin =
      `${Number(inicio.latitud)},${Number(inicio.longitud)}`;

    const destination =
      `${Number(fin.latitud)},${Number(fin.longitud)}`;

    const url =
      'https://www.google.com/maps/dir/?api=1' +
      `&origin=${encodeURIComponent(origin)}` +
      `&destination=${encodeURIComponent(destination)}` +
      '&travelmode=driving';

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }

  // =========================================================
  // PUNTOS VÁLIDOS
  // =========================================================

  getPuntosValidos(): ReportePuntoGps[] {

    return (
      this.recorrido
        ?.recorrido
        .filter(
          punto =>
            this.hasValidCoordinates(
              punto,
            ),
        ) ?? []
    );
  }

  private hasValidCoordinates(
    punto: ReportePuntoGps,
  ): boolean {

    const latitud =
      Number(
        punto.latitud,
      );

    const longitud =
      Number(
        punto.longitud,
      );

    return (
      Number.isFinite(latitud) &&
      Number.isFinite(longitud) &&
      latitud >= -90 &&
      latitud <= 90 &&
      longitud >= -180 &&
      longitud <= 180
    );
  }

  // =========================================================
  // FORMATOS
  // =========================================================

  getTipoGpsLabel(
    tipo: TipoGpsReporte,
  ): string {

    switch (tipo) {

      case 'TRACKING':
        return 'Tracking automático';

      case 'EMERGENCIA':
        return 'Punto de emergencia';

      case 'MANUAL':
        return 'Registro manual';

      default:
        return tipo;
    }
  }

  getTipoGpsBadgeClass(
    tipo: TipoGpsReporte,
  ): string {

    switch (tipo) {

      case 'TRACKING':
        return 'badge-info';

      case 'EMERGENCIA':
        return 'badge-error';

      case 'MANUAL':
        return 'badge-warning';

      default:
        return 'badge-ghost';
    }
  }

  formatearDistancia(
    metros: number | null | undefined,
  ): string {

    const value =
      Number(
        metros ?? 0,
      );

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return '0 m';
    }

    if (value < 1000) {
      return `${value.toFixed(0)} m`;
    }

    return `${(
      value / 1000
    ).toFixed(2)} km`;
  }

  formatearDuracion(
    segundos: number | null | undefined,
  ): string {

    const total =
      Math.max(
        Math.floor(
          Number(segundos ?? 0),
        ),
        0,
      );

    if (total === 0) {
      return '0 min';
    }

    const horas =
      Math.floor(
        total / 3600,
      );

    const minutos =
      Math.floor(
        (
          total % 3600
        ) / 60,
      );

    const segundosRestantes =
      total % 60;

    if (horas > 0) {
      return `${horas} h ${minutos} min`;
    }

    if (minutos > 0) {
      return `${minutos} min ${segundosRestantes} s`;
    }

    return `${segundosRestantes} s`;
  }

  private formatDateTime(
    value: string,
  ): string {

    const date =
      new Date(value);

    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return 'Fecha no disponible';
    }

    return date.toLocaleString(
      'es-PE',
      {
        dateStyle: 'short',
        timeStyle: 'medium',
      },
    );
  }

  private escapeHtml(
    value: string,
  ): string {

    const element =
      document.createElement('div');

    element.textContent =
      value;

    return element.innerHTML;
  }

  // =========================================================
  // CERRAR Y LIMPIAR
  // =========================================================

  cerrarModal(): void {

    this.destroyMap();

    this.cerrar.emit();
  }

  private destroyMap(): void {

    this.initializationToken += 1;

    this.clearMapObjects();

    this.errorMessage = '';
    this.isLoadingMap = false;
  }

  private clearMapObjects(): void {

    this.infoWindow?.close();

    this.polyline?.setMap(
      null,
    );

    this.inicioMarker?.setMap(
      null,
    );

    this.finMarker?.setMap(
      null,
    );

    for (
      const marker of
      this.puntosEspecialesMarkers
    ) {
      marker.setMap(
        null,
      );
    }

    this.puntosEspecialesMarkers = [];

    this.polyline = null;
    this.inicioMarker = null;
    this.finMarker = null;
    this.infoWindow = null;
    this.map = null;
  }
}
