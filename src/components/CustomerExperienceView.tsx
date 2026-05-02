
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Star, 
  ExternalLink, 
  Play, 
  Printer, 
  CheckCircle2, 
  Clock, 
  User, 
  Youtube, 
  QrCode, 
  Eye, 
  ChevronRight,
  AlertCircle,
  Video,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import { CouponVisualEditor } from './CouponVisualEditor';

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
}

interface Sale {
  id: string;
  sequentialId?: string;
  items: SaleItem[];
  originalItems?: SaleItem[];
  total: number;
  totalCost: number;
  totalProfit: number;
  date: number;
  customerId?: string;
  paymentMethod: string;
  status?: 'pendente' | 'em_separacao' | 'separado' | 'embalado' | 'enviado' | 'em_transporte' | 'entregue' | 'cancelado' | 'falta_confirmada';
  separatedByUserId?: string;
  separatedByUserName?: string;
  separationTimestamp?: string;
  youtubeLink?: string;
  greetingConfig?: GreetingCouponConfig;
}

interface Customer {
  id: string;
  name: string;
}

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
  format: 'thermal' | 'a6' | 'custom' | '58mm' | '80mm' | 'a4';
  width?: number;
  height?: number;
  backgroundImage?: string;
  backgroundOpacity?: number;
  emojiOpacity?: number;
  emojis?: Emoji[];
  customEmojis?: string[];
  qrCodeDesign?: QRCodeDesignConfig;
}

interface CompanyInfo {
  logo?: string;
  tradeName?: string;
  name: string;
}

interface CustomerExperienceViewProps {
  sales: Sale[];
  customers: Customer[];
  company: CompanyInfo;
  greetingCouponConfig: GreetingCouponConfig;
  onUpdateSale: (saleId: string, data: Partial<Sale>) => void;
  onPrintGreeting: (sale: Sale) => void;
}

const INITIAL_QR_DESIGN: any = {
  style: 'standard',
  color: '#000000',
  backgroundColor: '#FFFFFF',
  opacity: 100,
  dotType: 'square'
};

export function CustomerExperienceView({ 
  sales, 
  customers, 
  company, 
  greetingCouponConfig, 
  onUpdateSale,
  onPrintGreeting
}: CustomerExperienceViewProps) {
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [rightTab, setRightTab] = useState<'coupon' | 'video'>('coupon');
  const [youtubeInput, setYoutubeInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeConfig, setActiveConfig] = useState<GreetingCouponConfig | null>(null);

  const selectedSale = useMemo(() => {
    return sales.find(s => s.id === selectedSaleId);
  }, [sales, selectedSaleId]);

  const selectedCustomer = useMemo(() => {
    if (!selectedSale) return null;
    return customers.find(c => c.id === selectedSale.customerId);
  }, [selectedSale, customers]);

  const separatedSales = useMemo(() => {
    return sales
      .filter(s => s.status === 'separado')
      .filter(s => {
        const customer = customers.find(c => c.id === s.customerId);
        const search = searchTerm.toLowerCase();
        return (
          s.sequentialId?.toString().includes(search) || 
          customer?.name.toLowerCase().includes(search)
        );
      })
      .sort((a, b) => b.date - a.date);
  }, [sales, customers, searchTerm]);

  useEffect(() => {
    if (selectedSale) {
      // Use sale specific config or start with template
      const baseConfig = { ...greetingCouponConfig };
      
      // If sale has greetingConfig, merge it
      if (selectedSale.greetingConfig) {
        setActiveConfig({
          ...baseConfig,
          ...selectedSale.greetingConfig
        });
      } else {
        // First time editing for this sale: use the template but it's now independent
        setActiveConfig({ ...baseConfig });
      }
    } else {
      setActiveConfig(null);
    }
  }, [selectedSale, greetingCouponConfig]);

  const handleUpdateConfig = (newConfig: GreetingCouponConfig) => {
    setActiveConfig(newConfig);
    if (selectedSaleId) {
      onUpdateSale(selectedSaleId, { greetingConfig: newConfig });
    }
  };

  const getVideoEmbedUrl = (url: string) => {
    if (!url) return null;
    
    // YouTube
    const ytRegExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const ytMatch = url.match(ytRegExp);
    if (ytMatch && ytMatch[2].length === 11) {
      return `https://www.youtube.com/embed/${ytMatch[2]}`;
    }

    // Google Drive
    // Formato aceito: https://drive.google.com/file/d/ID_DO_ARQUIVO/view?usp=sharing
    const driveRegExp = /\/file\/d\/([^\/]+)/;
    const driveMatch = url.match(driveRegExp);
    if (driveMatch && (url.includes('drive.google.com') || url.includes('google.com/drive')) && driveMatch && driveMatch[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return null;
  };

  const handleGenerateQr = () => {
    if (!selectedSale || !youtubeInput) return;
    
    setIsGenerating(true);
    // Simulate some logic or just update
    setTimeout(() => {
      onUpdateSale(selectedSale.id, { youtubeLink: youtubeInput });
      setIsGenerating(false);
    }, 500);
  };

  const currentEmbedUrl = selectedSale?.youtubeLink ? getVideoEmbedUrl(selectedSale.youtubeLink) : null;

  return (
    <div className="w-full flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 tracking-tight uppercase">Experiência do Cliente</h2>
          <p className="text-zinc-500 text-sm font-medium">Encante seus clientes com mensagens personalizadas em vídeo.</p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-sky-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Buscar por pedido ou cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-80 pl-11 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition-all shadow-sm"
          />
        </div>
      </div>

      {!selectedSaleId ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {separatedSales.length > 0 ? (
              separatedSales.map((sale) => {
                const customer = customers.find(c => c.id === sale.customerId);
                return (
                  <motion.button
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    key={sale.id}
                    onClick={() => {
                      setSelectedSaleId(sale.id);
                      setYoutubeInput(sale.youtubeLink || '');
                    }}
                    className="flex flex-col gap-4 p-5 bg-white border border-zinc-200 rounded-[2rem] hover:border-sky-500 hover:shadow-xl hover:shadow-sky-500/10 transition-all text-left relative group overflow-hidden"
                  >
                    <div className="flex justify-between items-start w-full">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Pedido</span>
                        <span className="text-xl font-black text-zinc-900">#{sale.sequentialId}</span>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${sale.youtubeLink ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                        {sale.youtubeLink ? 'Com Vídeo' : 'Sem Vídeo'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                       <div className="flex items-center gap-2">
                          <User size={14} className="text-zinc-400" />
                          <span className="text-sm font-bold text-zinc-700 truncate">{customer?.name || 'Cliente Final'}</span>
                       </div>
                       <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-sky-500" />
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Status: Separado</span>
                       </div>
                    </div>

                    <div className="mt-2 pt-4 border-t border-zinc-100 flex justify-between items-center w-full">
                       <div className="flex flex-col">
                          <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">Separado por:</span>
                          <span className="text-[10px] font-bold text-zinc-600">{sale.separatedByUserName || 'Sistema'}</span>
                       </div>
                       <ChevronRight size={18} className="text-zinc-300 group-hover:text-sky-500 group-hover:translate-x-1 transition-all" />
                    </div>
                  </motion.button>
                );
              })
            ) : (
              <div className="col-span-full py-20 flex flex-col items-center justify-center text-center bg-white border-2 border-dashed border-zinc-200 rounded-[3rem]">
                 <div className="w-16 h-16 bg-zinc-50 rounded-3xl flex items-center justify-center text-zinc-300 mb-4">
                    <Star size={32} />
                 </div>
                 <h3 className="text-lg font-black text-zinc-900 uppercase">Nenhum pedido separado</h3>
                 <p className="text-zinc-500 text-sm max-w-xs mt-2 font-medium">Os pedidos aparecerão aqui assim que forem finalizados na separação.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Lado Esquerdo: Detalhes e Input */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <button 
              onClick={() => setSelectedSaleId(null)}
              className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 font-black text-xs uppercase tracking-widest transition-colors w-fit"
            >
              <ChevronRight size={18} className="rotate-180" /> Voltar para lista
            </button>

            <div className="bg-white border border-zinc-200 rounded-[2.5rem] p-8 shadow-xl shadow-zinc-200/50 flex flex-col gap-8">
              <div className="flex justify-between items-start">
                <div className="flex flex-col">
                  <h3 className="text-3xl font-black text-zinc-900">#{selectedSale?.sequentialId}</h3>
                  <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">Detalhes da Experiência</p>
                </div>
                <div className="p-4 bg-sky-50 text-sky-600 rounded-3xl">
                   <Star size={24} />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Cliente</span>
                      <span className="text-sm font-black text-zinc-800">{selectedCustomer?.name}</span>
                   </div>
                   <User className="text-zinc-300" size={20} />
                </div>

                <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Separador</span>
                      <span className="text-sm font-black text-zinc-800">{selectedSale?.separatedByUserName || 'Sistema'}</span>
                   </div>
                   <CheckCircle2 className="text-emerald-500" size={20} />
                </div>

                {selectedSale?.separationTimestamp && (
                  <div className="flex items-center justify-between p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                     <div className="flex flex-col">
                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Data Separação</span>
                        <span className="text-sm font-black text-zinc-800">{new Date(selectedSale.separationTimestamp).toLocaleString('pt-BR')}</span>
                     </div>
                     <Clock className="text-zinc-300" size={20} />
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-black text-zinc-900 uppercase tracking-widest ml-1">Link do Vídeo (YouTube ou Google Drive)</label>
                  <div className="relative">
                    <Play className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input 
                      type="text"
                      placeholder="YouTube ou Google Drive..."
                      value={youtubeInput}
                      onChange={(e) => setYoutubeInput(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-sky-500/10 focus:border-sky-500 transition-all"
                    />
                  </div>
                </div>

                <button 
                  onClick={handleGenerateQr}
                  disabled={!youtubeInput || isGenerating}
                  className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                    !youtubeInput ? 'bg-zinc-100 text-zinc-400 cursor-not-allowed' : 'bg-[#1A1A1A] text-white hover:bg-black shadow-zinc-900/10'
                  }`}
                >
                  {isGenerating ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><QrCode size={18} /> Gerar QR Code</>
                  )}
                </button>
              </div>

              {selectedSale?.youtubeLink && (
                 <button 
                    onClick={() => onPrintGreeting(selectedSale!)}
                    className="w-full py-5 bg-white border-2 border-[#1A1A1A] text-[#1A1A1A] rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-zinc-50 transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
                 >
                    <Printer size={18} /> Imprimir Saudação
                 </button>
              )}
            </div>
          </div>

          {/* Lado Direito: Prévias */}
          <div className="lg:col-span-7 flex flex-col gap-6">
             <div className="bg-white border border-zinc-200 rounded-[2.5rem] overflow-hidden shadow-xl shadow-zinc-200/50 min-h-[600px] flex flex-col">
                <div className="flex border-b border-zinc-100">
                   <button 
                      onClick={() => setRightTab('coupon')}
                      className={`flex-1 py-6 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${rightTab === 'coupon' ? 'bg-[#1A1A1A] text-white' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50 border-r border-zinc-100'}`}
                   >
                      <Eye size={18} /> Editar & Prévia do Cupom
                   </button>
                   <button 
                      onClick={() => setRightTab('video')}
                      className={`flex-1 py-6 flex items-center justify-center gap-2 font-black text-xs uppercase tracking-widest transition-all ${rightTab === 'video' ? 'bg-[#1A1A1A] text-white' : 'text-zinc-400 hover:text-zinc-900 hover:bg-zinc-50'}`}
                   >
                      <Play size={18} /> Prévia do Vídeo
                   </button>
                </div>

                <div className="flex-1 p-8 bg-[#F8F9FA]">
                   {rightTab === 'coupon' ? (
                      <div className="flex flex-col gap-8 items-center">
                         {activeConfig && (
                            <div className="w-full">
                               <CouponVisualEditor 
                                 config={activeConfig}
                                 onChange={handleUpdateConfig}
                                 previewContent={
                                    <div className="flex flex-col items-center text-center p-4 relative h-full">
                                       <div className="absolute inset-0 z-0 bg-white/40 pointer-events-none" />
                                       <div className="relative z-10 w-full flex flex-col items-center">
                                          <div className="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center mb-3">
                                             {company.logo ? (
                                               <img src={company.logo} className="w-6 h-6 object-contain" />
                                             ) : (
                                               <Star size={20} className="text-zinc-300" />
                                             )}
                                          </div>
                                          <h4 className="text-[10px] font-bold uppercase mb-1">{activeConfig.title}</h4>
                                          <p className="text-[8px] mb-4 leading-relaxed line-clamp-3">{activeConfig.message}</p>
                                          
                                          <div 
                                            className="w-24 h-24 rounded-lg flex items-center justify-center mb-2 overflow-hidden"
                                            style={{ 
                                              backgroundColor: activeConfig.qrCodeDesign?.backgroundColor || '#FFFFFF',
                                              opacity: (activeConfig.qrCodeDesign?.opacity ?? 100) / 100
                                            }}
                                          >
                                             {selectedSale?.youtubeLink ? (
                                               <QRCodeCanvas 
                                                 value={selectedSale.youtubeLink}
                                                 size={80}
                                                 level="H"
                                                 fgColor={activeConfig.qrCodeDesign?.color || '#000000'}
                                                 bgColor={activeConfig.qrCodeDesign?.backgroundColor || '#FFFFFF'}
                                                 imageSettings={activeConfig.qrCodeDesign?.style === 'logo' && activeConfig.qrCodeDesign?.logoUrl ? {
                                                   src: activeConfig.qrCodeDesign.logoUrl,
                                                   height: 15,
                                                   width: 15,
                                                   excavate: true,
                                                 } : undefined}
                                               />
                                             ) : (
                                               <QrCode size={24} className="text-zinc-300" />
                                             )}
                                          </div>
                                          <span className="text-[6px] font-bold uppercase">{activeConfig.qrCodeText}</span>
                                          
                                          <div className="w-full border-t border-dashed border-zinc-200 mt-4 pt-4 flex flex-col gap-1 text-[7px] text-zinc-500 uppercase tracking-tight text-left">
                                             {activeConfig.showOrderNumber && (
                                               <div className="flex justify-between">
                                                  <span>Pedido:</span>
                                                  <span className="font-bold text-zinc-900">#{selectedSale?.sequentialId}</span>
                                               </div>
                                             )}
                                             {activeConfig.showCustomerName && (
                                               <div className="flex justify-between">
                                                  <span>Cliente:</span>
                                                  <span className="font-bold text-zinc-900 truncate max-w-[100px]">{selectedCustomer?.name}</span>
                                               </div>
                                             )}
                                          </div>
              
                                          <div className="mt-4 text-[7px] font-bold italic opacity-60">
                                             {activeConfig.footerText}
                                          </div>
                                       </div>
                                    </div>
                                 }
                               />
                            </div>
                         )}
                      </div>
                   ) : (
                      <div className="w-full max-w-2xl aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl relative">
                        {currentEmbedUrl ? (
                          <iframe 
                            width="100%" 
                            height="100%" 
                            src={currentEmbedUrl}
                            title="Video player" 
                            frameBorder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                            allowFullScreen
                          ></iframe>
                        ) : (
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-8 text-center bg-zinc-900">
                             <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-3xl flex items-center justify-center mb-4">
                                <Play size={32} />
                             </div>
                             <h4 className="text-xl font-black uppercase tracking-tight">Nenhum vídeo configurado</h4>
                             <p className="text-zinc-500 text-sm mt-2 max-w-xs">Insira um link do YouTube ou Google Drive para visualizar a prévia do vídeo aqui.</p>
                          </div>
                        )}
                      </div>
                   )}
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
