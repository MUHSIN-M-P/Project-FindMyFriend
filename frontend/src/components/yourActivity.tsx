const YourActivity=({notifications}:{notifications:any[]})=>{
    return(
        <div className="content flex flex-col items-center w-full lg:px-3 border-3 border-l-0 max-lg:border-b-0! max-lg:border-r-0! border-retro_border">
              <div className="flex justify-center items-center title w-full text-4xl max-lg:text-2xl font-medium text-secondary lg:py-8 py-4">
                Your Activity
              </div>
              <div className="w-full bg-retro_border h-[2px] max-lg:hidden"></div>
              <div className="lg:py-3">
                {notifications.map((notification,index)=>{
                  if(notification.type=="question_no")
                    return(
                      <div key={index} className="flex items-center gap-3 p-3 px-3 max-lg:px-0 text-base">
                      <img src="/icons/pen_icon.svg" alt="pen" />
                      <p>{`You have ${notification.no} more questions to answer`}</p>
                      </div> 
                    )
                  else if(notification.type=='req_accepted')
                    return(
                      <div key={index} className="flex items-center gap-3 p-3 px-3 max-lg:px-0 text-base">
                      <img src="/icons/heart_icon.svg" alt="pen" />
                      <p>{`${notification.name} accepted your message request`}</p>
                      </div> 
                    )
                  else if(notification.type=='new_friends')
                    return(
                      <div key={index} className="flex items-center gap-3 p-3 px-3 max-lg:px-0 text-base">
                      <img src="/icons/ppl_icon.svg" alt="pen" />
                      <p>{`You have ${notification.no} new friends`}</p>
                      </div> 
                    )
                })}
              </div>
          </div>
    )
}

export default YourActivity;