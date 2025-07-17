'use client'
import { useState, useRef } from "react";
import Contact from "@/components/Chat_Components/Contact"
import Message from "@/components/Chat_Components/Message";
import EmojiButtonPicker from "@/components/Chat_Components/EmojiButton";
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
      ]
    }
  };
  const messages=res2.data.messages;

  const res3={
    data:{
      name:'Muhsina',
      lastOnline:137,
      pfp:'/avatars/female_avatar.png'
    }
  }

  const name=res3.data.name;
  const lastOnlineMins=res3.data.lastOnline;
  const lastOnlineMsg=`Last online ${lastOnlineMins>=60?`${Math.floor(lastOnlineMins/60)} hours `:''}${lastOnlineMins>=60&&lastOnlineMins%60!=0?'and ':''} ${lastOnlineMins%60!=0?`${lastOnlineMins%60} mins`:''} ago`;
  const theirPfp=res3.data.pfp;
  const [InputValue, setInputValue] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null); 

  return (
    <div className="flex flex-col w-screen overflow-hidden">
      <div className="h-[3px] bg-retro_border w-full"></div>
      <div className="flex h-full w-screen">
        <div className="contacts md:w-[30vw] lg:w-[25vw]">
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
          <div className="flex items-center border-b-3 border-retro_border w-full py-2 px-3 gap-4">
            {theirPfp? <Image src={theirPfp} alt='their_pfp' width={20} height={20} className="object-contain h-full w-auto"/> : null}
            <div className="flex flex-col">
              <p className="text-xl">{name}</p>
              <p>{lastOnlineMsg}</p>
            </div>
          </div>
          <div className="flex flex-col-reverse px-5 h-[70vh] overflow-y-scroll">
            <div className="flex flex-col">
            {messages.map((message)=>(
              <Message key={message.id} message={message} pfp={theirPfp}/>
            ))}
            </div>
          </div>
          <div className="bottom-0 self-center">
          <div className="flex justify-center items-center p-5 font-poppins">
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
      </div>
    </div>
  )
}

export default page