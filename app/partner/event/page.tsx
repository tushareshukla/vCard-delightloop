"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import Stars from "@/components/common/Stars";
import Card from "@/components/partner/event/Card";
import Budget from "@/components/partner/event/Budget";
import GiftCard from "@/components/partner/event/GiftCard";

interface Gift {
  _id: string;
  name: string;
  price: number;
  images?: {
    primaryImgUrl: string;
  };
}

export default function EventPage() {
  const [selectedEvent, setSelectedEvent] = useState<string>("1");
  const [budget, setBudget] = useState<number>(500);
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [checkedGifts, setCheckedGifts] = useState<string[]>([]);

  useEffect(() => {
    const fetchGiftsFromFirstBundle = async () => {
      try {
        // First fetch bundles
        const bundleResponse = await fetch("/api/bundles");
        const bundleData = await bundleResponse.json();

        if (!bundleResponse.ok || !bundleData.bundles?.length) {
          throw new Error("No bundles found");
        }

        // Get first bundle's gift IDs
        const firstBundle = bundleData.bundles[0];
        const validGiftIds = firstBundle.giftsList
          .filter(({ giftId }) => giftId && giftId.length > 0)
          .slice(0, 4); // Only take first 4 gifts

        // Fetch gift details
        const giftPromises = validGiftIds.map(async ({ giftId }) => {
          const res = await fetch(`/api/gifts/${giftId}`);
          if (!res.ok) return null;
          return res.json();
        });

        const giftResults = await Promise.all(giftPromises);
        const validGifts = giftResults.filter(
          (gift): gift is Gift => gift !== null
        );
        setGifts(validGifts);
      } catch (err) {
        console.error("Error fetching gifts:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftsFromFirstBundle();
  }, []);

  return (
    <div className="bg-primary-xlight pb-10 min-h-screen ">
      <main className="z-10 relative">
        <div className="fixed w-full top-0 z-50 bg-primary-xlight">
          <div className="flex items-center justify-between px-12 pt-10">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm w-fit">
              <Image src="/Logo Final.png" alt="logo" width={163} height={26} />
            </div>
          </div>
          <h1 className="text-lg font-semibold text-center -mt-6">
            Welcome to DelightLoop! Let's set up your gifting strategy
          </h1>
        </div>
        <div className="pt-40">
          <div className="font-semibold text-center">Choose Event to boost</div>
          {/* //! Choose Event to boost */}
          <div className="flex gap-4 justify-center mt-6">
            <Card
              selected={selectedEvent === "1"}
              onClick={() => setSelectedEvent("1")}
              image="/partner/event/1.png"
              title="Data Science Applications for Real-World Analysis"
              date="Mon, Feb 10 · 2:30 PM IST"
            />
            <Card
              selected={selectedEvent === "2"}
              onClick={() => setSelectedEvent("2")}
              image="/partner/event/2.png"
              title="Data Science Applications for Real-World Analysis"
              date="Mon, Feb 10 · 2:30 PM IST"
            />
            <Card
              selected={selectedEvent === "3"}
              onClick={() => setSelectedEvent("3")}
              image="/partner/event/3.png"
              title="Data Science Applications for Real-World Analysis"
              date="Mon, Feb 10 · 2:30 PM IST"
            />
          </div>
          {/* //! Suggested Budget */}
          <div className="mt-10 border border-[#D2CEFE] w-fit mx-auto rounded-lg py-3 bg-[#F7F3FF] px-5 flex items-center gap-2">
            <div className="text-[#101828] font-semibold">Suggested Budget</div>
            <Budget budget={budget} setBudget={setBudget} />
          </div>
          {/* //! Suggested Physical Gifts */}
          <div className="mt-10 mb-5">
            <div className="flex items-center gap-2 justify-center font-semibold text-[15px] text-primary-dark mb-6">
              <Image
                src="/svgs/Infinity.svg"
                alt="gift"
                width={24}
                height={24}
              />
              Predicts 25 New Registration
            </div>
            <h2 className="font-semibold text-center mb-6">
              Suggested Physical Gifts
            </h2>
            <div className="flex justify-center items-center ">
              {isLoading ? (
                <div className="text-center">Loading gifts...</div>
              ) : (
                <div className="grid grid-cols-4 gap-4">
                  {gifts.map((gift) => (
                    <GiftCard
                      key={gift._id}
                      gift={gift}
                      checkedGifts={checkedGifts}
                      setCheckedGifts={setCheckedGifts}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
          {/* //! Power Up Wallet */}
          <button className="flex mx-auto mt-16 hover:opacity-95 text-xl duration-300 items-center gap-3 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg">
            <Image
              src="/svgs/Shimmer.svg"
              alt="Shimmer"
              width={24}
              height={24}
            />
            Power Up Wallet
          </button>
        </div>
      </main>
      <Image
        src="/img/Gradient.png"
        alt="bg"
        width={1000}
        height={1000}
        className="fixed top-40 left-0 w-full h-full object-cover"
      />
      <Stars />
    </div>
  );
}
