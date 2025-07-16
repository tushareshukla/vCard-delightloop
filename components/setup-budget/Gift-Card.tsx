import Image from "next/image";
import Checkbox from "@/components/common/Checkbox";
import { useState, useEffect } from "react";

interface GiftCardProps {
  bundle: {
    _id: string;
    bundleName: string;
    imgUrl: string;
    giftsList: Array<{
      giftId: string;
    }>;
  };
  isSelected: boolean;
  onCheckboxChange: () => void;
  onEyeClick: () => void;
}

export default function GiftCard({
  bundle,
  isSelected,
  onCheckboxChange,
  onEyeClick,
}: GiftCardProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [giftImages, setGiftImages] = useState<string[]>([bundle.imgUrl]); // Start with bundle image
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchGiftImages = async () => {
      try {
        const validGiftIds = bundle.giftsList
          .filter(({ giftId }) => giftId && giftId.length > 0)
          .map(({ giftId }) => giftId).slice(0, 3);

        if (validGiftIds.length === 0) return;

        const giftPromises = validGiftIds.map(async (giftId) => {
          const res = await fetch(`/api/gifts/${giftId}`);
          if (!res.ok) {
            if (res.status === 404) {
              console.warn(`Gift ${giftId} not found, skipping...`);
              return null;
            }
            throw new Error(`Failed to fetch gift ${giftId}`);
          }
          const data = await res.json();
          return data.images?.primaryImgUrl || null;
        });

        const images = (await Promise.all(giftPromises)).filter(
          (img): img is string => img !== null
        );

        // Combine bundle image with gift images
        setGiftImages([bundle.imgUrl, ...images]);
      } catch (err) {
        console.error("Error fetching gift images:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGiftImages();
  }, [bundle]);

  const nextImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % giftImages.length);
  };

  const prevImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentImageIndex(
      (prev) => (prev - 1 + giftImages.length) % giftImages.length
    );
  };

  return (
    <div className="grid items-center justify-between   bg-white rounded-lg py-2.5 px-[13px] w-[207px] h-[277px]  border border-[#D2CEFE]">
        <div className="grid gap-[7px] place-self-start">
        <div className="relative  h-[180px] w-[180px] ">
          <Image
            src={giftImages[currentImageIndex] || "/img/image.png"}
            alt=""
            width={180}
            height={180}
            className="rounded-md object-cover w-full h-full"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            sizes="180px"
            priority
          />

          {giftImages.length > 1 && !isLoading && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button
                onClick={nextImage}
                className="absolute right-1 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1 rounded-full"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>

              <div className="absolute w-fit bg-black/90   bottom-1 left-1/2 -translate-x-1/2 flex gap-1 p-1.5 rounded-full flex-wrap items-center justify-center">
                {giftImages.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full ${
                      currentImageIndex === index ? "bg-white" : "bg-white/50"
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
        <p className="text-sm font-semibold">{bundle.bundleName}</p>
        </div>


          <div className="flex items-center justify-between place-self-end w-full ">
            {/* <Image
              src="svgs/eye.svg"
              alt=""
              className="cursor-pointer"
              width={20}
              height={14}
              onClick={onEyeClick}
              /> */}
          <Checkbox
        id={`gift-card-${bundle.bundleName}`}
        checked={isSelected}
        onChange={onCheckboxChange}
      />
              <p onClick={onEyeClick}  className="text-xs font-medium cursor-pointer bg-primary text-white px-3 py-1 rounded-full">
                {bundle.giftsList.length} items
              </p>
          </div>


    </div>
  );
}
