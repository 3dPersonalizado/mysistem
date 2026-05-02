import React, { useState, useRef, ChangeEvent } from 'react';
import { Upload, Image as ImageIcon, Trash2, Plus, Database, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GalleryItem } from '../lib/persistence';
import { uploadToServer } from '../lib/utils';

/**
 * Componente Reutilizável de Seleção de Imagem (Upload + Galeria)
 */
export function UniversalImageSelector({ 
  value, 
  onChange, 
  category, 
  gallery = [], 
  setGallery,
  label = "Imagem",
  aspectRatio = "aspect-square"
}: { 
  value: string, 
  onChange: (url: string) => void, 
  category: 'greeting' | 'customer' | 'product' | 'logo',
  gallery?: GalleryItem[],
  setGallery: (fn: any) => void,
  label?: string,
  aspectRatio?: string
}) {
  const [showGallery, setShowGallery] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGallery = (gallery || []).filter(item => {
    if (category === 'logo') return true;
    if (category === 'greeting') return item.type === 'greeting' || item.category === 'greeting_bg';
    if (category === 'customer') return item.type === 'customer';
    if (category === 'product') return item.type === 'product';
    return true;
  });

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadToServer(file, category);
      onChange(url);

      // Salvar automaticamente na galeria
      const isDup = (gallery || []).some((i: GalleryItem) => i.url === url);
      if (!isDup) {
        const newItem: GalleryItem = {
          id: crypto.randomUUID(),
          type: category === 'logo' ? 'greeting' : category,
          category: category === 'greeting' ? 'greeting_bg' : (category === 'customer' ? 'customer_photo' : 'product_photo'),
          name: file.name,
          url: url,
          createdAt: Date.now()
        };
        setGallery((prev: GalleryItem[]) => [...prev, newItem]);
      }
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase block ml-1">{label}</label>
      <div className="flex gap-4 items-start">
        {/* Container da Imagem */}
        <div 
          onClick={() => !value && setShowGallery(true)}
          className={`relative ${aspectRatio} bg-zinc-950 rounded-[2rem] border-2 border-dashed border-zinc-800 flex flex-col items-center justify-center overflow-hidden hover:border-blue-500/50 transition-all cursor-pointer flex-1`}
        >
          {value ? (
            <img src={value} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 opacity-40">
              <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center">
                <ImageIcon size={24} className="text-zinc-600" />
              </div>
              <p className="text-[8px] font-black text-zinc-600 uppercase tracking-widest text-center">Nenhuma Imagem</p>
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            accept="image/*" 
            onChange={handleUpload} 
            className="hidden" 
          />
        </div>

        {/* Coluna de Ações à Direita */}
        <div className="flex flex-col gap-2 shrink-0 pt-1">
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
            className="w-11 h-11 bg-zinc-900 text-zinc-400 rounded-2xl border border-zinc-800 hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center shadow-lg"
            title="Fazer Upload"
          >
            <Upload size={18} />
          </button>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowGallery(true); }}
            className="w-11 h-11 bg-zinc-900 text-zinc-400 rounded-2xl border border-zinc-800 hover:text-white hover:border-blue-500/50 transition-all flex items-center justify-center shadow-lg"
            title="Abrir Galeria"
          >
            <Database size={18} />
          </button>
          {value && (
            <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="w-11 h-11 bg-zinc-900 text-zinc-500/60 rounded-2xl border border-zinc-800 hover:text-red-500 hover:border-red-500/50 transition-all flex items-center justify-center shadow-lg"
              title="Remover Imagem"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showGallery && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-zinc-900 rounded-[3rem] w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Escolha da Galeria</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Imagens salvas para {category}</p>
                </div>
                <button 
                  onClick={() => setShowGallery(false)}
                  className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-2xl transition-all"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 no-scrollbar bg-zinc-950/30">
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredGallery.map(item => (
                    <div 
                      key={item.id}
                      onClick={() => {
                        onChange(item.url);
                        setShowGallery(false);
                      }}
                      className="group relative aspect-square bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden cursor-pointer hover:border-blue-500 transition-all font-inter"
                    >
                      <img src={item.url} className="w-full h-full object-cover p-1" alt={item.name} />
                      <div className="absolute inset-0 bg-blue-600/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center font-black text-[10px] text-white uppercase tracking-widest text-center px-4">
                        <span>Selecionar</span>
                        <span className="text-[7px] opacity-60 mt-1 truncate w-full">{item.name}</span>
                      </div>
                    </div>
                  ))}
                  {filteredGallery.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-zinc-600 border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                      <ImageIcon size={48} className="mb-4 opacity-10" />
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nenhuma imagem adequada na galeria</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-zinc-950 border-t border-zinc-800 flex justify-between items-center">
                 <p className="text-[8px] md:text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Dica: Uploads de produtos e clientes são salvos aqui automaticamente.</p>
                 <button 
                   onClick={() => setShowGallery(false)}
                   className="px-8 py-3 bg-zinc-900 text-zinc-100 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-800 transition-all border border-zinc-800"
                 >
                   Sair
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
