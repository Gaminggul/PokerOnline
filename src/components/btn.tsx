import Link from "next/link";

export function Btn({
    onClick,
    text,
}: {
    text: string;
    onClick?: (() => void) | string;
}) {
    return onClick ? (
        typeof onClick === "string" ? (
            <Link href={onClick} className="w-full">
                <BtnLook text={text} />
            </Link>
        ) : (
            <button onClick={onClick} className="w-full">
                <BtnLook text={text} />
            </button>
        )
    ) : (
        <BtnLook text={text} />
    );
}

function BtnLook({ text }: { text: string }) {
    return (
        <div className="pw-8 w-full rounded-lg bg-green-500 py-4 text-center text-white hover:bg-green-600">
            {text}
        </div>
    );
}
