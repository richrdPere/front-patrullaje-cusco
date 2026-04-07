import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';

// Interface
interface CalendarEvent {
  id: number;
  event_title: string;
  event_date: Date;
  event_theme: string;
  descripcion?: string;
}

export interface CalendarioActividad {
  id?: number;
  titulo: string;
  descripcion: string;
  fecha_actividad: Date | string;
  tipo_actividad: TipoActividad;
  estado?: EstadoActividad;

  user_ins?: string;
  user_mod?: string;
  fecha_ins?: Date;
  fecha_mod?: Date;
}

export type TipoActividad =
  | 'AUDIENCIA'
  | 'PLAZO'
  | 'NOTIFICACION'
  | 'REUNION'
  | 'OTRO';

export type EstadoActividad =
  | 'PROGRAMADO'
  | 'REALIZADO'
  | 'CANCELADO';


@Component({
  selector: 'app-calendario',
  imports: [DatePipe],
  templateUrl: './calendario.component.html',
  styles: ``
})
export class CalendarioComponent {

  // Variables
  mostrarModal = false;
  modoEdicion = false;
  actividadSeleccionado: any | null = null;

  actividades: CalendarioActividad[] = [];
  events: CalendarEvent[] = [];

  today = new Date();
  month = this.today.getMonth();
  year = this.today.getFullYear();

  emptyDays: number[] = [];
  numOfDays: number[] = [];


  days = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'];

  get currentMonthName(): string {
    return new Date(this.year, this.month).toLocaleString('default', { month: 'long' });
  }


  // =====================================================
  // INIT
  // =====================================================
  ngOnInit(): void {
    this.getNoOfDays();
    this.cargarActividades();
  }


  // =====================================================
  // API
  // =====================================================
  cargarActividades() {
    // this.calendarioService
    //   .listarActividades({ estado: 'PROGRAMADO' })
    //   .subscribe((resp: any) => {

    //     this.actividades = resp.data ?? resp;
    //     // this.mapearEventos();
    //     this.events = this.actividades.map((item: any) => ({
    //       id: item.id,
    //       event_title: item.titulo,
    //       event_date: this.parseFechaLocal(item.fecha_actividad),
    //       event_theme: this.mapTipoActividad(item.tipo_actividad),
    //       descripcion: item.descripcion
    //     }));
    //   });
  }

  parseFechaLocal(fechaIso: string): Date {
    const [year, month, day] = fechaIso.substring(0, 10).split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  mapTipoActividad(tipo: string): string {
    switch (tipo) {
      case 'PLAZO':
        return 'bg-red-100 border-red-400 text-red-700';
      case 'AUDIENCIA':
        return 'bg-blue-100 border-blue-400 text-blue-700';
      default:
        return 'bg-gray-100 border-gray-400 text-gray-700';
    }
  }

  // =====================================================
  // MAPEO ACTIVIDADES → EVENTOS
  // =====================================================
  // mapearEventos(): void {
  //   this.events = this.actividades.map(act => ({
  //     event_date: new Date(act.fecha_actividad),
  //     event_title: act.titulo,
  //     event_theme: this.obtenerTema(act.tipo_actividad),
  //   }));
  // }

  obtenerTema(tipo: string): string {
    switch (tipo) {
      case 'AUDIENCIA': return 'red';
      case 'PLAZO': return 'yellow';
      case 'REUNION': return 'blue';
      case 'NOTIFICACION': return 'green';
      default: return 'purple';
    }
  }

  // =====================================================
  // CALENDARIO
  // =====================================================
  isToday(date: number): boolean {
    const d = new Date(this.year, this.month, date);
    return this.today.toDateString() === d.toDateString();
  }

  getNoOfDays(): void {
    const daysInMonth = new Date(this.year, this.month + 1, 0).getDate();
    const dayOfWeek = new Date(this.year, this.month).getDay();

    this.emptyDays = Array.from({ length: dayOfWeek }, (_, i) => i);
    this.numOfDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }

  nextMonth(): void {
    if (this.month < 11) {
      this.month++;
      this.getNoOfDays();
    }
  }

  prevMonth(): void {
    if (this.month > 0) {
      this.month--;
      this.getNoOfDays();
    }
  }

  eventClass(theme: string): string {
    switch (theme) {
      case 'blue': return 'border-blue-200 text-blue-800 bg-blue-100';
      case 'red': return 'border-red-200 text-red-800 bg-red-100';
      case 'yellow': return 'border-yellow-200 text-yellow-800 bg-yellow-100';
      case 'green': return 'border-green-200 text-green-800 bg-green-100';
      default: return 'border-purple-200 text-purple-800 bg-purple-100';
    }
  }

  // =====================================================
  // MODAL
  // =====================================================
  abrirModal() {
    this.modoEdicion = false;
    this.actividadSeleccionado = null;
    this.mostrarModal = true;
  }
  cerrarModal() {
    this.mostrarModal = false;
  }

  onActividadCreada(): void {
    this.cargarActividades();
  }

  addActivity() {
    throw new Error('Method not implemented.');
  }
}
