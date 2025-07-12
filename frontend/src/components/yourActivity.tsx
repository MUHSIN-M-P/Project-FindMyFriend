const YourActivity=({notifications}:{notifications:any[]})=>{
    return(
        <div className="content flex flex-col items-center w-full px-3 border-3 border-l-0 border-secondary">
              <div className="flex justify-center items-center title w-full text-4xl font-medium text-secondary py-8">
                Your Activity
              </div>
              <div className="w-full bg-secondary h-[3px]"></div>
              <div className="py-3">
                {notifications.map((notification)=>{
                  if(notification.type=="question_no")
                    return(
                      <div className="flex items-center gap-3 p-3 px-3 text-base">
                      <img src="/icons/pen_icon.png" alt="pen" />
                      <p>{`You have ${notification.no} more questions to answer`}</p>
                      </div> 
                    )
                  else if(notification.type=='req_accepted')
                    return(
                      <div className="flex items-center gap-3 p-3 px-3 text-base">
                      <img src="/icons/heart_icon.png" alt="pen" />
                      <p>{`${notification.name} accepted your message request`}</p>
                      </div> 
                    )
                  else if(notification.type=='new_friends')
                    return(
                      <div className="flex items-center gap-3 p-3 px-3 text-base">
                      <img src="/icons/ppl_icon.png" alt="pen" />
                      <p>{`You have ${notification.no} new friends`}</p>
                      </div> 
                    )
                })}
              </div>
          </div>
    )
}

export default YourActivity;