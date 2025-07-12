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
        <div className={`px-5 md:px-5 py-6 lg:px-7 lg:py-8 font-poppins rounded-3xl max-w-[90vw] md:max-w-[80vw] shadow-3 flex flex-col w-full justify-between md:flex-row gap-3 items-start md:items-center ${user.bestMatch?'bg-primary text-white relative':''}`}>
            <div className={`bg-background absolute max-w-[167px] w-full max-h-[36px] h-full text-secondary flex justify-center items-center rounded-md shadow font-semibold top-[-18px] left-[36px] ${user.bestMatch?'':'hidden'}`}># Best Match</div>
            <div className="w-full flex justify-center items-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]">
                <Image src='/3d_avatar_6.png' alt={`${user.name}_pfp`} width={120} height={120} className="w-full h-full object-contain"/>
            </div>
            <div className="userInfo w-full flex flex-col gap-2 mb-2 md:mb-0">
                <div className="intro_title font-semibold text-[22px]">
                    {user.name} | {user.age}{user.gender}
                </div>
                <div className="Hobbies flex gap-1 lg:gap-2 text-secondary">
                    {user.hobbies.map((hobby)=>(
                        <span key={hobby} className="shadow px-5 py-2 rounded-md text-[14px] bg-background">
                            {hobby}
                        </span>
                    ))}
                    
                </div>
                <div className="desc text-[16px] text-left w-full">
                    {user.desc}
                </div>
            </div>
            <div className="btns flex w-full md:w-fit md:flex-col justify-around gap-4 md:gap-[61px] text-secondary">
                <div className="shadow-2 py-2 px-3 md:px-7 text-[14px] rounded-lg bg-retro_orange flex justify-center gap-1 grow md:grow-0">
                    <p>Score:</p> 
                    <p>{user.score}fp</p> 
                </div>
                <div className="py-2 md:px-7 text-[14px] flex justify-center rounded-lg gap-1 bg-background shadow-button cursor-pointer grow md:grow-0">
                    <img src="/icons/conn_icon.svg" alt="conn_icon" className="w-5"/>
                    <p>connect</p>
                </div>
            </div>
        </div>
    )
}

export default Usercard