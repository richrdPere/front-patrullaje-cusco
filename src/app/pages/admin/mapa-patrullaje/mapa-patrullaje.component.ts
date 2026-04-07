
import { Component, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { Lugar } from 'src/app/interfaces/lugar';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona.service';

// Interfaces
import { ZonaPatrullaje } from 'src/app/interfaces/zonaPatrullaje';

@Component({
  selector: 'app-mapa-patrullaje',
  imports: [],
  templateUrl: './mapa-patrullaje.component.html',
  styles: ``
})
export class MapaPatrullajeComponent implements AfterViewInit{

  @ViewChild('map') mapaElement!: ElementRef;
  @ViewChild('zonaPanel') zonaPanel!: ElementRef;

  map!: google.maps.Map;
  panelVisible: boolean = true;

  marcadores: google.maps.Marker[] = [];
  infoWindows: google.maps.InfoWindow[] = [];

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

  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: { [id: string]: boolean } = {};
  poligonos: { [id: string]: google.maps.Polygon } = {};

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    private _zonaService: ZonaService
  ) {
    // this.mapsLoader.load(); // precarga silenciosa
    this.panelVisible = false;

  }

  // async ngOnInit() {
  //   await this.mapsLoader.load();
  //   this.cargarMapa();
  // }

  async ngAfterViewInit() {
    await this.mapsLoader.load();
    this.cargarMapa();
    this.cargarZonas();
    this.mapaCargado = true;
  }

  cargarMapa() {
    const latLng = new google.maps.LatLng(-13.540348, -71.982898);

    const mapaOpciones: google.maps.MapOptions = {
      center: latLng,
      zoom: 15,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    }

    this.map = new google.maps.Map(this.mapaElement?.nativeElement, mapaOpciones);

    for (const lugar of this.lugares) {
      this.agregarMarcador(lugar);
    }
  }

  cargarZonas(): void {
    this._zonaService.obtenerZonas().subscribe(zonas => {
      this.zonas = zonas;
      // Inicializar visibilidad en false
      console.log(zonas);
      // zonas.forEach(zona => {
      //   this.zonasVisibles[zona.id] = false;
      // });
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
      const color =
        zona.riesgo === 'Alto' ? '#FF0000' :       // Rojo
          zona.riesgo === 'Medio' ? '#FFA500' :      // Naranja
            '#0AD962';

      // Mostrar
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

      //  Calcular límites y centrar el mapa
      const bounds = new google.maps.LatLngBounds();
      zona.coordenadas.forEach(coord => {
        bounds.extend(new google.maps.LatLng(coord.lat, coord.lng));
      });

      this.map.fitBounds(bounds);
    }
  }

  mostrarPanel() {
    this.panelVisible = true;
  }

  ocultarPanel() {
    this.panelVisible = false;
  }

  // --------------------------
  //  Lógica para arrastrar el panel
  // --------------------------
  private isDragging = false;
  private offset = { x: 0, y: 0 };

  @HostListener('document:mousedown', ['$event'])
  onMouseDown(event: MouseEvent) {
    if (!this.zonaPanel?.nativeElement.contains(event.target)) return;
    this.isDragging = true;
    this.offset = {
      x: event.clientX - this.zonaPanel.nativeElement.getBoundingClientRect().left,
      y: event.clientY - this.zonaPanel.nativeElement.getBoundingClientRect().top,
    };
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    const x = event.clientX - this.offset.x;
    const y = event.clientY - this.offset.y;
    const panel = this.zonaPanel.nativeElement as HTMLElement;
    panel.style.left = `${x}px`;
    panel.style.top = `${y}px`;
    panel.style.right = 'auto'; // para evitar conflicto con right-4
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }

  agregarMarcador(marcador: Lugar) {

    const latLng = new google.maps.LatLng(marcador.lat, marcador.lng);

    const marker = new google.maps.Marker({
      map: this.map,
      animation: google.maps.Animation.DROP,
      position: latLng,
      draggable: true
    });

    this.marcadores.push(marker);

    const contenido = `<b>${marcador.nombre}</b>`;
    const infoWindow = new google.maps.InfoWindow({
      content: contenido
    });

    this.infoWindows.push(infoWindow);


    // Mostrar el info window
    google.maps.event.addDomListener(marker, 'click', () => {
      this.infoWindows.forEach(infoW => infoW.close());
      infoWindow.open(this.map, marker);
    });

    // Disparar un evento de socket, para borrar el marcador
    google.maps.event.addDomListener(marker, 'dblclick', () => {
      marker.setMap(null);
    });

    // Disparar un evento de socket, para mover el marcador
    // google.maps.event.addDomListener(marker, 'drag', (coors: { "": any; }) => {
    //   const nuevoMarcador = {
    //     lat: coors.LatLng.lat(),
    //     lng: coors.LatLng.lng(),
    //     nombre: marcador.nombre
    //   }
    // });
  }
}
