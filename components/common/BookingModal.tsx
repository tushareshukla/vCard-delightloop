import React, { useState, useEffect } from "react";

interface BookingModalProps {
  campaignId: string;
  recipientId: string;
  buttonText?: string;
  buttonClassName?: string;
}

interface MeetingHost {
  hostId: string;
  hostInfo: {
    name: string;
    email: string;
    role: string;
    linkedinUrl: string;
    timezone: string;
  };
  schedule: Array<{
    date: string; // "2025-06-12"
    slots: Array<{
      slotId: string;
      startTime: string; // "09:00"
      endTime: string; // "10:00"
      isBooked: boolean;
      recipientId?: string;
      bookedAt?: string;
    }>;
  }>;
  preferences: {
    slotDuration: number;
    isActive: boolean;
  };
}

interface Campaign {
  _id: string;
  name: string;
  title: string;
  description: string;
  status: string;
  motion: string;
  launchDate: string;
  createdBy: string;
  organization_id: string;
  createdAt: string;
  updatedAt: string;
  creatorUserId: string;
  meetingHosts?: MeetingHost[];
  outcomeCard?: {
    description: string;
    buttonText: string;
    logoLink: string;
    type: string;
    videoLink?: string;
  };
  outcomeTemplate?: {
    description: string;
    buttonText: string;
    logoLink: string;
    type: string;
    videoLink?: string;
  };
}

const BookingModal: React.FC<BookingModalProps> = ({
  campaignId,
  recipientId,
  buttonText = "Book Meeting with Host",
  buttonClassName = "flex w-fit hover:opacity-95 text-lg md:text-xl duration-300 items-center gap-3 bg-violet-600 text-white font-semibold px-4 md:px-5 py-2 md:py-2.5 rounded-lg",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [selectedHost, setSelectedHost] = useState<MeetingHost | null>(null);
  const [hostFilter, setHostFilter] = useState<string>("all");
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [existingBooking, setExistingBooking] = useState<any>(null);

  // Extract meeting hosts from campaign data
  const extractMeetingHosts = (): MeetingHost[] => {
    if (!campaign) return [];

    // Meeting hosts are stored directly on the campaign object
    return campaign.meetingHosts || [];
  };

  const meetingHosts = extractMeetingHosts();

  // Check if the recipient has already booked a slot
  const checkForExistingBooking = () => {
    if (!campaign || !campaign.meetingHosts) {
      setExistingBooking(null);
      return;
    }

    for (const host of campaign.meetingHosts) {
      for (const schedule of host.schedule) {
        for (const slot of schedule.slots) {
          if (slot.isBooked && slot.recipientId === recipientId) {
            setExistingBooking({
              host,
              date: schedule.date,
              slot,
            });
            return;
          }
        }
      }
    }
    setExistingBooking(null);
  };

  // Get all scheduled dates (filtered by host if selected)
  const getScheduledDates = (): string[] => {
    const dates = new Set<string>();
    const hostsToCheck =
      hostFilter === "all"
        ? meetingHosts
        : meetingHosts.filter((h) => h.hostId === hostFilter);

    hostsToCheck.forEach((host) => {
      host.schedule.forEach((scheduleItem) => {
        dates.add(scheduleItem.date);
      });
    });
    return Array.from(dates).sort();
  };

  // Generate calendar days for current month view
  const generateCalendarDays = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();

    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);

    // Start from the Sunday of the week containing the first day
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - startDate.getDay());

    // End at the Saturday of the week containing the last day
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));

    const days: Date[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return days;
  };

  // Navigate months
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((prev) => {
      const newDate = new Date(prev);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  // Get available slots for a specific date (filtered by host if selected)
  const getAvailableSlotsForDate = (dateString: string) => {
    const slots: Array<{ host: MeetingHost; slot: any }> = [];
    const hostsToCheck =
      hostFilter === "all"
        ? meetingHosts
        : meetingHosts.filter((h) => h.hostId === hostFilter);

    hostsToCheck.forEach((host) => {
      const scheduleForDate = host.schedule.find((s) => s.date === dateString);
      if (scheduleForDate) {
        scheduleForDate.slots.forEach((slot) => {
          if (!slot.isBooked) {
            slots.push({ host, slot });
          }
        });
      }
    });

    return slots.sort((a, b) =>
      a.slot.startTime.localeCompare(b.slot.startTime)
    );
  };

  // Fetch campaign data when modal opens
  useEffect(() => {
    const loadCampaignData = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log("Loading campaign data for:", campaignId);

        const response = await fetch(
          `/api/campaigns/${campaignId}?public=true`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch campaign data");
        }

        const data = await response.json();
        console.log("Campaign data loaded:", data);
        setCampaign(data.data);
      } catch (err) {
        console.error("Error loading campaign data:", err);
        setError("Failed to load meeting data");
      } finally {
        setLoading(false);
      }
    };

    loadCampaignData();
  }, [isOpen, campaignId]);

  // Check for existing booking when campaign data changes
  useEffect(() => {
    if (campaign) {
      checkForExistingBooking();
    }
  }, [campaign, recipientId]);

  // Handle booking a meeting slot
  const handleBookMeeting = async () => {
    if (!selectedSlot || !selectedHost || !selectedDate) {
      console.error("Missing booking details");
      return;
    }

    try {
      setIsBooking(true);
      setError(null);

      const bookingData = {
        hostId: selectedHost.hostId,
        slotId: selectedSlot.slotId,
        date: selectedDate,
        recipientId: recipientId,
        bookedAt: new Date().toISOString(),
      };

      console.log("Booking meeting with data:", bookingData);

      const response = await fetch(
        `/api/campaigns/${campaignId}/book-meeting`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(bookingData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to book meeting");
      }

      const result = await response.json();
      console.log("Meeting booked successfully:", result);

      // Update local state to reflect the booking
      setCampaign((prevCampaign) => {
        if (!prevCampaign) return prevCampaign;

        const updatedCampaign = { ...prevCampaign };
        const hostIndex = updatedCampaign.meetingHosts?.findIndex(
          (h) => h.hostId === selectedHost.hostId
        );

        if (
          hostIndex !== undefined &&
          hostIndex >= 0 &&
          updatedCampaign.meetingHosts
        ) {
          const dateIndex = updatedCampaign.meetingHosts[
            hostIndex
          ].schedule.findIndex((s) => s.date === selectedDate);

          if (dateIndex >= 0) {
            const slotIndex = updatedCampaign.meetingHosts[hostIndex].schedule[
              dateIndex
            ].slots.findIndex((slot) => slot.slotId === selectedSlot.slotId);

            if (slotIndex >= 0) {
              updatedCampaign.meetingHosts[hostIndex].schedule[dateIndex].slots[
                slotIndex
              ] = {
                ...updatedCampaign.meetingHosts[hostIndex].schedule[dateIndex]
                  .slots[slotIndex],
                isBooked: true,
                recipientId: recipientId,
                bookedAt: new Date().toISOString(),
              };
            }
          }
        }

        return updatedCampaign;
      });

      setBookingSuccess(true);
      setSelectedSlot(null);
      setSelectedHost(null);
      setSelectedDate("");

      // Check for existing booking after successful booking
      checkForExistingBooking();

      // Auto close modal after 2 seconds
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err) {
      console.error("Error booking meeting:", err);
      setError(err instanceof Error ? err.message : "Failed to book meeting");
    } finally {
      setIsBooking(false);
    }
  };

  const handleOpen = () => {
    setIsOpen(true);
    setLoading(true);
    setError(null);
  };

  const handleClose = () => {
    setError(null);
    setIsOpen(false);
    setSelectedDate("");
    setSelectedSlot(null);
    setSelectedHost(null);
    setIsBooking(false);
    setBookingSuccess(false);
    setExistingBooking(null);
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  // Handle escape key and body scroll
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      // Restore body scroll when modal is closed
      document.body.style.overflow = "unset";
      document.documentElement.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={handleOpen}
        className={`${buttonClassName} ${campaign?.motion === "set_up_meeting" && (campaign?.meetingHosts?.length ?? 0) > 0 ? "" : "hidden"}`}
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {buttonText}
      </button>

      {/* Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
          style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={handleBackdropClick}
          />

          {/* Modal Container */}
          <div className="relative z-[10000] w-full max-w-sm sm:max-w-2xl max-h-[85vh] mx-auto transform overflow-hidden rounded-2xl bg-white p-4 sm:p-6 text-left align-middle shadow-2xl transition-all animate-in fade-in-0 zoom-in-95 duration-300 overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6 bg-primary-xlight p-5 -mt-6 -mx-6 rounded-t-lg">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
                Book a Meeting
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Content */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                <span className="ml-3 text-gray-600">
                  Loading meeting options...
                </span>
              </div>
            ) : error ? (
              <div className="text-center py-12">
                <div className="text-red-600 mb-4">{error}</div>
                <button
                  onClick={handleClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Existing Booking Display */}
                {existingBooking && (
                  <div className="bg-primary/20 border border-primary/30 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-3 mb-3">
                      <svg
                        className="w-5 h-5 text-primary"
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
                      <h4 className="font-semibold text-primary">
                        Meeting Already Booked
                      </h4>
                    </div>
                    <div className="text-sm text-primary space-y-2">
                      <div>
                        <strong>Host:</strong>{" "}
                        {existingBooking.host.hostInfo.name}
                      </div>
                      <div>
                        <strong>Date:</strong>{" "}
                        {(() => {
                          const [year, month, day] = existingBooking.date
                            .split("-")
                            .map(Number);
                          const date = new Date(year, month - 1, day);
                          return date.toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          });
                        })()}
                      </div>
                      <div>
                        <strong>Time:</strong> {existingBooking.slot.startTime}{" "}
                        - {existingBooking.slot.endTime}
                      </div>
                    </div>
                    <p className="text-xs text-primary mt-3">
                      You can only book one meeting per campaign. To change your
                      booking, please contact support.
                    </p>
                  </div>
                )}

                {/* Only show booking interface if no existing booking */}
                {!existingBooking && (
                  <>
                    {/* Host Filter - Compact Pills */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <svg
                          className="w-4 h-4 text-primary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        <h4 className="font-semibold text-gray-900">
                          Choose Expert
                        </h4>
                        <div className="text-xs text-gray-500 ml-auto">
                          {hostFilter === "all"
                            ? "All"
                            : meetingHosts.find((h) => h.hostId === hostFilter)
                                ?.hostInfo.name}{" "}
                          • {getScheduledDates().length} dates
                        </div>
                      </div>

                      {/* Expert Selection Dropdown */}
                      <div className="relative sm:w-96">
                        <select
                          value={hostFilter}
                          onChange={(e) => {
                            setHostFilter(e.target.value);
                            setSelectedDate("");
                            setSelectedSlot(null);
                            setSelectedHost(null);
                          }}
                          className="w-full p-3 pr-10 rounded-lg border border-gray-200 bg-white hover:border-primary/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all duration-200 appearance-none cursor-pointer"
                        >
                          <option value="all">
                             All Experts ({meetingHosts.length} experts
                            available)
                          </option>
                          {meetingHosts.map((host) => {
                            const hostDatesCount = host.schedule.length;
                            const totalSlots = host.schedule.reduce(
                              (total, schedule) =>
                                total +
                                schedule.slots.filter((slot) => !slot.isBooked)
                                  .length,
                              0
                            );
                            return (
                              <option key={host.hostId} value={host.hostId}>
                                {host.hostInfo.name}   ({totalSlots} slots)
                              </option>
                            );
                          })}
                        </select>
                        {/* Custom dropdown arrow */}
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Quick Date Selection - Compact */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-4 h-4 text-primary"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm-6 4a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6z"
                            />
                          </svg>
                          <h4 className="font-semibold text-gray-900">
                            Available Dates
                          </h4>
                        </div>
                        {selectedDate && (
                          <button
                            onClick={() => {
                              setSelectedDate("");
                              setSelectedSlot(null);
                              setSelectedHost(null);
                            }}
                            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 rounded"
                          >
                            Clear
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2 max-h-20 sm:max-h-24 overflow-y-auto">
                        {getScheduledDates()
                          .slice(0, 18)
                          .map((dateString) => {
                            // Parse date correctly to avoid timezone issues
                            const [year, month, day] = dateString
                              .split("-")
                              .map(Number);
                            const date = new Date(year, month - 1, day); // month is 0-indexed
                            const isSelected = selectedDate === dateString;
                            const slotsCount =
                              getAvailableSlotsForDate(dateString).length;

                            return (
                              <button
                                key={dateString}
                                onClick={() => setSelectedDate(dateString)}
                                className={`
                                    p-2 rounded-lg border text-center transition-all duration-200 hover:shadow-sm
                                    ${
                                      isSelected
                                        ? "border-primary bg-primary text-white shadow-sm"
                                        : "border-gray-200 bg-white hover:border-primary/50"
                                    }
                                  `}
                              >
                                <div
                                  className={`text-xs font-bold ${isSelected ? "text-white" : "text-gray-900"}`}
                                >
                                  {date.toLocaleDateString("en-US", {
                                    day: "numeric",
                                  })}
                                </div>
                                <div
                                  className={`text-xs ${isSelected ? "text-white/80" : "text-gray-500"}`}
                                >
                                  {date.toLocaleDateString("en-US", {
                                    month: "short",
                                  })}
                                </div>
                                <div
                                  className={`text-xs leading-tight ${isSelected ? "text-white/70" : "text-primary"}`}
                                >
                                  {slotsCount}
                                </div>
                              </button>
                            );
                          })}
                      </div>

                      {getScheduledDates().length > 18 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{getScheduledDates().length - 18} more in calendar
                          below
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
                      {/* Calendar Section */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          {/* <h4 className="text-lg font-medium text-gray-900">
                              Select Date
                            </h4> */}
                          <div className="flex items-center gap-2 mx-auto">
                            <button
                              onClick={() => navigateMonth("prev")}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              ←
                            </button>
                            <span className="text-sm font-medium px-3">
                              {currentDate.toLocaleDateString("en-US", {
                                month: "long",
                                year: "numeric",
                              })}
                            </span>
                            <button
                              onClick={() => navigateMonth("next")}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              →
                            </button>
                          </div>
                        </div>

                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1">
                          {[
                            "Sun",
                            "Mon",
                            "Tue",
                            "Wed",
                            "Thu",
                            "Fri",
                            "Sat",
                          ].map((day) => (
                            <div
                              key={day}
                              className="text-center text-xs font-medium text-gray-500 py-2"
                            >
                              {day}
                            </div>
                          ))}
                          {generateCalendarDays(currentDate).map(
                            (day, index) => {
                              // Format date correctly to avoid timezone issues
                              const dateString = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, "0")}-${String(day.getDate()).padStart(2, "0")}`;
                              const isCurrentMonth =
                                day.getMonth() === currentDate.getMonth();
                              const hasSlots =
                                getScheduledDates().includes(dateString);
                              const isSelected = selectedDate === dateString;
                              const today = new Date();
                              const todayString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
                              const isToday = dateString === todayString;

                              return (
                                <button
                                  key={index}
                                  onClick={() =>
                                    hasSlots
                                      ? setSelectedDate(dateString)
                                      : null
                                  }
                                  disabled={!hasSlots || !isCurrentMonth}
                                  className={`
                                      aspect-square text-sm rounded-lg transition-colors relative
                                      ${!isCurrentMonth ? "text-gray-300" : ""}
                                      ${
                                        hasSlots && isCurrentMonth
                                          ? "hover:bg-primary/10 cursor-pointer"
                                          : "cursor-not-allowed"
                                      }
                                      ${isSelected ? "bg-primary text-white" : ""}
                                      ${isToday && !isSelected ? "bg-blue-50 text-blue-600" : ""}
                                      ${!hasSlots && isCurrentMonth ? "text-gray-400" : ""}
                                    `}
                                >
                                  {day.getDate()}
                                  {hasSlots && isCurrentMonth && (
                                    <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-green-500 rounded-full" />
                                  )}
                                </button>
                              );
                            }
                          )}
                        </div>
                      </div>

                      {/* Time Slots Section */}
                      <div className="space-y-4">
                        <h4 className="text-lg font-medium text-gray-900">
                          {selectedDate ? "" : ""}
                        </h4>

                        {selectedDate && (
                          <div className="text-sm text-gray-600 mb-4">
                            {(() => {
                              // Parse date correctly to avoid timezone issues
                              const [year, month, day] = selectedDate
                                .split("-")
                                .map(Number);
                              const date = new Date(year, month - 1, day); // month is 0-indexed
                              return date.toLocaleDateString("en-US", {
                                weekday: "long",
                                month: "long",
                                day: "numeric",
                                year: "numeric",
                              });
                            })()}
                          </div>
                        )}

                        <div className="space-y-2 sm:space-y-3 max-h-48 sm:max-h-64 lg:max-h-96 overflow-y-auto">
                          {selectedDate &&
                            (() => {
                              // Get all slots (both available and booked) for the selected date
                              const allSlots: Array<{
                                host: MeetingHost;
                                slot: any;
                              }> = [];
                              const hostsToCheck =
                                hostFilter === "all"
                                  ? meetingHosts
                                  : meetingHosts.filter(
                                      (h) => h.hostId === hostFilter
                                    );

                              hostsToCheck.forEach((host) => {
                                const scheduleForDate = host.schedule.find(
                                  (s) => s.date === selectedDate
                                );
                                if (scheduleForDate) {
                                  scheduleForDate.slots.forEach((slot) => {
                                    allSlots.push({ host, slot });
                                  });
                                }
                              });

                              return allSlots
                                .sort((a, b) =>
                                  a.slot.startTime.localeCompare(
                                    b.slot.startTime
                                  )
                                )
                                .map(({ host, slot }, index) => {
                                  const isBooked = slot.isBooked;
                                  const isSelected =
                                    selectedSlot?.slotId === slot.slotId &&
                                    selectedHost?.hostId === host.hostId;

                                  return (
                                    <div
                                      key={`${host.hostId}-${slot.slotId}`}
                                      className={`
                                          p-3 sm:p-4 border rounded-lg transition-colors
                                          ${
                                            isBooked
                                              ? "border-gray-200 bg-gray-50 cursor-not-allowed opacity-60"
                                              : isSelected
                                                ? "border-primary bg-primary/5 cursor-pointer"
                                                : "border-gray-200 hover:border-gray-300 cursor-pointer"
                                          }
                                        `}
                                      onClick={() => {
                                        if (!isBooked) {
                                          setSelectedSlot(slot);
                                          setSelectedHost(host);
                                        }
                                      }}
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2 sm:gap-3">
                                          <div className="font-medium text-sm sm:text-base text-gray-900">
                                            {slot.startTime} - {slot.endTime}
                                          </div>
                                        </div>
                                        <div
                                          className={`
                                              px-1.5 sm:px-2 py-1 rounded-full text-xs font-medium
                                              ${
                                                isBooked
                                                  ? "bg-primary-xlight text-primary"
                                                  : "bg-green-100 text-green-700"
                                              }
                                            `}
                                        >
                                          {isBooked ? "Booked" : "Available"}
                                        </div>
                                        {/* <div className="text-sm text-gray-500">
                                            {host.preferences.slotDuration} min
                                          </div> */}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        with{" "}
                                        <span className="font-medium">
                                          {host.hostInfo.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center justify-between">
                                        <div className="text-xs text-gray-500">
                                          {host.hostInfo.role}
                                        </div>
                                        {/* {isBooked && (
                                            <div className="flex items-center gap-1 text-xs text-red-600">
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                              />
                                            </svg>
                                            Unavailable
                                          </div>
                                        )} */}
                                      </div>
                                    </div>
                                  );
                                });
                            })()}

                          {selectedDate &&
                            getAvailableSlotsForDate(selectedDate).length ===
                              0 && (
                              <div className="text-center text-gray-500 py-8">
                                No available slots for this date
                              </div>
                            )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Footer */}
            {!loading && !error  && (
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 mt-4 sm:mt-6 pt-3 sm:pt-4 border-t">
                {bookingSuccess ? (
                  <div className="flex items-center gap-2 text-green-600 font-medium">
                    <svg
                      className="w-5 h-5"
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
                    Meeting booked successfully! Closing...
                  </div>
                ) : (
                  <div className={`${existingBooking ? "hidden" : "flex  gap-2"}`}>
                    <button
                      onClick={handleClose}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
                    >
                      Close
                    </button>
                    {!existingBooking && (
                      <button
                        onClick={handleBookMeeting}
                        disabled={!selectedSlot || !selectedHost || isBooking}
                        className={`px-6 py-2 rounded-lg justify-center transition-colors order-1 sm:order-2 flex items-center gap-2 ${
                          selectedSlot && selectedHost && !isBooking
                            ? "bg-primary text-white hover:bg-primary/90"
                            : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        }`}
                      >
                        {isBooking ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                            Booking...
                          </>
                        ) : (
                          "Book Meeting"
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default BookingModal;
