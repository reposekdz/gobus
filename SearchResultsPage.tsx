import React from 'react';
import SearchResultCard from './components/SearchResultCard';

interface SearchResultsPageProps {
  results: any[];
  onTripSelect: (trip: any) => void;
  favoriteTripIds: string[];
  onToggleFavorite: (tripId: string) => void;
}

const SearchResultsPage: React.FC<SearchResultsPageProps> = ({ results, onTripSelect, favoriteTripIds, onToggleFavorite }) => {

  return (
    <div className="min-h-full">
        <div className="space-y-6">
            {results.length > 0 ? (
                results.map((result, index) => (
                    <SearchResultCard 
                        key={result.id} 
                        result={result} 
                        onSelect={() => onTripSelect(result)}
                        isFavorite={favoriteTripIds.includes(result.id)}
                        onToggleFavorite={() => onToggleFavorite(result.id)}
                        style={{ animationDelay: `${index * 100}ms` }}
                        className="stagger-fade-in"
                    />
                ))
            ) : (
                <div className="text-center py-16 bg-white dark:bg-gray-800 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-white">No Trips Found</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Try adjusting your search filters or date.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default SearchResultsPage;