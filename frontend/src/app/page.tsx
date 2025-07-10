import Image from "next/image";
import search_icon from '../../public/search_icon.svg'
import Usercard from "@/components/Usercard";
export default function Home() {
  const res={
    data:{
      users:[
        {
          id:"001",
          name:"Ibinu",
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
          name:"Ibinu",
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
  return (
    <div className="flex h-full ">
      <div className="lhs lg:w-[65vw] flex flex-col items-center">
          <div className="searchBar p-5 flex items-center gap-5">
            <div className="search_boundary shadow-2 flex items-center text-xl gap-4 rounded-lg w-[40vw] h-[3rem] p-3">
              <Image src={search_icon} alt='magnifying glass' className="object-cover w-5"/>
              <input type="text" placeholder="Search" className="border-0 w-full h-7 focus:outline-0"/>
            </div>
            <button className="shadow-button bg-primary rounded-sm py-2 px-3 font-semibold text-white text-lg">
              Advanced Search
            </button>
          </div>
          <div className="flex flex-col gap-[28px]">
            {users.map((user)=>(
              <Usercard key={user.id} user={user}/>
            ))}
          </div>
      </div>
      <div className="bg-secondary w-1"></div>
      <div className="rhs lg:w-[35vw]">
            
      </div>
    </div> 
  );
}
