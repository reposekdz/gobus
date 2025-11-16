import React, { useState } from 'react';
import { XIcon, WrenchScrewdriverIcon } from './icons';

const VehicleReportModal = ({ busId, onClose }) => {
    const [issueType, setIssueType] = useState('');
    const [details, setDetails] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        console.log({ busId, issueType, details });
        setTimeout(() => {
            alert('Maintenance report submitted successfully!');
            setIsSubmitting(false);
            onClose();
        }, 1000);
    };

    return (
        <div 
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 animate-fade-in"
          onClick={onClose}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full"
            onClick={e => e.stopPropagation()}
          >
            <header className="p-4 border-b dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center">
                <WrenchScrewdriverIcon className="w-6 h-6 mr-3 text-red-500"/>
                Report Vehicle Issue
              </h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                <XIcon className="w-5 h-5 text-gray-500" />
              </button>
            </header>
            <form onSubmit={handleSubmit}>
                <main className="p-6 space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Submitting a report for bus: <span className="font-bold font-mono text-gray-800 dark:text-gray-200">{busId}</span>
                    </p>
                     <div>
                        <label className="text-sm font-medium dark:text-gray-300">Issue Type</label>
                        <select 
                            value={issueType} 
                            onChange={e => setIssueType(e.target.value)} 
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            required
                        >
                            <option value="">-- Select an issue --</option>
                            <option value="engine">Engine Problem</option>
                            <option value="brakes">Brakes</option>
                            <option value="tires">Tires</option>
                            <option value="ac">Air Conditioning</option>
                            <option value="lights">Lights</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-medium dark:text-gray-300">Details</label>
                        <textarea 
                            value={details}
                            onChange={e => setDetails(e.target.value)}
                            rows={4}
                            className="mt-1 w-full p-2 border rounded-md dark:bg-gray-700 dark:border-gray-600"
                            placeholder="Please provide as much detail as possible..."
                            required
                        />
                    </div>
                </main>
                <footer className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-b-xl flex justify-end space-x-3">
                     <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-semibold border rounded-lg dark:border-gray-600">Cancel</button>
                    <button type="submit" disabled={isSubmitting} className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
                        {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </button>
                </footer>
            </form>
          </div>
        </div>
    );
};

export default VehicleReportModal;
