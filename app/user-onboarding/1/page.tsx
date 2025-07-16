import Stars from "@/components/common/Stars";
import Image from "next/image";
import Link from "next/link";

export default function UserOnboarding1() {
  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen px-4 py-6 md:py-9 md:px-11">
      <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} />
      <Stars />
      {/* //!--- Card stack effect with semi-transparent cards behind */}
      <div className="flex flex-col items-center justify-center h-full mt-20 z-50 relative">
        <p className="text-[#333] font-medium mb-12 text-center">
          Congratulations we’ve added $50 to your wallet so you can send your
          first gift right away.
        </p>
        <div className="relative w-full max-w-md">
          {/* Card stack effect with semi-transparent cards behind */}
          <div className="absolute -top-8  left-1/2 -translate-x-1/2 w-[90%] h-[180px] bg-gradient-to-b from-[#FE147933]/5 to-white/60 rounded-2xl"></div>
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-[95%] h-[180px] bg-gradient-to-b from-[#FE147933]/10 to-white/60 rounded-2xl"></div>

          {/* Main wallet card */}
          <div className="relative bg-gradient-to-b from-[#8A6BFF] to-[#4E2A84] rounded-2xl overflow-hidden">
            {/* Top section with welcome and name */}
            <div className="p-6 pb-0">
              <p className="text-white/80 text-xl">Welcome</p>
              <h2 className="text-white text-3xl font-bold">Andres Nors</h2>
            </div>

            {/* Bottom section with balance */}
            <div className="bg-[#4E2A84] mt-16 p-6 flex justify-between items-center">
              <div>
                <p className="text-white/80">Your Wallet Balance</p>
                <p className="text-white text-5xl font-bold">$10</p>
              </div>
              <div className="opacity-70">
                <Image
                  src="/svgs/infinity.svg"
                  alt="infinity"
                  width={60}
                  height={60}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Expiration text */}
        <p className="text-[#333] text-center font-medium mt-6">
          Wallet Balance will expire on 23rd Feb 2025
        </p>
      </div>
      {/* //! ---- Button --- */}
      <Link
        href="/user-onboarding/2"
        className={`
flex items-center font-semibold w-fit text-xl gap-2 text-white shadow-sm mx-auto mt-10 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
      >
        <Image
          src="/svgs/Shimmer.svg"
          alt="shimmers"
          className=""
          width={22}
          height={22}
        />
        Send Your First Gift
      </Link>
    </main>
  );
}
