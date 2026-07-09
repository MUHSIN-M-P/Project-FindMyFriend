"use client";

import { useMemo, useState } from "react";
import RetroButton from "@/components/retroButton";
import { apiPut } from "@/utils/api";

type SexValue = "M" | "F" | "Other" | "Prefer not to say";

export default function OnboardingModal({
    initialAge,
    initialSex,
    initialBio,
    initialHobbies,
    initialSocials,
    onCompleted,
}: {
    initialAge?: number | null;
    initialSex?: string | null;
    initialBio?: string | null;
    initialHobbies?: string[] | null;
    initialSocials?: {
        instagram?: string;
        whatsapp?: string;
        github?: string;
        X?: string;
        linkedin?: string;
    };
    onCompleted: () => Promise<void> | void;
}) {
    const [age, setAge] = useState<string>(
        initialAge !== null && initialAge !== undefined
            ? String(initialAge)
            : "",
    );
    const [sex, setSex] = useState<string>(initialSex ?? "");
    const [bio, setBio] = useState<string>(initialBio ?? "");
    const [hobbiesText, setHobbiesText] = useState<string>(
        (initialHobbies ?? []).join(", "),
    );
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [socials, setSocials] = useState({
        instagram: initialSocials?.instagram ?? "",
        whatsapp: initialSocials?.whatsapp ?? "",
        github: initialSocials?.github ?? "",
        X: initialSocials?.X ?? "",
        linkedin: initialSocials?.linkedin ?? "",
    });

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

        if (page === 1) {
            if (!canSubmit) {
                setError("Please fill all required fields.");
                return;
            }
            setPage(2);
            return;
        }

        // Page 2: Save profile with socials
        setIsSaving(true);
        try {
            const res = await apiPut("/api/auth/profile", {
                age: Number(age),
                sex: sex as SexValue,
                bio,
                hobbies,
                socials,
            });

            if (res.error) {
                setError(
                    res.error || `Failed to save profile (HTTP ${res.status})`,
                );
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
            <div className="relative w-full max-w-xl border-3 border-retro_border bg-background p-5 font-poppins text-secondary">
                {initialAge !== null && initialAge !== undefined && (
                    <button
                        onClick={() => onCompleted()}
                        className="absolute right-4 top-4 p-1 hover:bg-primary/10 rounded-lg transition-colors"
                        aria-label="Close"
                    >
                        <svg
                            className="w-6 h-6 text-secondary"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                )}
                <div className="text-2xl font-semibold">
                    Complete your profile
                </div>
                <div className="mt-1 text-sm">
                    {page === 1
                        ? "These details are required to continue."
                        : "Add your social media links (optional)."}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-4">
                    {page === 1 ? (
                        <>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Age *
                                </span>
                                <input
                                    type="number"
                                    min={1}
                                    value={age}
                                    onChange={(e) => setAge(e.target.value)}
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Sex *
                                </span>
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
                                    onChange={(e) =>
                                        setHobbiesText(e.target.value)
                                    }
                                    placeholder="e.g. Movies, Football, Music"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>

                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Bio *
                                </span>
                                <textarea
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={4}
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                        </>
                    ) : (
                        <>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Instagram
                                </span>
                                <input
                                    type="text"
                                    value={socials.instagram}
                                    onChange={(e) =>
                                        setSocials((s) => ({
                                            ...s,
                                            instagram: e.target.value,
                                        }))
                                    }
                                    placeholder="Instagram username"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Whatsapp
                                </span>
                                <input
                                    type="text"
                                    value={socials.whatsapp}
                                    onChange={(e) =>
                                        setSocials((s) => ({
                                            ...s,
                                            whatsapp: e.target.value,
                                        }))
                                    }
                                    placeholder="Whatsapp number"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Github
                                </span>
                                <input
                                    type="text"
                                    value={socials.github}
                                    onChange={(e) =>
                                        setSocials((s) => ({
                                            ...s,
                                            github: e.target.value,
                                        }))
                                    }
                                    placeholder="Github username"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    Twitter
                                </span>
                                <input
                                    type="text"
                                    value={socials.X}
                                    onChange={(e) =>
                                        setSocials((s) => ({
                                            ...s,
                                            X: e.target.value,
                                        }))
                                    }
                                    placeholder="Twitter username"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                            <label className="flex flex-col gap-1">
                                <span className="text-sm font-semibold">
                                    LinkedIn
                                </span>
                                <input
                                    type="text"
                                    value={socials.linkedin}
                                    onChange={(e) =>
                                        setSocials((s) => ({
                                            ...s,
                                            linkedin: e.target.value,
                                        }))
                                    }
                                    placeholder="LinkedIn username"
                                    className="w-full border-2 border-retro_border bg-background px-3 py-2 text-secondary"
                                />
                            </label>
                        </>
                    )}

                    {error ? (
                        <div className="border-2 border-retro_red bg-background px-3 py-2 text-sm">
                            {error}
                        </div>
                    ) : null}

                    <div className="flex justify-end">
                        <RetroButton
                            text={
                                isSaving
                                    ? page === 2
                                        ? "Saving..."
                                        : "Next..."
                                    : page === 1
                                      ? "Next"
                                      : "Save & Continue"
                            }
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
