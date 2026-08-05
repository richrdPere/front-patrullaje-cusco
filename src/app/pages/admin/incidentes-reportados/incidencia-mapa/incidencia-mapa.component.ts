import { CommonModule } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';

// Interfaces
import { IncidenciaPaginada } from 'src/app/interfaces/incidencia/incidencias.interface';

@Component({
  selector: 'incidencia-mapa',
  imports: [],
  templateUrl: './incidencia-mapa.component.html',
  styles: ``
})
export class IncidenciaMapaComponent implements AfterViewInit, OnChanges, OnDestroy {

  // =========================================================
  // REFERENCIA AL CONTENEDOR DEL MAPA
  // =========================================================

  private mapContainer?: ElementRef<HTMLDivElement>;

  @ViewChild('mapContainer')
  set mapContainerRef(
    element: ElementRef<HTMLDivElement> | undefined
  ) {
    this.mapContainer = element;

    if (element && this.visible) {
      setTimeout(() => {
        this.tryInitializeMap();
      }, 0);
    }
  }

  // =========================================================
  // INPUTS
  // =========================================================

  /**
   * Incidencia que contiene las coordenadas a mostrar.
   */
  @Input() incidencia: IncidenciaPaginada | null = null;

  /**
   * Controla la visibilidad del modal.
   */
  @Input() visible = false;

  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output() cerrar = new EventEmitter<void>();

  // =========================================================
  // ESTADO DEL COMPONENTE
  // =========================================================

  isLoadingMap = false;
  errorMessage = '';

  private viewInitialized = false;
  private googleMapsLoaded = false;
  private isInitializing = false;

  // =========================================================
  // GOOGLE MAPS
  // =========================================================

  private map: google.maps.Map | null = null;
  private marker: google.maps.Marker | null = null;
  private infoWindow: google.maps.InfoWindow | null = null;

  private readonly defaultZoom = 17;

  /**
   * Ubicación por defecto para evitar mostrar un mapa vacío.
   * Corresponde aproximadamente al centro de Cusco.
   */
  private readonly defaultCenter: google.maps.LatLngLiteral = {
    lat: -13.53195,
    lng: -71.96746,
  };

  constructor(
    private googleMapsLoaderService: GoogleMapsLoaderService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngAfterViewInit(): void {
    this.viewInitialized = true;

    if (this.visible && this.mapContainer) {
      this.tryInitializeMap();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {

    const incidenciaChange = changes['incidencia'];
    const visibleChange = changes['visible'];

    if (visibleChange?.currentValue === true) {

      setTimeout(() => {
        this.tryInitializeMap();
      }, 0);

    } else if (
      incidenciaChange &&
      this.visible &&
      this.mapContainer
    ) {

      setTimeout(() => {
        this.tryInitializeMap();
      }, 0);
    }

    if (visibleChange?.currentValue === false) {

      this.errorMessage = '';
      this.isLoadingMap = false;

      this.closeInfoWindow();
      this.destroyMarker();

      /*
       * El contenedor del mapa será destruido por el @if.
       * Por eso también descartamos la instancia asociada.
       */
      this.map = null;
    }
  }

  ngOnDestroy(): void {
    this.destroyMarker();
    this.closeInfoWindow();

    this.map = null;
    this.googleMapsLoaded = false;
    this.viewInitialized = false;
  }

  // =========================================================
  // INICIALIZACIÓN
  // =========================================================
  private async tryInitializeMap(): Promise<void> {

    if (
      !this.visible ||
      !this.viewInitialized ||
      !this.mapContainer ||
      this.isInitializing
    ) {
      return;
    }

    if (!this.hasValidCoordinates()) {
      this.errorMessage =
        'La incidencia no cuenta con coordenadas geográficas válidas.';

      return;
    }

    this.isInitializing = true;
    this.isLoadingMap = true;
    this.errorMessage = '';

    try {

      await this.loadGoogleMaps();

      if (!this.visible || !this.mapContainer) {
        return;
      }

      if (!this.map) {
        this.createMap();
      }

      this.updateMapLocation();

      /*
       * Google Maps puede calcular mal sus dimensiones cuando
       * se crea dentro de un modal inicialmente oculto.
       */
      setTimeout(() => {
        this.refreshMapSize();
      }, 100);

    } catch (error) {

      console.error(
        'Error al inicializar el mapa de incidencia:',
        error,
      );

      this.errorMessage =
        'No se pudo cargar el mapa. Verifique la conexión o la configuración de Google Maps.';

    } finally {
      this.isLoadingMap = false;
      this.isInitializing = false;
    }
  }

  // =========================================================
  // CARGAR GOOGLE MAPS
  // =========================================================
  private async loadGoogleMaps(): Promise<void> {

    if (this.googleMapsLoaded && typeof google !== 'undefined') {
      return;
    }

    /*
     * Ajusta únicamente esta llamada si en tu servicio
     * el método tiene otro nombre, por ejemplo:
     *
     * await this.googleMapsLoaderService.loadGoogleMaps();
     */
    await this.googleMapsLoaderService.load();

    if (
      typeof google === 'undefined' ||
      !google.maps
    ) {
      throw new Error(
        'La API de Google Maps no se encuentra disponible.',
      );
    }

    this.googleMapsLoaded = true;
  }

  // =========================================================
  // CREAR MAPA
  // =========================================================
  private createMap(): void {

    if (!this.mapContainer) {
      return;
    }

    const position =
      this.getCurrentPosition() ?? this.defaultCenter;

    this.map = new google.maps.Map(
      this.mapContainer.nativeElement,
      {
        center: position,
        zoom: this.defaultZoom,

        mapTypeId: google.maps.MapTypeId.ROADMAP,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,

        clickableIcons: false,

        gestureHandling: 'greedy',

        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [
              {
                visibility: 'off',
              },
            ],
          },
        ],
      },
    );
  }

  // =========================================================
  // ACTUALIZAR UBICACIÓN
  // =========================================================
  private updateMapLocation(): void {

    if (!this.map) {
      return;
    }

    const position = this.getCurrentPosition();

    if (!position) {
      this.errorMessage =
        'No se pudieron obtener las coordenadas de la incidencia.';

      return;
    }

    this.errorMessage = '';

    this.map.setCenter(position);
    this.map.setZoom(this.defaultZoom);

    this.createOrUpdateMarker(position);
  }

  // =========================================================
  // MARCADOR
  // =========================================================
  private createOrUpdateMarker(
    position: google.maps.LatLngLiteral,
  ): void {

    if (!this.map) {
      return;
    }

    if (this.marker) {

      this.marker.setPosition(position);
      this.marker.setMap(this.map);

    } else {

      this.marker = new google.maps.Marker({
        map: this.map,
        position,
        title: this.getMarkerTitle(),
        animation: google.maps.Animation.DROP,
      });

      this.marker.addListener('click', () => {
        this.openInfoWindow();
      });
    }

    this.marker.setTitle(this.getMarkerTitle());

    this.openInfoWindow();
  }

  private destroyMarker(): void {

    if (!this.marker) {
      return;
    }

    google.maps.event.clearInstanceListeners(this.marker);
    this.marker.setMap(null);
    this.marker = null;
  }

  // =========================================================
  // INFO WINDOW
  // =========================================================
  private openInfoWindow(): void {

    if (
      !this.map ||
      !this.marker ||
      !this.incidencia
    ) {
      return;
    }

    this.closeInfoWindow();

    this.infoWindow = new google.maps.InfoWindow({
      content: this.buildInfoWindowContent(),
    });

    this.infoWindow.open({
      map: this.map,
      anchor: this.marker,
    });
  }

  private closeInfoWindow(): void {

    if (!this.infoWindow) {
      return;
    }

    this.infoWindow.close();
    this.infoWindow = null;
  }

  private buildInfoWindowContent(): string {

    const tipo = this.escapeHtml(
      this.getTipoLabel(this.incidencia?.tipo),
    );

    const estado = this.escapeHtml(
      this.getEstadoLabel(this.incidencia?.estado),
    );

    const descripcion = this.escapeHtml(
      this.incidencia?.descripcion ||
      'Sin descripción registrada.',
    );

    const zona = this.escapeHtml(
      this.incidencia?.zona?.nombre ||
      'Sin zona asociada',
    );

    return `
      <div style="
        min-width: 220px;
        max-width: 300px;
        padding: 4px;
        font-family: Arial, sans-serif;
      ">
        <div style="
          font-size: 14px;
          font-weight: 700;
          margin-bottom: 6px;
        ">
          Incidencia #${this.incidencia?.id ?? ''}
        </div>

        <div style="
          font-size: 13px;
          margin-bottom: 4px;
        ">
          <strong>Tipo:</strong> ${tipo}
        </div>

        <div style="
          font-size: 13px;
          margin-bottom: 4px;
        ">
          <strong>Estado:</strong> ${estado}
        </div>

        <div style="
          font-size: 13px;
          margin-bottom: 4px;
        ">
          <strong>Zona:</strong> ${zona}
        </div>

        <div style="
          margin-top: 8px;
          font-size: 12px;
          line-height: 1.4;
          color: #555;
        ">
          ${descripcion}
        </div>
      </div>
    `;
  }

  // =========================================================
  // REDIMENSIONAR MAPA
  // =========================================================
  private refreshMapSize(): void {

    if (!this.map) {
      return;
    }

    const position = this.getCurrentPosition();

    google.maps.event.trigger(
      this.map,
      'resize',
    );

    if (position) {
      this.map.setCenter(position);
    }
  }

  // =========================================================
  // COORDENADAS
  // =========================================================
  private hasValidCoordinates(): boolean {
    return this.getCurrentPosition() !== null;
  }

  private getCurrentPosition():
    google.maps.LatLngLiteral | null {

    const rawLatitud = this.incidencia?.latitud;
    const rawLongitud = this.incidencia?.longitud;

    if (
      rawLatitud === null ||
      rawLatitud === undefined ||
      rawLatitud === '' ||
      rawLongitud === null ||
      rawLongitud === undefined ||
      rawLongitud === ''
    ) {
      return null;
    }

    const latitud = Number(rawLatitud);
    const longitud = Number(rawLongitud);

    if (
      !Number.isFinite(latitud) ||
      !Number.isFinite(longitud)
    ) {
      return null;
    }

    if (
      latitud < -90 ||
      latitud > 90 ||
      longitud < -180 ||
      longitud > 180
    ) {
      return null;
    }

    return {
      lat: latitud,
      lng: longitud,
    };
  }

  get coordenadas(): string {

    const position = this.getCurrentPosition();

    if (!position) {
      return 'No registradas';
    }

    return `${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}`;
  }

  // =========================================================
  // ACCIONES
  // =========================================================
  cerrarModal(): void {
    this.closeInfoWindow();
    this.cerrar.emit();
  }

  centrarMapa(): void {

    const position = this.getCurrentPosition();

    if (!this.map || !position) {
      return;
    }

    this.map.panTo(position);
    this.map.setZoom(this.defaultZoom);

    if (this.marker) {
      this.marker.setAnimation(
        google.maps.Animation.BOUNCE,
      );

      setTimeout(() => {
        this.marker?.setAnimation(null);
      }, 750);
    }
  }

  abrirEnGoogleMaps(): void {

    const position = this.getCurrentPosition();

    if (!position) {
      return;
    }

    const url =
      'https://www.google.com/maps/search/?api=1' +
      `&query=${position.lat},${position.lng}`;

    window.open(
      url,
      '_blank',
      'noopener,noreferrer',
    );
  }

  copiarCoordenadas(): void {

    const position = this.getCurrentPosition();

    if (!position) {
      return;
    }

    const coordenadas =
      `${position.lat},${position.lng}`;

    navigator.clipboard
      .writeText(coordenadas)
      .catch((error) => {
        console.error(
          'No se pudieron copiar las coordenadas:',
          error,
        );
      });
  }

  // =========================================================
  // PRESENTACIÓN
  // =========================================================
  getMarkerTitle(): string {

    const id = this.incidencia?.id ?? '';
    const tipo = this.getTipoLabel(
      this.incidencia?.tipo,
    );

    return `Incidencia #${id} - ${tipo}`;
  }

  getTipoLabel(tipo?: string | null): string {

    switch (tipo) {
      case 'ROBO':
        return 'Robo';

      case 'ACCIDENTE':
        return 'Accidente';

      case 'INCENDIO':
        return 'Incendio';

      case 'VIOLENCIA':
        return 'Violencia';

      case 'SOSPECHOSO':
        return 'Persona o actividad sospechosa';

      case 'OTRO':
        return 'Otro';

      default:
        return tipo || 'No especificado';
    }
  }

  getEstadoLabel(estado?: string | null): string {

    switch (estado) {
      case 'REPORTADO':
        return 'Reportado';

      case 'EN_PROCESO':
        return 'En proceso';

      case 'ATENDIDO':
        return 'Atendido';

      case 'CERRADO':
        return 'Cerrado';

      case 'ELIMINADO':
        return 'Eliminado';

      default:
        return estado || 'Sin estado';
    }
  }

  private escapeHtml(value: string): string {
    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }
}
