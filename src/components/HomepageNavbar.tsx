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
      <Menu.Button className="inline-flex items-center gap-1 hover:text-green-300 text-white">
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
    <header className="bg-emerald-900 shadow-lg text-white w-full z-50">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
        {/* Logo on left */}
        <Link href="/" className="text-2xl font-bold">
          <span className="text-white">TradeMinutes</span>
          <span className="text-green-400 text-4xl">.</span>
        </Link>

        {/* Spacer pushes the right section */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* Nav dropdowns */}
          <nav className="flex gap-6 text-base font-medium items-center">
           
            <Link href="/services/all" className="hover:text-green-300 text-white">Browse Services</Link>
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
          <Link href="/seller" className="hover:text-green-300 text-white text-base">Become a Seller</Link>
          
                    {user ? (
            <div className="flex items-center space-x-4">
              <Link href="/dashboard">
                <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-base px-4 py-2 rounded transition-all duration-200">
                  Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className="hover:text-green-300 text-white text-base">Sign in</Link>
              <Link href="/register">
                <button className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-base px-4 py-2 rounded transition-all duration-200">
                  Join
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className="md:hidden ml-auto text-white">
          <FaBars size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-emerald-800 px-4 py-4 space-y-3 shadow-md text-base">
          <Link href="/services/all" className="text-white">Browse Services</Link>
          <Link href="/users" className="text-white">Users</Link>
          <Link href="/about" className="text-white">Pages</Link>
          <Link href="/contact" className="text-white">Contact</Link>
          
          {user ? (
            <>
              <Link href="/dashboard">
                <button className="w-full bg-white/20 text-white py-2 rounded">Dashboard</button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-white">Sign in</Link>
              <Link href="/register">
                <button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white py-2 rounded transition-all duration-200">Join</button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
} 