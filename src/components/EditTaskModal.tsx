"use client";

import { useState, useEffect } from "react";
import { FaUpload, FaTimes, FaImage, FaArrowLeft, FaArrowRight } from "react-icons/fa";
import LoadingSpinner from "./common/LoadingSpinner";

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: any;
  onUpdated: () => void;
  showToast: (msg: string, type: "success" | "error") => void;
}

interface Tier {
  name: string;
  title: string;
  description: string;
  credits: number;
  features: string[];
  availableTimeSlot: string;
  maxDays: number;
}

export default function EditTaskModal({
  isOpen,
  onClose,
  task,
  onUpdated,
  showToast,
}: EditTaskModalProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    latitude: "",
    longitude: "",
    locationType: "in-person",
  });

  const [tiers, setTiers] = useState<Tier[]>([
    {
      name: "Basic",
      title: "",
      description: "",
      credits: 0,
      features: [],
      availableTimeSlot: "9:00 AM - 5:00 PM",
      maxDays: 7
    },
    {
      name: "Standard",
      title: "",
      description: "",
      credits: 0,
      features: [],
      availableTimeSlot: "8:00 AM - 6:00 PM",
      maxDays: 14
    },
    {
      name: "Premium",
      title: "",
      description: "",
      credits: 0,
      features: [],
      availableTimeSlot: "24/7 Available",
      maxDays: 30
    }
  ]);

  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [contentImages, setContentImages] = useState<File[]>([]);
  const [contentImagePreviews, setContentImagePreviews] = useState<string[]>([]);
  const [existingContentImages, setExistingContentImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const API_BASE_URL = process.env.NEXT_PUBLIC_TASK_API_URL || "http://localhost:8084";
  const MAPBOX_TOKEN = "pk.eyJ1IjoibmVlbGFtZ2F1Y2hhbiIsImEiOiJjbWMwbzg0dXgwNGlnMmxwcmlncWVycnBnIn0.ARZnElbDY2SOiInY94w6aA";
  // Remove all code related to requiredSkills, newRequiredSkill, setRequiredSkills, setNewRequiredSkill, and related handlers/UI

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      return;
    }
    const fetchCategories = async () => {
      setCategoriesLoading(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/tasks/categories`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        
        // Ensure categories is always an array
        if (data && Array.isArray(data.categories)) {
          setCategories(data.categories);
        } else if (Array.isArray(data)) {
          setCategories(data);
        } else {
          console.error("Invalid categories response format:", data);
          setCategories([]);
          showToast("❌ Invalid categories data format.", "error");
        }
      } catch (err) {
        console.error("Failed to fetch categories", err);
        setCategories([]);
        showToast("❌ Failed to load categories.", "error");
      } finally {
        setCategoriesLoading(false);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen, showToast, API_BASE_URL]);

  useEffect(() => {
    if (task && isOpen) {
      setFormData({
        title: task.Title || "",
        description: task.Description || "",
        location: task.Location || "",
        latitude: task.Latitude?.toString() || "",
        longitude: task.longitude?.toString() || "",
        locationType: task.LocationType || "in-person",
      });
      setSelectedCategory(task.Category || "");
      
      // Set cover image preview and content images if task has images
      if (task.Images && task.Images.length > 0) {
        // First image is cover image
        setCoverImagePreview(task.Images[0]);
        
        // Rest are content images (skip first one)
        if (task.Images.length > 1) {
          const contentImages = task.Images.slice(1);
          setContentImagePreviews(contentImages);
          setExistingContentImages(contentImages);
        }
      }
      
      // Set tiers from task if available
      if (task.Tiers && task.Tiers.length > 0) {
        setTiers(task.Tiers);
      }
    }
  }, [task, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTierChange = (tierIndex: number, field: keyof Tier, value: any) => {
    setTiers(prev => prev.map((tier, index) => 
      index === tierIndex ? { ...tier, [field]: value } : tier
    ));
  };

  const handleLocationInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setFormData((prev) => ({ ...prev, location: query }));

    if (query.length > 2) {
      try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          query + " Toronto"
        )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&country=CA&types=address&limit=5`;

        const res = await fetch(url);
        const data = await res.json();
        setLocationSuggestions(data.features);
      } catch (err) {
        console.error("Mapbox error:", err);
        showToast("❌ Failed to fetch locations.", "error");
      }
    } else {
      setLocationSuggestions([]);
    }
  };

  const handleLocationSelect = (place: any) => {
    setFormData((prev) => ({
      ...prev,
      location: place.place_name,
      latitude: place.geometry.coordinates[1],
      longitude: place.geometry.coordinates[0],
    }));
    setLocationSuggestions([]);
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast("❌ Cover image must be less than 5MB", "error");
        return;
      }
      setCoverImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setCoverImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleContentImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        showToast("❌ Image must be less than 5MB", "error");
        return false;
      }
      return true;
    });

    if (contentImagePreviews.length + validFiles.length > 5) {
      showToast("❌ Maximum 5 content images allowed", "error");
      return;
    }

    setContentImages(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setContentImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
  };

  const removeContentImage = (index: number) => {
    setContentImages(prev => prev.filter((_, i) => i !== index));
    setContentImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const removeExistingContentImage = (index: number) => {
    setContentImagePreviews(prev => prev.filter((_, i) => i !== index));
    setExistingContentImages(prev => prev.filter((_, i) => i !== index));
  };

  // Remove all code related to requiredSkills, newRequiredSkill, setRequiredSkills, setNewRequiredSkill, and related handlers/UI

  const nextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!task) return;

    setUploading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("location", formData.location);
      formDataToSend.append("latitude", formData.latitude);
      formDataToSend.append("longitude", formData.longitude);
      formDataToSend.append("locationType", formData.locationType);
      formDataToSend.append("category", selectedCategory);
      formDataToSend.append("tiers", JSON.stringify(tiers));
      
      // Set base credits from the first tier (if tiers exist)
      if (tiers.length > 0 && tiers[0].credits > 0) {
        formDataToSend.append("credits", tiers[0].credits.toString());
      } else {
        // Default credits if no tiers or first tier has 0 credits
        formDataToSend.append("credits", "10");
      }

      // Add requiredSkills
      // formDataToSend.append('requiredSkills', JSON.stringify(requiredSkills)); // Removed

      // Handle cover image
      if (coverImage) {
        formDataToSend.append("coverImage", coverImage);
      }

      // Handle content images
      contentImages.forEach((image) => {
        formDataToSend.append("contentImages", image);
      });

      // Add existing content images that weren't removed
      formDataToSend.append("existingContentImages", JSON.stringify(existingContentImages));

      const response = await fetch(`${API_BASE_URL}/api/tasks/update/${task.id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to update task: ${errorData}`);
      }

      showToast("✅ Task updated successfully!", "success");
      onUpdated();
      onClose();
    } catch (err) {
      console.error("Update error:", err);
      showToast("❌ Failed to update task", "error");
    } finally {
      setUploading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-5">
      {/* Cover Image Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Cover Image *</label>
        {coverImagePreview ? (
          <div className="relative">
            <img
              src={coverImagePreview}
              alt="Cover preview"
              className="w-full h-32 object-cover rounded-lg border"
            />
            <button
              type="button"
              onClick={removeCoverImage}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <FaTimes className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
            <FaUpload className="w-8 h-8 text-gray-400 mb-2" />
            <span className="text-sm text-gray-500">Upload cover image</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleCoverImageChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {/* Content Images Upload */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">
          Content Images (Max 5)
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {contentImagePreviews.map((preview, index) => {
            // Check if this is an existing image (starts with http/https) or a new one (data URL)
            const isExistingImage = preview.startsWith('http');
            
            return (
              <div key={index} className="relative">
                <img
                  src={preview}
                  alt={`Content ${index + 1}`}
                  className="w-full h-20 object-cover rounded-lg border"
                />
                <button
                  type="button"
                  onClick={() => isExistingImage ? removeExistingContentImage(index) : removeContentImage(index)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <FaTimes className="w-2 h-2" />
                </button>
              </div>
            );
          })}
          {contentImagePreviews.length < 5 && (
            <label className="flex flex-col items-center justify-center w-full h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400 transition">
              <FaImage className="w-4 h-4 text-gray-400 mb-1" />
              <span className="text-xs text-gray-500">Add image</span>
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleContentImagesChange}
                className="hidden"
              />
            </label>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Category *</label>
        <select
          name="category"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          required
          disabled={categoriesLoading}
        >
          <option value="">
            {categoriesLoading ? "Loading categories..." : "Select a category"}
          </option>
          {Array.isArray(categories) && categories.map((cat, idx) => (
            <option key={idx} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          name="title"
          placeholder="Enter your service title"
          className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
          value={formData.title}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description *</label>
        <textarea
          name="description"
          placeholder="Describe your service in detail"
          rows={3}
          className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
          value={formData.description}
          onChange={handleChange}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Location *</label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="relative">
            <input
              type="text"
              name="location"
              placeholder="Enter a Canadian location"
              className="border border-gray-300 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
              value={formData.location}
              onChange={handleLocationInput}
              required
            />
            {locationSuggestions.length > 0 && (
              <ul className="absolute z-10 bg-white border border-gray-200 rounded-xl mt-1 w-full max-h-48 overflow-y-auto shadow-lg">
                {locationSuggestions.map((place) => (
                  <li
                    key={place.id}
                    className="px-4 py-3 hover:bg-purple-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                    onClick={() => handleLocationSelect(place)}
                  >
                    {place.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <select
            name="locationType"
            value={formData.locationType}
            onChange={handleChange}
            className="border border-gray-300 px-4 py-3 rounded-xl w-full focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            required
          >
            <option value="in-person">In-person</option>
            <option value="remote">Remote</option>
          </select>
        </div>
      </div>

      {/* Remove all code related to requiredSkills, newRequiredSkill, setRequiredSkills, setNewRequiredSkill, and related handlers/UI */}

    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Configure Service Tiers</h3>
        <p className="text-sm text-gray-600">Set up your pricing tiers and time commitments</p>
      </div>

      {tiers.map((tier, index) => (
        <div key={index} className="border border-gray-200 rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-lg font-semibold text-gray-900">{tier.name} Tier</h4>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-500">Credits:</span>
              <input
                type="number"
                value={tier.credits}
                onChange={(e) => handleTierChange(index, 'credits', parseInt(e.target.value) || 0)}
                className="w-20 border border-gray-300 px-2 py-1 rounded text-sm"
                min="0"
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={tier.title}
              onChange={(e) => handleTierChange(index, 'title', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder={`${tier.name} package title`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={tier.description}
              onChange={(e) => handleTierChange(index, 'description', e.target.value)}
              className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              rows={2}
              placeholder={`Describe what's included in the ${tier.name} package`}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Available Time Slot</label>
              <input
                type="text"
                value={tier.availableTimeSlot}
                onChange={(e) => handleTierChange(index, 'availableTimeSlot', e.target.value)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 9:00 AM - 5:00 PM"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Days</label>
              <input
                type="number"
                value={tier.maxDays}
                onChange={(e) => handleTierChange(index, 'maxDays', parseInt(e.target.value) || 0)}
                className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                min="1"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white max-w-4xl w-full rounded-2xl shadow-2xl overflow-hidden max-h-[95vh] relative">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Edit Listing</h2>
              <p className="text-gray-600 mt-1">
                Step {currentStep} of 2: {currentStep === 1 ? 'Basic Information' : 'Pricing Tiers'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
            >
              <FaTimes className="w-6 h-6" />
            </button>
          </div>
          
          {/* Step Indicator */}
          <div className="flex items-center mt-4 space-x-2">
            <div className={`w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`flex-1 h-1 rounded ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-220px)]">
          {currentStep === 1 ? renderStep1() : renderStep2()}
        </div>

        {/* Footer with Navigation */}
        <div className="border-t border-gray-200 pb-12 pt-4 pr-10 bg-gray-50">
          <div className="flex items-center justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center space-x-2 ml-8 px-6 py-3 border border-gray-300 bg-white text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-colors shadow-sm"
              >
                <FaArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>
            ) : (
              <div></div>
            )}
            
            {currentStep < 2 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center space-x-2 px-6 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg font-medium"
              >
                <span>Next</span>
                <FaArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={uploading}
                onClick={handleSubmit}
                className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg ${
                  uploading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-black hover:bg-gray-800 hover:shadow-xl'
                } text-white flex items-center space-x-2`}
              >
                {uploading ? (
                  <>
                    <LoadingSpinner size="sm" text="" />
                    <span>Updating Listing...</span>
                  </>
                ) : (
                  <>
                    <span>Update Listing</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 