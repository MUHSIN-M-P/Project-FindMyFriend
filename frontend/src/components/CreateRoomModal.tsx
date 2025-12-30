"use client";

import { useState } from "react";
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
    const [roomCode] = useState(() => generateRoomCode());
    const [copied, setCopied] = useState(false);

    if (!isVisible) return null;

    const handleCopyCode = () => {
        navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleCreateRoom = () => {
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

                <div className="bg-gray-100 rounded-lg p-4 mb-4 text-center">
                    <p className="text-xs text-gray-500 mb-2">Room Code</p>
                    <p className="text-3xl font-bold tracking-wider font-mono">
                        {formatRoomCode(roomCode)}
                    </p>
                </div>

                <button
                    onClick={handleCopyCode}
                    className="w-full mb-4 py-2 px-4 rounded-lg border-2 border-retro_border bg-primary/10 hover:bg-primary/20 transition-colors"
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
                        isActive={false}
                        msgNo={0}
                        extraClass="flex-1 bg-primary text-white"
                    />
                </div>
            </div>
        </div>
    );
}
