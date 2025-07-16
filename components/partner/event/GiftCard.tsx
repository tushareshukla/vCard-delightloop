import Checkbox from "@/components/common/Checkbox";
import Image from "next/image";
interface Gift {
  _id: string;
  name: string;
  price: number;
  images?: {
    primaryImgUrl: string;
  };
}

type GiftCardProps = {
    gift: Gift;
    checkedGifts: string[];
    setCheckedGifts: (id: string[]) => void;
}

export default function GiftCard({ gift, checkedGifts, setCheckedGifts }: GiftCardProps) {
  return (
    <div
      key={gift._id}
      className="border relative rounded-lg p-4  bg-white  border-[#D2CEFE] "
    >
      <div className="size-[180px] relative rounded-md overflow-hidden">
        <Image
          src={gift.images?.primaryImgUrl || "/img/image.png"}
          alt={gift.name}
          fill
          className="rounded-md object-cover w-full h-48"
        />
      </div>

      <h4 className="mt-2 font-semibold text-sm w-[180px] mb-6">{gift.name}</h4>
      <p className="text-gray-600 absolute bottom-3 left-3">
        <Checkbox checked={checkedGifts.includes(gift._id)} onChange={() => {
            if (checkedGifts.includes(gift._id)) {
                setCheckedGifts(checkedGifts.filter((id) => id !== gift._id));
                console.log(checkedGifts);
            } else {
                setCheckedGifts([...checkedGifts, gift._id]);
            }
        }} id={gift._id} />
      </p>

    </div>
  );
}
