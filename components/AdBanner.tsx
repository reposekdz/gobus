import React from 'react';

interface AdBannerProps {
  type: 'banner' | 'sidebar' | 'inline';
}

const AdBanner: React.FC<AdBannerProps> = ({ type }) => {
  const adContent = {
    title: 'Gura Isabune ya MENYA NEZA!',
    description: 'Isuku n\'ubuzima. Boneka mu maduka yose.',
  };
  
  const baseClasses = "rounded-lg p-4 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 text-gray-800 dark:text-gray-200 shadow-md relative overflow-hidden group";

  if (type === 'banner') {
    return (
      <div className={`${baseClasses} text-center`}>
        <span className="absolute top-2 right-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">AD</span>
        <h3 className="font-bold text-lg">{adContent.title}</h3>
        <p className="text-sm">{adContent.description}</p>
      </div>
    );
  }

  if (type === 'sidebar') {
     return (
      <div className={`${baseClasses} flex flex-col items-center text-center`}>
        <span className="absolute top-2 right-2 text-xs bg-gray-500 text-white px-2 py-0.5 rounded-full">AD</span>
         <div className="w-16 h-16 bg-blue-400 rounded-full mb-2"></div>
        <h4 className="font-bold">{adContent.title}</h4>
        <p className="text-xs">{adContent.description}</p>
        <button className="mt-2 text-xs text-blue-500 dark:text-blue-400 font-semibold">Gura ubu</button>
      </div>
    );
  }

  return null; // For other types
};

export default AdBanner;