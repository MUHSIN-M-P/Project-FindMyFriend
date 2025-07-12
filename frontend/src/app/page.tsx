import Image from "next/image";
import search_icon from '../../public/search_icon.svg'
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
export default function Home() {
  const res={
    data:{
      users:[
        {
          id:"001",
          name:"Ibinu Jaleel",
          age:19,
          gender:"M",
          hobbies:["Movies", "Eating", "Coding"],
          desc:"I’m one of those guys who lives to see movies. Not introvert, nor extrovert either. I was th...",
          pfp_path:"frontend/public/3d_avatar_6.png",
          score:19,
          bestMatch:true
        },
        {
          id:"002",
          name:"Ibinu Jaleel",
          age:19,
          gender:"M",
          hobbies:["Movies", "Eating", "Coding"],
          desc:"I’m one of those guys who lives to see movies. Not introvert, nor extrovert either. I was th...",
          pfp_path:"frontend/public/3d_avatar_6.png",
          score:18,
          bestMatch:false
        }
    ]
    }
  }
  const users=res.data.users;

  const notifications_res={
    data:{
      notifications:[
        {
          type:"question_no",
          no:29
        },
        {
          type:"req_accepted",
          name:"Sidsity"
        },
        {
          type:"new_friends",
          no:25
        },
        {
          type:"req_accepted",
          name:"Adolf Hitler"
        },
        {
          type:"req_accepted",
          name:"Muhsina"
        },
      ]
    }
  }
  const notifications=notifications_res.data.notifications;
  return (
    <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-10 xl:px-20">
      <div className="lhs w-full lg:w-[65vw] flex flex-col items-center pr-20 border-t-3 border-secondary">
          <div className="searchBar py-5 w-full flex items-center gap-2 md:gap-5 mb-3">
            <div className="search_boundary w-full shadow-2 flex items-center text-xl gap-4 rounded-xl h-[3rem] p-3 px-6">
              <Image src={search_icon} alt='magnifying glass' className="object-cover w-5"/>
              <input type="text" placeholder="Search" className="border-0 w-full h-7 focus:outline-0 text-sm tracking-wide"/>
            </div>
            <RetroButton text="Advanced Search" icon={null} onClick={()=>{}} isActive={true} msgNo={0} extraClass="h-full w-fit text-nowrap" />
          </div>
          <div className="flex flex-col w-full items-center gap-[28px]">
            {users.map((user)=>(
              <Usercard key={user.id} user={user}/>
            ))}
          </div>
      </div>
      <div className="hidden lg:block bg-secondary w-1"></div>
      <div className="rhs hidden lg:flex lg:w-[35vw] h-fit border-r-2 border-b-2">
          <div className="content flex flex-col items-center w-full">
              <div className="bg-secondary w-full h-[3px]"></div>
              <div className="flex justify-center items-center title w-full text-4xl text-secondary py-5">
                Your Activity
              </div>
              <div className="w-full max-w-[30vw] bg-secondary h-[3px]"></div>
              <div className="py-3">
                {notifications.map((notification)=>{
                  if(notification.type=="question_no")
                    return(
                      <div className="flex items-center gap-2 p-3 text-xl">
                      <img src="/icons/pen_icon.png" alt="pen" />
                      <p>{`You have ${notification.no} more questions to answer`}</p>
                      </div> 
                    )
                  else if(notification.type=='req_accepted')
                    return(
                      <div className="flex items-center gap-2 p-3 text-xl">
                      <img src="/icons/heart_icon.png" alt="pen" />
                      <p>{`${notification.name} accepted your message request`}</p>
                      </div> 
                    )
                  else if(notification.type=='new_friends')
                    return(
                      <div className="flex items-center gap-2 p-3 text-xl">
                      <img src="/icons/ppl_icon.png" alt="pen" />
                      <p>{`You have ${notification.no} new friends`}</p>
                      </div> 
                    )
                })}
              </div>
          </div>
      </div>
    </div> 
  );
}
