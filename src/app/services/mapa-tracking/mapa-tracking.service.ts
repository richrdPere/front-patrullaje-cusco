import { Injectable } from '@angular/core';

// Interface
import { TrackingPayload } from 'src/app/interfaces/tracking.interface';

@Injectable({
  providedIn: 'root'
})
export class MapaTrackingService {

  // ESTADO GLOBAL TRACKING
  private serenos: { [userId: number]: TrackingPayload } = {};

  // MARKERS VISUALES
  private serenoMarkers: { [userId: number]: google.maps.Marker } = {};

  // INFOWINDOWS
  private infoWindows: { [userId: number]: google.maps.InfoWindow } = {};

  // INTERVALOS ANIMACION
  private animationIntervals: { [userId: number]: any } = {};

  // RUTAS HISTORICAS
  private rutas: { [userId: number]: google.maps.LatLng[] } = {};

  // POLYLINES
  private polylines: { [userId: number]: google.maps.Polyline } = {};

  // ACTUALIZAR TRACKING
  actualizarTracking(
    map: google.maps.Map,
    data: TrackingPayload
  ) {

    if (!map) return;

    const { userId, gps } = data;

    // GUARDAR ESTADO GLOBAL
    this.serenos[userId] = data;

    const lat = gps.lat;
    const lng = gps.lng;

    const newPosition = new google.maps.LatLng(
      lat,
      lng
    );

    // CREAR RUTA SI NO EXISTE
    if (!this.rutas[userId]) {
      this.rutas[userId] = [];
    }

    // AGREGAR NUEVO PUNTO
    this.rutas[userId].push(newPosition);

    // LIMITAR CANTIDAD DE PUNTOS
    const MAX_PUNTOS = 500;
    if (this.rutas[userId].length > MAX_PUNTOS) {
      this.rutas[userId].shift();
    }

    // SI YA EXISTE MARKER
    if (this.serenoMarkers[userId]) {
      const marker = this.serenoMarkers[userId];
      const start = marker.getPosition();

      if (!start) return;

      // ACTUALIZAR INFOWINDOW
      if (this.infoWindows[userId]) {

        this.infoWindows[userId]
          .setContent(
            this.buildInfoWindowContent(data)
          );
      }

      // DETENER ANIMACION PREVIA
      if (this.animationIntervals[userId]) {
        clearInterval(
          this.animationIntervals[userId]
        );
      }

      let progress = 0;
      this.animationIntervals[userId] = setInterval(() => {
        progress += 0.1;
        const latInter = start.lat() + (lat - start.lat()) * progress;
        const lngInter = start.lng() + (lng - start.lng()) * progress;

        marker.setPosition(
          new google.maps.LatLng(
            latInter,
            lngInter
          )
        );

        if (progress >= 1) {
          marker.setPosition(newPosition);
          clearInterval(
            this.animationIntervals[userId]
          );
        }
      }, 50);

      // ACTUALIZAR RUTA
      if (this.polylines[userId]) {
        this.polylines[userId].setPath(this.rutas[userId]);
      }

      return;
    }

    // CREAR POLYLINE SI NO EXISTE
    if (!this.polylines[userId]) {
      this.polylines[userId] =
        new google.maps.Polyline({
          path: this.rutas[userId],
          geodesic: true,
          strokeColor: '#2563EB',
          strokeOpacity: 1.0,
          strokeWeight: 4
        });

      this.polylines[userId]
        .setMap(map);

    }

    // ICONO SEGUN ROL
    const esConductor =
      data.roles.includes('CONDUCTOR');

    const iconUrl = esConductor
      ? 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
      : 'https://maps.google.com/mapfiles/ms/icons/green-dot.png';

    // CREAR NUEVO MARKER
    const marker = new google.maps.Marker({
      position: newPosition,
      map,
      title: `
        ${data.sereno.nombres}
        ${data.sereno.apellidos}
      `,
      icon: {
        url: iconUrl
      }
    });

    // INFOWINDOW
    const infoWindow = new google.maps.InfoWindow({
      content:
        this.buildInfoWindowContent(data)
    });

    // EVENTO CLICK
    marker.addListener('click', () => {

      // cerrar otros
      Object.values(this.infoWindows)
        .forEach(info => info.close());

      map.panTo(
        marker.getPosition()!
      );

      infoWindow.open(map, marker);

    });

    // GUARDAR
    this.serenoMarkers[userId] = marker;

    this.infoWindows[userId] = infoWindow;
  }

  // TEMPLATE INFOWINDOW
  private buildInfoWindowContent(
    data: TrackingPayload
  ): string {

    return `

      <div style="
        width:260px;
        font-family:Arial,sans-serif;
      ">

        <!-- HEADER -->
        <div style="
          background:#1E293B;
          color:white;
          padding:10px;
          border-radius:8px 8px 0 0;
        ">

          <h3 style="
            margin:0;
            font-size:16px;
          ">
            🚓 Patrulla #${data.patrullaje.id}
          </h3>

        </div>

        <!-- BODY -->
        <div style="
          padding:12px;
          background:white;
          border:1px solid #E5E7EB;
          border-top:none;
          border-radius:0 0 8px 8px;
        ">

          <p>
            <strong>👮 Sereno:</strong><br>
            ${data.sereno.nombres}
            ${data.sereno.apellidos}
          </p>

          <p>
            <strong>🪪 Documento:</strong><br>
            ${data.sereno.documento || '-'}
          </p>

          <p>
            <strong>📞 Teléfono:</strong><br>
            ${data.sereno.telefono || '-'}
          </p>

          <p>
            <strong>🚀 Velocidad:</strong><br>
            ${data.gps.velocidad || 0} km/h
          </p>

          <p>
            <strong>🎯 Precisión:</strong><br>
            ${data.gps.precision || 0} m
          </p>

          <p>
            <strong>📡 Estado:</strong><br>

            <span style="
              color:${data.realtime.online ? '#16A34A' : '#DC2626'};
              font-weight:bold;
            ">
              ${data.realtime.online
        ? '● ONLINE'
        : '● OFFLINE'}
            </span>

          </p>

          <p>
            <strong>🕒 Última actualización:</strong><br>

            ${new Date(
          data.realtime.timestamp
        ).toLocaleTimeString()}

          </p>

          <p>
            <strong>🎯 Tipo:</strong><br>
            ${data.tipo}
          </p>

        </div>

      </div>
    `;
  }

  // RECONSTRUIR MARCADORES
  reconstruirMarcadores(
    map: google.maps.Map
  ) {
    Object.values(this.serenoMarkers)
      .forEach(marker => {
        marker.setMap(map);
      });
  }

  // OBTENER SERENOS ACTIVOS
  obtenerSerenosActivos() {
    return this.serenos;
  }

  // OBTENER SERENO
  obtenerSereno(
    userId: number
  ) {
    return this.serenos[userId];
  }

  // CANTIDAD SERENOS
  obtenerCantidadSerenos(): number {

    return Object.keys(
      this.serenos
    ).length;
  }

  // REMOVER SERENO
  removerSereno(userId: number) {

    // intervalo
    if (this.animationIntervals[userId]) {
      clearInterval(
        this.animationIntervals[userId]
      );
      delete this.animationIntervals[userId];
    }

    // marker
    if (this.serenoMarkers[userId]) {
      this.serenoMarkers[userId]
        .setMap(null);
      delete this.serenoMarkers[userId];
    }

    // REMOVER POLYLINE
    if (this.polylines[userId]) {
      this.polylines[userId]
        .setMap(null);
      delete this.polylines[userId];

    }

    // infowindow
    if (this.infoWindows[userId]) {
      this.infoWindows[userId]
        .close();
      delete this.infoWindows[userId];
    }

    // estado
    delete this.serenos[userId];
  }

  // =====================================================
  // LIMPIAR TODO
  // SOLO AL CERRAR SESION
  // =====================================================
  limpiarTodo() {
    Object.values(this.serenoMarkers)
      .forEach(marker => {
        marker.setMap(null);
      });

    Object.values(this.infoWindows)
      .forEach(info => {
        info.close();
      });

    Object.values(this.animationIntervals)
      .forEach(interval => {
        clearInterval(interval);
      });

    Object.values(this.polylines)
      .forEach(polyline => {
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
