import { create } from 'zustand';
import useUserStore from './userStore';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const PAGE_SIZE = 20;

const useFeedStore = create((set, get) => ({
    posts: [],
    intel: [],
    myPosts: [],
    loading: false,
    error: null,
    lastCursor: null,
    hasMore: true,
    loadingMore: false,

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

    fetchPosts: async (filters = {}, cursor = null) => {
        if (cursor) {
            set({ loadingMore: true });
        } else {
            set({ loading: true, lastCursor: null, hasMore: true });
        }
        try {
            const params = new URLSearchParams();
            const { city, institution, location } = useUserStore.getState();
            const finalFilters = { city, institution, ...filters };

            if (finalFilters.city) params.append('city', finalFilters.city);
            if (finalFilters.institution) params.append('institution', finalFilters.institution);
            if (finalFilters.topic) params.append('topic', finalFilters.topic);

            if (finalFilters.radius && location && location.lat) {
                params.append('lat', location.lat);
                params.append('long', location.long);
                params.append('radius', finalFilters.radius);
            }

            // Tab: My Posts
            if (finalFilters.myPosts) {
                const allIds = useUserStore.getState().getAllAnonIds();
                params.append('anon_id', allIds.join(','));
                const res = await fetch(`${API_URL}/posts/me?${params.toString()}`);
                if (!res.ok) throw new Error('Failed');
                const data = await res.json();
                set({ myPosts: data, loading: false });
                return;
            }

            params.append('anon_id', useUserStore.getState().anonId);
            params.append('limit', String(PAGE_SIZE));

            if (finalFilters.sort) params.append('sort', finalFilters.sort);
            if (cursor) params.append('cursor', cursor);

            const res = await fetch(`${API_URL}/posts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch posts');
            const data = await res.json();

            const newCursor = data.length > 0 ? data[data.length - 1].created_at : null;
            const hasMore = data.length >= PAGE_SIZE;

            if (cursor) {
                set(state => ({ posts: [...state.posts, ...data], loadingMore: false, lastCursor: newCursor, hasMore }));
            } else {
                set({ posts: data, loading: false, lastCursor: newCursor, hasMore });
            }
        } catch (err) {
            set({ error: err.message, loading: false, loadingMore: false });
        }
    },

    fetchMorePosts: async () => {
        const { lastCursor, hasMore, loadingMore } = get();
        if (!hasMore || loadingMore || !lastCursor) return;
        await get().fetchPosts({}, lastCursor);
    },

    searchPosts: async (query) => {
        set({ loading: true, lastCursor: null, hasMore: true });
        try {
            const params = new URLSearchParams();
            const { city } = useUserStore.getState();
            const { anonId } = useUserStore.getState();
            if (city) params.append('city', city);
            params.append('anon_id', anonId);
            params.append('q', query);
            params.append('limit', String(PAGE_SIZE));

            const res = await fetch(`${API_URL}/posts?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to search posts');
            const data = await res.json();

            const newCursor = data.length > 0 ? data[data.length - 1].created_at : null;
            const hasMore = data.length >= PAGE_SIZE;
            set({ posts: data, loading: false, lastCursor: newCursor, hasMore });
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

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to create post');
            }

            const realPost = await res.json();
            set(state => ({
                posts: state.posts.map(p => p.post_id === tempId ? realPost : p)
            }));
        } catch (err) {
            console.error('Add post failed:', err);
            set(state => ({
                posts: state.posts.filter(p => p.post_id !== tempId)
            }));
            // Optionally alert user
            throw err;
        }
    },

    addIntel: async (intelData) => {
        // Optimistic Update can be tricky with complex rules, let's just push and revert if fail
        const tempId = Date.now().toString();
        const optimExpiry = intelData.type === 'HEADSUP'
            ? new Date(Date.now() + 8 * 60 * 60 * 1000)
            : new Date(Date.now() + 24 * 60 * 60 * 1000);
        const optimIntel = {
            ...intelData,
            intel_id: tempId,
            created_at: new Date(),
            expires_at: optimExpiry,
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
            const { gender } = useUserStore.getState();
            const res = await fetch(`${API_URL}/posts/${postId}/comments`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content, anon_id: anonId, gender: gender || null })
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
