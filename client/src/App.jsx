import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, Outlet } from 'react-router-dom';
import useUserStore from './store/userStore';
import useConfigStore from './store/configStore';
import Onboarding from './pages/Onboarding';
import Feed from './pages/Feed';
import Chat from './pages/Chat';
import CommentsDetail from './pages/CommentsDetail';
import AdminDashboard from './pages/AdminDashboard';

function ProtectedRoute({ children }) {
    const { anonId, city } = useUserStore(state => ({
        anonId: state.anonId,
        city: state.city
    }));
    const location = useLocation();

    if (!anonId || !city) {
        return <Navigate to="/onboarding" state={{ from: location }} replace />;
    }

    return children;
}

// Layout for the mobile app experience
const MobileLayout = () => (
    <div className="max-w-md mx-auto min-h-screen shadow-2xl overflow-hidden relative" style={{ backgroundColor: '#F5EFE8', fontFamily: 'Courier Prime, monospace' }}>
        <Outlet />
    </div>
);

export default function App() {
    const fetchSettings = useConfigStore(state => state.fetchSettings);

    useEffect(() => {
        fetchSettings();
    }, []);

    return (
        <BrowserRouter>
            <Routes>
                {/* Mobile App Routes */}
                <Route element={<MobileLayout />}>
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route
                        path="/feed"
                        element={
                            <ProtectedRoute>
                                <Feed />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/chat/:chatId"
                        element={
                            <ProtectedRoute>
                                <Chat />
                            </ProtectedRoute>
                        }
                    />
                    <Route
                        path="/post/:postId/comments"
                        element={
                            <ProtectedRoute>
                                <CommentsDetail />
                            </ProtectedRoute>
                        }
                    />
                    {/* Default redirect for unknown routes inside app context */}
                    <Route path="*" element={<Navigate to="/feed" replace />} />
                </Route>

                {/* Admin Dashboard - Full Desktop Width */}
                <Route path="/admin" element={<AdminDashboard />} />
            </Routes>
        </BrowserRouter>
    );
}
