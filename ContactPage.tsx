import React, { useState } from 'react';
import { MapPinIcon, PhoneIcon, EnvelopeIcon, FacebookIcon, TwitterIcon, LinkedinIcon, ChatBubbleLeftRightIcon, PaperAirplaneIcon, CheckCircleIcon } from './components/icons';
import * as api from './services/apiService';
import { useLanguage } from './contexts/LanguageContext';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { t } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);
    try {
      await api.submitContactMessage(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (err: any) {
      setError(err.message || t('contact_error_generic'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <header className="bg-white dark:bg-gray-800/50 shadow-sm pt-12 pb-8">
            <div className="container mx-auto px-6 text-center">
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t('contact_title')}</h1>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
                    {t('contact_subtitle')}
                </p>
            </div>
      </header>
      
      <main className="container mx-auto px-6 py-12">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
                <aside className="lg:w-1/3 xl:w-1/4">
                    <div className="sticky top-24 space-y-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md space-y-6">
                           <div>
                                <h3 className="font-bold text-lg dark:text-white mb-3">{t('contact_info_title')}</h3>
                                <div className="space-y-4 text-gray-600 dark:text-gray-300">
                                    <div className="flex items-start">
                                        <MapPinIcon className="w-5 h-5 text-blue-500 mr-3 mt-1 flex-shrink-0" />
                                        <span>KN 4 Ave, Kiyovu, Kigali, Rwanda</span>
                                    </div>
                                    <div className="flex items-center">
                                        <PhoneIcon className="w-5 h-5 text-blue-500 mr-3" />
                                        <span>+250 788 123 456</span>
                                    </div>
                                    <div className="flex items-center">
                                        <EnvelopeIcon className="w-5 h-5 text-blue-500 mr-3" />
                                        <span>contact@rwandabus.rw</span>
                                    </div>
                                </div>
                           </div>
                           <div className="border-t dark:border-gray-700 pt-6">
                               <button className="w-full flex items-center justify-center py-3 px-4 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow-lg">
                                    <ChatBubbleLeftRightIcon className="w-6 h-6 mr-2"/>
                                    {t('contact_chat_button')}
                               </button>
                           </div>
                           <div className="border-t dark:border-gray-700 pt-6">
                                <h3 className="font-bold text-lg dark:text-white mb-3">{t('contact_follow_us')}</h3>
                                <div className="flex space-x-4">
                                    <a href="#" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 transition"><FacebookIcon className="h-5 w-5" /></a>
                                    <a href="#" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 transition"><TwitterIcon className="h-5 w-5" /></a>
                                    <a href="#" className="p-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 transition"><LinkedinIcon className="h-5 w-5" /></a>
                                </div>
                           </div>
                        </div>
                         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
                            <h3 className="font-bold text-lg dark:text-white mb-3">{t('contact_offices_title')}</h3>
                             <div className="w-full h-40 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden relative">
                                <img src="https://www.africa-expert.com/wp-content/uploads/2018/12/kigali-city-rwanda.jpg" alt="Map of Kigali" className="w-full h-full object-cover opacity-30" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <button className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-700 transition">{t('contact_map_button')}</button>
                                </div>
                            </div>
                         </div>
                    </div>
                </aside>

                <section className="lg:w-2/3 xl:w-3/4">
                     <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg">
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">{t('contact_form_title')}</h2>
                        {success ? (
                             <div className="text-center p-8 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-4"/>
                                <h3 className="font-bold text-xl dark:text-white">{t('contact_success_title')}</h3>
                                <p className="text-gray-600 dark:text-gray-300 mt-2">{t('contact_success_message')}</p>
                            </div>
                        ) : (
                            <form className="space-y-6" onSubmit={handleSubmit}>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('contact_form_name')}</label>
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600" required />
                                    </div>
                                    <div>
                                        <label htmlFor="email-contact" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('contact_form_email')}</label>
                                        <input type="email" id="email-contact" name="email" value={formData.email} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600" required />
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="subject" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('contact_form_subject')}</label>
                                    <input type="text" id="subject" name="subject" value={formData.subject} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600" placeholder={t('contact_form_subject_placeholder')} required />
                                </div>
                                <div>
                                    <label htmlFor="message" className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('contact_form_message')}</label>
                                    <textarea id="message" name="message" value={formData.message} onChange={handleChange} rows={5} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500 dark:bg-gray-700 dark:border-gray-600" required></textarea>
                                </div>
                                {error && <p className="text-red-500 text-sm">{error}</p>}
                                <div>
                                    <button type="submit" disabled={isLoading} className="w-full flex justify-center py-3 px-4 border border-transparent text-sm font-bold rounded-md text-[#0033A0] bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-all duration-300 shadow-lg disabled:opacity-50">
                                        {isLoading ? t('contact_form_button_loading') : <>{t('contact_form_button')} <PaperAirplaneIcon className="w-5 h-5 ml-2"/></>}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </section>
            </div>
      </main>
    </div>
  );
};

export default ContactPage;