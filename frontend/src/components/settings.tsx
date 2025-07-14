'use client'

import Link from "next/link";
import RetroButton from "./retroButton";
import { usePathname } from "next/navigation";
const Settings=()=>{
    const currentPath = usePathname();
    return(
        <div className="relative flex flex-col px-5 items-center w-full border-3 border-l-0 max-lg:border-b-0! max-lg:border-r-0! border-retro_border font-poppins">
              <div className="flex justify-center items-center title w-full text-4xl max-lg:text-2xl font-medium text-secondary lg:py-8 py-4">
                Settings
              </div>
              <div className="w-full bg-retro_border h-[2px] max-lg:hidden"></div>
              <div className="lg:py-3">
                    <div className="desc text-[16px] text-left w-full px-4 text-justify!">
                    Disclaimer: We do not share any of your information outside of this application. All chats are end-to-end encrypted and no-one other than the sender and the receiver can read your private chats. The entire source code for this project is uploaded on Github. We do not take responsibility for any means of uncivilized behavior from strangers on this platform.
                    </div>
              </div>
              <div className="flex flex-col w-full gap-4 py-5">
                <div className="flex flex-row w-full gap-2 justify-center">
                  <RetroButton text="Change Password" icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass="h-full w-fit text-nowrap" />
                <RetroButton text="Change Visibility" icon={null} onClick={()=>{}} isActive={false} msgNo={0} extraClass="h-full w-fit text-nowrap" />
              </div>
              <div className="flex flex-row w-full gap-2 justify-center">
                <RetroButton text="Logout" icon="/icons/logout.svg" onClick={()=>{}} isActive={false} msgNo={0} extraClass="h-full w-fit text-nowrap bg-retro_orange" />
                    <RetroButton text="Delete Account" icon="/icons/delete.svg" onClick={() => { }} isActive={true} msgNo={0} extraClass="h-full w-fit text-nowrap bg-retro_red" />
                </div>
            </div>
            <Link href="/profile" className={`absolute top-0 left-0 w-fit flex flex-row gap-1 items-center p-3 ${currentPath === '/settings' ? '' : 'hidden'}`}>
              <img src="/icons/back.svg" alt="back" className="object-contain h-8" width={10} />
              Back
            </Link>
        </div>
    )
}

export default Settings;