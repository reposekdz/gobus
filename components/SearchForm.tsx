import React, { useState } from 'react';
import { apiService } from '../lib/api-services';

interface SearchFormProps {
  onResults: (trips: any[]) => void;
}

export const SearchForm: React.FC<SearchFormProps> = ({ onResults }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    date: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.get(
        `/trips/search?origin=${formData.origin}&destination=${formData.destination}&date=${formData.date}`
      );
      onResults(response.data.trips);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <input
            type="text"
            value={formData.origin}
            onChange={(e) => setFormData({...formData, origin: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Origin city"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">To</label>
          <input
            type="text"
            value={formData.destination}
            onChange={(e) => setFormData({...formData, destination: e.target.value})}
            className="w-full border rounded px-3 py-2"
            placeholder="Destination city"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Date</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({...formData, date: e.target.value})}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </div>
    </form>
  );
};