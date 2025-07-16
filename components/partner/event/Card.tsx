import Image from "next/image";
interface CardProps {
  image: string;
  title: string;
  date: string;
  selected: boolean;
  onClick: () => void;
}
export default function Card({ image, title, date, selected, onClick }: CardProps) {
  const handleClick = () => {
    onClick();
  };
  return (
    <div className={`p-3  rounded-lg  border-[#D2CEFE] border bg-white  duration-300  cursor-pointer  w-[283px] ${selected ? "   border-primary-dark  shadow-[0_3px_10px_rgb(0,0,0,0.2)] scale-105 " : "  border-[#D2CEFE] shadow-sm "}`} onClick={handleClick}>
      {/* //!----- Image ----- */}
      <div className="relative">
        <div className="absolute top-2 left-2 text-xs text-primary font-semibold flex items-center gap-1 bg-primary-xlight rounded-sm px-1 py-0.5">
          <Image
            src="/partner/event/vide.png"
            alt="logo"
            width={17}
            height={10}
          />
          ONLINE
        </div>
        <Image src={image} alt="logo" width={259} height={94} />
      </div>
      {/* //!----- Title ----- */}
      <div className="text-sm font-semibold mt-2.5">
        {title}
      </div>
      {/* //!----- Description ----- */}
      <div className="flex items-center gap-2 mt-3.5 text-sm font-semibold text-primary ">
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12.3333 1.66669V5.00002M5.66667 1.66669V5.00002M1.5 8.33335H16.5M3.16667 3.33335H14.8333C15.7538 3.33335 16.5 4.07955 16.5 5.00002V16.6667C16.5 17.5872 15.7538 18.3334 14.8333 18.3334H3.16667C2.24619 18.3334 1.5 17.5872 1.5 16.6667V5.00002C1.5 4.07955 2.24619 3.33335 3.16667 3.33335Z"
            stroke="#344054"
            strokeWidth="1.67"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {date}
      </div>
    </div>
  );
}
