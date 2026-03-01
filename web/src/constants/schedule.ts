export interface ScheduleItem {
  time: string;
  icon: string;
  title: string;
  desc: string;
  weekendOnly?: boolean;
  weekdayOnly?: boolean;
}

export const SCHEDULE: ScheduleItem[] = [
  {
    time: '10:00',
    icon: '☀️',
    title: 'Buenos días, LATAM',
    desc: 'Precios de apertura + la noticia que importó anoche. Con café o sin café.',
  },
  {
    time: '13:00',
    icon: '📡',
    title: 'Flash del mediodía',
    desc: 'La movida más importante de las últimas horas. Directo al punto.',
  },
  {
    time: '18:00',
    icon: '📊',
    title: 'Cierre americano',
    desc: 'Wall Street habló. ¿Qué significa para el cripto? El sapo traduce.',
    weekdayOnly: true,
  },
  {
    time: '17:00',
    icon: '🐸',
    title: 'El sapo no descansa',
    desc: 'Finde de semana, mercado abierto. El pantano no cierra los sábados.',
    weekendOnly: true,
  },
  {
    time: '20:00',
    icon: '🔍',
    title: 'Análisis nocturno',
    desc: 'Contexto, no ruido. Una noticia bien explicada antes de cerrar el día.',
  },
  {
    time: '22:00',
    icon: '⚡',
    title: 'Breaking & señales',
    desc: 'Si algo importante pasa — el sapo lo detecta antes que los demás.',
    weekdayOnly: true,
  },
  {
    time: '21:00',
    icon: '⚡',
    title: 'Breaking & señales',
    desc: 'Si algo importante pasa — el sapo lo detecta antes que los demás.',
    weekendOnly: true,
  },
  {
    time: '22:30',
    icon: '🌙',
    title: 'Buenas noches',
    desc: 'El pantano se cierra. Hasta mañana (o no, si hay breaking).',
    weekdayOnly: true,
  },
  {
    time: '23:30',
    icon: '🌙',
    title: 'Buenas noches',
    desc: 'Noche larga de finde. El sapo se retira. El mercado, probablemente no.',
    weekendOnly: true,
  },
];
