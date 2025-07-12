const RetroButton=({text, icon, onClick, isActive}:{text:string, icon:string|null, onClick:()=>void, isActive:boolean})=>{
    return(
            <button className={`py-2 px-5 mx-3 rounded-md cursor-pointer font-poppins font-semibold shadow-button ${isActive?'bg-primary text-white':'text-secondary'} `}>
                {icon && <img src={icon} alt={text+"_icon"} className="object-contain h-8" />}
                {text}
            </button>

    )
}

export default RetroButton;