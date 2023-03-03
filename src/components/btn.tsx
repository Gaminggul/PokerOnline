import { useRouter } from "next/router";

export function Btn({
    onClick,
    text,
}: {
    text: string;
    onClick?: (() => void) | string;
}) {
    const router = useRouter();

    return (
        <button
            onClick={
                onClick
                    ? () => {
                          if (typeof onClick === "string") {
                              void router.push(onClick);
                          } else {
                              onClick();
                          }
                      }
                    : undefined
            }
            className="pw-8 w-full rounded-lg bg-green-500 py-4 text-white hover:bg-green-600"
        >
            {text}
        </button>
    );
}
