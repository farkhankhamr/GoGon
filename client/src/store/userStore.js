import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { persist } from 'zustand/middleware';

const useUserStore = create(
    persist(
        (set) => ({
            anonId: null,
            city: null,
            institution: null,
            occupation: null,
            gender: null,
            location: null, // { lat, long }
            distanceDisplay: false, // false = city, true = distance

            toggleDistanceDisplay: () => set(state => ({ distanceDisplay: !state.distanceDisplay })),

            initUser: (data) => {
                set((state) => ({
                    anonId: state.anonId || uuidv4(),
                    ...data
                }));
            },

            setLocation: (lat, long) => set({ location: { lat, long } }),

            // Rotate rule implementation hints could go here, for now just basic ID
            regenerateId: () => set({ anonId: uuidv4() }),
        }),
        {
            name: 'gogon-user-storage',
        }
    )
);

export default useUserStore;
