import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Logo() {
  const router = useRouter();
  return (
    <button onClick={() => router.back()} className="bg-white px-1 py-1.5  w-fit  rounded-lg shadow-sm flex items-center ">
        <Image src="svgs/ArrowLeft.svg" alt="logo" className="size-6" height={40} width={155} />
        <Image src="svgs/Logo.svg" alt="logo" className="" height={40} width={155} />
    </button>
  );
}
