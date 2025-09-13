import { useEffect, useRef, useState } from "react";

export function useCountdown(initialSeconds: number = 86400) {
    const [seconds, setSeconds] = useState<number>(0);
    const [isReady, setIsReady] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const formatTime = (s: number) => {
        const h = Math.floor(s / 3600).toString().padStart(2, "0");
        const m = Math.floor((s % 3600) / 60).toString().padStart(2, "0");
        const sec = Math.floor(s % 60).toString().padStart(2, "0");
        return `${h}:${m}:${sec}`;
    };

    const start = () => {
        if (timerRef.current) clearInterval(timerRef.current);
        setSeconds(initialSeconds);
        setIsReady(false);

        timerRef.current = setInterval(() => {
            setSeconds((prev) => {
                if (prev <= 1) {
                    clearInterval(timerRef.current!);
                    setIsReady(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    };

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, []);

    return { seconds, isReady, formatTime, start };
}
