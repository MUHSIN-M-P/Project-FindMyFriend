import Image from "next/image";
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import QuestionCard from "@/components/questionCard";
import BottomBar from "@/components/bottomBar";
import Link from "next/link";
export default function Home() {
  const res = {
    data: {
      user:
      {
        id: "1",
        name: "Ibinu Jaleel",
        age: 19,
        gender: "M",
        hobbies: ["Movies", "Eating", "Coding"],
        desc: `I'm one of those guys who lives to see movies - not because I'm hiding from the world, but because I genuinely love getting lost in great storytelling. I fall somewhere in that comfortable middle ground between introvert and extrovert, which means I'm equally happy having deep conversations over coffee or enjoying a quiet night in with a classic film. I think the best connections happen when you can appreciate both the energy of going out and the intimacy of staying in.`,
        pfp_path: "frontend/public/3d_avatar_6.png",
        score: 19,
        bestMatch: true,
        social_links: [{name: "Instagram", link: "https://www.instagram.com/ibinujaleel/"}, {name: "Whatsapp", link: "https://wa.me/919876543210"}, {name: "Github", link: "https://github.com/ibinujaleel"}],
        topQuestions: [{question: "What is your favorite movie?", answer: "The Dark Knight"}, {question: "What is your favorite food?", answer: "Pizza"}, {question: "What is your favorite color?", answer: "Blue"}, {question: "What is your favorite sport?", answer: "Cricket"}, {question: "What is your favorite hobby?", answer: "Coding"}]
      }
    }
  }
  const user = res.data.user;

  const notifications_res = {
    data: {
      notifications: [
        {
          type: "question_no",
          no: 29
        },
        {
          type: "req_accepted",
          name: "Sidsity"
        },
        {
          type: "new_friends",
          no: 25
        },
        {
          type: "req_accepted",
          name: "Adolf Hitler"
        },
        {
          type: "req_accepted",
          name: "Muhsina"
        },
      ]
    }
  }
  const notifications = notifications_res.data.notifications;
  return (
    <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
      <YourActivity notifications={notifications}/>
      <BottomBar />
    </div>
  );
}
