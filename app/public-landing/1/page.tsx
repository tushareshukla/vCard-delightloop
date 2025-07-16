import Image from "next/image";

export default function Page() {
  return (

<main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-6 sm:py-9 px-4 sm:px-11">
  <Image src="/Logo Final.png" alt="landing-1" width={157} height={50} className="w-32 sm:w-auto" />
  <div className="grid md:grid-flow-col justify-between md:mt-[14%] mt-8 gap-8 md:gap-20 mx-4 md:mx-[10%]">
    {/* left side */}
    <div className="text-center sm:text-left">
      <h1 className="text-3xl sm:text-4xl font-semibold">
        Your Gift is on the Way! 🎉
      </h1>
      <p className="font-medium mt-4 text-[#475467] w-full sm:w-[50%]">
        We've got something special for you! Enter your unique code, we'll
        take care of the rest.
      </p>
    </div>
    {/* right side */}
    <div className="bg-white h-fit relative rounded-lg p-4 w-full sm:w-[440px] mx-auto">
      <Image
        src={"/img/Shimmer.png"}
        alt="ship"
        className="absolute left-[85%] sm:left-[93%] -top-8 sm:bottom-[80%] w-16 sm:w-auto"
        width={100}
        height={100}
      />
      <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10 rounded-lg"></div>
      <div className="relative z-20 grid">
        <div className="text-[#101828] text-sm font-medium border-b-[1px] border-[#EAECF0] pb-4">
          Enter Your 12-Digit Code
        </div>
        <div className="mt-4 space-y-4">
          <input
            type="text"
            placeholder="Enter your code"
            className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <div className="flex justify-center pt-2">
            <button className="w-full sm:w-auto px-8 font-medium bg-[#7F56D9] text-white py-2 rounded-lg hover:bg-[#6941C6] transition-colors">
              Claim My Gift
            </button>
          </div>
          <p className="text-center text-xs font-medium text-gray-500">
            (Optional) A countdown timer if urgency is needed
          </p>
        </div>
      </div>
    </div>
  </div>
</main>

  );
}
