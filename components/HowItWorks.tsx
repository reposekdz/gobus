import React from 'react';
import { SearchIcon, CheckCircleIcon, TicketIcon, CreditCardIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface StepProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Step: React.FC<StepProps> = ({ icon, title, description }) => (
  <div className="flex flex-col items-center text-center max-w-xs">
    <div className="mb-4 p-5 rounded-full bg-gradient-to-br from-blue-400 to-green-400 text-white shadow-lg">
      {icon}
    </div>
    <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">{title}</h3>
    <p className="text-gray-600 dark:text-gray-400">{description}</p>
  </div>
);

const HowItWorks: React.FC = () => {
  const { t } = useLanguage();
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-yellow-50/30 to-white dark:from-gray-800/30 dark:to-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight sm:text-4xl">{t('howitworks_title')}</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">{t('howitworks_subtitle')}</p>
        </div>
        <div className="flex flex-col md:flex-row flex-wrap justify-center items-start gap-y-12 md:gap-x-8 lg:gap-x-16">
          <Step
            icon={<SearchIcon className="w-10 h-10" />}
            title={t('howitworks_step1_title')}
            description={t('howitworks_step1_desc')}
          />
          <Step
            icon={<CheckCircleIcon className="w-10 h-10" />}
            title={t('howitworks_step2_title')}
            description={t('howitworks_step2_desc')}
          />
           <Step
            icon={<CreditCardIcon className="w-10 h-10" />}
            title={t('howitworks_step3_title')}
            description={t('howitworks_step3_desc')}
          />
          <Step
            icon={<TicketIcon className="w-10 h-10" />}
            title={t('howitworks_step4_title')}
            description={t('howitworks_step4_desc')}
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;