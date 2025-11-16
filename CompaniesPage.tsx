import React, { useState, useMemo, useEffect } from 'react';
// FIX: Changed import to a named import as StarRating is not a default export.
import { StarRating } from './components/StarRating';
import { SearchIcon, ChevronRightIcon, StarIcon } from './components/icons';
import type { Page } from './App';
import * as api from './services/apiService';
import LoadingSpinner from './components/LoadingSpinner';


interface CompaniesPageProps {
  onNavigate: (page: Page, data?: any) => void;
}

const FeaturedCompanyCard: React.FC<{ company: any, onSelect: (company: any) => void }> = ({ company, onSelect }) => (
    <button 
        onClick={() => onSelect(company)} 
        className="group relative w-full h-64 rounded-xl overflow-hidden shadow-lg transform hover:-translate-y-1 transition-all duration-300"
    >
        <img src={company.cover_url} alt={company.name} className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"/>
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        <div className="relative h-full flex flex-col justify-end p-5 text-white">
            <div className="flex items-center space-x-3 mb-2">
                <img src={company.logo_url} alt={`${company.name} logo`} className="w-14 h-14 object-contain bg-white/80 dark:bg-gray-900/80 p-1 rounded-full shadow-md border-2 border-white dark:border-gray-700"/>
                <div>
                    <h3 className="text-xl font-bold drop-shadow-lg">{company.name}</h3>
                    <div className="flex items-center space-x-1">
                        <StarRating rating={4.8} size="small"/>
                        <span className="text-xs text-yellow-300 font-bold">Top Rated</span>
                    </div>
                </div>
            </div>
            <p className="text-xs text-gray-200 line-clamp-2">{company.description}</p>
        </div>
        <div className="absolute top-4 right-4 bg-yellow-400 text-blue-900 text-xs font-bold px-3 py-1 rounded-full shadow-md transform group-hover:scale-110 transition-transform">
            Featured
        </div>
    </button>
);


const CompanyCard: React.FC<{ company: any, onSelect: (company: any) => void }> = ({ company, onSelect }) => (
    <button 
        onClick={() => onSelect(company)} 
        className="w-full text-left bg-white dark:bg-gray-800 rounded-xl shadow-md p-5 flex items-center space-x-5 border-2 border-transparent hover:border-blue-500/50 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
    >
        <div className="flex-shrink-0 h-20 w-20 bg-white dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center shadow-inner">
            <img src={company.logo_url} alt={`${company.name} logo`} className="h-16 w-16 object-contain p-1"/>
        </div>
        <div className="flex-grow">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">{company.name}</h3>
            <div className="flex items-center space-x-2 mt-1">
                <StarRating rating={4.5} />
                <span className="text-sm text-yellow-500 font-bold">Highly Rated</span>
            </div>
             <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Multiple Routes</p>
        </div>
        <div className="flex-shrink-0">
            <ChevronRightIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
        </div>
    </button>
);

const CompaniesPage: React.FC<CompaniesPageProps> = ({ onNavigate }) => {
  const [allCompanies, setAllCompanies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('rating_desc');
  const [ratingFilter, setRatingFilter] = useState(0);

  useEffect(() => {
    const fetchCompanies = async () => {
        setIsLoading(true);
        try {
            const data = await api.getCompanies();
            setAllCompanies(data);
        } catch (e: any) {
            setError(e.message || 'Failed to fetch companies.');
        } finally {
            setIsLoading(false);
        }
    };
    fetchCompanies();
  }, []);

  const featuredCompanies = useMemo(() => allCompanies.slice(0, 2), [allCompanies]);
  const regularCompanies = useMemo(() => allCompanies.slice(2), [allCompanies]);

  const filteredAndSortedCompanies = useMemo(() => {
    return regularCompanies
      .filter(company => 
          company.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        switch (sortOrder) {
          case 'name_asc':
            return a.name.localeCompare(b.name);
          case 'name_desc':
            return b.name.localeCompare(a.name);
          default:
            return 0;
        }
      });
  }, [searchTerm, sortOrder, ratingFilter, regularCompanies]);

  const handleCompanySelect = (company: any) => {
      onNavigate('companyProfile', company);
  }
  

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
       <header className="bg-white dark:bg-gray-800/50 shadow-sm pt-12 pb-8">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Our Partner Companies</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                    We partner with the best bus companies in Rwanda to ensure you have a safe and comfortable journey.
                </p>
            </div>
        </header>
        <main className="container mx-auto px-6 py-12">
            
            {isLoading && <LoadingSpinner />}
            {error && <p className="text-center text-red-500">{error}</p>}

            {!isLoading && !error && (
                <>
                    <section className="mb-16">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Top Rated & Popular</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {featuredCompanies.map(company => (
                                <FeaturedCompanyCard key={company.id} company={company} onSelect={handleCompanySelect} />
                            ))}
                        </div>
                    </section>
                    
                    <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                        <aside className="lg:w-1/4 xl:w-1/5">
                            <div className="sticky top-24 space-y-6">
                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md">
                                    <h3 className="text-lg font-bold mb-4 dark:text-white">Filter Companies</h3>
                                    <div className="relative mb-4">
                                        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            type="text" 
                                            placeholder="Search company..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold dark:text-gray-300">Sort by</label>
                                        <select 
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500"
                                        >
                                            <option value="rating_desc">Popularity</option>
                                            <option value="name_asc">Name (A-Z)</option>
                                            <option value="name_desc">Name (Z-A)</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </aside>
                        <section className="lg:w-3/4 xl:w-4/5">
                            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">All Companies</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {filteredAndSortedCompanies.length > 0 ? (
                                filteredAndSortedCompanies.map(company => (
                                <CompanyCard key={company.id} company={company} onSelect={handleCompanySelect} />
                                ))
                            ) : (
                                <p className="md:col-span-2 text-center text-gray-500 dark:text-gray-400">No companies match your search.</p>
                            )}
                            </div>
                        </section>
                    </div>
                </>
            )}
        </main>
    </div>
  );
};

export default CompaniesPage;
