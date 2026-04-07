
import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormGroup, Validators, FormsModule, } from '@angular/forms';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona.service';

// Interface
import { ZonaPatrullaje } from 'src/app/interfaces/zonaPatrullaje';

declare var google: any;

@Component({
  selector: 'app-zonas',
  imports: [FormsModule, ReactiveFormsModule, UppercaseDirective],
  templateUrl: './zonas.component.html',
  styles: ``
})
export class ZonasComponent implements OnInit {


  // Zonas
  // zonas: any[] = [];
  isLoading = true;

  mostrarModal = false;
  modoEdicion = false;
  zonaSeleccionado: any = null;

  searchTimeout: any;

  // Search
  nombreBusqueda: string = '';

  // Variables
  // formUtils = FormUtils;
  fb = inject(FormBuilder);

  // Estado reactivo con Signal (opcional moderno)
  map!: google.maps.Map;
  drawingManager!: google.maps.drawing.DrawingManager;
  polygon!: google.maps.Polygon;
  zonaForm!: FormGroup;
  coordenadas: { lat: number, lng: number }[] = [];

  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: { [id: string]: boolean } = {};
  poligonos: { [id: string]: google.maps.Polygon } = {};

  @ViewChild('mapContainer') mapaElement!: ElementRef;

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    //private fb: FormBuilder,
    private _zonaService: ZonaService
  ) { }

  ngOnInit(): void {
    this.zonaForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      riesgo: ['', Validators.required],
    });

    this.mapsLoader.load().then(() => {
      this.initMap();
      this.initDrawingManager();
    });

    this.obtenerZonas();
  }

  initMap(): void {
    this.map = new google.maps.Map(this.mapaElement.nativeElement, {
      center: { lat: -13.532, lng: -71.967 },
      zoom: 15,
    });
  }

  initDrawingManager(): void {
    this.drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: google.maps.drawing.OverlayType.POLYGON,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON,],
      },

      //     drawingControlOptions: {
      //       position: google.maps.ControlPosition.TOP_CENTER,
      //       drawingModes: [
      //         google.maps.drawing.OverlayType.MARKER,
      //         google.maps.drawing.OverlayType.CIRCLE,
      //         google.maps.drawing.OverlayType.POLYGON,
      //         google.maps.drawing.OverlayType.POLYLINE,
      //         google.maps.drawing.OverlayType.RECTANGLE,
      //       ]
      //     },
    });
    this.drawingManager.setMap(this.map);

    google.maps.event.addListener(this.drawingManager, 'overlaycomplete', (event: any) => {
      if (event.type === 'polygon') {
        const path = event.overlay.getPath();
        this.coordenadas = [];

        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          this.coordenadas.push({ lat: point.lat(), lng: point.lng() });
        }

        // Guardamos la referencia al polígono para poder eliminarlo después
        this.polygon = event.overlay;

        // Desactivamos el modo dibujo
        this.drawingManager.setDrawingMode(null);
      }
    });
  }

  // =========================================================
  // 1.- OBTENER TODAS LAS ZONAS
  // =========================================================
  obtenerZonas() {


    this._zonaService.obtenerZonas().subscribe({
      next: (res:any) => {
        this.zonas = res.zonas; // Guardar lAS ZONAS

        // Inicializar visibilidad
        this.zonas.forEach(zona => {
          this.zonasVisibles[zona.id] = false;
        });
      },
      error: (err) => {
        console.error('Error al obtener zonas:', err);
      }
    });

    this.zonas.forEach(zona => {
      this.zonasVisibles[zona.id] = false;
    });

  }

  // =========================================================
  // 2.- REGISTRAR NUEVA ZONA
  // =========================================================
  guardarZona(): void {
    if (!this.polygon) {
      alert('Debes dibujar una zona en el mapa.');
      return;
    }

    if (this.zonaForm.invalid) {
      alert('Completa los datos del formulario.');
      return;
    }

    const zona: ZonaPatrullaje = {
      id: '',
      nombre: this.zonaForm.value.nombre,
      descripcion: this.zonaForm.value.descripcion,
      coordenadas: this.coordenadas,
      riesgo: this.zonaForm.value.riesgo,
    };

    // console.log('Zona creada:', zona);
    // Aquí podrías enviar zona a un backend con HttpClient

    this._zonaService.crearZona(zona).subscribe({
      next: (res) => {
        alert('Zona registrada con éxito');
        this.zonaForm.reset();
        this.coordenadas = [];

        // Elimina el polígono actual del mapa
        this.polygon.setMap(null);
        this.polygon = undefined!;
        this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);

        // Cargar Zonas
        this.obtenerZonas();
      },
      error: (err) => {
        console.error(err);
        alert('Error al registrar la zona');
      }
    });
  }

  // =========================================================
  // 3.- DIBUJAR ZONA
  // =========================================================
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


  // =========================================================
  // 4.- ELIMINAR ZONA
  // =========================================================
  eliminarZona(idZona: string): void {
    if (confirm('¿Estás seguro de eliminar esta asignación?')) {
      this._zonaService.deleteZonaById(idZona).subscribe({
        next: (res) => {
          console.log('Asignación eliminada:', res);
          this.obtenerZonas(); //  Vuelve a cargar la lista
        },
        error: (err) => {
          console.error('Error al eliminar la asignación:', err);
          alert('Ocurrió un error al eliminar la asignación.');
        }
      });
    }
  }



  onSearchChange() {
    throw new Error('Method not implemented.');
  }

}
