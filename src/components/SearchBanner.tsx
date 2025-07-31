'use client';

import Image from 'next/image';

interface SearchBannerProps {
  query: string;
  category?: string;
  resultCount: number;
}

export default function SearchBanner({ query, category, resultCount }: SearchBannerProps) {
    return (
        <section className="relative bg-[#FEEFE7] rounded-2xl mt-12 mx-auto max-w-7xl pl-30 px-6 py-6 overflow-hidden flex flex-col md:flex-row items-center justify-between">
            {/* Left Text */}
            <div className="relative z-10 text-left md:max-w-lg">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                    {query.trim() ? 'Search Results' : 'All Services'}
                </h2>
                <p className="text-gray-700 text-base mb-2">
                    {query.trim() ? (
                        <>
                            Showing results for: <span className="font-semibold text-gray-900">"{query}"</span>
                            {category && (
                                <> in <span className="font-semibold text-gray-900">{category}</span></>
                            )}
                        </>
                    ) : (
                        <>
                            {category ? (
                                <>Showing all services in <span className="font-semibold text-gray-900">{category}</span></>
                            ) : (
                                <>Showing all available services</>
                            )}
                        </>
                    )}
                </p>
                {resultCount > 0 && (
                    <p className="text-gray-600 text-sm mb-6">
                        Found {resultCount} service{resultCount !== 1 ? 's' : ''}
                    </p>
                )}
            </div>

            {/* Right Illustration */}
            <div className="hidden md:block relative z-10 pr-20">
                <Image
                    src="/categories-banner.png"
                    alt="Search Illustration"
                    width={250}
                    height={160}
                    className="object-contain"
                />
            </div>

            {/* Shapes inside banner */}
            <div className="absolute top-0 left-0 w-32 h-32 bg-[#F5D481] rounded-br-full z-0"></div>
            <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#F5B88C] rounded-tl-full z-0"></div>
        </section>
    );
} 