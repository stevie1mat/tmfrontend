"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FaBars } from "react-icons/fa";
import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";
import { useAuth } from "../contexts/AuthContext";

function Dropdown({ label, items, isHomepage }: { label: string; items: { name: string; href: string }[]; isHomepage?: boolean }) {
  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className={`inline-flex items-center gap-1 ${isHomepage ? "hover:text-green-300" : "hover:text-green-500"}`}>
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

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, token, loading } = useAuth();
  const pathname = usePathname();

  const credits = user?.Credits ?? user?.credits ?? null;
  const userName = user?.Name ?? user?.name ?? null;

  // Check if we're on the homepage
  const isHomepage = pathname === "/";

  return (
    <header className={`${isHomepage ? 'bg-transparent text-white' : 'bg-white shadow-lg text-black'} w-full z-50`}>
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
        {/* Logo on left */}
        <Link href="/" className="text-xl font-bold">
          <span className={isHomepage ? "text-white" : "text-black"}>TradeMinutes.</span>
        </Link>

        {/* Spacer pushes the right section */}
        <div className="hidden md:flex items-center gap-6 ml-auto">
          {/* Nav dropdowns */}
          <nav className="flex gap-6 text-sm font-medium items-center">
           
            <Link href="/services/all" className={isHomepage ? "hover:text-green-300" : "hover:text-green-600"}>Browse Services</Link>
            <Link href="/ai-agents" className={isHomepage ? "hover:text-green-300" : "hover:text-green-600"}>
              AI Agent Marketplace
            </Link>
            <Dropdown
              label="Users"
              items={[
                { name: "Top Rated", href: "/users/top" },
                { name: "Nearby", href: "/users/nearby" },
              ]}
              isHomepage={isHomepage}
            />
           <Link href="/about" className={isHomepage ? "hover:text-green-300" : "hover:text-green-600"}>About</Link>
            <Link href="/contact" className={isHomepage ? "hover:text-green-300" : "hover:text-green-600"}>Contact</Link>
          </nav>
          {/* Credits badge removed */}
          {/* Right buttons */}
          <Link href="/seller" className={`text-sm ${isHomepage ? "hover:text-green-300" : "hover:text-green-600"}`}>Become a Seller</Link>
          
          {user ? (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`${isHomepage ? "bg-white/20 border-white/30" : "bg-green-50 border-green-200"} border rounded-lg px-3 py-1`}>
                  <span className={`text-sm ${isHomepage ? "text-white/80" : "text-gray-600"}`}>Credits:</span>
                  <span className={`text-sm font-medium ml-1 ${isHomepage ? "text-white" : "text-green-600"}`}>{credits || 0}</span>
                </div>
              </div>
              <Link href="/dashboard">
                <button className={`text-sm px-4 py-2 rounded ${isHomepage ? "bg-white/20 text-white hover:bg-white/30" : "bg-black text-white hover:bg-gray-800"}`}>
                  Dashboard
                </button>
              </Link>
            </div>
          ) : (
            <>
              <Link href="/login" className={`text-sm ${isHomepage ? "hover:text-green-300" : "hover:text-green-600"}`}>Sign in</Link>
              <Link href="/register">
                <button className={`text-sm px-4 py-2 rounded ${isHomepage ? "bg-white/20 text-white hover:bg-white/30" : "bg-green-500 text-white hover:bg-green-600"}`}>
                  Join
                </button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button onClick={() => setOpen(!open)} className={`md:hidden ml-auto ${isHomepage ? "text-white" : "text-black"}`}>
          <FaBars size={20} />
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className={`md:hidden px-4 py-4 space-y-3 shadow-md text-sm ${isHomepage ? "bg-emerald-900/90 backdrop-blur-sm" : "bg-white"}`}>
          <Link href="/services/all" className={isHomepage ? "text-white" : "text-black"}>Browse Services</Link>
          <Link href="/users" className={isHomepage ? "text-white" : "text-black"}>Users</Link>
          <Link href="/about" className={isHomepage ? "text-white" : "text-black"}>Pages</Link>
          <Link href="/contact" className={isHomepage ? "text-white" : "text-black"}>Contact</Link>
          
          {user ? (
            <>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div className={`${isHomepage ? "bg-white/20 border-white/30" : "bg-green-50 border-green-200"} border rounded-lg px-3 py-1`}>
                  <span className={`text-sm ${isHomepage ? "text-white/80" : "text-gray-600"}`}>Credits:</span>
                  <span className={`text-sm font-medium ml-1 ${isHomepage ? "text-white" : "text-green-600"}`}>{credits || 0}</span>
                </div>
              </div>
              <Link href="/dashboard">
                <button className={`w-full py-2 rounded ${isHomepage ? "bg-white/20 text-white" : "bg-black text-white"}`}>Dashboard</button>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className={isHomepage ? "text-white" : "text-black"}>Sign in</Link>
              <Link href="/register">
                <button className={`w-full py-2 rounded ${isHomepage ? "bg-white/20 text-white" : "bg-green-500 text-white"}`}>Join</button>
              </Link>
            </>
          )}
        </div>
      )}
    </header>
  );
}
