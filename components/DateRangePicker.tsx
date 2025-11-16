
import React from 'react';

const DateRangePicker = ({ onRangeChange, activeRange }) => {
    const ranges = ['Today', '7 Days', '30 Days', '90 Days'];
    return (
        <div className="flex items-center space-x-2 bg-gray-200/50 dark:bg-gray-700/50 p-1 rounded-lg">
            {ranges.map(range => (
                <button 
                    key={range} 
                    onClick={() => onRangeChange(range)}
                    className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeRange === range ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-800 dark:text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-white/50 dark:hover:bg-gray-900/20'}`}
                >
                    {range}
                </button>
            ))}
        </div>
    );
};

export default DateRangePicker;
