"use client"
import RetroButton from "./retroButton"
import { useState } from "react"
interface questionProps {
    id: string, // Unique id 
    question: string,
    options: { option: string, value: number }[], // 3 hobbies
}

interface props {
    question: questionProps
}

const QuestionCard = ({ question }: props) => {
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    return (
        <div className={`px-2 md:px-5 py-6 lg:px-7 lg:py-8 font-poppins rounded-3xl shadow-3 flex flex-col w-full justify-between md:flex-row gap-3 items-start md:items-center text-secondary`}>
            <div className="flex flex-col w-full gap-4">
                <div className="text-xl font-medium">Qn. {question.question}</div>
                <div className="flex flex-col w-full gap-4 max-md:gap-2">
                    {question.options.map((option, index) => (
                        <div className="flex gap-2 items-start px-3" key={index} onClick={() => setSelectedOption(option.value)}>
                            <div className="grid place-items-center mt-1" >
                                <input type="radio" name={question.id + "-" + option.value.toString()} value={(selectedOption==option.value).toString()}
                                    className={`
                                    col-start-1 row-start-1
                                    appearance-none shrink-0
                                    w-4 h-4 border-2 rounded-full ${(selectedOption==option.value) ? "border-primary" : "border-secondary"}
                                    `}
                                />
                                <div
                                    className={`
                                col-start-1 row-start-1
                                w-2 h-2 rounded-full bg-primary ${selectedOption==option.value ? "opacity-100" : "opacity-0"}`}
                                />
                            </div>
                            <label htmlFor={question.id + "-" + option.value.toString()}
                                className="text-start">{option.option}
                            </label>
                        </div>
                    ))}
                </div>
                <div className="flex justify-end">
                    <RetroButton text="Submit answer" icon={null} onClick={() => {}} isActive={true} msgNo={0} extraClass={""} />
                </div>
            </div>
        </div>
    )
}

export default QuestionCard