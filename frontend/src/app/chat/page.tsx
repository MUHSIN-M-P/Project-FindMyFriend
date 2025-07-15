const page = () => {
  return (
    <div className="flex flex-col w-full h-screen">
      <div className="h-[3px] bg-retro_border w-full"></div>
      <div className="flex h-full w-[100vw] justify-around">
        <div className="contacts md:w-[30vw] lg:w-[20vw]">
          Hey
        </div>
        <div className="w-[3px] bg-retro_border h-full"></div>
        <div className="chat md:w-[70vw] lg:w-[80vw]">
          How
        </div>
      </div>
    </div>
  )
}

export default page