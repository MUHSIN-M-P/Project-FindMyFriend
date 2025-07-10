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
        <div className="flex flex-col items-center">
            <div className="h-[27px]"></div>
            <nav className="min-h-[10vh] bg-background py-[16px] flex justify-between w-full px-[42px]">
                <Link href='/'>
                    <div className="main_title font-bungee text-[36px] text-secondary cursor-pointer">
                        Find Your Tribe
                    </div>
                </Link>
                <div className="navButtons px-[21px]">
                    {navLinks.map((link)=>{
                        const isActive = currentPath === link.href;
                        return(
                            <Link key={link.name} href={link.href}>
                                <button className={`py-2 px-5 mx-3 rounded-md cursor-pointer font-poppins font-semibold shadow-button ${isActive?'bg-primary text-white':'text-secondary'} `}>
                                        {link.name}
                                </button>
                            </Link>
                        )
                    })}
                    <Link href='/chat'>
                        <button className={`py-2 px-5 mx-3 relative rounded-md cursor-pointer font-poppins font-semibold shadow-button ${msgNo>0?'bg-primary text-white':'text-secondary'}`}>
                                Messages
                                <div className={`${msgNo==0?'hidden':''} redDot bg-primary p-1 h-6 w-6 border border-secondary rounded-full absolute top-0 right-0 translate-x-2 -translate-y-2 flex justify-center items-center text-white text-sm`}>
                                    {msgNo}
                                </div>
                        </button>
                    </Link>
                </div>
            </nav>
            <div className="bg-secondary h-[3px] w-full"></div>
        </div>
    )
}

export default Navbar;