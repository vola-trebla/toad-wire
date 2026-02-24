import { FearGreed } from './FearGreed.tsx';

interface Props {
  time: Date;
}

export function Header({ time }: Props) {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <header className="bg-(--bg) border-b border-(--border) px-5 py-3 md:px-10 md:py-5">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="font-display text-sm font-bold text-(--green) tracking-widest whitespace-nowrap">
          EL SAPO CRIPTO
        </div>

        {/* Center: Fear & Greed — только десктоп */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <FearGreed />
        </div>

        {/* Right: Roadmap + Live */}
        <div className="flex items-center gap-6">
          <button
            onClick={() =>
              document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="font-display text-[11px] font-bold tracking-widest text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors hover:text-(--green) whitespace-nowrap"
          >
            ROADMAP
          </button>
          <div className="font-mono text-xs text-(--text-dim) flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-(--green) inline-block animate-[pulse-green_2s_infinite] shrink-0" />
            LIVE · {formatTime(time)} UY
          </div>
        </div>
      </div>

      {/* Fear & Greed compact — только мобайл */}
      <div className="mt-2 md:hidden flex justify-center">
        <FearGreed compact />
      </div>
    </header>
  );
}
