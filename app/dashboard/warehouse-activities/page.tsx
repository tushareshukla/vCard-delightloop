"use client";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import {
  Gift,
  Eye,
  Edit,
  Trash2,
  AlertCircle,
  MoreVertical,
  X,
  Send,
  CheckCircle,
  Flag,
  Calendar,
  Clock,
  Filter,
  Plus,
  Search,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/app/context/AuthContext";
import { motion } from "framer-motion";

interface GiftItem {
  id: string;
  image: string;
  name: string;
  sku: string;
  quantity: number;
  category: string;
  status: string;
  lastUpdated: string;
  imagesUrl: string[];
}

interface Bundle {
  bundleId: string;
  bundleName: string;
  isAvailable: boolean;
  gifts: {
    giftId: string;
    name: string;
    shortDescription: string;
    inventory: number;
    imageUrl: string;
  }[];
}

interface BundleResponse {
  success: boolean;
  bundleCount: number;
  data: Bundle[];
}

interface ShipmentGift {
  _id: string;
  sku: string;
  name: string;
  descFull: string;
  category: string;
  quantitySent: number;
  quantityReceived: number;
  notes: string;
  imagesUrl: string[];
  quantityFlagged: number;
}

interface ShipmentInfo {
  shipmentId: string;
  shipmentLabel: string;
  trackingNumber: string;
  trackingUrl: string;
  courierName: string;
  expectedDeliveryDate: string;
  receivedDate: string | null;
  qcNotes: string;
}

interface Shipment {
  _id: string;
  organizationId: string;
  bundleId: string;
  gifts: ShipmentGift[];
  status: "in_transit" | "received" | "flagged" | "in_stock";
  shipmentInfo: ShipmentInfo;
  warehouseLocation: string;
  createdBy: string;
  updatedBy: string;
  isActive: boolean;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  imagesUrl: string[];
}

interface Gift {
  _id: string;
  name: string;
  sku: string;
  category: string;
  descFull: string;
  descShort: string;
  images: {
    secondaryImgUrl: string;
  };
  inventory: number;
  isCustom: boolean;
  isDigital: boolean;
  leadTime: number;
  manufacturer: string;
  manufacturerDetails: {
    manufacturerName: string;
    manufacturerLogo: string;
    manufacturerClaimUrl: string;
  };
  minOrder: number;
  organizationId: string;
  personalizationOpts: string;
  price: number;
  stock: boolean;
  tags: string[];
  createdDate: string;
  updatedDate: string;
  createdBy: string;
}

// Add new interface for the in-stock API response
interface InStockGift {
  _id: string;
  name: string;
  sku: string;
  category: string;
  descFull: string;
  descShort: string;
  images: {
    secondaryImgUrl: string;
  };
  inventory: number;
  isCustom: boolean;
  isDigital: boolean;
  leadTime: number;
  manufacturer: string;
  manufacturerDetails: {
    manufacturerName: string;
    manufacturerLogo: string;
    manufacturerClaimUrl: string;
  };
  minOrder: number;
  organizationId: string;
  personalizationOpts: string;
  price: number;
  stock: boolean;
  tags: string[];
  createdDate: string;
  updatedDate: string;
  createdBy: string;
  bundleName: string;
}

interface BundleFormData {
  bundleName: string;
  imgUrl: string | File | null;
  description: string;
  giftsList: Array<{ giftId: string }>;
}

// Expandable Text Component
const ExpandableText = ({
  text,
  maxLength = 100,
}: {
  text: string;
  maxLength?: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text || text === "No notes" || text === "No QC notes") {
    return <div className="font-medium text-base text-gray-700">{text}</div>;
  }

  const shouldTruncate = text.length > maxLength;

  if (!shouldTruncate) {
    return (
      <div className="font-medium text-base text-gray-700 break-words">
        {text}
      </div>
    );
  }

  return (
    <div className="font-medium text-base text-gray-700">
      <span className="break-words">
        {isExpanded ? text : `${text.substring(0, maxLength)}...`}
      </span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="ml-2 text-primary hover:text-primary/80 font-semibold text-sm underline focus:outline-none transition-colors duration-200 whitespace-nowrap"
        type="button"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  );
};

// Add ViewDetailsModal component
const ViewDetailsModal = ({
  gift,
  shipment,
  bundleInfo,
  onClose,
}: {
  gift: ShipmentGift;
  shipment: Shipment;
  bundleInfo?: Bundle;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
    <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-4xl m-4 relative max-h-[90vh] overflow-y-auto animate-fade-in-up">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-8 pt-7 pb-3 border-b border-gray-100 bg-gradient-to-r from-[#F9F5FF] to-[#F4EBFF] rounded-t-2xl">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary rounded-full p-2">
            <Gift className="h-6 w-6" />
          </div>
          <h2 className="text-xl font-bold text-[#1B1D21]">Gift Details</h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 rounded-full p-1 transition-colors"
          aria-label="Close"
        >
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path
              d="M18 6L6 18"
              stroke="#444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M6 6L18 18"
              stroke="#444"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
      {/* Modal Content */}
      <div className="px-8 py-7">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Gift Image & Info */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-4">
              {gift.imagesUrl[0] ? (
                <Image
                  src={gift.imagesUrl[0]}
                  alt={gift.name}
                  width={72}
                  height={72}
                  className="rounded-lg border border-gray-100 object-cover"
                />
              ) : (
                <motion.div
                  className="w-16 h-16 flex items-center justify-center rounded-lg bg-gradient-to-br from-[#F9F5FF] via-[#F4EBFF] to-[#E0E7FF] border border-[#E0E7FF] shadow-md relative overflow-hidden"
                  style={{
                    backdropFilter: "blur(6px)",
                    WebkitBackdropFilter: "blur(6px)",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "linear",
                    }}
                    style={{ zIndex: 1 }}
                  />
                  <svg
                    width="32"
                    height="32"
                    className="absolute top-1 left-1 opacity-30"
                    style={{ zIndex: 2 }}
                  >
                    <circle cx="6" cy="6" r="1.5" fill="#A78BFA" />
                    <circle cx="26" cy="10" r="1" fill="#F472B6" />
                    <circle cx="16" cy="26" r="1.2" fill="#60A5FA" />
                  </svg>
                  <Gift className="h-6 w-6 text-primary drop-shadow-sm relative z-10" />
                </motion.div>
              )}
              <div>
                <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                  <Gift className="w-4 h-4 text-primary" /> Catalog
                </div>
                <div className="font-semibold text-base">
                  {bundleInfo?.bundleName || "N/A"}
                </div>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Gift Name</div>
              <div
                className="font-semibold text-lg flex items-center gap-2 break-words"
                title={gift.name}
              >
                {gift.name.length > 50
                  ? `${gift.name.substring(0, 50)}...`
                  : gift.name}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">SKU</div>
              <div
                className="font-mono text-base flex items-center gap-2 cursor-pointer group"
                title="Copy SKU"
                tabIndex={0}
                onClick={() => navigator.clipboard.writeText(gift.sku)}
              >
                {gift.sku}
                <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                  Copy
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Category</div>
              <div className="font-medium text-base capitalize flex items-center gap-1">
                <span className="inline-block w-2 h-2 rounded-full bg-primary mr-1"></span>
                {gift.category}
              </div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Description</div>
              <ExpandableText text={gift.descFull} maxLength={100} />
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Notes</div>
              <ExpandableText text={gift.notes || "No notes"} maxLength={100} />
            </div>
          </div>
          {/* Shipment Info & Quantities */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                <Calendar className="w-4 h-4 text-primary" /> Shipment Info
              </div>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Shipment ID</div>
                  <div
                    className="font-mono text-base flex items-center gap-2 cursor-pointer group"
                    title="Copy Shipment ID"
                    tabIndex={0}
                    onClick={() =>
                      navigator.clipboard.writeText(
                        shipment.shipmentInfo.shipmentId
                      )
                    }
                  >
                    {shipment.shipmentInfo.shipmentId}
                    <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1">
                      Copy
                    </span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Shipment Label
                  </div>
                  <div className="font-medium text-base">
                    {shipment.shipmentInfo.shipmentLabel}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Tracking Number
                  </div>
                  <div className="font-mono text-base">
                    {shipment.shipmentInfo.trackingNumber}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Courier</div>
                  <div className="font-medium text-base">
                    {shipment.shipmentInfo.courierName}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">
                    Warehouse Location
                  </div>
                  <div className="font-medium text-base">
                    {shipment.warehouseLocation}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">QC Notes</div>
                  <ExpandableText
                    text={shipment.shipmentInfo.qcNotes || "No QC notes"}
                    maxLength={100}
                  />
                </div>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-200 my-2"></div>
            {/* Quantities */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Quantities</div>
              <div className="flex gap-3 items-end">
                <div className="flex flex-col items-center group">
                  <span
                    className="inline-flex items-center gap-1 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                    title="Sent"
                  >
                    <Send className="w-3 h-3" />
                    <span className="font-bold">{gift.quantitySent}</span>
                  </span>
                  <span className="text-[10px] text-blue-700 mt-0.5 font-medium tracking-wide">
                    Sent
                  </span>
                </div>
                <div className="flex flex-col items-center group">
                  <span
                    className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                    title="Received"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span className="font-bold">{gift.quantityReceived}</span>
                  </span>
                  <span className="text-[10px] text-green-700 mt-0.5 font-medium tracking-wide">
                    Received
                  </span>
                </div>
                <div className="flex flex-col items-center group">
                  <span
                    className="inline-flex items-center gap-1 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                    title="Flagged"
                  >
                    <Flag className="w-3 h-3" />
                    <span className="font-bold">{gift.quantityFlagged}</span>
                  </span>
                  <span className="text-[10px] text-yellow-700 mt-0.5 font-medium tracking-wide">
                    Flagged
                  </span>
                </div>
              </div>
            </div>
            <div className="border-t border-dashed border-gray-200 my-2"></div>
            {/* Status & Key Dates */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full font-semibold",
                    shipment.status === "flagged"
                      ? "bg-red-50 text-red-600"
                      : shipment.status === "in_transit"
                      ? "bg-blue-50 text-blue-600"
                      : shipment.status === "received"
                      ? "bg-green-50 text-green-600"
                      : "bg-gray-100 text-[#1B1D21]"
                  )}
                >
                  {shipment.status === "flagged"
                    ? "Flagged"
                    : shipment.status === "in_transit"
                    ? "In Transit"
                    : shipment.status === "received"
                    ? "Received"
                    : shipment.status}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                <Calendar className="w-4 h-4 text-blue-500" />
                <span>
                  Expected:{" "}
                  <span className="font-semibold">
                    {formatDate(shipment.shipmentInfo.expectedDeliveryDate)}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-700">
                {shipment.shipmentInfo.receivedDate ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <Clock className="w-4 h-4 text-yellow-500" />
                )}
                <span>
                  Delivered:{" "}
                  <span className="font-semibold">
                    {shipment.shipmentInfo.receivedDate ? (
                      formatDate(shipment.shipmentInfo.receivedDate)
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-dashed border-gray-200 my-6"></div>
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
);

const getMongoId = (id: any): string => {
  if (typeof id === "string") return id;
  if (id && typeof id === "object") {
    if ("$oid" in id) return id.$oid;
    if ("_id" in id) return id._id;
  }
  return id;
};

// 1. Add Chip component (copied from event page)
const Chip = ({
  label,
  selected,
  onClick,
  icon,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  icon?: React.ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1 px-3 py-1.5 rounded-full border transition-all duration-200 text-xs font-medium shadow-sm
      ${
        selected
          ? "bg-primary text-white border-primary scale-105 shadow-lg"
          : "bg-white border-gray-300 text-gray-700 hover:bg-primary/10 hover:scale-105"
      }
      hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/30
    `}
    style={{
      boxShadow: selected ? "0 4px 16px 0 rgba(127,86,217,0.10)" : undefined,
      transform: selected ? "scale(1.07)" : undefined,
    }}
    aria-pressed={selected}
  >
    {icon}
    <span>{label}</span>
    {selected && (
      <svg className="ml-1 w-3 h-3 text-white" fill="none" viewBox="0 0 16 16">
        <circle cx="8" cy="8" r="8" fill="#7F56D9" />
        <path
          d="M5 8l2 2 4-4"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )}
  </button>
);

export default function Inventory() {
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState("in-transit");
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [selectedGift, setSelectedGift] = useState<{
    gift: ShipmentGift;
    shipment: Shipment;
    bundleInfo?: Bundle;
  } | null>(null);
  const router = useRouter();
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [organizationIdState, setOrganizationIdState] = useState<string | null>(
    null
  );
  const [authTokenState, setAuthTokenState] = useState<string | null>(null);
  const { organizationId, authToken, userId } = useAuth();
  const [gifts, setGifts] = useState<Gift[]>([]);
  const [selectedGifts, setSelectedGifts] = useState<Set<string>>(new Set());
  const [inStockGifts, setInStockGifts] = useState<InStockGift[]>([]);
  const [formData, setFormData] = useState<BundleFormData>({
    bundleName: "",
    imgUrl: "",
    description: "",
    giftsList: [],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  console.log("userId", userId);

  // 2. Add status filter state
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const statusOptions = [
    {
      label: "In Transit",
      value: "in_transit",
      icon: <Send className="w-3 h-3 text-blue-500" />,
    },
    {
      label: "Received",
      value: "received",
      icon: <CheckCircle className="w-3 h-3 text-green-500" />,
    },
    {
      label: "Flagged",
      value: "flagged",
      icon: <Flag className="w-3 h-3 text-yellow-500" />,
    },
  ];

  useEffect(() => {
    if (organizationId !== null) {
      setOrganizationIdState(organizationId);
    }
    if (authToken !== null) {
      setAuthTokenState(authToken);
    }
  }, [organizationId, authToken]);

  useEffect(() => {
    if (organizationIdState && authTokenState) {
      fetchBundles();
      fetchShipments();
    }
  }, [organizationIdState, authTokenState]);

  const fetchBundles = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/bundles`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch bundles: ${response.status}`);
      }

      const data: BundleResponse = await response.json();
      setBundles(data.data);
      console.log(data);
    } catch (error) {
      console.error("Failed to fetch bundles:", error);
    }
  };

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/inventory-shipments`,
        {
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch shipments: ${response.status}`);
      }

      const data = await response.json();
      setShipments(data.data || []);
    } catch (error) {
      console.error("Failed to fetch shipments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGifts = async () => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/gifts/organization/${organizationIdState}`,
        {
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch gifts: ${response.status}`);
      }

      const data = await response.json();
      console.log("data", data);
      setGifts(data.gifts || []);
    } catch (error) {
      console.error("Failed to fetch gifts:", error);
    }
  };

  useEffect(() => {
    if (showBundleModal && organizationIdState && authTokenState && userId) {
      fetchGifts();
    }
  }, [showBundleModal, organizationIdState, authTokenState, userId]);

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

  const handleInputChange = (
    field: keyof BundleFormData,
    value: string | File | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCreateBundle = async () => {
    try {
      console.log("[BUNDLE-CREATE] Starting bundle creation process...");
      console.log("[BUNDLE-CREATE] Form Data:", {
        bundleName: formData.bundleName,
        description: formData.description,
        selectedGiftsCount: selectedGifts.size,
        hasImage: !!formData.imgUrl,
      });

      setIsLoading(true);
      const bundleData = {
        bundleName: formData.bundleName,
        imgUrl: "", // Ensure this matches the working curl request format
        description: formData.description,
        giftsList: Array.from(selectedGifts).map((giftId) => ({ giftId })),
      };

      console.log("[BUNDLE-CREATE] Preparing bundle data for API:", {
        bundleName: bundleData.bundleName,
        description: bundleData.description,
        giftsListLength: bundleData.giftsList.length,
        giftsList: bundleData.giftsList,
        fullRequestData: bundleData,
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/bundles`;
      console.log("[BUNDLE-CREATE] API URL:", apiUrl);

      console.log("[BUNDLE-CREATE] Sending request to create bundle...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokenState}`,
          accept: "*/*",
        },
        body: JSON.stringify(bundleData),
      });

      console.log(
        "[BUNDLE-CREATE] Bundle creation response status:",
        response.status
      );
      console.log("[BUNDLE-CREATE] Response headers:", {
        "content-type": response.headers.get("content-type"),
        "content-length": response.headers.get("content-length"),
        date: response.headers.get("date"),
      });

      // Log the raw response text for debugging
      const responseText = await response.text();
      console.log("[BUNDLE-CREATE] Raw response:", responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (e) {
          errorData = { message: responseText };
        }

        console.error("[BUNDLE-CREATE] Error creating bundle:", {
          status: response.status,
          statusText: response.statusText,
          errorData,
          requestData: {
            url: apiUrl,
            headers: {
              "Content-Type": "application/json",
              Authorization: "Bearer [REDACTED]",
              accept: "*/*",
            },
            body: bundleData,
          },
        });
        throw new Error(
          `Failed to create bundle: ${
            errorData.error_message || errorData.message || response.statusText
          } (${response.status})`
        );
      }

      // Parse the response text back to JSON since we already consumed it
      const createdBundle = JSON.parse(responseText);
      console.log("createdBundle", createdBundle);
      console.log("[BUNDLE-CREATE] Bundle created successfully:", {
        bundleId: createdBundle.data._id,
        bundleName: createdBundle.data.bundleName,
        fullResponse: createdBundle,
      });

      // If there's an image file selected, upload it
      const imgFile = formData.imgUrl;
      if (imgFile && typeof imgFile !== "string") {
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
        uploadFormData.append("bundleId", createdBundle.data._id);

        console.log("[BUNDLE-CREATE] Sending image upload request...");
        const uploadResponse = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/bundle`,
          {
            method: "POST",
            headers: {
              accept: "application/json",
              Authorization: `Bearer ${authTokenState}`,
            },
            body: uploadFormData,
          }
        );

        console.log(
          "[BUNDLE-CREATE] Image upload response status:",
          uploadResponse.status
        );
        console.log("[BUNDLE-CREATE] Image upload response headers:", {
          "content-type": uploadResponse.headers.get("content-type"),
          "content-length": uploadResponse.headers.get("content-length"),
          date: uploadResponse.headers.get("date"),
        });

        // Log the raw response text for debugging
        const uploadResponseText = await uploadResponse.text();
        console.log("[BUNDLE-CREATE] Raw upload response:", uploadResponseText);

        if (!uploadResponse.ok) {
          let errorData;
          try {
            errorData = JSON.parse(uploadResponseText);
          } catch (e) {
            errorData = { message: uploadResponseText };
          }

          console.error("[BUNDLE-CREATE] Failed to upload bundle image:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            errorData,
            requestData: {
              url: `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/bundle`,
              headers: {
                accept: "application/json",
                Authorization: "Bearer [REDACTED]",
              },
              fileInfo: {
                name: imgFile.name,
                type: imgFile.type,
                size: imgFile.size,
              },
              bundleId: createdBundle.data._id,
            },
          });
        } else {
          const uploadResult = JSON.parse(uploadResponseText);
          console.log("[BUNDLE-CREATE] Image uploaded successfully:", {
            fileUrl: uploadResult.fileUrl,
            updatedBundle: uploadResult.updatedBundle,
            fullResponse: uploadResult,
          });
        }
      } else {
        console.log("[BUNDLE-CREATE] No image file to upload");
      }

      console.log("[BUNDLE-CREATE] Cleaning up form and refreshing bundles...");
      setShowBundleModal(false);
      setFormData({
        bundleName: "",
        imgUrl: "",
        description: "",
        giftsList: [],
      });
      setSelectedGifts(new Set());

      console.log("[BUNDLE-CREATE] Refreshing bundles list...");
      await fetchBundles();
      console.log(
        "[BUNDLE-CREATE] Bundle creation process completed successfully"
      );
    } catch (error) {
      console.error("[BUNDLE-CREATE] Error in bundle creation process:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause,
        timestamp: new Date().toISOString(),
        context: {
          formData: {
            bundleName: formData.bundleName,
            description: formData.description,
            selectedGiftsCount: selectedGifts.size,
            hasImage: !!formData.imgUrl,
          },
          organizationId: organizationIdState,
          authTokenPresent: !!authTokenState,
        },
      });
    } finally {
      setIsLoading(false);
      console.log("[BUNDLE-CREATE] Loading state cleared");
    }
  };

  const handleAction = (
    action: string,
    gift: ShipmentGift,
    shipment: Shipment
  ) => {
    if (action === "view") {
      const bundleInfo = bundles.find(
        (b) => getMongoId(b.bundleId) === getMongoId(shipment.bundleId)
      );
      setSelectedGift({ gift, shipment, bundleInfo });
    } else if (action === "edit") {
      router.push(
        `/dashboard/inventory/add?shipmentId=${getMongoId(shipment._id)}`
      );
    } else {
      console.log(`${action} gift with id: ${gift._id}`);
    }
  };

  const getShipmentsByStatus = (
    status: "in_transit" | "in_stock" | "flagged"
  ) => {
    return shipments.filter((shipment) => shipment.status === status);
  };

  const renderTable = (shipments: Shipment[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Gift
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Shipment Id
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              SKU
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Category
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Quantity
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Status
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Last Updated
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Key Dates
            </th>
            <th className="px-4 py-3 text-left font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {shipments
            ?.filter(
              (shipment) =>
                !selectedBundle ||
                selectedBundle === getMongoId(shipment.bundleId)
            )
            .flatMap((shipment) =>
              shipment.gifts.map((gift) => {
                const bundleInfo = bundles.find((b) => {
                  console.log("Bundle comparison:", {
                    bundleId: b.bundleId,
                    shipmentBundleId: shipment.bundleId,
                    bundleIdNormalized: getMongoId(b.bundleId),
                    shipmentBundleIdNormalized: getMongoId(shipment.bundleId),
                    matches:
                      getMongoId(b.bundleId) === getMongoId(shipment.bundleId),
                  });
                  return (
                    getMongoId(b.bundleId) === getMongoId(shipment.bundleId)
                  );
                });
                return (
                  <tr key={gift._id} className="border-b border-gray-100">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 relative rounded flex items-center justify-center overflow-hidden flex-shrink-0">
                          {gift.imagesUrl[0] ? (
                            <Image
                              src={gift.imagesUrl[0]}
                              alt={gift.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#F4EBFF] to-[#E0E7FF] rounded-lg shadow-md border border-[#E0E7FF] overflow-hidden"
                              style={{
                                backdropFilter: "blur(6px)",
                                WebkitBackdropFilter: "blur(6px)",
                              }}
                            >
                              {/* Shimmer */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                initial={{ x: "-100%" }}
                                animate={{ x: ["-100%", "100%"] }}
                                transition={{
                                  duration: 2.2,
                                  repeat: Infinity,
                                  ease: "linear",
                                }}
                                style={{ zIndex: 1 }}
                              />
                              {/* Sparkles/Confetti SVG */}
                              <svg
                                width="40"
                                height="40"
                                className="absolute top-1 left-1 opacity-30"
                                style={{ zIndex: 2 }}
                              >
                                <circle cx="6" cy="6" r="1.5" fill="#A78BFA" />
                                <circle cx="34" cy="10" r="1" fill="#F472B6" />
                                <circle
                                  cx="20"
                                  cy="34"
                                  r="1.2"
                                  fill="#60A5FA"
                                />
                              </svg>
                              {/* Gift Icon */}
                              <Gift className="h-7 w-7 text-primary drop-shadow-sm relative z-10" />
                            </motion.div>
                          )}
                        </div>
                        <span
                          className="font-medium truncate max-w-[150px]"
                          title={gift.name}
                        >
                          {gift.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-[#667085]">
                        {shipment.shipmentInfo?.shipmentId || "-"}
                      </span>
                    </td>
                    <td className="px-4 py-3">{gift.sku}</td>
                    <td className="px-4 py-3">{gift.category}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3 items-end">
                        {/* Sent */}
                        <div className="flex flex-col items-center group">
                          <span
                            className="inline-flex items-center gap-1 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                            title="Sent"
                          >
                            <Send className="w-3 h-3" />
                            <span className="font-bold">
                              {gift.quantitySent}
                            </span>
                          </span>
                          <span className="text-[10px] text-blue-700 mt-0.5 font-medium tracking-wide">
                            Sent
                          </span>
                        </div>
                        {/* Received */}
                        <div className="flex flex-col items-center group">
                          <span
                            className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                            title="Received"
                          >
                            <CheckCircle className="w-3 h-3" />
                            <span className="font-bold">
                              {gift.quantityReceived}
                            </span>
                          </span>
                          <span className="text-[10px] text-green-700 mt-0.5 font-medium tracking-wide">
                            Received
                          </span>
                        </div>
                        {/* Flagged */}
                        <div className="flex flex-col items-center group">
                          <span
                            className="inline-flex items-center gap-1 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                            title="Flagged"
                          >
                            <Flag className="w-3 h-3" />
                            <span className="font-bold">
                              {gift.quantityFlagged}
                            </span>
                          </span>
                          <span className="text-[10px] text-yellow-700 mt-0.5 font-medium tracking-wide">
                            Flagged
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "px-2 py-1 rounded-full text-xs inline-flex items-center gap-1",
                          shipment.status === "flagged"
                            ? "bg-red-50 text-red-600"
                            : "bg-blue-50 text-blue-600"
                        )}
                      >
                        {shipment.status === "flagged"
                          ? "Flagged"
                          : shipment.status === "in_transit"
                          ? "In Transit"
                          : "Received"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {new Date(shipment.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="rounded-lg px-0 py-0 flex flex-col gap-1 min-w-[140px]">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Calendar className="w-4 h-4 text-blue-500" />
                          <span>
                            Expected:{" "}
                            <span className="font-semibold">
                              {formatDate(
                                shipment.shipmentInfo.expectedDeliveryDate
                              )}
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          {shipment.shipmentInfo.receivedDate ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <Clock className="w-4 h-4 text-yellow-500" />
                          )}
                          <span>
                            Delivered:{" "}
                            <span className="font-semibold">
                              {shipment.shipmentInfo.receivedDate ? (
                                formatDate(shipment.shipmentInfo.receivedDate)
                              ) : (
                                <span className="text-gray-400">Pending</span>
                              )}
                            </span>
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end ">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                            <MoreVertical className="h-4 w-4 text-gray-500" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent
                            align="end"
                            className="w-48 bg-white"
                          >
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction("view", gift, shipment)
                              }
                            >
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleAction("edit", gift, shipment)
                              }
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Edit Gift
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
        </tbody>
      </table>
    </div>
  );

  // Update the fetchInStockGifts function
  const fetchInStockGifts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/bundles`,
        {
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch in-stock gifts: ${response.status}`);
      }

      const data = await response.json();
      console.log("data", data);
      setBundles(data.data || []);
    } catch (error) {
      console.error("Failed to fetch in-stock gifts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationIdState && authTokenState && activeTab === "in-stock") {
      fetchInStockGifts();
    }
  }, [organizationIdState, authTokenState, activeTab]);

  // Update the renderGiftCards function
  const renderGiftCards = (shipments: Shipment[]) => {
    if (activeTab === "in-stock") {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bundles
            .filter(
              (bundle) => !selectedBundle || bundle.bundleId === selectedBundle
            )
            .flatMap((bundle) =>
              bundle.gifts.map((gift) => (
                <div
                  key={`${bundle.bundleId}-${gift.giftId}`}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="relative aspect-video bg-gray-50 flex items-center justify-center">
                    {gift.imageUrl ? (
                      <Image
                        src={gift.imageUrl}
                        alt={gift.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <Gift className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="font-medium text-lg truncate max-w-[200px]"
                        title={gift.name}
                      >
                        {gift.name}
                      </h3>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="inline-block px-2 py-1 bg-gray-50 rounded-md mb-2">
                        Catalog: {bundle.bundleName}
                      </div>
                      <p>Quantity: {gift.inventory}</p>
                      <p className="line-clamp-2">{gift.shortDescription}</p>
                      <p>Status: In Stock</p>
                    </div>
                  </div>
                </div>
              ))
            )}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {shipments
          .filter(
            (shipment) =>
              !selectedBundle ||
              selectedBundle === getMongoId(shipment.bundleId)
          )
          .flatMap((shipment) =>
            shipment.gifts.map((gift) => {
              const bundleInfo = bundles.find((b) => {
                console.log("Bundle comparison:", {
                  bundleId: b.bundleId,
                  shipmentBundleId: shipment.bundleId,
                  bundleIdNormalized: getMongoId(b.bundleId),
                  shipmentBundleIdNormalized: getMongoId(shipment.bundleId),
                  matches:
                    getMongoId(b.bundleId) === getMongoId(shipment.bundleId),
                });
                return getMongoId(b.bundleId) === getMongoId(shipment.bundleId);
              });
              return (
                <div
                  key={gift._id}
                  className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
                >
                  <div className="relative aspect-video bg-gray-50 flex items-center justify-center">
                    {gift.imagesUrl[0] ? (
                      <Image
                        src={gift.imagesUrl[0]}
                        alt={gift.name}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <motion.div
                        className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#F4EBFF] to-[#E0E7FF] rounded-lg shadow-md border border-[#E0E7FF] overflow-hidden"
                        style={{
                          backdropFilter: "blur(6px)",
                          WebkitBackdropFilter: "blur(6px)",
                        }}
                      >
                        {/* Shimmer */}
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          initial={{ x: "-100%" }}
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{
                            duration: 2.2,
                            repeat: Infinity,
                            ease: "linear",
                          }}
                          style={{ zIndex: 1 }}
                        />
                        {/* Sparkles/Confetti SVG */}
                        <svg
                          width="40"
                          height="40"
                          className="absolute top-1 left-1 opacity-30"
                          style={{ zIndex: 2 }}
                        >
                          <circle cx="6" cy="6" r="1.5" fill="#A78BFA" />
                          <circle cx="34" cy="10" r="1" fill="#F472B6" />
                          <circle cx="20" cy="34" r="1.2" fill="#60A5FA" />
                        </svg>
                        {/* Gift Icon */}
                        <Gift className="h-7 w-7 text-primary drop-shadow-sm relative z-10" />
                      </motion.div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3
                        className="font-medium text-lg truncate max-w-[200px]"
                        title={gift.name}
                      >
                        {gift.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                          <MoreVertical className="h-4 w-4 text-gray-500" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 bg-white"
                        >
                          <DropdownMenuItem
                            onClick={() => handleAction("view", gift, shipment)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleAction("edit", gift, shipment)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Gift
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="inline-block px-2 py-1 bg-gray-50 rounded-md mb-2">
                        Catalog: {bundleInfo?.bundleName || "N/A"}
                      </div>
                      <p>SKU: {gift.sku}</p>
                      <p>Quantity: {gift.quantitySent}</p>
                      <p>Category: {gift.category}</p>
                      <p>
                        Last Updated:{" "}
                        {new Date(shipment.updatedAt).toLocaleDateString()}
                      </p>
                      <p>
                        Status:{" "}
                        {shipment?.status === "in_stock"
                          ? "In Stock"
                          : shipment?.status === "in_transit"
                          ? "In Transit"
                          : "Flagged"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
      </div>
    );
  };

  // Calculate paginated shipments
  const paginatedRows = () => {
    let filtered = shipments;
    if (statusFilter.length > 0) {
      filtered = shipments.filter((shipment) =>
        statusFilter.includes(shipment.status)
      );
    }
    // Flatten all rows (shipment, gift, bundleInfo, shipmentIdx, giftIdx)
    const allRows =
      filtered
        ?.filter(
          (shipment) =>
            !selectedBundle || selectedBundle === getMongoId(shipment.bundleId)
        )
        .flatMap((shipment, shipmentIdx) =>
          shipment.gifts.map((gift, giftIdx) => ({
            shipment,
            gift,
            bundleInfo: bundles.find(
              (b) => getMongoId(b.bundleId) === getMongoId(shipment.bundleId)
            ),
            shipmentIdx,
            giftIdx,
          }))
        ) || [];
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return allRows.slice(start, end);
  };
  const totalRows =
    shipments
      ?.filter(
        (shipment) =>
          !selectedBundle || selectedBundle === getMongoId(shipment.bundleId)
      )
      .reduce((acc, shipment) => acc + shipment.gifts.length, 0) || 0;
  const totalPages = Math.ceil(totalRows / itemsPerPage);

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden flex-1">
        <div className="p-3 md:p-6 bg-white sm:rounded-tl-3xl h-full overflow-y-auto">
          <PageHeader
            title="Warehouse Activities"
            description="Track and manage inventory stored in Delightloop's warehouse - ready to send anytime."
            primaryButton={{
              text: "Send Your Inventory to Delightloop",
              icon: Plus,
              href: "/dashboard/warehouse-activities/add",
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
                  <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search warehouse activities..."
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
                  <Filter className="h-3.5 w-3.5" />
                  <span className="hidden xs:inline text-sm">Filters</span>
                  {statusFilter.length > 0 && (
                    <span className="bg-primary text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                      {statusFilter.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Desktop: Single row layout */}
            <div className="hidden md:flex flex-row gap-3 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search warehouse activities..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              {/* Catalog Filter for In-Stock Tab */}
              <div className={`${activeTab === "in-stock" ? "block" : "hidden"}`}>
                <select
                  value={selectedBundle}
                  onChange={(e) => setSelectedBundle(e.target.value)}
                  className="w-full md:w-64 px-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">All Catalogs</option>
                  {bundles.map((bundle) => (
                    <option key={bundle.bundleId} value={bundle.bundleId}>
                      {bundle.bundleName}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={() => setShowFilters((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors whitespace-nowrap"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
                {statusFilter.length > 0 && (
                  <span className="bg-primary text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {statusFilter.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Content Container */}
          <div className="mx-4 md:mx-6 lg:mx-8">
            <style jsx global>{`
              @keyframes fadeIn {
                from {
                  opacity: 0;
                }
                to {
                  opacity: 1;
                }
              }
              @keyframes fadeInUp {
                from {
                  opacity: 0;
                  transform: translateY(20px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
              @keyframes cardDeal {
                0% {
                  opacity: 0;
                  transform: translateY(30px) scale(0.95);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0) scale(1);
                }
              }
              .animate-fade-in {
                animation: fadeIn 0.6s ease-out forwards;
              }
              .animate-fade-in-up {
                animation: fadeInUp 0.6s ease-out forwards;
              }
              .animate-card-deal {
                animation: cardDeal 0.5s ease-out forwards;
                opacity: 0;
              }
              .hover-lift {
                transition: transform 0.3s ease, box-shadow 0.3s ease;
              }
              .hover-lift:hover {
                transform: translateY(-4px);
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1),
                  0 4px 6px -2px rgba(0, 0, 0, 0.05);
              }
            `}</style>
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="fixed inset-x-4 md:right-10 md:left-auto top-[280px] md:top-[280px] z-[99999] pointer-events-auto w-auto md:w-[320px] bg-white rounded-xl shadow-2xl border border-gray-200 py-4 px-4 flex flex-col gap-4 animate-fade-in-up">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Status
                  </label>
                  <div className="flex flex-wrap gap-2 py-1">
                    {statusOptions.map((opt) => (
                      <Chip
                        key={opt.value}
                        label={opt.label}
                        selected={statusFilter.includes(opt.value)}
                        onClick={() =>
                          setStatusFilter((prev) =>
                            prev.includes(opt.value)
                              ? prev.filter((s) => s !== opt.value)
                              : [...prev, opt.value]
                          )
                        }
                        icon={opt.icon}
                      />
                    ))}
                  </div>
                </div>
                {statusFilter.length > 0 && (
                  <button
                    className="text-xs text-primary hover:underline px-2 py-1 self-end"
                    onClick={() => setStatusFilter([])}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
                        <div className="hidden md:block overflow-x-auto animate-fade-in-up bg-white rounded-lg shadow-sm" style={{ border: '1px solid #F3F4F6' }}>
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr className="border-b border-[#EAECF0]">
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Gift
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Shipment Id
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      SKU
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Category
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Quantity
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Status
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Last Updated
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]">
                      Key Dates
                    </th>
                    <th className="py-3 px-4 text-left text-xs font-semibold text-[#667085]"></th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 6 }).map((_, idx) => (
                      <tr key={idx} className="border-b border-[#EAECF0] hover:bg-gray-50/30 transition-colors duration-200">
                        <td colSpan={9} className="py-4 px-4">
                          <div className="flex gap-4 items-center">
                            <div className="h-8 w-8 bg-gray-200 rounded-full animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                            <div className="h-4 bg-gray-200 rounded w-1/6 animate-pulse" />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : totalRows === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-8 text-gray-500">
                        No inventory shipments found
                      </td>
                    </tr>
                  ) : (
                    paginatedRows().map(
                      (
                        { shipment, gift, bundleInfo, shipmentIdx, giftIdx },
                        idx
                      ) => (
                        <tr
                          key={`${shipment._id}_${gift._id}`}
                          className="border-b border-[#EAECF0] hover:bg-gray-50/30 hover:shadow-sm transition-all duration-200 ease-out animate-card-deal group"
                          style={{
                            animationDelay: `${
                              (shipmentIdx * 2 + giftIdx) * 100
                            }ms`,
                          }}
                        >
                          <td className="py-4 px-4 text-sm text-[#1B1D21]">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 relative rounded flex items-center justify-center overflow-hidden">
                                {gift.imagesUrl[0] ? (
                                  <Image
                                    src={gift.imagesUrl[0]}
                                    alt={gift.name}
                                    fill
                                    className="object-cover"
                                  />
                                ) : (
                                  <motion.div
                                    className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#F9F5FF] via-[#F4EBFF] to-[#E0E7FF] rounded-lg shadow-md border border-[#E0E7FF] overflow-hidden"
                                    style={{
                                      backdropFilter: "blur(6px)",
                                      WebkitBackdropFilter: "blur(6px)",
                                    }}
                                  >
                                    {/* Shimmer */}
                                    <motion.div
                                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                                      initial={{ x: "-100%" }}
                                      animate={{ x: ["-100%", "100%"] }}
                                      transition={{
                                        duration: 2.2,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                      style={{ zIndex: 1 }}
                                    />
                                    {/* Sparkles/Confetti SVG */}
                                    <svg
                                      width="40"
                                      height="40"
                                      className="absolute top-1 left-1 opacity-30"
                                      style={{ zIndex: 2 }}
                                    >
                                      <circle
                                        cx="6"
                                        cy="6"
                                        r="1.5"
                                        fill="#A78BFA"
                                      />
                                      <circle
                                        cx="34"
                                        cy="10"
                                        r="1"
                                        fill="#F472B6"
                                      />
                                      <circle
                                        cx="20"
                                        cy="34"
                                        r="1.2"
                                        fill="#60A5FA"
                                      />
                                    </svg>
                                    {/* Gift Icon */}
                                    <Gift className="h-7 w-7 text-primary drop-shadow-sm relative z-10" />
                                  </motion.div>
                                )}
                              </div>
                              <span
                                className="font-medium truncate max-w-[150px]"
                                title={gift.name}
                              >
                                {gift.name}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            <span className="text-sm text-[#667085]">
                              {shipment.shipmentInfo?.shipmentId || "-"}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {gift.sku}
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {gift.category}
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex gap-3 items-end">
                              {/* Sent */}
                              <div className="flex flex-col items-center group">
                                <span
                                  className="inline-flex items-center gap-1 text-blue-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                                  title="Sent"
                                >
                                  <Send className="w-3 h-3" />
                                  <span className="font-bold">
                                    {gift.quantitySent}
                                  </span>
                                </span>
                                <span className="text-[10px] text-blue-700 mt-0.5 font-medium tracking-wide">
                                  Sent
                                </span>
                              </div>
                              {/* Received */}
                              <div className="flex flex-col items-center group">
                                <span
                                  className="inline-flex items-center gap-1 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                                  title="Received"
                                >
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="font-bold">
                                    {gift.quantityReceived}
                                  </span>
                                </span>
                                <span className="text-[10px] text-green-700 mt-0.5 font-medium tracking-wide">
                                  Received
                                </span>
                              </div>
                              {/* Flagged */}
                              <div className="flex flex-col items-center group">
                                <span
                                  className="inline-flex items-center gap-1 text-yellow-700 text-xs font-semibold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform"
                                  title="Flagged"
                                >
                                  <Flag className="w-3 h-3" />
                                  <span className="font-bold">
                                    {gift.quantityFlagged}
                                  </span>
                                </span>
                                <span className="text-[10px] text-yellow-700 mt-0.5 font-medium tracking-wide">
                                  Flagged
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={cn(
                                "text-sm px-2.5 py-1 rounded-full",
                                shipment.status === "flagged"
                                  ? "bg-red-50 text-red-600"
                                  : shipment.status === "in_transit"
                                  ? "bg-blue-50 text-blue-600"
                                  : shipment.status === "received"
                                  ? "bg-green-50 text-green-600"
                                  : "bg-gray-100 text-[#1B1D21]"
                              )}
                            >
                              {shipment.status === "flagged"
                                ? "Flagged"
                                : shipment.status === "in_transit"
                                ? "In Transit"
                                : shipment.status === "received"
                                ? "Received"
                                : shipment.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            {new Date(shipment.updatedAt).toLocaleDateString()}
                          </td>
                          <td className="py-4 px-4">
                            <div className="rounded-lg px-0 py-0 flex flex-col gap-1 min-w-[140px]">
                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                <Calendar className="w-4 h-4 text-blue-500" />
                                <span>
                                  Expected:{" "}
                                  <span className="font-semibold">
                                    {formatDate(
                                      shipment.shipmentInfo.expectedDeliveryDate
                                    )}
                                  </span>
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-700">
                                {shipment.shipmentInfo.receivedDate ? (
                                  <CheckCircle className="w-4 h-4 text-green-500" />
                                ) : (
                                  <Clock className="w-4 h-4 text-yellow-500" />
                                )}
                                <span>
                                  Delivered:{" "}
                                  <span className="font-semibold">
                                    {shipment.shipmentInfo.receivedDate ? (
                                      formatDate(
                                        shipment.shipmentInfo.receivedDate
                                      )
                                    ) : (
                                      <span className="text-gray-400">
                                        Pending
                                      </span>
                                    )}
                                  </span>
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-[#667085]">
                            <div className="flex justify-end ">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-full">
                                  <MoreVertical className="h-4 w-4 text-gray-500" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                  align="end"
                                  className="w-48 bg-white"
                                >
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction("view", gift, shipment)
                                    }
                                  >
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      handleAction("edit", gift, shipment)
                                    }
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Gift
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </td>
                        </tr>
                      )
                    )
                  )}
                </tbody>
              </table>
              {totalPages > 1 && (
                <div className="flex flex-wrap justify-between items-center p-4 border-t border-[#EAECF0] mt-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-2 md:px-4 py-2 text-[#667085] font-medium disabled:opacity-50 text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">Previous</span>
                  </button>
                  <div className="flex gap-1 md:gap-2 justify-center">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentPage(i + 1)}
                        className={`w-8 h-8 md:w-10 md:h-10 rounded-full text-sm ${
                          currentPage === i + 1
                            ? "bg-[#F9F5FF] text-[#7F56D9]"
                            : "text-[#667085]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-2 md:px-4 py-2 text-[#667085] font-medium disabled:opacity-50 text-sm md:text-base"
                  >
                    <span className="hidden sm:inline">Next</span>
                  </button>
                </div>
              )}
            </div>
            {/* Mobile Card View */}
            <div className="block md:hidden">{renderGiftCards(shipments)}</div>
          </div>

          {showBundleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg w-full max-w-4xl relative max-h-[90vh] overflow-hidden flex flex-col">
                <button
                  onClick={() => setShowBundleModal(false)}
                  className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="p-6 flex-shrink-0">
                  <h2 className="text-xl font-semibold mb-4">
                    Create New Catalog
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Catalog Name
                      </label>
                      <input
                        type="text"
                        value={formData.bundleName}
                        onChange={(e) =>
                          handleInputChange("bundleName", e.target.value)
                        }
                        placeholder="Enter catalog name"
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Bundle Image
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            handleInputChange("imgUrl", file);
                          }
                        }}
                        className="w-full px-3 py-2 border rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Description
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        placeholder="Enter catalog description"
                        className="w-full px-3 py-2 border rounded-md h-24"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-6 border-t flex-1 overflow-auto">
                  <h3 className="font-medium text-gray-900 mb-4">
                    Select Gifts
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {gifts.map((gift) => (
                      <div
                        key={gift._id}
                        onClick={() => toggleGiftSelection(gift._id)}
                        className={`cursor-pointer border rounded-lg overflow-hidden transition-all ${
                          selectedGifts.has(gift._id)
                            ? "ring-2 ring-primary border-primary"
                            : "hover:border-gray-300"
                        }`}
                      >
                        <div className="relative aspect-video bg-gray-50">
                          {gift.images?.secondaryImgUrl ? (
                            <Image
                              src={gift.images.secondaryImgUrl}
                              alt={gift.name}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="h-full flex items-center justify-center">
                              <Gift className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h4 className="font-medium text-gray-900">
                            {gift.name}
                          </h4>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm text-gray-500">
                              SKU: {gift.sku}
                            </p>
                            <p className="text-sm text-gray-500">
                              Category: {gift.category}
                            </p>
                            <p className="text-sm text-gray-500">
                              Stock: {gift.inventory}
                            </p>
                            {gift.price > 0 && (
                              <p className="text-sm text-gray-500">
                                Price: ${gift.price}
                              </p>
                            )}
                            <p
                              className="text-sm text-gray-500 line-clamp-2"
                              title={gift.descShort}
                            >
                              {gift.descShort}
                            </p>
                          </div>
                          {gift.tags.length > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {gift.tags.map((tag, index) => (
                                <span
                                  key={index}
                                  className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 border-t flex-shrink-0">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-500">
                      {selectedGifts.size} gift
                      {selectedGifts.size !== 1 ? "s" : ""} selected
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowBundleModal(false)}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateBundle}
                        disabled={isLoading || selectedGifts.size === 0}
                        className={`px-4 py-2 bg-primary text-white rounded-md ${
                          isLoading || selectedGifts.size === 0
                            ? "opacity-50 cursor-not-allowed"
                            : "hover:bg-primary/90"
                        }`}
                      >
                        {isLoading ? "Creating..." : "Create Catalog"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {selectedGift && (
            <ViewDetailsModal
              gift={selectedGift.gift}
              shipment={selectedGift.shipment}
              bundleInfo={selectedGift.bundleInfo}
              onClose={() => setSelectedGift(null)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function formatDate(dateString) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
}
