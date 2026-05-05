
import { Component, ElementRef, ViewChild, AfterViewInit, HostListener, OnDestroy } from '@angular/core';
import { Lugar } from 'src/app/interfaces/lugar';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona.service';
import { SocketService } from 'src/app/services/socket.service';

// Interfaces
import { ZonaPatrullaje } from 'src/app/interfaces/zonaPatrullaje';


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

  // ZONAS
  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: Record<number, boolean> = {};
  poligonos: Record<number, google.maps.Polygon> = {};

  // SERENOS Y ALERTAS
  serenoMarkers: { [userId: number]: google.maps.Marker } = {};
  alertMarkers: google.maps.Marker[] = [];



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
    private socketService: SocketService,
    private mapsLoader: GoogleMapsLoaderService,
    private zonaService: ZonaService
  ) { }

  ngOnDestroy(): void {
    this.socketService.off('tracking');
    this.socketService.off('alerta_sereno');
    this.socketService.off('notificacion');
    this.socketService.off('patrullaje_iniciado');
    this.socketService.off('patrullaje_finalizado');
    this.socketService.off('nuevo_patrullaje');
    this.socketService.off('patrullaje_cancelado');
  }

  async ngAfterViewInit() {
    await this.mapsLoader.load();
    this.initSocketMapa();
    this.initMapa();
    this.loadZonas();
    this.renderMarcadores();
    this.mapaCargado = true;
  }

  // =====================================================
  // SOCKET
  // =====================================================
  initSocketMapa() {
    //this.socketService.connect();
    this.initSocketEvents();
  }

  initSocketEvents() {

    // TRACKING
    this.socketService.on('tracking', (data) => {
      this.actualizarMarcadorSereno(data);
    });

    // ALERTA
    this.socketService.on('alerta_sereno', (data) => {
      this.mostrarAlerta(data);
    });

    // NOTIFICACIONES
    this.socketService.on('notificacion', (message) => {
      console.log('🔔 Notificación:', message);
    });

    // PATRULLAJE
    this.socketService.on('patrullaje_iniciado', (data) => {
      console.log('🟢 Patrullaje iniciado:', data);
    });

    this.socketService.on('patrullaje_finalizado', (data) => {
      console.log('🔴 Patrullaje finalizado:', data);
    });

    // NUEVO PATRULLAJE (🔥 IMPORTANTE)
    this.socketService.on('nuevo_patrullaje', (patrullaje) => {
      console.log('📡 Nuevo patrullaje:', patrullaje);

      if (patrullaje.zona?.coordenadas) {
        this.dibujarZonaPatrullaje(patrullaje.zona);
      }
    });



    // =========================
    // CANCELACIÓN
    // =========================
    this.socketService.on('patrullaje_cancelado', (data) => {
      console.log('❌ Patrullaje cancelado:', data);
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

  actualizarMarcadorSereno(data: any) {
    const { userId, lat, lng } = data;

    const position = new google.maps.LatLng(lat, lng);

    // Si ya existe → mover
    if (this.serenoMarkers[userId]) {
      this.serenoMarkers[userId].setPosition(position);
      return;
    }

    // Si no existe → crear
    const marker = new google.maps.Marker({
      position,
      map: this.map,
      icon: {
        url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      }
    });

    this.serenoMarkers[userId] = marker;
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
  // MARCADORES
  // =====================================================
  private renderMarcadores() {
    this.lugares.forEach(lugar => this.createMarker(lugar));
  }

  private createMarker(lugar: Lugar) {

    const marker = new google.maps.Marker({
      map: this.map,
      position: { lat: lugar.lat, lng: lugar.lng },
      animation: google.maps.Animation.DROP,
      draggable: true
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `<b>${lugar.nombre}</b>`
    });

    marker.addListener('click', () => {
      this.infoWindows.forEach(iw => iw.close());
      infoWindow.open(this.map, marker);
    });

    marker.addListener('dblclick', () => {
      marker.setMap(null);
    });

    this.marcadores.push(marker);
    this.infoWindows.push(infoWindow);
  }

  // =====================================================
  // ZONAS
  // =====================================================
  loadZonas(): void {
    this.zonaService.obtenerZonas().subscribe({
      next: (res: any) => {
        this.zonas = res.zonas;

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

  private hideZona(zonaId: number) {
    this.poligonos[zonaId]?.setMap(null);
    this.zonasVisibles[zonaId] = false;
  }

  private getColorByRiesgo(riesgo: string): string {
    switch (riesgo) {
      case 'Alto': return '#FF0000';
      case 'Medio': return '#FFA500';
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

  // agregarMarcador(marcador: Lugar) {

  //   const latLng = new google.maps.LatLng(marcador.lat, marcador.lng);

  //   const marker = new google.maps.Marker({
  //     map: this.map,
  //     animation: google.maps.Animation.DROP,
  //     position: latLng,
  //     draggable: true
  //   });

  //   this.marcadores.push(marker);

  //   const contenido = `<b>${marcador.nombre}</b>`;
  //   const infoWindow = new google.maps.InfoWindow({
  //     content: contenido
  //   });

  //   this.infoWindows.push(infoWindow);


  //   // Mostrar el info window
  //   google.maps.event.addDomListener(marker, 'click', () => {
  //     this.infoWindows.forEach(infoW => infoW.close());
  //     infoWindow.open(this.map, marker);
  //   });

  //   // Disparar un evento de socket, para borrar el marcador
  //   google.maps.event.addDomListener(marker, 'dblclick', () => {
  //     marker.setMap(null);
  //   });

  //   // Disparar un evento de socket, para mover el marcador
  //   // google.maps.event.addDomListener(marker, 'drag', (coors: { "": any; }) => {
  //   //   const nuevoMarcador = {
  //   //     lat: coors.LatLng.lat(),
  //   //     lng: coors.LatLng.lng(),
  //   //     nombre: marcador.nombre
  //   //   }
  //   // });
  // }
}
