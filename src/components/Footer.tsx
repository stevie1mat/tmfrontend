'use client';

import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn, FaApple, FaAndroid, FaChevronUp } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer className="bg-emerald-900 text-white">
      {/* Top section with links and social */}
      <div className="border-b border-emerald-800 px-8 py-6 flex flex-wrap justify-between items-center max-w-7xl mx-auto">
        <div className="space-x-8 text-sm">
          <a href="#" className="hover:text-green-300 transition-colors px-2 py-1">Terms of Service</a>
          <a href="#" className="hover:text-green-300 transition-colors px-2 py-1">Privacy Policy</a>
          <a href="#" className="hover:text-green-300 transition-colors px-2 py-1">Site Map</a>
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <span className="text-sm px-2 py-1">Follow Us</span>
          <div className="flex gap-4">
            <a href="#" className="hover:text-green-300 transition-colors p-2"><FaFacebookF /></a>
            <a href="#" className="hover:text-green-300 transition-colors p-2"><FaTwitter /></a>
            <a href="#" className="hover:text-green-300 transition-colors p-2"><FaInstagram /></a>
            <a href="#" className="hover:text-green-300 transition-colors p-2"><FaLinkedinIn /></a>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto">
        {/* About */}
        <div className="px-4 py-2">
          <h4 className="text-white font-semibold mb-6 text-lg">About</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">About Us</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Become Seller</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Jobs on TradeMinutes</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Pricing</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Services TradeMinutes</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Terms of Service</a></li>
          </ul>
        </div>

        {/* Categories */}
        <div className="px-4 py-2">
          <h4 className="text-white font-semibold mb-6 text-lg">Categories</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Design & Creative</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Development & IT</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Music & Audio</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Programming & Tech</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Digital Marketing</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Finance & Accounting</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Writing & Translation</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Trending</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Lifestyle</a></li>
          </ul>
        </div>

        {/* Support */}
        <div className="px-4 py-2">
          <h4 className="text-white font-semibold mb-6 text-lg">Support</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Help & Support</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">FAQ TradeMinutes</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Contact Us</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Services</a></li>
            <li><a href="#" className="hover:text-green-300 transition-colors py-1 block">Terms of Service</a></li>
          </ul>
        </div>

        {/* Subscribe and Apps in one line */}
        <div className="px-4 py-2">
          <h4 className="text-white font-semibold mb-6 text-lg">Subscribe</h4>
          <div className="flex items-center bg-emerald-800 rounded overflow-hidden max-w-md mb-6">
            <input
              type="email"
              placeholder="Your email address"
              className="bg-transparent p-4 w-full outline-none text-white placeholder-gray-300"
            />
            <button className="bg-emerald-600 px-6 py-4 text-white font-medium hover:bg-emerald-700 transition-colors">
              Send
            </button>
          </div>
          
          <h4 className="text-white font-semibold mb-4 text-lg">Apps</h4>
          <div className="flex gap-6 text-sm">
            <a href="#" className="flex items-center gap-2 hover:text-green-300 transition-colors py-1">
              <FaApple className="text-lg" />
              <span>iOS App</span>
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-green-300 transition-colors py-1">
              <FaAndroid className="text-lg" />
              <span>Android App</span>
            </a>
          </div>
        </div>
      </div>

      {/* Bottom section */}
      <div className="border-t border-emerald-800 px-8 py-6 flex flex-wrap justify-between items-center max-w-7xl mx-auto">
        <div className="text-sm text-gray-300 px-2 py-1">
          © TradeMinutes. 2025 CreativeLayers. All rights reserved.
        </div>
        <div className="flex items-center gap-6 mt-4 md:mt-0">
          <select className="bg-emerald-800 text-white text-sm px-4 py-2 rounded border border-emerald-700">
            <option>English</option>
          </select>
          <button className="bg-emerald-800 hover:bg-emerald-700 text-white p-3 rounded-full transition-colors">
            <FaChevronUp />
          </button>
        </div>
      </div>
    </footer>
  );
}
