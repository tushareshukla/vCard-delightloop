import React from "react";
import Image from "next/image";

export default function UserOnboarding3() {
  return (
    <main className="bg-primary-xlight min-h-screen px-4 py-6 md:py-9 md:px-11">
      <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} />
      <div className="mt-20 text-center font-semibold">
        <Image src="/img/Shimmer.png" alt="arrow-left" width={80} height={80} className="mx-auto" />
    <h1 className="text-3xl mt-4">Your Gift is on Its Way!</h1>
    <p className="mt-5 mb-10">Thanks for sending your first gift with DelightLoop. </p>
    <p className="">Ready to do more?</p>
    <button
          className={`
flex items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-6 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95`}
        >
          <Image
            src="/svgs/Shimmer.svg"
            alt="shimmers"
            className=""
            width={22}
            height={22}
          />
          Create Your First Campaign
        </button>
      </div>
    </main>
  );
}
