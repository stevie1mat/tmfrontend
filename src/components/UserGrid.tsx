'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import { FiChevronLeft, FiChevronRight, FiMapPin, FiStar, FiAward, FiClock, FiUsers, FiEye } from 'react-icons/fi';
import Link from 'next/link';

const filterOptions = ['Skills', 'Price', 'Location', 'Level', 'Languages'];

export default function UserGrid() {
  const [filters, setFilters] = useState({
    Skills: '',
    Price: '',
    Location: '',
    Level: '',
    Languages: '',
  });
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const USERS_PER_PAGE = 8;

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  // Realtime polling for top users
  useEffect(() => {
    const API_BASE = process.env.NEXT_PUBLIC_AUTH_API_URL || 'https://tmuserservice.onrender.com';
    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/auth/users/top?page=${page}&limit=${USERS_PER_PAGE}`);
        if (!res.ok) throw new Error('Failed to fetch top users');
        const data = await res.json();
        const usersArr = Array.isArray(data) ? data : (data.data || []);
        setUsers(usersArr);
        // Calculate total pages if count is available
        if (typeof data.count === 'number') {
          setTotalPages(Math.max(1, Math.ceil(data.count / USERS_PER_PAGE)));
        } else {
          setTotalPages(1);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [page]);

  return (
    <section className="mt-10 px-4">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Top Community Members</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover the most trusted and skilled members of our community. These top-rated users have helped countless others and earned excellent reviews.
        </p>
      </div>

      {/* Enhanced Filters & Pagination */}
      <div className="flex flex-wrap gap-4 mb-10 items-center justify-between bg-white p-6 rounded-xl shadow-sm border">
        <div className="flex flex-wrap gap-3">
          {filterOptions.map((filter) => (
            <div key={filter} className="relative">
              <button className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-700 bg-white hover:bg-gray-50 hover:border-emerald-300 transition-all duration-200 flex items-center gap-2">
                {filter} 
                <span className="text-emerald-600">▾</span>
              </button>
            </div>
          ))}
        </div>
        {/* Enhanced Pagination Controls */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous Page"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-700 min-w-[2rem] text-center">{page}</span>
            <button
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next Page"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {loading && (
        <div className="text-center py-12">
          <div className="inline-flex items-center gap-3 text-gray-500">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600"></div>
            <span>Loading top users...</span>
          </div>
        </div>
      )}
      
      {error && (
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Enhanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {users.map((user, index) => (
          <div
            key={user.id}
            className="group relative bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 overflow-hidden"
          >
            {/* Top Badge for Top 3 */}
            {index < 3 && (
              <div className="absolute top-4 left-4 z-10">
                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  'bg-orange-100 text-orange-800'
                }`}>
                  <FiAward className="w-3 h-3" />
                  {index === 0 ? '1st' : index === 1 ? '2nd' : '3rd'}
                </div>
              </div>
            )}

            {/* Online Status */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                Online
              </div>
            </div>

            {/* Header with Avatar */}
            <div className="relative p-6 pb-4">
              <div className="flex items-center gap-4">
                {/* Enhanced Avatar */}
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden ring-4 ring-emerald-50 group-hover:ring-emerald-100 transition-all duration-300">
                    {(() => {
                      const pic = user.avatar && user.avatar.trim() !== ''
                        ? user.avatar
                        : user.ProfilePictureURL && user.ProfilePictureURL.trim() !== ''
                          ? user.ProfilePictureURL
                          : user.profilePictureURL && typeof user.profilePictureURL === 'string' && user.profilePictureURL.trim() !== ''
                            ? user.profilePictureURL
                            : "/categories-banner.png";
                      return (
                        <Image
                          src={pic}
                          alt={user.name}
                          width={64}
                          height={64}
                          className="object-cover w-full h-full"
                        />
                      );
                    })()}
                  </div>
                  {/* Verification Badge */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                </div>

                {/* Name and Role */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg text-gray-900 truncate group-hover:text-emerald-700 transition-colors">
                    {user.name}
                  </h3>
                  <p className="text-sm text-gray-500 truncate">{user.role || 'Community Member'}</p>
                </div>
              </div>
            </div>

            {/* Rating Section */}
            <div className="px-6 pb-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <FiStar 
                      key={i} 
                      className={`w-4 h-4 ${
                        i < Math.floor(user.rating || 0) 
                          ? 'text-yellow-400 fill-current' 
                          : 'text-gray-300'
                      }`} 
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-gray-700">{user.rating || 4.5}</span>
                <span className="text-xs text-gray-400">({user.reviews || 0} reviews)</span>
              </div>
            </div>

            {/* Skills Section */}
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {(user.skills || []).slice(0, 3).map((skill: string, i: number) => (
                  <span
                    key={i}
                    className="px-3 py-1 rounded-full text-xs bg-emerald-50 text-emerald-700 font-medium"
                  >
                    {skill}
                  </span>
                ))}
                {(user.skills || []).length > 3 && (
                  <span className="px-3 py-1 rounded-full text-xs bg-gray-100 text-gray-600 font-medium">
                    +{(user.skills || []).length - 3} more
                  </span>
                )}
              </div>
            </div>

            {/* Stats Section */}
            <div className="px-6 pb-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center mb-1">
                    <FiMapPin className="w-4 h-4 text-blue-600" />
                  </div>
                  <p className="text-xs text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-700">{user.location || 'Remote'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center mb-1">
                    <FiClock className="w-4 h-4 text-green-600" />
                  </div>
                  <p className="text-xs text-gray-500">Rate</p>
                  <p className="text-sm font-semibold text-gray-700">{user.rate || '$25/hr'}</p>
                </div>
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center mb-1">
                    <FiUsers className="w-4 h-4 text-purple-600" />
                  </div>
                  <p className="text-xs text-gray-500">Success</p>
                  <p className="text-sm font-semibold text-gray-700">{user.success || '95%'}</p>
                </div>
              </div>
            </div>

            {/* Action Button */}
            <div className="px-6 pb-6">
              <Link
                href={`/users/${user.id || user.ID}`}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 group-hover:shadow-md"
              >
                <FiEye className="w-4 h-4" />
                View Profile
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading && !error && users.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <FiUsers className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">Try adjusting your filters or check back later.</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}