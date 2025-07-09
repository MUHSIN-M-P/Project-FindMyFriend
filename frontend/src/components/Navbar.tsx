import Link from "next/link";

interface NavbarProps{
    currentPath:string
}

const Navbar=({currentPath}:NavbarProps)=>{
    const navLinks=[
        {name:'Find', href:'/'},
        {name:'Questions', href:'/quiz'},
        {name:'Profile', href:'/profile'},
        {name:'Messages', href:'/chat'}
    ];
    return(
        <nav className="bg-background p-5 flex justify-between">
            <div className="main_title font-bungee text-3xl text-secondary">
                Find Your Tribe
            </div>
            <div className="navButtons">
                {navLinks.map((link)=>{
                    const isActive = currentPath === link.href;
                    return(
                        <button className={`p-2 mx-3 rounded-md border border-b-2 border-r-2 cursor-pointer border-secondary ${isActive?'bg-primary':''}`}>
                            <Link href={link.href}>
                                {link.name}
                            </Link>
                        </button>
                    )
                })}
            </div>
        </nav>
    )
}

export default Navbar;