import React from 'react';

const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0 sm:space-x-6 animate-pulse">
        <div className="flex-shrink-0 w-full sm:w-auto text-center sm:text-left">
            <div className="h-6 w-32 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
            <div className="flex items-center justify-center sm:justify-start space-x-3 mt-2">
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
                <div className="w-5 h-5 bg-gray-300 dark:bg-gray-700 rounded-full"></div>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="text-center">
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded-md mt-2"></div>
            </div>
            <div className="w-20 h-0.5 bg-gray-300 dark:bg-gray-600 my-1"></div>
            <div className="text-center">
                <div className="h-6 w-20 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
                <div className="h-4 w-12 bg-gray-200 dark:bg-gray-600 rounded-md mt-2"></div>
            </div>
        </div>
        <div className="text-center flex-shrink-0">
            <div className="h-8 w-24 bg-gray-300 dark:bg-gray-700 rounded-md"></div>
            <div className="h-4 w-28 bg-gray-200 dark:bg-gray-600 rounded-md mt-2"></div>
        </div>
        <div className="flex items-center space-x-2">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="w-40 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg"></div>
        </div>
    </div>
);

interface SearchResultSkeletonProps {
    count?: number;
}

const SearchResultSkeleton: React.FC<SearchResultSkeletonProps> = ({ count = 3 }) => {
    return (
        <div className="space-y-6">
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
};

export default SearchResultSkeleton;
