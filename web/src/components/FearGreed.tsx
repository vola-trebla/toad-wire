import { useFearGreed } from '../hooks/useFearGreed';

function getColor(value: number): string {
    if (value <= 25) return '#ff3b3b';
    if (value <= 45) return '#ff8c00';
    if (value <= 55) return '#ffb700';
    if (value <= 75) return '#2dff6e';
    return '#00ff99';
}

interface Props {
    compact?: boolean;
}

export function FearGreed({ compact = false }: Props) {
    const data = useFearGreed();

    if (compact) {
        return (
            <div className="font-mono text-[11px] flex items-center gap-2">
                <span className="text-(--text-muted) tracking-widest">// FEAR_GREED.exe</span>
                {data ? (
                    <>
                        <span
                            style={{ color: getColor(data.value) }}
                            className="font-black text-sm"
                        >
                            {data.value}
                        </span>
                        <span style={{ color: getColor(data.value) }} className="font-bold">
                            · {data.classification.toUpperCase()}
                        </span>
                    </>
                ) : (
                    <span className="text-(--text-muted)">...</span>
                )}
            </div>
        );
    }

    return (
        <div className="px-6 py-2 bg-(--bg) border-b border-(--border) flex items-center gap-6 font-mono text-[11px]">
            <span className="text-(--text-muted) tracking-widest">// FEAR_GREED.exe</span>
            {data ? (
                <>
                    <span style={{ color: getColor(data.value) }} className="font-black text-base">
                        {data.value}
                    </span>
                    <span
                        style={{ color: getColor(data.value) }}
                        className="font-bold tracking-widest"
                    >
                        {data.classification.toUpperCase()}
                    </span>
                    <span className="text-(--border)">|</span>
                    {[
                        { range: '0–24', label: 'Extreme Fear', color: '#ff3b3b' },
                        { range: '25–45', label: 'Fear', color: '#ff8c00' },
                        { range: '46–55', label: 'Neutral', color: '#ffb700' },
                        { range: '56–75', label: 'Greed', color: '#2dff6e' },
                        { range: '76–100', label: 'Extreme Greed', color: '#00ff99' },
                    ].map(({ range, label, color }) => {
                        const active = getColor(data.value) === color;
                        return (
                            <span
                                key={label}
                                style={{
                                    color,
                                    opacity: active ? 1 : 0.35,
                                    fontWeight: active ? 700 : 400,
                                }}
                            >
                                {range} {label} {active ? '◀' : ''}
                            </span>
                        );
                    })}
                </>
            ) : (
                <span className="text-(--text-muted)">...</span>
            )}
        </div>
    );
}
