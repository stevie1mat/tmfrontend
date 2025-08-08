import { useState, useEffect } from "react";
import { FaUpload, FaTimes } from "react-icons/fa";
import CoverImageUpload from "@/components/CoverImageUpload";

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { coverImage: File | null; title: string; description: string; credits: string; coverImageUrl?: string }) => void;
}

export default function CreateAgentModal({ isOpen, onClose, onSave }: CreateAgentModalProps) {
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string>("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [credits, setCredits] = useState("");
  const [currentStep, setCurrentStep] = useState(1);

  useEffect(() => {
    if (coverImage) {
      const reader = new FileReader();
      reader.onloadend = () => setCoverImagePreview(reader.result as string);
      reader.readAsDataURL(coverImage);
    } else {
      setCoverImagePreview("");
    }
  }, [coverImage]);

  if (!isOpen) return null;

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const removeCoverImage = () => {
    setCoverImage(null);
    setCoverImagePreview("");
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!coverImage && !coverImageUrl) || !title || !description) return;
    setCurrentStep(2);
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ coverImage, title, description, credits, coverImageUrl });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md relative">
        <button className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>&times;</button>
        {/* Stepper/Progress Bar */}
        <div className="flex items-center mb-6">
          <div className="flex-1 flex items-center">
            <div className={`w-3 h-3 rounded-full ${currentStep === 1 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
            <div className={`flex-1 h-1 ${currentStep === 2 ? 'bg-purple-600' : 'bg-gray-200'} mx-1 rounded`}></div>
            <div className={`w-3 h-3 rounded-full ${currentStep === 2 ? 'bg-purple-600' : 'bg-gray-300'}`}></div>
          </div>
          <span className="ml-4 text-xs text-gray-500">Step {currentStep} of 2</span>
        </div>
        <h2 className="text-xl font-bold mb-4">Save Workflow</h2>
        {currentStep === 1 && (
          <form className="space-y-5" onSubmit={handleNext}>
            {/* Cover Image Upload using existing component */}
            <div className="space-y-2">
              <CoverImageUpload
                currentImageUrl={coverImageUrl || coverImagePreview}
                onImageUpload={(imageUrl) => {
                  setCoverImageUrl(imageUrl);
                  setCoverImagePreview(imageUrl);
                }}
                onImageRemove={() => {
                  setCoverImageUrl("");
                  setCoverImagePreview("");
                  setCoverImage(null);
                }}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Agent Title *</label>
              <input
                type="text"
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Enter agent title"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Description *</label>
              <textarea
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe your agent"
                rows={3}
                required
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700 flex-1"
                disabled={(!coverImage && !coverImageUrl) || !title || !description}
              >
                Next
              </button>
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 flex-1"
                onClick={onClose}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
        {currentStep === 2 && (
          <form className="space-y-5" onSubmit={handleSave}>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">Credits or Payment</label>
              <input
                className="w-full border border-gray-300 px-4 py-3 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                value={credits}
                onChange={e => setCredits(e.target.value)}
                placeholder="Enter credits required or card number..."
                type="text"
              />
            </div>
            <div className="flex gap-3 mt-4">
              <button
                type="button"
                className="bg-gray-200 text-gray-700 px-6 py-2 rounded font-bold hover:bg-gray-300 flex-1"
                onClick={handleBack}
              >
                Back
              </button>
              <button
                type="submit"
                className="bg-purple-600 text-white px-6 py-2 rounded font-bold hover:bg-purple-700 flex-1"
                disabled={!credits}
              >
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 