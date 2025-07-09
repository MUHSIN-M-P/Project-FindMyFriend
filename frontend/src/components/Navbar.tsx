'use client'
import Link from "next/link";

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
        <>
            <nav className="bg-background px-5 py-6 flex justify-between ">
                <Link href='/'>
                    <div className="main_title font-bungee text-3xl text-secondary">
                        Find Your Tribe
                    </div>
                </Link>
                <div className="navButtons">
                    {navLinks.map((link)=>{
                        const isActive = currentPath === link.href;
                        return(
                            <button className={`py-2 px-5 mx-3 rounded-md border border-b-3 border-r-3 cursor-pointer border-secondary font-semibold ${isActive?'bg-primary text-white':'text-secondary'} active:translate-x-[1px] active:translate-y-[1px] active:border-b-2 active:border-r-2`}>
                                <Link href={link.href}>
                                    {link.name}
                                </Link>
                            </button>
                        )
                    })}
                    <Link href='/chat'>
                        <button className={`py-2 px-5 mx-3 relative rounded-md border border-b-3 border-r-3 cursor-pointer border-secondary font-semibold ${msgNo>0?'bg-primary text-white':'text-secondary'} active:translate-x-[1px] active:translate-y-[1px] active:border-b-2 active:border-r-2`}>
                                Messages
                                <div className="redDot bg-primary p-1 h-6 w-6 border border-secondary rounded-full absolute top-0 right-0 translate-x-2 -translate-y-2 flex justify-center items-center text-white text-sm">
                                    {msgNo}
                                </div>
                        </button>
                    </Link>
                </div>
            </nav>
            <div className="bg-secondary h-[2px]"></div>
        </>
    )
}

export default Navbar;