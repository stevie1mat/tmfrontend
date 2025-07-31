"use client";

import { useState, useEffect } from "react";
import { FaTimes, FaCalendar, FaClock, FaUser, FaCreditCard, FaComment } from "react-icons/fa";
import LoadingSpinner from "./common/LoadingSpinner";
import { useAuth } from "../contexts/AuthContext";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
  selectedTier: string;
  onBookingSuccess?: () => void;
}

interface BookingFormData {
  date: string;
  timeFrom: string;
  timeTo: string;
}

export default function BookingModal({
  isOpen,
  onClose,
  service,
  selectedTier,
  onBookingSuccess,
}: BookingModalProps) {
  const { user, token } = useAuth();
  const [formData, setFormData] = useState<BookingFormData>({
    date: "",
    timeFrom: "",
    timeTo: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);



  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getCurrentTier = () => {
    if (!service?.Tiers) return null;
    return service.Tiers.find((tier: any) => tier.name === selectedTier);
  };

  const currentTier = getCurrentTier();

  const validateForm = () => {
    if (!formData.date) {
      setError("Please select a date");
      return false;
    }
    if (!formData.timeFrom || !formData.timeTo) {
      setError("Please select time range");
      return false;
    }
    if (formData.timeFrom >= formData.timeTo) {
      setError("End time must be after start time");
      return false;
    }
    if (!user) {
      setError("Please log in to book this service");
      return false;
    }
    const userCredits = user.Credits ?? user.credits ?? 0;
    if (userCredits < currentTier?.credits) {
      setError(`Insufficient credits. You have ${userCredits} credits, but this service costs ${currentTier?.credits} credits.`);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);

    try {
      const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
      
      const bookingData = {
        taskId: service.ID || service.id,
        bookerId: user?.ID || user?.id || '',
        taskOwnerId: service.Author?.ID || service.Author?.id,
        timeslot: {
          date: formData.date,
          timeFrom: formData.timeFrom,
          timeTo: formData.timeTo,
        },
        credits: currentTier?.credits || 0,
        status: "pending"
      };

      const res = await fetch(`${API_BASE_URL}/api/bookings/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });

      if (!res.ok) {
        const errorData = await res.text();
        throw new Error(errorData || "Failed to create booking");
      }

      const result = await res.json();
      console.log("Booking created successfully:", result);
      
      // Show success message
      setSuccessMessage("Booking request sent successfully! The service provider will review your request.");
      
      // Close after a short delay to show success message
      setTimeout(() => {
        if (onBookingSuccess) {
          onBookingSuccess();
        }
        onClose();
      }, 2000);
    } catch (err) {
      console.error("Booking error:", err);
      setError(err instanceof Error ? err.message : "Failed to create booking");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Book Service</h2>
              <p className="text-gray-600 mt-1">
                {service?.Title || service?.title} - {selectedTier} Package
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Service Summary */}
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Service Details</h3>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">
                    {currentTier?.credits} Credits
                  </div>
                  <div className="text-sm text-gray-500">No tax</div>
                </div>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center space-x-2">
                  <FaUser className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Provider: {service?.Author?.Name || service?.Author?.name || service?.author?.name}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaClock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Available: {currentTier?.availableTimeSlot}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <FaCalendar className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    Max Duration: {currentTier?.maxDays} days
                  </span>
                </div>
              </div>
            </div>

            {/* User Credits Check */}
            {user && (
              <div className={`rounded-xl p-4 ${
                (user.Credits ?? user.credits ?? 0) >= (currentTier?.credits || 0) 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <FaCreditCard className={`w-4 h-4 ${
                      (user.Credits ?? user.credits ?? 0) >= (currentTier?.credits || 0) ? 'text-green-500' : 'text-red-500'
                    }`} />
                    <span className="font-medium text-gray-900">Your Credits</span>
                  </div>
                  <div className="text-right">
                    <div className={`font-bold ${
                      (user.Credits ?? user.credits ?? 0) >= (currentTier?.credits || 0) ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {user.Credits ?? user.credits ?? 0} Credits
                    </div>
                    <div className="text-sm text-gray-500">
                      Required: {currentTier?.credits || 0} Credits
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Date Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                <FaCalendar className="w-4 h-4 inline mr-2" />
                Preferred Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                placeholder="Select a date"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 cursor-pointer"
                required
                onFocus={(e) => e.target.showPicker?.()}
              />
            </div>

            {/* Time Selection */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FaClock className="w-4 h-4 inline mr-2" />
                  Start Time *
                </label>
                <input
                  type="time"
                  name="timeFrom"
                  value={formData.timeFrom}
                  onChange={handleChange}
                  placeholder="Select start time"
                  className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 cursor-pointer"
                  required
                  onFocus={(e) => e.target.showPicker?.()}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  <FaClock className="w-4 h-4 inline mr-2" />
                  End Time *
                </label>
                <input
                  type="time"
                  name="timeTo"
                  value={formData.timeTo}
                  onChange={handleChange}
                  placeholder="Select end time"
                  className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-gray-900 cursor-pointer"
                  required
                  onFocus={(e) => e.target.showPicker?.()}
                />
              </div>
            </div>



            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <p className="text-green-600 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-4 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !user}
                className={`flex-1 px-6 py-3 rounded-xl font-medium transition-colors ${
                  loading || !user
                    ? 'bg-gray-400 cursor-not-allowed text-white'
                    : 'bg-black hover:bg-gray-800 text-white'
                }`}
              >
                {loading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <div className="w-4 h-4 border-2 border-green-500 border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating Booking...</span>
                  </div>
                ) : !user ? (
                  'Please Log In'
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 