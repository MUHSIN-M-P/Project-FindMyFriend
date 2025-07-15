import Contact from "@/components/Chat_Components/Contact"
import { IoIosArrowBack } from "react-icons/io";
import Link from "next/link";
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
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="h-[3px] bg-retro_border w-full"></div>
      <div className="flex h-full w-[100vw] justify-around">
        <div className="contacts md:w-[30vw] lg:w-[20vw]">
          <Link href='/'>
            <div className="flex items-center text-3xl py-2 px-3 font-poppins font-extralight my-3">
              <IoIosArrowBack/> Back
            </div>
          </Link>
          {contacts.map((contact)=>(
            <Contact key={contact.id} contact={contact}/>
          ))}
        </div>
        <div className="w-[3px] bg-retro_border h-full"></div>
        <div className="chat md:w-[70vw] lg:w-[80vw]">
          How
        </div>
      </div>
    </div>
  )
}

export default page