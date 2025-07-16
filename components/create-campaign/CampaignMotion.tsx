"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
// Import the EventCardFinal component
import EventCardFinal from "./event-card-final";

interface EventDetails {
  name: string;
  date: string;
  type: string;
  registrantCount: number;
  eventData?: string;
}

// Campaign motion types and descriptions
interface CampaignMotion {
  _id: string;
  name: string;
  type: string;
  eventDate: string;
  location: string;
  eventUrl: string;
  hostCompany: string;
  eventDesc: string;
  targetAudience: string;
  eventTopic: string[];
  agendaSummary: string[];
  speakers: string[];
  serviceFocus: string;
  media: {
    eventLogo: string;
    banner: string;
  };
  eventHashtag: string;
  campaignIds: string[];
  creatorUserId: string;
  organizationId: string;
  __v: number;
}

interface CampaignMotionProps {
  data: {
    name: string;
    description: string;
    id: string;
    goal: string;
    motion?: string;
    eventDetails?: EventDetails;
    boostRegistrationData?: {
      registrationGoal: number;
      perGiftCost: number;
      conversionFactor: number;
      budget?: {
        totalLeads: number;
        creditCost: number;
        giftCost: number;
        totalBudget: number;
      };
    };
    mockEvent?: {
      id: string;
      name: string;
      image: string;
      startDate: string;
      location: string;
      type: string;
      crmConnected: boolean;
      stats: {
        registration: {
          new: number;
          existing: number;
          total: number;
        };
        abmAccounts: {
          new: number;
          existing: number;
          total: number;
        };
        opportunityCoverage: {
          count: number;
          value: number;
          target: number;
        };
      };
    };
  };
  onNext: (data: any) => void;
  campaignId: string;
  authToken: string;
  userId: string;
  organizationId: string;
  eventId: string;
}

// Modal Component for rendering modals outside the component tree
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {children}
      </div>
    </div>,
    document.body
  );
};

// HostScheduleManager Component
interface HostScheduleManagerProps {
  hostIndex: number;
  host: {
    hostId: string;
    hostInfo: {
      name: string;
      email: string;
      role: string;
      linkedinUrl?: string;
      timezone: string;
    };
    schedule: Array<{
      date: string;
      slots: Array<{
        slotId: string;
        startTime: string;
        endTime: string;
        isBooked: boolean;
      }>;
    }>;
    preferences: {
      slotDuration: number;
      isActive: boolean;
    };
  };
  onAddDate: (hostIndex: number, date: string) => void;
  onAddSlot: (
    hostIndex: number,
    dateIndex: number,
    startTime: string,
    endTime: string
  ) => void;
  onRemoveSlot: (
    hostIndex: number,
    dateIndex: number,
    slotIndex: number
  ) => void;
  onRemoveDate: (hostIndex: number, dateIndex: number) => void;
}

const HostScheduleManager: React.FC<HostScheduleManagerProps> = ({
  hostIndex,
  host,
  onAddDate,
  onAddSlot,
  onRemoveSlot,
  onRemoveDate,
}) => {
  const [selectedDate, setSelectedDate] = useState("");
  const [newSlotStart, setNewSlotStart] = useState("09:00");
  const [newSlotEnd, setNewSlotEnd] = useState("10:00");

  const handleAddDate = () => {
    if (selectedDate && !host.schedule.find((s) => s.date === selectedDate)) {
      // Hide any open slot forms before adding new date
      const allSlotForms = document.querySelectorAll('[id^="add-slot-form-"]');
      allSlotForms.forEach((form) => {
        (form as HTMLElement).style.display = "none";
      });

      onAddDate(hostIndex, selectedDate);
      setSelectedDate("");

      // Scroll to bottom of schedule container after adding new date
      setTimeout(() => {
        const scheduleContainer = document.querySelector(
          `#schedule-container-${hostIndex}`
        );
        if (scheduleContainer) {
          scheduleContainer.scrollTo({
            top: scheduleContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  // Check if a date is already selected
  const isDateAlreadySelected = (date: string) => {
    return host.schedule.some((s) => s.date === date);
  };

  // Get list of already selected dates for display
  const getSelectedDates = () => {
    return host.schedule.map((s) => s.date);
  };

  const handleAddSlot = (dateIndex: number) => {
    if (newSlotStart && newSlotEnd && newSlotStart < newSlotEnd) {
      onAddSlot(hostIndex, dateIndex, newSlotStart, newSlotEnd);
      // Reset to next hour
      const nextHour = (parseInt(newSlotEnd.split(":")[0]) + 1)
        .toString()
        .padStart(2, "0");
      setNewSlotStart(newSlotEnd);
      setNewSlotEnd(`${nextHour}:00`);

      // Scroll to bottom of parent schedule container when adding slot
      setTimeout(() => {
        const scheduleContainer = document.querySelector(
          `#schedule-container-${hostIndex}`
        );
        if (scheduleContainer) {
          scheduleContainer.scrollTo({
            top: scheduleContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);
    }
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}:00`).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-4">
      {/* Add New Date */}
      <div className="p-3 border border-gray-200 rounded-lg bg-gray-50">
        <h5 className="font-medium text-sm text-gray-800 mb-2">
          Add Available Date
        </h5>

        {/* Show already selected dates */}
        {host.schedule.length > 0 && (
          <div className="mb-3 p-2 bg-white rounded border">
            <p className="text-xs text-gray-600 mb-1">
              Already configured dates:
            </p>
            <div className="flex flex-wrap gap-1">
              {getSelectedDates().map((date) => (
                <span
                  key={date}
                  className="inline-flex items-center px-2 py-1 bg-primary-xlight text-primary text-xs rounded-full"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3 mr-1"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {formatDate(date)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex space-x-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => {
              const newDate = e.target.value;
              if (!isDateAlreadySelected(newDate)) {
                setSelectedDate(newDate);
              }
            }}
            min={new Date().toISOString().split("T")[0]}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-purple-500 focus:border-purple-500"
          />
          <button
            type="button"
            onClick={handleAddDate}
            disabled={!selectedDate || isDateAlreadySelected(selectedDate)}
            className="px-3 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
          >
            Add Date
          </button>
        </div>

        {/* Warning message for already selected date */}
        {selectedDate && isDateAlreadySelected(selectedDate) && (
          <p className="text-xs text-amber-600 mt-1 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            This date is already configured with time slots
          </p>
        )}
      </div>

      {/* Existing Dates and Slots */}
      <div
        id={`schedule-container-${hostIndex}`}
        className="space-y-3 max-h-96 overflow-y-auto"
      >
        {host.schedule.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4">
            No dates configured yet
          </p>
        ) : (
          host.schedule.map((scheduleDate, dateIndex) => (
            <div
              key={scheduleDate.date}
              className="border border-gray-200 rounded-lg p-3"
            >
              <div className="flex justify-between items-center mb-3">
                <h6 className="font-medium text-sm text-gray-800">
                  {formatDate(scheduleDate.date)}
                </h6>
                <button
                  type="button"
                  onClick={() => onRemoveDate(hostIndex, dateIndex)}
                  className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                  title="Remove date"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>

              {/* Time Slots for this date */}
              <div
                id={`slots-container-${hostIndex}-${dateIndex}`}
                className="space-y-2 mb-3"
              >
                {scheduleDate.slots.map((slot, slotIndex) => (
                  <div
                    key={slot.slotId}
                    className="flex items-center justify-between bg-white p-2 rounded border"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-700">
                        {formatTime(slot.startTime)} -{" "}
                        {formatTime(slot.endTime)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {(host.hostInfo.timezone || "America/New_York")
                          .replace("_", " ")
                          .split("/")
                          .pop()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onRemoveSlot(hostIndex, dateIndex, slotIndex)
                      }
                      className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
                      title="Remove slot"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18"></line>
                        <line x1="6" y1="6" x2="18" y2="18"></line>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Slot UI */}
              {scheduleDate.slots.length === 0 ? (
                /* First slot - show full form */
                <div className="bg-gray-50 p-3 rounded border-t">
                  <h6 className="text-sm font-medium text-gray-700 mb-2">
                    Add your first time slot
                  </h6>
                  <div className="flex space-x-2 items-end">
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        Start Time
                      </label>
                      <input
                        type="time"
                        value={newSlotStart}
                        onChange={(e) => setNewSlotStart(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs text-gray-600 mb-1">
                        End Time
                      </label>
                      <input
                        type="time"
                        value={newSlotEnd}
                        onChange={(e) => setNewSlotEnd(e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddSlot(dateIndex)}
                      disabled={
                        !newSlotStart ||
                        !newSlotEnd ||
                        newSlotStart >= newSlotEnd
                      }
                      className="px-4 py-1 bg-primary text-white rounded hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-sm flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Slot
                    </button>
                  </div>
                </div>
              ) : (
                /* After first slot - show compact "Add one more" button */
                <div className="border-t border-gray-200 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      // Hide any other open slot forms first
                      const allSlotForms = document.querySelectorAll(
                        '[id^="add-slot-form-"]'
                      );
                      allSlotForms.forEach((form) => {
                        (form as HTMLElement).style.display = "none";
                      });

                      // Show the current form
                      const formContainer = document.getElementById(
                        `add-slot-form-${dateIndex}`
                      );
                      if (formContainer) {
                        formContainer.style.display = "block";
                      }
                    }}
                    className="w-full py-2 text-sm text-primary hover:text-primary-dark hover:bg-primary-xlight rounded border border-dashed border-primary/60 hover:border-primary transition-colors flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add one more slot
                  </button>

                  {/* Expandable form */}
                  <div
                    id={`add-slot-form-${dateIndex}`}
                    style={{ display: "none" }}
                    className="bg-gray-50 p-3 rounded mt-2"
                  >
                    <div className="flex space-x-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          Start Time
                        </label>
                        <input
                          type="time"
                          value={newSlotStart}
                          onChange={(e) => setNewSlotStart(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs text-gray-600 mb-1">
                          End Time
                        </label>
                        <input
                          type="time"
                          value={newSlotEnd}
                          onChange={(e) => setNewSlotEnd(e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-purple-500 focus:border-purple-500"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleAddSlot(dateIndex);
                          // Hide the form after adding
                          const formContainer = document.getElementById(
                            `add-slot-form-${dateIndex}`
                          );
                          if (formContainer) {
                            formContainer.style.display = "none";
                          }

                          // Scroll to bottom of the schedule container after adding slot
                          setTimeout(() => {
                            const scheduleContainer = document.querySelector(
                              `#schedule-container-${hostIndex}`
                            );
                            if (scheduleContainer) {
                              scheduleContainer.scrollTo({
                                top: scheduleContainer.scrollHeight,
                                behavior: "smooth",
                              });
                            }
                          }, 100);
                        }}
                        disabled={
                          !newSlotStart ||
                          !newSlotEnd ||
                          newSlotStart >= newSlotEnd
                        }
                        className="px-3 py-1 bg-primary text-white rounded hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed text-sm"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary */}
      {host.schedule.length > 0 && (
        <div className="bg-primary-xlight p-3 rounded-lg border border-primary/60">
          <p className="text-sm text-primary">
            <span className="font-medium">Summary:</span> {host.schedule.length}{" "}
            dates with{" "}
            {host.schedule.reduce(
              (total, date) => total + date.slots.length,
              0
            )}{" "}
            total time slots
          </p>
        </div>
      )}
    </div>
  );
};

const CampaignMotion: React.FC<CampaignMotionProps> = ({
  data,
  onNext,
  campaignId,
  authToken,
  userId,
  organizationId,
  eventId,
}) => {
  // Get event details from props
  // console.log("data", data.eventDetails);
  // console.log("eventId", eventId);
  const eventData = data.mockEvent || {
    name: data.eventDetails?.name,
    image: data.eventDetails?.image || "",
    startDate: data.eventDetails?.date || "",
    location: data.eventDetails?.location || "Virtual Event",
    type: data.eventDetails?.type || "",
    date: data.eventDetails?.date || "",
    crmConnected: false,
    stats: {
      registration: {
        new: Math.floor((data.eventDetails?.registrantCount || 0) * 0.4),
        existing: Math.floor((data.eventDetails?.registrantCount || 0) * 0.6),
        total: data.eventDetails?.registrantCount || 0,
      },
      abmAccounts: {
        new: data.eventDetails?.abmAccounts?.new || 0,
        existing: data.eventDetails?.abmAccounts?.existing || 0,
        total: data.eventDetails?.abmAccounts?.total || 0,
      },
      opportunityCoverage: {
        count: data.eventDetails?.opportunityCoverage?.count || 0,
        value: data.eventDetails?.opportunityCoverage?.value || 0,
        target: data.eventDetails?.opportunityCoverage?.target || 0,
      },
    },
  };
  // console.log("eventData --------------", eventData);

  // Sample event data (in a real app, this would come from props)
  const eventDetails = data.eventDetails || {
    name: "",
    image: "",
    date: "",
    type: "",
    location: "",
    registrantCount: 0,
    eventData: "",
  };

  // Campaign motion options
  const motionOptions: CampaignMotion[] = [
    {
      id: "boost_registration",
      name: "Boost Registration",
      description: "Find more leads for the event and nurture them to join.",
      timing: "pre",
      idealFor: {
        eventType: "Webinars & Virtual Events",
        reason:
          "Increases registration rates for digital events where attendance barriers are low.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      ),
    },
    {
      id: "ensure_attendance",
      name: "Ensure Attendance",
      description:
        "Nurture leads to join event, increasing overall attendance.",
      timing: "pre",
      idealFor: {
        eventType: "All Event Types",
        reason:
          "Reduces no-show rates which are typically high for virtual events.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "set_up_meeting",
      name: "Set up 1:1 Meeting",
      description:
        "Schedule meetings with stakeholders during in-person events.",
      timing: "during",
      idealFor: {
        eventType: "Conferences & Trade Shows",
        reason:
          "Maximizes face-time with key prospects at in-person networking events.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
    // {
    //   id: "vip_box_pickup",
    //   name: "VIP Box Pickup",
    //   description:
    //     "Encourage leads to pick up swag or gift boxes, and convert them at the event.",
    //   timing: "during",
    //   idealFor: {
    //     eventType: "Conferences & Summits",
    //     reason:
    //       "Creates exclusive moments and drives in-person conversions at premium events.",
    //   },
    //   icon: (
    //     <svg
    //       xmlns="http://www.w3.org/2000/svg"
    //       className="h-6 w-6"
    //       fill="none"
    //       viewBox="0 0 24 24"
    //       stroke="currentColor"
    //     >
    //       <path
    //         strokeLinecap="round"
    //         strokeLinejoin="round"
    //         strokeWidth={2}
    //         d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
    //       />
    //     </svg>
    //   ),
    // },
    {
      id: "express_send",
      name: "Express Send",
      description:
        "Quick-send gifts during the event for participation or special recognition.",
      timing: "during",
      idealFor: {
        eventType: "Hybrid Events & Workshops",
        reason:
          "Rewards real-time participation and increases engagement across physical and virtual attendees.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 10V3L4 14h7v7l9-11h-7z"
          />
        </svg>
      ),
    },
    {
      id: "booth_giveaways",
      name: "Booth Giveaways",
      description:
        "Recipients see gifts, scan QR code, add their address, and get them delivered.",
      timing: "during",
      idealFor: {
        eventType: "Trade Shows & Expos",
        reason:
          "Increases booth traffic and lead collection while eliminating logistics of physical swag.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
          />
        </svg>
      ),
    },
    {
      id: "thank_you",
      name: "Thank You",
      description:
        "Express gratitude and maintain relationships after the event concludes.",
      timing: "post",
      idealFor: {
        eventType: "All Event Types",
        reason:
          "Improves follow-up conversion rates and extends the impact of your event investment.",
      },
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
          />
        </svg>
      ),
    },
  ];

  const [formData, setFormData] = useState({
    name: ``,
    description: "",
    motion: "",
  });

  const [errors, setErrors] = useState({
    name: "",
    description: "",
    motion: "",
  });

  // Add filter state
  const [activeFilter, setActiveFilter] = useState<
    "pre" | "during" | "post" | null
  >(null);

  // Filtered motion options
  const filteredMotions = activeFilter
    ? motionOptions.filter((motion) => motion.timing === activeFilter)
    : motionOptions;

  // Add animation state
  const [animationComplete, setAnimationComplete] = useState(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [totalContacts, setTotalContacts] = useState(0);
  // Setup animation on mount
  useEffect(() => {
    const fetchLists = async () => {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/events/${eventId}/lists`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${authToken}`,
              "Content-Type": "application/json",
            },
          }
        );
        const data = await response.json();

        // Check if the response has the expected structure
        if (data?.lists?.length > 0 && data.lists[0]?.contacts?.length) {
          setTotalContacts(data.lists[0].contacts.length);
          console.log("Total contacts:", data.lists[0].contacts.length);
        } else {
          console.log("No contacts found in response:", data);
          setTotalContacts(0);
        }
      } catch (error) {
        console.error("Error fetching lists:", error);
        setTotalContacts(0);
      }
    };
    if (eventId && organizationId) {
      fetchLists();
    }
    // Clear previous timeout if it exists
    if (animationTimeoutRef.current) {
      clearTimeout(animationTimeoutRef.current);
    }

    // Set animation to complete after all cards have animated in
    animationTimeoutRef.current = setTimeout(() => {
      setAnimationComplete(true);
    }, 1000); // Slightly longer than the last card's delay

    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [eventId, organizationId]);

  // Get animation delay based on index
  const getAnimationDelay = (index: number) => {
    return `${100 + index * 70}ms`;
  };

  // Use this to determine if animation has completed for a card
  const isCardVisible = (index: number) => {
    // If animation is complete, all cards should be visible
    if (animationComplete) return true;

    // Otherwise, determine based on time elapsed from mount
    const currentTime = Date.now();
    const mountTime = useRef(Date.now()).current;
    const cardAnimationTime = 100 + index * 70 + 500; // delay + animation duration

    return currentTime - mountTime > cardAnimationTime;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    const trimmedValue = value.trim();

    // For campaign name, only update if there's actual content after trimming
    if (name === "name") {
      setFormData({
        ...formData,
        [name]: value, // Keep the actual value for display
      });

      // Show error if empty after trimming
      if (!trimmedValue) {
        setErrors({
          ...errors,
          [name]: "Campaign name cannot be empty or just spaces",
        });
      } else {
        // Clear error if valid
        setErrors({
          ...errors,
          [name]: "",
        });
      }
    } else {
      // For other fields, handle normally
      setFormData({
        ...formData,
        [name]: value,
      });

      // Clear error when user types
      if (errors[name as keyof typeof errors]) {
        setErrors({
          ...errors,
          [name]: "",
        });
      }
    }
  };

  // Define default values as a constant
  const DEFAULT_BOOST_REGISTRATION = {
    registrationGoal: 30,
    perGiftCost: 15,
    conversionFactor: 3,
  };

  // State for Boost Registration specific fields - initialize with default values
  const [boostRegistrationData, setBoostRegistrationData] = useState(
    DEFAULT_BOOST_REGISTRATION
  );

  // Calculate initial budget based on default values
  const getInitialBudget = () => {
    const { registrationGoal, perGiftCost, conversionFactor } =
      DEFAULT_BOOST_REGISTRATION;
    const totalLeads = registrationGoal * conversionFactor;
    const creditCost = totalLeads * 0.1;
    const giftCost = totalLeads * perGiftCost;
    const totalBudget = creditCost + giftCost;
    return {
      totalLeads,
      creditCost,
      giftCost,
      totalBudget,
    };
  };

  // State for animated counter values - initialize with calculated values
  const [animatedValues, setAnimatedValues] = useState(getInitialBudget());

  // Add useEffect to initialize values when motion is selected
  useEffect(() => {
    console.log("[Motion Selection Effect] Current motion:", formData.motion);
    if (formData.motion === "boost_registration") {
      console.log("[Motion Selection Effect] Setting default values");
      setBoostRegistrationData(DEFAULT_BOOST_REGISTRATION);
      setAnimatedValues(getInitialBudget());
    }
  }, [formData.motion]);

  console.log(
    "[Component State] boostRegistrationData:",
    boostRegistrationData
  );
  console.log("[Component State] animatedValues:", animatedValues);
  console.log("[Component State] formData:", formData);

  // Calculate budget for Boost Registration
  const calculateBudget = () => {
    if (formData.motion !== "boost_registration") {
      console.log("[calculateBudget] Not boost registration motion, skipping");
      return null;
    }

    const { registrationGoal, perGiftCost, conversionFactor } =
      boostRegistrationData;
    console.log("[calculateBudget] Input values:", {
      registrationGoal,
      perGiftCost,
      conversionFactor,
    });

    const totalLeads = registrationGoal * conversionFactor;
    const creditCost = totalLeads * 0.1; // 1 credit = $0.10
    const giftCost = totalLeads * perGiftCost;
    const totalBudget = creditCost + giftCost;

    const budget = {
      totalLeads,
      creditCost,
      giftCost,
      totalBudget,
    };
    console.log("[calculateBudget] Calculated budget:", budget);
    return budget;
  };

  // Update animated values with a counter effect
  useEffect(() => {
    console.log("[Animation Effect] Current motion:", formData.motion);
    console.log(
      "[Animation Effect] Current boostRegistrationData:",
      boostRegistrationData
    );
    console.log("[Animation Effect] Current animatedValues:", animatedValues);

    if (formData.motion !== "boost_registration") {
      console.log(
        "[Animation Effect] Not boost registration motion, skipping animation"
      );
      return;
    }

    const budget = calculateBudget();
    if (!budget) {
      console.log(
        "[Animation Effect] No budget calculated, skipping animation"
      );
      return;
    }

    console.log("[Animation Effect] Starting animation with budget:", budget);

    // Immediately set initial values if they're zero
    if (animatedValues.totalLeads === 0) {
      console.log("[Animation Effect] Setting initial values immediately");
      setAnimatedValues(budget);
      return;
    }

    // Animate from current values to new values
    const duration = 500; // milliseconds
    const steps = 20;
    const interval = duration / steps;

    let step = 0;

    const initialValues = { ...animatedValues };
    const targetValues = {
      totalLeads: budget.totalLeads,
      creditCost: budget.creditCost,
      giftCost: budget.giftCost,
      totalBudget: budget.totalBudget,
    };

    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setAnimatedValues(targetValues);
        clearInterval(timer);
        return;
      }

      const progress = step / steps;
      setAnimatedValues({
        totalLeads: Math.round(
          initialValues.totalLeads +
            (targetValues.totalLeads - initialValues.totalLeads) * progress
        ),
        creditCost:
          initialValues.creditCost +
          (targetValues.creditCost - initialValues.creditCost) * progress,
        giftCost:
          initialValues.giftCost +
          (targetValues.giftCost - initialValues.giftCost) * progress,
        totalBudget:
          initialValues.totalBudget +
          (targetValues.totalBudget - initialValues.totalBudget) * progress,
      });
    }, interval);

    return () => clearInterval(timer);
  }, [boostRegistrationData, formData.motion]);

  // Handle slider change for Boost Registration fields
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = Number(value);

    setBoostRegistrationData({
      ...boostRegistrationData,
      [name]: numericValue,
    });
  };

  // Handle input change for Boost Registration fields
  const handleBoostRegistrationInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    const numericValue = Number(value);

    // Set minimum and maximum values based on the field
    const limits = {
      registrationGoal: { min: 10, max: 1000 },
      perGiftCost: { min: 5, max: 100 },
      conversionFactor: { min: 1, max: 10 },
    };

    // Ensure the value is within limits
    const field = name as keyof typeof limits;
    const limitedValue = Math.max(
      limits[field].min,
      Math.min(numericValue, limits[field].max)
    );

    if (!isNaN(numericValue)) {
      setBoostRegistrationData({
        ...boostRegistrationData,
        [name]: limitedValue,
      });
    }
  };

  const handleMotionSelect = (motionId: string) => {
    console.log("[handleMotionSelect] Selected motion:", motionId);

    // Find the selected motion
    const selectedMotion = motionOptions.find(
      (motion) => motion.id === motionId
    );
    console.log("[handleMotionSelect] Found motion:", selectedMotion);

    setFormData((prev) => {
      const newData = {
        ...prev,
        motion: motionId,
        name: selectedMotion
          ? `${eventDetails.name} ${selectedMotion.name}`
          : prev.name,
        description: "",
      };
      console.log("[handleMotionSelect] Setting form data:", newData);
      return newData;
    });
  };

  const validateForm = () => {
    const newErrors = {
      name: formData.name ? "" : "Campaign name is required",
      // Remove description validation since we no longer need it
      description: "",
      motion: formData.motion ? "" : "Please select a campaign motion",
    };

    // Add validation for Boost Registration fields if that motion is selected
    if (formData.motion === "boost_registration") {
      if (boostRegistrationData.registrationGoal <= 0) {
        newErrors.motion = "Registration goal must be greater than 0";
      } else if (boostRegistrationData.perGiftCost <= 0) {
        newErrors.motion = "Per gift cost must be greater than 0";
      } else if (boostRegistrationData.conversionFactor <= 0) {
        newErrors.motion = "Conversion factor must be greater than 0";
      }
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((error) => error !== "");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (validateForm()) {
      const dataToSubmit: any = {
        ...formData,
        eventDetails,
      };

      // Add Boost Registration specific data if that motion is selected
      if (formData.motion === "boost_registration") {
        dataToSubmit.boostRegistrationData = {
          ...boostRegistrationData,
          budget: calculateBudget(),
        };
      }

      onNext(dataToSubmit);
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getTimingColor = (timing: "pre" | "during" | "post") => {
    return "bg-purple-100 text-purple-800";
  };

  const getTimingLabel = (timing: "pre" | "during" | "post") => {
    switch (timing) {
      case "pre":
        return "Pre-Event";
      case "during":
        return "During Event";
      case "post":
        return "Post-Event";
      default:
        return "";
    }
  };

  // Handle filter clicks
  const handleFilterClick = (timing: "pre" | "during" | "post") => {
    setActiveFilter(activeFilter === timing ? null : timing);
  };

  // Get recommendation based on event type
  const getRecommendation = () => {
    switch (eventDetails.type) {
      case "Webinar":
        return {
          title: "Recommended for Webinars",
          motions: ["ensure_attendance", "thank_you"],
          description:
            'For webinars, both "Ensure Attendance" and "Thank You" are highly effective at reducing no-shows and maintaining relationships.',
        };
      case "Conference":
        return {
          title: "Recommended for Conferences",
          motions: ["vip_box_pickup"],
          description:
            'For in-person conferences, "VIP Box Pickup" creates an engaging experience that drives in-person conversions.',
        };
      case "Trade Show":
        return {
          title: "Recommended for Trade Shows",
          motions: ["booth_giveaways"],
          description:
            'For trade shows, "Booth Giveaways" helps attract more traffic to your booth and collect qualified leads.',
        };
      default:
        return {
          title: "Popular Choice",
          motions: ["thank_you", "ensure_attendance"],
          description:
            'Both "Thank You" and "Ensure Attendance" campaigns are strong strategies to maintain relationships and increase participation.',
        };
    }
  };

  // Get card gradient based on timing
  const getCardGradient = (timing: "pre" | "during" | "post") => {
    // Use an even lighter gradient with more contrast
    return "bg-gradient-to-r from-purple-200 via-purple-100 to-indigo-100";
  };

  // Get card text color based on timing (since background is now dark)
  const getCardTextColor = () => {
    return "text-white";
  };

  // Get card border color based on timing - adding enhanced shadows
  const getCardBorder = (motion: CampaignMotion) => {
    const isRecommendedMotion = isRecommended(motion.id);

    if (formData.motion === motion.id) {
      return "border-2 border-purple-300 shadow-[0_15px_30px_rgba(120,87,255,0.3)]";
    } else if (isRecommendedMotion) {
      return "border-2 border-purple-300 shadow-[0_15px_30px_rgba(120,87,255,0.3)]";
    } else {
      return "border border-gray-100 shadow-[0_10px_20px_rgba(120,87,255,0.15)]";
    }
  };

  // Get tag border color based on timing
  const getTagBorder = (timing: "pre" | "during" | "post") => {
    return "border border-purple-300 shadow-sm shadow-purple-200";
  };

  // Get icon color based on timing
  const getIconBackground = (motion: CampaignMotion) => {
    const isSelected = formData.motion === motion.id;

    if (isSelected) {
      return "bg-primary text-white";
    }

    return "bg-purple-100 text-purple-600";
  };

  // Get animation class for filter button
  const getFilterAnimation = (timing: "pre" | "during" | "post") => {
    return activeFilter === timing ? "scale-110 shadow-md" : "";
  };

  // Recommendation data
  const recommendation = getRecommendation();

  // Check if motion is recommended for current event type
  const isRecommended = (motionId: string) => {
    return recommendation.motions.includes(motionId);
  };

  // Get recommendation tooltip text
  const getRecommendationText = (motionId: string) => {
    if (!isRecommended(motionId)) return "";

    switch (eventDetails.type) {
      case "Webinar":
        return "Best for webinars: Reduces no-shows and increases participation";
      case "Conference":
        return "Ideal for conferences: Creates VIP experiences and drives conversions";
      case "Trade Show":
        return "Perfect for trade shows: Attracts booth traffic and qualifies leads";
      default:
        return "Recommended strategy for this event type";
    }
  };
  const [submitLoading, setSubmitLoading] = useState(false);
  const defaultDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const [selectedDate, setSelectedDate] = useState(defaultDate);
  if (selectedDate === "") {
    setSelectedDate(defaultDate);
  }
  const [errorForRequiredFields, setErrorForRequiredFields] = useState("");
  const SaveCampaignName = async () => {
    if (!authToken || !userId || !organizationId || !campaignId) {
      console.error("Missing required auth details or campaign ID");
      return;
    }

    const trimmedName = formData.name.trim();
    if (!trimmedName) {
      setErrorForRequiredFields("Campaign name cannot be empty or just spaces");
      return;
    }

    if (eventId !== "1" && formData.motion === "") {
      setErrorForRequiredFields("Please select a campaign motion");
      return;
    }
    if (selectedDate === "") {
      setErrorForRequiredFields("Please select a campaign date");
      return;
    }

    // Validate boost registration data if motion is boost_registration
    if (formData.motion === "boost_registration") {
      if (
        !boostRegistrationData.registrationGoal ||
        boostRegistrationData.registrationGoal < 10
      ) {
        setErrorForRequiredFields("Registration goal must be at least 10");
        return;
      }
      if (
        !boostRegistrationData.perGiftCost ||
        boostRegistrationData.perGiftCost < 5
      ) {
        setErrorForRequiredFields("Per gift cost must be at least $5");
        return;
      }
      if (
        !boostRegistrationData.conversionFactor ||
        boostRegistrationData.conversionFactor < 1
      ) {
        setErrorForRequiredFields("Conversion factor must be at least 1");
        return;
      }
    }

    // Validate meeting hosts data if motion is set_up_meeting
    if (formData.motion === "set_up_meeting") {
      if (meetingHosts.length === 0) {
        setErrorForRequiredFields("Please add at least one meeting host");
        return;
      }

      for (let i = 0; i < meetingHosts.length; i++) {
        const host = meetingHosts[i];
        if (!host.hostInfo.name.trim()) {
          setErrorForRequiredFields(`Please enter name for Host ${i + 1}`);
          return;
        }
        if (!host.hostInfo.email.trim()) {
          setErrorForRequiredFields(`Please enter email for Host ${i + 1}`);
          return;
        }
        if (!host.hostInfo.role.trim()) {
          setErrorForRequiredFields(`Please enter role for Host ${i + 1}`);
          return;
        }
        if (host.schedule.length === 0) {
          setErrorForRequiredFields(
            `Please add availability schedule for ${host.hostInfo.name}`
          );
          return;
        }

        let totalSlots = 0;
        for (const scheduleDate of host.schedule) {
          totalSlots += scheduleDate.slots.length;
        }
        if (totalSlots === 0) {
          setErrorForRequiredFields(
            `Please add time slots for ${host.hostInfo.name}`
          );
          return;
        }
      }
    }

    setSubmitLoading(true);
    try {
      const updatePayload =
        eventId === "1"
          ? {
              name: formData.name,
              deliverByDate: selectedDate,
              eventStartDate: new Date().toISOString().split("T")[0],
            }
          : {
              name: formData.name,
              motion: formData.motion,
              deliverByDate: selectedDate,
              eventStartDate: data.eventDetails?.date,
              ...(formData.motion === "boost_registration" && {
                boostRegistration: {
                  registrationGoal: Number(
                    boostRegistrationData.registrationGoal
                  ),
                  perGiftCost: Number(boostRegistrationData.perGiftCost),
                  conversionFactor: Number(
                    boostRegistrationData.conversionFactor
                  ),
                },
              }),
              ...(formData.motion === "set_up_meeting" && {
                meetingHosts: meetingHosts.map((host) => ({
                  hostId: host.hostId,
                  hostInfo: {
                    name: host.hostInfo.name.trim(),
                    email: host.hostInfo.email.trim(),
                    role: host.hostInfo.role.trim(),
                    timezone: host.hostInfo.timezone,
                    ...(host.hostInfo.linkedinUrl && {
                      linkedinUrl: host.hostInfo.linkedinUrl.trim(),
                    }),
                  },
                  schedule: host.schedule.map((scheduleDate) => ({
                    date: scheduleDate.date,
                    slots: scheduleDate.slots.map((slot) => ({
                      slotId: slot.slotId,
                      startTime: slot.startTime,
                      endTime: slot.endTime,
                      isBooked: false,
                    })),
                  })),
                  preferences: {
                    slotDuration: host.preferences.slotDuration,
                    isActive: host.preferences.isActive,
                  },
                })),
              }),
            };

      console.log("Sending update payload:", updatePayload);

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updatePayload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error_message ||
            `Failed to update campaign: ${response.status}`
        );
      }

      const updatedCampaign = await response.json();
      console.log("Campaign updated successfully:", updatedCampaign);

      // Call onNext with the updated data
      onNext({
        name: formData.name,
        motion: formData.motion,
        ...(formData.motion === "boost_registration" && {
          boostRegistration: {
            registrationGoal: Number(boostRegistrationData.registrationGoal),
            perGiftCost: Number(boostRegistrationData.perGiftCost),
            conversionFactor: Number(boostRegistrationData.conversionFactor),
          },
        }),
        ...(formData.motion === "set_up_meeting" && {
          meetingHosts: meetingHosts,
        }),
      });
      setSubmitLoading(false);
    } catch (error) {
      console.error("Error updating campaign:", error);
      setErrorForRequiredFields(
        error instanceof Error ? error.message : "Failed to update campaign"
      );
      setSubmitLoading(false);
    }
  };

  // Add this near the top of the component, after the existing useState declarations
  const [isLoading, setIsLoading] = useState(true);

  // Add this useEffect hook after other useEffect declarations
  useEffect(() => {
    const fetchCampaignDetails = async () => {
      console.log("[fetchCampaignDetails] Starting fetch with:", {
        authToken: !!authToken,
        organizationId,
        campaignId,
      });

      if (!authToken || !organizationId || !campaignId) {
        console.log(
          "[fetchCampaignDetails] Missing required params, using defaults"
        );
        setBoostRegistrationData(DEFAULT_BOOST_REGISTRATION);
        setAnimatedValues(getInitialBudget());
        setFormData((prev) => ({
          ...prev,
          name: `${data.eventDetails?.name || ""} Campaign`,
          motion: "", // No default motion
        }));
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_DELIGHTLOOP_API_URL}/v1/organizations/${organizationId}/campaigns/${campaignId}`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to fetch campaign: ${response.status}`);
        }

        const campaignData = await response.json();
        console.log(
          "[fetchCampaignDetails] Campaign data received:",
          campaignData
        );

        // Set form data first
        const newFormData = {
          name:
            campaignData.campaign.name ||
            `${data.eventDetails?.name || ""} Campaign`,
          motion: campaignData.campaign.motion || "", // No default motion if not set
          description: campaignData.campaign.description || "",
        };
        console.log("[fetchCampaignDetails] Setting form data:", newFormData);
        setFormData(newFormData);

        // Only set boost registration data if that motion is selected
        if (campaignData.campaign.motion === "boost_registration") {
          const boostRegistration =
            campaignData.campaign.boostRegistration || {};
          const newBoostRegistrationData = {
            registrationGoal:
              boostRegistration.registrationGoal > 0
                ? boostRegistration.registrationGoal
                : DEFAULT_BOOST_REGISTRATION.registrationGoal,
            perGiftCost:
              boostRegistration.perGiftCost > 0
                ? boostRegistration.perGiftCost
                : DEFAULT_BOOST_REGISTRATION.perGiftCost,
            conversionFactor:
              boostRegistration.conversionFactor > 0
                ? boostRegistration.conversionFactor
                : DEFAULT_BOOST_REGISTRATION.conversionFactor,
          };

          console.log(
            "[fetchCampaignDetails] Setting boost registration data:",
            newBoostRegistrationData
          );
          setBoostRegistrationData(newBoostRegistrationData);

          // Calculate budget based on the new boost registration data
          const budget = {
            totalLeads:
              newBoostRegistrationData.registrationGoal *
              newBoostRegistrationData.conversionFactor,
            creditCost:
              newBoostRegistrationData.registrationGoal *
              newBoostRegistrationData.conversionFactor *
              0.1,
            giftCost:
              newBoostRegistrationData.registrationGoal *
              newBoostRegistrationData.conversionFactor *
              newBoostRegistrationData.perGiftCost,
            get totalBudget() {
              return this.creditCost + this.giftCost;
            },
          };

          console.log("[fetchCampaignDetails] Setting initial budget:", budget);
          setAnimatedValues(budget);
        }

        // Load meeting hosts data if motion is set_up_meeting
        if (
          campaignData.campaign.motion === "set_up_meeting" &&
          campaignData.campaign.meetingHosts
        ) {
          console.log(
            "[fetchCampaignDetails] Setting meeting hosts data:",
            campaignData.campaign.meetingHosts
          );
          // Ensure all hosts have timezone field (migration fix)
          const migratedHosts = campaignData.campaign.meetingHosts.map(
            (host: any) => ({
              ...host,
              hostInfo: {
                ...host.hostInfo,
                timezone: host.hostInfo.timezone || "ET",
              },
            })
          );
          setMeetingHosts(migratedHosts);
        }
      } catch (error) {
        console.error("[fetchCampaignDetails] Error:", error);
        // Set default values on error
        console.log("[fetchCampaignDetails] Setting default values on error");
        setFormData((prev) => ({
          ...prev,
          name: `${data.eventDetails?.name || ""} Campaign`,
          motion: "", // No default motion
        }));
      } finally {
        setIsLoading(false);
      }
    };

    fetchCampaignDetails();
  }, [authToken, organizationId, campaignId, data.eventDetails?.name]);

  // Meeting Hosts state for set_up_meeting motion
  const [meetingHosts, setMeetingHosts] = useState<
    Array<{
      hostId: string;
      hostInfo: {
        name: string;
        email: string;
        role: string;
        linkedinUrl?: string;
        timezone: string;
      };
      schedule: Array<{
        date: string;
        slots: Array<{
          slotId: string;
          startTime: string;
          endTime: string;
          isBooked: boolean;
        }>;
      }>;
      preferences: {
        slotDuration: number;
        isActive: boolean;
      };
    }>
  >([]);

  const [activeHostIndex, setActiveHostIndex] = useState<number | null>(null);
  const [showAddHost, setShowAddHost] = useState(false);
  const [hostFormErrors, setHostFormErrors] = useState<{
    name?: string;
    email?: string;
    role?: string;
    schedule?: string;
  }>({});
  const [isNewHost, setIsNewHost] = useState(false);
  const [tempHost, setTempHost] = useState<(typeof meetingHosts)[0] | null>(
    null
  );

  // Add new host
  const addNewHost = () => {
    const newHost = {
      hostId: `host_${Date.now()}`,
      hostInfo: {
        name: "",
        email: "",
        role: "",
        linkedinUrl: "",
        timezone: "ET", // Default to US Eastern Time
      },
      schedule: [],
      preferences: {
        slotDuration: 30,
        isActive: true,
      },
    };
    setTempHost(newHost);
    setIsNewHost(true);
    setActiveHostIndex(0); // Use index 0 for temp host
    setHostFormErrors({}); // Clear any previous errors
    setShowAddHost(true);
  };

  // Update host info
  const updateHostInfo = (hostIndex: number, field: string, value: string) => {
    if (isNewHost && tempHost) {
      setTempHost({
        ...tempHost,
        hostInfo: {
          ...tempHost.hostInfo,
          [field]: value,
        },
      });
    } else {
      const updatedHosts = [...meetingHosts];
      updatedHosts[hostIndex].hostInfo = {
        ...updatedHosts[hostIndex].hostInfo,
        [field]: value,
      };
      setMeetingHosts(updatedHosts);
    }
  };

  // Add schedule date
  const addScheduleDate = (hostIndex: number, date: string) => {
    if (isNewHost && tempHost) {
      const existingDateIndex = tempHost.schedule.findIndex(
        (s) => s.date === date
      );

      if (existingDateIndex === -1) {
        setTempHost({
          ...tempHost,
          schedule: [
            ...tempHost.schedule,
            {
              date,
              slots: [],
            },
          ],
        });
      }
    } else {
      const updatedHosts = [...meetingHosts];
      const existingDateIndex = updatedHosts[hostIndex].schedule.findIndex(
        (s) => s.date === date
      );

      if (existingDateIndex === -1) {
        updatedHosts[hostIndex].schedule.push({
          date,
          slots: [],
        });
        setMeetingHosts(updatedHosts);
      }
    }
  };

  // Add time slot
  const addTimeSlot = (
    hostIndex: number,
    dateIndex: number,
    startTime: string,
    endTime: string
  ) => {
    const newSlot = {
      slotId: `slot_${Date.now()}`,
      startTime,
      endTime,
      isBooked: false,
    };

    if (isNewHost && tempHost) {
      const updatedSchedule = [...tempHost.schedule];
      updatedSchedule[dateIndex].slots.push(newSlot);
      setTempHost({
        ...tempHost,
        schedule: updatedSchedule,
      });
    } else {
      const updatedHosts = [...meetingHosts];
      updatedHosts[hostIndex].schedule[dateIndex].slots.push(newSlot);
      setMeetingHosts(updatedHosts);
    }
  };

  // Remove time slot
  const removeTimeSlot = (
    hostIndex: number,
    dateIndex: number,
    slotIndex: number
  ) => {
    if (isNewHost && tempHost) {
      const updatedSchedule = [...tempHost.schedule];
      updatedSchedule[dateIndex].slots.splice(slotIndex, 1);
      setTempHost({
        ...tempHost,
        schedule: updatedSchedule,
      });
    } else {
      const updatedHosts = [...meetingHosts];
      updatedHosts[hostIndex].schedule[dateIndex].slots.splice(slotIndex, 1);
      setMeetingHosts(updatedHosts);
    }
  };

  // Remove schedule date
  const removeScheduleDate = (hostIndex: number, dateIndex: number) => {
    if (isNewHost && tempHost) {
      const updatedSchedule = [...tempHost.schedule];
      updatedSchedule.splice(dateIndex, 1);
      setTempHost({
        ...tempHost,
        schedule: updatedSchedule,
      });
    } else {
      const updatedHosts = [...meetingHosts];
      updatedHosts[hostIndex].schedule.splice(dateIndex, 1);
      setMeetingHosts(updatedHosts);
    }
  };

  // Remove host
  const removeHost = (hostIndex: number) => {
    const updatedHosts = meetingHosts.filter((_, index) => index !== hostIndex);
    setMeetingHosts(updatedHosts);
    if (activeHostIndex === hostIndex) {
      setActiveHostIndex(null);
      setShowAddHost(false);
    }
  };

  // Validate host form
  const validateHostForm = (hostIndex: number) => {
    const host = isNewHost ? tempHost : meetingHosts[hostIndex];
    if (!host) return {};

    const errors: typeof hostFormErrors = {};

    if (!host.hostInfo.name.trim()) {
      errors.name = "Host name is required";
    }

    if (!host.hostInfo.email.trim()) {
      errors.email = "Email is required";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(host.hostInfo.email.trim())) {
        errors.email = "Please enter a valid email address";
      }
    }

    if (!host.hostInfo.role.trim()) {
      errors.role = "Role is required";
    }

    if (host.schedule.length === 0) {
      errors.schedule = "Please add at least one available date";
    } else {
      const totalSlots = host.schedule.reduce(
        (total, date) => total + date.slots.length,
        0
      );
      if (totalSlots === 0) {
        errors.schedule = "Please add at least one time slot";
      }
    }

    return errors;
  };

  // Save host data
  const saveHostData = () => {
    if (activeHostIndex === null) return;

    const errors = validateHostForm(activeHostIndex);
    setHostFormErrors(errors);

    if (Object.keys(errors).length === 0) {
      // No errors, save the host
      if (isNewHost && tempHost) {
        // Add new host to the array
        setMeetingHosts([...meetingHosts, tempHost]);
        setTempHost(null);
        setIsNewHost(false);
      }
      // Close modal
      setShowAddHost(false);
      setActiveHostIndex(null);
      setHostFormErrors({});
    }
  };

  // Cancel host editing
  const cancelHostEditing = () => {
    if (isNewHost) {
      // Discard temporary host
      setTempHost(null);
      setIsNewHost(false);
    }
    setShowAddHost(false);
    setActiveHostIndex(null);
    setHostFormErrors({});
  };

  // Add loading state to the return JSX, right after the opening div
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Event Details Card using the new EventCardFinal component */}
      <div className="mb-6">
        <EventCardFinal
          event={eventData}
          eventId={eventId}
          totalContacts={totalContacts}
        />
      </div>
      <div className={`mb-6 ${eventId == 1 ? "hidden" : "block"}`}>
        <h2 className="text-xl font-semibold mb-4">Campaign Motion</h2>
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600">
            Select a campaign motion that best suits your event marketing goals.
            Each motion creates a different gifting workflow.
          </p>

          {/* Motion filters - now right aligned */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleFilterClick("pre")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 shadow-sm shadow-purple-200 hover:bg-purple-200 transition-all duration-300 transform ${getFilterAnimation(
                "pre"
              )} ${
                activeFilter === "pre"
                  ? "animate-[bounce-subtle_2s_ease-in-out_infinite]"
                  : ""
              }`}
              aria-pressed={activeFilter === "pre"}
            >
              Pre-Event
              {activeFilter === "pre" && <span className="ml-1">✓</span>}
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick("during")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 shadow-sm shadow-purple-200 hover:bg-purple-200 transition-all duration-300 transform ${getFilterAnimation(
                "during"
              )} ${
                activeFilter === "during"
                  ? "animate-[bounce-subtle_2s_ease-in-out_infinite]"
                  : ""
              }`}
              aria-pressed={activeFilter === "during"}
            >
              During Event
              {activeFilter === "during" && <span className="ml-1">✓</span>}
            </button>
            <button
              type="button"
              onClick={() => handleFilterClick("post")}
              className={`px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 border border-purple-300 shadow-sm shadow-purple-200 hover:bg-purple-200 transition-all duration-300 transform ${getFilterAnimation(
                "post"
              )} ${
                activeFilter === "post"
                  ? "animate-[bounce-subtle_2s_ease-in-out_infinite]"
                  : ""
              }`}
              aria-pressed={activeFilter === "post"}
            >
              Post-Event
              {activeFilter === "post" && <span className="ml-1">✓</span>}
            </button>
          </div>
        </div>

        {/* Motion cards - adjusted grid for 4 cards per row with increased width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {filteredMotions.map((motion, index) => (
            <div
              key={motion.id}
              className={`${getCardGradient(
                motion.timing
              )} rounded-lg overflow-hidden cursor-pointer transition-all duration-500
              hover:shadow-[0_20px_35px_rgba(120,87,255,0.25)] hover:-translate-y-2 hover:border-purple-300
              ${getCardBorder(motion)} relative opacity-0 translate-y-4`}
              onClick={() => handleMotionSelect(motion.id)}
              style={{
                animation: `cardDealIn 0.6s ease-out forwards`,
                animationDelay: getAnimationDelay(index),
              }}
            >
              <div className={`p-5 h-full flex flex-col relative z-10`}>
                <div className="flex justify-between items-start mb-3">
                  <div
                    className={`p-2 rounded-lg ${
                      formData.motion === motion.id
                        ? "bg-white bg-opacity-50 text-purple-700"
                        : "bg-white bg-opacity-40 text-purple-700"
                    }
                  transition-all duration-200 hover:bg-opacity-70`}
                  >
                    {motion.icon}
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white bg-opacity-40 text-purple-800
                    shadow-sm shadow-purple-200 border border-purple-300`}
                    >
                      {getTimingLabel(motion.timing)}
                    </span>

                    {/* Selection indicator - placeholder to maintain layout */}
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        formData.motion === motion.id
                          ? "bg-purple-600 shadow-md"
                          : "opacity-0"
                      }`}
                    >
                      {formData.motion === motion.id && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-white"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium text-purple-900 mb-1 text-base">
                    {motion.name}
                  </h3>
                  <p className="text-sm text-purple-800 mb-3 line-clamp-2">
                    {motion.description}
                  </p>

                  {/* Ideal For section - enhanced for recommended motions */}
                  <div
                    className={`mt-2 p-2 rounded-md border ${
                      isRecommended(motion.id)
                        ? "bg-white bg-opacity-50 border-purple-200"
                        : "bg-white bg-opacity-50 border-purple-100"
                    }`}
                  >
                    <div className="flex items-center mb-1">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-1 text-purple-700"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-xs font-semibold text-purple-900">
                        Ideal For:
                      </span>
                      <span className="text-xs font-medium ml-1 text-purple-900">
                        {motion.idealFor.eventType}
                      </span>
                    </div>
                    <p className="text-xs text-purple-700 line-clamp-2">
                      {motion.idealFor.reason}
                    </p>
                  </div>
                </div>

                {/* Recommendation banner at bottom of card */}
                {isRecommended(motion.id) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-purple-800 text-white text-xs font-medium py-1.5 px-2 text-center z-20 flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 mr-1.5 text-purple-200"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    Recommended for {eventDetails.type}
                  </div>
                )}
              </div>
              <div
                className={`h-1 w-full transition-all duration-300 relative z-10 ${
                  formData.motion === motion.id
                    ? "bg-purple-700"
                    : "bg-transparent"
                }`}
              ></div>
            </div>
          ))}
        </div>
      </div>
      <form
        onSubmit={handleSubmit}
        className={`mt-8 ${
          eventId == 1
            ? "opacity-100"
            : formData.motion
              ? "animate-fade-in"
              : "opacity-0"
        }`}
      >
        <div className="space-y-6">
          {/* Campaign Name */}
          <div className="grid grid-cols-2  gap-4">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Campaign Name
              </label>
              <div className="flex flex-col gap-2">
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter campaign name"
                  className={`w-full px-4 py-2 border ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  } rounded-md focus:ring-primary focus:border-primary`}
                />
              </div>
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Deliver By*
              </label>
              <input
                type="date"
                value={selectedDate}
                min={
                  new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0]
                }
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`w-full rounded-md border ${
                  errors.date ? "border-red-500" : "border-gray-300"
                } px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary`}
              />
              {errors.date && (
                <p className="text-red-500 text-sm mt-1">{errors.date}</p>
              )}
            </div>
          </div>
          {/* Boost Registration specific fields */}
          {formData.motion === "boost_registration" && (
            <div className="bg-gray-50 hidden border border-gray-200 rounded-lg p-5 animate-fade-in">
              <h3 className="font-medium text-gray-900 mb-4">
                Boost Registration Details
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column - Input Fields */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[480px] flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-purple-600 mr-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Campaign Settings
                  </h4>

                  <div className="space-y-3 text-sm flex-grow">
                    {/* Registration Goal */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <label
                          htmlFor="registrationGoal"
                          className="block text-sm"
                        >
                          <span className="font-medium text-gray-700">
                            Registration Goal
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Target number of registrations)
                          </span>
                        </label>
                        <span className="text-lg font-semibold text-purple-700">
                          {boostRegistrationData.registrationGoal}
                        </span>
                      </div>
                      <div className="mt-2">
                        <input
                          type="range"
                          id="registrationGoal"
                          name="registrationGoal"
                          value={boostRegistrationData.registrationGoal}
                          onChange={handleSliderChange}
                          min="10"
                          max="1000"
                          step="10"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>10</span>
                          <span>500</span>
                          <span>1000</span>
                        </div>
                      </div>
                    </div>

                    {/* Per Gift Cost */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <label htmlFor="perGiftCost" className="block text-sm">
                          <span className="font-medium text-gray-700">
                            Per Gift Cost
                          </span>
                          <span className="text-xs text-gray-500 ml-2">
                            (Average cost per gift)
                          </span>
                        </label>
                        <span className="text-lg font-semibold text-purple-700">
                          ${boostRegistrationData.perGiftCost}
                        </span>
                      </div>
                      <div className="mt-2">
                        <input
                          type="range"
                          id="perGiftCost"
                          name="perGiftCost"
                          value={boostRegistrationData.perGiftCost}
                          onChange={handleSliderChange}
                          min="5"
                          max="250"
                          step="5"
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600 [&::-moz-range-thumb]:bg-purple-600 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>$5</span>
                          <span>$125</span>
                          <span>$250</span>
                        </div>
                      </div>
                    </div>

                    {/* Conversion Factor */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100 opacity-90">
                      <div className="flex justify-between items-center">
                        <div>
                          <label
                            htmlFor="conversionFactor"
                            className="block text-sm"
                          >
                            <span className="font-medium text-gray-700">
                              Conversion Factor
                            </span>
                            <span className="text-xs text-gray-500 ml-2">
                              (Leads needed per registration)
                            </span>
                          </label>
                          <div className="flex items-center mt-1">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5 text-blue-600 mr-1"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-xs text-blue-600 font-medium">
                              Recommended value: 3
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              if (boostRegistrationData.conversionFactor > 1) {
                                setBoostRegistrationData({
                                  ...boostRegistrationData,
                                  conversionFactor:
                                    boostRegistrationData.conversionFactor - 1,
                                });
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                            aria-label="Decrease conversion factor"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                          <span className="text-md font-semibold text-purple-700 bg-white px-3 py-1 rounded-md border border-gray-200 min-w-[2.5rem] text-center">
                            {boostRegistrationData.conversionFactor}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (boostRegistrationData.conversionFactor < 10) {
                                setBoostRegistrationData({
                                  ...boostRegistrationData,
                                  conversionFactor:
                                    boostRegistrationData.conversionFactor + 1,
                                });
                              }
                            }}
                            className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300 text-gray-600"
                            aria-label="Increase conversion factor"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <div className="mt-1.5 pt-1.5 border-t border-gray-200">
                        <p className="text-xs text-gray-500 italic">
                          This value is based on industry data for optimal
                          campaign performance
                        </p>
                      </div>
                    </div>

                    {/* Total Leads Required - Read Only - Push to bottom with margin-top auto */}
                    <div className="p-3 bg-purple-50 rounded-md border border-purple-100 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800 font-medium flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1.5 text-purple-600"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                          </svg>
                          Total Leads:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-purple-600 mr-2">
                            {boostRegistrationData.registrationGoal} ×{" "}
                            {boostRegistrationData.conversionFactor} =
                          </span>
                          <span className="font-semibold text-purple-800 text-base">
                            {animatedValues.totalLeads}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Budget Calculation */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 min-h-[480px] flex flex-col">
                  <h4 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 text-purple-600 mr-1.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Budget Calculation
                  </h4>

                  <div className="space-y-3 text-sm flex-grow">
                    {/* Credit Cost */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 mr-1 text-gray-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M3 12v3c0 1.657 3.134 3 7 3s7-1.343 7-3v-3c0 1.657-3.134 3-7 3s-7-1.343-7-3z" />
                            <path d="M3 7v3c0 1.657 3.134 3 7 3s7-1.343 7-3V7c0 1.657-3.134 3-7 3S3 8.657 3 7z" />
                            <path d="M17 5c0 1.657-3.134 3-7 3S3 6.657 3 5s3.134-3 7-3 7 1.343 7 3z" />
                          </svg>
                          Lead Credits:
                        </span>
                        <span className="font-medium text-gray-800">
                          ${animatedValues.creditCost.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {animatedValues.totalLeads} leads @ $0.10 per credit
                      </p>
                    </div>

                    {/* Gift Cost */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-gray-600 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3.5 w-3.5 mr-1 text-gray-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 5a3 3 0 015-2.236A3 3 0 0114.83 6H16a2 2 0 012 2v2h-4v3a1 1 0 01-1 1H9a1 1 0 01-1-1v-3a1 1 0 00-1-1zm6 0a1 1 0 00-1 1v1h2V8a1 1 0 00-1-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Gift Budget:
                        </span>
                        <span className="font-medium text-gray-800">
                          ${animatedValues.giftCost.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        {animatedValues.totalLeads} gifts @ $
                        {boostRegistrationData.perGiftCost} each
                      </p>
                    </div>

                    {/* Total Budget - Read Only */}
                    <div className="p-3 bg-purple-50 rounded-md border border-purple-100 mt-auto">
                      <div className="flex justify-between items-center">
                        <span className="text-purple-800 font-medium flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 mr-1.5 text-purple-600"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Total Budget:
                        </span>
                        <div className="flex items-center">
                          <span className="text-xs text-purple-600 mr-2">
                            ${animatedValues.creditCost.toFixed(2)} + $
                            {animatedValues.giftCost.toFixed(2)} =
                          </span>
                          <span className="font-semibold text-purple-800 text-base">
                            ${animatedValues.totalBudget.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {formData.motion === "set_up_meeting" && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-5 animate-fade-in">
              <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2 text-purple-600"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                    clipRule="evenodd"
                  />
                </svg>
                Meeting Hosts Setup
              </h2>

              {/* Hosts List */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {meetingHosts.map((host, hostIndex) => (
                  <div
                    key={host.hostId}
                    className="bg-white h-fit rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  >
                    {/* Host Header */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 px-6 py-4 border-b border-gray-100">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-primary"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <div>
                            <h3
                              className="font-semibold text-gray-900 text-lg   max-w-[200px] truncate"
                              title={
                                host.hostInfo.name || `Host ${hostIndex + 1}`
                              }
                            >
                              {host.hostInfo.name || `Host ${hostIndex + 1}`}
                            </h3>
                            <p
                              className="text-sm text-gray-600 max-w-[200px] truncate"
                              title={host.hostInfo.role || "Role not set"}
                            >
                              {host.hostInfo.role || "Role not set"}
                            </p>
                          </div>
                        </div>
                        <div className="flex space-x-1">
                          <button
                            type="button"
                            onClick={() => {
                              setActiveHostIndex(hostIndex);
                              setIsNewHost(false); // Make sure we're not in new host mode
                              setTempHost(null); // Clear any temp host
                              setHostFormErrors({}); // Clear any previous errors
                              setShowAddHost(true);
                            }}
                            className="p-2 text-primary hover:text-primary-light hover:bg-purple-100 rounded-lg transition-colors"
                            title="Edit host"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="w-[17px]"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                            </svg>
                          </button>
                          <button
                            type="button"
                            onClick={() => removeHost(hostIndex)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-colors"
                            title="Remove host"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                            >
                              <path
                                fill="currentColor"
                                d="M7 21q-.825 0-1.412-.587T5 19V6H4V4h5V3h6v1h5v2h-1v13q0 .825-.587 1.413T17 21zM17 6H7v13h10zM9 17h2V8H9zm4 0h2V8h-2zM7 6v13z"
                              />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Host Details */}
                    <div className="p-6">
                      {/* Contact Info */}
                      <div className="space-y-3 mb-5">
                        <div className="flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          <span className="text-gray-600">
                            {host.hostInfo.email || (
                              <span className="text-amber-600 italic">
                                Email not set
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center text-sm">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400 mr-3 flex-shrink-0"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <span className="text-gray-600">
                            {host.hostInfo.timezone || "ET"} timezone
                          </span>
                        </div>
                      </div>

                      {/* Schedule Summary */}
                      <div className="border-t border-gray-100 pt-4">
                        <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-primary-light mr-2"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Availability Schedule
                        </h4>

                        {host.schedule.length === 0 ? (
                          <div className="text-center py-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-gray-400 mx-auto mb-2"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-sm text-gray-500">
                              No schedule configured
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              Click Edit to add availability
                            </p>
                          </div>
                        ) : (
                          <div
                            className={`grid grid-cols-4 gap-2 ${host.schedule.length > 8 ? "h-40" : "h-auto"} overflow-scroll hide-scrollbar`}
                          >
                            {host.schedule.map((scheduleDate, dateIndex) => {
                              const dateObj = new Date(scheduleDate.date);
                              const formattedDate = dateObj.toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                }
                              );
                              const slotCount = scheduleDate.slots.length;

                              return (
                                <div
                                  key={dateIndex}
                                  className="flex items-center h-fit justify-between p-2  bg-primary-xlight rounded-lg border border-primary/10"
                                >
                                  <div className="flex items-center">
                                    {/* <div className="w-8 h-8 bg-primary-xlight rounded-full flex items-center justify-center mr-3">
                                      <span className="text-xs font-semibold text-primary">
                                        {dateObj.getDate()}
                                      </span>
                                    </div> */}
                                    <div>
                                      <p className="font-medium text-primary">
                                        {formattedDate}
                                      </p>
                                      <p className=" text-primary grid gap-1 h-10  overflow-scroll hide-scrollbar">
                                        {scheduleDate.slots.map((slot) => (
                                          <span
                                            key={slot.slotId}
                                            className="w-fit bg-primary-light/10 px-1.5 py-0.5 rounded-md text-primary text-[10px] -mx-1"
                                          >
                                            {slot.startTime}-{slot.endTime}
                                          </span>
                                        ))}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Add Host Button */}
                <button
                  type="button"
                  onClick={addNewHost}
                  className="flex items-center px-4 py-2 border border-dashed border-gray-300 rounded-lg text-gray-600 hover:text-gray-800 hover:border-gray-400 justify-center transition-colors"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Add Meeting Host
                </button>
              </div>

              {/* Host Details Modal/Form */}
              <Modal
                isOpen={showAddHost && activeHostIndex !== null}
                onClose={cancelHostEditing}
              >
                <div className="p-6">
                  <div className="flex justify-between items-center mb-4 bg-primary-xlight p-5 -mt-6 -mx-6 rounded-t-lg">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <div className="w-10 h-10 bg-primary-light/10 justify-center flex items-center rounded-full pl-[8px]">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5 mr-2 text-primary"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      Add Meeting Host
                    </h3>
                    <button
                      type="button"
                      onClick={cancelHostEditing}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
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

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Host Information */}
                    <div className=" grid grid-cols-1  gap-3  h-fit">
                      <h4 className="font-medium text-gray-900  border-b border-dashed border-gray-200 pb-1.5 pt-2">
                        Host Information
                      </h4>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name *
                        </label>
                        <input
                          type="text"
                          value={
                            activeHostIndex !== null
                              ? isNewHost && tempHost
                                ? tempHost.hostInfo.name || ""
                                : meetingHosts[activeHostIndex]?.hostInfo
                                    .name || ""
                              : ""
                          }
                          onChange={(e) => {
                            if (activeHostIndex !== null) {
                              updateHostInfo(
                                activeHostIndex,
                                "name",
                                e.target.value
                              );
                              // Clear error when user types
                              if (hostFormErrors.name) {
                                setHostFormErrors((prev) => ({
                                  ...prev,
                                  name: undefined,
                                }));
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                            hostFormErrors.name
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter host name"
                        />
                        {hostFormErrors.name && (
                          <p className="text-red-500 text-sm mt-1">
                            {hostFormErrors.name}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          value={
                            activeHostIndex !== null
                              ? isNewHost && tempHost
                                ? tempHost.hostInfo.email || ""
                                : meetingHosts[activeHostIndex]?.hostInfo
                                    .email || ""
                              : ""
                          }
                          onChange={(e) => {
                            if (activeHostIndex !== null) {
                              updateHostInfo(
                                activeHostIndex,
                                "email",
                                e.target.value
                              );
                              // Clear error when user types
                              if (hostFormErrors.email) {
                                setHostFormErrors((prev) => ({
                                  ...prev,
                                  email: undefined,
                                }));
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                            hostFormErrors.email
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="Enter host email"
                        />
                        {hostFormErrors.email && (
                          <p className="text-red-500 text-sm mt-1">
                            {hostFormErrors.email}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Role *
                        </label>
                        <input
                          type="text"
                          value={
                            activeHostIndex !== null
                              ? isNewHost && tempHost
                                ? tempHost.hostInfo.role || ""
                                : meetingHosts[activeHostIndex]?.hostInfo
                                    .role || ""
                              : ""
                          }
                          onChange={(e) => {
                            if (activeHostIndex !== null) {
                              updateHostInfo(
                                activeHostIndex,
                                "role",
                                e.target.value
                              );
                              // Clear error when user types
                              if (hostFormErrors.role) {
                                setHostFormErrors((prev) => ({
                                  ...prev,
                                  role: undefined,
                                }));
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 border rounded-md focus:ring-purple-500 focus:border-purple-500 ${
                            hostFormErrors.role
                              ? "border-red-500"
                              : "border-gray-300"
                          }`}
                          placeholder="e.g., Sales Manager, CEO"
                        />
                        {hostFormErrors.role && (
                          <p className="text-red-500 text-sm mt-1">
                            {hostFormErrors.role}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          LinkedIn URL
                        </label>
                        <input
                          type="url"
                          value={
                            activeHostIndex !== null
                              ? isNewHost && tempHost
                                ? tempHost.hostInfo.linkedinUrl || ""
                                : meetingHosts[activeHostIndex]?.hostInfo
                                    .linkedinUrl || ""
                              : ""
                          }
                          onChange={(e) => {
                            if (activeHostIndex !== null) {
                              updateHostInfo(
                                activeHostIndex,
                                "linkedinUrl",
                                e.target.value
                              );
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                          placeholder="https://linkedin.com..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Timezone *
                        </label>
                        <select
                          value={
                            activeHostIndex !== null
                              ? isNewHost && tempHost
                                ? tempHost.hostInfo.timezone || "ET"
                                : meetingHosts[activeHostIndex]?.hostInfo
                                    .timezone || "ET"
                              : "ET"
                          }
                          onChange={(e) => {
                            if (activeHostIndex !== null) {
                              updateHostInfo(
                                activeHostIndex,
                                "timezone",
                                e.target.value
                              );
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-purple-500 focus:border-purple-500"
                        >
                          <optgroup label="US Timezones">
                            <option value="ET">Eastern Time (ET)</option>
                            <option value="CT">Central Time (CT)</option>
                            <option value="MT">Mountain Time (MT)</option>
                            <option value="PT">Pacific Time (PT)</option>
                            <option value="AKT">Alaska Time (AKT)</option>
                            <option value="HT">Hawaii Time (HT)</option>
                          </optgroup>
                          <optgroup label="Other Common Timezones">
                            <option value="UTC">UTC</option>
                            <option value="GMT">
                              Greenwich Mean Time (GMT)
                            </option>
                            <option value="CET">
                              Central European Time (CET)
                            </option>
                            <option value="JST">
                              Japan Standard Time (JST)
                            </option>
                            <option value="CST">
                              China Standard Time (CST)
                            </option>
                            <option value="AEST">
                              Australian Eastern Time (AEST)
                            </option>
                          </optgroup>
                        </select>
                        <p className="text-xs text-gray-500 mt-1">
                          All meeting slots will be in this timezone
                        </p>
                      </div>
                    </div>

                    {/* Schedule Configuration */}
                    <div className="space-y-4 ">
                      <h4 className="font-medium text-gray-900 border-b border-dashed border-gray-200 pb-1.5 pt-2">
                        Availability Schedule
                      </h4>

                      {activeHostIndex !== null &&
                        (isNewHost
                          ? tempHost
                          : meetingHosts[activeHostIndex]) && (
                          <div>
                            <HostScheduleManager
                              hostIndex={activeHostIndex}
                              host={
                                isNewHost && tempHost
                                  ? tempHost
                                  : meetingHosts[activeHostIndex]
                              }
                              onAddDate={addScheduleDate}
                              onAddSlot={addTimeSlot}
                              onRemoveSlot={removeTimeSlot}
                              onRemoveDate={removeScheduleDate}
                            />
                            {hostFormErrors.schedule && (
                              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                <p className="text-red-600 text-sm flex items-center">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-4 w-4 mr-2 flex-shrink-0"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0v3a1 1 0 001 1h3a1 1 0 000-2h-3V6z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  {hostFormErrors.schedule}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                    <button
                      type="button"
                      onClick={cancelHostEditing}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveHostData}
                      className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors flex items-center"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Save Host
                    </button>
                  </div>
                </div>
              </Modal>
            </div>
          )}
        </div>

        {errors.motion && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">
            {errors.motion}
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <div className=" ">
            {errorForRequiredFields && (
              <div className="flex p-2 items-center  bg-red-50 border border-red-100 text-red-600 rounded-md text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-2"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 10-2 0v3a1 1 0 001 1h3a1 1 0 000-2h-3V6z"
                    clipRule="evenodd"
                  />
                </svg>
                {errorForRequiredFields}
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={submitLoading}
            onClick={(e) => {
              e.preventDefault();
              SaveCampaignName();
            }}
            className={`px-5 py-2 bg-primary text-white rounded-md hover:bg-primary-dark flex items-center ${
              submitLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {submitLoading ? (
              <div className="flex items-center">
                <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                <span>Loading...</span>
              </div>
            ) : (
              <>Continue</>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 ml-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

/**
 * Add animation keyframes and scrollbar hiding styles to the component
 */
const AnimationStyle = () => (
  <style jsx global>{`
    @keyframes cardDealIn {
      0% {
        opacity: 0;
        transform: translateY(40px) rotate(-2deg);
      }
      70% {
        opacity: 1;
        transform: translateY(-5px) rotate(0deg);
      }
      100% {
        opacity: 1;
        transform: translateY(0) rotate(0deg);
      }
    }

    .hide-scrollbar {
      /* Hide scrollbar for IE, Edge and Firefox */
      -ms-overflow-style: none;
      scrollbar-width: none;
    }

    /* Hide scrollbar for Chrome, Safari and Opera */
    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
  `}</style>
);

/**
 * Wrap the CampaignMotion component with animations
 */
const CampaignMotionWithAnimations = (props: CampaignMotionProps) => (
  <>
    <AnimationStyle />
    <CampaignMotion {...props} />
  </>
);

export default CampaignMotionWithAnimations;
