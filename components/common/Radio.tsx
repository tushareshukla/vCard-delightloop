'use client';
import Image from 'next/image';
interface RadioProps {
  mainText: string;
  status: 'inactive' | 'active' | 'completed';
  showLine?: boolean;
  partnerIntegration?: boolean;
}
export default function Radio({
  mainText,
  status,
  showLine,
  partnerIntegration,
}: RadioProps) {
  return (
    // todo: this is a container of radio & line and text container
    <div className="grid gap-3 h-fit">
      {/* //! (1) radio & line container */}
      <div className={`w-fit grid grid-flow-col  ${showLine ? "place-items-start" : "place-items-center"}   gap-1 `}>
        {/* //? (1.1)  This is button */}
        <div
          className={`size-6 ${
            status === 'active'
              ? ' outline-4 outline-[#F4EBFF] outline bg-[#F9F5FF]'
              : 'bg-[#F9FAFB]'
          }  ${
            status === 'completed' ? 'bg-[#F9F5FF]' : ''
          }  rounded-full grid place-items-center`}
        >
          {/* most inner circle */}
          {status === 'completed' ? (
            <Image src="/svgs/Tick.svg" alt="check" width={12} height={12} />
          ) : (
            <div
              className={` ${
                status === 'active' ? 'bg-primary-light' : 'bg-[#EAECF0]'
              } size-2 rounded-full`}
            ></div>
          )}
        </div>
        {/* //? (1.2) this is line */}
        {!showLine && (
          <div
            className={`h-[2px] w-[224px] rounded-full ${
              status === 'completed' ? 'bg-primary-light' : 'bg-[#EAECF0]'
            }`}
          ></div>
        )}
      </div>
      {/* //! (2) text container */}
      <div className={` ${showLine ? "" : "pt-0.5"}`}>
        <div
          className={`text-sm font-medium   ${mainText === "Gift Recommendations" ?  "-ml-14" : partnerIntegration ? "text-start -ml-11" : "-ml-14"} ${
            status === 'active' ? 'text-primary' : 'text-[#344054]'
          }
        `}
        >
          {mainText}
        </div>
      </div>
    </div>
  );
}
