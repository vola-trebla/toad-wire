import { useEffect, useState } from 'react';

interface FearGreedData {
    value: number;
    classification: string;
}

export function useFearGreed() {
    const [data, setData] = useState<FearGreedData | null>(null);

    useEffect(() => {
        fetch('https://api.alternative.me/fng/')
            .then((res) => res.json())
            .then((json) => {
                const item = json.data[0];
                setData({
                    value: parseInt(item.value),
                    classification: item.value_classification,
                });
            })
            .catch(console.error);
    }, []);

    return data;
}
