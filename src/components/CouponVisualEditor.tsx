import React, { useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ImageIcon, Plus, Trash2, Smile, RotateCcw, RotateCw, Minus, MousePointer2, X, RefreshCw, Upload } from 'lucide-react';
import { GalleryItem } from '../lib/persistence';
import { UniversalImageSelector } from './UniversalImageSelector';

interface Emoji {
  id: string;
  char: string;
  x: number;
  y: number;
  size: number;
  rotation?: number;
  opacity?: number;
  isImage?: boolean;
}

interface QRCodeDesignConfig {
  style: 'standard' | 'suave' | 'moderno' | 'elegante' | 'logo';
  color: string;
  backgroundColor: string;
  opacity: number;
  dotType: 'square' | 'rounded';
  cornerType: 'standard' | 'rounded';
  logoUrl?: string;
}

interface GreetingCouponConfig {
  title: string;
  message: string;
  showCustomerName: boolean;
  showOrderNumber: boolean;
  footerText: string;
  qrCodeText: string;
  format: any;
  backgroundImage?: string;
  backgroundOpacity?: number;
  emojiOpacity?: number;
  emojis?: Emoji[];
  customEmojis?: string[];
  qrCodeDesign?: QRCodeDesignConfig;
}

interface CouponVisualEditorProps {
  config: GreetingCouponConfig;
  onChange: (config: GreetingCouponConfig) => void;
  previewContent: React.ReactNode;
  gallery: GalleryItem[];
  setGallery: any;
}

const EMOJI_CATEGORIES = {
  feminino: ['❤️', '💖', '🌹', '✨', '🎀', '🌸', '💅', '💃'],
  masculino: ['💀', '⚡', '🔥', '🏍️', '🎸', '🕹️', '🕶️', '🦾'],
  neutro: ['🎁', '⭐', '🎉', '📦', '🛒', '🎈', '🎊', '👋', '👍', '😊']
};

const CONTAINER_WIDTH = 300;
const CONTAINER_HEIGHT = 450; 

export const CouponVisualEditor: React.FC<CouponVisualEditorProps> = ({ config, onChange, previewContent, gallery = [], setGallery }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pendingEmoji, setPendingEmoji] = useState<{ char: string, isImage: boolean } | null>(null);
  const [activeEmojiId, setActiveEmojiId] = useState<string | null>(null);

  const handleCustomEmojiUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Emoji muito grande. Máximo 2MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64Emoji = ev.target?.result as string;
        if (base64Emoji) {
          onChange({ 
            ...config, 
            customEmojis: [...(config.customEmojis || []), base64Emoji] 
          });
        }
      };
      reader.onerror = () => {
        alert('Erro ao ler o arquivo do emoji.');
      };
      reader.readAsDataURL(file);
    }
  };

  const selectEmoji = (char: string, isImage = false) => {
    setPendingEmoji({ char, isImage });
    setActiveEmojiId(null);
  };

  const placeEmoji = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pendingEmoji || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // QR Code protection: Bottom ~30% area (y > 0.7)
    if (y > 0.7) {
      alert('Não é possível colocar emoji sobre o QR Code.');
      return;
    }

    const newEmoji: Emoji = {
      id: crypto.randomUUID(),
      char: pendingEmoji.char,
      x,
      y,
      size: pendingEmoji.isImage ? 60 : 40,
      rotation: 0,
      opacity: 100,
      isImage: pendingEmoji.isImage
    };

    onChange({ ...config, emojis: [...(config.emojis || []), newEmoji] });
    setPendingEmoji(null);
    setActiveEmojiId(newEmoji.id);
  };

  const updateEmoji = (id: string, updates: Partial<Emoji>) => {
    onChange({
      ...config,
      emojis: (config.emojis || []).map(e => e.id === id ? { ...e, ...updates } : e)
    });
  };

  const removeEmoji = (id: string) => {
    onChange({
      ...config,
      emojis: (config.emojis || []).filter(e => e.id !== id)
    });
    if (activeEmojiId === id) setActiveEmojiId(null);
  };

  const activeEmoji = (config.emojis || []).find(e => e.id === activeEmojiId);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Controls */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 space-y-4 shadow-xl">
             <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <ImageIcon size={16} />
                </div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Fundo do Cupom</h3>
             </div>

             <div className="flex flex-col gap-4">
                <UniversalImageSelector 
                  value={config.backgroundImage || ''}
                  onChange={(url) => {
                    onChange({ ...config, backgroundImage: url });
                    // Auto-save to gallery if it's a new upload (base64)
                    if (url && url.startsWith('data:')) {
                      const isDup = (gallery || []).some((i: GalleryItem) => i.url === url);
                      if (!isDup) {
                        setGallery((prev: GalleryItem[]) => [
                          {
                            id: crypto.randomUUID(),
                            url,
                            type: 'greeting',
                            category: 'greeting_bg',
                            name: `Fundo_${Date.now()}`,
                            timestamp: Date.now()
                          },
                          ...prev
                        ]);
                      }
                    }
                  }}
                  category="greeting"
                  gallery={gallery}
                  setGallery={setGallery}
                  label="Imagem de Fundo"
                  aspectRatio="aspect-video"
                />
             </div>
          </div>

          <div className="bg-zinc-900 p-6 rounded-[2rem] border border-zinc-800 space-y-6 shadow-xl">
             <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400">
                  <Smile size={16} />
                </div>
                <h3 className="text-xs font-black text-zinc-100 uppercase tracking-widest">Biblioteca de Adesivos</h3>
             </div>

             <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(EMOJI_CATEGORIES).map(([category, emojis]) => (
                  <div key={category} className="space-y-2">
                    <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{category}</p>
                    <div className="flex flex-wrap gap-2">
                      {emojis.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => selectEmoji(emoji)}
                          className={`w-9 h-9 flex items-center justify-center text-lg transition-all active:scale-90 rounded-xl border ${pendingEmoji?.char === emoji ? 'bg-blue-600 border-blue-400' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-2 pt-2 border-t border-zinc-800">
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Personalizados</p>
                  <div className="flex flex-wrap gap-2">
                    {(config.customEmojis || []).map((url, i) => (
                      <button 
                        key={i} 
                        onClick={() => selectEmoji(url, true)} 
                        className={`w-12 h-12 flex items-center justify-center transition-all active:scale-90 overflow-hidden border rounded-xl ${pendingEmoji?.char === url ? 'bg-blue-600 border-blue-400 shadow-lg shadow-blue-500/20' : 'bg-zinc-800 border-zinc-700 hover:bg-zinc-700'}`}
                      >
                        <img src={url} className="w-full h-full object-contain p-1" />
                      </button>
                    ))}
                    <label className="w-12 h-12 bg-zinc-950 border-2 border-dashed border-zinc-800 rounded-xl flex items-center justify-center cursor-pointer hover:bg-zinc-900 transition-colors group">
                      <Plus size={18} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                      <input type="file" className="hidden" accept="image/*" onChange={handleCustomEmojiUpload} />
                    </label>
                  </div>
                </div>
             </div>
             {pendingEmoji ? (
               <div className="mt-4 p-3 bg-blue-600/10 border border-blue-500/20 rounded-xl flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2">
                    <div className="text-xl">{pendingEmoji.isImage ? <img src={pendingEmoji.char} className="w-6 h-6 object-contain" /> : pendingEmoji.char}</div>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">Emoji Selecionado</span>
                  </div>
                  <button onClick={() => setPendingEmoji(null)} className="text-blue-400 hover:text-white">
                    <X size={14} />
                  </button>
               </div>
             ) : (
               <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest mt-4">1. Escolha um emoji acima. 2. Clique na prévia ao lado para posicionar.</p>
             )}
          </div>

          {activeEmoji && (
            <div className="bg-zinc-900 p-6 rounded-[2rem] border border-blue-500/30 space-y-4 shadow-xl animate-in slide-in-from-bottom-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400">
                  <MousePointer2 size={16} />
                </div>
                <div className="flex-1">
                  <h3 className="text-[10px] font-black text-zinc-100 uppercase tracking-widest">Ajustar Emoji</h3>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase">Personalize o adesivo selecionado</p>
                </div>
                <button onClick={() => setActiveEmojiId(null)} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Tamanho ({activeEmoji.size}px)</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateEmoji(activeEmoji.id, { size: Math.max(10, activeEmoji.size - 5) })}
                      className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-100 transition-all border border-zinc-700"
                    >
                      <Minus size={14} />
                    </button>
                    <button 
                      onClick={() => updateEmoji(activeEmoji.id, { size: Math.min(200, activeEmoji.size + 5) })}
                      className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-100 transition-all border border-zinc-700"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Rotação ({activeEmoji.rotation || 0}°)</label>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateEmoji(activeEmoji.id, { rotation: (activeEmoji.rotation || 0) - 15 })}
                      className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-100 transition-all border border-zinc-700"
                    >
                      <RotateCcw size={14} />
                    </button>
                    <button 
                      onClick={() => updateEmoji(activeEmoji.id, { rotation: (activeEmoji.rotation || 0) + 15 })}
                      className="flex-1 h-10 bg-zinc-800 hover:bg-zinc-700 rounded-xl flex items-center justify-center text-zinc-100 transition-all border border-zinc-700"
                    >
                      <RotateCw size={14} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">Opacidade Individual ({activeEmoji.opacity ?? 100}%)</label>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={activeEmoji.opacity ?? 100}
                  onChange={(e) => updateEmoji(activeEmoji.id, { opacity: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              <button 
                onClick={() => removeEmoji(activeEmoji.id)}
                className="w-full h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
              >
                <Trash2 size={14} /> Remover Adesivo
              </button>
            </div>
          )}
        </div>

        {/* Interactive Preview */}
        <div className="flex flex-col items-center gap-4">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Clique no cupom para posicionar o emoji</p>
          
          <div 
            ref={containerRef}
            onClick={placeEmoji}
            className={`relative bg-white shadow-2xl rounded-sm overflow-hidden transition-all ${pendingEmoji ? 'cursor-crosshair ring-2 ring-blue-500/50' : 'cursor-default'}`} 
            style={{ width: `${CONTAINER_WIDTH}px`, height: `${CONTAINER_HEIGHT}px` }}
          >
            {/* Background Layer */}
            {config.backgroundImage && (
              <div 
                className="absolute inset-0 z-0 pointer-events-none"
                style={{ 
                  backgroundImage: `url("${config.backgroundImage}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  opacity: (config.backgroundOpacity ?? 10) / 100
                }}
              />
            )}

            {/* STATIC CONTENT (Text, etc) - Above Emojis */}
            <div className="relative z-20 w-full h-full pointer-events-none opacity-90 scale-95 origin-top mt-4 pr-1">
              {previewContent}
            </div>

            {/* EMOJI LAYER - Below Text, Above Background */}
            {(config.emojis || []).map((emoji) => (
              <div
                key={emoji.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveEmojiId(emoji.id);
                  setPendingEmoji(null);
                }}
                className={`absolute z-10 cursor-pointer transition-all duration-200 ${activeEmojiId === emoji.id ? 'ring-2 ring-blue-500 ring-offset-2 scale-110 z-50' : 'hover:scale-105'}`}
                style={{ 
                  left: `${emoji.x * 100}%`,
                  top: `${emoji.y * 100}%`,
                  transform: `translate(-50%, -50%) rotate(${emoji.rotation || 0}deg)`,
                  opacity: ((emoji.opacity ?? 100) / 100) * ((config.emojiOpacity ?? 100) / 100),
                  width: emoji.size,
                  height: emoji.size,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                {emoji.isImage ? (
                  <img src={emoji.char} className="w-full h-full object-contain pointer-events-none select-none" />
                ) : (
                  <span style={{ fontSize: emoji.size }} className="select-none leading-none">{emoji.char}</span>
                )}
              </div>
            ))}

            {/* Safe Area Warning Overlay - Visual only */}
            <div className="absolute bottom-10 left-0 right-0 h-24 border-t border-dashed border-blue-500/20 pointer-events-none flex items-center justify-center z-10">
               <span className="text-[7px] font-bold text-blue-500/30 uppercase tracking-widest">Área Protegida do QR Code</span>
            </div>
          </div>

          {/* Opacity Controls moved here */}
          <div className="w-full max-w-[300px] bg-zinc-900 p-5 rounded-2xl border border-zinc-800 space-y-5 shadow-lg">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Opacidade do fundo</label>
                <span className="text-[10px] font-black text-zinc-400">{config.backgroundOpacity ?? 10}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={config.backgroundOpacity ?? 10} 
                onChange={(e) => onChange({ ...config, backgroundOpacity: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>

            <div className="space-y-4 pt-2 border-t border-zinc-800/50">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Opacidade do emoji</label>
                <span className="text-[10px] font-black text-zinc-400">{config.emojiOpacity ?? 100}%</span>
              </div>
              <input 
                type="range" 
                min="0" 
                max="100" 
                value={config.emojiOpacity ?? 100} 
                onChange={(e) => onChange({ ...config, emojiOpacity: parseInt(e.target.value) })}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
