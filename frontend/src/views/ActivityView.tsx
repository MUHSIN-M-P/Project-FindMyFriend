"use client";

import YourActivity from "@/components/yourActivity";

export default function ActivityView() {
    const notifications_res = {
        data: {
            notifications: [
                {
                    type: "question_no",
                    no: 29,
                },
                {
                    type: "req_accepted",
                    name: "Sidsity",
                },
                {
                    type: "new_friends",
                    no: 25,
                },
                {
                    type: "req_accepted",
                    name: "Adolf Hitler",
                },
                {
                    type: "req_accepted",
                    name: "Muhsina",
                },
            ],
        },
    };
    const notifications = notifications_res.data.notifications;

    return (
        <div className="flex h-full max-w-[1720px] w-full justify-center font-poppins px-5 md:px-10 xl:px-20 pb-20">
            <div className="w-full flex justify-center">
                <YourActivity notifications={notifications} />
            </div>
        </div>
    );
}
