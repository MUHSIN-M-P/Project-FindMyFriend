'use client'
import { useState, useRef, useEffect } from "react";
import Contact from "@/components/Chat_Components/Contact"
import Message from "@/components/Chat_Components/Message";
import RetroButton from "@/components/retroButton";
import EmojiButtonPicker from "@/components/Chat_Components/EmojiButton";
import Link from "next/link";
import Image from "next/image";
import back_arrow from '../../../public/icons/back_arrow.png'

interface social_links{
  name:string,
  link:string
}

const page = () => {
  const [InputValue, setInputValue] = useState<string>('');
  const [showProfile, setShowProfile]=useState<Boolean>(true);
  const inputRef = useRef<HTMLInputElement>(null); 

  const [name, setName]=useState<string>('');
  const [age, setAge]=useState<number>(-1);
  const [score, setScore]=useState<number>(-1);
  const [sex, setSex]=useState<string>('');
  const [pfp, setPfp]=useState<string>('');
  const [hobbies, setHobbies]=useState<string[]>([]);
  const [lastOnlineMsg, setLastOnlineMsg]=useState<string>('');
  const [socials, setSocials]=useState<social_links[]>([])
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
          id:'001',
          type:"received",
          msg:"Hello",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'002',
          type:"received",
          msg:"How are you my niga",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'003',
          type:"sent",
          msg:"I am feeling amazing homie for riyal!!!"
        },
        {
          id:'004',
          type:"sent",
          msg:"Three months of vacation is killing me vroo, like wtf was the administration thinking I can give birth to a baby in 3 months"
        },
        {
          id:'005',
          type:"received",
          msg:"what the FUCK ARE YOU SAYING",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'006',
          type:"received",
          msg:"Hello",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'007',
          type:"received",
          msg:"How are you my niga",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'008',
          type:"sent",
          msg:"I am feeling amazing homie for riyal!!!"
        },
        {
          id:'009',
          type:"sent",
          msg:"Three months of vacation is killing me vroo, like wtf was the administration thinking I can give birth to a baby in 3 months"
        },
        {
          id:'010',
          type:"received",
          msg:"what the FUCK ARE YOU SAYING",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'011',
          type:"received",
          msg:"Hello",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'012',
          type:"received",
          msg:"How are you my niga",
          pfp:"/avatars/female_avatar.png"
        },
        {
          id:'013',
          type:"sent",
          msg:"I am feeling amazing homie for riyal!!!"
        },
        {
          id:'014',
          type:"sent",
          msg:"Three months of vacation is killing me vroo, like wtf was the administration thinking I can give birth to a baby in 3 months"
        },
        {
          id:'015',
          type:"received",
          msg:"what the FUCK ARE YOU SAYING",
          pfp:"/avatars/female_avatar.png"
        },
      ]
    }
  };
  const messages=res2.data.messages;

  useEffect(()=>{
      const res3={
        data:{
          name:'Muhsina',
          age:19,
          gender:'f',
          score:19,
          lastOnline:137,
          pfp:'/avatars/female_avatar.png',
          hobbies:['Movies', 'Eating', 'Coding'],
          social_links: [{ name: "Instagram", link: "https://www.instagram.com/ibinujaleel/" }, { name: "Whatsapp", link: "https://wa.me/919876543210" }, { name: "Github", link: "https://github.com/ibinujaleel" }]
        }
      }
      setName(res3.data.name);
      setAge(res3.data.age);
      setSex(res3.data.gender);
      setScore(res3.data.score);
      setName(res3.data.name);
      setPfp(res3.data.pfp);
      setHobbies(res3.data.hobbies);
      setSocials(res3.data.social_links)
      const lastOnlineMins=res3.data.lastOnline;
      setLastOnlineMsg(`Last online ${lastOnlineMins>=60?`${Math.floor(lastOnlineMins/60)} hours `:''}${lastOnlineMins>=60&&lastOnlineMins%60!=0?'and ':''} ${lastOnlineMins%60!=0?`${lastOnlineMins%60} mins`:''} ago`);
      
  })
  

  const profile=()=>{
    return(
      <div className="w-[30vw] font-poppins h-full relative flex flex-col items-center">
        <div className="header absolute top-2 left-2 lg:hidden" onClick={()=>setShowProfile(false)}>
          <Image src={back_arrow} alt='back_arrow' className="w-4"/>
        </div>
        <div className="flex flex-col items-center py-4 px-3 gap-4 cursor-pointer" onClick={()=>setShowProfile(true)}>
          {pfp? <Image src={pfp} alt='their_pfp' width={50} height={50} className="object-contain h-[120px] w-auto"/> : null}
          <div className="flex flex-col gap-2">
            <p className="text-xl">{`${name} | ${age}${sex}`}</p>
            <RetroButton text={`score: ${score}fp`} icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass="bg-retro_orange"/>
          </div>
        </div>
        <div className="hobbies flex">
          {hobbies.map((hobby)=>(
            <RetroButton text={hobby} icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass=""/>
          ))}
        </div>
        <div className="socials mt-20">
          <div className="text-2xl text-center p-5">Socials</div>
          <div className="buttons flex flex-col items-center gap-3">
            {socials.map((social)=>(
              <Link target="_blank" href={social.link}>
                <RetroButton text={social.name} icon={`icons/${social.name.toLowerCase()}.svg`} msgNo={0} isActive={false} extraClass="bg-retro_orange" onClick={()=>{}}></RetroButton>
              </Link>
            ))}
          </div>
        </div>
        <div className="danger_zone flex mt-10">
          <RetroButton text='Block' icon={null} msgNo={0} isActive={false} extraClass="bg-retro_red text-white" onClick={()=>{}}></RetroButton>
          <RetroButton text='Report' icon={null} msgNo={0} isActive={false} extraClass="bg-primary text-white" onClick={()=>{}}></RetroButton>
        </div>
      </div>
    )
  }


  return (
    <div className="flex flex-col w-screen overflow-hidden">
      <div className="h-[3px] bg-retro_border w-full"></div>
      <div className="flex h-full w-screen">
        <div className="contacts hidden md:block md:w-[30vw] lg:w-[25vw]">
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
        <div className="chat w-full flex flex-col border-x-3 border-retro_border relative">
          <div className="flex items-center border-b-3 border-retro_border w-full py-2 px-3 gap-4 cursor-pointer" onClick={()=>setShowProfile(true)}>
            {pfp? <Image src={pfp} alt='their_pfp' width={20} height={20} className="object-contain h-full w-auto"/> : null}
            <div className="flex flex-col">
              <p className="text-xl">{name}</p>
              <p>{lastOnlineMsg}</p>
            </div>
          </div>
          <div className="group h-[72vh] overflow-y-scroll scrollbar-thin scrollbar-thumb-secondary scrollbar-track-transparent transition-all duration-300 px-5 flex flex-col-reverse">
            <div className="flex flex-col">
            {messages.map((message)=>(
              <Message key={message.id} message={message} pfp={pfp}/>
            ))}
            </div>
          </div>
          <div className="bottom-0 self-center">
          <div className="flex justify-center items-center py-2 px-5 font-poppins">
              <EmojiButtonPicker
                  onChange={setInputValue}
                  inputRef={inputRef} // Pass the input ref to the EmojiButtonPicker
              />
            <div className="flex items-center gap-3 rounded-full bg-primary/30 lg:w-[50vw] ">
                <input
                    type="text"
                    ref={inputRef} // Assign the ref to the input
                    className="flex-grow p-3 rounded-lg text-base outline-none"
                    placeholder="Type something..."
                    value={InputValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                />
                <img src="/icons/send_icon.png" alt="" />
            </div>
        </div>
          </div>
        </div>
        {showProfile && profile()}
      </div>
    </div>
  )
}

export default page