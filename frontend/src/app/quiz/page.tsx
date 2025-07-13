import Image from "next/image";
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import QuestionCard from "@/components/questionCard";
import BottomBar from "@/components/bottomBar";
export default function Home() {
  const res={
    data:{
      questions:[
        {
          id:"001",
          question:"How do you prefer to spend your ideal weekend??",
          options:[{option:"A mix of social time and quiet alone time", value:1}, {option:"A day of socializing with friends", value:2}, {option:"A day of doing something active", value:3}, {option:"A day of relaxing and doing nothing", value:4}, {option:"A day of learning something new", value:5}],
        },
        {
          id:"002",
          question:"What is your favorite color?",
          options:[{option:"Red", value:1}, {option:"Blue", value:2}, {option:"Green", value:3}, {option:"Yellow", value:4}, {option:"Orange", value:5}, {option:"Purple", value:6}],
        },
        {
          id:"003",
          question:"What is your favorite color?",
          options:[{option:"Red", value:1}, {option:"Blue", value:2}, {option:"Green", value:3}],
        }
    ]
    }
  }
  const questions=res.data.questions;

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
    <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
      <div className="lhs w-full lg:w-[65vw] flex flex-col items-center lg:pr-20 border-t-3 border-retro_border">
          <div className="flex flex-col w-full items-center gap-5 mt-10">
              {questions.map((question,index)=>(
                <QuestionCard key={index} question={question}/>
              ))}
          </div>
      </div>
      <div className="hidden lg:block bg-retro_border w-1"></div>
      <div className="rhs hidden lg:flex lg:w-[35vw] h-fit">
          <YourActivity notifications={notifications}/>
      </div>
      <BottomBar/>
    </div> 
  );
}
