import Image from "next/image"
import RetroButton from "./retroButton"
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
        <div className={`px-2 md:px-5 py-6 lg:px-7 lg:py-8 font-poppins rounded-3xl shadow-3 flex flex-col w-full justify-between md:flex-row gap-3 items-start md:items-center text-secondary ${user.bestMatch?'bg-primary text-white relative':''}`}>
            <div className={`bg-background absolute max-w-[167px] w-full max-h-[36px] h-full text-secondary flex justify-center items-center rounded-md shadow font-semibold top-[-18px] left-[36px] ${user.bestMatch?'':'hidden'}`}># BEST MATCH</div>
            <div className="w-full flex justify-center items-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]">
                <Image src='/3d_avatar_6.png' alt={`${user.name}_pfp`} width={120} height={120} className="w-full h-full object-contain"/>
            </div>
            <div className="userInfo w-full flex flex-col gap-2 mb-2 md:mb-0">
                <div className="intro_title font-semibold text-[22px]">
                    {user.name} | {user.age}{user.gender}
                </div>
                <div className="Hobbies flex gap-2 lg:gap-3 text-secondary flex-wrap">
                    {user.hobbies.map((hobby,index)=>(
                        <RetroButton key={index} text={hobby} icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass="mx-0!" />
                    ))}
                    
                </div>
                <div className="desc text-[16px] text-left w-full">
                    {user.desc}
                </div>
            </div>
            <div className="btns flex w-full md:w-fit md:flex-col justify-around gap-4 md:gap-[61px] text-secondary">
                <RetroButton text={`Score: ${user.score}fp`} icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass="mx-0! bg-retro_orange w-full" />
                <RetroButton text="Connect" icon={"/icons/conn_icon.svg"} onClick={()=>{}} isActive={false} msgNo={0} extraClass="mx-0! w-full" />
            </div>
        </div>
    )
}

export default Usercard