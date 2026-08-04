import { Injectable } from '@angular/core';

// Interfaces
import {
  TrackingPayload,
  TrackingTipo
} from 'src/app/interfaces/tracking.interface';

@Injectable({
  providedIn: 'root'
})
export class MapaTrackingService {

  /**
   * Último tracking conocido por sereno.
   *
   * key   = usuarioId
   * value = último payload recibido
   */
  private serenos: Record<number, TrackingPayload> = {};

  /**
   * Marcadores visuales por sereno.
   */
  private serenoMarkers: Record<
    number,
    google.maps.Marker
  > = {};

  /**
   * InfoWindows por sereno.
   */
  private infoWindows: Record<
    number,
    google.maps.InfoWindow
  > = {};

  /**
   * Intervalos utilizados para animar
   * el movimiento de cada marcador.
   */
  private animationIntervals: Record<
    number,
    ReturnType<typeof setInterval>
  > = {};

  /**
   * Historial temporal de posiciones.
   */
  private rutas: Record<
    number,
    google.maps.LatLng[]
  > = {};

  /**
   * Polylines visuales por sereno.
   */
  private polylines: Record<
    number,
    google.maps.Polyline
  > = {};

  private readonly MAX_PUNTOS_RUTA = 500;

  /**
   * Se considera que un sereno está online
   * cuando recibió una actualización durante
   * el último minuto.
   */
  private readonly ONLINE_TIMEOUT_MS = 60_000;

  /**
   * Distancia mínima aproximada para agregar
   * un nuevo punto a la ruta.
   */
  private readonly DISTANCIA_MINIMA_METROS = 2;

  // =====================================================
  // ACTUALIZAR TRACKING
  // =====================================================
  actualizarTracking(
    map: google.maps.Map,
    data: TrackingPayload
  ): void {

    if (!map) {
      return;
    }

    if (!this.esPayloadValido(data)) {
      console.warn(
        '⚠️ Payload inválido recibido en MapaTrackingService:',
        data
      );

      return;
    }

    const usuarioId = data.usuarioId;

    const trackingAnterior =
      this.serenos[usuarioId];

    /*
     * Evita que una ubicación antigua,
     * por ejemplo sincronizada desde SQLite,
     * reemplace una ubicación más reciente.
     */
    if (
      trackingAnterior &&
      !this.esTrackingMasReciente(
        trackingAnterior,
        data
      )
    ) {
      console.warn(
        '⚠️ Tracking antiguo descartado:',
        {
          usuarioId,
          anterior:
            trackingAnterior.realtime.timestamp,
          recibido:
            data.realtime.timestamp
        }
      );

      return;
    }

    const nuevaPosicion =
      new google.maps.LatLng(
        data.gps.lat,
        data.gps.lng
      );

    // Guardar último estado conocido
    this.serenos[usuarioId] = data;

    // Inicializar ruta
    if (!this.rutas[usuarioId]) {
      this.rutas[usuarioId] = [];
    }

    // Agregar posición sin duplicar puntos
    this.agregarPuntoRuta(
      usuarioId,
      nuevaPosicion
    );

    // Crear o actualizar polyline
    this.actualizarPolyline(
      map,
      usuarioId
    );

    const marcadorExistente =
      this.serenoMarkers[usuarioId];

    if (marcadorExistente) {
      this.actualizarMarcadorExistente(
        usuarioId,
        marcadorExistente,
        nuevaPosicion,
        data
      );

      return;
    }

    this.crearMarcador(
      map,
      nuevaPosicion,
      data
    );
  }

  // =====================================================
  // CREAR MARCADOR
  // =====================================================
  private crearMarcador(
    map: google.maps.Map,
    position: google.maps.LatLng,
    data: TrackingPayload
  ): void {

    const usuarioId = data.usuarioId;

    const marker = new google.maps.Marker({
      position,
      map,
      title: data.sereno.nombreCompleto,
      icon: this.obtenerIconoMarcador(data),
      optimized: true
    });

    const infoWindow =
      new google.maps.InfoWindow({
        content:
          this.buildInfoWindowContent(data)
      });

    marker.addListener('click', () => {

      this.cerrarInfoWindows();

      const markerPosition =
        marker.getPosition();

      if (markerPosition) {
        map.panTo(markerPosition);
      }

      infoWindow.setContent(
        this.buildInfoWindowContent(
          this.serenos[usuarioId] ?? data
        )
      );

      infoWindow.open({ map, anchor: marker });
    });

    this.serenoMarkers[usuarioId] = marker;

    this.infoWindows[usuarioId] = infoWindow;
  }

  // =====================================================
  // ACTUALIZAR MARCADOR EXISTENTE
  // =====================================================
  private actualizarMarcadorExistente(
    usuarioId: number,
    marker: google.maps.Marker,
    nuevaPosicion: google.maps.LatLng,
    data: TrackingPayload
  ): void {

    const posicionInicial = marker.getPosition();

    marker.setTitle(data.sereno.nombreCompleto);

    marker.setIcon(this.obtenerIconoMarcador(data));

    const infoWindow = this.infoWindows[usuarioId];

    if (infoWindow) {
      infoWindow.setContent(
        this.buildInfoWindowContent(data)
      );
    }

    if (!posicionInicial) {
      marker.setPosition(nuevaPosicion);
      return;
    }

    this.detenerAnimacion(usuarioId);

    const latInicial =
      posicionInicial.lat();

    const lngInicial =
      posicionInicial.lng();

    const latFinal =
      nuevaPosicion.lat();

    const lngFinal =
      nuevaPosicion.lng();

    let progreso = 0;

    this.animationIntervals[usuarioId] =
      setInterval(() => {

        progreso += 0.1;

        const latInterpolada =
          latInicial +
          (latFinal - latInicial) *
          progreso;

        const lngInterpolada =
          lngInicial +
          (lngFinal - lngInicial) *
          progreso;

        marker.setPosition({
          lat: latInterpolada,
          lng: lngInterpolada
        });

        if (progreso >= 1) {
          marker.setPosition(nuevaPosicion);

          this.detenerAnimacion(
            usuarioId
          );
        }

      }, 50);
  }

  // =====================================================
  // RUTAS Y POLYLINES
  // =====================================================
  private agregarPuntoRuta(
    usuarioId: number,
    nuevaPosicion: google.maps.LatLng
  ): void {

    const ruta =
      this.rutas[usuarioId];

    const ultimoPunto =
      ruta.length > 0
        ? ruta[ruta.length - 1]
        : null;

    if (ultimoPunto) {
      const distancia =
        google.maps.geometry?.spherical
          ?.computeDistanceBetween(
            ultimoPunto,
            nuevaPosicion
          );

      if (
        typeof distancia === 'number' &&
        distancia <
        this.DISTANCIA_MINIMA_METROS
      ) {
        return;
      }
    }

    ruta.push(nuevaPosicion);

    if (
      ruta.length >
      this.MAX_PUNTOS_RUTA
    ) {
      ruta.shift();
    }
  }

  private actualizarPolyline(
    map: google.maps.Map,
    usuarioId: number
  ): void {

    if (!this.polylines[usuarioId]) {

      this.polylines[usuarioId] =
        new google.maps.Polyline({
          path:
            this.rutas[usuarioId],
          geodesic: true,
          strokeColor: '#2563EB',
          strokeOpacity: 1,
          strokeWeight: 4,
          map
        });

      return;
    }

    this.polylines[usuarioId]
      .setPath(
        this.rutas[usuarioId]
      );

    /*
     * En caso de que la polyline
     * haya sido retirada del mapa.
     */
    if (
      !this.polylines[usuarioId]
        .getMap()
    ) {
      this.polylines[usuarioId]
        .setMap(map);
    }
  }

  // =====================================================
  // ICONO DEL MARCADOR
  // =====================================================

  private obtenerIconoMarcador(
    data: TrackingPayload
  ): google.maps.Icon {

    let iconUrl =
      'https://maps.google.com/mapfiles/ms/icons/green-dot.png';

    if (
      data.tipo === 'EMERGENCIA'
    ) {
      iconUrl =
        'https://maps.google.com/mapfiles/ms/icons/red-dot.png';
    } else if (
      data.roles.includes('CONDUCTOR')
    ) {
      iconUrl =
        'https://maps.google.com/mapfiles/ms/icons/blue-dot.png';
    } else if (
      !this.estaOnline(data)
    ) {
      iconUrl =
        'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png';
    }

    return {
      url: iconUrl,
      scaledSize:
        new google.maps.Size(
          42,
          42
        ),
      anchor:
        new google.maps.Point(
          21,
          42
        )
    };
  }

  // =====================================================
  // INFOWINDOW
  // =====================================================
  private buildInfoWindowContent(
    data: TrackingPayload
  ): string {

    const nombreCompleto =
      this.escapeHtml(
        data.sereno.nombreCompleto
      );

    const username =
      this.escapeHtml(
        data.username
      );

    const documento =
      this.escapeHtml(
        data.sereno.documento ?? '-'
      );

    const telefono =
      this.escapeHtml(
        data.sereno.telefono ?? '-'
      );

    const roles =
      data.roles.length > 0
        ? data.roles
          .map(rol =>
            this.escapeHtml(rol)
          )
          .join(', ')
        : '-';

    const velocidadKmh =
      this.obtenerVelocidadKmh(
        data.gps.velocidad
      );

    const precision =
      data.gps.precision !== null
        ? `${data.gps.precision.toFixed(1)} m`
        : '-';

    const online = this.estaOnline(data);

    const ultimaActualizacion =
      this.formatearFechaHora(
        data.realtime.timestamp
      );

    const tipo =
      this.formatearTipo(
        data.tipo
      );

    const estadoPatrullaje =
      this.escapeHtml(
        data.patrullaje.estado
      );

    const estadoColor =
      online
        ? '#16A34A'
        : '#DC2626';

    const estadoTexto =
      online
        ? '● ONLINE'
        : '● SIN CONEXIÓN';

    return `
      <div style="
        width:280px;
        max-width:280px;
        font-family:Arial,sans-serif;
        color:#111827;
      ">

        <div style="
          background:#1E293B;
          color:#FFFFFF;
          padding:12px;
          border-radius:8px 8px 0 0;
        ">
          <h3 style="
            margin:0;
            font-size:16px;
            font-weight:700;
          ">
            🚓 Patrullaje #${data.patrullaje.id}
          </h3>

          <div style="
            margin-top:4px;
            font-size:12px;
            opacity:0.85;
          ">
            ${estadoPatrullaje}
          </div>
        </div>

        <div style="
          padding:12px;
          background:#FFFFFF;
          border:1px solid #E5E7EB;
          border-top:none;
          border-radius:0 0 8px 8px;
        ">

          <div style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom:12px;
          ">
            ${this.buildFotoPerfil(data)}

            <div style="
              min-width:0;
            ">
              <div style="
                font-size:14px;
                font-weight:700;
                line-height:1.3;
              ">
                ${nombreCompleto}
              </div>

              <div style="
                margin-top:2px;
                font-size:12px;
                color:#6B7280;
              ">
                Usuario: ${username}
              </div>
            </div>
          </div>

          <div style="
            display:grid;
            gap:8px;
            font-size:13px;
          ">

            ${this.buildInfoRow(
      '🪪',
      'Documento',
      documento
    )}

            ${this.buildInfoRow(
      '📞',
      'Teléfono',
      telefono
    )}

            ${this.buildInfoRow(
      '🛡️',
      'Roles',
      roles
    )}

            ${this.buildInfoRow(
      '🚀',
      'Velocidad',
      velocidadKmh
    )}

            ${this.buildInfoRow(
      '🎯',
      'Precisión',
      precision
    )}

            ${this.buildInfoRow(
      '📍',
      'Coordenadas',
      `${data.gps.lat.toFixed(6)}, ${data.gps.lng.toFixed(6)}`
    )}

            ${this.buildInfoRow(
      '🔔',
      'Tipo',
      tipo
    )}

            <div style="
              padding:8px;
              background:#F8FAFC;
              border-radius:6px;
            ">
              <div style="
                font-size:11px;
                color:#64748B;
              ">
                Estado de conexión
              </div>

              <div style="
                margin-top:2px;
                color:${estadoColor};
                font-weight:700;
              ">
                ${estadoTexto}
              </div>
            </div>

            ${this.buildInfoRow(
      '🕒',
      'Última actualización',
      ultimaActualizacion
    )}

          </div>
        </div>
      </div>
    `;
  }

  private buildFotoPerfil(
    data: TrackingPayload
  ): string {

    const fotoPerfil =
      data.sereno.fotoPerfil;

    if (fotoPerfil) {
      return `
        <img
          src="${this.escapeHtml(fotoPerfil)}"
          alt="Foto del sereno"
          style="
            width:48px;
            height:48px;
            border-radius:50%;
            object-fit:cover;
            border:2px solid #E5E7EB;
            flex-shrink:0;
          "
        />
      `;
    }

    const iniciales =
      this.obtenerIniciales(
        data.sereno.nombres,
        data.sereno.apellidos
      );

    return `
      <div style="
        width:48px;
        height:48px;
        border-radius:50%;
        background:#DBEAFE;
        color:#1D4ED8;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:700;
        font-size:15px;
        flex-shrink:0;
      ">
        ${this.escapeHtml(iniciales)}
      </div>
    `;
  }

  private buildInfoRow(
    icono: string,
    etiqueta: string,
    valor: string
  ): string {

    return `
      <div style="
        display:flex;
        gap:8px;
        align-items:flex-start;
      ">
        <span style="
          flex-shrink:0;
        ">
          ${icono}
        </span>

        <div style="
          min-width:0;
        ">
          <div style="
            font-size:11px;
            color:#64748B;
          ">
            ${etiqueta}
          </div>

          <div style="
            margin-top:1px;
            font-weight:600;
            word-break:break-word;
          ">
            ${valor}
          </div>
        </div>
      </div>
    `;
  }

  // =====================================================
  // VALIDACIONES
  // =====================================================

  private esPayloadValido(
    data: TrackingPayload | null | undefined
  ): data is TrackingPayload {

    if (!data) {
      return false;
    }

    if (
      !Number.isInteger(data.usuarioId) ||
      data.usuarioId <= 0
    ) {
      return false;
    }

    if (
      !data.sereno ||
      !data.patrullaje ||
      !data.gps ||
      !data.realtime
    ) {
      return false;
    }

    if (
      !Number.isFinite(data.gps.lat) ||
      !Number.isFinite(data.gps.lng)
    ) {
      return false;
    }

    if (
      data.gps.lat < -90 ||
      data.gps.lat > 90
    ) {
      return false;
    }

    if (
      data.gps.lng < -180 ||
      data.gps.lng > 180
    ) {
      return false;
    }

    const timestamp =
      new Date(
        data.realtime.timestamp
      ).getTime();

    return Number.isFinite(timestamp);
  }

  private esTrackingMasReciente(
    actual: TrackingPayload,
    nuevo: TrackingPayload
  ): boolean {

    const fechaActual =
      new Date(
        actual.realtime.timestamp
      ).getTime();

    const fechaNueva =
      new Date(
        nuevo.realtime.timestamp
      ).getTime();

    if (
      !Number.isFinite(fechaActual) ||
      !Number.isFinite(fechaNueva)
    ) {
      return true;
    }

    return fechaNueva >= fechaActual;
  }

  // =====================================================
  // ESTADO ONLINE
  // =====================================================

  private estaOnline(
    data: TrackingPayload
  ): boolean {

    if (!data.realtime.online) {
      return false;
    }

    console.log("data.realtime.online", data.realtime.online);
    console.log("data.realtime.timestamp", data.realtime.timestamp);

    const timestamp =
      new Date(
        data.realtime.timestamp
      ).getTime();

    if (!Number.isFinite(timestamp)) {
      return false;
    }

    const diferencia = Date.now() - timestamp;

    console.log("diferencia", diferencia);

    return (
      diferencia >= 0 &&
      diferencia <=
      this.ONLINE_TIMEOUT_MS
    );
  }

  // =====================================================
  // FORMATEADORES
  // =====================================================

  private obtenerVelocidadKmh(
    velocidad: number | null
  ): string {

    if (
      velocidad === null ||
      !Number.isFinite(velocidad)
    ) {
      return '-';
    }

    /*
     * Geolocator normalmente devuelve
     * velocidad en metros por segundo.
     */
    const velocidadKmh =
      Math.max(0, velocidad) * 3.6;

    return `${velocidadKmh.toFixed(1)} km/h`;
  }

  private formatearFechaHora(
    timestamp: string
  ): string {

    const fecha =
      new Date(timestamp);

    if (
      Number.isNaN(
        fecha.getTime()
      )
    ) {
      return '-';
    }

    return fecha.toLocaleString(
      'es-PE',
      {
        dateStyle: 'short',
        timeStyle: 'medium',
        timeZone: 'America/Lima'
      }
    );
  }

  private formatearTipo(
    tipo: TrackingTipo
  ): string {

    const etiquetas:
      Record<TrackingTipo, string> = {
      TRACKING:
        'Seguimiento automático',
      EMERGENCIA:
        'Emergencia',
      MANUAL:
        'Ubicación manual'
    };

    return etiquetas[tipo];
  }

  private obtenerIniciales(
    nombres: string,
    apellidos: string
  ): string {

    const primeraInicialNombre =
      nombres
        ?.trim()
        .charAt(0)
        .toUpperCase() ?? '';

    const primeraInicialApellido =
      apellidos
        ?.trim()
        .charAt(0)
        .toUpperCase() ?? '';

    return (
      primeraInicialNombre +
      primeraInicialApellido
    ) || 'S';
  }

  private escapeHtml(
    value: string
  ): string {

    return value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');
  }

  // =====================================================
  // CONTROL DE INFOWINDOWS Y ANIMACIONES
  // =====================================================

  private cerrarInfoWindows(): void {
    Object.values(
      this.infoWindows
    ).forEach(infoWindow => {
      infoWindow.close();
    });
  }

  private detenerAnimacion(
    usuarioId: number
  ): void {

    const intervalo =
      this.animationIntervals[
      usuarioId
      ];

    if (!intervalo) {
      return;
    }

    clearInterval(intervalo);

    delete this.animationIntervals[
      usuarioId
    ];
  }

  // =====================================================
  // RECONSTRUIR MARCADORES
  // =====================================================

  reconstruirMarcadores(
    map: google.maps.Map
  ): void {

    Object.values(
      this.serenoMarkers
    ).forEach(marker => {
      marker.setMap(map);
    });

    Object.values(
      this.polylines
    ).forEach(polyline => {
      polyline.setMap(map);
    });
  }

  // =====================================================
  // CONSULTAS
  // =====================================================

  obtenerSerenosActivos():
    Readonly<Record<number, TrackingPayload>> {

    return {
      ...this.serenos
    };
  }

  obtenerSereno(
    usuarioId: number
  ): TrackingPayload | null {

    return (
      this.serenos[
      usuarioId
      ] ?? null
    );
  }

  obtenerCantidadSerenos(): number {
    return Object.keys(
      this.serenos
    ).length;
  }

  // =====================================================
  // REMOVER SERENO
  // =====================================================

  removerSereno(
    usuarioId: number
  ): void {

    this.detenerAnimacion(
      usuarioId
    );

    const marker =
      this.serenoMarkers[
      usuarioId
      ];

    if (marker) {
      marker.setMap(null);

      delete this.serenoMarkers[
        usuarioId
      ];
    }

    const polyline =
      this.polylines[
      usuarioId
      ];

    if (polyline) {
      polyline.setMap(null);

      delete this.polylines[
        usuarioId
      ];
    }

    const infoWindow =
      this.infoWindows[
      usuarioId
      ];

    if (infoWindow) {
      infoWindow.close();

      delete this.infoWindows[
        usuarioId
      ];
    }

    delete this.rutas[
      usuarioId
    ];

    delete this.serenos[
      usuarioId
    ];
  }

  // =====================================================
  // MARCAR SERENO OFFLINE
  // =====================================================

  marcarSerenoOffline(
    usuarioId: number
  ): void {

    const tracking =
      this.serenos[
      usuarioId
      ];

    if (!tracking) {
      return;
    }

    const trackingActualizado:
      TrackingPayload = {
      ...tracking,

      realtime: {
        ...tracking.realtime,
        online: false
      }
    };

    this.serenos[
      usuarioId
    ] = trackingActualizado;

    const marker =
      this.serenoMarkers[
      usuarioId
      ];

    if (marker) {
      marker.setIcon(
        this.obtenerIconoMarcador(
          trackingActualizado
        )
      );
    }

    const infoWindow =
      this.infoWindows[
      usuarioId
      ];

    if (infoWindow) {
      infoWindow.setContent(
        this.buildInfoWindowContent(
          trackingActualizado
        )
      );
    }
  }

  // =====================================================
  // LIMPIAR TODO
  // =====================================================
  limpiarTodo(): void {

    Object.values(
      this.serenoMarkers
    ).forEach(marker => {
      marker.setMap(null);
    });

    Object.values(
      this.infoWindows
    ).forEach(infoWindow => {
      infoWindow.close();
    });

    Object.values(
      this.animationIntervals
    ).forEach(interval => {
      clearInterval(interval);
    });

    Object.values(
      this.polylines
    ).forEach(polyline => {
      polyline.setMap(null);
    });

    this.serenoMarkers = {};
    this.serenos = {};
    this.infoWindows = {};
    this.animationIntervals = {};
    this.polylines = {};
    this.rutas = {};
  }
}
