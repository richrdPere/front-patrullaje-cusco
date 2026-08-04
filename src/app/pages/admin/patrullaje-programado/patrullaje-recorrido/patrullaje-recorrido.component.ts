import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';

import { Subject, takeUntil } from 'rxjs';

// Interfaces
import { PuntoRecorridoPatrullaje, RecorridoPatrullajeData } from 'src/app/interfaces/patrullaje_programado/recorrido_patrullaje.interface';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { PatrullajeProgramadoService } from 'src/app/services/patrullaje_programado.service';


@Component({
  selector: 'patrullaje-recorrido',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    DecimalPipe
  ],
  templateUrl: './patrullaje-recorrido.component.html',
  styles: ``
})
export class PatrullajeRecorridoComponent
  implements AfterViewInit, OnChanges, OnDestroy {

  // =====================================================
  // INPUTS / OUTPUTS
  // =====================================================

  @Input({ required: true })
  patrullajeId!: number;

  @Output()
  cerrar = new EventEmitter<void>();

  @ViewChild('mapaRecorrido')
  mapaElement!:
    ElementRef<HTMLDivElement>;

  // =====================================================
  // ESTADO
  // =====================================================
  recorrido: RecorridoPatrullajeData | null = null;
  cargando = false;
  mapaCargado = false;
  error: string | null = null;

  // =====================================================
  // GOOGLE MAPS
  // =====================================================
  private map: google.maps.Map | null = null;
  private recorridoPolyline: google.maps.Polyline | null = null;
  private marcadorInicio: google.maps.Marker | null = null;
  private marcadorFin: google.maps.Marker | null = null;
  private puntosMarkers: google.maps.Marker[] = [];

  // =====================================================
  // RXJS
  // =====================================================
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly mapsLoader: GoogleMapsLoaderService,
    private readonly patrullajeService: PatrullajeProgramadoService
  ) { }

  // =====================================================
  // CICLO DE VIDA
  // =====================================================

  async ngAfterViewInit():
    Promise<void> {

    try {
      await this.mapsLoader.load();

      this.crearMapa();

      this.mapaCargado = true;

      this.cargarRecorrido();
    } catch (error) {
      console.error(
        '❌ Error cargando Google Maps:',
        error
      );

      this.error =
        'No se pudo inicializar el mapa.';
    }
  }

  ngOnChanges(
    changes: SimpleChanges
  ): void {

    if (
      changes['patrullajeId'] &&
      !changes['patrullajeId'].firstChange &&
      this.map
    ) {
      this.cargarRecorrido();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.limpiarMapa();
  }

  // =====================================================
  // MAPA
  // =====================================================
  private crearMapa(): void {

    const centroCusco:
      google.maps.LatLngLiteral = {
      lat: -13.540348,
      lng: -71.982898
    };

    this.map = new google.maps.Map(
      this.mapaElement.nativeElement,
      {
        center: centroCusco,
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
  // CARGAR RECORRIDO
  // =====================================================
  private cargarRecorrido(): void {

    if (
      !this.map ||
      !Number.isInteger(this.patrullajeId) ||
      this.patrullajeId <= 0
    ) {
      return;
    }

    this.cargando = true;
    this.error = null;
    this.recorrido = null;

    this.limpiarMapa();

    this.patrullajeService.getRecorridoPatrullajeProgramado(this.patrullajeId)
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: response => {

          this.cargando = false;

          if (!response.success || !response.data) {
            this.error =
              response.message ||
              'No se pudo obtener el recorrido.';

            return;
          }

          this.recorrido = response.data;

          this.dibujarRecorrido(response.data.puntos);
        },

        error: error => {

          this.cargando = false;

          this.error =
            error?.error?.message ??
            error?.error?.error ??
            'No se pudo cargar el recorrido del patrullaje.';

          console.error(
            '❌ Error obteniendo recorrido:',
            error
          );
        }
      });
  }

  // =====================================================
  // DIBUJAR RECORRIDO
  // =====================================================
  private dibujarRecorrido(
    puntos: PuntoRecorridoPatrullaje[]
  ): void {

    if (!this.map) {
      return;
    }

    const puntosValidos = puntos.filter(
      punto =>
        Number.isFinite(punto.lat) &&
        Number.isFinite(punto.lng) &&
        punto.lat >= -90 &&
        punto.lat <= 90 &&
        punto.lng >= -180 &&
        punto.lng <= 180
    );

    if (
      puntosValidos.length === 0
    ) {
      return;
    }

    const path:
      google.maps.LatLngLiteral[] =
      puntosValidos.map(
        punto => ({
          lat: punto.lat,
          lng: punto.lng
        })
      );

    this.recorridoPolyline =
      new google.maps.Polyline({
        path,
        map: this.map,
        geodesic: true,
        strokeColor: '#7C3AED',
        strokeOpacity: 0.95,
        strokeWeight: 6,
        zIndex: 10
      });

    const puntoInicio = puntosValidos[0];

    const puntoFin = puntosValidos[
      puntosValidos.length - 1
    ];

    this.marcadorInicio = this.crearMarcadorExtremo(
      puntoInicio,
      'I',
      'Inicio del recorrido'
    );

    this.marcadorFin = this.crearMarcadorExtremo(
      puntoFin,
      'F',
      this.recorrido?.patrullaje.estado ===
        'FINALIZADO'
        ? 'Fin del recorrido'
        : 'Última ubicación registrada'
    );

    this.ajustarMapaAlRecorrido(
      path
    );
  }

  // =====================================================
  // MARCADORES
  // =====================================================
  private crearMarcadorExtremo(
    punto: PuntoRecorridoPatrullaje,
    label: string,
    title: string
  ): google.maps.Marker {

    if (!this.map) {
      throw new Error(
        'El mapa no está inicializado.'
      );
    }

    const marker =
      new google.maps.Marker({
        position: {
          lat: punto.lat,
          lng: punto.lng
        },

        map: this.map,

        title,

        label: {
          text: label,
          color: '#FFFFFF',
          fontWeight: '700'
        }
      });

    const infoWindow =
      new google.maps.InfoWindow({
        content:
          this.crearContenidoPunto(
            punto,
            title
          )
      });

    marker.addListener(
      'click',
      () => {
        infoWindow.open({
          map:
            this.map!,

          anchor:
            marker
        });
      }
    );

    return marker;
  }

  private crearContenidoPunto(
    punto: PuntoRecorridoPatrullaje,
    titulo: string
  ): string {

    const fecha = new Date(punto.fechaHora);

    const fechaTexto = Number.isNaN(fecha.getTime())
      ? '-'
      : fecha.toLocaleString(
        'es-PE',
        {
          timeZone:
            'America/Lima'
        }
      );

    const velocidadKmh = punto.velocidad !== null
      ? (
        Math.max(
          0,
          punto.velocidad
        ) * 3.6
      ).toFixed(2)
      : '-';

    const precision = punto.precision !== null
      ? punto.precision.toFixed(2)
      : '-';

    return `
      <div style="
        min-width:220px;
        font-family:Arial,sans-serif;
      ">
        <h3 style="
          margin:0 0 10px;
          font-size:14px;
          font-weight:700;
        ">
          ${titulo}
        </h3>

        <div style="
          display:grid;
          gap:6px;
          font-size:12px;
        ">
          <div>
            <strong>Fecha:</strong>
            ${fechaTexto}
          </div>

          <div>
            <strong>Velocidad:</strong>
            ${velocidadKmh} km/h
          </div>

          <div>
            <strong>Precisión:</strong>
            ${precision} m
          </div>

          <div>
            <strong>Tipo:</strong>
            ${punto.tipo}
          </div>

          <div>
            <strong>Coordenadas:</strong>
            ${punto.lat.toFixed(6)},
            ${punto.lng.toFixed(6)}
          </div>
        </div>
      </div>
    `;
  }

  // =====================================================
  // AJUSTAR MAPA
  // =====================================================
  private ajustarMapaAlRecorrido(
    puntos:
      google.maps.LatLngLiteral[]
  ): void {

    if (
      !this.map ||
      puntos.length === 0
    ) {
      return;
    }

    if (puntos.length === 1) {
      this.map.setCenter(
        puntos[0]
      );
      this.map.setZoom(17);
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    puntos.forEach(punto => bounds.extend(punto));

    this.map.fitBounds(bounds, 50);
  }

  // =====================================================
  // RECARGAR
  // =====================================================
  recargarRecorrido(): void {
    this.cargarRecorrido();
  }

  // =====================================================
  // CERRAR
  // =====================================================
  cerrarModal(): void {
    this.cerrar.emit();
  }

  // =====================================================
  // LIMPIAR MAPA
  // =====================================================
  private limpiarMapa(): void {
    this.recorridoPolyline?.setMap(null);
    this.marcadorInicio?.setMap(null);
    this.marcadorFin?.setMap(null);

    this.puntosMarkers.forEach(marker => {
      marker.setMap(null);
    });

    this.recorridoPolyline = null;
    this.marcadorInicio = null;
    this.marcadorFin = null;
    this.puntosMarkers = [];
  }
}
