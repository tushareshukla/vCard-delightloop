import Image from "next/image";

interface CardButtonProps {
  title: string;
  image: string;
  onClick?: () => void;
  checked?: boolean;
}

export default function CardButton({ title, image, onClick, checked }: CardButtonProps) {

  return (
    <div className="grid justify-start  w-fit  shadow-sm group cursor-pointer relative" onClick={onClick}>
      <div className={` ${checked ? "bg-[#7f56d9]" : "bg-[#EBD9FF] group-hover:bg-[#D6BDFF]"} h-[86px] w-[156px]  grid place-items-center rounded-t-[4px]  duration-300`}>
        {
            !onClick &&
            <div className="absolute top-0 right-0 z-10 text-[10px] font-medium text-[#7f56d9] bg-[#EBD9FF] px-2 py-1 rounded-[4px]">
                Coming Soon
            </div>
        }
        <Image src={image} alt={title} width={39} height={30} />
      </div>
      <div className="text-sm text-black font-medium group-hover:bg-gray-50 duration-300 grid place-items-center px-8  rounded-b-[4px] bg-white w-[156px]  text-center h-[65px]  ">
        {title}
      </div>
    </div>
  );
}
