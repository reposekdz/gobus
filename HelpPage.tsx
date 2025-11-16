import React, { useState, useMemo } from 'react';
import { SearchIcon, TicketIcon, UserCircleIcon, BusIcon, QuestionMarkCircleIcon, ChevronRightIcon } from './components/icons';
import { useLanguage } from './contexts/LanguageContext';

const FAQItem: React.FC<{ faq: { question: string; answer: string }; isOpen: boolean; onClick: () => void }> = ({ faq, isOpen, onClick }) => (
    <div className="border-b dark:border-gray-700">
        <h2>
            <button type="button" onClick={onClick} className="flex justify-between items-center w-full p-5 font-medium text-left text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <span>{faq.question}</span>
                <ChevronRightIcon className={`w-6 h-6 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
            </button>
        </h2>
        <div className={`transition-[max-height] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
             <div className="p-5 pt-0 border-t-0 border-gray-200 dark:border-gray-700">
                <p className="text-gray-500 dark:text-gray-400">{faq.answer}</p>
            </div>
        </div>
    </div>
);


const HelpPage: React.FC = () => {
    const { t } = useLanguage();
    const [openFaq, setOpenFaq] = useState<number | null>(0);
    const [activeCategory, setActiveCategory] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    const faqData = useMemo(() => [
        { category: 'faq_cat_booking', question: t('faq_q1'), answer: t('faq_a1') },
        { category: 'faq_cat_booking', question: t('faq_q2'), answer: t('faq_a2') },
        { category: 'faq_cat_account', question: t('faq_q3'), answer: t('faq_a3') },
        { category: 'faq_cat_onboard', question: t('faq_q4'), answer: t('faq_a4') },
        { category: 'faq_cat_account', question: t('faq_q5'), answer: t('faq_a5') },
        { category: 'faq_cat_other', question: t('faq_q6'), answer: t('faq_a6') }
    ], [t]);

    const handleFaqClick = (index: number) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    const categories = useMemo(() => [
        { name: 'All', label: t('faq_cat_all'), icon: QuestionMarkCircleIcon },
        { name: 'faq_cat_booking', label: t('faq_cat_booking'), icon: TicketIcon },
        { name: 'faq_cat_account', label: t('faq_cat_account'), icon: UserCircleIcon },
        { name: 'faq_cat_onboard', label: t('faq_cat_onboard'), icon: BusIcon },
        { name: 'faq_cat_other', label: t('faq_cat_other'), icon: QuestionMarkCircleIcon },
    ], [t]);
    
    const filteredFaqs = useMemo(() => {
        return faqData.filter(faq => 
            (activeCategory === 'All' || faq.category === activeCategory) &&
            (faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || faq.answer.toLowerCase().includes(searchTerm.toLowerCase()))
        );
    }, [activeCategory, searchTerm, faqData]);

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800/50 shadow-sm pt-12 pb-8">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('help_title')}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                    {t('help_subtitle')}
                </p>
                 <div className="max-w-xl mx-auto mt-6">
                    <div className="relative">
                        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                            type="search" 
                            placeholder={t('help_search_placeholder')}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-full bg-white dark:bg-gray-700 focus:ring-2 focus:ring-yellow-500" />
                    </div>
                </div>
            </div>
        </header>

       <main className="container mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                 <aside className="lg:w-1/4 xl:w-1/5">
                    <nav className="sticky top-24 space-y-2">
                        <h3 className="px-3 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400 tracking-wider">{t('help_categories_title')}</h3>
                         {categories.map(category => (
                            <button
                                key={category.name}
                                onClick={() => setActiveCategory(category.name)}
                                className={`w-full flex items-center p-3 rounded-lg text-left transition-all duration-200 group ${
                                    activeCategory === category.name 
                                    ? 'bg-blue-600 text-white shadow-lg' 
                                    : 'hover:bg-gray-200 dark:hover:bg-gray-700/50'
                                }`}
                            >
                                <category.icon className={`w-6 h-6 mr-3 flex-shrink-0 transition-colors ${activeCategory === category.name ? 'text-white' : 'text-blue-500'}`} />
                                <span className={`font-semibold ${activeCategory === category.name ? 'text-white' : 'text-gray-800 dark:text-white'}`}>{category.label}</span>
                            </button>
                        ))}
                    </nav>
                 </aside>

                <section className="lg:w-3/4 xl:w-4/5">
                     <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md border dark:border-gray-700">
                        {filteredFaqs.length > 0 ? filteredFaqs.map((faq, index) => (
                            <FAQItem 
                                key={index} 
                                faq={faq} 
                                isOpen={openFaq === index} 
                                onClick={() => handleFaqClick(index)}
                            />
                        )) : <p className="p-5 text-gray-500 dark:text-gray-400">{t('help_no_results')}</p>}
                      </div>
                </section>
            </div>
        </main>
    </div>
  );
};

export default HelpPage;
