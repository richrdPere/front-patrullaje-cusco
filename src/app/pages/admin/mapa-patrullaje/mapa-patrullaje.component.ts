
import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { Lugar } from 'src/app/interfaces/lugar';
import { Subscription } from 'rxjs';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona.service';
import { SocketService } from 'src/app/services/socket.service';

// Interfaces
import { ZonaPatrullaje } from 'src/app/interfaces/zonaPatrullaje';
import { TrackingService } from 'src/app/services/mapa-tracking/tracking.service';
import { MapaTrackingService } from 'src/app/services/mapa-tracking/mapa-tracking.service';
import { TrackingStoreService } from 'src/app/services/mapa-tracking/tracking-store.service';


@Component({
  selector: 'mapa-patrullaje',
  imports: [],
  templateUrl: './mapa-patrullaje.component.html',
  styles: ``
})
export class MapaPatrullajeComponent implements AfterViewInit, OnDestroy {


  @ViewChild('map') mapaElement!: ElementRef;
  @ViewChild('zonaPanel') zonaPanel!: ElementRef;

  // MAPA
  map!: google.maps.Map;
  panelVisible: boolean = true;

  // MARCADORES
  marcadores: google.maps.Marker[] = [];
  infoWindows: google.maps.InfoWindow[] = [];
  trackingActivo = false;
  cantidadSerenos = 0;

  // ZONAS
  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: Record<number, boolean> = {};
  poligonos: Record<number, google.maps.Polygon> = {};

  // SERENOS Y ALERTAS
  // serenoMarkers: { [userId: number]: google.maps.Marker } = {};
  alertMarkers: google.maps.Marker[] = [];

  private trackingSub!: Subscription;
  private alertaSub!: Subscription;



  mapaCargado = false;

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

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    private zonaService: ZonaService,
    private trackingService: TrackingService,
    private mapaTrackingService: MapaTrackingService,
    private trackingStoreService: TrackingStoreService
  ) { }

  ngOnDestroy(): void {
    this.trackingSub?.unsubscribe();
    this.alertaSub?.unsubscribe();
  }

  async ngAfterViewInit() {

    // CARGAR GOOGLE MAPS
    await this.mapsLoader.load();

    // CREAR MAPA
    this.initMapa();

    // RECONSTRUIR SERENOS ACTIVOS
    this.mapaTrackingService
      .reconstruirMarcadores(this.map);

    // CARGAR ZONAS
    this.loadZonas();

    // INICIAR TRACKING
    this.initTracking();

    this.cantidadSerenos =
      this.mapaTrackingService.obtenerCantidadSerenos();

    this.mapaCargado = true;
  }

  // =====================================================
  // SOCKET
  // =====================================================
  initTracking() {
    console.log('🛰️ Escuchando tracking realtime...');
    // TRACKING
    this.trackingSub =
      this.trackingStoreService.tracking$
        .subscribe({
          next: (trackingMap) => {
            trackingMap.forEach((tracking) => {
              this.trackingActivo = true;
              this.mapaTrackingService
                .actualizarTracking(
                  this.map,
                  tracking
                );
            });
            this.cantidadSerenos = trackingMap.size;
          },

          error: (err) => {
            console.error('❌ Error tracking:', err);
          }
        });

    // ALERTAS
    this.alertaSub = this.trackingService
      .listenAlertas()
      .subscribe({
        next: (data) => {
          console.log('🚨 ALERTA RECIBIDA:', data);
          this.mostrarAlerta(data);
        },
        error: (err) => {
          console.error('❌ Error alerta:', err);
        }
      });
  }

  dibujarZonaPatrullaje(zona: any) {

    const polygon = new google.maps.Polygon({
      paths: zona.coordenadas,
      strokeColor: '#0AD962',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#0AD962',
      fillOpacity: 0.25
    });

    polygon.setMap(this.map);
  }

  mostrarAlerta(data: any) {
    const { lat, lng, userId } = data;

    const marker = new google.maps.Marker({
      position: { lat, lng },
      map: this.map,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png'
      },
      animation: google.maps.Animation.BOUNCE
    });

    this.alertMarkers.push(marker);

    const info = new google.maps.InfoWindow({
      content: `<b>🚨 ALERTA</b><br>Sereno ID: ${userId}`
    });

    info.open(this.map, marker);

    // Auto eliminar después de tiempo
    setTimeout(() => {
      marker.setMap(null);
    }, 10000);
  }

  // =====================================================
  // MAPA
  // =====================================================
  private initMapa() {
    const center = new google.maps.LatLng(-13.540348, -71.982898);

    this.map = new google.maps.Map(this.mapaElement.nativeElement, {
      center,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    });
  }

  // =====================================================
  // ZONAS
  // =====================================================
  loadZonas(): void {
    this.zonaService.obtenerZonas().subscribe({
      next: (res: any) => {
        this.zonas = res.data.rows;

        // Inicializar estado
        this.zonas.forEach(z => {
          this.zonasVisibles[z.id] = false;
        });
      },
      error: (err) => {
        console.error('Error al obtener zonas:', err);
      }

    });
  }

  toggleZona(zona: ZonaPatrullaje) {
    const visible = this.zonasVisibles[zona.id];

    if (visible) {
      // Ocultar
      if (this.poligonos[zona.id]) {
        this.poligonos[zona.id].setMap(null);
      }
      this.zonasVisibles[zona.id] = false;
    } else {
      // Determinar color según el riesgo
      this.showZona(zona);
    }
  }

  private showZona(zona: ZonaPatrullaje) {

    const color = this.getColorByRiesgo(zona.riesgo);

    const polygon = new google.maps.Polygon({
      paths: zona.coordenadas,
      strokeColor: color,
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: color,
      fillOpacity: 0.35
    });

    polygon.setMap(this.map);

    this.poligonos[zona.id] = polygon;
    this.zonasVisibles[zona.id] = true;

    this.fitZonaBounds(zona);
  }

  // private hideZona(zonaId: number) {
  //   this.poligonos[zonaId]?.setMap(null);
  //   this.zonasVisibles[zonaId] = false;
  // }

  private getColorByRiesgo(riesgo: string): string {
    switch (riesgo) {
      case 'alto': return '#FF0000';
      case 'medio': return '#FFA500';
      default: return '#0AD962';
    }
  }

  private fitZonaBounds(zona: ZonaPatrullaje) {
    const bounds = new google.maps.LatLngBounds();

    zona.coordenadas.forEach(coord => {
      bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
    });

    this.map.fitBounds(bounds);
  }

  // =====================================================
  // PANEL UI
  // =====================================================
  mostrarPanel() {
    this.panelVisible = true;
  }

  ocultarPanel() {
    this.panelVisible = false;
  }

  // =====================================================
  // DRAG PANEL
  // =====================================================
  private isDragging = false;
  private offset = { x: 0, y: 0 };

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.zonaPanel?.nativeElement.contains(event.target)) return;

    this.isDragging = true;

    const rect = this.zonaPanel.nativeElement.getBoundingClientRect();

    this.offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const panel = this.zonaPanel.nativeElement as HTMLElement;

    panel.style.left = `${event.clientX - this.offset.x}px`;
    panel.style.top = `${event.clientY - this.offset.y}px`;
    panel.style.right = 'auto';
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }
}
