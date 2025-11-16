import { useState, useEffect } from 'react';
// In a real app, you would use:
// import NetInfo from "@react-native-community/netinfo";

const OFFLINE_QUEUE_KEY = '@GoBus:agent_offline_queue';

export default function useNetwork() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // This is a mock. A real implementation would use NetInfo.
    // console.log("Network simulation active: Toggling every 15s.");
    const interval = setInterval(() => {
      setIsOnline(prev => {
        // console.log(`Simulating network change: ${!prev ? 'Online' : 'Offline'}`);
        return !prev;
      });
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline };
}
