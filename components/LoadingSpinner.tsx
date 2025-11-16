import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 bg-black/70 z-[9999] flex flex-col items-center justify-center backdrop-blur-sm text-white">
      <div className="relative w-24 h-24">
        {/* Outer ring */}
        <div className="absolute inset-0 border-4 border-blue-400/30 rounded-full animate-spin" style={{ animationDuration: '3s' }}></div>
        {/* Middle ring */}
        <div className="absolute inset-2 border-4 border-yellow-300/40 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '2.5s' }}></div>
        {/* Inner pulsating dot */}
        <div className="absolute inset-6 bg-green-400 rounded-full animate-pulse"></div>
      </div>
      <p className="mt-6 text-lg font-semibold tracking-widest animate-pulse">
        Tegereza birimo birakorwa...
      </p>
      <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
    </div>
  );
};

export default LoadingSpinner;
