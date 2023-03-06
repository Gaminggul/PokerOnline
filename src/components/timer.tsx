import dayjs from "dayjs";
import { useEffect, useState } from "react";

export function Timer({
    end_time,
    on_end,
}: {
    end_time: Date;
    on_end?: () => void | Promise<void>;
}) {
    // A timer that counts down to a given end time.
    // The timer stays at 0 after the end time and calls on_end when it reaches 0.
    function get_remaining_time() {
        return dayjs(end_time).subtract(dayjs().second(), "second").second();
    }

    const [time, setTime] = useState(get_remaining_time());

    useEffect(() => {
        const interval = setInterval(() => {
            const new_time = get_remaining_time();
            if (new_time <= 0) {
                setTime(0);
                void on_end?.();
                clearInterval(interval);
            } else {
                setTime(new_time);
            }
        }, 1000);
        return () => clearInterval(interval);
    });

    return <>{time}</>;
}
