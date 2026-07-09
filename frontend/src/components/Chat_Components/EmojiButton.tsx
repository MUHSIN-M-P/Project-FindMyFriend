'use client'
import React, { useState, useEffect, useRef } from 'react';

// Define the types for the component's props
interface EmojiButtonPickerProps {
    onChange: (newValue: string) => void; // Function to call when the input value changes
    inputRef: React.RefObject<HTMLInputElement | null>; // Ref to the associated input element
}

// EmojiButtonPicker Component
const EmojiButtonPicker: React.FC<EmojiButtonPickerProps> = ({ onChange, inputRef }) => {
    // State to manage the visibility of the emoji picker
    const [showEmojiPicker, setShowEmojiPicker] = useState<boolean>(false);

    // Refs for the emoji picker and button to handle click outside logic
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    const emojiButtonRef = useRef<HTMLButtonElement>(null);

    // Array of common emojis
    const emojis: string[] = [
        '😀', '😇', '😂', '🤣', '😊', '🥳', '😎',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
        '😋', '😛', '😜', '🤪', '😝', '🤗', '🤭', '🤫', '🤔', '🤐',
        '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥', '😌',
        '😔', '😟', '😠', '😡', '🤬', '😤', '😢', '😭', '😩', '😫',
        '🥺', '😮', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤫',
        '🥳', '😎', '🤩', '🥳', '🤯', '🤯', '😵', '🤪', '😵‍💫', '🥴',
        '👍', '👎', '👏', '🙌', '🙏', '💪', '🔥', '✨', '🎉', '🎊',
        '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
        '🍎', '🍊', '🍓', '🍕', '🍔', '🍟', '🍦', '🍩', '☕', '🍵',
        '⚽', '🏀', '🏈', '⚾', '🎾', '🏐', '🎮', '🎲', '🧩', '🎵',
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '💔',
        '💯', '💡', '🌟', '🚀', '🌈', '☀️', '🌙', '⭐', '🌸', '🌼',
        '🌲', '🌳', '🌵', '🌊', '💧', '☔', '⚡', '❄️', '☃️', '🔥',
        '🚗', '🚕', '🚙', '🚌', '🚆', '🚇', '🚄', '✈️', '🚁', '🚢',
        '⌚', '📱', '💻', '🖥️', '⌨️', '🖱️', '🖨️', '📷', '📸', '📹',
        '🎤', '🎧', '🎸', '🎹', '🥁', '🎺', '🎻', '🎷', '🎶', '🎼'
    ];

    // Effect to handle clicking outside the emoji picker to close it
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If the emoji picker is open and the click is outside the picker and the emoji button
            if (
                emojiPickerRef.current &&
                !emojiPickerRef.current.contains(event.target as Node) &&
                showEmojiPicker &&
                // Also check if the click was not on the emoji button itself
                !emojiButtonRef.current?.contains(event.target as Node)
            ) {
                setShowEmojiPicker(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]); // Re-run effect when showEmojiPicker changes

    // Function to insert a specific emoji into the associated input field
    const insertEmoji = (emoji: string) => {
        const input = inputRef?.current;
        if (!input) return; // Guard against null ref

        const start = input.selectionStart;
        const end = input.selectionEnd;
        const currentMessage = input.value;

        // Create the new value with the emoji inserted
        const newValue = currentMessage.substring(0, start!) + emoji + currentMessage.substring(end!, currentMessage.length);

        // Call the onChange prop to update the parent's state
        onChange(newValue);

        // After state update, set the cursor position
        // This needs to be done after the DOM potentially re-renders.
        setTimeout(() => {
            if (input) {
                input.selectionStart = input.selectionEnd = (start || 0) + emoji.length;
                input.focus(); // Keep focus on the input field
            }
        }, 0);
    };

    return (
        <div className="relative">
            <button
                ref={emojiButtonRef}
                onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                className="text-white p-3 rounded-lg text-xl cursor-pointer border-none flex items-center justify-center transition-all duration-100 hover:shadow-lg"
                aria-label="Toggle emoji picker"
            >
                <img src="/icons/emoji_icon.svg" alt="" />
            </button>

            {/* Emoji Picker Container */}
            {showEmojiPicker && (
                <div
                    ref={emojiPickerRef}
                    // Crucial: Use max-content width to allow grid to determine its natural width
                    // THEN, apply max-width to constrain that natural width without causing overflow.
                    // Adjusted grid columns to work with gap-10 and prevent overflow at smaller widths.
                    className="absolute bottom-full left-0 mb-3 bg-white rounded-xl shadow-xl py-3 pl-5 pr-10
                                grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7
                                gap-9 max-h-[250px] overflow-y-auto z-10 border border-gray-200"
                    style={{ maxWidth: 'min(95vw, 500px)' }} // Increased maxWidth slightly for potentially more columns
                >
                    {emojis.map((emoji: string, index: number) => (
                        <span
                            key={index}
                            className="text-2xl cursor-pointer text-center rounded-md hover:bg-gray-100 transition-colors duration-100"
                            onClick={() => insertEmoji(emoji)}
                        >
                            {emoji}
                        </span>
                    ))}
                </div>
            )}
        </div>
    );
};

export default EmojiButtonPicker;