import Image from "next/image";
import Stars from "@/components/common/Stars";

export default function AuthPage() {
  return (
    <main className="flex flex-col items-center justify-center h-screen bg-primary-xlight ">
      <div className="-mt-[10%]">
        {/* //! --------- Header --------- */}
        <div className="flex items-center justify-between w-fit gap-7 mx-auto ">
          {/* Partner Photo */}
          <Image
            src="/partner/event/Hubilo.png"
            alt="logo"
            width={184}
            height={48}
          />
          {/* Connecting animation dots */}
          <div className="flex gap-2.5">
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-1"></div>
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-2"></div>
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-3"></div>
            <div className="bg-primary rounded-full size-2.5 animate-network-pulse-4"></div>
          </div>
          {/* Delightloop Logo */}
          <Image src="/Logo Final.png" alt="logo" width={188} height={48} />
        </div>
        {/* //! --------- Body --------- */}
        <p className="text-center text-lg font-semibold py-4">
          Lets Connect your Hubilo Account
        </p>
        {/* //! --------- Buttons --------- */}
        {/* {!hideButton && ( */}
        <div className="grid gap-4 w-[360px] mx-auto mt-10 relative z-20">
          <div>
            <label className="block text-[#344054] text-sm font-medium mb-1">
              User ID
            </label>
            <input
              type="text"
              className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
              placeholder="Enter your User ID"
              required
            />
          </div>
          <div>
            <label className="block text-[#344054] text-sm font-medium mb-1">
              Password
            </label>
            <input
              type="text"
              placeholder="⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅⋅"
              className="h-11 w-full p-3 border border-gray-300 rounded-[8px] focus:outline-none focus:ring-2 focus:ring-[#7F56D9]"
              required
            />
          </div>
          <button
            className="h-11 w-full bg-[#7F56D9] text-white font-[500] rounded-[8px] hover:opacity-95 cursor-pointer"
          >
            Connect
          </button>
        </div>
      </div>
      <Image
        src="/img/Gradient.png"
        alt="bg"
        width={1000}
        height={1000}
        className="fixed top-40 left-0 w-full h-full object-cover"
      />
      <Stars />
    </main>
  );
}
