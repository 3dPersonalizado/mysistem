
import { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Search, ChevronRight, X, Minus, Plus, MessageCircle, Share2, Package, Tag, LayoutGrid, Info, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, Category, Subcategory, CompanyInfo } from '../App';
import { salvarDados, STORAGE_KEYS } from '../lib/persistence';

interface CatalogProps {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  company: CompanyInfo;
  catalogDescriptions: Record<string, string>;
  setCatalogDescriptions: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  canEdit: boolean;
}

interface CartItem {
  productId: string;
  quantity: number;
}

export function CatalogView({ 
  products, 
  categories, 
  subcategories, 
  company, 
  catalogDescriptions, 
  setCatalogDescriptions,
  canEdit
}: CatalogProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubCatId, setSelectedSubCatId] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempDescription, setTempDescription] = useState('');

  // Filter products: must be toggled to show in catalog and match filters
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (!p.showInCatalog) return false;
      
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCatId ? p.categoryId === selectedCatId : true;
      const matchesSubcategory = selectedSubCatId ? p.subcategoryId === selectedSubCatId : true;
      
      return matchesSearch && matchesCategory && matchesSubcategory;
    });
  }, [products, searchTerm, selectedCatId, selectedSubCatId]);

  const addToCart = (productId: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const updateCartQty = (productId: string, delta: number) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.productId === productId) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId);
      return total + (product?.price || 0) * item.quantity;
    }, 0);
  }, [cart, products]);

  const handleWhatsAppCheckout = () => {
    if (cart.length === 0) return;

    let message = `*Olá! Gostaria de fazer um pedido:*%0A%0A`;
    cart.forEach(item => {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        message += `• ${item.quantity}x ${product.name} - R$ ${(product.price * item.quantity).toFixed(2)}%0A`;
      }
    });
    message += `%0A*Total: R$ ${cartTotal.toFixed(2)}*`;

    const phone = company.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const buyNow = (product: Product) => {
    const message = `Olá! Tenho interesse no produto: ${product.name} - R$ ${product.price.toFixed(2)}`;
    const phone = company.phone.replace(/\D/g, '');
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const saveDescription = () => {
    if (selectedProduct) {
      setCatalogDescriptions(prev => {
        const updated = { ...prev, [selectedProduct.id]: tempDescription };
        salvarDados(STORAGE_KEYS.CATALOG_DESCRIPTIONS, updated);
        return updated;
      });
      setIsEditingDescription(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-24 animate-in fade-in duration-700 text-black">
      {/* Header */}
      <header className="bg-[#FFDE2E] border-b-4 border-black sticky top-0 z-30 px-4 py-8 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            {company.logo && (
              <img src={company.logo} alt="Logo" className="w-16 h-16 object-contain rounded-2xl border-4 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]" />
            )}
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-black uppercase tracking-tighter leading-none">{company.name}</h1>
              {company.slogan && (
                <p className="text-[10px] font-black text-black opacity-60 uppercase tracking-[0.2em] mt-2 bg-white px-3 py-1 rounded-lg border-2 border-black inline-block">{company.slogan}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black opacity-40" size={18} />
              <input 
                type="text" 
                placeholder="Buscar produtos..."
                className="w-full pl-12 pr-6 py-4 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase outline-none focus:ring-4 focus:ring-black/5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-4 bg-white text-black border-4 border-black rounded-2xl hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <ShoppingCart size={24} />
              {cart.length > 0 && (
                <span className="absolute -top-3 -right-3 bg-black text-[#FFDE2E] text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-[#FFDE2E] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Categories Bar */}
      <div className="bg-[#FFDE2E] border-b-4 border-black overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-4 sticky top-[104px] md:top-[128px] z-20 snap-x touch-pan-x scroll-smooth">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button 
            onClick={() => { setSelectedCatId(null); setSelectedSubCatId(null); }}
            className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all snap-center border-2 ${!selectedCatId ? 'bg-black text-[#FFDE2E] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white border-black text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
          >
            Todos
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => { setSelectedCatId(cat.id); setSelectedSubCatId(null); }}
              className={`px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all snap-center border-2 ${selectedCatId === cat.id ? 'bg-black text-[#FFDE2E] border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white border-black text-black hover:bg-black hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories (Conditional) */}
      {selectedCatId && subcategories.filter(s => s.categoryId === selectedCatId).length > 0 && (
        <div className="bg-white border-b-4 border-black overflow-x-auto no-scrollbar whitespace-nowrap px-4 py-4 sticky top-[168px] md:top-[192px] z-10 transition-all animate-in slide-in-from-top-2">
           <div className="max-w-7xl mx-auto flex items-center gap-3">
              <button 
                onClick={() => setSelectedSubCatId(null)}
                className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${!selectedSubCatId ? 'bg-black text-white border-black' : 'bg-white border-black text-black hover:bg-black/5'}`}
              >
                Geral
              </button>
              {subcategories.filter(s => s.categoryId === selectedCatId).map(sub => (
                <button 
                  key={sub.id}
                  onClick={() => setSelectedSubCatId(sub.id)}
                  className={`px-6 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border-2 ${selectedSubCatId === sub.id ? 'bg-black text-white border-black' : 'bg-white border-black text-black hover:bg-black/5'}`}
                >
                  {sub.name}
                </button>
              ))}
           </div>
        </div>
      )}

      {/* Product Grid */}
      <main className="max-w-7xl mx-auto p-6 md:p-12">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
          {filteredProducts.map(product => (
            <motion.div 
              id={`cat-prod-${product.id}`}
              layout
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-[2.5rem] overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] transition-all group flex flex-col"
            >
              <div 
                onClick={() => { setSelectedProduct(product); setTempDescription(catalogDescriptions[product.id] || ''); }}
                className="aspect-square bg-white overflow-hidden cursor-pointer border-b-4 border-black"
              >
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-black opacity-10">
                    <Package size={64} />
                  </div>
                )}
              </div>
              <div className="p-6 flex flex-col flex-1 gap-6">
                <div>
                  <h3 
                    onClick={() => { setSelectedProduct(product); setTempDescription(catalogDescriptions[product.id] || ''); }}
                    className="text-sm font-black text-black uppercase line-clamp-2 cursor-pointer hover:text-blue-600 transition-colors mb-2 min-h-[40px] leading-tight"
                  >
                    {product.name}
                  </h3>
                  <span className="text-lg font-black text-black italic">R$ {product.price.toFixed(2)}</span>
                </div>
                
                <div className="mt-auto flex flex-col gap-3">
                  <button 
                    onClick={() => buyNow(product)}
                    className="w-full py-4 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[2px] transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <MessageCircle size={18} fill="currentColor" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Pedir Agora</span>
                  </button>
                  <button 
                    onClick={() => addToCart(product.id)}
                    className="w-full py-4 bg-black text-white rounded-2xl flex items-center justify-center gap-3 hover:translate-y-[-2px] active:translate-y-[2px] transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <ShoppingCart size={18} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Carrinho</span>
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="py-24 text-center space-y-8 bg-zinc-50 border-4 border-dashed border-black rounded-[3rem]">
             <div className="w-24 h-24 bg-white border-4 border-black rounded-full flex items-center justify-center mx-auto text-black opacity-10 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
               <Search size={40} />
             </div>
             <div className="space-y-4">
               <p className="text-sm font-black text-black uppercase tracking-[0.4em] italic">Nenhum tesouro encontrado</p>
               <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest max-w-xs mx-auto">Tente buscar por outro termo ou limpe os filtros para ver tudo.</p>
             </div>
             <button 
              onClick={() => { setSearchTerm(''); setSelectedCatId(null); setSelectedSubCatId(null); }}
              className="px-10 py-4 bg-[#FFDE2E] text-black border-4 border-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
             >
                Limpar Filtros
             </button>
          </div>
        )}
      </main>

      {/* Floating Cart Button (Mobile) */}
      <div className="fixed bottom-8 right-8 z-40 md:hidden scale-110">
        <button 
          onClick={() => setIsCartOpen(true)}
          className="w-16 h-16 bg-[#FFDE2E] text-black rounded-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex items-center justify-center relative active:scale-90 transition-all border-4 border-black"
        >
          <ShoppingCart size={28} />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-black text-[#FFDE2E] text-[10px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-[#FFDE2E]">
              {cart.reduce((s, i) => s + i.quantity, 0)}
            </span>
          )}
        </button>
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-[3rem] border-4 border-black w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-[16px_16px_0px_0px_rgba(0,0,0,1)] relative"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute top-6 right-6 z-10 p-3 bg-white border-2 border-black text-black hover:bg-black hover:text-white rounded-2xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none"
              >
                <X size={24} />
              </button>

              <div className="w-full md:w-1/2 p-6 md:p-10">
                <div className="w-full aspect-square bg-white rounded-[2rem] overflow-hidden border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                  {selectedProduct.imageUrl ? (
                    <img src={selectedProduct.imageUrl} alt={selectedProduct.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-black opacity-10">
                      <Package size={64} />
                    </div>
                  )}
                </div>
              </div>

              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col overflow-y-auto no-scrollbar">
                <div className="mb-8">
                  <h2 className="text-2xl font-black text-black uppercase tracking-tighter leading-tight mb-4">
                    {selectedProduct.name}
                  </h2>
                  <div className="flex items-center gap-6">
                    <span className="text-3xl font-black text-[#FFDE2E] drop-shadow-[2px_2px_0px_rgba(0,0,0,1)] italic">R$ {selectedProduct.price.toFixed(2)}</span>
                    <span className="px-4 py-1 bg-white rounded-full text-[10px] font-black text-black uppercase tracking-[0.2em] border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                      Em Estoque
                    </span>
                  </div>
                </div>

                <div className="flex-1 space-y-10">
                  <div className="bg-zinc-50 p-6 rounded-[1.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em]">Descrição</h4>
                      {canEdit && (
                        <button 
                          onClick={() => setIsEditingDescription(!isEditingDescription)}
                          className="px-3 py-1 bg-white border-2 border-black rounded-lg text-[9px] font-black text-black uppercase hover:bg-[#FFDE2E] transition-all"
                        >
                          {isEditingDescription ? 'Cancelar' : 'Editar'}
                        </button>
                      )}
                    </div>
                    {isEditingDescription ? (
                      <div className="space-y-4">
                        <textarea 
                          value={tempDescription}
                          onChange={e => setTempDescription(e.target.value)}
                          className="w-full p-5 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-yellow-100 text-sm min-h-[140px] font-black uppercase transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          placeholder="Fale mais sobre esse produto para seus clientes..."
                        />
                        <button 
                          onClick={saveDescription}
                          className="w-full py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px]"
                        >
                          Salvar Descrição
                        </button>
                      </div>
                    ) : (
                      <p className="text-sm font-black text-black opacity-60 leading-relaxed uppercase italic">
                        {catalogDescriptions[selectedProduct.id] || 'Este produto está pronto para ser seu! Qualidade garantida.'}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Categoria</p>
                      <p className="text-[11px] font-black text-black uppercase">
                        {categories.find(c => c.id === selectedProduct.categoryId)?.name || 'Geral'}
                      </p>
                    </div>
                    <div className="p-4 bg-white rounded-2xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-1">SKU</p>
                      <p className="text-[11px] font-black text-black uppercase">{selectedProduct.sku || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10 grid grid-cols-2 gap-6">
                  <button 
                    onClick={() => buyNow(selectedProduct)}
                    className="col-span-2 py-5 bg-[#25D366] text-white rounded-2xl flex items-center justify-center gap-3 hover:translate-y-[-4px] transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                  >
                    <MessageCircle size={24} fill="currentColor" />
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Comprar no WhatsApp</span>
                  </button>
                  <button 
                    onClick={() => { addToCart(selectedProduct.id); setSelectedProduct(null); }}
                    className="col-span-2 py-5 bg-black text-white rounded-2xl flex items-center justify-center gap-3 hover:translate-y-[-4px] transition-all border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                  >
                    <ShoppingCart size={24} />
                    <span className="font-black text-xs uppercase tracking-[0.2em]">Colocar no Carrinho</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed right-0 top-0 h-full w-full max-w-md z-[60] bg-white border-l-4 border-black shadow-[-8px_0px_0px_0px_rgba(0,0,0,1)] flex flex-col"
            >
              <div className="p-8 bg-[#FFDE2E] border-b-4 border-black flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white border-2 border-black rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <ShoppingCart size={24} className="text-black" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-black uppercase tracking-tighter">Carrinho</h3>
                    <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{cart.length} ITENS</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsCartOpen(false)}
                  className="p-3 bg-white border-2 border-black rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                {cart.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center space-y-6">
                     <div className="w-24 h-24 bg-zinc-50 border-4 border-black border-dashed rounded-full flex items-center justify-center text-black opacity-10">
                       <ShoppingCart size={48} />
                     </div>
                     <p className="text-xs font-black text-black opacity-20 uppercase tracking-[0.3em] italic">Vazio por enquanto...</p>
                  </div>
                ) : (
                  cart.map(item => {
                    const product = products.find(p => p.id === item.productId);
                    if (!product) return null;
                    return (
                      <div key={item.productId} className="flex gap-4 p-5 bg-white rounded-[2rem] border-4 border-black hover:translate-y-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group">
                        <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border-2 border-black shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          {product.imageUrl ? (
                            <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-black opacity-10">
                              <Package size={32} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h4 className="text-[11px] font-black text-black uppercase mb-1 line-clamp-1 leading-none">{product.name}</h4>
                            <span className="text-[12px] font-black text-black italic">R$ {product.price.toFixed(2)}</span>
                          </div>
                          
                          <div className="mt-auto flex items-center justify-between">
                            <div className="flex items-center gap-4 bg-zinc-50 px-2 py-1.5 rounded-xl border-2 border-black">
                              <button onClick={() => updateCartQty(item.productId, -1)} className="p-1 hover:bg-[#FFDE2E] rounded-lg transition-colors border border-black/10">
                                <Minus size={14} />
                              </button>
                              <span className="text-xs font-black w-6 text-center text-black">{item.quantity}</span>
                              <button onClick={() => updateCartQty(item.productId, 1)} className="p-1 hover:bg-[#FFDE2E] rounded-lg transition-colors border border-black/10">
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-[12px] font-black text-black underline underline-offset-4 decoration-2 decoration-[#FFDE2E]">R$ {(product.price * item.quantity).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="p-8 bg-white border-t-4 border-black">
                <div className="flex justify-between items-center mb-8">
                  <span className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em]">Total Estimado</span>
                  <span className="text-3xl font-black text-black italic drop-shadow-[2px_2px_0px_rgba(255,222,46,1)]">R$ {cartTotal.toFixed(2)}</span>
                </div>
                <button 
                  onClick={handleWhatsAppCheckout}
                  disabled={cart.length === 0}
                  className="w-full py-6 bg-[#25D366] text-white rounded-[1.5rem] flex items-center justify-center gap-4 hover:translate-y-[-4px] transition-all font-black text-xs uppercase tracking-[0.3em] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] disabled:opacity-20 disabled:translate-y-0 disabled:shadow-none active:translate-y-[2px] active:shadow-none"
                >
                  <MessageCircle size={20} fill="currentColor" />
                  Finalizar WhatsApp
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Admin Panel (Publish) */}
      {canEdit && (
        <div className="fixed bottom-8 left-8 z-40 hidden md:block group">
           <button 
             onClick={() => {
                salvarDados(STORAGE_KEYS.PRODUCTS, products);
                salvarDados(STORAGE_KEYS.CATALOG_DESCRIPTIONS, catalogDescriptions);
                alert('Catálogo Salvo! Versão atual persistida localmente.');
             }}
             className="flex items-center gap-4 bg-white text-black px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-[2px] active:shadow-none border-4 border-black"
           >
             <Share2 size={20} className="group-hover:rotate-12 transition-transform" /> Publicar Catálogo
           </button>
        </div>
      )}
    </div>
  );
}
