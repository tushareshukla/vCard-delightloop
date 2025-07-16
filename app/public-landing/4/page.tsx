"use client";
import { useAuth } from "@/app/context/AuthContext";
import InfinityLoader from "@/components/common/InfinityLoader";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import router from "next/router";
import { useEffect, useState } from "react";

export default function Page() {
  const searchParams = useSearchParams();
  const [recipientName, setRecipientName] = useState("");
  const [giftCode, setGiftCode] = useState("");
  const [response, setResponse] = useState<any>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
   
    const fetchRecipient = async () => {
      const recipient_id = searchParams.get("recipient_id");
      if (recipient_id) {
        try {
          const response = await fetch(`/api/recipients/${recipient_id}`);
          const data = await response.json();
          setRecipientName(data?.data?.firstName || "there");
        } catch (error) {
          console.error("Error fetching recipient:", error);
          setRecipientName("there");
        }
      }
    };

    fetchRecipient();
  
  }, [searchParams]);

  const handleClaimGift = async () => {
    try {
      setLoading(true);
      const recipient_id = searchParams.get("recipient_id");
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipients/${recipient_id}/fetch-key`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            code: giftCode,
          }),
        }
      );

      const data = await response.json();

      console.log("Claim gift response:", data);

      if (data.key) {
        // Handle successful claim
        console.log("Gift claimed successfully!");
        console.log("Key:", data.key);
        console.log("Expiration:", data.expires_at);
        setResponse(data);
        setLoading(false);
      }
      setLoading(false);
      setError(true);
    } catch (error) {
      setLoading(false);
      setError(true);
      console.error("Error claiming gift:", error);
    }
  };
  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-6 sm:py-9 px-4 sm:px-11">
      <Image
        src="/Logo Final.png"
        alt="landing-1"
        width={157}
        height={50}
        className="w-32 sm:w-auto"
      />
      {isCopied && (
        <div className="fixed bottom-0 left-0 z-50 w-full h-[10%] bg-black/50 flex items-center justify-center">
          <p className="text-white">Copied to clipboard</p>
        </div>
      )}
      {response ? (
        <div className="flex justify-center mt-8 sm:mt-[10%]">
          <div className="w-full sm:w-fit px-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-center mb-8 sm:mb-0">
              Congrats! Here's Your Digital Gift Card
            </h1>
            <div className="relative w-full sm:w-fit sm:-mt-20">
              <div className="absolute left-1/2 flex items-center gap-2 text-sm font-medium top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                Gift code: {response.key}{" "}
                <Image
                  src="/svgs/copy.svg"
                  alt="copy"
                  className="cursor-pointer hover:scale-125 transition-all duration-300"
                  width={15}
                  height={15}
                  onClick={() => {
                    navigator.clipboard.writeText(response.key);
                    setIsCopied(true);
                  }}
                />
              </div>
              <Image
                src="/img/gift-card.png"
                alt="gift-card"
                width={900}
                height={900}
                className="w-full sm:w-auto"
              />
              <Image
                src="/img/deep.png"
                alt="gift-card"
                className="absolute left-1/4 sm:left-56 bottom-20"
                width={150}
                height={150}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row justify-between mt-8 sm:mt-[14%] gap-8 sm:gap-20 mx-4 sm:mx-[10%]">
          {/* left side */}
          <div className="text-center sm:text-left">
            <h1 className="text-3xl sm:text-4xl font-semibold">
              Hey {recipientName}, You've Got a Special Gift!
            </h1>
            <p className="font-medium mt-4 text-base sm:text-lg text-[#475467] w-full sm:w-[80%]">
              A digital surprise is waiting for you! 🎁 Claim your exclusive
              gift card and enjoy something special—on us!
            </p>
          </div>
          {/* right side */}
          <div className="bg-white relative rounded-lg p-4 w-full sm:w-[440px] mx-auto sm:mx-0">
            <Image
              src={"/img/Shimmer.png"}
              alt="ship"
              className="absolute right-0 sm:left-[93%] -top-6 sm:bottom-[80%] w-16 sm:w-auto"
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
                  value={giftCode}
                  onChange={(e) => setGiftCode(e.target.value)}
                  className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="grid place-items-center gap-2">
                  <button
                    onClick={handleClaimGift}
                    disabled={loading}
                    className="w-full sm:w-auto px-10 font-medium bg-[#7F56D9] text-white py-2 rounded-lg hover:bg-[#6941C6] transition-colors"
                  >
                    {loading ? <InfinityLoader /> : "Claim Gift"}
                  </button>
                  {error && (
                    <p className="text-red-500 text-sm">
                      Invalid gift code. Please try again.
                    </p>
                  )}
                </div>
                <p className="text-center text-xs font-medium text-gray-500">
                  Your gift card details will be revealed instantly!
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
