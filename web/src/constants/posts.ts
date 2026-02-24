export interface Post {
  title: string;
  text: string;
  source: string;
  sentiment: string;
  tags: string[];
}

export const POSTS: Post[] = [
  {
    title: '🚨 Ingenieros de Silicon Valley acusados de robar secretos a Google',
    text: 'Según Decrypt, ingenieros de Silicon Valley enfrentan cargos por robar secretos comerciales de Google y otras empresas tecnológicas. Es un recordatorio de que la seguridad de la información es un reto para todos.\n\nVaya, ni en Silicon Valley se salvan de la tentación. La información vale oro, y algunos lo saben bien. 🐸',
    source: 'Decrypt',
    sentiment: '⚪️ Neutral',
    tags: ['#SiliconValley', '#Seguridad'],
  },
  {
    title: '⚖️ Wall Street dobla apuesta cripto mientras el DeFi batalla con la liquidez',
    text: 'Grandes inversores de Wall Street están aumentando su participación en empresas de tesorería cripto, a pesar del mercado bajista. Mientras tanto, el ecosistema DeFi enfrenta desafíos de liquidez.\n\nLos peces gordos compran cuando hay sangre en el agua DeFi. 🐸',
    source: 'CoinTelegraph',
    sentiment: '⚪️ Neutral',
    tags: ['#WallStreet', '#DeFi'],
  },
  {
    title: '🛡️ Irán se ahoga en inflación: Ciudadanos huyen al bitcoin',
    text: 'El rial iraní está en caída libre en 2026, con la hiperinflación devorando los ahorros. Esta situación está empujando a ciudadanos de clase media a mover miles de millones a Bitcoin.\n\nOtra vez la misma historia: el dinero fiat se derrite y el pueblo busca refugio en lo descentralizado. 🐸',
    source: 'CoinDesk',
    sentiment: '🟢 Bullish',
    tags: ['#Bitcoin', '#Hiperinflacion'],
  },
  {
    title: '💰 ETF de ProShares listo para stablecoins debuta con $17B',
    text: 'ProShares lanzó el IQMM, un ETF diseñado para cumplir con los requisitos de reserva de stablecoins bajo la Ley GENIUS, y tuvo un debut de $17 mil millones. Aunque se especuló que Circle movió fondos, los datos sugieren que fueron movimientos internos. Este fondo podría atraer mucha demanda de la industria de stablecoins a medida que la regulación avanza.\n\nVaya debut para un fondo "estable". Parece que la regulación no asusta a todos, ¿eh? 🐸',
    source: 'CoinDesk',
    sentiment: '🟢 Bullish',
    tags: ['#Stablecoins', '#ETF', '#ProShares'],
  },
];
