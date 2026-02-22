import { useFearGreed } from '../hooks/useFearGreed';

function getColor(value: number): string {
    if (value <= 25) return '#ff3b3b';
    if (value <= 45) return '#ff8c00';
    if (value <= 55) return '#ffb700';
    if (value <= 75) return '#2dff6e';
    return '#00ff99';
}

export function FearGreed() {
    const data = useFearGreed();

    return (
        <div
            style={{
                padding: '8px 24px',
                background: 'var(--surface)',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
            }}
        >
            <span style={{ color: 'var(--text-muted)', letterSpacing: '0.2em' }}>
                // FEAR_GREED.exe
            </span>

            {data ? (
                <>
                    <span
                        style={{ color: getColor(data.value), fontWeight: 900, fontSize: '16px' }}
                    >
                        {data.value}
                    </span>
                    <span
                        style={{
                            color: getColor(data.value),
                            fontWeight: 700,
                            letterSpacing: '0.12em',
                        }}
                    >
                        {data.classification.toUpperCase()}
                    </span>

                    <span style={{ color: 'var(--border)' }}>|</span>

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
                <span style={{ color: 'var(--text-muted)' }}>...</span>
            )}
        </div>
    );
}
