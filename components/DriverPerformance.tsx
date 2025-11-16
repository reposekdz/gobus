import React from 'react';
import { ChartPieIcon, ShieldCheckIcon } from './icons';

const mockPerformanceData = {
    onTimeRateHistory: [
        { month: 'May', value: 98 }, { month: 'Jun', value: 97 }, { month: 'Jul', value: 99 },
        { month: 'Aug', value: 98.5 }, { month: 'Sep', value: 99.2 }, { month: 'Oct', value: 98.8 }
    ],
    ratingHistory: [
        { month: 'May', value: 4.7 }, { month: 'Jun', value: 4.8 }, { month: 'Jul', value: 4.75 },
        { month: 'Aug', value: 4.85 }, { month: 'Sep', value: 4.9 }, { month: 'Oct', value: 4.8 }
    ],
};

// --- CHART COMPONENTS ---

const LineChart = ({ data, title, color, unit, yMax }) => {
    const width = 500;
    const height = 200;
    const padding = 40;
    const points = data.map((point, i) => {
        const x = padding + i * (width - 2 * padding) / (data.length - 1);
        const y = height - padding - ((point.value / yMax) * (height - 2 * padding));
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">{title}</h4>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
                {/* Y-axis labels */}
                <text x="15" y={padding + 5} textAnchor="middle" fill="currentColor" className="text-xs text-gray-400">{yMax}{unit}</text>
                <text x="15" y={height-padding+5} textAnchor="middle" fill="currentColor" className="text-xs text-gray-400">0{unit}</text>
                {/* X-axis labels */}
                {data.map((point, i) => (
                    <text key={point.month} x={padding + i * (width - 2 * padding) / (data.length - 1)} y={height-15} textAnchor="middle" fill="currentColor" className="text-xs text-gray-400">{point.month}</text>
                ))}
                {/* Line */}
                <polyline fill="none" stroke={color} strokeWidth="3" points={points} strokeLinecap="round" strokeLinejoin="round"/>
                {/* Points */}
                {data.map((point, i) => {
                     const x = padding + i * (width - 2 * padding) / (data.length - 1);
                     const y = height - padding - ((point.value / yMax) * (height - 2 * padding));
                     return (
                         <g key={i}>
                            <circle cx={x} cy={y} r="8" fill={color} fillOpacity="0.2" className="opacity-0 hover:opacity-100 transition-opacity"/>
                            <circle cx={x} cy={y} r="4" fill={color} />
                         </g>
                     )
                })}
            </svg>
        </div>
    );
};

const RadialProgress = ({ value, label, color }) => {
    const size = 150;
    const strokeWidth = 15;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / 100) * circumference;

    return (
        <div className="flex flex-col items-center justify-center">
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <circle className="text-gray-200 dark:text-gray-700" strokeWidth={strokeWidth} stroke="currentColor" fill="transparent" r={radius} cx={size/2} cy={size/2}/>
                <circle 
                    className={color}
                    strokeWidth={strokeWidth} 
                    strokeDasharray={circumference} 
                    strokeDashoffset={offset}
                    strokeLinecap="round" 
                    stroke="currentColor" 
                    fill="transparent" 
                    r={radius} 
                    cx={size/2} 
                    cy={size/2}
                    style={{ transition: 'stroke-dashoffset 0.5s ease-out', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
                />
                <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="text-3xl font-bold fill-current text-gray-800 dark:text-white">
                    {value}%
                </text>
            </svg>
            <p className="font-bold text-lg mt-2">{label}</p>
        </div>
    )
}

// --- MAIN COMPONENT ---

const DriverPerformance = ({ performanceData }) => {
    if (!performanceData) {
        return <p>No performance data available.</p>;
    }
    
    return (
        <div className="animate-fade-in space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex items-center justify-center bg-gray-50 dark:bg-gray-700/50 p-6 rounded-lg">
                    <RadialProgress value={performanceData.safetyScore} label="Safety Score" color="text-green-500"/>
                </div>
                 <div className="md:col-span-2 space-y-4">
                    <LineChart data={mockPerformanceData.onTimeRateHistory} title="On-Time Rate (%)" color="#3b82f6" unit="%" yMax={100}/>
                    <LineChart data={mockPerformanceData.ratingHistory} title="Average Passenger Rating" color="#f59e0b" unit="/5" yMax={5}/>
                 </div>
            </div>
        </div>
    );
};

export default DriverPerformance;
