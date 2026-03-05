import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Download, Loader2, ImageIcon, Calendar } from 'lucide-react';

export default function ProfileGallery() {
    const { token, logout } = useContext(AuthContext);
    const [thumbnails, setThumbnails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchThumbnails = async () => {
            try {
                const res = await fetch('https://thumbnail-generator-2g2e.onrender.com/api/profile/thumbnails', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });

                if (res.status === 401) {
                    logout();
                    return;
                }

                if (!res.ok) {
                    throw new Error('Failed to fetch profile history');
                }

                const data = await res.json();
                setThumbnails(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };

        if (token) {
            fetchThumbnails();
        }
    }, [token, logout]);

    const handleDownload = (item) => {
        const link = document.createElement('a');
        link.download = `thumbnail_${item.short_title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
        link.href = item.image_url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[400px]">
                <Loader2 className="w-10 h-10 animate-spin text-cyan-400 mb-4" />
                <p className="text-slate-400 font-medium">Loading your gallery...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-red-500/5 border border-red-500/10 rounded-2xl">
                <p className="text-red-400">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto pr-2 pb-8 h-full">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-1">My Gallery</h2>
                    <p className="text-sm text-slate-400">Your past AI generated thumbnails</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-lg px-4 py-2 flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-semibold text-white">{thumbnails.length} Total</span>
                </div>
            </div>

            {thumbnails.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-16 border border-dashed border-white/10 rounded-2xl bg-white/5">
                    <div className="w-16 h-16 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center mb-6">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No thumbnails yet</h3>
                    <p className="text-slate-400 text-sm max-w-sm">
                        Generate your first high-converting YouTube thumbnail in the studio and it will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {thumbnails.map(item => (
                        <div key={item.id} className="group flex flex-col bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-cyan-500/50 transition-all duration-300">

                            <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                                <img src={item.image_url} alt={item.short_title} className="absolute inset-0 w-full h-full object-cover select-none" />

                                {/* CSS Filters built directly in matching the App logic roughly */}
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/40 to-transparent"></div>

                                {/* Text Overlay matching App logic roughly */}
                                <div className="absolute inset-x-0 bottom-0 p-4 flex flex-col justify-end items-center text-center">
                                    <h2 className="text-xl md:text-2xl font-bold text-white uppercase tracking-wider mb-1" style={{ textShadow: '0 4px 12px rgba(0,0,0,0.8)' }}>
                                        {item.short_title}
                                    </h2>
                                    <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-[0.9]" style={{ background: 'linear-gradient(to right, #22d3ee, #3b82f6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                        {item.highlight_word}
                                    </h1>
                                </div>

                                {/* Hover actions */}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-sm">
                                    <button
                                        onClick={() => handleDownload(item)}
                                        className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2 rounded-lg font-semibold text-sm flex items-center gap-2 transition-transform transform hover:scale-105"
                                    >
                                        <Download className="w-4 h-4" />
                                        Download PNG
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 bg-black/40 border-t border-white/5">
                                <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
                                    <Calendar className="w-3 h-3" />
                                    {new Date(item.created_at).toLocaleDateString()}
                                </div>
                                <p className="text-sm font-medium text-slate-200 truncate">
                                    {item.short_title} <span className="text-cyan-400">{item.highlight_word}</span>
                                </p>
                            </div>

                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
