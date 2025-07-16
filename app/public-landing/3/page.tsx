import Image from "next/image";

export default function Page() {
  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] h-screen py-9 px-11">
      <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} />
      <div className="mt-20 sm:mt-[7%] grid  w-fit mx-auto text-center space-y-4">
        <Image
          src="/img/Shimmer.png"
          alt="gift-box"
          className="place-self-center"
          width={100}
          height={100}
        />
        <h3 className="text-2xl font-semibold mt-5">
          Your Gift is on its Way!
        </h3>
        <p className="font-medium w-[70%] mx-auto ">
          We’re packing your gift! You’ll receive a tracking update soon.
        </p>
      </div>
    </main>
  );
}
