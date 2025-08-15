"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBars } from "react-icons/fa";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../contexts/AuthContext";

function Dropdown({ label, items }: { label: string; items: { name: string; href: string }[] }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center gap-1 hover:text-green-300 text-white whitespace-nowrap">
        {label}
        <ChevronDownIcon className="w-4 h-4" />
      </Menu.Button>

      <Menu.Items className="absolute z-50 mt-2 w-48 origin-top-right bg-white border border-gray-200 rounded-md shadow-lg focus:outline-none">
        <div className="py-1">
          {items.map((item, idx) => (
            <Menu.Item key={idx}>
              {({ active }) => (
                <Link
                  href={item.href}
                  className={`block px-4 py-2 text-sm ${
                    active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                  }`}
                >
                  {item.name}
                </Link>
              )}
            </Menu.Item>
          ))}
        </div>
      </Menu.Items>
    </Menu>
  );
}

export default function HomepageNavbar() {
  const [open, setOpen] = useState(false);
  const { user, token, loading } = useAuth();

  const credits = user?.Credits ?? user?.credits ?? null;
  const userName = user?.Name ?? user?.name ?? null;

  return (
    <header className="bg-emerald-900 shadow-lg text-white w-full z-50 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        {/* Logo on left */}
        <Link href="/" className="text-xl sm:text-2xl font-bold flex-shrink-0">
          <span className="text-white">TradeMinutes</span>
          <span className="text-green-400 text-2xl sm:text-4xl">.</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden lg:flex items-center gap-4 xl:gap-6 ml-auto">
          {/* Nav dropdowns */}
          <nav className="flex gap-4 xl:gap-6 text-sm xl:text-base font-medium items-center">
           
            <Link href="/services/all" className="hover:text-green-300 text-white whitespace-nowrap">Browse Services</Link>
            <Link href="/ai-agents/all" className="hover:text-green-300 text-white whitespace-nowrap">AI Agents</Link>
            <Dropdown
              label="Users"
              items={[
                { name: "Top Rated", href: "/users/top" },
                { name: "Nearby", href: "/users/nearby" },
              ]}
            />

          </nav>
          {/* Credits badge removed */}
          {/* Right buttons */}
          <Link href="/seller" className="hover:text-green-300 text-white text-sm xl:text-base whitespace-nowrap">Become a Seller</Link>
          
                    {user ? (
            <div className="flex items-center space-x-3 xl:space-x-4">
              <Link href="/dashboard">
                <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm xl:text-base px-3 xl:px-4 py-2 rounded transition-all duration-200 whitespace-nowrap">
                  Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-300 text-white text-sm xl:text-base whitespace-nowrap">Sign in</Link>
              <Link href="/register">
                <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-sm xl:text-base px-3 xl:px-4 py-2 rounded transition-all duration-200 whitespace-nowrap">
                  Join
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button 
          onClick={() => setOpen(!open)} 
          className="lg:hidden ml-auto text-white p-2 hover:bg-emerald-800 rounded transition-colors"
          aria-label="Toggle mobile menu"
        >
          <FaBars size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-emerald-800 px-4 py-4 space-y-3 shadow-md text-base border-t border-emerald-700">
          <div className="space-y-2">
            <Link href="/services/all" className="block text-white hover:text-green-300 py-2 transition-colors">Browse Services</Link>
            <Link href="/ai-agents/all" className="block text-white hover:text-green-300 py-2 transition-colors">AI Agents</Link>
            <Link href="/users/top" className="block text-white hover:text-green-300 py-2 transition-colors">Top Rated Users</Link>
            <Link href="/users/nearby" className="block text-white hover:text-green-300 py-2 transition-colors">Nearby Users</Link>
            <Link href="/seller" className="block text-white hover:text-green-300 py-2 transition-colors">Become a Seller</Link>
          </div>
          
          <div className="pt-2 border-t border-emerald-700">
            {user ? (
              <div className="space-y-2">
                <Link href="/dashboard">
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded transition-all duration-200 font-medium">
                    Dashboard
                  </button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                <Link href="/login" className="block text-white hover:text-green-300 py-2 transition-colors">Sign in</Link>
                <Link href="/register">
                  <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-3 rounded transition-all duration-200 font-medium">
                    Join TradeMinutes
                  </button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
} 