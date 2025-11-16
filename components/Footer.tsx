import React from 'react';
import { FacebookIcon, TwitterIcon, LinkedinIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

const FooterLink: React.FC<{ href: string; children: React.ReactNode }> = ({ href, children }) => (
  <a href={href} className="text-gray-400 hover:text-yellow-300 transition-colors duration-300">{children}</a>
);

const Footer: React.FC = () => {
  const { t } = useLanguage();
  return (
    <footer className="bg-gradient-to-r from-[#002B7F] to-[#204F46] text-white dark:from-gray-900 dark:to-black">
      <div className="container mx-auto px-6 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h4 className="font-bold text-lg mb-4">{t('footer_about')}</h4>
            <ul className="space-y-2">
              <li><FooterLink href="#">{t('footer_about_history')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_about_careers')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_about_press')}</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('footer_services')}</h4>
            <ul className="space-y-2">
              <li><FooterLink href="#">{t('footer_services_booking')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_services_charter')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_services_info')}</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('footer_help')}</h4>
            <ul className="space-y-2">
              <li><FooterLink href="#">{t('footer_help_faq')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_help_contact')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_help_center')}</FooterLink></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-lg mb-4">{t('footer_legal')}</h4>
            <ul className="space-y-2">
              <li><FooterLink href="#">{t('footer_legal_terms')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_legal_privacy')}</FooterLink></li>
              <li><FooterLink href="#">{t('footer_legal_cookies')}</FooterLink></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 sm:mb-0">{t('footer_copyright')}</p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white"><FacebookIcon className="h-6 w-6" /></a>
            <a href="#" className="text-gray-400 hover:text-white"><TwitterIcon className="h-6 w-6" /></a>
            <a href="#" className="text-gray-400 hover:text-white"><LinkedinIcon className="h-6 w-6" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;