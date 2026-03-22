import { useState, useEffect } from 'react';
import { Ticker } from './components/Ticker';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Schedule } from './components/Schedule';
import { Mission } from './components/Mission';
import { Roadmap } from './components/Roadmap';
import { Footer } from './components/Footer';
import type { Mood } from './constants/moods';
import { RecentPosts } from './components/RecentPosts.tsx';
import { MouseSpotlight } from './components/MouseSpotlight';
import { ToadRunner } from './components/ToadRunner';

export default function LandingPage() {
  const [mood, setMood] = useState<Mood>('neutral');
  const [time, setTime] = useState(new Date());
  const [glitching, setGlitching] = useState(false);
  const [showGame, setShowGame] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);

    // ASCII Art & Secret
    console.log(
      `
 %c    
  _____ ___  _   ___     __      _____ ___ ___ 
 |_   _/ _ \\/_\\ |   \\ ___\\ \\    / /_ _| _ \\ __|
   | || (_) / _ \\| |) |___\\ \\/\\/ / | ||   / _| 
   |_| \\___/_/ \\_\\___/     \\_/\\_/ |___|_|_\\___|
                                               
 %c >> TOAD-WIRE ENGINE INITIALIZED
 >> STATUS: NOMINAL
 >> SYSTEM TIME: ${new Date().toISOString()}
 >> HINT: CLICK THE ENGINE STATUS IN HEADER FOR STRESS TEST
`,
      'color: #2dff6e; font-weight: bold;',
      'color: #4a7a4a;',
    );

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
    <div
      className="bg-grid"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'relative' }}
    >
      <MouseSpotlight />
      {showGame && <ToadRunner onClose={() => setShowGame(false)} />}
      <Ticker color={mood === 'bearish' ? 'var(--red)' : 'var(--green)'} />
      <Header time={time} onStressTest={() => setShowGame(true)} />
      <Hero mood={mood} glitching={glitching} switchMood={switchMood} />
      <RecentPosts />
      <Schedule />
      <Mission />
      <Roadmap />
      <Footer />
    </div>
  );
}
