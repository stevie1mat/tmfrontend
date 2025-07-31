"use client";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CategoryTabsWithBreadcrumb from "@/components/CategoriesWithBreadcrumbs";
import CategoriesGrid from "@/components/CategoriesGrid";
import TradeMinutesActionSteps from "@/components/ActionSteps";
import UsersBanner from "@/components/UsersBanner";
import UserGrid from "@/components/UserGrid";
import MapUsers from "@/components/UsersNearby";
import UsersNearbyBanner from "@/components/UsersNearbyBanner";
import ChatBotWithAuth from "@/components/ChatBotWithAuth";

export default function UsersNearby() {
  return (
    <main className="bg-white min-h-screen text-black">
      <Navbar />
      <br />
      <CategoryTabsWithBreadcrumb />
      <UsersNearbyBanner />

      <div className="max-w-7xl mx-auto px-0 py-8">
        <br />
        <MapUsers />
      </div>
      <TradeMinutesActionSteps />
      <Footer />
      <ChatBotWithAuth />
    </main>
  );
}
