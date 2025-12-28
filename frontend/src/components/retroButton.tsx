const RetroButton = ({
    text,
    icon,
    onClick,
    isActive,
    msgNo,
    extraClass,
}: {
    text: string;
    icon: string | null;
    onClick: () => void | Promise<void>;
    isActive: boolean;
    msgNo: number;
    extraClass: string;
}) => {
    return (
        <button
            onClick={onClick}
            className={`relative py-[6px] px-5 mx-2 rounded-lg cursor-pointer tracking-wide text-sm font-poppins font-semibold shadow-button text-nowrap flex flex-row justify-center items-center gap-2 ${
                isActive
                    ? "bg-primary text-white"
                    : "bg-background text-secondary"
            } ${extraClass}`}
        >
            {icon && (
                <img
                    src={icon}
                    alt={text + "_icon"}
                    className="object-contain h-full"
                />
            )}
            {text}
            <div
                className={`${
                    msgNo == 0 ? "hidden" : ""
                } redDot bg-primary p-1 h-6 w-6 border border-secondary rounded-full absolute top-0 right-0 translate-x-2 -translate-y-2 flex justify-center items-center text-white text-sm`}
            >
                {msgNo}
            </div>
        </button>
    );
};

export default RetroButton;
