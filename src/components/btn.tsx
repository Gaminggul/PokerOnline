export function Btn(props: { text: string; onClick?: () => void }) {
    return (
        <button
            onClick={props.onClick}
            className="pw-8 w-full rounded-lg bg-green-500 py-4 text-white hover:bg-green-600"
        >
            {props.text}
        </button>
    );
}
