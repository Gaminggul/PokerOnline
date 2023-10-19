import { useState } from "react";

export function useRerender(): () => void {
    const [, setCount] = useState(0);
    return () => setCount((count) => count + 1);
}