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
        <div className={`px-[27px] py-[31px] font-poppins rounded-lg max-w-[753px] max-h-[208px] shadow-3 flex gap-[23px] items-center ${user.bestMatch?'bg-primary text-white relative':''}`}>
            <div className={`bg-background absolute max-w-[167px] w-full max-h-[36px] h-full text-secondary flex justify-center items-center rounded-md shadow font-semibold top-[-18px] left-[36px] ${user.bestMatch?'':'hidden'}`}># Best Match</div>
            <div>
                {/* This path is relative to the 'public' directory */}
                <Image src='/3d_avatar_6.png' alt={`${user.name}_pfp`} width={120} height={120} className="w-[120px] h-[120px] object-contain"/>
            </div>
            <div className="userInfo w-[314px] flex flex-col">
                <div className="intro_title text-[22px]">
                    {user.name} | {user.age}{user.gender}
                </div>
                <div className="Hobbies flex gap-[8px] text-secondary">
                    {user.hobbies.map((hobby)=>(
                        <span key={hobby} className="shadow px-[21px] py-[8px] rounded-md text-[14px] bg-background">
                            {hobby}
                        </span>
                    ))}
                    
                </div>
                <div className="desc text-[16px] text-left">
                    {user.desc}
                </div>
            </div>
            <div className="btns flex flex-col w-[139px] gap-[61px] text-secondary">
                <div className="shadow py-[8px] text-center text-[14px] rounded-md bg-retro_orange">
                    Score: {user.score}fp
                </div>
                <div className="shadow-2 pl-2 py-[8px] text-center text-[14px] flex rounded-md gap-[5px] bg-background">
                    <img src="/icons/conn_icon.svg" alt="conn_icon" />
                    <p>connect</p>
                </div>
            </div>
        </div>
    )
}

export default Usercard