import React, { useState, useMemo } from 'react';

interface FareCalendarProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date | null;
}

type FareType = 'low' | 'medium' | 'high';

const FareCalendar: React.FC<FareCalendarProps> = ({ onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const mockFares = useMemo(() => {
    const fares: { [key: number]: FareType } = {};
    for (let i = 1; i <= daysInMonth; i++) {
      const rand = Math.random();
      if (rand < 0.3) fares[i] = 'low';
      else if (rand < 0.7) fares[i] = 'medium';
      else fares[i] = 'high';
    }
    return fares;
  }, [currentDate]);

  const getFareColor = (fare: FareType) => {
    switch (fare) {
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300';
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300';
      default: return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date, d2: Date | null) => {
    if (!d2) return false;
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl p-4 border dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&lt;</button>
        <div className="font-bold text-lg dark:text-white">
          {currentDate.toLocaleString('default', { month: 'long' })} {currentDate.getFullYear()}
        </div>
        <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">&gt;</button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-500 dark:text-gray-400 mb-2">
        {['Ku cyumweru', 'Kuwa mbere', 'Kuwa kabiri', 'Kuwa gatatu', 'Kuwa kane', 'Kuwa gatanu', 'Kuwa gatandatu'].map(day => <div key={day}>{day.slice(0, 3)}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => <div key={`empty-${i}`}></div>)}
        {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const isSelected = isSameDay(date, selectedDate);
            return (
                <button
                    key={day}
                    onClick={() => onDateSelect(date)}
                    className={`p-2 rounded-lg text-sm transition-all ${getFareColor(mockFares[day])} ${isSelected ? 'ring-2 ring-blue-500' : 'hover:ring-2 hover:ring-blue-300'}`}
                >
                    {day}
                </button>
            )
        })}
      </div>
       <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
            <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-green-100 border border-green-300"></div><span>Gihendutse</span></div>
            <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-yellow-100 border border-yellow-300"></div><span>Hagati</span></div>
            <div className="flex items-center space-x-1"><div className="w-3 h-3 rounded-full bg-red-100 border border-red-300"></div><span>Gihenze</span></div>
       </div>
    </div>
  );
};

export default FareCalendar;
