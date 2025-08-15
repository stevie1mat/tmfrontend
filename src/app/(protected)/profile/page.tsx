"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { getAuthHeaders } from "@/lib/token-utils";
import { toast } from "react-hot-toast";
import { 
  FiUser, 
  FiMail, 
  FiMapPin, 
  FiBookOpen, 
  FiAward, 
  FiEdit3,
  FiSave,
  FiX,
  FiPlus,
  FiTrash2,
  FiCamera,
  FiImage,
  FiStar,
  FiClock,
  FiDollarSign,
  FiUsers,
  FiTrendingUp
} from "react-icons/fi";
import { FaCoins } from "react-icons/fa";
import ProfilePictureUpload from "@/components/ProfilePictureUpload";
import CoverImageUpload from "@/components/CoverImageUpload";

interface ProfileData {
  ID?: string;
  Name?: string;
  Email?: string;
  College?: string;
  Program?: string;
  YearOfStudy?: string;
  Skills?: string[];
  Credits?: number;
  ProfilePictureURL?: string;
  CoverImageURL?: string;
  Bio?: string;
  Location?: string;
  Stats?: {
    Rating?: number;
    ReviewsCount?: number;
    TimeSpentHelping?: string;
    SessionsConducted?: number;
  };
  Achievements?: string[];
}

export default function ProfilePage() {
  const router = useRouter();
  const { token } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Debug logging function
  const addDebugLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setDebugLogs(prev => [...prev, logMessage].slice(-10)); // Keep last 10 logs
    console.log(logMessage);
  };
  
  // Form state
  const [formData, setFormData] = useState({
    Name: "",
    Email: "",
    College: "",
    Program: "",
    YearOfStudy: "",
    Bio: "",
    Location: "",
    Skills: [] as string[],
    newSkill: ""
  });

  useEffect(() => {
    addDebugLog("🔍 Profile page useEffect triggered");
    addDebugLog(`🔍 Token: ${token ? "exists" : "missing"}`);
    addDebugLog(`🔍 Loading state: ${loading}`);
    addDebugLog(`🔍 Profile data: ${profile ? "exists" : "missing"}`);
    addDebugLog(`🔍 useEffect dependencies - token: ${!!token}, loading: ${loading}`);
    
    // Check if we have a token
    if (!token) {
      addDebugLog("⏳ No token yet, waiting...");
      return;
    }

    addDebugLog("✅ Token exists, fetching profile...");
    addDebugLog(`✅ Token preview: ${token.substring(0, 50)}...`);
    addDebugLog("🔍 About to call fetchProfile...");
    fetchProfile();
    addDebugLog("🔍 fetchProfile called");
  }, [token, loading, router]);

  const fetchProfile = async () => {
    try {
      addDebugLog("🚀 Starting profile fetch...");
      setLoading(true);
      setError(null);
      
      const headers = getAuthHeaders();
      addDebugLog(`🔍 Fetching profile with headers: ${JSON.stringify(headers)}`);
      addDebugLog(`🔍 Token from headers: ${headers.Authorization ? headers.Authorization.substring(0, 50) + "..." : "No token"}`);
      addDebugLog(`🔍 Token exists: ${!!headers.Authorization}`);
      addDebugLog(`🔍 API URL: ${process.env.NEXT_PUBLIC_USER_API_URL || 'https://tmuserservice.onrender.com'}/api/profile/get`);
      
      const startTime = Date.now();
      addDebugLog("📡 Making fetch request...");
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_USER_API_URL || 'https://tmuserservice.onrender.com'}/api/profile/get`,
        { headers }
      );
      const endTime = Date.now();
      addDebugLog(`📡 Profile response status: ${res.status}`);
      addDebugLog(`📡 Profile response headers: ${JSON.stringify(Object.fromEntries(res.headers.entries()))}`);
      addDebugLog(`⏱️ Request took: ${endTime - startTime}ms`);
      
      if (!res.ok) {
        addDebugLog(`❌ Profile fetch failed with status: ${res.status}`);
        addDebugLog(`❌ Response headers: ${JSON.stringify(Object.fromEntries(res.headers.entries()))}`);
        const errorText = await res.text();
        addDebugLog(`❌ Error response body: ${errorText}`);
        const errorMessage = `Failed to fetch profile: ${res.status} ${errorText}`;
        addDebugLog(`❌ Setting error state: ${errorMessage}`);
        setError(errorMessage);
        throw new Error(errorMessage);
      }

      addDebugLog("📡 Response received, parsing JSON...");
      const data = await res.json();
      addDebugLog(`✅ Profile data received: ${JSON.stringify(data).substring(0, 200)}...`);
      addDebugLog(`✅ Profile data keys: ${Object.keys(data).join(', ')}`);
      addDebugLog("✅ Setting profile state...");
      setProfile(data);
      addDebugLog("✅ Profile state set successfully");
      setFormData({
        Name: data.Name || "",
        Email: data.Email || "",
        College: data.College || "",
        Program: data.Program || "",
        YearOfStudy: data.YearOfStudy || "",
        Bio: data.Bio || "",
        Location: data.Location || "",
        Skills: data.Skills || [],
        newSkill: ""
      });
      console.log("✅ Profile state updated successfully");
    } catch (error) {
      addDebugLog(`❌ Failed to fetch profile: ${error}`);
      addDebugLog(`❌ Error details: ${JSON.stringify({
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })}`);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error("Failed to load profile");
    } finally {
      addDebugLog("🏁 Setting loading to false");
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const headers = getAuthHeaders();
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_USER_API_URL || 'https://tmuserservice.onrender.com'}/api/profile/update-info`,
        {
          method: "POST",
          headers,
          body: JSON.stringify(formData)
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update profile");
      }

      await fetchProfile();
      setEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    // Reset form data to original profile
    if (profile) {
      setFormData({
        Name: profile.Name || "",
        Email: profile.Email || "",
        College: profile.College || "",
        Program: profile.Program || "",
        YearOfStudy: profile.YearOfStudy || "",
        Bio: profile.Bio || "",
        Location: profile.Location || "",
        Skills: profile.Skills || [],
        newSkill: ""
      });
    }
  };

  const addSkill = () => {
    if (formData.newSkill.trim() && !formData.Skills.includes(formData.newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        Skills: [...prev.Skills, prev.newSkill.trim()],
        newSkill: ""
      }));
    }
  };

  const removeSkill = (skill: string) => {
    setFormData(prev => ({
      ...prev,
      Skills: prev.Skills.filter(s => s !== skill)
    }));
  };

  const handleProfilePictureUpload = (imageUrl: string) => {
    setProfile(prev => prev ? { ...prev, ProfilePictureURL: imageUrl } : null);
    toast.success("Profile picture updated!");
  };

  const handleCoverImageUpload = (imageUrl: string) => {
    setProfile(prev => prev ? { ...prev, CoverImageURL: imageUrl } : null);
    toast.success("Cover image updated!");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
          
          {/* Debug Information */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg max-w-md mx-auto text-left">
            <h3 className="font-semibold text-gray-800 mb-2">Debug Information:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Token:</strong> {token ? "✅ Exists" : "❌ Missing"}</p>
              <p><strong>Loading State:</strong> {loading ? "⏳ Loading" : "✅ Complete"}</p>
              <p><strong>Profile Data:</strong> {profile ? "✅ Loaded" : "❌ Not loaded"}</p>
              <p><strong>API URL:</strong> {process.env.NEXT_PUBLIC_USER_API_URL || 'https://tmuserservice.onrender.com'}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Token Length:</strong> {token ? token.length : 0}</p>
              <p><strong>Token Preview:</strong> {token ? token.substring(0, 20) + "..." : "None"}</p>
              <p><strong>Profile Object:</strong> {profile ? JSON.stringify(profile).substring(0, 100) + "..." : "null"}</p>
              <p><strong>Form Data:</strong> {formData.Name ? "✅ Has data" : "❌ Empty"}</p>
              <p><strong>Error State:</strong> {error ? "❌ Has error" : "✅ No errors"}</p>
              <p><strong>Error Message:</strong> {error || "None"}</p>
            </div>
            
            {/* Console Logs */}
            <div className="mt-4 p-4 bg-gray-200 rounded-lg max-w-md mx-auto text-left">
              <h3 className="font-semibold text-gray-800 mb-2">Console Logs:</h3>
              <div className="text-xs text-gray-600 space-y-1 max-h-40 overflow-y-auto">
                {debugLogs.map((log, index) => (
                  <p key={index} className="font-mono">{log}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Profile not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
            <div className="flex gap-3">
              {editing ? (
                <>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <FiSave className="w-4 h-4" />
                    {saving ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                  >
                    <FiX className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiEdit3 className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Image */}
            <div className="relative h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl overflow-hidden">
              {profile.CoverImageURL ? (
                <img
                  src={profile.CoverImageURL}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white text-lg">
                  <FiImage className="w-8 h-8 mr-2" />
                  No cover image
                </div>
              )}
                             {editing && (
                 <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                   <CoverImageUpload 
                     currentImageUrl={profile.CoverImageURL}
                     onImageUpload={handleCoverImageUpload}
                     onImageRemove={() => {}}
                   />
                 </div>
               )}
            </div>

            {/* Profile Picture and Basic Info */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-start gap-6">
                {/* Profile Picture */}
                <div className="relative">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                    {profile.ProfilePictureURL ? (
                      <img
                        src={profile.ProfilePictureURL}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <FiUser className="w-8 h-8" />
                      </div>
                    )}
                  </div>
                                     {editing && (
                     <div className="absolute -bottom-1 -right-1">
                       <ProfilePictureUpload 
                         currentImageUrl={profile.ProfilePictureURL}
                         onImageUpload={handleProfilePictureUpload}
                         onImageRemove={() => {}}
                       />
                     </div>
                   )}
                </div>

                {/* Basic Info */}
                <div className="flex-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.Name}
                          onChange={(e) => setFormData(prev => ({ ...prev, Name: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900 font-medium">{profile.Name || "Not set"}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <p className="text-gray-900">{profile.Email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        College/University
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.College}
                          onChange={(e) => setFormData(prev => ({ ...prev, College: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.College || "Not set"}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Program/Major
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.Program}
                          onChange={(e) => setFormData(prev => ({ ...prev, Program: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.Program || "Not set"}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Year of Study
                      </label>
                      {editing ? (
                        <select
                          value={formData.YearOfStudy}
                          onChange={(e) => setFormData(prev => ({ ...prev, YearOfStudy: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="">Select year</option>
                          <option value="1st Year">1st Year</option>
                          <option value="2nd Year">2nd Year</option>
                          <option value="3rd Year">3rd Year</option>
                          <option value="4th Year">4th Year</option>
                          <option value="Graduate">Graduate</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.YearOfStudy || "Not set"}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          value={formData.Location}
                          onChange={(e) => setFormData(prev => ({ ...prev, Location: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.Location || "Not set"}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About Me</h3>
              {editing ? (
                <textarea
                  value={formData.Bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, Bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-700">{profile.Bio || "No bio added yet."}</p>
              )}
            </div>

            {/* Skills */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
              {editing ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={formData.newSkill}
                      onChange={(e) => setFormData(prev => ({ ...prev, newSkill: e.target.value }))}
                      onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                      placeholder="Add a skill..."
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={addSkill}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <FiPlus className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.Skills.map((skill, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                        <button
                          onClick={() => removeSkill(skill)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <FiX className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.Skills && profile.Skills.length > 0 ? (
                    profile.Skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No skills added yet.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Stats and Actions */}
          <div className="space-y-6">
            {/* Credits Card */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Credits</h3>
                <FaCoins className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {profile.Credits || 0}
              </div>
              <p className="text-sm text-gray-600">Available credits</p>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiStar className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-600">Rating</span>
                  </div>
                  <span className="font-semibold">{profile.Stats?.Rating || 0}/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiUsers className="w-4 h-4 text-blue-500" />
                    <span className="text-sm text-gray-600">Reviews</span>
                  </div>
                  <span className="font-semibold">{profile.Stats?.ReviewsCount || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FiClock className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-gray-600">Sessions</span>
                  </div>
                  <span className="font-semibold">{profile.Stats?.SessionsConducted || 0}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <FiTrendingUp className="w-5 h-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">Go to Dashboard</span>
                </button>
                <button
                  onClick={() => router.push('/services/all')}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <FiBookOpen className="w-5 h-5 text-green-600" />
                  <span className="text-sm font-medium text-green-900">Browse Services</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
