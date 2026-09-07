import { HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';

import { ApiErrorData } from '../interfaces/api-error-data.model';


export type HttpQueryValue =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined
  | readonly (string | number | boolean)[];

export type HttpQueryParams =
  Record<string, HttpQueryValue>;

export interface HttpHeaderOptions {
  token?: string | null;
  extraHeaders?: Record<string, string>;
}

export class HttpServiceHelper {
  private constructor() { }

  // *********************************************************
  // 1. HEADERS JSON
  // *********************************************************
  static getHeaders(
    options: HttpHeaderOptions = {},
  ): HttpHeaders {
    const token = this.normalizeToken(options.token);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.extraHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  // *********************************************************
  // 2. HEADERS MULTIPART
  // *********************************************************
  static getMultipartHeaders(
    options: HttpHeaderOptions = {},
  ): HttpHeaders {
    const token = this.normalizeToken(options.token);

    /*
     * No agregar Content-Type cuando se utiliza FormData.
     * El navegador genera automáticamente multipart/form-data
     * junto con el boundary correspondiente.
     */
    const headers: Record<string, string> = {
      Accept: 'application/json',
      ...options.extraHeaders,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  // *********************************************************
  // 3. CONSTRUIR QUERY PARAMS
  // *********************************************************
  static buildParams(
    values: HttpQueryParams = {},
  ): HttpParams {
    let params = new HttpParams();

    Object.entries(values).forEach(([key, value]) => {
      if (
        value === null ||
        value === undefined ||
        value === ''
      ) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => {
          params = params.append(
            key,
            String(item),
          );
        });

        return;
      }

      if (value instanceof Date) {
        params = params.set(
          key,
          value.toISOString(),
        );

        return;
      }

      params = params.set(
        key,
        String(value),
      );
    });

    return params;
  }

  // *********************************************************
  // 4. CONSTRUIR ERROR
  // *********************************************************
  static buildError(
    error: unknown,
    fallbackMessage =
      'Ocurrió un error al procesar la solicitud.',
  ): ApiErrorData {
    if (!(error instanceof HttpErrorResponse)) {
      return {
        message: fallbackMessage,
        error:
          error instanceof Error
            ? error.message
            : String(error),
        statusCode: 0,
      };
    }

    const body = this.normalizeErrorBody(error.error);
    const message = this.readString(body, 'message');
    const backendError = this.readString(body, 'error');

    return {
      message:
        message ??
        this.getDefaultErrorMessage(
          error.status,
          fallbackMessage,
        ),
      error: backendError ?? error.message ?? null,
      statusCode: error.status,
      details: body,
    };
  }

  // *********************************************************
  // 5. MANEJAR ERROR EN RXJS
  // *********************************************************
  static handleError(
    error: unknown,
    fallbackMessage?: string,
  ): Observable<never> {
    return throwError(
      () =>
        this.buildError(
          error,
          fallbackMessage,
        ),
    );
  }

  // *********************************************************
  // 6. MENSAJE DE ERROR PREDETERMINADO
  // *********************************************************
  static getDefaultErrorMessage(
    statusCode: number,
    fallbackMessage =
      'Ocurrió un error al procesar la solicitud.',
  ): string {
    switch (statusCode) {
      case 0:
        return 'No se pudo establecer conexión con el servidor.';

      case 400:
        return 'Los datos enviados no son válidos.';

      case 401:
        return 'La sesión ha expirado o no está autorizada.';

      case 403:
        return 'No tienes permisos para realizar esta acción.';

      case 404:
        return 'No se encontró el recurso solicitado.';

      case 409:
        return 'Ya existe un registro con los datos enviados.';

      case 413:
        return 'El archivo enviado supera el tamaño permitido.';

      case 422:
        return 'No se pudieron procesar los datos enviados.';

      case 429:
        return 'Se realizaron demasiadas solicitudes. Inténtalo nuevamente.';

      case 500:
        return 'Ocurrió un error interno en el servidor.';

      case 502:
        return 'El servidor no pudo comunicarse con otro servicio.';

      case 503:
        return 'El servicio no está disponible temporalmente.';

      case 504:
        return 'El servidor tardó demasiado en responder.';

      default:
        return fallbackMessage;
    }
  }

  // *********************************************************
  // 7. OBTENER EXTENSIÓN
  // *********************************************************
  static getFileExtension(file: File): string {
    const parts = file.name
      .trim()
      .toLowerCase()
      .split('.');

    return parts.length > 1
      ? parts.pop() ?? ''
      : '';
  }

  // *********************************************************
  // 8. VALIDAR ARCHIVO MULTIMEDIA
  // *********************************************************
  static isAllowedMediaFile(file: File): boolean {
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/heic',
      'image/heif',
      'video/mp4',
      'video/quicktime',
    ];

    return allowedTypes.includes(file.type);
  }

  // *********************************************************
  // MÉTODOS PRIVADOS
  // *********************************************************
  private static normalizeToken(
    token?: string | null,
  ): string | null {
    const normalizedToken = token
      ?.replace(/^Bearer\s+/i, '')
      .trim();

    return normalizedToken || null;
  }

  private static normalizeErrorBody(
    body: unknown,
  ): unknown {
    if (typeof body !== 'string') {
      return body;
    }

    try {
      return JSON.parse(body);
    } catch {
      return {
        message: body,
      };
    }
  }

  private static readString(
    value: unknown,
    key: string,
  ): string | null {
    if (
      typeof value !== 'object' ||
      value === null
    ) {
      return null;
    }

    const property = (
      value as Record<string, unknown>
    )[key];

    if (typeof property !== 'string') {
      return null;
    }

    const normalizedProperty = property.trim();

    return normalizedProperty || null;
  }
}
