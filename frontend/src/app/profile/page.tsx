import Image from "next/image";
import Usercard from "@/components/Usercard";
import RetroButton from "@/components/retroButton";
import YourActivity from "@/components/yourActivity";
import QuestionCard from "@/components/questionCard";
import Link from "next/link";
import Settings from "@/components/settings";
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
                social_links: [{ name: "Instagram", link: "https://www.instagram.com/ibinujaleel/" }, { name: "Whatsapp", link: "https://wa.me/919876543210" }, { name: "Github", link: "https://github.com/ibinujaleel" }],
                topQuestions: [
                    { id: 1, question: "What is your favorite movie?", options: [{ option: "The Dark Knight", value: 1, isSelected: true }, { option: "The Dark Knight Rises", value: 2, isSelected: false }, { option: "The Dark Knight Returns", value: 3, isSelected: false }] },
                    { id: 2, question: "What is your favorite food?", options: [{ option: "Pizza", value: 1, isSelected: false }, { option: "Burger", value: 2, isSelected: true }, { option: "Pasta", value: 3, isSelected: false }] },
                    { id: 3, question: "What is your favorite color?", options: [{ option: "Blue", value: 1, isSelected: true }, { option: "Red", value: 2, isSelected: false }, { option: "Green", value: 3, isSelected: false }] },
                    { id: 4, question: "What is your favorite sport?", options: [{ option: "Cricket", value: 1, isSelected: true }, { option: "Football", value: 2, isSelected: false }, { option: "Basketball", value: 3, isSelected: false }] },
                    { id: 5, question: "What is your favorite hobby?", options: [{ option: "Coding", value: 1, isSelected: true }, { option: "Reading", value: 2, isSelected: false }, { option: "Gaming", value: 3, isSelected: false }] }
                ]
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
            <div className="lhs w-full lg:w-[65vw] px-5 max-sm:px-0! pb-5 flex flex-col gap-5 items-center border-t-3 lg:border-3 border-r-0! border-retro_border">
                <div className={`relative font-poppins flex flex-col w-full justify-between md:flex-row gap-3 items-center text-secondary pt-5`}>
                    <div className="w-full flex justify-center items-center min-w-[80px] min-h-[80px] max-w-[120px] max-h-[120px]">
                        <Image src='/3d_avatar_6.png' alt={`${user.name}_pfp`} width={120} height={120} className="w-full h-full object-contain" />
                    </div>
                    <div className="userInfo w-full flex flex-col gap-2 mb-2 md:mb-0">
                        <div className="intro_title font-semibold text-[22px] max-md:text-center">
                            {user.name} | {user.age}{user.gender}
                        </div>
                        <div className="Hobbies flex gap-2 lg:gap-3 text-secondary flex-wrap max-md:justify-center ">
                            {user.hobbies.map((hobby, index) => (
                                <RetroButton key={index} text={hobby} icon={null} onClick={() => { }} isActive={false} msgNo={0} extraClass="mx-0!" />
                            ))}
                            <RetroButton text="Edit tags" icon="/icons/edit_ic.svg" onClick={() => { }} isActive={true} msgNo={0} extraClass="mx-0! max-md:hidden!" />
                        </div>
                    </div>
                    <div className="md:absolute right-0 top-0 btns flex w-fit py-10 max-md:py-0! items-start gap-4 text-secondary">
                        <RetroButton text={`Share profile`} icon="/icons/share.svg" onClick={() => { }} isActive={false} msgNo={0} extraClass="mx-0! bg-retro_orange md:hidden!" />
                        <Link href={`/profile/${user.id}`}>
                            <RetroButton text="Edit profile" icon={"/icons/edit_ic.svg"} onClick={() => { }} isActive={true} msgNo={0} extraClass="mx-0! w-full md:hidden!" />
                        </Link>
                    </div>
                </div>

                <div className="text-secondary text-[22px] text-left w-full flex flex-col gap-3 items-center">
                    <div className="flex flex-row justify-between w-full">
                        About me
                        <RetroButton text="Edit details" icon="/icons/edit_ic.svg" onClick={() => { }} isActive={true} msgNo={0} extraClass="mx-0! max-md:hidden!" />
                    </div>
                    <div className="desc text-[16px] text-left w-full px-4 text-justify!">
                        {user.desc}
                    </div>
                </div>

                <div className="w-full flex flex-row flex-wrap gap-2 justify-around items-center">
                    <Link target="_blank" href={user.social_links[0].link}><RetroButton text={`Instagram`} icon="/icons/instagram.svg" onClick={() => { }} isActive={false} msgNo={0} extraClass="mx-0! bg-retro_orange" /></Link>
                    <Link target="_blank" href={user.social_links[1].link}><RetroButton text={`Whatsapp`} icon="/icons/whatsapp.svg" onClick={() => { }} isActive={false} msgNo={0} extraClass="mx-0! bg-retro_orange" /></Link>
                    <Link target="_blank" href={user.social_links[2].link}><RetroButton text={`Github`} icon="/icons/github.svg" onClick={() => { }} isActive={false} msgNo={0} extraClass="mx-0! bg-retro_orange" /></Link>
                </div>

                <div className="text-secondary text-[22px] text-left w-full flex flex-col gap-1">
                    <div className="">
                        Your Questions
                    </div>
                    <div className="text-base flex flex-col gap-2 px-4">
                        {user.topQuestions.map((question, index) => (
                            <QuestionCard key={index} question={question} />
                        ))}
                    </div>
                </div>

            </div>
            <div className="hidden lg:block bg-retro_border w-1"></div>
            <div className="rhs hidden lg:flex lg:w-[35vw] h-fit">
                <Settings />
            </div>
        </div>
    );
}
