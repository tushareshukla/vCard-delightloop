import Image from "next/image";

interface CardProps {
  title: string;
  budget: number;
  categories: string[];
  personalization: boolean;
  deliveryType: string;
  ctaTracking: string;
  printOptions: string;
  onClick: () => void;
  selected: boolean;
}

export default function Card({ title, budget, categories, personalization, deliveryType, ctaTracking, printOptions, onClick, selected }: CardProps) {
  return (
    <div className="w-[319px] h-[341px] bg-white rounded-lg  border-[#D2CEFE] border-[1px] pt-5 p-6 relative">
      {/* //! --------- Card Header --------- */}
      <div className="flex items-center justify-between ">
        <h1 className="font-semibold">{title}</h1>
        {/* three dots */}
        {/* <div className="grid  gap-0.5 cursor-pointer hover:bg-[#F9F5FF] duration-300 px-3.5 -mr-2.5 -mb-1.5 py-2 rounded-full ">
          <div className="size-1 bg-[#101828] rounded-full"></div>
          <div className="size-1 bg-[#101828] rounded-full"></div>
          <div className="size-1 bg-[#101828] rounded-full"></div>
        </div> */}
      </div>
      {/* //! --------- Card Body --------- */}
      <div className="pt-2.5">
        {/* //? ------ 1 ------ */}
        <div className="text-sm font-semibold text-[#667085D6]">
          Individual Gift Budget: <span className="text-[#101828]">${budget}</span>
        </div>
        {/* //? ------ 2 ------ */}
        <div className="text-sm font-semibold text-[#667085D6] grid gap-2.5 mt-4">
          Gift Catalog:
          <div className="flex items-center font-medium text-xs gap-2">
            {categories.map((category, index) => (
              <div key={index} className={`${index === 0 ? "bg-[#FEF3F2] text-[#B42318]" : index === 1 ? "bg-[#F8F9FC] text-[#363F72]" : "bg-[#ECFDF3] text-[#027A48]"} rounded-full px-3 py-1`}>
                {category}
              </div>
            ))}
            {/* <div className="bg-[#FEF3F2] text-[#B42318] rounded-full px-3 py-1">
              Catalog 1
            </div>
            <div className="bg-[#F8F9FC] text-[#363F72] rounded-full px-3 py-1">
              Catalog 2
            </div>
            <div className="bg-[#ECFDF3] text-[#027A48] rounded-full px-3 py-1">
              Catalog 3
            </div> */}
          </div>
        </div>
        {/* //? ------ 3 ------ */}
        <div className="grid gap-3.5 mt-4">
          {/* 1 */}
          <div className="text-sm font-semibold text-[#667085D6]">
            Hyper-personalization: <span className="text-[#101828]">{personalization ? "Yes" : "No"}</span>
          </div>
          {/* 2 */}
          <div className="text-sm font-semibold text-[#667085D6]">
            Delivery Type:{" "}
            <span className="text-[#101828]">{deliveryType}</span>
          </div>
          {/* 3 */}
          <div className="text-sm font-semibold text-[#667085D6]">
            CTA Tracking: <span className="text-[#101828]">{ctaTracking}</span>
          </div>
          {/* 4 */}
          <div className="text-sm font-semibold text-[#667085D6]">
            Print Options <span className="text-[#101828]">{printOptions}</span>
          </div>
        </div>
        {/* //? ------ 4 ------ */}
        <div className="flex items-center justify-between gap-2 absolute bottom-3.5 right-4 w-[277px] ">
          {/* eye icon*/}
          <Image
            src="/partner-integrations/eye.svg"
            alt="eye"
            className="cursor-pointer hover:scale-110 duration-300"
            width={20}
            height={20}
          />
          {/* select */}
          <button className={`text-sm font-medium  mr-2 px-6 py-2  rounded-md ${selected ? "bg-[#7F56D9]   hover:bg-[#6941C6]  text-white" : "border border-[#D0D5DD]   hover:bg-gray-50    text-[#344054]  " }`} onClick={onClick}>
            {selected ? "Selected" : "Select"}
          </button>
        </div>
      </div>
    </div>
  );
}
