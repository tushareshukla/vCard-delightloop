"use client";
import { useState, useEffect, useRef, useMemo, memo, useCallback } from "react";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import { Gift, X } from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GiftItem {
  _id: string;
  name: string;
  sku: string;
  category: string;
  descShort: string;
  price: number;
  inventory: number;
  images: {
    primaryImgUrl?: string;
    secondaryImgUrl?: string;
  };
  tags: string[];
  bundle?: string;
  bundleName?: string;
  organizationId?: string;
  isCustom?: boolean;
  type: "global" | "bundle";
}

interface Bundle {
  _id: string;
  bundleName: string;
  giftIds: string[];
  isAvailable: boolean;
  gifts: {
    giftId: string;
    name: string;
    shortDescription: string;
    inventory: number;
    imageUrl: string;
  }[];
}

interface BundleFormData {
  bundleName: string;
  imgUrl: string | File | null;
  description: string;
  giftsList: Array<{ giftId: string }>;
}

interface BundleGift {
  _id: string;
  name: string;
  sku: string;
  category: string;
  descShort: string;
  price: number;
  inventory: number;
  images: {
    primaryImgUrl?: string;
    secondaryImgUrl?: string;
  };
  tags: string[];
  bundle?: string;
  organizationId?: string;
  isCustom?: boolean;
  type: "global" | "bundle";
}

interface SelectedGiftType {
  type: "global" | "bundle";
  data: GiftItem | BundleGift;
}

// Add trending metrics interface
interface TrendingMetrics {
  weeklyViews: number;
  percentageIncrease: number;
  totalOrders: number;
}

const OrgLogo = () => (
  <svg
    width="42"
    height="42"
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full"
  >
    <defs>
      <linearGradient id="orgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#4F46E5", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#7C3AED", stopOpacity: 1 }} />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="1" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    <circle cx="16" cy="16" r="16" fill="url(#orgGradient)" />
    <path
      d="M10 13C10 11.8954 10.8954 11 12 11H20C21.1046 11 22 11.8954 22 13V19C22 20.1046 21.1046 21 20 21H12C10.8954 21 10 20.1046 10 19V13Z"
      fill="white"
      fillOpacity="0.2"
    />
    <path
      d="M16 8L19.1962 12H12.8038L16 8Z"
      fill="white"
      fillOpacity="0.4"
      filter="url(#glow)"
    />
    <path
      d="M13 15H19M13 18H17"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      filter="url(#glow)"
    />
  </svg>
);

// Memoized Gift Cards Grid Component
const GiftCardsGrid = memo(
  ({
    paginatedGifts,
    onGiftClick,
  }: {
    paginatedGifts: GiftItem[];
    onGiftClick: (gift: SelectedGiftType) => void;
  }) => {
    // Move renderGiftCard outside and memoize it
    const renderGiftCard = useCallback(
      (gift: GiftItem) => {
        const isDelightloopGift = gift.type === "global";
        const isLowStock = gift.inventory <= 10;

        return (
          <div
            key={`${gift.type}-${gift._id}-${gift.name}`}
            onClick={() =>
              onGiftClick({
                type: gift.type,
                data: gift,
              })
            }
            className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer will-change-transform"
            style={{
              transform: "translateZ(0)", // Force hardware acceleration
              backfaceVisibility: "hidden", // Prevent flickering
            }}
          >
            <div className="relative aspect-square overflow-hidden">
              <Image
                src={
                  isDelightloopGift
                    ? gift.images?.primaryImgUrl || "/placeholder-gift.png"
                    : gift.images?.secondaryImgUrl ||
                      gift.images?.primaryImgUrl ||
                      "/placeholder-gift.png"
                }
                alt={gift.name}
                fill
                className="object-cover transition-transform duration-300 will-change-transform"
                style={{
                  transform: "translateZ(0)",
                  backfaceVisibility: "hidden",
                }}
              />
              <div
                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                style={{ willChange: "opacity" }}
              />

              {/* Logo */}
              {isDelightloopGift ? (
                <div className="absolute top-3 right-3">
                  <Image
                    src="/Favicon.svg"
                    alt="Delightloop"
                    className="rounded-md"
                    width={20}
                    height={20}
                  />
                </div>
              ) : (
                <div className="absolute top-3 right-3 w-10 h-10 filter drop-shadow-lg">
                  <OrgLogo />
                </div>
              )}

              {/* Tags */}
              {gift.tags && gift.tags.length > 0 && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                  {gift.tags.slice(0, 2).map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-black/30 text-white rounded-full text-xs font-medium shadow-sm"
                      style={{ backdropFilter: "none" }} // Remove problematic backdrop-blur
                    >
                      {tag}
                    </span>
                  ))}
                  {gift.tags.length > 2 && (
                    <span
                      className="px-2 py-1 bg-black/30 text-white rounded-full text-xs font-medium shadow-sm"
                      style={{ backdropFilter: "none" }}
                    >
                      +{gift.tags.length - 2}
                    </span>
                  )}
                </div>
              )}

              {/* Price and Stock Info - Always Visible */}
              <div
                className="absolute bottom-0 left-0 right-0 p-3 bg-black/20"
                style={{ backdropFilter: "none" }} // Remove problematic backdrop-blur
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded-full",
                        isLowStock
                          ? "bg-red-500/90 text-white"
                          : "bg-white/90 text-gray-700"
                      )}
                    >
                      Stock: {gift.inventory}
                    </span>
                  </div>
                  {gift.price > 0 && (
                    <span className="text-sm font-medium px-2 py-0.5 bg-white/90 rounded-full">
                      ${gift.price}
                    </span>
                  )}
                </div>
              </div>

              {/* Name and Description - On Hover */}
              <div
                className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 bg-black/70 transition-transform duration-300"
                style={{
                  willChange: "transform",
                  backdropFilter: "none", // Remove problematic backdrop-blur
                }}
              >
                <h3 className="font-medium text-lg mb-1">{gift.name}</h3>
                <p className="text-sm text-white/90 line-clamp-2">
                  {gift.descShort}
                </p>
              </div>
            </div>
          </div>
        );
      },
      [onGiftClick]
    );

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {paginatedGifts.map((gift) => renderGiftCard(gift))}
      </div>
    );
  }
);

GiftCardsGrid.displayName = "GiftCardsGrid";

export default function Inventory() {
  const { authToken, organizationId, isLoadingCookies } = useAuth();
  const [search, setSearch] = useState("");
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [organizationGifts, setOrganizationGifts] = useState<GiftItem[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [showDelightloopGifts, setShowDelightloopGifts] = useState(true);
  const [showOrganizationGifts, setShowOrganizationGifts] = useState(true);
  const [selectedGift, setSelectedGift] = useState<SelectedGiftType | null>(
    null
  );
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [maxPrice] = useState(200);
  const [isDragging, setIsDragging] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [selectedGifts, setSelectedGifts] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState<BundleFormData>({
    bundleName: "",
    imgUrl: "",
    description: "",
    giftsList: [],
  });
  const [selectedBundleName, setSelectedBundleName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [modalSearch, setModalSearch] = useState("");
  const [modalCurrentPage, setModalCurrentPage] = useState(1);
  const [showModalFilters, setShowModalFilters] = useState(false);
  const [modalSelectedCategory, setModalSelectedCategory] = useState("");
  const [modalPriceRange, setModalPriceRange] = useState<[number, number]>([
    0, 100,
  ]);
  const [modalShowDelightloopGifts, setModalShowDelightloopGifts] =
    useState(true);
  const [modalShowOrganizationGifts, setModalShowOrganizationGifts] =
    useState(true);
  const [modalSelectedBundleName, setModalSelectedBundleName] = useState("");
  const [formErrors, setFormErrors] = useState({
    bundleName: false,
    description: false,
  });
  const itemsPerPage = 20;

  // Add trending metrics mock data
  const trendingMetrics = new Map<string, TrendingMetrics>([
    ["gift1", { weeklyViews: 1250, percentageIncrease: 45, totalOrders: 89 }],
    ["gift2", { weeklyViews: 980, percentageIncrease: 32, totalOrders: 67 }],
    ["gift3", { weeklyViews: 1500, percentageIncrease: 58, totalOrders: 120 }],
    ["gift4", { weeklyViews: 850, percentageIncrease: 28, totalOrders: 45 }],
    ["gift5", { weeklyViews: 1100, percentageIncrease: 38, totalOrders: 76 }],
  ]);

  // Use refs for carousel to prevent main component re-renders
  const currentSlideRef = useRef(0);
  const [isPaused, setIsPaused] = useState(false);

  // Helper functions for carousel - NO STATE UPDATES
  const updateCurrentSlide = (newSlide: number) => {
    currentSlideRef.current = newSlide;
    // Direct DOM manipulation only, no React re-renders
    if (carouselRef.current) {
      carouselRef.current.style.transform = `translateX(-${
        newSlide * (100 / Math.min(gifts.length, 5))
      }%)`;
    }
  };

  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  useEffect(() => {
    if (!isLoadingCookies && authToken) {
      fetchGifts();
      fetchOrganizationGifts();
      fetchBundles();
    }
  }, [isLoadingCookies, authToken, organizationId]);

  const fetchGifts = async () => {
    try {
      setIsLoading(true);

      const limit = 10;
      const totalPages = Math.ceil(55 / limit);
      let allGifts: GiftItem[] = [];

      const pagePromises = Array.from({ length: totalPages }, (_, i) =>
        fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/gifts?page=${
            i + 1
          }&limit=${limit}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        )
      );

      const responses = await Promise.all(pagePromises);
      const jsonData = await Promise.all(responses.map((res) => res.json()));

      jsonData.forEach((data) => {
        const processedGifts = data.gifts
          .filter((gift: any) => {
            // Check if gift has bundle field and it matches the target bundle ID
            return (
              gift.bundle &&
              (typeof gift.bundle === "string"
                ? gift.bundle === "000000000000000000000000"
                : gift.bundle.$oid === "000000000000000000000000")
            );
          })
          .map((gift: any) => ({
            ...gift,
            type: "global" as const,
            organizationId: undefined,
            // Convert tags string to array if it's a string
            tags:
              typeof gift.tags === "string"
                ? gift.tags
                    .split(",")
                    .map((tag: string) => tag.trim())
                    .filter(Boolean)
                : gift.tags || [],
          }));
        allGifts = [...allGifts, ...processedGifts];
      });

      setGifts(allGifts);

      const uniqueCategories = Array.from(
        new Set(allGifts.map((gift: GiftItem) => gift.category).filter(Boolean))
      ) as string[];
      setCategories(uniqueCategories);

      // Set initial price range
      setPriceRange([0, 200]);
    } catch (error) {
      console.error("Error fetching gifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationGifts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/gifts/organization/${organizationId}`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "*/*",
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch organization gifts: ${response.statusText}`
        );
      }

      const data = await response.json();
      const orgGifts = data.gifts || [];

      // Add type field to each gift
      const processedGifts = orgGifts.map((gift: GiftItem) => ({
        ...gift,
        type: "bundle" as const,
      }));

      setOrganizationGifts(processedGifts);
    } catch (error) {
      console.error("Failed to fetch organization gifts:", error);
    }
  };

  const fetchBundles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles`,
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
            accept: "*/*",
          },
        }
      );
      const data = await response.json();

      // Extract bundles with their gift IDs
      const bundlesWithGifts: Bundle[] = data.data.map((bundle: any) => ({
        _id: bundle.bundleId,
        bundleName: bundle.bundleName,
        isAvailable: bundle.isAvailable,
        giftIds: bundle.gifts.map((gift: any) => gift.giftId),
        gifts: bundle.gifts.map((gift: any) => ({
          giftId: gift.giftId,
          name: gift.name,
          shortDescription: gift.shortDescription,
          inventory: gift.inventory,
          imageUrl: gift.imageUrl || "",
        })),
      }));

      setBundles(bundlesWithGifts);
    } catch (error) {
      console.error("[BUNDLES-API] Error:", error);
    }
  };

  const filteredGifts = useMemo(() => {
    return gifts.filter((gift) => {
      const searchTerms = search.toLowerCase().split(" ").filter(Boolean);
      const searchableFields = [
        gift.name,
        gift.sku,
        gift.descShort,
        gift.category,
        ...(gift.tags || []),
      ].map((field) => (field || "").toLowerCase());

      // Match all search terms against all fields
      const matchesSearch = searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );

      const matchesCategory =
        !selectedCategory || gift.category === selectedCategory;

      const matchesPrice =
        gift.price >= priceRange[0] && gift.price <= priceRange[1];

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [gifts, search, selectedCategory, priceRange]);

  const getCombinedGifts = useCallback(() => {
    const combinedGifts: GiftItem[] = [];
    const searchTerms = search.toLowerCase().split(" ").filter(Boolean);

    const matchesSearchTerms = (gift: GiftItem) => {
      const searchableFields = [
        gift.name,
        gift.sku,
        gift.descShort,
        gift.category,
        ...(gift.tags || []),
      ].map((field) => (field || "").toLowerCase());

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    };

    if (!selectedBundleName) {
      // Show all gifts when no bundle is selected
      if (showDelightloopGifts) {
        filteredGifts
          .filter((gift) => !gift.organizationId)
          .forEach((gift) => {
            combinedGifts.push({
              ...gift,
              type: "global",
            });
          });
      }

      if (showOrganizationGifts && organizationId) {
        organizationGifts.filter(matchesSearchTerms).forEach((gift) => {
          combinedGifts.push({
            ...gift,
            type: "bundle",
            organizationId: organizationId || undefined,
          });
        });
      }
    } else {
      // For specific bundle, show only gifts from that bundle
      const selectedBundle = bundles.find(
        (b) => b.bundleName === selectedBundleName
      );

      if (selectedBundle) {
        const bundleGiftIds = new Set(selectedBundle.giftIds);

        // Add matching global gifts if filter is enabled
        if (showDelightloopGifts) {
          filteredGifts
            .filter((gift) => bundleGiftIds.has(gift._id))
            .filter(matchesSearchTerms)
            .forEach((gift) => {
              combinedGifts.push({
                ...gift,
                type: "global",
              });
            });
        }

        // Add matching organization gifts if filter is enabled
        if (showOrganizationGifts && organizationId) {
          organizationGifts
            .filter((gift) => bundleGiftIds.has(gift._id))
            .filter(matchesSearchTerms)
            .forEach((gift) => {
              combinedGifts.push({
                ...gift,
                type: "bundle",
                organizationId: organizationId || undefined,
              });
            });
        }
      }
    }

    return combinedGifts;
  }, [
    filteredGifts,
    organizationGifts,
    showDelightloopGifts,
    showOrganizationGifts,
    selectedBundleName,
    bundles,
    search,
    organizationId,
  ]);

  const allGifts = useMemo(() => getCombinedGifts(), [getCombinedGifts]);

  const totalPages = Math.ceil(allGifts.length / itemsPerPage);
  const paginatedGifts = allGifts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Memoize the callback to prevent re-renders
  const handleGiftClick = useCallback((gift: SelectedGiftType) => {
    setSelectedGift(gift);
  }, []);

  // Auto scroll carousel
  useEffect(() => {
    if (!isPaused && gifts.length > 0) {
      const interval = setInterval(() => {
        updateCurrentSlide(
          (currentSlideRef.current + 1) % Math.min(gifts.length, 5)
        );
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isPaused, gifts.length]);

  // Custom Price Range Slider
  const PriceRangeSlider = ({
    value,
    onChange,
    max,
  }: {
    value: [number, number];
    onChange: (value: [number, number]) => void;
    max: number;
  }) => {
    const handleMouseDown = (index: number) => (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);

      const handleMouseMove = (e: MouseEvent) => {
        const slider = document.getElementById("price-slider");
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const percent = Math.min(
          Math.max((e.clientX - rect.left) / rect.width, 0),
          1
        );
        const newValue = Math.round((percent * max) / 5) * 5; // Round to nearest $5

        const newRange = [...value] as [number, number];
        newRange[index] = newValue;

        // Ensure min doesn't exceed max and vice versa
        if (index === 0 && newValue <= newRange[1]) {
          onChange([newValue, newRange[1]]);
        } else if (index === 1 && newValue >= newRange[0]) {
          onChange([newRange[0], newValue]);
        }
      };

      const handleMouseUp = () => {
        setIsDragging(false);
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    };

    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-gray-500">
          <span>${value[0]}</span>
          <span>${value[1]}</span>
        </div>
        <div className="relative py-2" id="price-slider">
          <div className="h-1 bg-gray-200 rounded-full">
            <div
              className="absolute h-1 bg-primary rounded-full"
              style={{
                left: `${(value[0] / max) * 100}%`,
                right: `${100 - (value[1] / max) * 100}%`,
              }}
            />
          </div>
          {[0, 1].map((i) => (
            <div
              key={i}
              onMouseDown={handleMouseDown(i)}
              className={cn(
                "absolute top-1/2 -mt-1.5 w-3 h-3 rounded-full bg-white border-2 border-primary cursor-pointer transform -translate-x-1/2 transition-all duration-200 hover:scale-110",
                isDragging && "shadow-lg scale-110"
              )}
              style={{
                left: `${(value[i] / max) * 100}%`,
              }}
            />
          ))}
        </div>
      </div>
    );
  };

  const toggleGiftSelection = (giftId: string) => {
    setSelectedGifts((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(giftId)) {
        newSet.delete(giftId);
      } else {
        newSet.add(giftId);
      }
      return newSet;
    });
  };

  const validateField = (field: string, value: string) => {
    if (field === "bundleName" || field === "description") {
      return value.trim().length === 0;
    }
    return false;
  };

  const handleInputChange = (
    field: keyof BundleFormData,
    value: string | File | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear validation error when user starts typing
    if (
      typeof value === "string" &&
      (field === "bundleName" || field === "description")
    ) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: validateField(field, value),
      }));
    }
  };

  const fetchBundlesAndGifts = async () => {
    await Promise.all([fetchBundles(), fetchOrganizationGifts()]);
  };

  const handleCreateBundle = async () => {
    try {
      console.log("[BUNDLE-CREATE] Starting bundle creation process...");

      // Validate required fields
      const trimmedBundleName = formData.bundleName.trim();
      const trimmedDescription = formData.description.trim();

      const newErrors = {
        bundleName: !trimmedBundleName,
        description: !trimmedDescription,
      };

      setFormErrors(newErrors);

      if (
        newErrors.bundleName ||
        newErrors.description ||
        selectedGifts.size === 0
      ) {
        // if (newErrors.bundleName) {
        //   alert("Catalog name is required and cannot be only spaces");
        // } else if (newErrors.description) {
        //   alert("Description is required and cannot be only spaces");
        // } else if (selectedGifts.size === 0) {
        //   alert("Please select at least one gift for the catalog");
        // }
        return;
      }

      setIsLoading(true);

      // Format selected gifts properly
      const selectedGiftsList = Array.from(selectedGifts).map((giftId) => ({
        giftId: giftId,
      }));

      const bundleData = {
        bundleName: trimmedBundleName,
        description: trimmedDescription,
        giftsList: selectedGiftsList,
        isAvailable: true,
      };

      console.log("[BUNDLE-CREATE] Selected gifts:", selectedGiftsList);
      console.log("[BUNDLE-CREATE] Preparing bundle data for API:", bundleData);

      const apiUrl = `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/bundles`;
      console.log("[BUNDLE-CREATE] API URL:", apiUrl);

      console.log("[BUNDLE-CREATE] Sending request to create bundle...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          accept: "*/*",
        },
        body: JSON.stringify(bundleData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Failed to create bundle: ${errorText} (${response.status})`
        );
      }

      const responseData = await response.json();
      console.log("[BUNDLE-CREATE] Bundle created successfully:", responseData);

      // Handle image upload if present
      const imgFile = formData.imgUrl;
      if (imgFile && typeof imgFile !== "string" && responseData.data?._id) {
        console.log(
          "[BUNDLE-CREATE] Image file detected, preparing for upload:",
          {
            fileName: imgFile.name,
            fileType: imgFile.type,
            fileSize: imgFile.size,
          }
        );

        const uploadFormData = new FormData();
        uploadFormData.append("file", imgFile);
        uploadFormData.append("bundleId", responseData.data._id);

        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/bundle`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
              accept: "*/*",
            },
            body: uploadFormData,
          }
        );

        if (!uploadResponse.ok) {
          console.error("[BUNDLE-CREATE] Failed to upload bundle image:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: await uploadResponse.text(),
          });
        } else {
          const uploadResult = await uploadResponse.json();
          console.log(
            "[BUNDLE-CREATE] Image uploaded successfully:",
            uploadResult
          );
        }
      }

      // Reset form and close modal
      setShowBundleModal(false);
      setFormData({
        bundleName: "",
        imgUrl: "",
        description: "",
        giftsList: [],
      });
      setFormErrors({
        bundleName: false,
        description: false,
      });
      setSelectedGifts(new Set());
      setSelectedGift(null); // Close any open gift modal

      // Refresh bundles list
      await fetchBundlesAndGifts();
      console.log(
        "[BUNDLE-CREATE] Bundle creation process completed successfully"
      );
    } catch (error) {
      console.error("[BUNDLE-CREATE] Error in bundle creation process:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBundleName, selectedCategory, search, priceRange]);

  const filteredModalGifts = () => {
    const combinedGifts: GiftItem[] = [];
    const searchTerms = modalSearch.toLowerCase().split(" ").filter(Boolean);

    // Helper function to check if a gift matches search terms
    const matchesSearchTerms = (gift: GiftItem) => {
      const searchableFields = [
        gift.name,
        gift.sku,
        gift.descShort,
        gift.category,
        ...(gift.tags || []),
      ].map((field) => (field || "").toLowerCase());

      return searchTerms.every((term) =>
        searchableFields.some((field) => field.includes(term))
      );
    };

    if (!modalSelectedBundleName) {
      // Add global gifts that match modal filters
      if (modalShowDelightloopGifts) {
        filteredGifts
          .filter((gift) => !gift.organizationId)
          .filter(matchesSearchTerms)
          .filter(
            (gift) =>
              !modalSelectedCategory || gift.category === modalSelectedCategory
          )
          .filter(
            (gift) =>
              gift.price >= modalPriceRange[0] &&
              gift.price <= modalPriceRange[1]
          )
          .forEach((gift) => {
            combinedGifts.push({
              ...gift,
              type: "global",
            });
          });
      }

      // Add organization gifts that match modal filters
      if (modalShowOrganizationGifts && organizationId) {
        organizationGifts
          .filter(matchesSearchTerms)
          .filter(
            (gift) =>
              !modalSelectedCategory || gift.category === modalSelectedCategory
          )
          .filter(
            (gift) =>
              gift.price >= modalPriceRange[0] &&
              gift.price <= modalPriceRange[1]
          )
          .forEach((gift) => {
            combinedGifts.push({
              ...gift,
              type: "bundle",
              organizationId: organizationId || undefined,
            });
          });
      }
    } else {
      // For specific bundle, show only gifts from that bundle
      const selectedBundle = bundles.find(
        (b) => b.bundleName === modalSelectedBundleName
      );

      if (selectedBundle) {
        const bundleGiftIds = new Set(selectedBundle.giftIds);

        // Add matching global gifts if filter is enabled
        if (modalShowDelightloopGifts) {
          filteredGifts
            .filter((gift) => bundleGiftIds.has(gift._id))
            .filter(matchesSearchTerms)
            .filter(
              (gift) =>
                !modalSelectedCategory ||
                gift.category === modalSelectedCategory
            )
            .filter(
              (gift) =>
                gift.price >= modalPriceRange[0] &&
                gift.price <= modalPriceRange[1]
            )
            .forEach((gift) => {
              combinedGifts.push({
                ...gift,
                type: "global",
              });
            });
        }

        // Add matching organization gifts if filter is enabled
        if (modalShowOrganizationGifts && organizationId) {
          organizationGifts
            .filter((gift) => bundleGiftIds.has(gift._id))
            .filter(matchesSearchTerms)
            .filter(
              (gift) =>
                !modalSelectedCategory ||
                gift.category === modalSelectedCategory
            )
            .filter(
              (gift) =>
                gift.price >= modalPriceRange[0] &&
                gift.price <= modalPriceRange[1]
            )
            .forEach((gift) => {
              combinedGifts.push({
                ...gift,
                type: "bundle",
                organizationId: organizationId || undefined,
              });
            });
        }
      }
    }

    return combinedGifts;
  };

  const modalGifts = filteredModalGifts();
  const modalTotalPages = Math.ceil(modalGifts.length / itemsPerPage);
  const modalPaginatedGifts = modalGifts.slice(
    (modalCurrentPage - 1) * itemsPerPage,
    modalCurrentPage * itemsPerPage
  );

  // Reset modal page when filters change
  useEffect(() => {
    setModalCurrentPage(1);
  }, [modalSearch, modalSelectedCategory, modalPriceRange]);

  return (
    <>
      <style jsx>{`
        /* Chrome-specific optimizations */
        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .group:hover img {
          transform: scale(1.05) translateZ(0) !important;
        }

        /* Prevent Chrome rendering issues */
        .will-change-transform {
          transform: translateZ(0);
          backface-visibility: hidden;
        }

        /* Optimize hover transitions */
        .group {
          contain: layout style paint;
        }

        /* Smooth scrolling for Chrome */
        .overflow-y-auto {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
      `}</style>
      <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
        <AdminSidebar />
        <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
          <div
            className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto"
            style={{
              WebkitOverflowScrolling: "touch", // iOS smooth scrolling
              scrollBehavior: "smooth", // Smooth scrolling
              willChange: "scroll-position", // Optimize for scrolling
            }}
          >
            <PageHeader
              title="Inventory"
              description="See and manage all gifts in your inventory"
              primaryButton={{
                text: "Create New Catalog",
                icon: Gift,
                onClick: () => {
                  console.log("Opening bundle modal");
                  setShowBundleModal(true);
                },
                variant: "primary"
              }}
              showDivider={true}
              className="pt-2"
            />
            
            {/* Search and Filter Controls */}
            <div className="mx-4 md:mx-6 lg:mx-8 mb-6 rounded-xl px-3 md:px-4 py-3 md:py-4 -mt-2" style={{ backgroundColor: '#F9FAFB' }}>
              {/* Mobile: Single row layout */}
              <div className="block md:hidden">
                <div className="flex items-center gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <svg className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                    </svg>
                    <input
                      type="text"
                      placeholder="Search inventory..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                    />
                  </div>
                  
                  {/* Filter Button */}
                  <button
                    onClick={() => setShowFilters((v) => !v)}
                    className="flex items-center gap-1.5 px-2.5 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors text-sm flex-shrink-0"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    <span className="hidden xs:inline text-sm">Filters</span>
                    {((selectedCategory ? 1 : 0) +
                      (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
                      (selectedBundleName ? 1 : 0) +
                      (!showDelightloopGifts || !showOrganizationGifts ? 1 : 0)) > 0 && (
                      <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                        {(selectedCategory ? 1 : 0) +
                          (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
                          (selectedBundleName ? 1 : 0) +
                          (!showDelightloopGifts || !showOrganizationGifts ? 1 : 0)}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Desktop: Single row layout */}
              <div className="hidden md:flex flex-row gap-3 items-center">
                <div className="relative flex-1">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                
                <button
                  onClick={() => setShowFilters((v) => !v)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  <span>Filters</span>
                  {((selectedCategory ? 1 : 0) +
                    (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
                    (selectedBundleName ? 1 : 0) +
                    (!showDelightloopGifts || !showOrganizationGifts ? 1 : 0)) > 0 && (
                    <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {(selectedCategory ? 1 : 0) +
                        (priceRange[0] > 0 || priceRange[1] < maxPrice ? 1 : 0) +
                        (selectedBundleName ? 1 : 0) +
                        (!showDelightloopGifts || !showOrganizationGifts ? 1 : 0)}
                    </span>
                  )}
                </button>
              </div>
              
              {/* Filter Dropdown */}
              {showFilters && (
                <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4">
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        Gift Types
                      </label>
                      <div className="flex flex-col gap-2">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={showDelightloopGifts}
                            onChange={(e) =>
                              setShowDelightloopGifts(e.target.checked)
                            }
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Delightloop Gifts
                          </span>
                        </label>
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={showOrganizationGifts}
                            onChange={(e) =>
                              setShowOrganizationGifts(e.target.checked)
                            }
                            className="rounded border-gray-300 text-primary focus:ring-primary"
                          />
                          <span className="ml-2 text-sm text-gray-700">
                            Organization Gifts
                          </span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Category
                      </label>
                      <select
                        key="category-select"
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mt-2 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                      >
                        <option key="all-categories" value="">
                          All Categories
                        </option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Catalog Name (Catalog Gifts Only)
                      </label>
                      <select
                        key="catalog-select"
                        value={selectedBundleName}
                        onChange={(e) => setSelectedBundleName(e.target.value)}
                        className="mt-2 block w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary sm:text-sm"
                      >
                        <option key="all-catalogs" value="">
                          All Catalogs
                        </option>
                        {bundles.map((bundle) => (
                          <option key={bundle._id} value={bundle.bundleName}>
                            {bundle.bundleName}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-sm font-medium text-gray-700">
                        Price Range ($0 - $200)
                      </label>
                      <div className="mt-3">
                        <PriceRangeSlider
                          value={priceRange}
                          onChange={setPriceRange}
                          max={maxPrice}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Content Container */}
            <div className="mx-4 md:mx-6 lg:mx-8">
              {/* Featured Gifts Carousel */}
              {isLoading ? (
                <div className="mt-6 mb-8">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-48"></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                    <div className="flex gap-6 p-8">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <div key={index} className="flex-none w-[calc(20%-1rem)] min-w-[250px] bg-white rounded-xl shadow-lg overflow-hidden">
                          <div className="relative aspect-[0.05/0.049] bg-gray-200"></div>
                          <div className="p-4 space-y-2">
                            <div className="h-5 bg-gray-200 rounded"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                            <div className="flex justify-between items-center">
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                              <div className="h-3 bg-gray-200 rounded w-12"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : gifts.length > 0 && (
                <div className="mt-6 mb-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-gray-900">
                      Trending on Delightloop
                    </h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Most popular gifts this week
                    </p>
                  </div>
                  <div className="flex items-center gap-4 relative">
                    {/* Navigation Arrows */}
                    <button
                      onClick={() =>
                        updateCurrentSlide(
                          (currentSlideRef.current -
                            1 +
                            Math.min(gifts.length, 5)) %
                            Math.min(gifts.length, 5)
                        )
                      }
                      className=" p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-800"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() =>
                        updateCurrentSlide(
                          (currentSlideRef.current + 1) %
                            Math.min(gifts.length, 5)
                        )
                      }
                      className=" p-3 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                    >
                      <svg
                        className="w-6 h-6 text-gray-800"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={togglePause}
                      className="p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-lg hover:bg-white transition-colors"
                    >
                      {isPaused ? (
                        <svg
                          className="w-5 h-5 text-gray-800"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5 text-gray-800"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5">
                  <div
                    ref={carouselRef}
                    className="flex gap-6 p-8 transition-transform duration-500 ease-out will-change-transform"
                    style={{
                      transform: `translateX(-${
                        currentSlideRef.current *
                        (100 / Math.min(gifts.length, 5))
                      }%)`,
                      backfaceVisibility: "hidden", // Prevent flickering
                    }}
                  >
                    {[...gifts, ...gifts.slice(0, 5)]
                      .slice(0, 10)
                      .map((gift, index) => {
                        const metrics = trendingMetrics.get(
                          `gift${(index % 5) + 1}`
                        );
                        return (
                          <div
                            key={`${gift._id}-${index}`}
                            className="relative flex-none w-[calc(13.333%-1rem)] min-w-[250px] bg-white rounded-xl shadow-lg overflow-hidden group cursor-pointer transform transition-all duration-300 will-change-transform"
                            style={{
                              transform: "translateZ(0)",
                              backfaceVisibility: "hidden",
                            }}
                            onClick={() =>
                              setSelectedGift({ type: "global", data: gift })
                            }
                          >
                            <div className="relative aspect-[0.05/0.049] overflow-hidden">
                              <Image
                                src={
                                  gift.images?.primaryImgUrl ||
                                  "/placeholder-gift.png"
                                }
                                alt={gift.name}
                                fill
                                className="object-cover transition-transform duration-300 will-change-transform"
                                style={{
                                  transform: "translateZ(0)",
                                  backfaceVisibility: "hidden",
                                }}
                              />
                              <div
                                className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{ willChange: "opacity" }}
                              />

                              {/* Logo */}
                              <div className="absolute top-3 right-3">
                                <Image
                                  src="/Favicon.svg"
                                  alt="Delightloop"
                                  className="rounded-md"
                                  width={20}
                                  height={20}
                                />
                              </div>

                              {/* Tags */}
                              <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                                {/* Trending Badge as first tag */}
                                <span
                                  className="px-2 py-1 bg-black/30 text-white rounded-full text-xs font-medium shadow-sm"
                                  style={{ backdropFilter: "none" }}
                                >
                                  🔥 +{metrics?.percentageIncrease}%
                                </span>
                                {gift.tags &&
                                  gift.tags.slice(0, 1).map((tag, tagIndex) => (
                                    <span
                                      key={tagIndex}
                                      className="px-2 py-1 bg-black/30 text-white rounded-full text-xs font-medium shadow-sm"
                                      style={{ backdropFilter: "none" }}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                {gift.tags && gift.tags.length > 1 && (
                                  <span
                                    className="px-2 py-1 bg-black/30 text-white rounded-full text-xs font-medium shadow-sm"
                                    style={{ backdropFilter: "none" }}
                                  >
                                    +{gift.tags.length - 1}
                                  </span>
                                )}
                              </div>

                              {/* Price and Stock Info - Always Visible */}
                              <div
                                className="absolute bottom-0 left-0 right-0 p-3 bg-black/20"
                                style={{ backdropFilter: "none" }}
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span className="text-xs px-2 py-0.5 rounded-full bg-white/90 text-gray-700">
                                      Stock: {gift.inventory}
                                    </span>
                                  </div>
                                  {gift.price > 0 && (
                                    <span className="text-sm font-medium px-2 py-0.5 bg-white/90 rounded-full">
                                      ${gift.price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Name and Description - On Hover */}
                              <div
                                className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 bg-black/70 transition-transform duration-300"
                                style={{
                                  willChange: "transform",
                                  backdropFilter: "none",
                                }}
                              >
                                <h3 className="font-medium text-lg mb-1">
                                  {gift.name}
                                </h3>
                                <p className="text-sm text-white/90 line-clamp-2">
                                  {gift.descShort}
                                </p>

                                {/* Trending Metrics - Only show on hover */}
                                <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-white/20">
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-white/70"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                      />
                                    </svg>
                                    <span className="text-xs">
                                      {metrics?.weeklyViews.toLocaleString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <svg
                                      className="w-4 h-4 text-white/70"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                                      />
                                    </svg>
                                    <span className="text-xs">
                                      {metrics?.totalOrders} orders
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Navigation Dots */}
                  {/* <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 flex gap-2">
                    {gifts.slice(0, 5).map((_, index) => (
                      <button
                        key={index}
                        onClick={() => updateCurrentSlide(index)}
                        className={cn(
                          "w-2 h-2 rounded-full transition-all duration-300",
                          currentSlideRef.current === index
                            ? "bg-primary w-8"
                            : "bg-white/50 hover:bg-white/70"
                        )}
                      />
                    ))}
                  </div> */}
                </div>
              </div>
            )}

            <div className="mt-6">
              {isLoading ? (
                <div className="space-y-8">
                  {/* Skeleton for gift grid */}
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                      {Array.from({ length: 10 }).map((_, index) => (
                        <div key={index} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                          <div className="relative aspect-square bg-gray-200"></div>
                          <div className="p-4 space-y-2">
                            <div className="h-4 bg-gray-200 rounded"></div>
                            <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                            <div className="flex justify-between items-center">
                              <div className="h-3 bg-gray-200 rounded w-16"></div>
                              <div className="h-3 bg-gray-200 rounded w-12"></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  {filteredGifts.length > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">
                          All Gifts{" "}
                          {selectedBundleName && `- ${selectedBundleName}`}
                        </h2>
                      </div>
                      <GiftCardsGrid
                        paginatedGifts={paginatedGifts}
                        onGiftClick={handleGiftClick}
                      />
                    </div>
                  )}

                  {/* Pagination section */}
                  {allGifts.length > itemsPerPage && (
                    <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                      {/* Mobile pagination controls */}
                      <div className="flex flex-1 justify-between sm:hidden">
                        <button
                          onClick={() =>
                            setCurrentPage((prev) => Math.max(prev - 1, 1))
                          }
                          disabled={currentPage === 1}
                          className={cn(
                            "relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
                            currentPage === 1
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          Previous
                        </button>
                        <button
                          onClick={() =>
                            setCurrentPage((prev) =>
                              Math.min(prev + 1, totalPages)
                            )
                          }
                          disabled={currentPage === totalPages}
                          className={cn(
                            "relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium",
                            currentPage === totalPages
                              ? "text-gray-300 cursor-not-allowed"
                              : "text-gray-700 hover:bg-gray-50"
                          )}
                        >
                          Next
                        </button>
                      </div>

                      {/* Desktop pagination controls */}
                      <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-gray-700">
                            Showing{" "}
                            <span className="font-medium">
                              {(currentPage - 1) * itemsPerPage + 1}
                            </span>{" "}
                            to{" "}
                            <span className="font-medium">
                              {Math.min(
                                currentPage * itemsPerPage,
                                allGifts.length
                              )}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                              {allGifts.length}
                            </span>{" "}
                            results
                          </p>
                        </div>
                        <div>
                          <nav
                            className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                            aria-label="Pagination"
                          >
                            <button
                              onClick={() =>
                                setCurrentPage((prev) => Math.max(prev - 1, 1))
                              }
                              disabled={currentPage === 1}
                              className={cn(
                                "relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300",
                                currentPage === 1
                                  ? "cursor-not-allowed"
                                  : "hover:bg-gray-50"
                              )}
                            >
                              <span className="sr-only">Previous</span>
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                              .filter(
                                (page) =>
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= currentPage - 1 &&
                                    page <= currentPage + 1)
                              )
                              .map((page, i, array) => {
                                if (i > 0 && array[i - 1] !== page - 1) {
                                  return (
                                    <span
                                      key={`ellipsis-${page}`}
                                      className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                    >
                                      ...
                                    </span>
                                  );
                                }
                                return (
                                  <button
                                    key={page}
                                    onClick={() => setCurrentPage(page)}
                                    className={cn(
                                      "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                                      currentPage === page
                                        ? "z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                        : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                    )}
                                  >
                                    {page}
                                  </button>
                                );
                              })}
                            <button
                              onClick={() =>
                                setCurrentPage((prev) =>
                                  Math.min(prev + 1, totalPages)
                                )
                              }
                              disabled={currentPage === totalPages}
                              className={cn(
                                "relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300",
                                currentPage === totalPages
                                  ? "cursor-not-allowed"
                                  : "hover:bg-gray-50"
                              )}
                            >
                              <span className="sr-only">Next</span>
                              <svg
                                className="h-5 w-5"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                                aria-hidden="true"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </button>
                          </nav>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            </div>

            {/* Custom Modal */}
            {selectedGift && (
              <div className="fixed inset-0 z-50 overflow-y-auto">
                <div
                  className="fixed inset-0 bg-black/80 backdrop-blur-sm"
                  onClick={() => setSelectedGift(null)}
                />
                <div className="relative min-h-screen flex items-center justify-center p-4">
                  <div className="relative bg-white rounded-xl max-w-[600px] w-full p-6 shadow-2xl">
                    <button
                      onClick={() => setSelectedGift(null)}
                      className="absolute right-4 top-4 p-1 rounded-full bg-white/80 hover:bg-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="relative aspect-square rounded-lg overflow-hidden">
                        <Image
                          src={
                            selectedGift.type === "global"
                              ? selectedGift.data.images?.primaryImgUrl ||
                                "/placeholder-gift.png"
                              : selectedGift.data.images?.secondaryImgUrl ||
                                selectedGift.data.images?.primaryImgUrl ||
                                "/placeholder-gift.png"
                          }
                          alt={selectedGift.data.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                          {selectedGift.data.name}
                        </h3>
                        <div className="space-y-4">
                          <p className="text-gray-600">
                            {selectedGift.type === "global"
                              ? selectedGift.data.descShort
                              : selectedGift.data.descShort}
                          </p>
                          <div className="grid grid-cols-2 gap-4">
                            {selectedGift.type === "global" && (
                              <>
                                <div>
                                  <p className="text-sm text-gray-500">SKU</p>
                                  <p className="font-medium">
                                    {selectedGift.data.sku}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">
                                    Category
                                  </p>
                                  <p className="font-medium">
                                    {selectedGift.data.category}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-gray-500">Price</p>
                                  <p className="font-medium">
                                    ${(selectedGift.data as GiftItem).price}
                                  </p>
                                </div>
                              </>
                            )}
                            <div>
                              <p className="text-sm text-gray-500">Stock</p>
                              <p className="font-medium">
                                {selectedGift.data.inventory}
                              </p>
                            </div>
                          </div>
                          {selectedGift.type === "global" &&
                            (selectedGift.data as GiftItem).tags?.length >
                              0 && (
                              <div>
                                <p className="text-sm text-gray-500 mb-2">
                                  Tags
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {(selectedGift.data as GiftItem).tags.map(
                                    (tag, index) => (
                                      <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                      >
                                        {tag}
                                      </span>
                                    )
                                  )}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bundle Modal */}
            {showBundleModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg w-full max-w-7xl relative max-h-[90vh] overflow-hidden flex flex-col">
                  <button
                    onClick={() => {
                      setShowBundleModal(false);
                      setSelectedGift(null);
                      setFormErrors({
                        bundleName: false,
                        description: false,
                      });
                    }}
                    className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  <div className="p-6 flex-shrink-0 border-b">
                    <h2 className="text-xl font-semibold">
                      Create New Catalog
                    </h2>
                    <div className="mt-4 space-y-4 grid grid-cols-3 gap-10">
                      <div className="mt-4">
                        <label className="block text-sm font-medium mb-1">
                          Catalog Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.bundleName}
                          onChange={(e) =>
                            handleInputChange("bundleName", e.target.value)
                          }
                          placeholder="Enter catalog name"
                          className={cn(
                            "w-full px-3 py-2 border rounded-md",
                            formErrors.bundleName
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-primary focus:border-primary"
                          )}
                        />
                        {formErrors.bundleName && (
                          <p className="mt-1 text-sm text-red-600">
                            Catalog name is required
                          </p>
                        )}
                      </div>

                      <div className=" ">
                        <label className="block text-sm font-medium mb-1">
                          Description <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={formData.description}
                          onChange={(e) =>
                            handleInputChange("description", e.target.value)
                          }
                          placeholder="Enter catalog description"
                          className={cn(
                            "w-full px-3 py-2 border rounded-md h-24",
                            formErrors.description
                              ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                              : "border-gray-300 focus:ring-primary focus:border-primary"
                          )}
                        />
                        {formErrors.description && (
                          <p className="mt-1 text-sm text-red-600">
                            Description is required
                          </p>
                        )}
                      </div>
                      <div className="row-span-2 relative rounded-lg overflow-hidden">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Catalog Image
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleInputChange("imgUrl", file);
                          }}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 flex-1 overflow-auto">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="font-medium text-gray-900">
                        Select Gifts
                      </h3>
                      <div className="flex items-center gap-4">
                        <div className="relative w-64">
                          <input
                            type="text"
                            value={modalSearch}
                            onChange={(e) => setModalSearch(e.target.value)}
                            placeholder="Search gifts..."
                            className="w-full pl-10 pr-4 py-2 border rounded-lg"
                          />
                          <svg
                            className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0118 0z"
                            />
                          </svg>
                        </div>
                        <button
                          onClick={() => setShowModalFilters(!showModalFilters)}
                          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
                            />
                          </svg>
                          Filters
                          {(modalSelectedCategory ||
                            modalPriceRange[0] > 0 ||
                            modalPriceRange[1] < maxPrice) && (
                            <span className="ml-1 px-2 py-0.5 bg-primary text-white text-xs rounded-full">
                              {(modalSelectedCategory ? 1 : 0) +
                                (modalPriceRange[0] > 0 ||
                                modalPriceRange[1] < maxPrice
                                  ? 1
                                  : 0)}
                            </span>
                          )}
                        </button>
                      </div>
                    </div>

                    {showModalFilters && (
                      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Gift Types
                            </label>
                            <div className="space-y-2">
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={modalShowDelightloopGifts}
                                  onChange={(e) =>
                                    setModalShowDelightloopGifts(
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Delightloop Gifts
                                </span>
                              </label>
                              <label className="inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={modalShowOrganizationGifts}
                                  onChange={(e) =>
                                    setModalShowOrganizationGifts(
                                      e.target.checked
                                    )
                                  }
                                  className="rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Organization Gifts
                                </span>
                              </label>
                            </div>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Category
                            </label>
                            <select
                              value={modalSelectedCategory}
                              onChange={(e) =>
                                setModalSelectedCategory(e.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary"
                            >
                              <option value="">All Categories</option>
                              {categories.map((category) => (
                                <option key={category} value={category}>
                                  {category}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Catalog Name
                            </label>
                            <select
                              value={modalSelectedBundleName}
                              onChange={(e) =>
                                setModalSelectedBundleName(e.target.value)
                              }
                              className="w-full rounded-md border border-gray-300 py-2 pl-3 pr-10 text-base focus:border-primary focus:outline-none focus:ring-primary"
                            >
                              <option value="">All Catalogs</option>
                              {bundles.map((bundle) => (
                                <option
                                  key={bundle._id}
                                  value={bundle.bundleName}
                                >
                                  {bundle.bundleName}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Price Range
                            </label>
                            <div className="px-2">
                              <PriceRangeSlider
                                value={modalPriceRange}
                                onChange={setModalPriceRange}
                                max={maxPrice}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      {modalPaginatedGifts.map((gift) => (
                        <div
                          key={`${gift.type}-${gift._id}`}
                          onClick={() => toggleGiftSelection(gift._id)}
                          className={cn(
                            "relative group border rounded-lg overflow-hidden cursor-pointer transition-all duration-300",
                            selectedGifts.has(gift._id)
                              ? "ring-2 ring-primary border-primary"
                              : "hover:border-gray-300"
                          )}
                        >
                          <div className="group relative bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1">
                            <div className="relative aspect-square">
                              <Image
                                src={
                                  gift.type === "global"
                                    ? gift.images?.primaryImgUrl ||
                                      "/placeholder-gift.png"
                                    : gift.images?.secondaryImgUrl ||
                                      gift.images?.primaryImgUrl ||
                                      "/placeholder-gift.png"
                                }
                                alt={gift.name}
                                fill
                                className="object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                              {/* Logo */}
                              {gift.type === "global" ? (
                                <div className="absolute top-3 right-3">
                                  <Image
                                    src="/Favicon.svg"
                                    alt="Delightloop"
                                    className="rounded-md"
                                    width={20}
                                    height={20}
                                  />
                                </div>
                              ) : (
                                <div className="absolute top-3 right-3 w-10 h-10 filter drop-shadow-lg">
                                  <OrgLogo />
                                </div>
                              )}

                              {/* Tags */}
                              {gift.tags && gift.tags.length > 0 && (
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5 max-w-[70%]">
                                  {gift.tags.slice(0, 2).map((tag, index) => (
                                    <span
                                      key={index}
                                      className="px-2 py-1 bg-black/20 backdrop-blur-sm text-white rounded-full text-xs font-medium shadow-sm"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                  {gift.tags.length > 2 && (
                                    <span className="px-2 py-1 bg-black/20 backdrop-blur-sm text-white rounded-full text-xs font-medium shadow-sm">
                                      +{gift.tags.length - 2}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Price and Stock Info - Always Visible */}
                              <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/5 backdrop-blur-sm">
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={cn(
                                        "text-xs px-2 py-0.5 rounded-full",
                                        gift.inventory <= 10
                                          ? "bg-red-500/90 text-white"
                                          : "bg-white/80 text-gray-700"
                                      )}
                                    >
                                      Stock: {gift.inventory}
                                    </span>
                                  </div>
                                  {gift.price > 0 && (
                                    <span className="text-sm font-medium px-2 py-0.5 bg-white/80 rounded-full">
                                      ${gift.price}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Name and Description - On Hover */}
                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white transform translate-y-full group-hover:translate-y-0 bg-black/60 backdrop-blur-sm transition-transform duration-300">
                                <h3 className="font-medium text-lg mb-1">
                                  {gift.name}
                                </h3>
                                <p className="text-sm text-white/90 line-clamp-2">
                                  {gift.descShort}
                                </p>
                              </div>
                            </div>
                          </div>
                          {selectedGifts.has(gift._id) && (
                            <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                              <div className="bg-primary text-white p-2 rounded-full">
                                <svg
                                  className="h-6 w-6"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {modalGifts.length > itemsPerPage && (
                      <div className="mt-6 flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3">
                        <div className="flex flex-1 justify-between sm:hidden">
                          <button
                            onClick={() =>
                              setModalCurrentPage((prev) =>
                                Math.max(prev - 1, 1)
                              )
                            }
                            disabled={modalCurrentPage === 1}
                            className={cn(
                              "relative inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium",
                              modalCurrentPage === 1
                                ? "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            Previous
                          </button>
                          <button
                            onClick={() =>
                              setModalCurrentPage((prev) =>
                                Math.min(prev + 1, modalTotalPages)
                              )
                            }
                            disabled={modalCurrentPage === modalTotalPages}
                            className={cn(
                              "relative ml-3 inline-flex items-center rounded-md border px-4 py-2 text-sm font-medium",
                              modalCurrentPage === modalTotalPages
                                ? "border-gray-300 bg-white text-gray-300 cursor-not-allowed"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            Next
                          </button>
                        </div>
                        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm text-gray-700">
                              Showing{" "}
                              <span className="font-medium">
                                {(modalCurrentPage - 1) * itemsPerPage + 1}
                              </span>{" "}
                              to{" "}
                              <span className="font-medium">
                                {Math.min(
                                  modalCurrentPage * itemsPerPage,
                                  modalGifts.length
                                )}
                              </span>{" "}
                              of{" "}
                              <span className="font-medium">
                                {modalGifts.length}
                              </span>{" "}
                              results
                            </p>
                          </div>
                          <div>
                            <nav
                              className="isolate inline-flex -space-x-px rounded-md shadow-sm"
                              aria-label="Pagination"
                            >
                              <button
                                onClick={() =>
                                  setModalCurrentPage((prev) =>
                                    Math.max(prev - 1, 1)
                                  )
                                }
                                disabled={modalCurrentPage === 1}
                                className={cn(
                                  "relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300",
                                  modalCurrentPage === 1
                                    ? "cursor-not-allowed"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <span className="sr-only">Previous</span>
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                              {Array.from(
                                { length: modalTotalPages },
                                (_, i) => i + 1
                              )
                                .filter(
                                  (page) =>
                                    page === 1 ||
                                    page === modalTotalPages ||
                                    (page >= modalCurrentPage - 1 &&
                                      page <= modalCurrentPage + 1)
                                )
                                .map((page, i, array) => {
                                  if (i > 0 && array[i - 1] !== page - 1) {
                                    return (
                                      <span
                                        key={`ellipsis-${page}`}
                                        className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                                      >
                                        ...
                                      </span>
                                    );
                                  }
                                  return (
                                    <button
                                      key={page}
                                      onClick={() => setModalCurrentPage(page)}
                                      className={cn(
                                        "relative inline-flex items-center px-4 py-2 text-sm font-semibold",
                                        modalCurrentPage === page
                                          ? "z-10 bg-primary text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                                          : "text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                                      )}
                                    >
                                      {page}
                                    </button>
                                  );
                                })}
                              <button
                                onClick={() =>
                                  setModalCurrentPage((prev) =>
                                    Math.min(prev + 1, modalTotalPages)
                                  )
                                }
                                disabled={modalCurrentPage === modalTotalPages}
                                className={cn(
                                  "relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300",
                                  modalCurrentPage === modalTotalPages
                                    ? "cursor-not-allowed"
                                    : "hover:bg-gray-50"
                                )}
                              >
                                <span className="sr-only">Next</span>
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </button>
                            </nav>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-6 border-t flex-shrink-0">
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-gray-500">
                        {selectedGifts.size} gift
                        {selectedGifts.size !== 1 ? "s" : ""} selected
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => {
                            setShowBundleModal(false);
                            setFormErrors({
                              bundleName: false,
                              description: false,
                            });
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateBundle}
                          disabled={isLoading || selectedGifts.size === 0}
                          className={cn(
                            "px-4 py-2 bg-primary text-white rounded-md",
                            isLoading || selectedGifts.size === 0
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-primary/90"
                          )}
                        >
                          {isLoading ? "Creating..." : "Create Catalog"}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
