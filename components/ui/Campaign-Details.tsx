import { useState, useEffect, use } from "react";
import Button from "@/components/common/Button";
import Image from "next/image";
import { useCallback } from "react";
import InfinityLoader from "@/components/common/InfinityLoader";
import { CampaignDetailsProps, HiddenBlocks } from "@/lib/types/campaign";
import CardButton from "../common/CardButton";
import Cookies from "js-cookie";
import router from "next/router";
import { useAuth } from "@/app/context/AuthContext";

interface EventbriteEvent {
  id: string;
  name: {
    text: string;
    html: string;
  };
  start: {
    timezone: string;
    local: string;
    utc: string;
  };
  end: {
    timezone: string;
    local: string;
    utc: string;
  };
  status: string;
}

interface EventAttendee {
  firstName: string;
  lastName: string;
  mailId: string;
  linkedinUrl: string;
  jobTitle: string;
  companyName: string;
  address: string;
  status: string;
}


export default function CampaignDetails({
  setHiddenBlocks,
  hiddenBlocks,
  campaignId,
  goalOfCampaign,
  setCampaignDataForCreateMorePipeline,
  setGoalOfCampaign,
}: CampaignDetailsProps) {
  const { authToken, userId, userEmail, organizationId, isLoadingCookies } = useAuth();
  const [status, setStatus] = useState({
    goal: false,
    input: false,
  });
  const [createMorePipeline, setCreateMorePipeline] = useState({
    open: false,
    newProductLaunch: false,
    uploadCSV: false,
    // next stage
    newProductLaunchStage: false,
    takeOutCampaignsStage: false,
    existingCampaignsStage: false,
    // third stage
    uploadCSVStage: false,
    fromURLStage: false,
    fromContactListStage: false,
  });
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const [processingMessage, setProcessingMessage] = useState(
    "Processing your data..."
  );
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(false);
  const [error, setError] = useState("");
  const [showEventTable, setShowEventTable] = useState(false);
  const [eventData, setEventData] = useState<EventbriteEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [attendeeData, setAttendeeData] = useState<EventAttendee[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [isLoadingAttendees, setIsLoadingAttendees] = useState(false);
  const [lists, setLists] = useState([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);
  const [selectedListId, setSelectedListId] = useState("");
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [listData, setListData] = useState({
    name: "",
    tags: [] as string[],
    currentTag: ""
  });
  const [levelOneSelectedButton, setLevelOneSelectedButton] = useState("");
  const [campaignData, setCampaignData] = useState<any>(null);
  const [eventAttendeesChildButton, setEventAttendeesChildButton] = useState({ uploadCSV: false, connectEventPlatform: false });
  const [listCreated, setListCreated] = useState(false);
  const [isLoadingCampaignId, setIsLoadingCampaignId] = useState(false)
  useEffect(() => {
    if (!isLoadingCookies) {

      if (!authToken) {
        console.log("No auth token found, redirecting to login...");
        router.push('/');
        return;
      }

      const fetchCampaignData = async () => {
        try {

          console.log("Checking credentials:", { organizationId, campaignId, authToken });

          if (!organizationId || !authToken) {
            console.log("Missing required data");
            return;
          }


          const response = await fetch(`/api/campaigns/${campaignId}`,);

          const data = await response.json();
          console.log("Campaign data fetched:", data?.data);
          setCampaignData(data?.data);
          if (data?.data?.goal === "delight_event_attendees") {
            setStatus({
              ...status,
              goal: true,
            });

            if (data?.data?.subGoals[0]?.description === "delight_event_attendees") {
              if (data?.data?.subGoals[0]?.subGoalName === "Upload CSV") {
                setEventAttendeesChildButton({ uploadCSV: true, connectEventPlatform: false });
                setStatus({ goal: true, input: true });
              }

              if (data?.data?.subGoals[0]?.subGoalName === "Connect Event Platform") {
                setEventAttendeesChildButton({ uploadCSV: false, connectEventPlatform: true });
                setShowEventTable(true);
                setStatus({ goal: true, input: true });
              }
            }
          }
          if (data?.data?.goal === "create_more_pipeline") {
            setCreateMorePipeline({
              ...createMorePipeline,
              open: true,
            });
            if (data?.data?.subGoals[0]?.description === "create_more_pipeline") {
              if (data?.data?.subGoals[1]?.subGoalName === "Upload CSV") {
                setCreateMorePipeline({
                  ...createMorePipeline,
                  open: true,
                  newProductLaunchStage: true,
                  uploadCSVStage: true,
                });
                setStatus({ ...status, input: true });
              }
              if (data?.data?.subGoals[1]?.subGoalName === "From Contact List") {
                setCreateMorePipeline({
                  ...createMorePipeline,
                  open: true,
                  newProductLaunchStage: true,
                  fromContactListStage: true,
                });
              }
              if (data?.data?.subGoals[0]?.subGoalName === "New Product Launch") {
                setCreateMorePipeline({
                  ...createMorePipeline,
                  open: true,
                  newProductLaunchStage: true,
                });

              }

            }
          }
          if (data?.data?.total_recipients > 0) {
            console.log("Found recipients:", data?.data?.total_recipients);
            // setHasExistingRecipients(true);
            setFile({
              name: "File Uploaded",
              size: 1024 // dummy size
            } as File);
            setUploadProgress(100);
            setTimeout(() => {
              setProcessingComplete(true);
              setShouldScrollToBottom(true);
              setHiddenBlocks((prevBlocks: HiddenBlocks) => ({
                ...prevBlocks,
                profileDiscovered: false,
              }));
            }, 1000);
          } else {
            console.log("No recipients found");
            // setHasExistingRecipients(false);
          }



        } catch (error) {
          console.error("Error fetching campaign:", error);
        }
      };

      const generateListName = async (): Promise<string> => {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, "0");
        const minutes = String(now.getMinutes()).padStart(2, "0");
        const date = String(now.getDate()).padStart(2, "0");
        const monthNames = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const month = monthNames[now.getMonth()];
        const year = String(now.getFullYear()).slice(-2);

        let userName = "";

        try {
          const response = await fetch(`/api/users/${userId}`);
          const data = await response.json();
          if (data.success) {
            userName = `${data.data.firstName} ${data.data.lastName}`;
          }
        } catch (error) {
          console.error('Error fetching user:', error);
        }

        return `${userName || userId} ${date}${month}${year} ${hours}-${minutes}`;
      };

      const fetchListName = async () => {
        try {
          const name = await generateListName();
          console.log("Generated list name:", name);
          setListData(prev => ({
            ...prev,
            name: name
          }));
        } catch (error) {
          console.error("Error generating list name:", error);
        }
      };
      setIsLoadingCampaignId(true)
      if (campaignId) {
        setIsLoadingCampaignId(false)
        console.log("CampaignId changed, fetching new data:", campaignId);
        fetchCampaignData();
        fetchListName();
      }
    }
  }, [campaignId, isLoadingCookies]);

  const fetchEventbriteEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await fetch(
        "https://hook.eu2.make.com/kt1u2u1367ib7ov8sfy8xtk3364bjhd2",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ eventbright: "delightloop" }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch events");
      }

      const data = await response.json();
      setEventData(data);
      setError("");
    } catch (err) {
      setError("Failed to load events. Please try again.");
      console.error("Error fetching events:", err);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const fetchEventAttendees = async (eventId: string) => {
    setIsLoadingAttendees(true);
    try {
      const response = await fetch(
        "https://hook.eu2.make.com/6bs5299mk4ssmdcly5rum7bhckdhv8xe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ "event-id": eventId }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch attendees");
      }

      const data = await response.json();

      // Convert attendees data to CSV format
      const headers = [
        "firstName",
        "lastName",
        "mailId",
        "linkedinUrl",
        "jobTitle",
        "companyName",
        "address",
        "phoneNumber",
      ];
      const recipientsData = data.map((attendee: any) => {
        // Get LinkedIn URL from answers if available
        const linkedinUrl =
          attendee.answers?.find(
            (answer: any) =>
              answer.question === "Linkedin Profile URL" && answer.answer
          )?.answer || "";

        // Format shipping address if available
        const shipAddress = attendee.profile?.addresses?.ship;
        const formattedAddress = shipAddress
          ? `${shipAddress.address_1}, ${shipAddress.city}, ${shipAddress.region} ${shipAddress.postal_code}, ${shipAddress.country}`
          : "";

        console.log(
          "Attendee:",
          attendee.profile.first_name,
          "LinkedIn URL:",
          linkedinUrl
        ); // Debug log

        return {
          firstName: attendee.profile.first_name || "",
          lastName: attendee.profile.last_name || "",
          mailId: attendee.email || "",
          linkedinUrl: linkedinUrl,
          jobTitle: "",
          companyName: "",
          address: formattedAddress,
          phoneNumber: attendee.cell_phone || "",
        };
      });

      // Create CSV content
      const csvContent = [
        headers.join(","),
        ...recipientsData.map((row) =>
          headers
            .map(
              (header) =>
                // Escape commas and quotes in the cell content
                `"${(row as any)[header]?.toString().replace(/"/g, '""') || ""
                }"`
            )
            .join(",")
        ),
      ].join("\n");

      // Create FormData with CSV file
      const formData = new FormData();
      formData.append("campaignId", campaignId);
      const csvBlob = new Blob([csvContent], { type: "text/csv" });
      formData.append("file", csvBlob, "attendees.csv");

      //   Save attendees to the backend using the upload endpoint

      console.log("organization_id--------- for upload", organizationId);
      const saveResponse = await fetch(`${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${authToken}`
        },
        body: formData,
      });

      const responseData = await saveResponse.json();

      if (!saveResponse.ok) {
        throw new Error(responseData.error || "Failed to save attendees");
      }
      // setCampaignDataForCreateMorePipeline({
      //     formData,
      //     count: recipientsData.length
      //   });

      setProcessingMessage(
        `Successfully imported ${recipientsData.length} recipients`
      );
      setProcessingComplete(true);
      setShouldScrollToBottom(true);
      setHiddenBlocks((prevBlocks: HiddenBlocks) => ({
        ...prevBlocks,
        profileDiscovered: false,
      }));
    } catch (err) {
      setError("Failed to load attendees. Please try again.");
      console.error("Error fetching attendees:", err);
    } finally {
      setIsLoadingAttendees(false);
    }
  };

  const handleEventSelect = (eventId: string) => {
    setSelectedEventId(eventId);
    fetchEventAttendees(eventId);
  };

  const handleConnectEventPlatform = () => {
    saveCampaignData({
      subGoals: [{
        level: 1,
        subGoalName: "Connect Event Platform",
        description: "delight_event_attendees"
      }]
    });
    setEventAttendeesChildButton({ uploadCSV: false, connectEventPlatform: true });
    setShowEventTable(true);
    setStatus({ ...status, input: true });
    fetchEventbriteEvents();
  };

  const fetchLists = async () => {
    setIsLoadingLists(true);
    try {
      const response = await fetch("/api/lists");
      if (!response.ok) {
        throw new Error("Failed to fetch lists");
      }
      const data = await response.json();
      setLists(data.data);
      setError("");
    } catch (err) {
      setError("Failed to load contact lists. Please try again.");
      console.error("Error fetching lists:", err);
    } finally {
      setIsLoadingLists(false);
    }
  };

  useEffect(() => {
    if (!isLoadingCookies) {
      if (campaignId) {
        setError("");
      }
      if (shouldScrollToBottom) {
        window.scrollTo({
          top: document.documentElement.scrollHeight,
          behavior: "smooth",
        });
        setShouldScrollToBottom(false); // Reset the state
      }
    }
  }, [shouldScrollToBottom, campaignId, isLoadingCookies]);
  // Handles drag enter/leave/over events
  // Updates dragActive state based on drag status
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);
  // Handles file drop event
  // Validates file type (.csv or .xls)
  // Initiates file upload process
  const handleDrop = async (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setDragActive(false);

    if (!campaignId) {
      setError("Please set your campaign name first");
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file) {
      setError(""); // Clear error if exists
      setFile(file);
      await handleUpload(file);
    }
  };
  // Handles file selection via input
  // Validates file type and size
  // Initiates upload process
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!campaignId) {
      setError("Please set your campaign name first");
      return;
    }

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.name.split(".").pop()?.toLowerCase();
      if (fileType === "csv" || fileType === "xls" || fileType === "xlsx") {
        if (file.size <= 2 * 1024 * 1024) {
          setError("");
          setFile(file);
          await handleUpload(file);
        } else {
          setError("File size should be less than 2MB");
        }
      } else {
        setError("Please upload a .csv or .xls file");
      }
    }
  };
  // Displays a sequence of processing messages
  // Shows messages at 1-second intervals
  // Reveals the next section after completion
  // Triggers scroll to bottom
  const startProcessingMessages = useCallback(() => {
    // Show completion message and reveal next section immediately
    setTimeout(() => {
      setProcessingComplete(true);
      setShouldScrollToBottom(true);
      setHiddenBlocks((prevBlocks: HiddenBlocks) => ({
        ...prevBlocks,
        profileDiscovered: false,
      }));
    }, 2000); // Small delay for smooth transition
  }, [setHiddenBlocks]);
  // Handles the actual file upload to the server
  // Creates FormData and sends POST request
  // Updates processing message based on response
  const handleUploadSuccess = async () => {
    setIsUploading(false);

    // Don't proceed if there's an error
    if (error) {
      return;
    }

    // Create contact list only if not already created
    if (!listCreated) {
      try {
        // Get campaign data to get the name
        const campaignResponse = await fetch(`/api/campaigns/${campaignId}`);
        const campaignData = await campaignResponse.json();

        // Get recipients data
        const recipientsResponse = await fetch(`/api/recipients?campaignId=${campaignId}`);
        const recipientsData = await recipientsResponse.json();
        console.log("recipientsData", recipientsData);
        if (!recipientsData.recipients || recipientsData.recipients.length === 0) {
          console.error("No recipients found");
          return;
        }

        // Create the list with contacts
        const response = await fetch("/api/lists/with-contacts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: `${campaignData.data.name}`,
            description: "Auto-generated from campaign CSV import",
            source: {
              manual: false,
              csv: true,
              crm: { type: null }
            },
            contacts: recipientsData.recipients,
            tags: ["campaign-import"],
            metrics: {
              totalRecipients: recipientsData.recipients.length,
              campaignsUsed: 1,
              playbooksUsed: 0
            },
            status: "active",
            usage: {
              campaignIds: [campaignId],
              playbookIds: []
            }
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to create contact list");
        }

        setListCreated(true);
        console.log("Contact list created successfully");
      } catch (error) {
        console.error("Error creating contact list:", error);
      }
    }

    setTimeout(startProcessingMessages, 100);
  };
  const handleAddTag = () => {
    if (!listData.currentTag.trim()) return;

    if (!listData.tags.includes(listData.currentTag.trim())) {
      setListData({
        ...listData,
        tags: [...listData.tags, listData.currentTag.trim()],
        currentTag: ""
      });
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setListData({
      ...listData,
      tags: listData.tags.filter(tag => tag !== tagToRemove)
    });
  };
  const HandleCreateListNCountinue = async () => {
    if (!listData.name) {
      setError("Please enter a list name");
      return;
    }

    try {
      // Fetch recipients using the correct endpoint
      //   const recipientsResponse = await fetch(`/api/recipients?campaignId=${campaignId}`);
      const organizationId = Cookies.get("organization_id");
      const recipientsResponse = await fetch(`${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`, {
        headers: {
          "Authorization": `Bearer ${authToken}`
        }
      });
      if (!recipientsResponse.ok) {
        throw new Error("Failed to fetch recipients");
      }
      const recipientsData = await recipientsResponse.json();

      if (!recipientsData.recipients || recipientsData.recipients.length === 0) {
        throw new Error("No recipients found in campaign");
      }
      setProcessingMessage(`Creating list ${listData.name} with ${recipientsData.recipients.length} recipients`);
      // Create the list with proper format
      const response = await fetch("/api/lists/with-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: listData.name,
          description: "",
          source: {
            manual: true,
            csv: false,
            crm: {
              type: null
            }
          },
          contacts: recipientsData.recipients,
          tags: listData.tags,
          metrics: {
            totalRecipients: recipientsData.recipients.length,
            campaignsUsed: 0,
            playbooksUsed: 0
          },
          status: "active",
          usage: {
            campaignIds: [campaignId],
            playbookIds: []
          }
        }),
      });

      const data = await response.json();
      setProcessingMessage(`Successfully created list ${listData.name} with ${recipientsData.recipients.length} recipients`);

      if (!data.success) {
        setProcessingMessage(data.error || "Failed to create list");
        throw new Error(data.error || "Failed to create list");
      }

      // Clear form data
      setListData({
        name: "",
        tags: [],
        currentTag: ""
      });

      // Continue with the flow
      setTimeout(startProcessingMessages, 100);

    } catch (error) {
      console.error("Error creating list:", error);
      setError("Failed to create list. Please try again.");
    }
  };
  // Handles the actual file upload to the server
  // Creates FormData and sends POST request
  // Updates processing message based on response
  const handleUpload = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    setError(""); // Clear any previous errors
    const formData = new FormData();
    formData.append("file", file);
    formData.append("campaignId", campaignId);
    console.log("formData", formData);
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const data = JSON.parse(xhr.responseText);
        handleUploadSuccess();
        setProcessingMessage(`Successfully imported ${data.count} recipients`);
        setError(""); // Clear any errors on success
      } else {
        const errorData = JSON.parse(xhr.responseText);
        setError(errorData.error || "Upload failed");
        setUploadProgress(100); // Set to 100 to show complete but failed state
        setIsUploading(false);
        setProcessingComplete(false); // Ensure processing is marked as not complete
      }
    });

    xhr.addEventListener("error", () => {
      setError("Network Error: Could not upload file");
      setUploadProgress(100);
      setIsUploading(false);
      setProcessingComplete(false); // Ensure processing is marked as not complete
    });

    xhr.addEventListener("abort", () => {
      setError("Upload Aborted");
      setUploadProgress(100);
      setIsUploading(false);
      setProcessingComplete(false); // Ensure processing is marked as not complete
    });
    // xhr.open("POST", "/api/upload");
    xhr.open("POST", `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/upload`);
    xhr.setRequestHeader("Authorization", `Bearer ${authToken}`);
    xhr.send(formData);
  };

  // Add search filter function
  const filteredLists = lists
    .filter((list) => list.status === "active")
    .filter(
      (list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (list.description &&
          list.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const saveCampaignData = async (data: any) => {
    try {
      console.log(organizationId, "organizationId");
      console.log(authToken, "authToken");

      if (!campaignId || !organizationId || !authToken) {
        console.error("Missing required data");
        return;
      }

      console.log("Saving:", data);

      const response = await fetch(`/api/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${authToken}`,
          },
          body: JSON.stringify(
            data
          ),
        }
      );

      if (!response.ok) throw new Error(`Update failed: ${response.statusText}`);

      return await response.json();
    } catch (error) {
      console.error("Save failed:", error);
      return null;
    }
  };
  const LoadingSpinner = () => (
    <div className="rounded-tl-3xl  h-full w-full bg-transparent">
      <div className="flex  justify-center items-center h-screen flex-col gap-4">
        <div className="scale-[3]">
          <InfinityLoader />
        </div>
        {/* <p className="text-gray-500 font-medium">Loading campaign details...</p> */}
      </div>
    </div>
  );
  return (
    // setCreateMorePipeline({
    //     ...createMorePipeline,
    //     newProductLaunchStage: true,
    //   });
    // ${
    //     createMorePipeline.newProductLaunchStage ? "h-[128vh]" : ""
    //   }
    <div
      className={` w-full   grid place-items-center relative z-10 pb-10  ${hiddenBlocks.profileDiscovered
        ? `min-h-screen max-h-fit  `
        : "h-fit  mt-20 "
        }`}
    >
      {isLoadingCampaignId ? (
        <div className="w-full h-full flex justify-center items-center">
          <LoadingSpinner />
        </div>
      ) : (
        <div className="w-[634px] h-fit">
          {/* //! (1) -------- First content ----------- */}
          <div
            className={`transition-all duration-500  ease-out transform
          ${status.input && status.goal
                ? "-translate-y-6"
                : status.goal || createMorePipeline.open
                  ? "-translate-y-6 "
                  : ""
              }
         `}
          >
            {/* //? main heading */}
            <h1 className=" text-lg leading-[22px] font-semibold text-center  ">
              Let&apos;s get started on crafting the perfect gifting strategy for
              you. 🎁
            </h1>
            {/* //? sub heading */}
            <p className=" text-[15px] font-medium mt-[32px] text-center">
              What&apos;s the main goal of your campaign today? (Select one of the
              options below.)
            </p>
            {/* //? radio buttons */}
            <div className="flex  gap-3 mt-[49px] ">
              <CardButton
                title="Delight Event Attendees"
                image="svgs/Ticket.svg"
                checked={status.goal}
                onClick={() => {
                  setStatus({ ...status, goal: true, input: false });
                  setCreateMorePipeline({ ...createMorePipeline, open: false });
                  setGoalOfCampaign("");
                  setCreateMorePipeline({
                    ...createMorePipeline,
                    open: false,
                    newProductLaunchStage: false,
                    takeOutCampaignsStage: false,
                    existingCampaignsStage: false,
                    uploadCSVStage: false,
                    fromURLStage: false,
                    fromContactListStage: false,
                  });
                  saveCampaignData({ goal: "delight_event_attendees" });
                }}
              />
              <CardButton
                title="Create More Pipeline"
                checked={createMorePipeline.open}
                image="svgs/Handshake.svg"
                onClick={() => {

                  setStatus({ ...status, goal: false, input: false });
                  setCreateMorePipeline({ ...createMorePipeline, open: true });
                  saveCampaignData({ goal: "create_more_pipeline" });
                }}
              />
              <CardButton title="Close Deals Faster" image="svgs/Qr.svg" />
              <CardButton title="Reduce Churn" image="svgs/Flame.svg" />
            </div>
          </div>
          {/* //! ----------------- Second Content ----------- */}
          <div
            className={`transition-all duration-500  ease-out transform
        ${status.goal || createMorePipeline.open
                ? "opacity-100  translate-y-0 h-auto"
                : " opacity-0 h-0 translate-y-10 overflow-hidden"
              }`}
          >
            {/* //? Great choice */}
            <div className="flex text-sm items-start font-medium gap-2.5 ">
              Let&apos;s find the best profiles for your campaign. How would you
              like to start? You can choose one of the options below.
            </div>
            {/* //? radio buttons */}
            <div
              className={`flex gap-3 mt-[22px] w-[734px] justify-center ${createMorePipeline.open ? "-ml-10" : "-ml-8"
                }`}
            >
              {(status.goal) && (
                <>
                  <Button
                    text="Upload CSV"
                    icon="Moon"
                    value="upload_csv"
                    checked={eventAttendeesChildButton.uploadCSV}
                    name="type"
                    onChange={() => {
                      setStatus({ ...status, input: true });
                      setEventAttendeesChildButton({ uploadCSV: true, connectEventPlatform: false });
                      setShowEventTable(false);
                      saveCampaignData({
                        subGoals: [{
                          level: 1,
                          subGoalName: "Upload CSV",
                          description: "delight_event_attendees"
                        }]
                      });
                    }}
                  />
                  {Cookies.get('user_email') == "harsha1@delightloop.com" && (
                    <Button
                      text="Connect Event Platform"
                      icon="Moon"
                      value="connect_event_platform"
                      checked={eventAttendeesChildButton.connectEventPlatform}
                      name="type"
                      disabled={Cookies.get('user_email') == "harsha1@delightloop.com"}
                      onChange={handleConnectEventPlatform}
                    />
                  )}
                </>
              )}

              {createMorePipeline.open && (
                <>
                  <Button
                    text="New Product Launch"
                    icon="Moon"
                    value="new_product_launch"
                    checked={createMorePipeline.newProductLaunchStage}
                    name="create_more_pipeline_1"
                    onChange={() => {
                      setLevelOneSelectedButton("new_product_launch");
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        newProductLaunchStage: true,
                      });
                      setGoalOfCampaign("create more pipeline");
                      saveCampaignData({
                        subGoals: [{
                          level: 1,
                          subGoalName: "New Product Launch",
                          description: "create_more_pipeline"
                        }]
                      });
                    }}
                  />
                  <Button
                    text="Take Out Campaigns"
                    icon="Moon"
                    value="take_out_campaigns"
                    name="create_more_pipeline_1"
                    disabled={true}
                    onChange={() => {
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        takeOutCampaignsStage: true,
                      });
                    }}
                  />
                  <Button
                    text="Existing Campaigns"
                    icon="Moon"
                    value="existing_campaigns"
                    name="create_more_pipeline_1"
                    disabled={true}
                    onChange={() => {
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        existingCampaignsStage: true,
                      });
                    }}
                  />
                </>
              )}
            </div>
          </div>
          {/* //! ----------------- Third Content (this is for create more pipeline) ----------- */}
          <div
            className={`transition-all duration-500 mt-10 ease-out transform
        ${createMorePipeline.newProductLaunchStage
                ? "opacity-100 duration-500 translate-y-0 h-auto"
                : "h-0 opacity-0 translate-y-10"
              }`}
          >
            <div className="flex gap-3 mt-[22px]  justify-center ">
              {createMorePipeline.open && (
                <>
                  <Button
                    text="Upload CSV"
                    icon="Moon"
                    value="upload_csv_new_product_launch"
                    checked={createMorePipeline.uploadCSVStage}
                    name="create_more_pipeline_2"
                    onChange={() => {
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        uploadCSVStage: true,
                        fromURLStage: false,
                        fromContactListStage: false,
                      });

                      setStatus({ ...status, input: true });
                      saveCampaignData(
                        {
                          subGoals: [
                            {
                              level: 1,
                              subGoalName: levelOneSelectedButton,
                              description: "create_more_pipeline"
                            },
                            {
                              level: 2,
                              subGoalName: "Upload CSV",
                              description: "create_more_pipeline"
                            }]
                        });
                    }}
                  />
                  <Button
                    text="From URL"
                    icon="Moon"
                    value="from_url"
                    name="create_more_pipeline_2"
                    disabled={true}
                    onChange={() => {
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        fromURLStage: true,
                      });
                    }}
                  />
                  <Button
                    text="From Contact List"
                    icon="Moon"
                    value="from_contact_list"
                    checked={createMorePipeline.fromContactListStage}
                    name="create_more_pipeline_2"
                    onChange={() => {
                      setCreateMorePipeline({
                        ...createMorePipeline,
                        uploadCSVStage: false,
                        fromURLStage: false,
                        fromContactListStage: true,
                      });
                      setStatus({ ...status, input: false });
                      fetchLists();
                      saveCampaignData({
                        subGoals: [
                          {
                            level: 1,
                            subGoalName: levelOneSelectedButton,
                            description: "create_more_pipeline"
                          },
                          {
                            level: 2,
                            subGoalName: "From Contact List",
                            description: "create_more_pipeline"
                          }
                        ]
                      });
                    }}
                  />
                </>
              )}
            </div>
          </div>

          {/* //! ----------------- Fourth Content ----------- */}
          <div
            className={`transition-all duration-500  ease-out transform
        ${status.input || createMorePipeline.fromContactListStage
                ? "opacity-100 duration-500 translate-y-0 h-auto"
                : "h-0 opacity-0 translate-y-10"
              }`}
          >
            {/* //? thumbs up Great ! please update */}
            {status.input && (
              <>
                {!showEventTable && (
                  <>
                    {/* this is for download template */}

                    <a href="templates/RecepientsTemplate.xlsx" download>
                      <div className="flex items-center gap-2 justify-center cursor-pointer mt-5">
                        <Image
                          src="svgs/Grid.svg"
                          alt="download"
                          width={13}
                          height={13}
                        />
                        <p className="text-sm font-medium text-primary-dark underline underline-offset-1">
                          Download Template
                        </p>
                      </div>
                    </a>
                    <div className="flex items-start text-[14px] gap-[11px] mt-[27px]">

                      <Image
                        src="svgs/ThumbUp.svg"
                        alt="Thumb up"
                        width={20}
                        height={22}
                      />
                      <p className="leading-[17px]">
                        Drag and drop your CSV file, XLS file or click to upload it.
                        Make sure it includes details like job titles, industries,
                        and locations.
                      </p>
                    </div>
                  </>
                )}

                {showEventTable && (
                  <div className="flex items-start text-[14px] gap-[11px] mt-[27px]">
                    <Image
                      src="svgs/ThumbUp.svg"
                      alt="Thumb up"
                      width={20}
                      height={22}
                    />
                    <p className="leading-[17px]">
                      Select an event from the list below to import your
                      attendees. We&apos;ll help you create personalized gifts for
                      each attendee based on their profile.
                    </p>
                  </div>
                )}

                {showEventTable && (
                  <div className="overflow-x-auto rounded-lg border border-[#D2CEFE] mt-8 w-[800px] -ml-20">
                    <table className="w-full bg-white">
                      <thead className="border-b sticky top-0 bg-white z-10 border-[#D2CEFE] text-[#101828] text-xs">
                        <tr className="uppercase">
                          <th className="p-[11px] pt-[19px] text-left pl-6 w-[50px]"></th>
                          <th className="p-[11px] text-left pl-6">Event Name</th>
                          <th className="p-[11px] text-left pl-6">Start Date</th>
                          <th className="p-[11px] text-left pl-6">End Date</th>
                          <th className="p-[11px] text-left px-6">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#D2CEFE]">
                        {isLoadingEvents ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8 w-full">
                              <div className="flex justify-center items-center">
                                <InfinityLoader width={28} height={28} />
                              </div>
                            </td>
                          </tr>
                        ) : eventData.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="text-center py-8">
                              No events found
                            </td>
                          </tr>
                        ) : (
                          eventData.map((event) => (
                            <tr
                              key={event.id}
                              className="hover:bg-[#F7ECFF] transition-colors duration-200"
                            >
                              <td className="p-[11px] pl-6">
                                <input
                                  type="radio"
                                  name="event"
                                  value={event.id}
                                  checked={selectedEventId === event.id}
                                  onChange={() => handleEventSelect(event.id)}
                                  className="h-4 w-4 text-primary focus:ring-primary cursor-pointer rounded-full border-gray-300"
                                />
                              </td>
                              <td className="p-[11px] pl-6 text-sm text-[#101828] font-medium">
                                <div className="flex flex-col">
                                  <span>{event.name.text}</span>
                                </div>
                              </td>
                              <td className="p-[11px] pl-6 text-sm text-[#101828]">
                                {new Date(event.start.local).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </td>
                              <td className="p-[11px] pl-6 text-sm text-[#101828]">
                                {new Date(event.end.local).toLocaleDateString(
                                  "en-US",
                                  {
                                    year: "numeric",
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  }
                                )}
                              </td>
                              <td className="p-[11px] pl-6 text-sm text-[#101828]">
                                <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                  <span className="capitalize">
                                    {event.status}
                                  </span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {!showEventTable && (
                  <>
                    {!file ? (
                      <label
                        htmlFor="file-upload"
                        className={`flex flex-col mt-6 mx-auto group text-primary-light items-center justify-center w-[512px] border border-[#D6BBFB] rounded-lg cursor-pointer bg-[#FCFAFF] py-4 hover:bg-primary/5 transition-all duration-300 ${dragActive ? "border-primary bg-primary/5" : ""
                          } ${error ? "border-red-300" : ""}`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <div className="flex flex-col items-center justify-center w-full">
                          <Image
                            src="svgs/Upload.svg"
                            className={`${dragActive ? "scale-110" : "group-hover:scale-110"
                              } transition-all duration-300`}
                            alt="upload"
                            width={40}
                            height={40}
                          />
                          <p className="mb-2 text-sm mt-3">
                            <span className="font-medium text-default">
                              Click to upload
                            </span>{" "}
                            or drag and drop
                          </p>
                          <p className="text-xs">.xls .csv file (max 2MB)</p>
                        </div>
                        <input
                          id="file-upload"
                          type="file"
                          className="hidden"
                          onChange={handleChange}
                          accept=".csv,.xls,.xlsx"
                        />
                      </label>
                    ) : (
                      <>
                        <div className="mt-5 w-[512px] flex gap-3 items-start mx-auto  bg-white rounded-lg p-4 border border-primary">
                          <Image
                            src="svgs/FileUpload.svg"
                            alt="file upload icon"
                            width={34}
                            height={34}
                            className=""
                          />

                          <div className="flex flex-col items-center gap-1.5 mb-1 w-full">
                            {/* container of file name and right svg */}
                            <div className="flex justify-between items-start w-full">
                              <div className="flex items-center gap-3">
                                <div className="grid">
                                  <span className="text-sm font-medium">
                                    {file?.name ? file.name : "No file selected"}
                                  </span>
                                  <span className="text-xs text-[#667085]">
                                    {file?.size
                                      ? Math.round(file.size / 1024) + " KB"
                                      : "No file selected"}
                                  </span>
                                </div>
                              </div>
                              {/* this will show percentage of file uploading or both if all completed */}
                              {isUploading ? (
                                <div></div>
                              ) : error ? (
                                <button
                                  onClick={() => {
                                    setFile(null);
                                    setError("");
                                    setUploadProgress(0);
                                  }}
                                  className="text-red-500 hover:text-red-600 p-1 rounded"
                                >
                                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                    <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  </svg>
                                </button>
                              ) : (
                                <div className="bg-primary rounded-full text-white h-fit p-0.5">
                                  <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 18 18"
                                    fill="none"
                                  >
                                    <path
                                      d="M14 5L7.125 12L4 8.81818"
                                      stroke="#ffffff"
                                      strokeWidth="3"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </div>
                              )}
                            </div>

                            <div className="flex w-full items-center gap-2.5">
                              <div className="w-[85%] bg-gray-200  rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full transition-all duration-300 ${error ? 'bg-red-500' : 'bg-primary'}`}
                                  style={{ width: `${uploadProgress}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium">
                                {uploadProgress}%
                              </span>
                            </div>
                            {/* {error && (
                            <div className="w-full text-red-500 text-sm mt-2 flex items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z" fill="currentColor"/>
                              </svg>
                              {error}
                            </div>
                          )} */}
                          </div>
                        </div>
                        {/* Success message */}
                        {uploadProgress === 100 && !isUploading && !error && (
                          <div className="flex items-center justify-center gap-2 mt-3 text-sm font-medium text-green-600">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                              <path d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM6.4 12L2.4 8L3.528 6.872L6.4 9.736L12.472 3.664L13.6 4.8L6.4 12Z" fill="currentColor" />
                            </svg>
                            Your CSV file has been imported successfully
                          </div>
                        )}


                      </>
                    )}
                  </>
                )}
              </>
            )}
            {error && (
              <div className="text-red-500 text-sm justify-center font-medium mt-6 flex items-center gap-2">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z"
                    fill="#EF4444"
                  />
                </svg>
                {error}
              </div>
            )}
            {file && uploadProgress === 100 && !error && (
              <div className="mt-8 flex items-center justify-center gap-4">
                {/* if file uploading */}
                {!processingComplete && <InfinityLoader width={28} height={28} />}
                <div
                  className={`text-[15px] font-medium ${processingComplete ? " hidden" : "animate-pulse text-primary"
                    }`}
                >
                  {processingMessage}
                </div>
              </div>
            )}

            {isLoadingAttendees && (
              <div className="mt-8 flex items-center justify-center gap-4">
                <InfinityLoader width={28} height={28} />
                <div className="text-[15px] font-medium animate-pulse text-primary">
                  Processing event attendees...
                </div>
              </div>
            )}

            {createMorePipeline.fromContactListStage && (
              <>
                <div className="mt-8 bg-[#FCFCFD] shadow-sm rounded-md p-4 w-[30rem] mx-auto">

                  <h3 className="text-sm font-medium mb-4">
                    Select contacts from lists
                  </h3>

                  {/* Search Box */}
                  <div className="relative mb-3">
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                    />
                    <svg
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                      width="16"
                      height="16"
                      viewBox="0 0 20 20"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M17.5 17.5L12.5 12.5M14.1667 8.33333C14.1667 11.555 11.555 14.1667 8.33333 14.1667C5.11167 14.1667 2.5 11.555 2.5 8.33333C2.5 5.11167 5.11167 2.5 8.33333 2.5C11.555 2.5 14.1667 5.11167 14.1667 8.33333Z"
                        stroke="currentColor"
                        strokeWidth="1.66667"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>

                  {/* Lists Container */}
                  <div className="h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent border border-gray-100 rounded-lg">
                    {isLoadingLists ? (
                      <div className="flex justify-center items-center py-8">
                        <InfinityLoader width={28} height={28} />
                      </div>
                    ) : filteredLists.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        {searchQuery
                          ? "No matching lists found"
                          : "No active contact lists found"}
                      </div>
                    ) : (
                      <div className="text-sm text-[#344054]">
                        {filteredLists.map((list) => (
                          <label
                            key={list._id}
                            htmlFor={`list-${list._id}`}
                            className="flex items-center gap-2 justify-between px-2 py-2 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                id={`list-${list._id}`}
                                checked={selectedListIds.includes(list._id)}
                                onChange={() => {
                                  setSelectedListIds((prev) => {
                                    if (prev.includes(list._id)) {
                                      return prev.filter((id) => id !== list._id);
                                    } else {
                                      return [...prev, list._id];
                                    }
                                  });
                                }}
                                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                              />
                              <span className="font-medium">{list.name}</span>
                            </div>
                            <div className="text-sm text-gray-500">
                              {list.metrics?.totalRecipients || 0}
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add List Button */}
                  <button
                    className="w-full flex items-center pl-2 gap-2 text-primary font-medium py-2 hover:bg-primary/5 rounded-md transition-colors mt-3"
                    onClick={() => {
                      // Handle add list action
                    }}
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 3.33334V12.6667M12.6667 8H3.33333"
                        stroke="currentColor"
                        strokeWidth="1.33333"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Add List
                  </button>
                </div>

                {/* Continue Button - Moved outside the list box container */}
                <div className="mt-6 w-[30rem] mx-auto">
                  <button
                    disabled={selectedListIds.length === 0}
                    onClick={async () => {
                      if (selectedListIds.length > 0) {
                        try {
                          // Show loading state
                          setProcessingMessage("Processing your lists...");
                          setIsUploading(true);

                          // Call our new API endpoint
                          // const response = await fetch('/api/recipients/from-lists', {
                          //   method: 'POST',
                          //   headers: {
                          //     'Content-Type': 'application/json',
                          //   },
                          //   body: JSON.stringify({
                          //     listIds: selectedListIds,
                          //     campaignId
                          //   }),
                          // });

                          // const data = await response.json();

                          // if (!response.ok) {
                          //   throw new Error(data.error || 'Failed to process lists');
                          // }
                          setCampaignDataForCreateMorePipeline({
                            listIds: selectedListIds,
                            count: selectedListIds.length,
                            type: "contact-lists",
                          });

                          // Update success message
                          setProcessingMessage(
                            `Successfully imported recipients`
                          );
                          setProcessingComplete(true);
                          setIsUploading(false);

                          // Update UI state
                          setHiddenBlocks((prev) => ({
                            ...prev,
                            profileDiscovered: false,
                          }));
                          setShouldScrollToBottom(true);

                          // Force scroll after a small delay to ensure state updates are processed
                          setTimeout(() => {
                            window.scrollTo({
                              top: document.documentElement.scrollHeight,
                              behavior: "smooth",
                            });
                          }, 100);
                        } catch (error) {
                          console.error("Error processing lists:", error);
                          setError(
                            error instanceof Error
                              ? error.message
                              : "Failed to process lists"
                          );
                          setIsUploading(false);
                        }
                      }
                    }}
                    className={`mx-auto flex items-center justify-center gap-2.5 py-2 bg-primary text-white font-semibold px-4 rounded-lg transition-colors text-lg w-fit ${hiddenBlocks.profileDiscovered ? "" : "hidden"
                      } ${selectedListIds.length > 0
                        ? "   hover:bg-primary/95"
                        : " cursor-not-allowed"
                      }`}
                  >
                    <Image
                      src="svgs/Shimmer.svg"
                      alt="Arrow Right"
                      width={20}
                      height={20}
                    />
                    Continue
                  </button>
                </div>

                {/* Show processing message */}
                {isUploading && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <InfinityLoader width={28} height={28} />
                    <div className="text-[15px] font-medium animate-pulse text-primary">
                      {processingMessage}
                    </div>
                  </div>
                )}

                {/* Show error message if any */}
                {error && (
                  <div className="text-red-500 text-sm justify-center font-medium mt-6 flex items-center gap-2">
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M8 0C3.584 0 0 3.584 0 8C0 12.416 3.584 16 8 16C12.416 16 16 12.416 16 8C16 3.584 12.416 0 8 0ZM8.8 12H7.2V10.4H8.8V12ZM8.8 8.8H7.2V4H8.8V8.8Z"
                        fill="#EF4444"
                      />
                    </svg>
                    {error}
                  </div>
                )}
              </>
            )}
          </div>

          {/* //! ----------------- Fifth Content ----------- */}
          {/* <div
    className={`transition-all duration-500  ease-out ${
      status.input
        ? "opacity-100 duration-500 translate-y-0 h-auto"
        : "h-0 opacity-0 translate-y-10"
    }`}
  > */}
          {/* //? Find similar profiles */}
          {/* <button className="flex items-center font-semibold text-xl gap-2 text-white shadow-sm mx-auto mt-10 px-3 py-1.5 rounded-lg bg-primary hover:opacity-95">
      <Image
        src="svgs/Shimmer.svg"
        alt="shimmers"
        className=""
        width={22}
        height={22}
      />
      Find similar profiles
    </button>
    <div className="text-center text-xs mt-3 font-medium">
      You&apos;ll see a progress while I work on it.
    </div>
  </div> */}
        </div>)}
    </div>
  );
}
