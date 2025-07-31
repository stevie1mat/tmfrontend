"use client";
import { useState } from "react";

const categories = [
  "Content Creation",
  "Data Analysis",
  "Customer Service",
  "Development",
  "Marketing",
  "Research",
  "Language",
  "Automation",
  "Analytics",
  "Creative",
  "Business",
  "Education",
  "Other",
];

export default function CreateAgentPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [features, setFeatures] = useState<string[]>([]);
  const [featureInput, setFeatureInput] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [demoScript, setDemoScript] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleAddFeature = () => {
    if (featureInput.trim() && !features.includes(featureInput.trim())) {
      setFeatures([...features, featureInput.trim()]);
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (feature: string) => {
    setFeatures(features.filter(f => f !== feature));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!name || !description || !category) {
      setError("Please fill in all required fields.");
      return;
    }
    // Here you would send the data to your backend API
    setSuccess("Agent created successfully! (This is a demo)");
  };

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-2xl font-bold mb-6">Create a New AI Agent</h1>
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
        {error && <div className="text-red-600 font-medium">{error}</div>}
        {success && <div className="text-green-600 font-medium">{success}</div>}
        <div>
          <label className="block font-semibold mb-1">Agent Name *</label>
          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Description *</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={description}
            onChange={e => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Category *</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={category}
            onChange={e => setCategory(e.target.value)}
            required
          >
            <option value="">Select Category</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-semibold mb-1">Features/Capabilities</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2"
              value={featureInput}
              onChange={e => setFeatureInput(e.target.value)}
              placeholder="Add a feature and press Enter"
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddFeature(); } }}
            />
            <button type="button" onClick={handleAddFeature} className="px-4 py-2 bg-emerald-700 text-white rounded-lg">Add</button>
          </div>
          <div className="flex flex-wrap gap-2">
            {features.map(feature => (
              <span key={feature} className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {feature}
                <button type="button" onClick={() => handleRemoveFeature(feature)} className="ml-1 text-red-500">&times;</button>
              </span>
            ))}
          </div>
        </div>
        <div>
          <label className="block font-semibold mb-1">Cover Image (URL)</label>
          <input
            type="url"
            className="w-full border border-gray-300 rounded-lg px-4 py-2"
            value={coverImage}
            onChange={e => setCoverImage(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="block font-semibold mb-1">Demo Script/Logic (optional)</label>
          <textarea
            className="w-full border border-gray-300 rounded-lg px-4 py-2 font-mono"
            value={demoScript}
            onChange={e => setDemoScript(e.target.value)}
            placeholder="// Write your agent logic or script here"
            rows={6}
          />
        </div>
        <button
          type="submit"
          className="w-full bg-emerald-700 text-white font-semibold py-3 rounded-lg hover:bg-emerald-800 transition"
        >
          Deploy Agent
        </button>
      </form>
    </div>
  );
} 