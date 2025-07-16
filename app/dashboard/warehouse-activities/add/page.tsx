"use client";
import AdminSidebar from "@/components/layouts/AdminSidebar";
import PageHeader from "@/components/layouts/PageHeader";
import {
  Gift,
  Plus,
  X,
  Upload,
  Image as ImageIcon,
  ArrowLeft,
  Paperclip,
  FileText,
  File,
  FileImage,
} from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { cn } from "@/lib/utils";
import PersistentLabelTextarea from "@/components/ui/PersistentLabelTextarea";
import Calendar from "@/components/Gift-Recommendations/Calendar";

interface Bundle {
  _id: string;
  bundleName: string;
  imgUrl: string;
  description: string;
  isAvailable: boolean;
  isCustom: boolean;
  giftsList: { giftId: string; vendorId: string }[];
  createdAt: string;
  updatedAt: string;
}

interface BundleResponse {
  success: boolean;
  bundleCount: number;
  data: Bundle[];
}

interface GiftItem {
  sku: string;
  name: string;
  description: string;
  quantity: number;
  image: string;
  imageFile?: File;
  category: string;
  note: string;
}

interface ShipmentDetails {
  shipmentId: string;
  shipmentLabel: string;
  carrier: string;
  trackingUrl: string;
  trackingNumber: string;
  expectedDeliveryDate: string;
  warehouseLocation: string;
  note: string;
  attachments: File[];
  attachmentUrls: string[];
}

export default function AddGifts() {
  const router = useRouter();
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [selectedBundle, setSelectedBundle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    bundle?: string;
    gifts?: string;
    shipment?: string;
    submit?: string;
  }>({});
  const [organizationIdState, setOrganizationIdState] = useState<string | null>(
    null
  );
  const [authTokenState, setAuthTokenState] = useState<string | null>(null);
  const { organizationId, authToken, userId } = useAuth();

  const searchParams = useSearchParams();
  const shipmentId = searchParams?.get("shipmentId") || null;

  useEffect(() => {
    if (organizationId !== null) {
      setOrganizationIdState(organizationId);
    }
    if (authToken !== null) {
      setAuthTokenState(authToken);
    }
  }, [organizationId, authToken]);
  const [orgName, setOrgName] = useState<string>("");
  useEffect(() => {
    if (organizationIdState && authTokenState) {
      const fetchUserData = async () => {
        const orgResponse = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL}/v1/organizations/${organizationId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!orgResponse.ok) {
          throw new Error(
            `Error fetching organization data: ${orgResponse.status}`
          );
        }

        const orgData = await orgResponse.json();
        setOrgName(orgData.name);
      };

      fetchUserData();
      //   fetchBundles();
      if (shipmentId) {
        fetchShipmentDetails(shipmentId).then((shipmentData) => {
          if (shipmentData) {
            // Set bundle
            setSelectedBundle(shipmentData.bundleId);

            // Set gifts
            const transformedGifts = shipmentData.gifts.map((gift: any) => ({
              sku: gift.sku,
              name: gift.name,
              description: gift.descFull,
              quantity: gift.quantitySent,
              image: gift.imagesUrl?.[0] || "",
              category: gift.category,
              note: gift.notes || "",
            }));
            setGiftItems(transformedGifts);

            // Set shipment details
            setShipmentDetails({
              shipmentId: shipmentData.shipmentInfo.shipmentId,
              shipmentLabel: shipmentData.shipmentInfo.shipmentLabel,
              carrier: shipmentData.shipmentInfo.courierName,
              trackingUrl: shipmentData.shipmentInfo.trackingUrl,
              trackingNumber: shipmentData.shipmentInfo.trackingNumber,
              expectedDeliveryDate:
                shipmentData.shipmentInfo.expectedDeliveryDate.split("T")[0],
              warehouseLocation: shipmentData.warehouseLocation,
              note: shipmentData.shipmentInfo.qcNotes || "",
              attachments: [],
              attachmentUrls: shipmentData.shipmentInfo.shipmentDocument || [],
            });
          }
        });
      }
    }
  }, [organizationIdState, authTokenState, shipmentId]);

  //   const fetchBundles = async () => {
  //     try {
  //       const response = await fetch(
  //         `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/bundles`,
  //         {
  //           method: "GET",
  //           headers: {
  //             Authorization: `Bearer ${authTokenState}`,
  //           },
  //         }
  //       );

  //       if (!response.ok) {
  //         throw new Error(`Failed to fetch bundles: ${response.status}`);
  //       }

  //       const data: BundleResponse = await response.json();
  //       setBundles(data.data);
  //       console.log(data);
  //     } catch (error) {
  //       console.error("Failed to fetch bundles:", error);
  //     }
  //   };

  const fetchShipmentDetails = async (shipmentId: string) => {
    try {
      setIsSubmitting(true);
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationIdState}/inventory-shipments/${shipmentId}`,
        {
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch shipment: ${response.status}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error("Failed to fetch shipment:", error);
      setFormErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error ? error.message : "Failed to fetch shipment",
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSKU = () => {
    if (!orgName) return ""; // Return empty if no org name yet

    // Get first 3 letters of org name, convert to uppercase
    const orgPrefix = orgName.substring(0, 3).toUpperCase();

    // Hardcoded warehouse location code
    const warehouseCode = "HUS";

    // Generate 6 digit alphanumeric guid
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let guid = "";
    for (let i = 0; i < 6; i++) {
      guid += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    return `${orgPrefix}${warehouseCode}${guid}`;
  };

  const [giftItems, setGiftItems] = useState<GiftItem[]>([]);

  // Initialize first gift item after getting org name
  useEffect(() => {
    if (orgName && giftItems.length === 0) {
      setGiftItems([
        {
          sku: generateSKU(),
          name: "",
          description: "",
          quantity: 1,
          image: "",
          imageFile: undefined,
          category: "",
          note: "",
        },
      ]);
    }
  }, [orgName]);

  const [shipmentDetails, setShipmentDetails] = useState<ShipmentDetails>({
    shipmentId: "",
    shipmentLabel: "",
    carrier: "",
    trackingUrl: "",
    trackingNumber: "",
    expectedDeliveryDate: "",
    warehouseLocation: "Houston",
    note: "",
    attachments: [],
    attachmentUrls: [],
  });

  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState<Date | null>(
    shipmentDetails.expectedDeliveryDate
      ? new Date(shipmentDetails.expectedDeliveryDate)
      : null
  );

  useEffect(() => {
    // Keep shipmentDetails.expectedDeliveryDate in sync with expectedDeliveryDate
    if (expectedDeliveryDate) {
      updateShipmentDetails(
        "expectedDeliveryDate",
        expectedDeliveryDate.toISOString().split("T")[0]
      );
    }
    // eslint-disable-next-line
  }, [expectedDeliveryDate]);

  const addGiftItem = () => {
    if (!orgName) return; // Don't add if no org name
    setGiftItems([
      ...giftItems,
      {
        sku: generateSKU(),
        name: "",
        description: "",
        quantity: 1,
        image: "",
        imageFile: undefined,
        category: "",
        note: "",
      },
    ]);
  };

  const removeGiftItem = (index: number) => {
    setGiftItems(giftItems.filter((_, i) => i !== index));
  };

  const updateGiftItem = (
    index: number,
    field: keyof GiftItem,
    value: string | number
  ) => {
    const newGiftItems = [...giftItems];
    newGiftItems[index] = { ...newGiftItems[index], [field]: value };
    setGiftItems(newGiftItems);
  };

  const updateShipmentDetails = (
    field: keyof ShipmentDetails,
    value: string | File[]
  ) => {
    setShipmentDetails({ ...shipmentDetails, [field]: value });
  };

  const handleAttachmentUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const existingFiles = shipmentDetails.attachments || [];

      // Validate file count (max 10 total)
      if (existingFiles.length + newFiles.length > 10) {
        setFormErrors((prev) => ({
          ...prev,
          submit: "Maximum 10 files allowed for attachments",
        }));
        return;
      }

      // Validate file sizes (max 10MB per file)
      const oversizedFiles = newFiles.filter(
        (file) => file.size > 10 * 1024 * 1024
      );
      if (oversizedFiles.length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          submit: `Files too large: ${oversizedFiles
            .map((f) => f.name)
            .join(", ")}. Maximum size is 10MB per file.`,
        }));
        return;
      }

      // Validate file types
      const allowedTypes = [
        ".pdf",
        ".doc",
        ".docx",
        ".jpg",
        ".jpeg",
        ".png",
        ".txt",
      ];
      const invalidFiles = newFiles.filter((file) => {
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        return !allowedTypes.includes(fileExtension);
      });

      if (invalidFiles.length > 0) {
        setFormErrors((prev) => ({
          ...prev,
          submit: `Invalid file types: ${invalidFiles
            .map((f) => f.name)
            .join(", ")}. Allowed types: ${allowedTypes.join(", ")}`,
        }));
        return;
      }

      // Clear any previous file-related errors
      setFormErrors((prev) => {
        const { submit, ...others } = prev;
        return others;
      });

      const updatedFiles = [...existingFiles, ...newFiles];
      updateShipmentDetails("attachments", updatedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleAttachmentUpload(files);
    }
  };

  const removeAttachment = (index: number) => {
    const updatedFiles = shipmentDetails.attachments.filter(
      (_, i) => i !== index
    );
    updateShipmentDetails("attachments", updatedFiles);
  };

  const uploadShipmentAttachments = async (shipmentId: string) => {
    if (
      !shipmentDetails.attachments ||
      shipmentDetails.attachments.length === 0
    ) {
      return [];
    }

    try {
      const formData = new FormData();

      // Add all attachment files
      shipmentDetails.attachments.forEach((file) => {
        formData.append("files", file);
      });

      // Add shipment ID
      formData.append("inventoryShipmentId", shipmentId);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/shipment`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authTokenState}`,
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to upload attachments: ${response.status}`);
      }

      const result = await response.json();
      return result.files || [];
    } catch (error) {
      console.error("Failed to upload attachments:", error);
      throw error;
    }
  };

  const validateForm = () => {
    const errors: {
      bundle?: string;
      gifts?: string;
      shipment?: string;
    } = {};

    // Check bundle selection
    // if (!selectedBundle) {
    //   errors.bundle = "Please select a bundle";
    // }

    // Check gifts
    const invalidGifts = giftItems.filter(
      (item) =>
        !item.sku ||
        !item.name ||
        !item.description ||
        !item.category ||
        !item.quantity
    );
    if (invalidGifts.length > 0) {
      errors.gifts =
        "Please fill in all required fields for each gift (SKU, Name, Description, Category, Quantity)";
    }

    // Check shipment details
    const requiredShipmentFields = {
      shipmentId: "Shipment ID",
      shipmentLabel: "Shipment Label",
      trackingNumber: "Tracking Number",
      trackingUrl: "Tracking URL",
      carrier: "Carrier Name",
      expectedDeliveryDate: "Expected Delivery Date",
      warehouseLocation: "Warehouse Location",
    };

    const missingShipmentFields = Object.entries(requiredShipmentFields)
      .filter(([key]) => !shipmentDetails[key as keyof typeof shipmentDetails])
      .map(([_, label]) => label);

    if (missingShipmentFields.length > 0) {
      errors.shipment = `Please fill in required shipment details: ${missingShipmentFields.join(
        ", "
      )}`;
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Step 1: Save shipment data first
      const transformedData = {
        // bundleId: selectedBundle || null,
        gifts: giftItems.map((item) => ({
          sku: item.sku,
          name: item.name,
          descFull: item.description,
          category: item.category,
          quantitySent: parseInt(item.quantity.toString()),
          quantityReceived: 0,
          notes: item.note,
          imagesUrl: [], // Initially empty, will update after upload
        })),
        shipmentInfo: {
          shipmentId: shipmentDetails.shipmentId,
          shipmentLabel: shipmentDetails.shipmentLabel,
          trackingNumber: shipmentDetails.trackingNumber,
          trackingUrl: shipmentDetails.trackingUrl,
          courierName: shipmentDetails.carrier,
          expectedDeliveryDate: shipmentDetails.expectedDeliveryDate,
          receivedDate: null,
          qcNotes: shipmentDetails.note,
          shipmentDocument: shipmentDetails.attachmentUrls, // Include existing attachment URLs
        },
        warehouseLocation: shipmentDetails.warehouseLocation,
      };

      const url = `${
        process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL
      }/v1/organizations/${organizationIdState}/inventory-shipments${
        shipmentId ? `/${shipmentId}` : ""
      }`;
      const method = shipmentId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authTokenState}`,
        },
        body: JSON.stringify(transformedData),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${shipmentId ? "update" : "create"} shipment: ${
            response.status
          }`
        );
      }

      const result = await response.json();
      const newShipmentId = shipmentId || result.data._id;

      // Step 2: Upload images for each gift that has an image
      const imageUploadPromises = giftItems.map(async (item, index) => {
        if (item.imageFile) {
          const formData = new FormData();
          formData.append("file", item.imageFile);
          formData.append("sku", item.sku);
          formData.append("inventoryShipmentId", newShipmentId);

          const uploadResponse = await fetch(
            `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/public/upload/inventory`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${authTokenState}`,
              },
              body: formData,
            }
          );

          if (!uploadResponse.ok) {
            throw new Error(`Failed to upload image for gift ${index + 1}`);
          }

          return uploadResponse.json();
        }
        return null;
      });

      // Wait for all image uploads to complete
      await Promise.all(imageUploadPromises);

      // Step 3: Upload shipment attachments if any
      const uploadedAttachmentUrls = await uploadShipmentAttachments(
        newShipmentId
      );

      console.log(
        `Shipment ${
          shipmentId ? "updated" : "created"
        } successfully with images and attachments`
      );
      router.push("/dashboard/warehouse-activities");
    } catch (error) {
      console.error(
        `Failed to ${shipmentId ? "update" : "create"} shipment:`,
        error
      );
      setFormErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error
            ? error.message
            : `Failed to ${shipmentId ? "update" : "create"} shipment`,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (index: number, file: File) => {
    try {
      // Just update the state with the file and create a temporary preview URL
      const newGiftItems = [...giftItems];
      newGiftItems[index] = {
        ...newGiftItems[index],
        image: URL.createObjectURL(file),
        imageFile: file,
      };
      setGiftItems(newGiftItems);
    } catch (error) {
      console.error("Failed to handle image:", error);
      setFormErrors((prev) => ({
        ...prev,
        submit:
          error instanceof Error ? error.message : "Failed to handle image",
      }));
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  // Helper function to get file type icon
  const getFileTypeIcon = (fileName: string) => {
    const extension = fileName.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return <FileText className="h-4 w-4 text-red-500" />;
      case "doc":
      case "docx":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "jpg":
      case "jpeg":
      case "png":
        return <FileImage className="h-4 w-4 text-green-500" />;
      case "txt":
        return <File className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="flex h-screen flex-col sm:flex-row bg-[#FFFFFF]">
      <AdminSidebar />
      <div className="sm:pt-3 bg-primary w-full overflow-x-hidden">
        <div className="p-6 bg-[#F9FAFB] sm:rounded-tl-3xl h-[100%] overflow-y-auto pb-10 sm:pb-0">
          <div
            className="animate-fade-in-up"
            style={{ animationDelay: "150ms" }}
          >
            <PageHeader
              title={`${
                shipmentId ? "Edit" : "Send"
              } Your Inventory to Delightloop`}
              description="Add multiple gift items and shipment details — we'll handle the storage, tracking, and delivery."
              backLink={{
                text: "Back to Warehouse Activities",
                href: "/dashboard/warehouse-activities"
              }}
              showDivider={true}
              className="pt-2"
            />
          </div>

          <div
            className="mx-4 md:mx-6 lg:mx-8 animate-fade-in-up"
            style={{ animationDelay: "250ms" }}
          >
            {/* Gifts Section */}
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              {/* <div className="grid gap-2 items-center mb-4">
                <h3 className="text-lg font-semibold">Gifts</h3>
                <div className="w-64">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Select Bundle
                  </label>
                  <select
                    value={selectedBundle}
                    onChange={(e) => {
                      setSelectedBundle(e.target.value);
                      setFormErrors((prev) => ({ ...prev, bundle: undefined }));
                    }}
                    className={cn(
                      "w-full px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary",
                      formErrors.bundle ? "border-red-300" : "border-gray-300"
                    )}
                  >
                    <option value="">Select Bundle</option>
                    {bundles.map((bundle) => (
                      <option key={bundle._id} value={bundle._id}>
                        {bundle.bundleName}
                      </option>
                    ))}
                  </select>
                  {formErrors.bundle && (
                    <p className="mt-1 text-xs text-red-500">
                      {formErrors.bundle}
                    </p>
                  )}
                </div>
              </div> */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {giftItems.map((item, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden relative"
                  >
                    {index > 0 && (
                      <button
                        onClick={() => removeGiftItem(index)}
                        className="absolute top-2 right-2 z-10 bg-white rounded-full p-1 shadow-md text-gray-400 hover:text-gray-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}

                    {/* Image URL Input Area */}
                    <div className="relative aspect-video bg-gray-50">
                      {item.image ? (
                        <div className="w-full h-full relative group">
                          <Image
                            width={100}
                            height={100}
                            src={item.image}
                            alt={item.name || "Gift image"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-50 group-hover:flex hidden items-center justify-center">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(
                                e: React.ChangeEvent<HTMLInputElement>
                              ) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  handleImageUpload(index, file);
                                }
                              }}
                              className="hidden"
                              id={`file-upload-${index}`}
                            />
                            <label
                              htmlFor={`file-upload-${index}`}
                              className="cursor-pointer bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                            >
                              Change Image
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4">
                          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-2">
                            <ImageIcon className="h-6 w-6 text-gray-400" />
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(
                              e: React.ChangeEvent<HTMLInputElement>
                            ) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                handleImageUpload(index, file);
                              }
                            }}
                            className="hidden"
                            id={`file-upload-${index}`}
                          />
                          <label
                            htmlFor={`file-upload-${index}`}
                            className="cursor-pointer bg-white text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 mt-2"
                          >
                            Upload Image
                          </label>
                        </div>
                      )}
                    </div>

                    {/* Gift Details */}
                    <div className="p-4">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            SKU
                          </label>
                          <input
                            type="text"
                            disabled={true}
                            value={item.sku}
                            onChange={(e) =>
                              updateGiftItem(index, "sku", e.target.value)
                            }
                            placeholder="8-digit code"
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Gift Name
                          </label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 50) {
                                updateGiftItem(index, "name", value);
                              }
                            }}
                            placeholder="Enter gift name (max 50 characters)"
                            maxLength={50}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            {item.name.length}/50 characters
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Description
                          </label>
                          <textarea
                            value={item.description}
                            onChange={(e) => {
                              const value = e.target.value;
                              if (value.length <= 500) {
                                updateGiftItem(index, "description", value);
                              }
                            }}
                            placeholder="Enter gift description (max 500 characters)"
                            maxLength={500}
                            className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[60px] resize-none"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            {item.description.length}/500 characters
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Quantity
                            </label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateGiftItem(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value)
                                )
                              }
                              min="1"
                              className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 mb-1">
                              Category
                            </label>
                            <select
                              value={item.category}
                              onChange={(e) =>
                                updateGiftItem(
                                  index,
                                  "category",
                                  e.target.value
                                )
                              }
                              className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                              <option value="">Select</option>
                              <option value="electronics">Electronics</option>
                              <option value="clothing">Clothing</option>
                              <option value="books">Books</option>
                              <option value="toys">Toys</option>
                              <option value="home">Home</option>
                              <option value="beauty">Beauty</option>
                              <option value="sports">Sports</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-500 mb-1">
                            Note
                          </label>
                          <PersistentLabelTextarea
                            label="Re-order Instructions: "
                            value={item.note}
                            onChange={(value) => {
                              if (value.length <= 500) {
                                updateGiftItem(index, "note", value);
                              }
                            }}
                            className="resize-none"
                          />
                          <div className="text-xs text-gray-400 mt-1">
                            {item.note.length}/500 characters
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Add Gift Card */}
                <button
                  onClick={addGiftItem}
                  className="h-full min-h-[200px] border-2 border-dashed border-gray-200 rounded-lg flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-gray-600 hover:border-gray-300 transition-colors"
                >
                  <Plus className="h-8 w-8" />
                  <span className="text-sm font-medium">Add Another Gift</span>
                </button>
              </div>
            </div>

            {/* Shipment Details Section */}
            <div className="mb-8 bg-white rounded-lg shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Shipment ID
                  </label>
                  <input
                    type="text"
                    value={shipmentDetails.shipmentId}
                    onChange={(e) =>
                      updateShipmentDetails("shipmentId", e.target.value)
                    }
                    placeholder="8-digit code"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Shipment Label
                  </label>
                  <input
                    type="text"
                    value={shipmentDetails.shipmentLabel}
                    onChange={(e) =>
                      updateShipmentDetails("shipmentLabel", e.target.value)
                    }
                    placeholder="Enter shipment label"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Carrier
                  </label>
                  <input
                    type="text"
                    value={shipmentDetails.carrier}
                    onChange={(e) =>
                      updateShipmentDetails("carrier", e.target.value)
                    }
                    placeholder="Enter carrier name"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tracking Number
                  </label>
                  <input
                    type="text"
                    value={shipmentDetails.trackingNumber}
                    onChange={(e) =>
                      updateShipmentDetails("trackingNumber", e.target.value)
                    }
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Tracking URL
                  </label>
                  <input
                    type="text"
                    value={shipmentDetails.trackingUrl}
                    onChange={(e) =>
                      updateShipmentDetails("trackingUrl", e.target.value)
                    }
                    placeholder="Enter tracking URL"
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Expected Delivery Date
                  </label>
                  <Calendar
                    selectedDate={expectedDeliveryDate || new Date()}
                    onChange={(date) => {
                      // Prevent selecting past dates
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      if (date < today) {
                        setFormErrors((prev) => ({
                          ...prev,
                          shipment:
                            "Estimated Delivery Date cannot be in the past.",
                        }));
                        return;
                      }
                      setFormErrors((prev) => ({
                        ...prev,
                        shipment: undefined,
                      }));
                      setExpectedDeliveryDate(date);
                    }}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Warehouse Location
                  </label>
                  <select
                    value={shipmentDetails.warehouseLocation}
                    onChange={(e) =>
                      updateShipmentDetails("warehouseLocation", e.target.value)
                    }
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Houston">Houston</option>
                    {/* <option value="Dallas">Dallas</option> */}
                    {/* <option value="Austin">Austin</option> */}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Note
                  </label>
                  <textarea
                    placeholder="Add Any Special instructions... (max 1000 characters)"
                    value={shipmentDetails.note}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        updateShipmentDetails("note", value);
                      }
                    }}
                    maxLength={1000}
                    className="w-full px-3 py-1.5 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-primary min-h-[80px] resize-none"
                  />
                  <div className="text-xs text-gray-400 mt-1">
                    {shipmentDetails.note.length}/1000 characters
                  </div>
                </div>

                {/* Attachments Section */}
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    Attachments
                  </label>

                  {/* File Upload Area */}
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-4 transition-colors",
                      isDragOver
                        ? "border-primary bg-primary/5"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
                      onChange={(e) => handleAttachmentUpload(e.target.files)}
                      className="hidden"
                      id="attachment-upload"
                    />
                    <label
                      htmlFor="attachment-upload"
                      className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4"
                    >
                      <Paperclip
                        className={cn(
                          "h-8 w-8 transition-colors",
                          isDragOver ? "text-primary" : "text-gray-400"
                        )}
                      />
                      <span
                        className={cn(
                          "text-sm transition-colors",
                          isDragOver ? "text-primary" : "text-gray-600"
                        )}
                      >
                        {isDragOver
                          ? "Drop files here"
                          : "Click to upload files or drag and drop"}
                      </span>
                      <span className="text-xs text-gray-400">
                        PDF, DOC, DOCX, JPG, PNG, TXT (max 10 files)
                      </span>
                    </label>
                  </div>

                  {/* Display Selected Attachments */}
                  {shipmentDetails.attachments &&
                    shipmentDetails.attachments.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Selected Files ({shipmentDetails.attachments.length}):
                        </p>
                        {shipmentDetails.attachments.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-gray-50 rounded-md p-2"
                          >
                            <div className="flex items-center gap-2">
                              {getFileTypeIcon(file.name)}
                              <span className="text-sm text-gray-700 truncate">
                                {file.name}
                              </span>
                              <span className="text-xs text-gray-400">
                                ({formatFileSize(file.size)})
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeAttachment(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                  {/* Display Existing Attachment URLs (for edit mode) */}
                  {shipmentDetails.attachmentUrls &&
                    shipmentDetails.attachmentUrls.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">
                          Existing Attachments (
                          {shipmentDetails.attachmentUrls.length}):
                        </p>
                        {shipmentDetails.attachmentUrls.map((url, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-blue-50 rounded-md p-2"
                          >
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-blue-500" />
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 hover:text-blue-800 underline truncate"
                              >
                                Attachment {index + 1}
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </div>
            {/* Error Messages */}
            {Object.entries(formErrors).map(
              ([key, error]) =>
                error && (
                  <div
                    key={key}
                    className="mb-4 p-2  bg-red-50 border border-red-200 rounded-md"
                  >
                    <p className="text-red-600 text-xs">{error}</p>
                  </div>
                )
            )}
            {/* Action Buttons */}
            <div className="flex justify-end gap-4 mb-7">
              <Link
                href="/dashboard/inventory"
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                Cancel
              </Link>
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={cn(
                  "px-4 py-2 bg-primary text-white rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary flex items-center",
                  isSubmitting
                    ? "opacity-70 cursor-not-allowed"
                    : "hover:bg-primary/90"
                )}
              >
                {isSubmitting ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Processing...
                  </>
                ) : (
                  "Confirm & Initiate Shipment"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
