import { FiCheck, FiArrowUpRight } from 'react-icons/fi';
import Image from 'next/image';

export default function AIAgentsHelpSection() {
  return (
    <section className="bg-emerald-900 text-white py-20 px-4">
      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">
        {/* Left Images (community style) */}
        <div className="relative flex justify-center items-center">
          {/* Background people images */}
          <div className="relative">
            <Image
              src="https://images.stockcake.com/public/1/2/0/12092b2f-7f0c-417c-a412-c959769faa62_large/vintage-literary-moment-stockcake.jpg"
              alt="AI Agent Collaboration"
              width={250}
              height={200}
              className="rounded-lg object-cover"
            />

            <div className="absolute -top-4 -left-6 bg-white text-black p-4 rounded-lg shadow-md text-sm">
              <p className="font-semibold">98% Satisfaction</p>
              <p className="text-xs text-gray-600">AI-Generated Images</p>
            </div>

            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white p-2  rounded-lg flex items-center gap-1 shadow-md">
              <span className="text-sm font-medium text-black ml-2">10k+ Images Created</span>
            </div>
          </div>

          {/* Second person */}
          <div className="ml-6 hidden md:block relative">
            <Image
              src="https://images.stockcake.com/public/8/f/d/8fddadb0-4996-44e8-aad3-e8b285c4ab0c_large/neural-text-portal-stockcake.jpg"
              alt="AI Agent Collaboration 2"
              width={230}
              height={180}
              className="rounded-lg object-cover"
            />

            <div className="absolute top-6 right-[-16px] bg-white text-black p-4 rounded-lg shadow-md text-sm">
              <p className="font-semibold">+30,000</p>
              <p className="text-xs text-gray-600">Tasks Completed</p>
            </div>
          </div>
        </div>

        {/* Right Content (homepage style) */}
        <div>
          <h2 className="text-3xl font-bold mb-6">
            Empower Your Workflow with AI Agents
          </h2>
          <p className="text-gray-200 mb-6">
            Discover, deploy, and share AI agents that boost productivity, automate tasks, and unlock new possibilities—no coding required.
          </p>

          <ul className="space-y-4 text-gray-100 mb-8">
            <li className="flex items-start gap-2">
              <FiCheck className="mt-1 text-green-400" />
              Generate stunning images from text prompts using advanced AI models
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="mt-1 text-green-400" />
              Upscale, enhance, and transform your photos with one click
            </li>
            <li className="flex items-start gap-2">
              <FiCheck className="mt-1 text-green-400" />
              Collaborate on creative visual projects and share results with the community
            </li>
          </ul>

          <button className="bg-green-500 text-white px-6 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-green-600">
            Find Help <FiArrowUpRight />
          </button>
        </div>
      </div>
    </section>
  );
} 