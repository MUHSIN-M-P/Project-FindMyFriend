import Image from "next/image"
interface userProps{
    id:string, // Unique id 
    name:string, 
    age:number,
    gender:string, // M/F
    hobbies: string[], // 3 hobbies
    desc: string, //description about self
    pfp_path:string,
    score: number,
    bestMatch:boolean 
}

interface props{
    user:userProps
}

const Usercard=({user}:props)=>{
    return(
        <div className={`md:px-5 py-6 lg:px-7 lg:py-8 font-poppins rounded-3xl max-w-[90vw] md:max-w-[80vw] shadow-3 flex flex-col md:flex-row ${user.bestMatch?'bg-primary text-white relative':''}`}>
            <div className={`bg-background absolute max-w-[167px] w-full max-h-[36px] h-full text-secondary flex justify-center items-center rounded-md shadow font-semibold top-[-18px] left-[36px] ${user.bestMatch?'':'hidden'}`}># Best Match</div>
            <div>
                {/* This path is relative to the 'public' directory */}
                <Image src='/3d_avatar_6.png' alt={`${user.name}_pfp`} width={120} height={120} className="lg:w-[150px] lg:h-[150px] object-contain grow"/>
            </div>
            <div className="userInfo flex flex-col max-w-[80vw] md:max-w-[60vw] lg:max-w-[25vw] mx-5 lg:ml-5 lg:mr-15 mb-2 md:mb-0">
                <div className="intro_title text-3xl font-semibold md:text-2xl">
                    {user.name} | {user.age}{user.gender}
                </div>
                <div className="Hobbies flex gap-1 lg:gap-2 text-secondary">
                    {user.hobbies.map((hobby)=>(
                        <span key={hobby} className="shadow px-5 py-2 rounded-md text-[14px] bg-background">
                            {hobby}
                        </span>
                    ))}
                    
                </div>
                <div className="desc text-[16px] text-left w-full md:w-[20vw]">
                    {user.desc}
                </div>
            </div>
            <div className="btns flex md:flex-col justify-around gap-4 px-3 md:gap-[61px] text-secondary">
                <div className="shadow-2 py-2 px-3 md:px-7 text-[14px] rounded-lg bg-retro_orange flex justify-center gap-1 grow md:grow-0">
                    <p>Score:</p> 
                    <p>{user.score}fp</p> 
                </div>
                <div className="py-2 md:px-7 text-[14px] flex justify-center rounded-lg gap-1 bg-background shadow-button cursor-pointer grow md:grow-0">
                    <img src="/icons/conn_icon.svg" alt="conn_icon" className="w-5"/>
                    <p>connect</p>
                </div>
            </div>
            <div className="hidden lg:block w-[5vw]"></div>
        </div>
    )
}

export default Usercard