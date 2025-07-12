'use client'
import Link from "next/link";
import RetroButton from "./retroButton";
interface NavbarProps{
    currentPath:string
}

const Navbar=({currentPath}:NavbarProps)=>{
    const navLinks=[
        {name:'Find', href:'/'},
        {name:'Questions', href:'/quiz'},
        {name:'Profile', href:'/profile'}
    ];
    const res={data:{msgNo:5}}; // await axios.get("___")
    const msgNo=res.data.msgNo;
    return(
        <div className="flex">
            <div className="h-[27px]"></div>
            <nav className="min-h-[10vh] bg-background md:py-[16px] flex items-center justify-around w-full ">
                <Link href='/'>
                    <div className="main_title font-bungee text-2xl md:text-4xl text-secondary cursor-pointer">
                        Find Your Tribe
                    </div>
                </Link>
                <div className="navButtons hidden lg:block px-[21px] grow lg:grow-0">
                    {navLinks.map((link)=>{
                        const isActive = currentPath === link.href;
                        return(
                            <Link key={link.name} href={link.href}>
                                <RetroButton text={link.name} icon={null} onClick={() => { } } isActive={isActive} msgNo={0} extraClass={`${isActive?'bg-primary text-white':'text-secondary'}`} />
                            </Link>
                        )
                    })}
                    <Link href='/chat'>
                        <RetroButton text="Messages" icon={null} onClick={() => { } } isActive={true} msgNo={msgNo} extraClass="" />
                    </Link>
                </div>
                <div className="block lg:hidden relative">
                    <div className="flex items-center gap-5">
                        <img src="/icons/heart_outline.svg" alt="heart h-8" />
                        <img src="/icons/msg_icon.svg" alt="paper_plane" className="object-contain h-8" />
                        <div className={`${msgNo==0?'hidden':''} redDot bg-primary p-1 h-6 w-6 border border-secondary rounded-full absolute top-0 right-0 translate-x-2 -translate-y-2 flex justify-center items-center text-white text-sm`}>
                            {msgNo}
                        </div>
                    </div>
                </div>
            </nav>
            {/* <div className="bg-secondary h-[3px] w-full"></div> */}
        </div>
    )
}

export default Navbar;