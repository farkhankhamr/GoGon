import { create } from 'zustand';

const useConfigStore = create((set, get) => ({
    settings: {
        chat_enabled: false, // Default to false (Use comments)
    },
    isLoading: false,

    fetchSettings: async () => {
        set({ isLoading: true });
        try {
            // Public endpoint might be needed for clients, but for now we might just expose it
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/public/settings`);
            if (res.ok) {
                const data = await res.json();
                const settingsObj = {};
                data.settings.forEach(s => {
                    settingsObj[s.key] = s.value;
                });
                set({ settings: { ...get().settings, ...settingsObj } });
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        } finally {
            set({ isLoading: false });
        }
    },

    updateSetting: (key, value) => {
        set(state => ({
            settings: { ...state.settings, [key]: value }
        }));
    }
}));

export default useConfigStore;
