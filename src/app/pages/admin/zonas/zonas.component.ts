
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
import { CommonModule } from '@angular/common';

declare var google: any;

@Component({
  selector: 'app-zonas',
  imports: [FormsModule, ReactiveFormsModule, CommonModule, UppercaseDirective],
  templateUrl: './zonas.component.html',
  styles: ``
})
export class ZonasComponent implements OnInit {

  // Poligon maps
  private vertices: google.maps.LatLng[] = [];
  private clickListener!: google.maps.MapsEventListener;
  private tempPolygon!: google.maps.Polygon;
  drawing = false;

  // Zonas
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
  // drawingManager!: google.maps.drawing.DrawingManager;
  polygon!: google.maps.Polygon;
  zonaForm!: FormGroup;
  coordenadas: { lat: number, lng: number }[] = [];

  zonas: ZonaPatrullaje[] = [];
  zonasVisibles: { [id: string]: boolean } = {};
  poligonos: { [id: string]: google.maps.Polygon } = {};

  @ViewChild('mapContainer') mapaElement!: ElementRef;


  nivel_riesgo = [
    { id: 'alto', nombre: 'ALTO' },
    { id: 'medio', nombre: 'MEDIO' },
    { id: 'bajo', nombre: 'BAJO' },

  ];

  constructor(
    private mapsLoader: GoogleMapsLoaderService,
    //private fb: FormBuilder,
    private _zonaService: ZonaService
  ) { }

  ngOnInit(): void {
    this.zonaForm = this.fb.group({
      id: [null],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      riesgo: [null, Validators.required],
    });

    this.mapsLoader.load().then(() => {
      this.initMap();
      // this.initDrawingManager();
    });

    this.obtenerZonas();
  }

  initMap(): void {
    this.map = new google.maps.Map(this.mapaElement.nativeElement, {
      center: { lat: -13.532, lng: -71.967 },
      zoom: 15,
    });
  }

  initDraw() {
    this.drawing = true;
    this.vertices = [];

    if (this.tempPolygon) {
      this.tempPolygon.setMap(null);
    }

    this.tempPolygon = new google.maps.Polygon({
      paths: [],
      editable: true,
      strokeColor: "#FF0000",
      strokeOpacity: 1,
      strokeWeight: 2,
      fillColor: "#FF0000",
      fillOpacity: 0.35
    });

    this.tempPolygon.setMap(this.map);

    this.clickListener = this.map.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (!e.latLng) return;
      this.vertices.push(e.latLng);
      this.tempPolygon.setPath(this.vertices);
    });
  }

  finishedDraw() {

    if (this.vertices.length < 3) {

      Swal.fire({
        icon: 'warning',
        title: 'Polígono incompleto',
        text: 'Debe agregar al menos tres vértices para definir la zona.'
      });

      return;
    }

    google.maps.event.removeListener(this.clickListener);
    this.tempPolygon.setEditable(false);
    this.coordenadas = this.vertices.map(v => ({
      lat: v.lat(),
      lng: v.lng()
    }));
    this.polygon = this.tempPolygon;
    this.drawing = false;
  }

  cancelDraw() {
    if (this.clickListener) {
      google.maps.event.removeListener(this.clickListener);
    }

    if (this.tempPolygon) {
      this.tempPolygon.setMap(null);
    }
    this.vertices = [];
    this.coordenadas = [];
    this.drawing = false;
  }



  // =========================================================
  // 1.- OBTENER TODAS LAS ZONAS
  // =========================================================
  obtenerZonas() {
    this._zonaService.obtenerZonas().subscribe({
      next: (res) => {
        this.zonas = res.data.rows // Guardar lAS ZONAS

        console.log("OBTENIENDO ZOANS: ", this.zonas);

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
    if (!this.polygon || this.coordenadas.length < 3) {

      Swal.fire({
        icon: 'warning',
        title: 'Zona no definida',
        text: 'Debe dibujar el perímetro de la zona antes de registrarla.'
      });
      return;
    }

    if (this.zonaForm.invalid) {
      Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Completa todos los campos obligatorios.'
      });
      return;
    }

    const zona: ZonaPatrullaje = {
      id: 0,
      nombre: this.zonaForm.value.nombre,
      descripcion: this.zonaForm.value.descripcion,
      coordenadas: this.coordenadas,
      riesgo: this.zonaForm.value.riesgo,
    };

    this._zonaService.crearZona(zona).subscribe({
      next: (res) => {
        Swal.fire({
          icon: 'success',
          title: 'Zona registrada',
          text: res.message,
          timer: 1800,
          showConfirmButton: false
        });

        this.zonaForm.reset();
        this.coordenadas = [];

        // Elimina el polígono actual del mapa
        this.polygon.setMap(null);
        this.polygon = undefined!;
        // this.drawingManager.setDrawingMode(google.maps.drawing.OverlayType.POLYGON);

        // Cargar Zonas
        this.obtenerZonas();
      },
      error: (err) => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Error',
          text: err?.message ?? 'Ocurrió un error al registrar la zona.'
        });
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
        zona.riesgo === 'alto' ? '#FF0000' :       // Rojo
          zona.riesgo === 'medio' ? '#FFA500' :      // Naranja
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
  eliminarZona(idZona: number): void {

    Swal.fire({
      title: '¿Eliminar zona?',
      text: 'Esta acción no se puede deshacer.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar',
      reverseButtons: true
    }).then((result) => {

      if (!result.isConfirmed) return;

      this._zonaService.deleteZonaById(idZona).subscribe({

        next: (res) => {

          Swal.fire({
            icon: 'success',
            title: 'Zona eliminada',
            text: res.message,
            timer: 1800,
            showConfirmButton: false
          });

          this.obtenerZonas();
        },

        error: (err) => {

          console.error('Error al eliminar la zona:', err);

          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: err?.error?.message || 'Ocurrió un error al eliminar la zona.'
          });
        }
      });
    });
  }

  onSearchChange() {
    throw new Error('Method not implemented.');
  }

}
