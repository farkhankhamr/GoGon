import { create } from 'zustand';
import useUserStore from './userStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const useFeedStore = create((set, get) => ({
    posts: [],
    intel: [],
    myPosts: [],
    loading: false,
    error: null,

    // Fetch Intel (Deals/Headsup)
    fetchIntel: async (filters = {}) => {
        try {
            const params = new URLSearchParams();
            const { city, location } = useUserStore.getState();
            const { anonId } = useUserStore.getState();

            if (city) params.append('city', city);
            if (filters.type) params.append('type', filters.type);

            if (location && location.lat) {
                params.append('lat', location.lat);
                params.append('long', location.long);
                if (filters.radius) params.append('radius', filters.radius);
            }

            params.append('anon_id', anonId);

            const res = await fetch(`${API_URL}/intel?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch intel');

            const data = await res.json();
            set({ intel: data });
        } catch (err) {
            console.error('Fetch intel failed:', err);
        }
    },

    fetchPosts: async (filters = {}) => {
        set({ loading: true });
        try {
            const params = new URLSearchParams();
            // user defaults
            const { city, institution, location } = useUserStore.getState();

            // Merge defaults with explicit filters
            const finalFilters = { city, institution, ...filters };

            if (finalFilters.city) params.append('city', finalFilters.city);
            if (finalFilters.institution) params.append('institution', finalFilters.institution);
            if (finalFilters.topic) params.append('topic', finalFilters.topic);

            // Geo filters
            if (finalFilters.radius && location && location.lat) {
                params.append('lat', location.lat);
                params.append('long', location.long);
                params.append('radius', finalFilters.radius);
            }

            // Tab: My Posts
            if (finalFilters.myPosts) {
                params.append('anon_id', useUserStore.getState().anonId);
                const res = await fetch(`${API_URL}/posts/me?${params.toString()}`);
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                set({ myPosts: data, loading: false });
                return;
            }

            // Standard Feed (needs anon_id for has_liked check)
            params.append('anon_id', useUserStore.getState().anonId);

            // Sort parameter
            if (finalFilters.sort) {
                params.append('sort', finalFilters.sort);
            }

            const res = await fetch(`${API_URL}/posts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();
            set({ posts: data, loading: false });
        } catch (err) {
            set({ error: err.message, loading: false });
        }
    },

    addPost: async (postData) => {
        // Optimistic Update
        const tempId = Date.now().toString();
        const optimPost = { ...postData, post_id: tempId, created_at: new Date(), likes: 0 };

        set(state => ({ posts: [optimPost, ...state.posts] }));

        try {
            const res = await fetch(`${API_URL}/posts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(postData)
            });
            const realPost = await res.json();
            set(state => ({
                posts: state.posts.map(p => p.post_id === tempId ? realPost : p)
            }));
        } catch (err) {
            set(state => ({
                posts: state.posts.filter(p => p.post_id !== tempId)
            }));
        }
    },

    addIntel: async (intelData) => {
        // Optimistic Update can be tricky with complex rules, let's just push and revert if fail
        const tempId = Date.now().toString();
        const optimIntel = {
            ...intelData,
            intel_id: tempId,
            created_at: new Date(),
            metrics: { saves: 0, ack: 0, direction_clicks: 0, updates: 0 },
            distance_bucket: 'NEARBY'
        };

        set(state => ({ intel: [optimIntel, ...state.intel] }));

        try {
            const res = await fetch(`${API_URL}/intel`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(intelData)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Failed to post intel');
            }

            const realIntel = await res.json();
            set(state => ({
                intel: state.intel.map(p => p.intel_id === tempId ? realIntel : p)
            }));
            return true;
        } catch (err) {
            console.error(err);
            set(state => ({
                intel: state.intel.filter(p => p.intel_id !== tempId)
            }));
            throw err;
        }
    },

    interactIntel: async (intelId, action) => {
        const { anonId } = useUserStore.getState();
        // Optimistic updates for metrics (simple increments)
        set(state => ({
            intel: state.intel.map(p => {
                if (p.intel_id !== intelId) return p;
                const metrics = { ...p.metrics };
                if (action === 'save') metrics.saves++;
                if (action === 'unsave') metrics.saves = Math.max(0, metrics.saves - 1);
                if (action === 'ack') metrics.ack++;
                if (action === 'update_click') metrics.updates++;
                // Click doesn't show in UI usually but we track it
                return { ...p, metrics };
            })
        }));

        try {
            await fetch(`${API_URL}/intel/${intelId}/action`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, anon_id: anonId })
            });
        } catch (err) {
            console.error('Interaction failed', err);
            // Revert logic could go here
        }
    },

    likePost: async (postId) => {
        const anonId = useUserStore.getState().anonId;
        const currentPosts = get().posts;
        const post = currentPosts.find(p => p.post_id === postId);
        if (!post) return;

        const isLiked = post.has_liked;
        const newCount = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1;

        // Optimistic
        set(state => ({
            posts: state.posts.map(p =>
                p.post_id === postId ? { ...p, likes: newCount, has_liked: !isLiked } : p
            )
        }));

        try {
            await fetch(`${API_URL}/posts/${postId}/toggle_like`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anon_id: anonId })
            });
        } catch (err) {
            // Revert
            set(state => ({
                posts: state.posts.map(p =>
                    p.post_id === postId ? { ...p, likes: post.likes, has_liked: isLiked } : p
                )
            }));
        }
    },

    editPost: async (postId, content, anonId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ anon_id: anonId, content })
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to edit');
            }

            const updatedPost = await res.json();
            set(state => ({
                posts: state.posts.map(p => p.post_id === postId ? { ...p, content: updatedPost.content } : p),
                myPosts: state.myPosts.map(p => p.post_id === postId ? { ...p, content: updatedPost.content } : p)
            }));
        } catch (err) {
            console.error('Edit failed:', err);
            throw err;
        }
    },

    deletePost: async (postId, anonId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}?anon_id=${anonId}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error('Failed to delete');

            set(state => ({
                posts: state.posts.filter(p => p.post_id !== postId),
                myPosts: state.myPosts.filter(p => p.post_id !== postId)
            }));
        } catch (err) {
            console.error('Delete failed:', err);
            throw err;
        }
    },

    reportContent: async (targetId, targetType, reason, anonId) => {
        try {
            const res = await fetch(`${API_URL}/report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    target_id: targetId,
                    target_type: targetType,
                    anon_id: anonId,
                    reason
                })
            });

            if (!res.ok) throw new Error('Failed to report');

            // Remove content from feed/intel list
            if (targetType === 'POST') {
                set(state => ({
                    posts: state.posts.filter(p => p.post_id !== targetId)
                }));
            } else {
                set(state => ({
                    intel: state.intel.filter(p => p.intel_id !== targetId)
                }));
            }
        } catch (err) {
            console.error('Report failed:', err);
            throw err;
        }
    },

    // Legacy method shim if needed or just remove usages
    reportPost: async (postId, reason, anonId) => {
        return get().reportContent(postId, 'POST', reason, anonId);
    },

    // --- Comment Actions ---
    fetchComments: async (postId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`);
            if (!res.ok) throw new Error('Failed to fetch comments');
            return await res.json();
        } catch (err) {
            console.error('Fetch comments failed:', err);
            return [];
        }
    },

    addComment: async (postId, content, anonId) => {
        try {
            const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, anon_id: anonId })
            });
            if (!res.ok) throw new Error('Failed to post comment');
            const newComment = await res.json();

            // Increment local comment count if needed (optional since we'll likely re-fetch detail)
            set(state => ({
                posts: state.posts.map(p =>
                    p.post_id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
                )
            }));

            return newComment;
        } catch (err) {
            console.error('Add comment failed:', err);
            throw err;
        }
    }
}));

export default useFeedStore;
