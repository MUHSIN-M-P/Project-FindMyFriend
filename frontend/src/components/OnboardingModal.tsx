"use client";

import { useMemo, useState } from "react";
import RetroButton from "@/components/retroButton";

type SexValue = "M" | "F" | "Other" | "Prefer not to say";

export default function OnboardingModal({
    initialAge,
    initialSex,
    initialBio,
    initialHobbies,
    onCompleted,
}: {
    initialAge?: number | null;
    initialSex?: string | null;
    initialBio?: string | null;
    initialHobbies?: string[] | null;
    onCompleted: () => Promise<void> | void;
}) {
    const [age, setAge] = useState<string>(
        initialAge !== null && initialAge !== undefined
            ? String(initialAge)
            : ""
    );
    const [sex, setSex] = useState<string>(initialSex ?? "");
    const [bio, setBio] = useState<string>(initialBio ?? "");
    const [hobbiesText, setHobbiesText] = useState<string>(
        (initialHobbies ?? []).join(", ")
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const hobbies = useMemo(() => {
        return hobbiesText
            .split(",")
            .map((h) => h.trim())
            .filter(Boolean);
    }, [hobbiesText]);

    const canSubmit = useMemo(() => {
        const parsedAge = Number(age);
        const ageOk = Number.isFinite(parsedAge) && parsedAge > 0;
        const sexOk = sex.trim().length > 0;
        const bioOk = bio.trim().length > 0;
        const hobbiesOk = hobbies.length > 0;
        return ageOk && sexOk && bioOk && hobbiesOk;
    }, [age, sex, bio, hobbies]);

    const handleSubmit = async () => {
        if (isSaving) return;
        setError(null);

        if (!canSubmit) {
            setError("Please fill all required fields.");
            return;
        }

        setIsSaving(true);
        try {
            const res = await fetch("/api/auth/profile", {
                method: "PUT",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    age: Number(age),
                    sex: sex as SexValue,
                    bio,
                    hobbies,
                }),
            });

            if (!res.ok) {
                const contentType = res.headers.get("content-type") || "";
                const data = contentType.includes("application/json")
                    ? await res.json().catch(() => null)
                    : await res.text().catch(() => "");

                const message =
                    typeof data === "string"
                        ? data
                        : data?.error || data?.message;

                setError(message || `Failed to save profile (HTTP ${res.status})`);
                return;
            }

            await onCompleted();
        } catch (e) {
            console.error(e);
            setError("Failed to save profile");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-retro_border/60 p-4">
            <div className="w-full max-w-xl border-3 border-retro_border bg-background p-5 font-poppins text-secondary">
                <div className="text-2xl font-semibold">
                    Complete your profile
                </div>
                <div className="mt-1 text-sm">
                    These details are required to continue.
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4">
                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Age *</span>
                        <input
                            type="number"
                            min={1}
                            value={age}
                            onChange={(e) => setAge(e.target.value)}
                            className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Sex *</span>
                        <select
                            value={sex}
                            onChange={(e) => setSex(e.target.value)}
                            className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                        >
                            <option value="" disabled>
                                Select
                            </option>
                            <option value="M">M</option>
                            <option value="F">F</option>
                            <option value="Other">Other</option>
                        </select>
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">
                            Hobbies (comma separated) *
                        </span>
                        <input
                            type="text"
                            value={hobbiesText}
                            onChange={(e) => setHobbiesText(e.target.value)}
                            placeholder="e.g. Movies, Football, Music"
                            className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                        />
                    </label>

                    <label className="flex flex-col gap-1">
                        <span className="text-sm font-semibold">Bio *</span>
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            rows={4}
                            className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                        />
                    </label>

                    {error ? (
                        <div className="border-2 border-retro_red bg-background px-3 py-2 text-sm">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex justify-end">
                        <RetroButton
                            text={isSaving ? "Saving..." : "Save & Continue"}
                            icon={null}
                            onClick={handleSubmit}
                            isActive={true}
                            msgNo={0}
                            extraClass={`mx-0! bg-retro_orange ${
                                isSaving ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
