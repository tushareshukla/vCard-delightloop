import Image from "next/image";

interface PersonalizationModeCardProps {
  tick: boolean;
  time: string;
  image: string;
  mainText: string;
  subText: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function PersonalizationModeCard({ tick, time, image, mainText, subText, onClick, disabled = false }: PersonalizationModeCardProps) {
  return (
    <div 
      className={`flex flex-col h-52 bg-white w-[296px] rounded-[4px] duration-300 shadow-sm ${tick ? '' : 'opacity-60'} ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} 
      onClick={disabled ? undefined : onClick}
    >
      {/* (1) container of image */}
      <div className={`rounded-t-[4px] relative h-[100px] ${tick ? 'bg-primary' : 'bg-[#EBD9FF]'}`}>
        {/* Tick mark */}
        {tick && (
          <div className="block shadow-sm absolute top-2 left-2 p-1 bg-gradient-to-r from-[#E3CEFE] to-[#FCFCFD] rounded-full w-fit">
            <Image
              src={`svgs/Tick2.svg`}
              alt="arrow right"
              className=""
              width={15}
              height={15}
            />
          </div>
        )}
        {/* Main image */}
        <Image
          src={image}
          className="absolute bottom-[20px] left-[36px]"
          alt="gift"
          width={48}
          height={48}
        />
        {/* Time taken */}
        <div className={`flex items-center bg-primary px-2 py-0.5 rounded-full gap-1 font-medium absolute top-1.5 right-2.5 text-xs text-white ${time === "" ? 'hidden' : ''}`}>
          <Image src="/svgs/Clock.svg" alt="thumb-up" width={20} height={20} />
          <div>{time}</div>
        </div>
      </div>
      {/* (2) container of text */}
      <div className="px-[27px] pb-4 pt-[13px] grid gap-[13px] rounded-b-[4px]">
        <div className="font-semibold text-sm">{mainText}</div>
        <div className="font-medium text-xs">
          {subText}
        </div>
      </div>
    </div>
  );
}
