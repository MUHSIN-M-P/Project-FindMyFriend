import Image from "next/image"
interface messageProps{
    type:string,
    msg:string,
}

interface props{
    message:messageProps
    pfp:string
}

const Message = ({message, pfp}:props) => {
    if(message.type=='sent'){
        return (
            <div className="self-end-safe flex">
                <div className="border w-fit py-2 px-3 bg-retro_orange text-secondary rounded-b-lg rounded-tl-lg my-2 shadow max-w-[65vw] md:max-w-[25vw]">{message.msg}</div>
            </div>
        )
    }
    return (
        <div className="self-start-safe flex items-center gap-2"> 
            <div className="border w-fit py-2 px-3 text-secondary rounded-b-lg rounded-tr-lg my-2 shadow max-w-[65vw] md:max-w-[25vw]">{message.msg}</div>
        </div>
  )
}

export default Message