"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { useSearchParams } from "next/navigation";
import InfinityLoader from "@/components/common/InfinityLoader";
import router from "next/router";
import { useAuth } from "@/app/context/AuthContext";
// CSS animations for the PLG section
const floatAnimation = `
  @keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
    100% { transform: translateY(0px); }
  }
  .animate-float {
    animation: float 3s ease-in-out infinite;
  }
`;

const pingSlow = `
  @keyframes ping-slow {
    0% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.5); opacity: 0.5; }
    100% { transform: scale(1); opacity: 1; }
  }
  .animate-ping-slow {
    animation: ping-slow 2s ease-in-out infinite;
  }
`;

const fadeInUp = `
  @keyframes fade-in-up {
    0% { opacity: 0; transform: translateY(20px); }
    100% { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in-up {
    animation: fade-in-up 1s ease-out;
  }
`;

export default function Page() {
  
  const searchParams = useSearchParams();
  const [recipientId, setRecipientId] = useState<string>("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
  });

  useEffect(() => {
      
    const recipient_id = searchParams.get("recipient_id");
    if (!recipient_id) {
      toast.error("No recipient ID found in URL");
      return;
    }
    setRecipientId(recipient_id);
  
  }, [searchParams]);

  const handleAddressSubmit = async () => {
    try {
      setLoading(true);
      if (!recipientId) {
        toast.error("Recipient ID is required");
        setLoading(false);
        return;
      }

      // First update the recipient's address
      const updateResponse = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/recipients/${recipientId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            zip: address.zip,
            country: address.country,
          }),
        }
      );

      if (!updateResponse.ok) {
        setLoading(false);
        setError(true);
        throw new Error("Failed to update address");
      }

      // Then trigger address verification email


      // Clear form and show success state
      setAddress({
        line1: "",
        line2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      });
      setLoading(false);
      setError(false);
      setIsSubmitted(true);
      toast.success("Address updated successfully!");
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to process your request");
    }
  };

  if (isSubmitted) {
    return (

<main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-6 sm:py-9 px-4 sm:px-11">
  <style jsx global>{`${floatAnimation}${pingSlow}${fadeInUp}`}</style>
  <Image
    src="/Logo Final.png"
    alt="landing-1"
    width={157}
    height={50}
    className="w-32 sm:w-auto"
  />
  <div className="flex flex-col items-center justify-center mt-8 sm:mt-[8%]">
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center w-full max-w-md mx-4">
      <div className="mb-6">
        <Image
          src="/img/deep.png"
          alt="Success"
          width={180}
          height={80}
          className="mx-auto w-[140px] sm:w-[180px]"
        />
      </div>
      <h1 className="text-xl sm:text-2xl font-semibold text-[#1B1D21] mb-3 sm:mb-4">
        Thank You!
      </h1>
      <p className="text-sm sm:text-base text-[#475467] mb-4 sm:mb-6">
        Your shipping address has been successfully submitted. We'll send
        you an email confirmation shortly.
      </p>
      <div className="flex items-start gap-2 bg-[#F9F5FF] p-3 rounded-lg">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="flex-shrink-0 mt-0.5"
        >
          <path
            d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
            fill="#6941C6"
          />
        </svg>
        <p className="text-xs sm:text-sm text-[#6941C6]">
          We'll keep you updated on the delivery status via email.
        </p>
      </div>
    </div>
   
    {/* Visual separator */}
    <div className="w-full max-w-md mx-4 my-6 flex items-center justify-center">
      <div className="h-px bg-purple-200 w-1/3"></div>
      <div className="mx-4">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22L9.59998 19.6L16.2 13L9.59998 6.4L12 4L21 13L12 22Z" fill="#D6BBFB"/>
        </svg>
      </div>
      <div className="h-px bg-purple-200 w-1/3"></div>
    </div>
   
    {/* PLG Section */}
    <div className="bg-white p-6 sm:p-8 rounded-lg shadow-md text-center w-full max-w-md mx-4 animate-fade-in-up">
      <div className="flex justify-center mb-4">
        <div className="relative">
          <Image
            src="/img/Gift.png"
            alt="Gift Box"
            width={100}
            height={100}
            className="mx-auto animate-float"
          />
          <div className="absolute -top-3 -right-3">
            <div className="animate-ping-slow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#7F56D9" />
              </svg>
            </div>
          </div>
        </div>
      </div>
      
      <h2 className="text-lg sm:text-xl font-semibold text-[#1B1D21] mb-2">
        Looking forward to delighting you!
      </h2>
      
      <p className="text-xs sm:text-sm text-[#475467] mb-4">
        Impressed by this gifting experience? Your business can create the same magic! 
        DelightLoop makes it easy to surprise clients with thoughtful gifts that get results.
      </p>
      
      <a 
        href="https://app.delightloop.ai/auth/register" 
        target="_blank" 
        rel="noopener noreferrer"
        className="inline-block font-medium bg-[#7F56D9] text-white py-2 px-4 rounded-lg hover:bg-[#6941C6] transition-all transform hover:scale-105 shadow-md text-sm"
      >
        Try DelightLoop For Your Business →
      </a>
    </div>
  </div>
</main>

    );
  }

  return (
    <main className="bg-gradient-to-r shadow-lg from-[#ECFCFF] to-[#E8C2FF] min-h-screen py-6 sm:py-9 px-4 sm:px-11">
      <style jsx global>{`${floatAnimation}${pingSlow}${fadeInUp}`}</style>
      <Image
        src="/Logo Final.png"
        alt="landing-1"
        width={157}
        height={50}
        className="w-32 sm:w-auto"
      />
      <div className="flex flex-col lg:flex-row justify-between mt-8 sm:mt-[14%] gap-8 sm:gap-20 mx-4 sm:mx-[10%]">
        {/* left side */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl sm:text-4xl font-semibold">
            Where Should We Send Your Gift?
          </h1>
          <p className="font-medium mt-4 sm:mt-6 text-[#475467] w-full sm:w-[80%] mx-auto sm:mx-0">
            Make sure your details are correct so we can deliver your surprise
            hassle-free!
          </p>
          
          {/* Gift image with animation */}
          <div className="flex justify-center mt-6 sm:justify-start">
            <div className="relative">
              <Image
                src="/img/Gift.png"
                alt="Gift Box"
                width={100}
                height={100}
                className="animate-float"
              />
              <div className="absolute -top-3 -right-3">
                <div className="animate-ping-slow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" fill="#7F56D9" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* right side */}
        <div>
          <div className="bg-white relative rounded-lg p-4 max-w-[500px] mx-auto sm:mx-0">
            <Image
              src={"/img/Shimmer.png"}
              alt="ship"
              className="absolute right-0 sm:left-[93%] -top-6 sm:bottom-[91%] w-16 sm:w-auto"
              width={100}
              height={100}
            />
            <div className="absolute inset-0 bg-[url('/img/contactListBAckground.png')] bg-cover bg-top z-10 rounded-lg"></div>
            <div className="relative z-20 grid gap-6">
             
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 1
                  </label>
                  <input
                    type="text"
                    value={address.line1}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, line1: e.target.value }))
                    }
                    placeholder="123 Main St"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address Line 2
                  </label>
                  <input
                    type="text"
                    value={address.line2}
                    onChange={(e) =>
                      setAddress((prev) => ({ ...prev, line2: e.target.value }))
                    }
                    placeholder="Apt 4B"
                    className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      value={address.city}
                      onChange={(e) =>
                        setAddress((prev) => ({
                          ...prev,
                          city: e.target.value,
                        }))
                      }
                      placeholder="New York"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State
                    </label>
                    <input
                      type="text"
                      value={address.state}
                      onChange={(e) =>
                        setAddress((prev) => ({
                          ...prev,
                          state: e.target.value,
                        }))
                      }
                      placeholder="NY"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      value={address.zip}
                      onChange={(e) =>
                        setAddress((prev) => ({ ...prev, zip: e.target.value }))
                      }
                      placeholder="10001"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Country
                    </label>
                    <input
                      type="text"
                      value={address.country}
                      onChange={(e) =>
                        setAddress((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      placeholder="USA"
                      className="w-full px-3 py-2 border border-[#D0D5DD] rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                <div className="grid place-items-center gap-2">
                  <button
                    onClick={handleAddressSubmit}
                    disabled={loading}
                    className="w-full sm:w-[280px] text-center font-medium bg-[#7F56D9] text-white py-3 rounded-lg hover:bg-[#6941C6] transition-colors mx-auto flex items-center justify-center"
                  >
                    {loading ? <InfinityLoader /> : "Confirm & Ship My Gift"}
                  </button>
                  {error && (
                    <p className="text-red-500 text-sm">
                      Something went wrong. Please try again.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-start gap-2 bg-[#F9F5FF] p-3 rounded-lg w-full sm:w-[480px] mt-2">
            <svg
              width="24"
              height="24"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="flex-shrink-0"
            >
              <path
                d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V9H11V15ZM11 7H9V5H11V7Z"
                fill="#6941C6"
              />
            </svg>
            <p className="text-xs sm:text-sm text-[#6941C6]">
              Don't worry, we don't get to see your delivery address. It is used
              only for dispatching and deleted immediately.
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
