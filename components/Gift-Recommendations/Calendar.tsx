import { useState, useEffect } from 'react';
import Image from 'next/image';

interface CalendarProps {
  selectedDate: Date;
  onChange: (date: Date) => void;
  customDate?: number; // Optional parameter to disable future dates
}

export default function Calendar({ selectedDate, onChange, customDate }: CalendarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const months = ["January", "February", "March", "April", "May", "June",
                 "July", "August", "September", "October", "November", "December"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  // Helper function to get the last disabled date
  const getLastDisabledDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (customDate) {
      const lastDisabledDate = new Date(today);
      lastDisabledDate.setDate(today.getDate() + customDate);
      return lastDisabledDate;
    }
    
    return today;
  };

  // Set initial selected date to first available date
  useEffect(() => {
    const lastDisabledDate = getLastDisabledDate();
    const firstAvailableDate = new Date(lastDisabledDate);
    firstAvailableDate.setDate(lastDisabledDate.getDate());
    onChange(firstAvailableDate);
  }, [customDate]);

  // Helper function to check if a date is disabled
  const isDateDisabled = (date: Date) => {
    const lastDisabledDate = getLastDisabledDate();
    return date <= lastDisabledDate;
  };

  // Helper function to check if a specific day in current month is disabled
  const isDayDisabled = (day: number) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return isDateDisabled(date);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const calendar = [];
    let day = 1;

    for (let i = 0; i < 6; i++) {
      const week = [];
      for (let j = 0; j < 7; j++) {
        if (i === 0 && j < startingDay) {
          week.push(null);
        } else if (day > daysInMonth) {
          week.push(null);
        } else {
          week.push(day);
          day++;
        }
      }
      calendar.push(week);
      if (day > daysInMonth) break;
    }

    return calendar;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    // Prevent selecting disabled dates
    if (isDayDisabled(day)) {
      return;
    }
    
    onChange(newDate);
    setIsOpen(false);
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const prevMonth = () => {
    const newMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1);
    // Only allow going to past months if they're not before current month
    if (!isDateDisabled(new Date(newMonth.getFullYear(), newMonth.getMonth() + 1, 0))) {
      setCurrentMonth(newMonth);
    }
  };

  // Check if current month is the current month and year
  const isCurrentMonth = () => {
    const today = new Date();
    return currentMonth.getMonth() === today.getMonth() && 
           currentMonth.getFullYear() === today.getFullYear();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-[9px] text-sm rounded-lg border bg-white border-[#D0D5DD] font-medium text-[#344054] hover:bg-gray-50"
      >
        <Image
          src="/svgs/Calender.svg"
          alt="calendar"
          width={15}
          height={16}
        />
        {selectedDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white rounded-lg border border-[#D2CEFE] shadow-lg z-50 w-[280px]">
          {/* Calendar Header */}
          <div className="bg-[#7C3AED] text-white p-4 rounded-t-lg">
            <div className="flex justify-between items-center mb-4">
              <button 
                onClick={prevMonth} 
                className={`hover:bg-[#6D28D9] p-1 rounded ${isCurrentMonth() ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={isCurrentMonth()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
              <span className="font-medium">
                {months[currentMonth.getMonth()]} {currentMonth.getFullYear()}
              </span>
              <button onClick={nextMonth} className="hover:bg-[#6D28D9] p-1 rounded">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {days.map(day => (
                <div key={day} className="text-white/80">{day}</div>
              ))}
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1">
              {getDaysInMonth(currentMonth).map((week, i) => (
                week.map((day, j) => {
                  const isDisabled = !day || isDayDisabled(day);
                  return (
                    <button
                      key={`${i}-${j}`}
                      onClick={() => day && !isDisabled && handleDateClick(day)}
                      className={`
                        h-8 w-8 rounded-md flex items-center justify-center text-sm
                        ${!day ? 'text-gray-300' : 
                          isDisabled ? 'text-gray-300 cursor-not-allowed' :
                          'hover:bg-[#F1E5FF] text-[#344054]'}
                        ${day && selectedDate.getDate() === day &&
                          selectedDate.getMonth() === currentMonth.getMonth() &&
                          selectedDate.getFullYear() === currentMonth.getFullYear()
                          ? 'bg-[#7C3AED] text-white'
                          : ''}
                      `}
                      disabled={isDisabled}
                    >
                      {day}
                    </button>
                  );
                })
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
