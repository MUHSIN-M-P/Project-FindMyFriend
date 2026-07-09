"use client";

import { useState, useEffect } from "react";
import { generateRoomCode, formatRoomCode } from "@/utils/roomCode";
import RetroButton from "@/components/retroButton";

interface CreateRoomModalProps {
    isVisible: boolean;
    onClose: () => void;
    onCreateRoom: (roomCode: string) => void;
}

export default function CreateRoomModal({
    isVisible,
    onClose,
    onCreateRoom,
}: CreateRoomModalProps) {
    const [roomCode, setRoomCode] = useState<string>("");
    const [copied, setCopied] = useState(false);
    const [isGenerating, setIsGenerating] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Generate room code from backend when modal opens
    useEffect(() => {
        if (isVisible && !roomCode) {
            generateCodeFromBackend();
        }
    }, [isVisible]);

    const generateCodeFromBackend = async () => {
        setIsGenerating(true);
        setError(null);

        try {
            // Backend generates unique code (no collisions)
            const code = await generateRoomCode();
            setRoomCode(code);
        } catch (err) {
            console.error("Failed to generate room code:", err);
            setError("Failed to generate room code. Please try again.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!isVisible) return null;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateRoom = () => {
        if (!roomCode) return;
        onCreateRoom(roomCode);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-background w-full max-w-md rounded-xl border-3 border-retro_border p-6 font-poppins">
                <h2 className="text-2xl font-bold mb-4">Create Private Room</h2>

                <p className="text-sm text-gray-600 mb-4">
                    Share this code with someone to start a private, encrypted
                    chat. The room will expire in 5 minutes after the second
                    person joins.
                </p>

                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                        {error}
                        <button
                            onClick={generateCodeFromBackend}
                            className="ml-2 underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="bg-gray-100 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Room Code</p>
                    {isGenerating ? (
                        <p className="text-xl text-gray-400 animate-pulse">
                            Generating...
                        </p>
                    ) : (
                        <p className="text-3xl font-bold tracking-wider font-mono">
                            {formatRoomCode(roomCode)}
                        </p>
                    )}
                </div>

                <button
                    onClick={handleCopyCode}
                    disabled={isGenerating || !roomCode}
                    className="w-full mb-4 py-2 px-4 rounded-lg border-2 border-retro_border bg-primary/10 hover:bg-primary/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {copied ? "✓ Copied!" : "📋 Copy Code"}
                </button>

                <div className="flex gap-3">
                    <RetroButton
                        text="Cancel"
                        icon={null}
                        onClick={onClose}
                        isActive={false}
                        msgNo={0}
                        extraClass="flex-1 bg-gray-200"
                    />
                    <RetroButton
                        text="Create Room"
                        icon={null}
                        onClick={handleCreateRoom}
                        isActive={!isGenerating && !!roomCode}
                        msgNo={0}
                        extraClass="flex-1 bg-primary text-white disabled:opacity-50"
                    />
                </div>
            </div>
        </div>
    );
}
