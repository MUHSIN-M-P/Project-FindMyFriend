"use client";

import { useState } from "react";
import { validateRoomCode, normalizeRoomCode } from "@/utils/roomCode";
import RetroButton from "@/components/retroButton";

interface JoinRoomModalProps {
    isVisible: boolean;
    onClose: () => void;
    onJoinRoom: (roomCode: string) => void;
}

export default function JoinRoomModal({
    isVisible,
    onClose,
    onJoinRoom,
}: JoinRoomModalProps) {
    const [roomCode, setRoomCode] = useState("");
    const [error, setError] = useState("");
    const [isValidating, setIsValidating] = useState(false);

    if (!isVisible) return null;

    const handleJoinRoom = async () => {
        const code = normalizeRoomCode(roomCode);

        if (!code) {
            setError("Please enter a room code");
            return;
        }

        setIsValidating(true);
        setError("");

        try {
            // Validate with backend (checks format and existence)
            const validation = await validateRoomCode(code);

            if (!validation.valid) {
                setError(validation.error || "Invalid room code format");
                return;
            }

            if (!validation.exists) {
                setError(
                    "Room not found. Please check the code and try again.",
                );
                return;
            }

            // Join room with normalized code
            onJoinRoom(validation.normalized);
            onClose();
            setRoomCode("");
            setError("");
        } catch (err) {
            console.error("Room validation failed:", err);
            setError("Failed to validate room code. Please try again.");
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "");
        setRoomCode(value);
        setError("");
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-background w-full max-w-md rounded-xl border-3 border-retro_border p-6 font-poppins">
                <h2 className="text-2xl font-bold mb-4">Join Private Room</h2>

                <p className="text-sm text-gray-600 mb-4">
                    Enter the 6-character room code shared with you to join an
                    encrypted chat.
                </p>

                <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">
                        Room Code
                    </label>
                    <input
                        type="text"
                        value={roomCode}
                        onChange={handleCodeChange}
                        placeholder="ABC-123 or ABC123"
                        maxLength={7}
                        disabled={isValidating}
                        className="w-full px-4 py-3 text-center text-2xl font-mono font-bold tracking-wider border-2 border-retro_border rounded-lg focus:outline-none focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {error && (
                        <p className="text-red-500 text-sm mt-2">{error}</p>
                    )}
                    {isValidating && (
                        <p className="text-blue-500 text-sm mt-2 animate-pulse">
                            Validating room...
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <RetroButton
                        text="Cancel"
                        icon={null}
                        onClick={() => {
                            onClose();
                            setRoomCode("");
                            setError("");
                        }}
                        isActive={false}
                        msgNo={0}
                        extraClass="flex-1 bg-gray-200"
                    />
                    <RetroButton
                        text={isValidating ? "Validating..." : "Join Room"}
                        icon={null}
                        onClick={handleJoinRoom}
                        isActive={!isValidating}
                        msgNo={0}
                        extraClass="flex-1 bg-primary text-white disabled:opacity-50"
                    />
                </div>
            </div>
        </div>
    );
}
