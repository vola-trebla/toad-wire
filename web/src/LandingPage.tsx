import { useState, useEffect } from 'react';
import { useCryptoPrices } from './hooks/useCryptoPrices';
import { Ticker } from './components/Ticker';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Schedule } from './components/Schedule';
import { Mission } from './components/Mission';
import { Roadmap } from './components/Roadmap';
import { Footer } from './components/Footer';
import type { Mood } from './constants/moods';
import { RecentPosts } from './components/RecentPosts.tsx';

export default function LandingPage() {
  const prices = useCryptoPrices(['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'AVAX', 'DOT', 'LINK', 'UNI']);
  const [mood, setMood] = useState<Mood>('neutral');
  const [time, setTime] = useState(new Date());
  const [glitching, setGlitching] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const switchMood = (newMood: Mood) => {
    setGlitching(true);
    setTimeout(() => {
      setMood(newMood);
      setGlitching(false);
    }, 300);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Ticker prices={prices} color={mood === 'bearish' ? '#ff3b3b' : '#2dff6e'} />
      <Header time={time} />
      <Hero mood={mood} glitching={glitching} switchMood={switchMood} />
      <RecentPosts />
      <Schedule />
      <Mission />
      <Roadmap />
      <Footer />
    </div>
  );
}
