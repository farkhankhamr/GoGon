import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';

const ANON_ROTATION_DAYS = 7;
const ROTATION_MS = ANON_ROTATION_DAYS * 24 * 60 * 60 * 1000;

function getOrCreateAnonId() {
    const stored = localStorage.getItem('ANON_ID');
    const lastRotated = localStorage.getItem('ANON_ROTATED_AT');
    const now = Date.now();
    if (!stored || !lastRotated || (now - parseInt(lastRotated)) > ROTATION_MS) {
        const newId = crypto.randomUUID();
        localStorage.setItem('ANON_ID', newId);
        localStorage.setItem('ANON_ROTATED_AT', String(now));
        return newId;
    }
    return stored;
}

const useUserStore = create(
    persist(
        (set, get) => ({
            anonId: getOrCreateAnonId(),
            previousAnonIds: [], // all past session IDs for "Aku" tab history
            city: null,
            institution: null,
            occupation: null,
            gender: null,
            location: null, // { lat, long }
            distanceDisplay: false, // false = city, true = distance

            toggleDistanceDisplay: () => set(state => ({ distanceDisplay: !state.distanceDisplay })),

            initUser: (data) => {
                const oldId = get().anonId;
                const newId = uuidv4();
                set((state) => {
                    const prevIds = Array.from(new Set([...(state.previousAnonIds || []), oldId].filter(Boolean)));
                    return {
                        anonId: newId,
                        previousAnonIds: prevIds,
                        ...data
                    };
                });
            },

            setLocation: (lat, long) => set({ location: { lat, long } }),

            getAllAnonIds: () => {
                const state = get();
                return Array.from(new Set([state.anonId, ...(state.previousAnonIds || [])].filter(Boolean)));
            },

            regenerateId: () => set({ anonId: uuidv4() }),
        }),
        {
            name: 'gogon-user-storage',
        }
    )
);

export default useUserStore;
