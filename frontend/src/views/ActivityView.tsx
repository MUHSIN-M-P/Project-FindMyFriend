"use client";

import YourActivity from "@/components/yourActivity";
import { apiGet } from "@/utils/api";
import { useEffect, useState } from "react";

export default function ActivityView() {
    const [notifications, setNotifications] = useState<any[]>([]);

    useEffect(() => {
        const load = async () => {
            const res = await apiGet<{ notifications: any[] }>("/api/activity");
            if (res.data?.notifications) {
                setNotifications(res.data.notifications);
            }
        };
        void load();
    }, []);

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
            <div className="w-full flex justify-center">
                <YourActivity notifications={notifications} />
            </div>
        </div>
    );
}
