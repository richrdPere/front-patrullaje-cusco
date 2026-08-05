import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import {
  DomSanitizer,
  SafeResourceUrl,
} from '@angular/platform-browser';

// Interfaces
import {
  IncidenciaArchivoDetalle,
} from 'src/app/interfaces/incidencia/archivos_incidencia.interface';

import {
  TipoArchivoIncidencia,
} from 'src/app/interfaces/incidencia/incidencias.interface';

@Component({
  selector: 'app-incidencia-archivo-preview',
  standalone: true,
  imports: [
    CommonModule,
  ],
  templateUrl: './incidencia-archivo-preview.component.html',
  styles: ``,
})
export class IncidenciaArchivoPreviewComponent implements OnChanges {

  // =========================================================
  // INPUTS
  // =========================================================

  @Input() visible = false;

  @Input() archivo:
    IncidenciaArchivoDetalle | null = null;

  @Input() archivos:
    IncidenciaArchivoDetalle[] = [];

  // =========================================================
  // OUTPUTS
  // =========================================================

  @Output() cerrar = new EventEmitter<void>();

  @Output() archivoChange =
    new EventEmitter<IncidenciaArchivoDetalle>();

  // =========================================================
  // ESTADO
  // =========================================================

  isLoading = false;
  mediaError = false;

  safePdfUrl: SafeResourceUrl | null = null;

  private currentIndex = -1;

  constructor(
    private sanitizer: DomSanitizer,
  ) { }

  // =========================================================
  // CICLO DE VIDA
  // =========================================================

  ngOnChanges(changes: SimpleChanges): void {

    if (
      changes['archivo'] ||
      changes['archivos'] ||
      changes['visible']
    ) {
      this.updateCurrentIndex();
      this.resetMediaState();
      this.updateSafePdfUrl();
    }

    if (
      changes['visible']?.currentValue === false
    ) {
      this.safePdfUrl = null;
      this.mediaError = false;
      this.isLoading = false;
    }
  }

  // =========================================================
  // TECLADO
  // =========================================================

  @HostListener('document:keydown.escape')
  onEscapePressed(): void {

    if (this.visible) {
      this.cerrarPreview();
    }
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {

    if (
      this.visible &&
      this.puedeAnterior
    ) {
      this.anterior();
    }
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {

    if (
      this.visible &&
      this.puedeSiguiente
    ) {
      this.siguiente();
    }
  }

  // =========================================================
  // NAVEGACIÓN
  // =========================================================

  get puedeAnterior(): boolean {

    return (
      this.currentIndex > 0 &&
      this.archivos.length > 1
    );
  }

  get puedeSiguiente(): boolean {

    return (
      this.currentIndex >= 0 &&
      this.currentIndex < this.archivos.length - 1
    );
  }

  get posicionActual(): number {

    if (this.currentIndex < 0) {
      return 0;
    }

    return this.currentIndex + 1;
  }

  anterior(): void {

    if (!this.puedeAnterior) {
      return;
    }

    const archivoAnterior =
      this.archivos[this.currentIndex - 1];

    this.seleccionarArchivo(
      archivoAnterior,
    );
  }

  siguiente(): void {

    if (!this.puedeSiguiente) {
      return;
    }

    const archivoSiguiente =
      this.archivos[this.currentIndex + 1];

    this.seleccionarArchivo(
      archivoSiguiente,
    );
  }

  private seleccionarArchivo(
    archivo: IncidenciaArchivoDetalle,
  ): void {

    this.archivo = archivo;

    this.updateCurrentIndex();
    this.resetMediaState();
    this.updateSafePdfUrl();

    this.archivoChange.emit(archivo);
  }

  private updateCurrentIndex(): void {

    if (
      !this.archivo ||
      this.archivos.length === 0
    ) {
      this.currentIndex = -1;
      return;
    }

    this.currentIndex =
      this.archivos.findIndex(
        item => item.id === this.archivo?.id,
      );
  }

  // =========================================================
  // TIPOS DE ARCHIVO
  // =========================================================

  get categoriaArchivo():
    TipoArchivoIncidencia {

    if (this.archivo?.tipo_archivo) {
      return this.archivo.tipo_archivo;
    }

    return this.detectarCategoriaPorMime();
  }

  get esImagen(): boolean {
    return this.categoriaArchivo === 'IMAGEN';
  }

  get esVideo(): boolean {
    return this.categoriaArchivo === 'VIDEO';
  }

  get esPdf(): boolean {
    return this.categoriaArchivo === 'PDF';
  }

  get esOtro(): boolean {
    return this.categoriaArchivo === 'OTRO';
  }

  private detectarCategoriaPorMime():
    TipoArchivoIncidencia {

    const mime =
      this.archivo?.mime_type
        ?.toLowerCase() ?? '';

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

  // =========================================================
  // NOMBRE Y EXTENSIÓN
  // =========================================================

  get nombreArchivo(): string {

    if (!this.archivo) {
      return 'Archivo de incidencia';
    }

    const extension =
      this.getExtensionArchivo();

    const tipo =
      this.categoriaArchivo.toLowerCase();

    return extension
      ? `${tipo}_${this.archivo.id}.${extension}`
      : `${tipo}_${this.archivo.id}`;
  }

  private getExtensionArchivo(): string {

    if (!this.archivo) {
      return '';
    }

    const mime =
      this.archivo.mime_type
        ?.toLowerCase() ?? '';

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

    try {

      const pathname =
        new URL(
          this.archivo.url_archivo,
        ).pathname;

      const ultimoSegmento =
        pathname.split('/').pop() ?? '';

      if (!ultimoSegmento.includes('.')) {
        return '';
      }

      return (
        ultimoSegmento
          .split('.')
          .pop()
          ?.toLowerCase() ?? ''
      );

    } catch {
      return '';
    }
  }

  // =========================================================
  // PDF SEGURO
  // =========================================================

  private updateSafePdfUrl(): void {

    if (
      this.esPdf &&
      this.archivo?.url_archivo
    ) {
      this.safePdfUrl =
        this.sanitizer
          .bypassSecurityTrustResourceUrl(
            this.archivo.url_archivo,
          );

      return;
    }

    this.safePdfUrl = null;
  }

  // =========================================================
  // ESTADO DEL RECURSO
  // =========================================================

  onMediaLoad(): void {
    this.isLoading = false;
    this.mediaError = false;
  }

  onMediaError(): void {
    this.isLoading = false;
    this.mediaError = true;
  }

  private resetMediaState(): void {

    if (
      !this.visible ||
      !this.archivo
    ) {
      this.isLoading = false;
      this.mediaError = false;
      return;
    }

    this.isLoading = true;
    this.mediaError = false;
  }

  // =========================================================
  // ACCIONES
  // =========================================================

  cerrarPreview(): void {
    this.cerrar.emit();
  }

  abrirEnNuevaPestana(): void {

    if (!this.archivo?.url_archivo) {
      return;
    }

    window.open(
      this.archivo.url_archivo,
      '_blank',
      'noopener,noreferrer',
    );
  }

  descargarArchivo(): void {

    if (!this.archivo?.url_archivo) {
      return;
    }

    const anchor =
      document.createElement('a');

    anchor.href =
      this.archivo.url_archivo;

    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = this.nombreArchivo;

    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
  }

  // =========================================================
  // INFORMACIÓN DEL ARCHIVO
  // =========================================================

  getMimeTypeVideo(): string {

    return (
      this.archivo?.mime_type ||
      'video/mp4'
    );
  }

  get tamanioFormateado(): string {

    const bytes =
      Number(this.archivo?.peso);

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
        Math.log(bytes) /
        Math.log(1024),
      ),
      unidades.length - 1,
    );

    const valor =
      bytes /
      Math.pow(1024, indice);

    return `${valor.toFixed(
      indice === 0 ? 0 : 2,
    )} ${unidades[indice]}`;
  }

  get estadoLabel(): string {

    switch (this.archivo?.estado) {
      case 'ACTIVO':
        return 'Activo';

      case 'INACTIVO':
        return 'Inactivo';

      case 'ELIMINADO':
        return 'Eliminado';

      default:
        return 'Sin estado';
    }
  }

  get tipoLabel(): string {

    switch (this.categoriaArchivo) {
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
}
