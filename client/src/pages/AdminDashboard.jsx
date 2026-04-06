import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
    Users, MessageSquare, Heart, Shield, AlertTriangle, ArrowUp, ArrowDown,
    MapPin, Activity, Zap, Eye, Loader2, Download, Search, Info, X
} from 'lucide-react';

// --- Components ---

const Card = ({ children, className = '' }) => (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
        {children}
    </div>
);

const SectionHeader = ({ title, subtitle }) => (
    <div className="mb-6">
        <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{title}</h3>
        {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
);

const MetricValue = ({ label, value, subtext, trend, trendValue, icon: Icon, color = 'slate' }) => {
    const trendColor = trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500';
    const TrendIcon = trend === 'up' ? ArrowUp : trend === 'down' ? ArrowDown : null;

    return (
        <div>
            <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-slate-500">{label}</span>
                {Icon && <Icon className={`w-4 h-4 text-${color}-500`} />}
            </div>
            <div className="flex items-baseline gap-3">
                <span className="text-3xl font-semibold tracking-tight text-slate-900">{value}</span>
                {trendValue && (
                    <span className={`flex items-center text-xs font-medium ${trendColor}`}>
                        {TrendIcon && <TrendIcon className="w-3 h-3 mr-0.5" />}
                        {trendValue}
                    </span>
                )}
            </div>
            {subtext && <p className="text-xs text-slate-400 mt-1">{subtext}</p>}
        </div>
    );
};

const FunnelStep = ({ label, value, dropOff, isLast }) => (
    <div className="flex-1 relative group">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100 hover:border-slate-300 transition-colors">
            <p className="text-xs font-semibold text-slate-400 uppercase mb-1">{label}</p>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            {!isLast && dropOff !== undefined && !isNaN(dropOff) && (
                <div className="absolute top-1/2 -right-3 transform -translate-y-1/2 z-10 bg-white border border-slate-200 text-[10px] text-slate-500 px-1.5 py-0.5 rounded-full shadow-sm">
                    -{dropOff}%
                </div>
            )}
        </div>
        {!isLast && (
            <div className="hidden lg:block absolute top-1/2 -right-4 w-4 h-[2px] bg-slate-200 transform -translate-y-1/2" />
        )}
    </div>
);

// --- Modal Component ---

const DayDetailModal = ({ isOpen, onClose, data }) => {
    if (!isOpen || !data) return null;

    const sentimentData = [
        { name: 'Positive', value: data.sentiment?.positive || 0, color: '#10b981' },
        { name: 'Neutral', value: data.sentiment?.neutral || 0, color: '#64748b' },
        { name: 'Sad', value: data.sentiment?.sad || 0, color: '#f59e0b' },
        { name: 'Angry', value: data.sentiment?.angry || 0, color: '#f43f5e' },
        { name: 'Hate', value: data.sentiment?.hate || 0, color: '#881337' },
    ].filter(d => d.value > 0);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm transition-opacity" onClick={onClose}>
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto transform transition-all" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white z-10">
                    <div>
                        <h3 className="text-xl font-bold text-slate-900">Day {data.day_index} Detail</h3>
                        <p className="text-sm text-slate-500">{data.dateKey}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Sentiment Analysis */}
                    <div>
                        <SectionHeader title="Sentiment Breakdown" subtitle="Emotional tone analysis" />
                        <Card className="p-6 h-64 flex items-center justify-center">
                            {sentimentData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={sentimentData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {sentimentData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <p className="text-sm text-slate-400">No sentiment data available.</p>
                            )}
                        </Card>
                        <div className="mt-4 flex flex-wrap gap-3 justify-center">
                            {sentimentData.map((s, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                                    {s.name} ({s.value})
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Topic Distribution */}
                    <div>
                        <SectionHeader title="Topic Distribution" subtitle="Key discussion themes" />
                        <Card className="p-6">
                            <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                                {data.topics?.map((topic, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{topic.name}</span>
                                            <span className="text-slate-500">{topic.count} posts</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${topic.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )) || <p className="text-center text-sm text-slate-400 py-4">No topic data.</p>}
                            </div>
                        </Card>
                    </div>

                    {/* Raw Metrics */}
                    <div className="lg:col-span-2">
                        <SectionHeader title="Day Metrics" />
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Posts</span>
                                <div className="text-2xl font-bold text-slate-900">{data.totals?.total_posts || 0}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Reactions</span>
                                <div className="text-2xl font-bold text-slate-900">{data.totals?.total_reactions || 0}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Replies</span>
                                <div className="text-2xl font-bold text-slate-900">{data.totals?.total_comments || 0}</div>
                            </div>
                            <div className="bg-slate-50 p-4 rounded-lg">
                                <span className="text-xs text-slate-500 uppercase font-semibold">Flags</span>
                                <div className="text-2xl font-bold text-rose-600">{data.safety?.reported_posts_count || 0}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// --- Main Page ---

export default function AdminDashboard() {
    const [token, setToken] = useState(localStorage.getItem('adminToken') || '');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [summaries, setSummaries] = useState([]);
    const [selectedDay, setSelectedDay] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [settings, setSettings] = useState({ chat_enabled: false });
    const [savingSetting, setSavingSetting] = useState(false);

    // Initial Check
    useEffect(() => {
        if (token) verifyToken(token);
    }, []);

    const verifyToken = async (t) => {
        try {
            setLoading(true);
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/summaries?limit=30`, {
                headers: { 'x-admin-token': t }
            });
            if (res.ok) {
                const data = await res.json();
                const list = data.summaries || (Array.isArray(data) ? data : []);
                setSummaries(list.sort((a, b) => a.day_index - b.day_index));
                setIsAuthenticated(true);
                localStorage.setItem('adminToken', t);
                setError('');
            } else {
                setError('Invalid token');
                setIsAuthenticated(false);
            }
        } catch (err) {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    const fetchAdminSettings = async (t) => {
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/settings`, {
                headers: { 'x-admin-token': t || token }
            });
            if (res.ok) {
                const data = await res.json();
                const settingsObj = {};
                data.settings.forEach(s => {
                    settingsObj[s.key] = s.value;
                });
                setSettings(prev => ({ ...prev, ...settingsObj }));
            }
        } catch (err) {
            console.error('Failed to fetch settings:', err);
        }
    };

    useEffect(() => {
        if (isAuthenticated) {
            fetchAdminSettings();
        }
    }, [isAuthenticated]);

    const handleToggleSetting = async (key, currentValue) => {
        try {
            setSavingSetting(true);
            const newValue = !currentValue;
            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/settings`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-token': token
                },
                body: JSON.stringify({ key, value: newValue })
            });
            if (res.ok) {
                setSettings(prev => ({ ...prev, [key]: newValue }));
            }
        } catch (err) {
            console.error('Toggle failed:', err);
        } finally {
            setSavingSetting(false);
        }
    };

    const handleLogin = (e) => {
        e.preventDefault();
        verifyToken(token);
    };

    // --- Derived Metrics (Latest Day) ---
    const latest = summaries.length > 0 ? summaries[summaries.length - 1] : null;

    // Pulse Metrics
    const postsCreated = latest?.totals?.total_posts || 0;
    const postsWithReplies = latest?.totals?.posts_with_replies || 0; // New Backend Field
    const pctWithReplies = postsCreated > 0 ? Math.round((postsWithReplies / postsCreated) * 100) : 0;
    const silentPosts = latest?.totals?.posts_with_zero_interaction || 0; // New Backend Field
    const silentRate = postsCreated > 0 ? Math.round((silentPosts / postsCreated) * 100) : 0;

    // Funnel Metrics (Approximate Views for MVP)
    const views = Math.round(postsCreated * 12.5); // Heuristic: ~12.5 views per post avg
    const totalComments = latest?.totals?.total_comments || 0;
    const totalReactions = latest?.totals?.total_reactions || 0;

    // Safety Metrics
    const reportedPosts = latest?.safety?.reported_posts_count || 0;
    const autoHidden = latest?.safety?.auto_hidden_count || 0;

    // Chart Data Preparation
    const chartData = summaries.map(s => ({
        day: `Day ${s.day_index}`,
        posts: s.totals.total_posts,
        engagement: s.totals.total_reactions + s.totals.total_comments,
        reported: s.safety?.reported_posts_count || 0,
        original: s // Carry full object for click handler
    }));

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex justify-center mb-6">
                        <div className="bg-slate-900 text-white p-3 rounded-lg">
                            <Shield className="w-6 h-6" />
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-center text-slate-900 mb-2">GoGon Admin</h2>
                    <p className="text-slate-500 text-center mb-6">Internal analytics access only.</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <input
                                type="password"
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                placeholder="Access Token"
                                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-slate-900 focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'Access Dashboard'}
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* Top Navigation */}
            <div className="bg-white border-b border-slate-200 px-6 py-4">
                <div className="max-w-[1280px] mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-slate-900 text-white p-1.5 rounded-md">
                            <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-lg tracking-tight">GoGon Analytics</span>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded-full border border-slate-200">
                            Live
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-500">{new Date().toLocaleDateString()}</span>
                        <button
                            onClick={() => {
                                localStorage.removeItem('adminToken');
                                setIsAuthenticated(false);
                            }}
                            className="text-sm font-medium text-slate-600 hover:text-slate-900"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="max-w-[1280px] mx-auto p-6 space-y-8">
                {/* System Settings Section */}
                <div>
                    <SectionHeader
                        title="System Configuration"
                        subtitle="Manage global feature availability"
                    />
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${settings.chat_enabled ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                    {settings.chat_enabled ? <MessageSquare className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                                </div>
                                <div>
                                    <h4 className="font-bold text-lg text-slate-900">Feature Toggle: {settings.chat_enabled ? 'Chat' : 'Comments'}</h4>
                                    <p className="text-sm text-slate-500">
                                        Currently using {settings.chat_enabled ? 'direct anonymous chat' : 'public post comments'} as the primary engagement method.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggleSetting('chat_enabled', settings.chat_enabled)}
                                disabled={savingSetting}
                                className={`px-6 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2 ${settings.chat_enabled
                                    ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/20'
                                    : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'
                                    } disabled:opacity-50`}
                            >
                                {savingSetting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <>Switch to {settings.chat_enabled ? 'Comments' : 'Chat'}</>
                                )}
                            </button>
                        </div>
                    </Card>
                </div>

                {/* 1. COMMUNITY PULSE */}
                <div className="mb-12">
                    <SectionHeader title="Community Pulse" subtitle="Real-time health indicators (24h)" />
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <Card className="p-6">
                            <MetricValue
                                label="Posts Created"
                                value={postsCreated}
                                subtext="New content generated today"
                                icon={MessageSquare}
                                color="indigo"
                            />
                        </Card>
                        <Card className="p-6">
                            <MetricValue
                                label="Conversation Rate"
                                value={`${pctWithReplies}%`}
                                subtext="% of posts receiving at least 1 reply"
                                trend={pctWithReplies > 40 ? "up" : "down"}
                                trendValue={pctWithReplies > 40 ? "Healthy" : "Low"}
                                icon={Zap}
                                color="amber"
                            />
                        </Card>
                        <Card className="p-6">
                            <MetricValue
                                label="Silent Posts"
                                value={`${silentRate}%`}
                                subtext="Posts with 0 likes & 0 replies"
                                trend={silentRate < 50 ? "up" : "down"}
                                trendValue={silentRate < 50 ? "Good" : "High"}
                                icon={Eye}
                                color="slate"
                            />
                        </Card>
                        <Card className="p-6">
                            <MetricValue
                                label="Total Engagement"
                                value={totalReactions + totalComments}
                                subtext="Combined reactions & comments"
                                icon={Heart}
                                color="rose"
                            />
                        </Card>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">

                    {/* 2. INTERACTION FUNNEL */}
                    <div className="lg:col-span-2">
                        <SectionHeader title="Interaction Funnel" subtitle="User drop-off from view to reaction" />
                        <Card className="p-6">
                            <div className="flex flex-col md:flex-row gap-4 justify-between items-center h-full py-4">
                                <FunnelStep
                                    label="Est. Views"
                                    value={views.toLocaleString()}
                                    dropOff={Math.round((1 - (postsCreated / views)) * 100)}
                                />
                                <FunnelStep
                                    label="Posts"
                                    value={postsCreated}
                                    dropOff={postsCreated > 0 ? Math.round((1 - (totalComments / postsCreated)) * 100) : 0}
                                />
                                <FunnelStep
                                    label="Replies"
                                    value={totalComments}
                                    dropOff={totalComments > 0 ? Math.round((1 - (totalReactions / totalComments)) * 100) : 0}
                                />
                                <FunnelStep
                                    label="Reactions"
                                    value={totalReactions}
                                    isLast={true}
                                />
                            </div>
                            <div className="mt-8 h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart
                                        data={chartData}
                                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                        onClick={(e) => {
                                            if (e && e.activePayload && e.activePayload[0]) {
                                                setSelectedDay(e.activePayload[0].payload.original);
                                            }
                                        }}
                                        className="cursor-pointer"
                                    >
                                        <defs>
                                            <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                            cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                                        />
                                        <Area type="monotone" dataKey="engagement" stroke="#4f46e5" strokeWidth={2} fillOpacity={1} fill="url(#colorEngagement)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </Card>
                    </div>

                    {/* 3. TRUST & SAFETY SIGNALS */}
                    <div>
                        <SectionHeader title="Trust & Safety" subtitle="Flags and moderator actions" />
                        <Card className="p-6 h-full flex flex-col justify-between">
                            <div className="space-y-6">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600">Reported Posts (24h)</span>
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${reportedPosts > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                                            {reportedPosts > 0 ? 'Action Needed' : 'Clean'}
                                        </span>
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{reportedPosts}</div>
                                </div>

                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-slate-600">Auto-Hidden Content</span>
                                        <Info className="w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="text-3xl font-bold text-slate-900">{autoHidden}</div>
                                    <p className="text-xs text-slate-400 mt-1">Posts with &gt;3 reports hidden auto.</p>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <p className="text-xs font-semibold text-slate-400 uppercase mb-4">Daily Report Trend</p>
                                <div className="h-32">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="day" hide />
                                            <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none' }} />
                                            <Bar dataKey="reported" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* 4. LOCAL DENSITY & DISTRIBUTION */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                    <div>
                        <SectionHeader title="Top Cities (Density)" subtitle="Highest activity concentration" />
                        <Card className="overflow-hidden">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">City</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Volume</th>
                                        <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">% Share</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {latest?.location_dist?.slice(0, 5).map((loc, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-slate-900">{loc.city}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 text-right">{loc.count}</td>
                                            <td className="px-6 py-4 text-sm text-slate-500 text-right">{loc.percentage}%</td>
                                        </tr>
                                    )) || (
                                            <tr>
                                                <td colSpan="3" className="px-6 py-8 text-center text-sm text-slate-400">No location data available yet.</td>
                                            </tr>
                                        )}
                                </tbody>
                            </table>
                        </Card>
                    </div>

                    <div>
                        <SectionHeader title="Trending Topics" subtitle="What the community is discussing" />
                        <Card className="p-6">
                            <div className="space-y-4">
                                {latest?.topics?.slice(0, 5).map((topic, idx) => (
                                    <div key={idx}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="font-medium text-slate-700">{topic.name}</span>
                                            <span className="text-slate-500">{topic.percentage}%</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{ width: `${topic.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                )) || (
                                        <p className="text-center text-sm text-slate-400 py-4">No topic data available yet.</p>
                                    )}
                            </div>
                        </Card>
                    </div>
                </div>

                {/* 5. OPERATIONAL LOGS & EXPORT */}
                <div>
                    <div className="flex justify-between items-end mb-6">
                        <SectionHeader title="Operational Logs" subtitle="Daily summary records & export status" />
                        <button
                            onClick={() => {
                                const headers = ['Date', 'Day Index', 'Posts', 'Replies', 'Reactions', 'Reported', 'Auto-Hidden', 'Top Topic', 'Top City'];
                                const rows = summaries.map(s => [
                                    s.dateKey,
                                    s.day_index,
                                    s.totals.total_posts,
                                    s.totals.total_comments,
                                    s.totals.total_reactions,
                                    s.safety?.reported_posts_count || 0,
                                    s.safety?.auto_hidden_count || 0,
                                    s.topics?.[0]?.name || '-',
                                    s.location_dist?.[0]?.city || '-'
                                ]);
                                const csvContent = "data:text/csv;charset=utf-8," +
                                    [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                                const encodedUri = encodeURI(csvContent);
                                const link = document.createElement("a");
                                link.setAttribute("href", encodedUri);
                                link.setAttribute("download", `gogon_ops_log_${new Date().toISOString().split('T')[0]}.csv`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Download CSV
                        </button>
                    </div>

                    <Card className="overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Posts</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Engage</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Safety</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-center">Export</th>
                                    <th className="px-6 py-3 text-xs font-semibold text-slate-500 uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {[...summaries].reverse().map((s) => (
                                    <tr
                                        key={s.day_index}
                                        onClick={() => setSelectedDay(s)}
                                        className="hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium text-slate-900">{s.dateKey}</span>
                                                <span className="text-xs text-slate-500">Day {s.day_index}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-slate-600 text-right">{s.totals.total_posts}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 text-right">
                                            {s.totals.total_reactions + s.totals.total_comments}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {(s.safety?.reported_posts_count > 0 || s.safety?.auto_hidden_count > 0) ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-rose-100 text-rose-800">
                                                    {s.safety.reported_posts_count} Flags
                                                </span>
                                            ) : (
                                                <span className="text-xs text-slate-400">Clean</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${s.export?.google_sheets?.status === 'success' ? 'bg-emerald-50 text-emerald-700' :
                                                s.export?.google_sheets?.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                                                    'bg-slate-100 text-slate-600'
                                                }`}>
                                                {s.export?.google_sheets?.status === 'success' ? 'Synced' :
                                                    s.export?.google_sheets?.status === 'failed' ? 'Failed' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {s.export?.google_sheets?.status !== 'success' && (
                                                <button
                                                    onClick={async () => {
                                                        try {
                                                            const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/admin/retry-export/${s.dateKey}`, {
                                                                method: 'POST',
                                                                headers: { 'x-admin-token': token }
                                                            });
                                                            if (res.ok) verifyToken(token); // Refresh
                                                        } catch (e) { console.error(e); }
                                                    }}
                                                    className="text-xs font-medium text-indigo-600 hover:text-indigo-900 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    Retry
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                )) || (
                                        <tr>
                                            <td colSpan="6" className="px-6 py-8 text-center text-sm text-slate-400">No logs available.</td>
                                        </tr>
                                    )}
                            </tbody>
                        </table>
                    </Card>
                </div>

            </div>

            {/* Detail Modal */}
            <DayDetailModal isOpen={!!selectedDay} onClose={() => setSelectedDay(null)} data={selectedDay} />
        </div>
    );
}
