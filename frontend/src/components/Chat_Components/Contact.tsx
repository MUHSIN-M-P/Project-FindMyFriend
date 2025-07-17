import Image from "next/image"
interface contactProps{
    id:string, 
    name:string, 
    latest_msg: string, //description about self
    pfp_path:string,
    number:number
}

interface props{
    contact:contactProps
}

const Contact = ({contact}:props) => {
  return (
    <div className="flex py-2 px-4 gap-3 items-center relative">
        <div className="">
            <Image src={contact.pfp_path} alt={`${contact.name}_pfp`} width={20} height={20} className="w-15"/>
        </div>
        <div className="flex flex-col truncate font-poppins relative">
            <div className="name text-xl">
                {contact.name}
            </div>
            <div className="desc truncate text-sm font-light max-w-[10vw]">
                {contact.latest_msg}
            </div>
        </div>
        <div className={`${contact.number==0?'hidden':''} absolute right-2 redDot bg-retro_red p-1 h-6 w-6 border border-retro_border rounded-full flex justify-center items-center text-white text-sm`}>
                {contact.number}
        </div>
    </div>
  )
}

export default Contact