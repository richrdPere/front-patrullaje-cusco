import { CommonModule, DatePipe } from '@angular/common';
import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { finalize } from 'rxjs';

// Service
import {
  IncidenciasService,
} from 'src/app/services/incidencias.service';

// Interfaces
import {
  ArchivosIncidenciaData,
  IncidenciaArchivoDetalle,
} from 'src/app/interfaces/incidencia/archivos_incidencia.interface';

import {
  TipoArchivoIncidencia,
} from 'src/app/interfaces/incidencia/incidencias.interface';

// Components
import {
  IncidenciaArchivoPreviewComponent,
} from '../incidencia-archivo-preview/incidencia-archivo-preview.component';

@Component({
  selector: 'incidencia-archivos',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    IncidenciaArchivoPreviewComponent,
  ],
  templateUrl: './incidencia-archivos.component.html',
  styles: ``,
})
export class IncidenciaArchivosComponent implements OnChanges {

  // INPUTS
  @Input() incidenciaId: number | null = null;
  @Input() visible = false;

  // OUTPUTS
  @Output() cerrar = new EventEmitter<void>();
  @Output() archivosCargados = new EventEmitter<IncidenciaArchivoDetalle[]>();


  // ESTADO
  data: ArchivosIncidenciaData | null = null;

  archivos: IncidenciaArchivoDetalle[] = [];

  isLoading = false;
  errorMessage = '';

  // Preview
  mostrarPreview = false;

  archivoSeleccionado:
    IncidenciaArchivoDetalle | null = null;

  constructor(
    private incidenciasService: IncidenciasService,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnChanges(changes: SimpleChanges): void {

    const incidenciaChange =
      changes['incidenciaId'];

    const visibleChange =
      changes['visible'];

    const debeConsultar =
      this.visible &&
      this.incidenciaId !== null &&
      (
        visibleChange?.currentValue === true ||
        incidenciaChange
      );

    if (debeConsultar) {
      this.getArchivos();
    }

    if (
      visibleChange &&
      visibleChange.currentValue === false
    ) {
      this.limpiarEstado();
    }
  }

  // =========================================================
  // CONSULTA
  // =========================================================

  getArchivos(): void {

    if (
      this.incidenciaId === null ||
      this.incidenciaId <= 0 ||
      this.isLoading
    ) {
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.archivos = [];
    this.data = null;

    this.incidenciasService
      .getArchivosIncidencia(this.incidenciaId)
      .pipe(
        finalize(() => {
          this.isLoading = false;
        }),
      )
      .subscribe({
        next: response => {

          if (
            !response.success ||
            !response.data
          ) {
            this.errorMessage =
              response.message ||
              'No fue posible obtener los archivos de la incidencia.';

            return;
          }

          this.data = response.data;

          /*
           * La interfaz ArchivosIncidenciaData contiene:
           *
           * data: IncidenciaArchivoDetalle[]
           */
          this.archivos = (
            response.data.data ?? []
          ).filter(
            archivo => archivo.estado === 'ACTIVO',
          );

          this.archivosCargados.emit(
            this.archivos,
          );
        },

        error: error => {

          console.error(
            'Error al obtener archivos de incidencia:',
            error,
          );

          this.errorMessage =
            error?.error?.message ||
            error?.message ||
            'Ocurrió un error al consultar las evidencias.';
        },
      });
  }

  // =========================================================
  // PREVIEW
  // =========================================================

  abrirPreview(
    archivo: IncidenciaArchivoDetalle,
  ): void {

    if (
      archivo.estado !== 'ACTIVO' ||
      !archivo.url_archivo
    ) {
      return;
    }

    this.archivoSeleccionado = archivo;
    this.mostrarPreview = true;
  }

  cerrarPreview(): void {
    this.mostrarPreview = false;
    this.archivoSeleccionado = null;
  }

  onArchivoPreviewChange(
    archivo: IncidenciaArchivoDetalle,
  ): void {
    this.archivoSeleccionado = archivo;
  }

  // =========================================================
  // MODAL
  // =========================================================

  cerrarModal(): void {

    if (this.mostrarPreview) {
      this.cerrarPreview();
      return;
    }

    this.cerrar.emit();
  }

  reintentar(): void {
    this.getArchivos();
  }

  // =========================================================
  // RESUMEN
  // =========================================================

  get totalArchivos(): number {
    return this.archivos.length;
  }

  get totalImagenes(): number {

    return this.archivos.filter(
      archivo =>
        this.getCategoria(archivo) === 'IMAGEN',
    ).length;
  }

  get totalVideos(): number {

    return this.archivos.filter(
      archivo =>
        this.getCategoria(archivo) === 'VIDEO',
    ).length;
  }

  get totalPdf(): number {

    return this.archivos.filter(
      archivo =>
        this.getCategoria(archivo) === 'PDF',
    ).length;
  }

  get totalOtros(): number {

    return this.archivos.filter(
      archivo =>
        this.getCategoria(archivo) === 'OTRO',
    ).length;
  }

  /**
   * Total que informa directamente el backend.
   */
  get totalBackend(): number {
    return this.data?.total ?? 0;
  }

  /**
   * Total de evidencias que informa directamente el backend.
   */
  get totalEvidenciasBackend(): number {
    return this.data?.total_evidencias ?? 0;
  }

  // =========================================================
  // TIPO DE ARCHIVO
  // =========================================================

  getCategoria(
    archivo: IncidenciaArchivoDetalle,
  ): TipoArchivoIncidencia {

    if (archivo.tipo_archivo) {
      return archivo.tipo_archivo;
    }

    const mime =
      archivo.mime_type?.toLowerCase() ?? '';

    if (mime.startsWith('image/')) {
      return 'IMAGEN';
    }

    if (mime.startsWith('video/')) {
      return 'VIDEO';
    }

    if (mime === 'application/pdf') {
      return 'PDF';
    }

    return 'OTRO';
  }

  getNombreArchivo(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    const extension =
      this.getExtensionArchivo(archivo);

    const tipo =
      this.getCategoria(archivo).toLowerCase();

    return extension
      ? `${tipo}_${archivo.id}.${extension}`
      : `${tipo}_${archivo.id}`;
  }

  getExtensionArchivo(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    const mime =
      archivo.mime_type?.toLowerCase() ?? '';

    const extensionesPorMime:
      Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/heic': 'heic',
      'image/heif': 'heif',

      'video/mp4': 'mp4',
      'video/quicktime': 'mov',
      'video/webm': 'webm',

      'application/pdf': 'pdf',
    };

    const extensionMime =
      extensionesPorMime[mime];

    if (extensionMime) {
      return extensionMime;
    }

    /*
     * Intenta recuperar la extensión desde la URL.
     * Se ignoran los query params de URLs firmadas.
     */
    try {

      const pathname =
        new URL(archivo.url_archivo).pathname;

      const lastSegment =
        pathname.split('/').pop() ?? '';

      const extension =
        lastSegment.includes('.')
          ? lastSegment.split('.').pop()
          : '';

      return extension?.toLowerCase() ?? '';

    } catch {
      return '';
    }
  }

  getIconoArchivo(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    switch (this.getCategoria(archivo)) {
      case 'IMAGEN':
        return 'fa-solid fa-image';

      case 'VIDEO':
        return 'fa-solid fa-video';

      case 'PDF':
        return 'fa-solid fa-file-pdf';

      case 'OTRO':
      default:
        return 'fa-solid fa-file';
    }
  }

  getBadgeClass(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    switch (this.getCategoria(archivo)) {
      case 'IMAGEN':
        return 'badge-info';

      case 'VIDEO':
        return 'badge-secondary';

      case 'PDF':
        return 'badge-error';

      case 'OTRO':
      default:
        return 'badge-ghost';
    }
  }

  getTipoLabel(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    switch (this.getCategoria(archivo)) {
      case 'IMAGEN':
        return 'Imagen';

      case 'VIDEO':
        return 'Video';

      case 'PDF':
        return 'Documento PDF';

      case 'OTRO':
      default:
        return 'Otro archivo';
    }
  }

  // =========================================================
  // ESTADO DEL ARCHIVO
  // =========================================================

  getEstadoLabel(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    switch (archivo.estado) {
      case 'ACTIVO':
        return 'Activo';

      case 'INACTIVO':
        return 'Inactivo';

      case 'ELIMINADO':
        return 'Eliminado';

      default:
        return archivo.estado;
    }
  }

  getEstadoBadgeClass(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    switch (archivo.estado) {
      case 'ACTIVO':
        return 'badge-success';

      case 'INACTIVO':
        return 'badge-warning';

      case 'ELIMINADO':
        return 'badge-error';

      default:
        return 'badge-ghost';
    }
  }

  // =========================================================
  // TAMAÑO
  // =========================================================

  getTamanioFormateado(
    archivo: IncidenciaArchivoDetalle,
  ): string {

    const bytes =
      Number(archivo.peso);

    if (
      !Number.isFinite(bytes) ||
      bytes <= 0
    ) {
      return 'Tamaño no disponible';
    }

    const unidades = [
      'B',
      'KB',
      'MB',
      'GB',
    ];

    const indice = Math.min(
      Math.floor(
        Math.log(bytes) / Math.log(1024),
      ),
      unidades.length - 1,
    );

    const valor =
      bytes / Math.pow(1024, indice);

    return `${valor.toFixed(
      indice === 0 ? 0 : 2,
    )} ${unidades[indice]}`;
  }

  // =========================================================
  // ACCIONES
  // =========================================================

  abrirEnNuevaPestana(
    archivo: IncidenciaArchivoDetalle,
    event?: Event,
  ): void {

    event?.stopPropagation();

    if (!archivo.url_archivo) {
      return;
    }

    window.open(
      archivo.url_archivo,
      '_blank',
      'noopener,noreferrer',
    );
  }

  descargarArchivo(
    archivo: IncidenciaArchivoDetalle,
    event?: Event,
  ): void {

    event?.stopPropagation();

    if (!archivo.url_archivo) {
      return;
    }

    const anchor =
      document.createElement('a');

    anchor.href = archivo.url_archivo;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download =
      this.getNombreArchivo(archivo);

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  // =========================================================
  // LIMPIAR
  // =========================================================

  private limpiarEstado(): void {

    this.data = null;
    this.archivos = [];
    this.errorMessage = '';
    this.isLoading = false;

    this.cerrarPreview();
  }
}
