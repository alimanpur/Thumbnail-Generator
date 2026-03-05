import { useState, useRef, useContext } from 'react';
import html2canvas from 'html2canvas';
import { Download, Loader2, Image as ImageIcon, Sparkles, LayoutPanelLeft, User, LogOut } from 'lucide-react';
import { AuthContext } from './AuthContext';
import AuthModal from './components/AuthModal';
import ProfileGallery from './components/ProfileGallery';

function App() {
  const [title, setTitle] = useState('');
  const [style, setStyle] = useState('Cyberpunk');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [activeThumbnail, setActiveThumbnail] = useState(null);
  const [history, setHistory] = useState([]);
  const previewRef = useRef(null);

  const { user, token, logout } = useContext(AuthContext);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('generator');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const headers = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch('https://thumbnail-generator-2g2e.onrender.com/api/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({ title, style })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.detail || 'Failed to generate image. Check backend connection.');
      }

      const data = await response.json();

      const newThumbnail = {
        id: Date.now(),
        url: data.image_url,
        title: title,
        short_title: data.short_title,
        highlight_word: data.highlight_word,
        style: style,
        timestamp: new Date().toLocaleTimeString()
      };

      setActiveThumbnail(newThumbnail);
      setHistory(prev => [newThumbnail, ...prev].slice(0, 3));

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!previewRef.current || !activeThumbnail) return;

    try {
      const canvas = await html2canvas(previewRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#0a0a0a',
        logging: false
      });

      const image = canvas.toDataURL("image/png", 1.0);

      const link = document.createElement('a');
      link.download = `thumbnail_${activeThumbnail.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`;
      link.href = image;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Error downloading image:", err);
    }
  };

  const handleLoadHistory = (item) => {
    setActiveThumbnail(item);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-slate-100 font-sans selection:bg-cyan-500/30 flex flex-col relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-cyan-500/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 blur-[120px] rounded-full pointer-events-none" />

      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Creator Studio Navbar */}
      <nav className="h-16 border-b border-white/10 flex items-center justify-between px-8 bg-white/5 backdrop-blur-xl sticky top-0 z-50">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setCurrentView('generator')}
        >
          <LayoutPanelLeft className="w-5 h-5 text-cyan-400" />
          <span className="font-semibold text-sm tracking-wide text-white">AI Studio Pro</span>
        </div>

        {/* User Navigation Area */}
        <div className="flex items-center gap-4">
          {!user ? (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2"
            >
              Sign In
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentView('generator')}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${currentView === 'generator' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                Generator
              </button>
              <button
                onClick={() => setCurrentView('profile')}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${currentView === 'profile' ? 'text-cyan-400 bg-cyan-500/10' : 'text-slate-400 hover:text-white'}`}
              >
                My Profile
              </button>

              <div className="h-4 w-px bg-white/10 mx-1"></div>

              <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-medium text-slate-300 truncate max-w-30">
                  {user.email.split('@')[0]}
                </span>
                <button
                  onClick={() => {
                    logout();
                    setCurrentView('generator');
                  }}
                  className="ml-2 p-1 text-slate-500 hover:text-red-400 transition-colors"
                  title="Log out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-400 w-full mx-auto relative z-10 flex flex-col">
        {currentView === 'profile' ? (
          <ProfileGallery />
        ) : (
          <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 h-full flex-1">
            <div className="lg:col-span-4 flex flex-col gap-6">

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl">
                <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  Thumbnail Generator
                </h2>

                <form onSubmit={handleGenerate} className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">Full Video Title</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                        placeholder="e.g., Why Next.js 15 Changes Everything"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest">Art Direction</label>
                      <select
                        value={style}
                        onChange={(e) => setStyle(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all appearance-none [&>option]:bg-slate-900"
                      >
                        <option value="Cyberpunk">Dark Neon Cyberpunk</option>
                        <option value="Minimalist">Clean Premium Minimalist</option>
                        <option value="3D Render">High-End 3D Render</option>
                        <option value="Cinematic">Cinematic Lighting</option>
                      </select>
                    </div>
                  </div>

                  {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-[13px] p-3 rounded-lg">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full relative group overflow-hidden rounded-xl p-px disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="absolute inset-0 bg-linear-to-r from-cyan-400 to-blue-500 opacity-80 group-hover:opacity-100 transition-opacity duration-300"></span>
                    <div className="relative bg-[#0a0a0a]/80 backdrop-blur-sm px-6 py-3.5 rounded-[11px] flex items-center justify-center transition-all duration-300 group-hover:bg-transparent">
                      <span className="font-semibold text-[15px] tracking-wide text-white flex items-center gap-2 group-hover:text-white">
                        {isLoading ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Extracting Keywords & Generating...
                          </>
                        ) : (
                          'Generate Thumbnail'
                        )}
                      </span>
                    </div>
                  </button>

                  {!user && (
                    <p className="text-center text-xs text-slate-500">
                      Sign in to save your generated thumbnails to your gallery.
                    </p>
                  )}
                </form>
              </div>

              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 md:p-6 shadow-2xl flex-1 mt-6 lg:mt-0">
                <h3 className="text-[13px] font-semibold text-slate-400 uppercase tracking-widest mb-4">Past Renders</h3>

                {history.length === 0 ? (
                  <div className="h-40 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-slate-500 text-[13px]">
                    No recent renders
                  </div>
                ) : (
                  <div className="space-y-3">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleLoadHistory(item)}
                        className="w-full text-left group relative bg-black/40 border border-white/5 rounded-xl p-3 flex items-center gap-4 hover:border-cyan-500/50 transition-colors"
                      >
                        <div className="w-20 h-11 bg-slate-900 rounded-md overflow-hidden shrink-0 shadow-sm border border-white/5">
                          <img src={item.url} alt="thumbnail" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] text-slate-200 font-semibold truncate group-hover:text-cyan-300 transition-colors">{item.short_title} <span className="text-cyan-400">{item.highlight_word}</span></p>
                          <p className="text-[11px] text-slate-400">{item.timestamp} · {item.style}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="lg:col-span-8 flex flex-col gap-6 mt-6 lg:mt-0">
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-6 shadow-2xl flex flex-col h-full min-h-75 md:min-h-125">

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 px-2 md:px-4 gap-4 sm:gap-0">
                  <div className="flex items-center gap-2 text-sm font-medium text-slate-300">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                    Live Preview Canvas
                  </div>

                  <button
                    onClick={handleDownload}
                    disabled={!activeThumbnail}
                    className="text-[13px] font-semibold text-black bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.3)] hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]"
                  >
                    <Download className="w-4 h-4" />
                    Download PNG
                  </button>
                </div>

                <div className="flex-1 w-full bg-[#050505] border border-white/5 rounded-xl overflow-hidden flex items-center justify-center relative shadow-[inset_0_2px_30px_rgba(0,0,0,0.8)]">
                  {!activeThumbnail ? (
                    <div className="text-center text-slate-600 flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center bg-white/5">
                        <ImageIcon className="w-8 h-8 opacity-50" />
                      </div>
                      <div>
                        <p className="text-[15px] font-medium text-slate-400">Ready to create</p>
                        <p className="text-sm">Configure your scene on the left</p>
                      </div>
                    </div>
                  ) : (
                    <div
                      ref={previewRef}
                      className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center group/canvas"
                      style={{ maxWidth: '1280px', maxHeight: '720px' }}
                    >
                      <img
                        src={activeThumbnail.url}
                        alt="AI Background"
                        className="absolute inset-0 w-full h-full object-cover select-none"
                        crossOrigin="anonymous"
                      />

                      <div className="absolute inset-0 bg-linear-to-t from-[#0a0a0a]/95 via-[#0a0a0a]/40 to-transparent"></div>
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-black/60 to-transparent"></div>

                      <div className="absolute inset-x-0 bottom-0 p-4 md:p-12 lg:p-16 flex flex-col justify-end items-center text-center">
                        <h2
                          className="text-xl md:text-3xl lg:text-5xl font-bold text-white uppercase tracking-wider mb-1 md:mb-2"
                          style={{
                            textShadow: '0 4px 12px rgba(0,0,0,0.8), 2px 2px 0 #000, -2px -2px 0 #000'
                          }}
                        >
                          {activeThumbnail.short_title}
                        </h2>
                        <h1
                          className="text-4xl md:text-6xl lg:text-[100px] font-black uppercase tracking-tighter leading-[0.9]"
                          style={{
                            background: 'linear-gradient(to right, #22d3ee, #3b82f6)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.9)) drop-shadow(0 0 10px rgba(34,211,238,0.3))'
                          }}
                        >
                          {activeThumbnail.highlight_word}
                        </h1>
                      </div>

                    </div>

                  )}

                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  );
}

export default App;