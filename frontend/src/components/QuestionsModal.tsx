"use client";
import { useState } from "react";
import { FiX, FiChevronRight } from "react-icons/fi";
import { apiPost } from "@/utils/api";

interface QuestionOption {
    option: string;
    value: number;
}

interface Question {
    id: number;
    question: string;
    options: QuestionOption[];
}

interface QuestionsModalProps {
    isOpen: boolean;
    onClose: () => void;
    questions: Question[];
}

export default function QuestionsModal({
    isOpen,
    onClose,
    questions,
}: QuestionsModalProps) {
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [answers, setAnswers] = useState<{ [key: number]: number }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const currentQuestion = questions[currentQuestionIndex];
    const selectedAnswer = answers[currentQuestion.id];
    const isLastQuestion = currentQuestionIndex === questions.length - 1;

    const handleNext = () => {
        if (isLastQuestion) {
            void handleSubmit();
            return;
        }

        setCurrentQuestionIndex((prev) => prev + 1);
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const response = await apiPost("/api/quiz/answers", { answers });
            if (response.error) {
                console.error("Failed to save quiz answers:", response.error);
            }
        } finally {
            setIsSubmitting(false);
            handleClose();
        }
    };

    const handleClose = () => {
        setCurrentQuestionIndex(0);
        setAnswers({});
        onClose();
    };

    const handleSelectOption = (value: number) => {
        setAnswers((prev) => ({
            ...prev,
            [currentQuestion.id]: value,
        }));
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="relative bg-background border-4 border-retro_border rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-background border-b-3 border-retro_border px-6 py-5 flex justify-between items-center">
                    <div className="flex flex-col gap-1">
                        <h2 className="text-2xl font-semibold text-secondary font-poppins">
                            Express Your Interests
                        </h2>
                        <p className="text-sm text-secondary/70">
                            Question {currentQuestionIndex + 1} of{" "}
                            {questions.length}
                        </p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-retro_orange/20 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <FiX className="w-6 h-6 text-secondary" />
                    </button>
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-retro_border/30">
                    <div
                        className="h-full bg-primary transition-all duration-300"
                        style={{
                            width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`,
                        }}
                    />
                </div>

                {/* Content */}
                <div className="p-8">
                    <div className="mb-8">
                        <h3 className="text-xl font-medium text-secondary mb-6 font-poppins">
                            {currentQuestion.question}
                        </h3>

                        <div className="flex flex-col gap-3">
                            {currentQuestion.options.map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() =>
                                        handleSelectOption(option.value)
                                    }
                                    className={`
                                        group relative p-4 rounded-xl border-2 text-left transition-all duration-200
                                        ${
                                            selectedAnswer === option.value
                                                ? "border-primary bg-primary/10 shadow-md"
                                                : "border-retro_border hover:border-primary/50 hover:bg-primary/5"
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="relative flex items-center justify-center">
                                            <div
                                                className={`
                                                w-5 h-5 rounded-full border-2 transition-all
                                                ${
                                                    selectedAnswer ===
                                                    option.value
                                                        ? "border-primary"
                                                        : "border-secondary group-hover:border-primary/50"
                                                }
                                            `}
                                            />
                                            <div
                                                className={`
                                                absolute w-3 h-3 rounded-full bg-primary transition-all
                                                ${
                                                    selectedAnswer ===
                                                    option.value
                                                        ? "scale-100"
                                                        : "scale-0"
                                                }
                                            `}
                                            />
                                        </div>
                                        <span className="text-secondary font-poppins">
                                            {option.option}
                                        </span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-background border-t-3 border-retro_border px-8 py-5 flex justify-between items-center gap-4">
                    <button
                        onClick={handleClose}
                        className="px-6 py-3 rounded-lg border-2 border-retro_border bg-background text-secondary font-semibold font-poppins hover:bg-retro_orange/20 transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={selectedAnswer === undefined || isSubmitting}
                        className={`
                            px-6 py-3 rounded-lg font-semibold font-poppins flex items-center gap-2 transition-all
                            ${
                                selectedAnswer !== undefined && !isSubmitting
                                    ? "bg-primary text-white hover:bg-primary/90 shadow-button"
                                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                            }
                        `}
                    >
                        {isLastQuestion
                            ? isSubmitting
                                ? "Submitting..."
                                : "Submit"
                            : "Next"}
                        {!isLastQuestion && (
                            <FiChevronRight className="w-5 h-5" />
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
