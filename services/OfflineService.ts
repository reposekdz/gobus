/**
 * Offline Service for Mobile App
 * Handles offline data storage, sync, and queue management
 */

interface OfflineAction {
  id: string;
  type: 'api_call' | 'local_action';
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class OfflineService {
  private dbName = 'gobus_offline_db';
  private version = 1;
  private db: IDBDatabase | null = null;
  private actionQueue: OfflineAction[] = [];
  private isOnline: boolean = navigator.onLine;
  private syncInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  private async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        this.loadActionQueue();
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('actions')) {
          const actionStore = db.createObjectStore('actions', { keyPath: 'id' });
          actionStore.createIndex('timestamp', 'timestamp', { unique: false });
          actionStore.createIndex('type', 'type', { unique: false });
        }

        if (!db.objectStoreNames.contains('cache')) {
          const cacheStore = db.createObjectStore('cache', { keyPath: 'key' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('bookings')) {
          db.createObjectStore('bookings', { keyPath: 'id' });
        }

        if (!db.objectStoreNames.contains('trips')) {
          db.createObjectStore('trips', { keyPath: 'id' });
        }
      };
    });
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Start periodic sync
    this.syncInterval = setInterval(() => {
      if (this.isOnline) {
        this.syncQueue();
      }
    }, 30000); // Sync every 30 seconds
  }

  private async loadActionQueue() {
    if (!this.db) return;

    return new Promise<void>((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readonly');
      const store = transaction.objectStore('actions');
      const request = store.getAll();

      request.onsuccess = () => {
        this.actionQueue = request.result || [];
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Queue an action for offline execution
   */
  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const id = `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const offlineAction: OfflineAction = {
      id,
      ...action,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: action.maxRetries || 3
    };

    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.add(offlineAction);

      request.onsuccess = () => {
        this.actionQueue.push(offlineAction);
        resolve(id);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cache data for offline access
   */
  async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const cacheEntry = {
        key,
        data,
        timestamp: Date.now(),
        ttl,
        expiresAt: Date.now() + ttl
      };

      const request = store.put(cacheEntry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        // Check if expired
        if (result.expiresAt < Date.now()) {
          // Delete expired entry
          const deleteTransaction = this.db!.transaction(['cache'], 'readwrite');
          const deleteStore = deleteTransaction.objectStore('cache');
          deleteStore.delete(key);
          resolve(null);
          return;
        }

        resolve(result.data);
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save booking offline
   */
  async saveBookingOffline(booking: any): Promise<void> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readwrite');
      const store = transaction.objectStore('bookings');
      const request = store.put(booking);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get offline bookings
   */
  async getOfflineBookings(): Promise<any[]> {
    if (!this.db) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['bookings'], 'readonly');
      const store = transaction.objectStore('bookings');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Sync queued actions when online
   */
  async syncQueue(): Promise<void> {
    if (!this.isOnline || this.actionQueue.length === 0) {
      return;
    }

    const actionsToSync = [...this.actionQueue];
    
    for (const action of actionsToSync) {
      try {
        if (action.type === 'api_call' && action.endpoint && action.method) {
          // Execute API call
          const response = await fetch(action.endpoint, {
            method: action.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
            },
            body: action.data ? JSON.stringify(action.data) : undefined
          });

          if (response.ok) {
            // Remove from queue
            await this.removeAction(action.id);
          } else {
            // Increment retries
            action.retries++;
            if (action.retries >= action.maxRetries) {
              // Remove after max retries
              await this.removeAction(action.id);
            } else {
              await this.updateAction(action);
            }
          }
        }
      } catch (error) {
        console.error('Failed to sync action:', error);
        action.retries++;
        if (action.retries < action.maxRetries) {
          await this.updateAction(action);
        } else {
          await this.removeAction(action.id);
        }
      }
    }
  }

  private async removeAction(id: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.delete(id);

      request.onsuccess = () => {
        this.actionQueue = this.actionQueue.filter(a => a.id !== id);
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  private async updateAction(action: OfflineAction): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['actions'], 'readwrite');
      const store = transaction.objectStore('actions');
      const request = store.put(action);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Check if online
   */
  isOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get queue status
   */
  getQueueStatus(): { total: number; pending: number } {
    return {
      total: this.actionQueue.length,
      pending: this.actionQueue.filter(a => a.retries < a.maxRetries).length
    };
  }

  /**
   * Clear expired cache
   */
  async clearExpiredCache(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      const request = index.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          if (cursor.value.expiresAt < Date.now()) {
            cursor.delete();
          }
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const offlineService = new OfflineService();

// Export for React Native (if needed)
export default OfflineService;

