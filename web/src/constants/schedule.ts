export interface ScheduleItem {
    time: string;
    icon: string;
    title: string;
    desc: string;
}

export const SCHEDULE: ScheduleItem[] = [
    {
        time: '10:00',
        icon: '☀️',
        title: 'Buenos días, LATAM',
        desc: 'Precios de apertura + las noticias que importaron anoche. Con café o sin café.',
    },
    {
        time: '12:00',
        icon: '📡',
        title: 'Flash del mediodía',
        desc: 'La movida más importante de las últimas horas. Directo al punto.',
    },
    {
        time: '15:00',
        icon: '🔍',
        title: 'Análisis de la tarde',
        desc: 'Contexto, no ruido. Una noticia, bien explicada.',
    },
    {
        time: '18:00',
        icon: '📊',
        title: 'Cierre americano',
        desc: 'Wall Street habló. ¿Qué significa para el cripto? El sapo traduce.',
    },
    {
        time: '21:00',
        icon: '🌙',
        title: 'Buenas noches',
        desc: 'Resumen del día + lo que vigilar mañana. Duerme tranquilo (o no).',
    },
];
