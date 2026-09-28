import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Subject, Subscription, map } from 'rxjs';

// Service
import { AlertaSocketService } from './alerta-socket.service';

// Interface
import { AlertaTiempoReal, NuevaAlertaSocketPayload } from 'src/app/interfaces/alertas/alerta-socket.interface';

@Injectable({
  providedIn: 'root',
})
export class AlertasStoreService implements OnDestroy {
  private readonly alertasMap = new Map<
    number,
    AlertaTiempoReal
  >();

  private readonly alertasSubject = new BehaviorSubject<
    ReadonlyArray<AlertaTiempoReal>
  >([]);

  private readonly nuevaAlertaSubject = new Subject<AlertaTiempoReal>();

  private escucha: Subscription | null = null;

  readonly alertas$ = this.alertasSubject.asObservable();

  /**
   * Solo emite ante una alerta realmente nueva.
   * Úsalo para sonido, toast, modal o marcador rojo temporal.
   */
  readonly nuevaAlerta$ = this.nuevaAlertaSubject.asObservable();

  readonly pendientes$ = this.alertas$.pipe(
    map((alertas) =>
      alertas.filter(
        (alerta) => alerta.estado === 'PENDIENTE'
      )
    )
  );

  readonly cantidadPendientes$ =
    this.pendientes$.pipe(
      map((alertas) => alertas.length)
    );

  constructor(
    private readonly alertaSocketService: AlertaSocketService
  ) { }

  /**
   * Debe ejecutarse una sola vez desde el layout autenticado
   * de usuarios de central u operadores.
   */
  iniciar(): void {
    if (this.escucha && !this.escucha.closed) {
      return;
    }

    this.escucha = new Subscription();

    // Nueva alerta: guarda y notifica visualmente.
    this.escucha.add(
      this.alertaSocketService
        .escucharNuevaAlerta()
        .subscribe({
          next: (payload) =>
            this.procesarPayload(
              payload,
              true
            ),

          error: (error) =>
            console.error(
              '❌ Error escuchando alertas nuevas:',
              error
            ),
        })
    );

    // Actualización: cambia el estado sin repetir sonido o toast.
    this.escucha.add(
      this.alertaSocketService
        .escucharAlertaActualizada()
        .subscribe({
          next: (payload) =>
            this.procesarPayload(
              payload,
              false
            ),

          error: (error) =>
            console.error(
              '❌ Error escuchando alertas actualizadas:',
              error
            ),
        })
    );

    // Cancelación: actualiza el estado sin repetir alerta visible.
    this.escucha.add(
      this.alertaSocketService
        .escucharAlertaCancelada()
        .subscribe({
          next: (payload) =>
            this.procesarPayload(
              payload,
              false
            ),

          error: (error) =>
            console.error(
              '❌ Error escuchando alertas canceladas:',
              error
            ),
        })
    );
  }

  /**
   * Detiene listeners sin desconectar el Socket.IO global.
   */
  detener(): void {
    this.escucha?.unsubscribe();
    this.escucha = null;
  }

  private procesarPayload(
    payload: NuevaAlertaSocketPayload,
    notificarComoNueva: boolean
  ): void {
    if (
      payload?.success !== true ||
      !this.esAlertaValida(payload.data)
    ) {
      console.warn(
        '⚠️ Payload de alerta inválido:',
        payload
      );

      return;
    }

    const alerta = payload.data;
    const esNueva = !this.alertasMap.has(alerta.id);

    const cambio = this.guardarSiCorresponde(alerta);

    if (!cambio) {
      return;
    }

    this.publicarEstado();

    // Solo una alerta nueva y activa debe producir
    // sonido, toast, modal o marcador de emergencia.
    if (
      notificarComoNueva &&
      esNueva &&
      this.estaActiva(alerta)
    ) {
      this.nuevaAlertaSubject.next({
        ...alerta,
      });
    }
  }

  /**
   * Carga alertas desde HTTP al iniciar el módulo.
   * No vuelve a emitir nuevas notificaciones visuales.
   */
  cargarInicial(
    alertas: AlertaTiempoReal[]
  ): void {
    let cambio = false;

    for (const alerta of alertas) {
      if (!this.esAlertaValida(alerta)) {
        continue;
      }

      if (
        this.guardarSiCorresponde(alerta)
      ) {
        cambio = true;
      }
    }

    if (cambio) {
      this.publicarEstado();
    }
  }

  /**
   * Útil después de atender, cancelar o actualizar una alerta
   * mediante una petición HTTP.
   */
  actualizarAlerta(
    alerta: AlertaTiempoReal
  ): void {
    if (
      this.esAlertaValida(alerta) &&
      this.guardarSiCorresponde(alerta)
    ) {
      this.publicarEstado();
    }
  }

  private guardarSiCorresponde(
    alerta: AlertaTiempoReal
  ): boolean {
    const actual =
      this.alertasMap.get(alerta.id);

    if (actual) {
      const fechaActual =
        Date.parse(actual.updatedAt);

      const fechaRecibida =
        Date.parse(alerta.updatedAt);

      // Evita recibir dos veces el mismo evento
      // o reemplazar una versión más nueva.
      if (fechaRecibida <= fechaActual) {
        return false;
      }
    }

    this.alertasMap.set(alerta.id, {
      ...alerta,
    });

    return true;
  }

  private estaActiva(
    alerta: AlertaTiempoReal
  ): boolean {
    return (
      alerta.estado === 'PENDIENTE' ||
      alerta.estado === 'EN_ATENCION'
    );
  }

  private esAlertaValida(
    alerta: AlertaTiempoReal | null | undefined
  ): alerta is AlertaTiempoReal {
    return !!alerta &&
      Number.isInteger(alerta.id) &&
      alerta.id > 0 &&
      Number.isInteger(alerta.emisor_id) &&
      alerta.emisor_id > 0 &&
      typeof alerta.titulo === 'string' &&
      typeof alerta.descripcion === 'string' &&
      typeof alerta.tipo === 'string' &&
      typeof alerta.prioridad === 'string' &&
      typeof alerta.estado === 'string' &&
      typeof alerta.createdAt === 'string' &&
      typeof alerta.updatedAt === 'string' &&
      Number.isFinite(
        Date.parse(alerta.createdAt)
      ) &&
      Number.isFinite(
        Date.parse(alerta.updatedAt)
      );
  }

  private publicarEstado(): void {
    const alertas = Array.from(
      this.alertasMap.values()
    )
      .sort(
        (a, b) =>
          Date.parse(b.createdAt) -
          Date.parse(a.createdAt)
      )
      .map((alerta) => ({
        ...alerta,
      }));

    this.alertasSubject.next(alertas);
  }

  /**
   * Ejecutar en logout para no mostrar al siguiente usuario
   * las alertas almacenadas del usuario anterior.
   */
  cerrarSesion(): void {
    this.detener();
    this.alertasMap.clear();
    this.alertasSubject.next([]);
  }

  ngOnDestroy(): void {
    this.detener();
    this.alertasSubject.complete();
    this.nuevaAlertaSubject.complete();
  }
}


// import { Injectable, OnDestroy } from '@angular/core';
// import { BehaviorSubject, Subject, Subscription, map } from 'rxjs';

// // Service
// import { AlertaSocketService } from './alerta-socket.service';

// // Interface
// import { AlertaTiempoReal, NuevaAlertaSocketPayload } from 'src/app/interfaces/alertas/alerta-socket.interface';

// @Injectable({
//   providedIn: 'root',
// })
// export class AlertasStoreService implements OnDestroy {
//   private readonly alertasMap = new Map<number, AlertaTiempoReal>();
//   private readonly alertasSubject = new BehaviorSubject<ReadonlyArray<AlertaTiempoReal>>([]);
//   private readonly nuevaAlertaSubject = new Subject<AlertaTiempoReal>();

//   private escucha: Subscription | null = null;

//   readonly alertas$ = this.alertasSubject.asObservable();

//   readonly nuevaAlerta$ = this.nuevaAlertaSubject.asObservable();

//   readonly pendientes$ = this.alertas$.pipe(
//     map((alertas) =>
//       alertas.filter(
//         (alerta) => alerta.estado === 'PENDIENTE'
//       )
//     )
//   );

//   readonly cantidadPendientes$ = this.pendientes$.pipe(
//     map((alertas) => alertas.length)
//   );

//   constructor(
//     private readonly alertaSocketService: AlertaSocketService
//   ) { }

//   /**
//    * Iniciar desde el layout autenticado de la central.
//    * Las llamadas repetidas no duplican listeners.
//    */
//   iniciar(): void {
//     if (this.escucha && !this.escucha.closed) {
//       return;
//     }

//     this.escucha = this.alertaSocketService
//       .escucharNuevaAlerta()
//       .subscribe({
//         next: (payload) => this.procesarNuevaAlerta(payload),

//         error: (error) => {
//           console.error(
//             '❌ Error escuchando alertas:',
//             error
//           );
//         },
//       });
//   }

//   /**
//    * Detiene la escucha de alertas.
//    * No desconecta el socket compartido.
//    */
//   detener(): void {
//     this.escucha?.unsubscribe();
//     this.escucha = null;
//   }

//   private procesarNuevaAlerta(
//     payload: NuevaAlertaSocketPayload
//   ): void {
//     if (
//       payload?.success !== true ||
//       !this.esAlertaValida(payload.data)
//     ) {
//       console.warn(
//         '⚠️ Mensaje de alerta inválido:',
//         payload
//       );

//       return;
//     }

//     const alerta = payload.data;
//     const esNueva = !this.alertasMap.has(alerta.id);

//     const cambio = this.guardarSiCorresponde(alerta);

//     if (!cambio) {
//       return;
//     }

//     this.publicarEstado();

//     // Una entrega duplicada o actualización del mismo ID
//     // no vuelve a activar la notificación.
//     if (esNueva && this.estaActiva(alerta)) {
//       this.nuevaAlertaSubject.next({ ...alerta });
//     }
//   }

//   /**
//    * Para una futura consulta HTTP de alertas de la central.
//    * No reproduce notificaciones históricas.
//    * Combina registros sin borrar eventos recibidos en vivo.
//    */
//   cargarInicial(alertas: AlertaTiempoReal[]): void {
//     let cambio = false;

//     for (const alerta of alertas) {
//       if (!this.esAlertaValida(alerta)) {
//         continue;
//       }

//       if (this.guardarSiCorresponde(alerta)) {
//         cambio = true;
//       }
//     }

//     if (cambio) {
//       this.publicarEstado();
//     }
//   }

//   /**
//    * Usar cuando una operación HTTP devuelva la alerta
//    * completa actualizada. No activa sonido.
//    */
//   actualizarAlerta(alerta: AlertaTiempoReal): void {
//     if (
//       this.esAlertaValida(alerta) &&
//       this.guardarSiCorresponde(alerta)
//     ) {
//       this.publicarEstado();
//     }
//   }

//   private guardarSiCorresponde(
//     alerta: AlertaTiempoReal
//   ): boolean {
//     const actual = this.alertasMap.get(alerta.id);

//     if (actual) {
//       const fechaActual = Date.parse(actual.updatedAt);
//       const fechaRecibida = Date.parse(alerta.updatedAt);

//       // Descarta duplicados y versiones anteriores.
//       if (fechaRecibida <= fechaActual) {
//         return false;
//       }
//     }

//     this.alertasMap.set(alerta.id, { ...alerta });

//     return true;
//   }

//   private estaActiva(alerta: AlertaTiempoReal): boolean {
//     return (
//       alerta.estado === 'PENDIENTE' ||
//       alerta.estado === 'EN_ATENCION'
//     );
//   }

//   private esAlertaValida(
//     alerta: AlertaTiempoReal | null | undefined
//   ): alerta is AlertaTiempoReal {
//     return !!alerta &&
//       Number.isInteger(alerta.id) &&
//       alerta.id > 0 &&
//       Number.isInteger(alerta.emisor_id) &&
//       alerta.emisor_id > 0 &&
//       typeof alerta.titulo === 'string' &&
//       typeof alerta.descripcion === 'string' &&
//       typeof alerta.tipo === 'string' &&
//       typeof alerta.prioridad === 'string' &&
//       typeof alerta.estado === 'string' &&
//       typeof alerta.createdAt === 'string' &&
//       typeof alerta.updatedAt === 'string' &&
//       Number.isFinite(Date.parse(alerta.createdAt)) &&
//       Number.isFinite(Date.parse(alerta.updatedAt));
//   }

//   private publicarEstado(): void {
//     const alertas = Array.from(this.alertasMap.values())
//       .sort(
//         (a, b) =>
//           Date.parse(b.createdAt) - Date.parse(a.createdAt)
//       )
//       .map((alerta) => ({ ...alerta }));

//     this.alertasSubject.next(alertas);
//   }

//   /**
//    * Ejecutar al cerrar sesión para evitar conservar
//    * información del usuario anterior.
//    */
//   cerrarSesion(): void {
//     this.detener();
//     this.alertasMap.clear();
//     this.alertasSubject.next([]);
//   }

//   ngOnDestroy(): void {
//     this.detener();
//     this.alertasSubject.complete();
//     this.nuevaAlertaSubject.complete();
//   }
// }
