import Image from "next/image";
import { EnrichStateType, Recipient } from "@/lib/types/recipient";
import { useEffect, useState } from "react";
import Checkbox from "@/components/common/Checkbox";

interface TableRowProps {
  recipient: Recipient;
  isSelected: boolean;
  onSelectChange: (isSelected: boolean) => void;
  enrichState: EnrichStateType[];
  addressMaskImage: string;
}

export default function TableRow({ recipient, isSelected, onSelectChange, enrichState, addressMaskImage }: TableRowProps) {

  const [isChecked, setIsChecked] = useState(isSelected);

  useEffect(() => {
    setIsChecked(isSelected);
  }, [isSelected]);

  const handleChange = () => {
    const newValue = !isChecked;
    setIsChecked(newValue);
    onSelectChange(newValue);
  };

  // Check the enrichment state for the specific recipient
  const recipientEnrichState = enrichState.find(
    (state) => state.email === recipient.mailId
  );

  // Determine if all required fields are present
  const isMissingFields =
    !recipient.mailId  || !recipient.linkedinUrl;

  // Determine the enrichment status for the recipient
  let enrichStatus = "none";
  if (recipientEnrichState) {
    enrichStatus = recipientEnrichState.status;
  }

  return (
    <tr className="hover:bg-[#F9F5FF]">
      <td className="pl-4">
        <Checkbox id={recipient._id || ""} checked={isChecked} onChange={handleChange}  />
      </td>
      <td className="p-4 gap-0.5 grid justify-start">
        <div className="flex gap-2 items-center">
          <p>
            {recipient.lastName} {recipient.firstName}
          </p>
        </div>

        {/* Show enrichment-related status or alert */}
        {isMissingFields && enrichStatus === "none" && (
          <div className="relative flex mt-2 items-center gap-2 group">
            <Image src="svgs/Alert.svg" alt="error" width={16} height={16} />
            <div className="absolute left-6 w-80 bg-[#101828] text-white rounded-lg py-2 px-5 group-hover:flex hidden items-center gap-2">
              <div className="size-4 bg-[#101828] absolute -left-0.5 rotate-45"></div>
              <Image src="svgs/Bulb.svg" alt="error" width={16} height={18} />
              Consider Enriching Record for better results
            </div>
          </div>
        )}

        {/* Show "Enriching" state if enrichment is in progress */}
        {enrichStatus === "pending" && (
          <div className="text-xs text-[#5925DC] bg-[#F4F3FF] w-fit rounded-full px-2 py-1 flex items-center gap-2">
            <div className="size-2 bg-[#7A5AF8] rounded-full text-xs"></div>
            Enriching
          </div>
        )}

        {/* Show "Enriched" state if the enrichment is successful */}
        {enrichStatus === "success" && (
          <div className="text-xs text-[#027A48] bg-[#ECFDF3] w-fit rounded-full px-2 py-1 flex items-center gap-2">
            <div className="size-2 bg-[#12B76A] rounded-full text-xs"></div>
            Enriched
          </div>
        )}
      </td>
      <td className="p-4 ">{recipient.mailId || "---"}
      </td>
      <td className="p-4 ">
        <div className="flex items-center gap-1">
           { recipient.linkedinUrl ? (
             <>
               <Image src="svgs/Linkedin.svg" alt="linkedin" width={16} height={16} />
               {recipient.linkedinUrl?.replace(/^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in\/)?/i, '')}
             </>
           ) : "---"}
        </div>
      </td>
      <td className="p-4">{recipient.jobTitle}</td>
      <td className="p-4 text-ellipsis overflow-hidden">
        {recipient.companyName || "---"}
      </td>
      <td className="p-4">
        {recipient.address ? (
        //   <Image
        //     src={addressMaskImage}
        //     alt="Address Masked"
        //     width={140}
        //     height={44}
        //   />
        <div className="flex items-center gap-1">
        <div className="w-4 h-[3px] bg-gray-300 "></div>
        <div className="w-2 h-[3px] bg-gray-300 "></div>
        <div className="w-6 h-[3px] bg-gray-300 "></div>
        <div className="w-3 h-[3px] bg-gray-300 "></div>
        </div>
        ) : "---"}
      </td>
    </tr>
  );
}
