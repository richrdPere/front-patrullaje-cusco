import { Component, ElementRef, EventEmitter, HostListener, Input, NgZone, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Observable, Subject, finalize, takeUntil } from 'rxjs';
import Swal from 'sweetalert2';

// Directives
import { UppercaseDirective } from 'src/app/pages/shared/directives/uppercase.directive';

// Interfaces
import { CoordenadaZona, RiesgoZona, ZonaData } from 'src/app/interfaces/zona/zona.model';
import { CreateZonaRequest, CreateZonaResponse } from 'src/app/interfaces/zona/create-zona.model';
import { UpdateZonaRequest, UpdateZonaResponse } from 'src/app/interfaces/zona/update-zona.model';
import { ApiErrorData } from 'src/app/pages/shared/interfaces/api-error-data.model';

// Services
import { GoogleMapsLoaderService } from 'src/app/services/google-maps-loader.service';
import { ZonaService } from 'src/app/services/zona/zona.service';

declare const google: any;

@Component({
  selector: 'zona-form',
  imports: [
    ReactiveFormsModule,
    CommonModule,
    UppercaseDirective,
  ],
  templateUrl: './zona-form.component.html',
  styles: ``,
})
export class ZonaFormComponent implements OnInit, OnChanges, OnDestroy {

  // Inputs
  @Input() mostrarModal = false;
  @Input() modoEdicion = false;
  @Input() zonaSeleccionada: ZonaData | null = null;

  // Outputs
  @Output() modalCerrado = new EventEmitter<void>();
  @Output() zonaCreado = new EventEmitter<void>();

  // Formulario
  zonaForm!: FormGroup;

  isLoading = false;

  readonly nivelesRiesgo: Array<{
    id: RiesgoZona;
    nombre: string;
  }> = [
      {
        id: 'critico',
        nombre: 'CRÍTICO',
      },
      {
        id: 'alto',
        nombre: 'ALTO',
      },
      {
        id: 'medio',
        nombre: 'MEDIO',
      },
      {
        id: 'bajo',
        nombre: 'BAJO',
      },
    ];

  // Width para el modal
  modalWidthClass = 'max-w-6xl';

  setModalWidth(size: 'sm' | 'md' | 'lg' | 'xl' | 'full') {
    const map = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-4xl',
      xl: 'max-w-6xl',
      full: 'max-w-full w-[95vw]'
    };

    this.modalWidthClass = map[size];
  }

  // Google Maps
  private mapElement: ElementRef<HTMLElement> | undefined;
  private map: google.maps.Map | null = null;
  private polygon: google.maps.Polygon | null = null;
  private mapClickListener: google.maps.MapsEventListener | null = null;
  private vertices: google.maps.LatLng[] = [];
  private mapInitializationId = 0;

  drawing = false;

  coordenadas: CoordenadaZona[] = [];

  // Control de subscripciones
  private readonly destroy$ = new Subject<void>();

  @ViewChild('mapContainer')
  set mapContainer(element: ElementRef<HTMLElement> | undefined) {
    this.mapElement =
      element;

    if (
      element &&
      this.mostrarModal
    ) {
      void this.initializeMap();
    }
  }

  constructor(
    private readonly fb: FormBuilder,
    private readonly zonaService: ZonaService,
    private readonly mapsLoader: GoogleMapsLoaderService,
    private readonly ngZone: NgZone,
  ) { }

  // Ciclo de vida
  ngOnInit(): void {
    this.initializeForm();
    this.listenRiskChanges();

    if (this.mostrarModal) {
      this.prepareForm();
    }
  }

  ngOnChanges(
    changes: SimpleChanges,
  ): void {
    /*
     * ngOnChanges se ejecuta antes de ngOnInit.
     */
    if (!this.zonaForm) {
      return;
    }

    if (
      changes['mostrarModal']
    ) {
      if (this.mostrarModal) {
        this.prepareForm();
      } else {
        this.resetComponent();
      }
    }

    if (
      this.mostrarModal &&
      (
        changes['zonaSeleccionada'] ||
        changes['modoEdicion']
      )
    ) {
      this.prepareForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();

    this.clearMapResources();
  }

  // Cerrar con Escape
  @HostListener('document:keydown.escape')
  onEscapePressed(): void {
    if (
      this.mostrarModal &&
      !this.isLoading
    ) {
      this.cerrarModal();
    }
  }

  // ====================================
  // Inicializar formulario
  // ====================================
  private initializeForm(): void {
    this.zonaForm = this.fb.group({
      id: [null],
      nombre: [
        '',
        [
          Validators.required,
          Validators.minLength(3),
          Validators.maxLength(100),
        ],
      ],
      descripcion: [
        '',
        [
          Validators.maxLength(255),
        ],
      ],
      riesgo: [
        'medio',
        Validators.required,
      ],
    });
  }

  // ====================================
  // Preparar creación o edición
  // ====================================
  private prepareForm(): void {
    this.removeMapClickListener();
    this.clearPolygon();

    this.drawing = false;
    this.vertices = [];
    this.coordenadas = [];

    if (this.modoEdicion && this.zonaSeleccionada) {
      const zona = this.zonaSeleccionada;

      this.zonaForm.reset({
        id: zona.id,
        nombre: zona.nombre,
        descripcion: zona.descripcion ?? '',
        riesgo: zona.riesgo,
      });

      this.coordenadas =
        zona.coordenadas.map(
          (coordenada) => ({
            lat: coordenada.lat,
            lng: coordenada.lng,
          }),
        );

      /*
       * Si el mapa ya está disponible, dibuja inmediatamente.
       * Si todavía no existe, initializeMap() lo hará después.
       */
      this.drawCurrentPolygon();

      return;
    }

    this.modoEdicion = false;

    this.zonaForm.reset({
      id: null,
      nombre: '',
      descripcion: '',
      riesgo: 'medio',
    });
  }

  // ====================================
  // Escuchar cambios del nivel de riesgo
  // ====================================
  private listenRiskChanges(): void {
    this.zonaForm
      .get('riesgo')?.valueChanges
      .pipe(
        takeUntil(
          this.destroy$,
        ),
      )
      .subscribe(
        (
          riesgo: RiesgoZona | null,
        ) => {
          if (!riesgo || !this.polygon) {
            return;
          }

          const color = this.getRiskColor(riesgo);

          this.polygon.setOptions({
            strokeColor: color,
            fillColor: color,
          });
        },
      );
  }

  // ====================================
  // Inicializar Google Maps
  // ====================================
  private async initializeMap(): Promise<void> {
    const initializationId = ++this.mapInitializationId;

    try {
      await this.mapsLoader.load();

      /*
       * Evita crear el mapa si el modal se cerró mientras cargaba.
       */
      if (
        initializationId !==
        this.mapInitializationId ||
        !this.mostrarModal ||
        !this.mapElement
      ) {
        return;
      }

      this.map = new google.maps.Map(
        this.mapElement.nativeElement,
        {
          center: {
            lat: -13.532,
            lng: -71.967,
          },

          zoom: 15,

          mapTypeControl: true,
          streetViewControl: false,
          fullscreenControl: true,
        },
      );

      this.drawCurrentPolygon();

      /*
       * Corrige dimensiones cuando Google Maps está dentro de un modal.
       */
      setTimeout(() => {
        if (!this.map) {
          return;
        }

        google.maps.event.trigger(
          this.map,
          'resize',
        );

        if (this.coordenadas.length >= 3) {
          this.fitPolygonBounds(
            this.coordenadas,
          );
        }
      });
    } catch (error) {
      console.error(
        'Error inicializando Google Maps:',
        error,
      );

      void Swal.fire({
        icon: 'error',
        title:
          'No se pudo cargar el mapa',
        text:
          'Verifique la conexión y la configuración de Google Maps.',
      });
    }
  }

  // ====================================
  // Iniciar dibujo
  // ====================================
  initDraw(): void {
    if (!this.map) {
      void Swal.fire({
        icon: 'warning',
        title: 'Mapa no disponible',
        text: 'Espere a que el mapa termine de cargar.',
      });

      return;
    }

    this.removeMapClickListener();
    this.clearPolygon();

    this.vertices = [];
    this.coordenadas = [];
    this.drawing = true;

    const riesgo = this.zonaForm.get('riesgo')?.value as RiesgoZona;
    const color = this.getRiskColor(riesgo || 'medio');

    this.polygon = new google.maps.Polygon({
      paths: [],
      editable: true,
      draggable: false,

      strokeColor: color,
      strokeOpacity: 1,
      strokeWeight: 2,

      fillColor: color,
      fillOpacity: 0.25,
    });

    this.polygon!.setMap(
      this.map,
    );

    this.mapClickListener =
      this.map.addListener(
        'click',
        (
          event: google.maps.MapMouseEvent,
        ) => {
          if (
            !event.latLng ||
            !this.polygon
          ) {
            return;
          }

          /*
           * Google Maps puede ejecutar el callback fuera
           * del ciclo de detección de Angular.
           */
          this.ngZone.run(() => {
            this.vertices.push(
              event.latLng!,
            );

            this.polygon?.setPath(
              this.vertices,
            );
          });
        },
      );
  }

  // ====================================
  // Finalizar dibujo
  // ====================================
  finishedDraw(): void {
    if (!this.polygon) {
      return;
    }

    const path = this.polygon
      .getPath()
      .getArray();

    if (path.length < 3) {
      void Swal.fire({
        icon: 'warning',
        title: 'Polígono incompleto',
        text: 'Debe agregar al menos tres vértices para definir la zona.',
      });

      return;
    }

    this.removeMapClickListener();
    this.syncPolygonCoordinates();

    this.polygon.setEditable(true);

    this.drawing = false;
  }

  // ====================================
  // Limpiar dibujo
  // ====================================
  cancelDraw(): void {
    this.removeMapClickListener();
    this.clearPolygon();

    this.vertices = [];
    this.coordenadas = [];
    this.drawing = false;
  }

  // ====================================
  // Dibujar coordenadas existentes
  // ====================================
  private drawCurrentPolygon(): void {
    if (
      !this.map ||
      this.coordenadas.length < 3
    ) {
      return;
    }

    this.clearPolygon();

    const riesgo =
      (
        this.zonaForm?.get(
          'riesgo',
        )?.value ||
        'medio'
      ) as RiesgoZona;

    const color =
      this.getRiskColor(
        riesgo,
      );

    this.polygon =
      new google.maps.Polygon({
        paths: this.coordenadas,
        editable: true,
        draggable: false,

        strokeColor: color,
        strokeOpacity: 1,
        strokeWeight: 2,

        fillColor: color,
        fillOpacity: 0.25,
      });

    this.polygon!.setMap(
      this.map,
    );

    this.fitPolygonBounds(
      this.coordenadas,
    );
  }

  // ====================================
  // Sincronizar coordenadas editadas
  // ====================================
  private syncPolygonCoordinates(): void {
    if (!this.polygon) {
      this.coordenadas = [];
      return;
    }

    const path =
      this.polygon
        .getPath()
        .getArray();

    this.coordenadas =
      path.map(
        (
          point:
            google.maps.LatLng,
        ) => ({
          lat: point.lat(),
          lng: point.lng(),
        }),
      );
  }

  // ====================================
  // Methods
  // ====================================

  // - Crear o actualizar zona
  guardarZona(): void {
    if (this.drawing) {
      void Swal.fire({
        icon: 'warning',
        title: 'Dibujo sin finalizar',
        text: 'Finalice el dibujo del polígono antes de guardar.',
      });

      return;
    }

    this.syncPolygonCoordinates();

    if (this.coordenadas.length < 3) {
      void Swal.fire({
        icon: 'warning',
        title: 'Zona no definida',
        text: 'Debe dibujar un perímetro de al menos tres vértices.',
      });

      return;
    }

    if (this.zonaForm.invalid) {
      this.zonaForm.markAllAsTouched();

      void Swal.fire({
        icon: 'warning',
        title: 'Formulario incompleto',
        text: 'Complete correctamente los campos obligatorios.',
      });

      return;
    }

    const formValue = this.zonaForm.getRawValue();

    const payload: UpdateZonaRequest = {
      nombre: formValue.nombre.trim(),
      descripcion: formValue.descripcion?.trim() || null,
      riesgo: formValue.riesgo as RiesgoZona,
      coordenadas: this.coordenadas,
    };

    const zonaId = Number(formValue.id);

    let request$: Observable<CreateZonaResponse | UpdateZonaResponse>;

    if (this.modoEdicion && Number.isInteger(zonaId) && zonaId > 0) {
      request$ = this.zonaService
        .updateZona(
          zonaId,
          payload,
        );
    } else {
      const createPayload:
        CreateZonaRequest = {
        ...payload,
      };

      request$ =
        this.zonaService
          .createZona(
            createPayload,
          );
    }

    this.isLoading = true;

    request$
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: (response) => {
          void Swal.fire({
            icon: 'success',

            title:
              this.modoEdicion
                ? 'Zona actualizada'
                : 'Zona registrada',

            text:
              response.message,

            timer: 1800,
            showConfirmButton:
              false,
          });

          this.zonaCreado.emit();
          this.cerrarModal();
        },

        error: (
          error: ApiErrorData,
        ) => {
          void Swal.fire({
            icon: 'error',

            title:
              this.modoEdicion
                ? 'No se pudo actualizar la zona'
                : 'No se pudo registrar la zona',

            text:
              error.message ||
              'Ocurrió un error al guardar la zona.',
          });
        },
      });
  }

  // - Cerrar modal
  cerrarModal(): void {
    if (this.isLoading) {
      return;
    }

    this.clearMapResources();
    this.resetForm();

    /*
     * El padre es responsable de cambiar mostrarModal a false.
     */
    this.modalCerrado.emit();
  }

  // -  Restablecer componente
  private resetComponent(): void {
    this.clearMapResources();
    this.resetForm();
  }

  private resetForm(): void {
    if (!this.zonaForm) {
      return;
    }

    this.zonaForm.reset({
      id: null,
      nombre: '',
      descripcion: '',
      riesgo: 'medio',
    });

    this.vertices = [];
    this.coordenadas = [];
    this.drawing = false;
  }

  // ====================================
  // Helpers del mapa
  // ====================================
  get totalVertices(): number {
    if (this.polygon) {
      return this.polygon
        .getPath()
        .getLength();
    }

    return this.coordenadas.length;
  }

  private fitPolygonBounds(coordenadas: CoordenadaZona[]): void {
    if (
      !this.map ||
      coordenadas.length === 0
    ) {
      return;
    }

    const bounds = new google.maps.LatLngBounds();

    coordenadas.forEach(
      (coordenada) => {
        bounds.extend(
          new google.maps.LatLng(
            coordenada.lat,
            coordenada.lng,
          ),
        );
      },
    );

    this.map.fitBounds(bounds);
  }

  private getRiskColor(riesgo: RiesgoZona): string {
    const colors:
      Record<
        RiesgoZona,
        string
      > = {
      bajo: '#16A34A',
      medio: '#F59E0B',
      alto: '#DC2626',
      critico: '#7F1D1D',
    };

    return (
      colors[riesgo] ||
      colors.medio
    );
  }

  private removeMapClickListener(): void {
    if (!this.mapClickListener) {
      return;
    }

    google.maps.event.removeListener(this.mapClickListener);

    this.mapClickListener = null;
  }

  private clearPolygon(): void {
    if (this.polygon) {
      this.polygon.setMap(
        null,
      );
    }

    this.polygon = null;
  }

  private clearMapResources(): void {
    /*
     * Invalida cualquier inicialización asíncrona pendiente.
     */
    this.mapInitializationId += 1;

    this.removeMapClickListener();
    this.clearPolygon();

    if (this.map) {
      google.maps.event
        .clearInstanceListeners(
          this.map,
        );
    }

    this.map = null;
  }
}
