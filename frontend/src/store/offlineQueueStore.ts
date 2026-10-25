import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TapQueueItem } from '../types';

// Harmonic 2-tone chime sound for tap confirmation
const playTapAudio = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // First tone (D5 - 587Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    gain1.gain.setValueAtTime(0.15, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.08);

    // Second confirmation tone (A5 - 880Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, ctx.currentTime + 0.06);
    gain2.gain.setValueAtTime(0.18, ctx.currentTime + 0.06);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.06);
    osc2.stop(ctx.currentTime + 0.18);
  } catch (e) {
    // Audio autoplay restrictions or not supported
  }
};

interface PosSessionCounter {
  total: number;
  paroki_bintaro: number;
  luar_paroki: number;
}

interface OfflineQueueState {
  queue: TapQueueItem[];
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncError: string | null;
  lastSyncSuccess: string | null;
  posCounters: Record<string, PosSessionCounter>; // keyed by posToken

  setOnlineStatus: (status: boolean) => void;
  recordTap: (posToken: string, choiceCode: 'PAROKI_BINTARO' | 'LUAR_PAROKI', metadata?: Record<string, any>) => void;
  syncQueue: (posToken: string) => Promise<void>;
  resetPosCounter: (posToken: string) => void;
}

export const useOfflineQueueStore = create<OfflineQueueState>()(
  persist(
    (set, get) => ({
      queue: [],
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      isSyncing: false,
      lastSyncError: null,
      lastSyncSuccess: null,
      posCounters: {},

      setOnlineStatus: (status: boolean) => set({ isOnline: status }),

      recordTap: (posToken, choiceCode, metadata) => {
        // 1. Instant tactile feedback
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try {
            navigator.vibrate(35);
          } catch (e) {}
        }
        playTapAudio();

        const id = typeof crypto !== 'undefined' && crypto.randomUUID 
          ? crypto.randomUUID() 
          : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        const clientTimestamp = new Date().toISOString();

        const tapItem: TapQueueItem = {
          id,
          posToken,
          choiceCode,
          clientTimestamp,
          metadata,
        };

        // 2. Update local state immediately (< 5ms)
        const currentCounters = get().posCounters[posToken] || { total: 0, paroki_bintaro: 0, luar_paroki: 0 };
        const newCounters: PosSessionCounter = {
          total: currentCounters.total + 1,
          paroki_bintaro: currentCounters.paroki_bintaro + (choiceCode === 'PAROKI_BINTARO' ? 1 : 0),
          luar_paroki: currentCounters.luar_paroki + (choiceCode === 'LUAR_PAROKI' ? 1 : 0),
        };

        set((state) => ({
          queue: [...state.queue, tapItem],
          posCounters: {
            ...state.posCounters,
            [posToken]: newCounters,
          },
        }));

        // 3. Trigger optimistic background sync
        get().syncQueue(posToken);
      },

      syncQueue: async (posToken: string) => {
        const state = get();
        if (state.isSyncing) return;

        const pendingTaps = state.queue.filter((item) => item.posToken === posToken);
        if (pendingTaps.length === 0) return;

        set({ isSyncing: true, lastSyncError: null });

        try {
          const payload = {
            taps: pendingTaps.map((t) => ({
              id: t.id,
              choice_code: t.choiceCode,
              client_timestamp: t.clientTimestamp,
              metadata: t.metadata,
            })),
          };

          const response = await fetch(`/api/counter/${posToken}/sync`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          });

          if (!response.ok) {
            throw new Error(`Server returned status ${response.status}`);
          }

          const result = await response.json();
          const syncedIds = new Set(pendingTaps.map((t) => t.id));

          // Successfully synced, prune from queue
          set((s) => ({
            queue: s.queue.filter((t) => !syncedIds.has(t.id)),
            isSyncing: false,
            isOnline: true,
            lastSyncSuccess: `${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB`,
            lastSyncError: null,
          }));
        } catch (error: any) {
          // Keep in queue and wait for reconnect or next retry
          set({
            isSyncing: false,
            isOnline: typeof navigator !== 'undefined' ? navigator.onLine : false,
            lastSyncError: error.message || 'Gagal terhubung ke server',
          });
        }
      },

      resetPosCounter: (posToken: string) => {
        set((state) => ({
          posCounters: {
            ...state.posCounters,
            [posToken]: { total: 0, paroki_bintaro: 0, luar_paroki: 0 },
          },
        }));
      },
    }),
    {
      name: 'paroki-kiosk-offline-queue',
      partialize: (state) => ({
        queue: state.queue,
        posCounters: state.posCounters,
      }),
    }
  )
);
