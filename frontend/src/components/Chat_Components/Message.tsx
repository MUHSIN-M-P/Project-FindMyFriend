import Image from "next/image"
interface messageProps{
    type:string,
    msg:string,
    pfp?:string
}

interface props{
    message:messageProps
}

const Message = ({message}:props) => {
    if(message.type=='sent'){
        return (
            <div className="self-end-safe flex">
                <div className="border w-fit py-2 px-3 bg-retro_orange text-secondary rounded-b-lg rounded-tl-lg my-2 shadow max-w-[20vw]">{message.msg}</div>
            </div>
        )
    }
    return (
        <div className="self-start-safe flex items-center gap-2"> 
            {message.pfp? <Image src={message.pfp} alt='their_pfp' width={20} height={20} className="object-contain h-full w-auto"/> : null}
            <div className="border w-fit py-2 px-3 text-secondary rounded-b-lg rounded-tr-lg my-2 shadow max-w-[20vw]">{message.msg}</div>
        </div>
  )
}

export default Message