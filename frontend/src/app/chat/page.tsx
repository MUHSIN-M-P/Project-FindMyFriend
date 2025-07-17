import Contact from "@/components/Chat_Components/Contact"
import Message from "@/components/Chat_Components/Message";
import { IoIosArrowBack } from "react-icons/io";
import Link from "next/link";
import Image from "next/image";
import back_arrow from '../../../public/icons/back_arrow.png'

const page = () => {
  const res1={data:{
    contacts:[
      {
        id:'001',
        name:'Ibinu Jaleel',
        pfp_path:'/avatars/male_avatar.png',
        latest_msg:'Man this app is gonna be LIT on god fr fr fr fr fr fr ',
        number:0
      },
      {
        id:'002',
        name:'Sidsity',
        pfp_path:'/avatars/female_avatar.png',
        latest_msg:"I'll be halal i promise",
        number:3
      }
    ]
  }}
  const contacts=res1.data.contacts

  const res2={
    data:{
      messages:[
        {
          type:"received",
          msg:"Hello",
          pfp:"/avatars/female_avatar.png"
        },
        {
          type:"received",
          msg:"How are you my niga",
          pfp:"/avatars/female_avatar.png"
        },
        {
          type:"sent",
          msg:"I am feeling amazing homie for riyal!!!"
        },
        {
          type:"sent",
          msg:"Three months of vacation is killing me vroo, like wtf was the administration thinking I can give birth to a baby in 3 months"
        },
        {
          type:"received",
          msg:"what the FUCK ARE YOU SAYING",
          pfp:"/avatars/female_avatar.png"
        }
      ]
    }
  };
  const mypfp='/avatars/male_avatar.png'
  const theirpfp='/avatars/female_avatar.png'
  const messages=res2.data.messages;

  return (
    <div className="flex flex-col w-full h-screen overflow-x-hidden">
      <div className="h-[3px] bg-retro_border w-full"></div>
      <div className="flex h-full w-[100vw] justify-around">
        <div className="contacts md:w-[30vw] lg:w-[20vw]">
          <Link href='/'>
            <div className="flex items-center gap-2 text-3xl py-2 px-3 font-poppins font-extralight text-secondary my-3">
              <Image src={back_arrow} alt='back_arrow' className="w-4"></Image>
               Back
            </div>
          </Link>
          {contacts.map((contact)=>(
            <Contact key={contact.id} contact={contact}/>
          ))}
        </div>
        <div className="w-[3px] bg-retro_border h-full"></div>
        <div className="chat md:w-[70vw] lg:max-w-[80vw]">
          <div>UserBar</div>
          <div className="flex flex-col px-5">
            {messages.map((message)=>(
              <Message message={message}/>
            ))}
          </div>
          <div>Text Bar</div>
        </div>
      </div>
    </div>
  )
}

export default page