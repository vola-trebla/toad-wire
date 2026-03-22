interface Props {
  time: Date;
  onStressTest?: () => void;
}

export function Header({ time, onStressTest }: Props) {
  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

  return (
    <header className="bg-(--bg) border-b border-(--border) px-5 py-3 md:px-10 md:py-5">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="font-display text-sm font-bold text-(--green) tracking-widest whitespace-nowrap">
          TOAD-WIRE
        </div>

        {/* Center: Engine Status — Desktop only */}
        <div className="hidden md:flex flex-1 justify-center px-8">
          <div
            onClick={onStressTest}
            className="font-mono text-xs font-bold text-(--text-muted) tracking-widest flex items-center gap-4 cursor-pointer hover:bg-(--green)/10 hover:border-(--green)/30 border border-transparent px-6 py-2.5 transition-all rounded-lg group shadow-lg"
          >
            <span className="text-(--green) group-hover:animate-pulse">
              [ ENGINE_STATUS: NOMINAL ]
            </span>
            <span className="opacity-20">|</span>
            <span className="group-hover:text-(--text)">LOAD: 12.4%</span>
            <span className="opacity-20">|</span>
            <span className="group-hover:text-(--text)">API: STABLE</span>
          </div>
        </div>

        {/* Right: Roadmap + Live */}
        <div className="flex items-center gap-6">
          <button
            onClick={() =>
              document.getElementById('roadmap')?.scrollIntoView({ behavior: 'smooth' })
            }
            className="font-display text-[11px] font-bold tracking-widest text-(--text-muted) bg-transparent border-none cursor-pointer transition-colors hover:text-(--green) whitespace-nowrap"
          >
            SYSTEM_MAP
          </button>
          <div className="font-mono text-xs text-(--text-dim) flex items-center gap-2 whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-(--green) inline-block animate-[pulse-green_2s_infinite] shrink-0" />
            LIVE · {formatTime(time)} UTC
          </div>
        </div>
      </div>
    </header>
  );
}
