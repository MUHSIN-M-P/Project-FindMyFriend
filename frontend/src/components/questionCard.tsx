"use client"
import RetroButton from "./retroButton"
import { useState } from "react"
import { usePathname } from "next/navigation"
interface questionProps {
    id: number, // Unique id 
    question: string,
    options: { option: string, value: number, isSelected: boolean }[], // 3 hobbies
}

interface props {
    question: questionProps
}

const QuestionCard = ({ question }: props) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const pathname = usePathname();
    const isProfile = pathname === "/profile";
    const [expanded, setExpanded] = useState(false);
    const handleButtonClick = () => {
        if (isProfile) {
            if (expanded) {
                // Submit logic here
                setExpanded(false);
            } else {
                // Edit mode - expand to show all options
                setExpanded(true);
            }
        } else {
            // Non-profile page - submit answer
            setExpanded(true);
            // Add your submit logic here
        };
    };

    return (
        <div className={`px-2 md:px-5 py-5 lg:px-7 lg:py-5 font-poppins rounded-3xl shadow-3 flex flex-col w-full justify-between md:flex-row gap-3 items-start md:items-center text-secondary`}>
            <div className="flex flex-col w-full gap-4">
                <div className="text-xl font-medium">Qn. {question.question}</div>
                <div className="flex flex-col w-full gap-4 max-md:gap-2">
                    {question.options.map((option, index) => (
                        <div className={`flex gap-2 items-start px-3 ${!isProfile || (option.isSelected || expanded) ? "" : "hidden"}`} key={index} onClick={() => setSelectedOption(option.value)}>
                            <div className="grid place-items-center mt-1" >
                                <input type="radio" name={question.id + "-" + option.value.toString()} value={(option.isSelected).toString()}
                                    className={`
                                    col-start-1 row-start-1
                                    appearance-none shrink-0
                                    w-4 h-4 border-2 rounded-full ${(selectedOption!=null ? selectedOption === option.value : option.isSelected) ? "border-primary" : "border-secondary"}
                                    `}
                                />
                                <div
                                    className={`
                                col-start-1 row-start-1
                                w-2 h-2 rounded-full bg-primary ${(selectedOption!=null ? selectedOption === option.value : option.isSelected) ? "opacity-100" : "opacity-0"}`}
                                />
                            </div>
                            <label htmlFor={question.id + "-" + option.value.toString()}
                                className="text-start">{option.option}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end" onClick={handleButtonClick}>
                    <RetroButton text={isProfile ? (expanded ? "Submit" : "Edit answer") : "Submit answer"} icon={null} onClick={handleButtonClick} isActive={true} msgNo={0} extraClass={""} />
                </div>
            </div>
        </div>
    )
}

export default QuestionCard