import React, { useEffect } from 'react';
import * as api from '../services/apiService';
import { useAuth } from '../contexts/AuthContext';

// This is a public key for the VAPID protocol, used to identify the application server.
// It is now loaded from a Vite environment variable for better deployment configuration.
// FIX: Cast import.meta to any to resolve TypeScript errors when Vite client types are not available.
const VAPID_PUBLIC_KEY = (import.meta as any).env.VITE_VAPID_PUBLIC_KEY;

// Helper function to convert the VAPID key to the format required by the Push API.
function urlBase64ToUint8Array(base64String: string) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}


const NotificationHandler: React.FC = () => {
    const { user } = useAuth();

    useEffect(() => {
        if (!user || !('serviceWorker' in navigator) || !('PushManager' in window)) {
            return;
        }
        
        if (!VAPID_PUBLIC_KEY) {
            console.error('VITE_VAPID_PUBLIC_KEY is not set in the environment. Push notifications will not work.');
            return;
        }

        const subscribeUser = async () => {
            try {
                const swRegistration = await navigator.serviceWorker.register('/sw.js');
                let subscription = await swRegistration.pushManager.getSubscription();

                if (subscription === null) {
                    subscription = await swRegistration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
                    });
                }
                
                await api.subscribePush({
                    endpoint: subscription.endpoint,
                    keys: {
                        p256dh: subscription.toJSON().keys!.p256dh,
                        auth: subscription.toJSON().keys!.auth
                    },
                    platform: 'web'
                });

            } catch (error) {
                console.error('Failed to subscribe to push notifications:', error);
            }
        };
        
        if (Notification.permission === 'granted') {
            subscribeUser();
        } else if (Notification.permission === 'default') {
            // In a real app, you would show a UI element before this prompt.
            Notification.requestPermission().then(permission => {
                if (permission === 'granted') {
                    subscribeUser();
                }
            });
        }
    }, [user]);

    return null; // This component does not render anything.
};

export default NotificationHandler;