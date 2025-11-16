import React, { useState, useEffect } from 'react';
import { CogIcon, CameraIcon } from '../components/icons';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';

const ManageSite: React.FC = () => {
    const [heroImage, setHeroImage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await api.getSetting('hero_image');
                if (res.data.setting_value) {
                    setHeroImage(res.data.setting_value);
                }
            } catch (e) {
                setError('Failed to load site settings.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchSettings();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setHeroImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSave = async () => {
        setIsLoading(true);
        setError('');
        try {
            await api.adminUpdateSetting('hero_image', heroImage);
            alert('Hero image updated successfully!');
        } catch (e) {
            setError('Failed to save settings.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            {isLoading && <LoadingSpinner />}
            <h1 className="text-3xl font-bold dark:text-gray-200 mb-6">Site Settings</h1>
            
            <div className="bg-white dark:bg-gray-800/50 p-6 rounded-2xl shadow-lg">
                <h2 className="text-xl font-bold dark:text-white mb-4">Home Page</h2>
                
                {error && <p className="text-red-500 my-2">{error}</p>}
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Hero Section Background Image</label>
                        <div className="mt-2 group relative w-full h-48 bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                            {heroImage && <img src={heroImage} alt="Hero preview" className="w-full h-full object-cover"/>}
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <label htmlFor="hero-upload" className="flex items-center text-white font-semibold cursor-pointer p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                                    <CameraIcon className="w-5 h-5 mr-2" />
                                    Change Image
                                </label>
                                <input id="hero-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button onClick={handleSave} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ManageSite;
