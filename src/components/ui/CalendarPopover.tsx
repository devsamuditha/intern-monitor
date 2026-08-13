"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { api } from "@/src/services/api";

interface CalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({ isOpen, onClose, userId }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [markers, setMarkers] = useState<Map<string, boolean>>(new Map());
  const [loading, setLoading] = useState(false);
  const [togglingDate, setTogglingDate] = useState<string | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const fetchMarkers = useCallback(async (month: number, year: number) => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await api.getCalendarMarkers({ month, year });
      const markerMap = new Map<string, boolean>();
      data.forEach((m: any) => {
        markerMap.set(m.date, m.is_available);
      });
      setMarkers(markerMap);
    } catch (err) {
      console.error("Failed to fetch calendar markers:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen) {
      fetchMarkers(currentMonth, currentYear);
    }
  }, [isOpen, currentMonth, currentYear, fetchMarkers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const toggleDate = async (date: string) => {
    const currentStatus = markers.get(date) || false;
    setTogglingDate(date);
    try {
      const updated = await api.toggleCalendarMarker(date, !currentStatus);
      setMarkers(prev => {
        const next = new Map(prev);
        next.set(updated.date, updated.is_available);
        return next;
      });
    } catch (err) {
      console.error("Failed to toggle calendar marker:", err);
    } finally {
      setTogglingDate(null);
    }
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const formatDateKey = (year: number, month: number, day: number) => {
    const m = String(month).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const daysInPrevMonth = getDaysInMonth(currentMonth === 1 ? 12 : currentMonth - 1, currentMonth === 1 ? currentYear - 1 : currentYear);

    const days: { day: number; dateKey: string; isCurrentMonth: boolean }[] = [];

    for (let i = firstDay - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const month = currentMonth === 1 ? 12 : currentMonth - 1;
      const year = currentMonth === 1 ? currentYear - 1 : currentYear;
      days.push({ day, dateKey: formatDateKey(year, month, day), isCurrentMonth: false });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ day, dateKey: formatDateKey(currentYear, currentMonth, day), isCurrentMonth: true });
    }

    const remainingCells = 42 - days.length;
    const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
    const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
    for (let day = 1; day <= remainingCells; day++) {
      days.push({ day, dateKey: formatDateKey(nextYear, nextMonth, day), isCurrentMonth: false });
    }

    return days;
  };

  const isToday = (dateKey: string) => {
    const todayStr = formatDateKey(today.getFullYear(), today.getMonth() + 1, today.getDate());
    return dateKey === todayStr;
  };

  if (!isOpen) return null;

  const calendarDays = renderCalendarDays();
  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div
      ref={popoverRef}
      className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/20 dark:border-slate-700/30 rounded-2xl shadow-xl p-4 w-80"
    >
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={handlePrevMonth}
            type="button"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <h3 className="text-white font-display text-sm font-bold">
            {monthNames[currentMonth - 1]} {currentYear}
          </h3>
          <button
            onClick={handleNextMonth}
            type="button"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
              {day}
            </div>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-teal-500" />
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(({ day, dateKey, isCurrentMonth }) => {
              const isMarked = markers.get(dateKey) || false;
              const isTodayDate = isToday(dateKey);
              const isToggling = togglingDate === dateKey;

              return (
                <button
                  key={dateKey}
                  onClick={() => isCurrentMonth && toggleDate(dateKey)}
                  disabled={!isCurrentMonth || isToggling}
                  type="button"
                  className={`
                    h-8 w-8 flex items-center justify-center rounded-lg text-xs font-medium transition relative
                    ${isCurrentMonth ? "text-white hover:bg-white/10 cursor-pointer" : "text-slate-600 dark:text-slate-500 cursor-default"}
                    ${isTodayDate && !isMarked ? "ring-1 ring-teal-400" : ""}
                    ${isMarked ? "bg-teal-500 text-white" : ""}
                    ${isToggling ? "opacity-50" : ""}
                  `}
                >
                  {day}
                  {isMarked && isCurrentMonth && (
                    <span className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-white/10 dark:border-slate-700/30 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500" />
            <span className="text-[10px] text-slate-400 font-medium">Unavailable</span>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
  );
};
