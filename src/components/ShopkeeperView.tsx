/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, FormEvent } from 'react';
import { 
  Users, 
  Plus, 
  Minus,
  Trash2, 
  Search, 
  UserPlus, 
  Store, 
  Package, 
  Truck, 
  CheckCircle, 
  History, 
  FileText, 
  Printer, 
  ArrowRight,
  TrendingUp,
  CreditCard,
  X,
  User,
  MapPin,
  Phone,
  LayoutGrid,
  ChevronDown,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Shopkeeper {
  id: string;
  name: string; // Responsável
  storeName: string;
  taxId: string; // CPF/CNPJ
  phone: string;
  whatsapp?: string;
  cep: string;
  address: string;
  observations: string;
  image?: string;
  updatedAt: number;
}

interface ShopkeeperItem {
  productId: string;
  quantity: number; // Entregue
  soldQuantity: number; // Acertado/Vendido
  returnedQuantity: number; // Devolvido
  shopkeeperPrice: number;
  costPrice: number;
}

interface ShopkeeperDelivery {
  id: string;
  shopkeeperId: string;
  items: ShopkeeperItem[];
  status: 'aberto' | 'acerto' | 'finalizado';
  date: number;
  updatedAt: number;
  history: {
    action: string;
    date: number;
    details: string;
  }[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  costPrice?: number;
  stock: number;
  shopkeeperPrice?: number;
  sku?: string;
  barcode?: string;
  imageUrl?: string;
}

interface ShopkeeperViewProps {
  shopkeepers: Shopkeeper[];
  setShopkeepers: (s: Shopkeeper[]) => void;
  deliveries: ShopkeeperDelivery[];
  setDeliveries: (d: ShopkeeperDelivery[]) => void;
  products: Product[];
  setProducts: (p: Product[]) => void;
  addActivity: (type: any, action: string, details: string) => void;
  canEdit: boolean;
  company: any;
  sales: any[];
  setSales: (s: any[]) => void;
  revenues: any[];
  setRevenues: (r: any[]) => void;
  addSaleToCashier: (sale: any) => void;
  currentUser: any | null;
}

export function ShopkeeperView({ 
  shopkeepers, 
  setShopkeepers, 
  deliveries, 
  setDeliveries, 
  products,
  setProducts,
  addActivity,
  canEdit,
  company,
  sales,
  setSales,
  revenues,
  setRevenues,
  addSaleToCashier,
  currentUser
}: ShopkeeperViewProps) {
  const [activeTab, setActiveTab] = useState<'cadastro' | 'entregas' | 'acertos' | 'historico'>('cadastro');
  const [searchTerm, setSearchTerm] = useState('');
  const [deliveryProductSearch, setDeliveryProductSearch] = useState('');
  const [settlementSearchTerm, setSettlementSearchTerm] = useState('');
  
  // Forms states
  const [showShopkeeperForm, setShowShopkeeperForm] = useState(false);
  const [isViewing, setIsViewing] = useState(false);
  const [editingShopkeeperId, setEditingShopkeeperId] = useState<string | null>(null);
  const [newShopkeeper, setNewShopkeeper] = useState<Omit<Shopkeeper, 'id' | 'updatedAt'>>({
    name: '',
    storeName: '',
    taxId: '',
    phone: '',
    cep: '',
    address: '',
    observations: ''
  });

  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [selectedLojistaId, setSelectedLojistaId] = useState('');
  const [deliveryCart, setDeliveryCart] = useState<{ productId: string, quantity: number }[]>([]);

  const [selectedShopkeeperForSettlement, setSelectedShopkeeperForSettlement] = useState<string | null>(null);
  const [settlementData, setSettlementData] = useState<{ productId: string, sold: number, returned: number }[]>([]);

  // Helpers
  const maskPhone = (value: string) => {
    const nums = value.replace(/\D/g, '');
    if (nums.length <= 10) return nums.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return nums.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').substring(0, 15);
  };

  const handleSaveShopkeeper = (e: FormEvent) => {
    e.preventDefault();
    if (!newShopkeeper.name || !newShopkeeper.storeName) return alert('Nome e Loja são obrigatórios');

    if (editingShopkeeperId) {
      const updated = { 
        ...newShopkeeper, 
        id: editingShopkeeperId,
        updatedAt: Date.now() 
      };
      setShopkeepers(shopkeepers.map(s => s.id === editingShopkeeperId ? updated : s));
      addActivity('system', 'Lojista Atualizado', `Lojista ${newShopkeeper.storeName} foi atualizado.`);
    } else {
      const shopkeeper: Shopkeeper = {
        ...newShopkeeper,
        id: crypto.randomUUID(),
        updatedAt: Date.now()
      };
      setShopkeepers([...shopkeepers, shopkeeper]);
      addActivity('system', 'Novo Lojista', `Lojista ${newShopkeeper.storeName} foi cadastrado.`);
    }

    setShowShopkeeperForm(false);
    setEditingShopkeeperId(null);
    setNewShopkeeper({ name: '', storeName: '', taxId: '', phone: '', cep: '', address: '', observations: '' });
  };

  const handleSaveDelivery = () => {
    if (!selectedLojistaId) return alert('Selecione um lojista');
    if (deliveryCart.length === 0) return alert('Adicione produtos à entrega');

    const deliveryItems: ShopkeeperItem[] = deliveryCart.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return {
        productId: item.productId,
        quantity: item.quantity,
        soldQuantity: 0,
        returnedQuantity: 0,
        shopkeeperPrice: p?.shopkeeperPrice || p?.price || 0,
        costPrice: p?.costPrice || 0
      };
    });

    const newDelivery: ShopkeeperDelivery = {
      id: crypto.randomUUID(),
      shopkeeperId: selectedLojistaId,
      items: deliveryItems,
      status: 'aberto',
      date: Date.now(),
      updatedAt: Date.now(),
      history: [{ action: 'Entrega Criada', date: Date.now(), details: 'Entrega inicial de produtos' }]
    };

    // Update stocks
    const updatedProducts = products.map(p => {
      const item = deliveryCart.find(i => i.productId === p.id);
      if (item) {
        return { ...p, stock: p.stock - item.quantity };
      }
      return p;
    });

    setProducts(updatedProducts);
    setDeliveries([...deliveries, newDelivery]);
    
    addActivity('system', 'Nova Entrega Lojista', `Entrega registrada para ${shopkeepers.find(s => s.id === selectedLojistaId)?.storeName}`);
    
    setShowDeliveryForm(false);
    setSelectedLojistaId('');
    setDeliveryCart([]);
    
    // Print logic would go here
    imprimirTermoEntrega(newDelivery);
  };

  const handleSaveSettlement = () => {
    if (!selectedShopkeeperForSettlement) return;

    const pendingDeliveries = deliveries.filter(d => d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado');
    
    // Validate totals across grouped items
    const groupedItems: Record<string, { totalSent: number, productId: string }> = {};
    pendingDeliveries.forEach(d => {
      d.items.forEach(item => {
        if (!groupedItems[item.productId]) {
          groupedItems[item.productId] = { totalSent: 0, productId: item.productId };
        }
        groupedItems[item.productId].totalSent += (item.quantity - item.soldQuantity - item.returnedQuantity);
      });
    });

    for (const item of settlementData) {
      if ((item.sold + item.returned > (groupedItems[item.productId]?.totalSent || 0))) {
        const p = products.find(prod => prod.id === item.productId);
        return alert(`A soma de vendidos e devolvidos para ${p?.name} não pode ser maior que o enviado (${groupedItems[item.productId].totalSent})`);
      }
    }

    const now = Date.now();
    const updatedDeliveries = [...deliveries];
    
    // Update each delivery involved
    pendingDeliveries.forEach(delivery => {
      const dIdx = updatedDeliveries.findIndex(d => d.id === delivery.id);
      if (dIdx === -1) return;

      const newItems = delivery.items.map(di => {
        const sEntry = settlementData.find(si => si.productId === di.productId);
        if (sEntry) {
          const remainingInThisDelivery = di.quantity - di.soldQuantity - di.returnedQuantity;
          // Distribute sold/returned to this delivery item until exhausted
          const toSettleInThisStore = settlementData.find(s => s.productId === di.productId);
          if (toSettleInThisStore) {
            // This is slightly complex because we need to track how much of sEntry.sold we've applied
            // Since we iterate over deliveries, we'll use a "remaining to settle" pattern
          }
        }
        return di;
      });
    });

    // Actually, a simpler way to distribute:
    const remainingToSettle = settlementData.map(s => ({ ...s }));

    const finalUpdatedDeliveries = updatedDeliveries.map(d => {
      if (d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado') {
        const newItems = d.items.map(di => {
          const sIdx = remainingToSettle.findIndex(rs => rs.productId === di.productId);
          if (sIdx !== -1) {
            const diRemaining = di.quantity - di.soldQuantity - di.returnedQuantity;
            
            const soldFromThis = Math.min(diRemaining, remainingToSettle[sIdx].sold);
            remainingToSettle[sIdx].sold -= soldFromThis;
            
            const returnedFromThis = Math.min(diRemaining - soldFromThis, remainingToSettle[sIdx].returned);
            remainingToSettle[sIdx].returned -= returnedFromThis;

            return { 
              ...di, 
              soldQuantity: di.soldQuantity + soldFromThis, 
              returnedQuantity: di.returnedQuantity + returnedFromThis 
            };
          }
          return di;
        });

        const allSettled = newItems.every(ni => ni.soldQuantity + ni.returnedQuantity === ni.quantity);
        return { 
          ...d, 
          items: newItems, 
          status: allSettled ? 'finalizado' : 'acerto',
          updatedAt: now,
          history: [...d.history, { 
            action: 'Acerto Agrupado', 
            date: now, 
            details: `Acerto realizado via fluxo de lojista.` 
          }]
        } as ShopkeeperDelivery;
      }
      return d;
    });

    // Handle Stock for returns
    const updatedProducts = [...products];
    settlementData.forEach(s => {
      if (s.returned > 0) {
        const pIdx = updatedProducts.findIndex(p => p.id === s.productId);
        if (pIdx !== -1) {
          updatedProducts[pIdx] = { ...updatedProducts[pIdx], stock: updatedProducts[pIdx].stock + s.returned };
        }
      }
    });

    // Handle Finance/Sales for sold items
    const totalSold = settlementData.reduce((acc, s) => {
      // Find price from first delivery that has this product
      const dWithProduct = pendingDeliveries.find(d => d.items.some(i => i.productId === s.productId));
      const dItem = dWithProduct?.items.find(i => i.productId === s.productId);
      return acc + (s.sold * (dItem?.shopkeeperPrice || 0));
    }, 0);

    const totalSoldCost = settlementData.reduce((acc, s) => {
      const dWithProduct = pendingDeliveries.find(d => d.items.some(i => i.productId === s.productId));
      const dItem = dWithProduct?.items.find(i => i.productId === s.productId);
      return acc + (s.sold * (dItem?.costPrice || 0));
    }, 0);

    if (totalSold > 0) {
      const lojista = shopkeepers.find(s => s.id === selectedShopkeeperForSettlement);
      const newSale: any = {
        id: crypto.randomUUID(),
        date: now,
        total: totalSold,
        totalCost: totalSoldCost,
        totalProfit: totalSold - totalSoldCost,
        paymentMethod: 'ACERTO LOJISTA',
        status: 'entregue',
        customerId: lojista?.id,
        notes: `Acerto Lojista Agrupado: ${lojista?.storeName}`,
        items: settlementData.filter(s => s.sold > 0).map(s => {
          const dWithProduct = pendingDeliveries.find(d => d.items.some(i => i.productId === s.productId));
          const dItem = dWithProduct?.items.find(i => i.productId === s.productId);
          return {
            productId: s.productId,
            quantity: s.sold,
            price: dItem?.shopkeeperPrice || 0,
            cost: dItem?.costPrice || 0,
            profit: (dItem?.shopkeeperPrice || 0) - (dItem?.costPrice || 0)
          };
        })
      };

      setSales([...sales, newSale]);
      addSaleToCashier(newSale);
      
      const newRevenue = {
        id: crypto.randomUUID(),
        saleId: newSale.id,
        amount: totalSold,
        status: 'confirmado',
        date: new Date().toISOString(),
        updatedAt: Date.now()
      };
      setRevenues([...revenues, newRevenue]);
    }

    setProducts(updatedProducts);
    setDeliveries(finalUpdatedDeliveries);
    
    setSelectedShopkeeperForSettlement(null);
    setSettlementData([]);
    addActivity('system', 'Acerto Lojista', `Acerto finalizado para ${shopkeepers.find(s => s.id === selectedShopkeeperForSettlement)?.storeName}`);
  };

  const imprimirTermoEntrega = async (delivery: ShopkeeperDelivery) => {
    const lojista = shopkeepers.find(s => s.id === delivery.shopkeeperId);
    if (!lojista) return;

    const itemsContent = delivery.items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      return `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${p?.name || 'Produto'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        </tr>
      `;
    }).join('');

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.6; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .company { font-weight: bold; font-size: 24px; margin-bottom: 5px; }
            .doc-title { font-size: 18px; color: #666; text-transform: uppercase; letter-spacing: 2px; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
            .info-card { background: #f9f9f9; padding: 20px; rounded: 8px; }
            .info-label { font-size: 10px; font-weight: bold; color: #999; text-transform: uppercase; }
            .info-value { font-size: 14px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 60px; }
            th { text-align: left; background: #eee; padding: 12px; font-size: 12px; text-transform: uppercase; }
            .signature { margin-top: 100px; text-align: center; border-top: 1px solid #333; width: 300px; margin-left: auto; margin-right: auto; padding-top: 10px; font-weight: bold; }
            .date { text-align: right; margin-bottom: 20px; font-style: italic; }
          </style>
        </head>
        <body onload="window.print()">
          <div class="header">
            <div class="company">${company.name}</div>
            <div class="doc-title">Termo de Entrega ao Lojista</div>
          </div>
          
          <div class="date">Data: ${new Date(delivery.date).toLocaleDateString('pt-BR')}</div>

          <div class="info-grid">
            <div class="info-card">
              <div class="info-label">Lojista / Estabelecimento</div>
              <div class="info-value">${lojista.storeName}</div>
              <div class="info-label" style="margin-top: 10px;">Responsável</div>
              <div class="info-value">${lojista.name}</div>
            </div>
            <div class="info-card">
              <div class="info-label">Documento</div>
              <div class="info-value">${lojista.taxId}</div>
              <div class="info-label" style="margin-top: 10px;">Endereço</div>
              <div class="info-value">${lojista.address}, ${lojista.cep}</div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th style="text-align: center;">Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${itemsContent}
            </tbody>
          </table>

          <div style="margin-top: 40px;">
            Declaro ter recebido os produtos acima relacionados em perfeitas condições para revenda em regime de consignação/acerto posterior.
          </div>

          <div class="signature">
            Assinatura do Responsável
          </div>
        </body>
      </html>
    `;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(htmlContent);
      win.document.close();
    }
  };

  // Render sub-views
  return (
    <div className="space-y-8 animate-in fade-in duration-500 text-black">
      {/* Header Tabs */}
      <div className="flex bg-[#FFDE2E] p-2 rounded-[2rem] border-4 border-black w-full overflow-x-auto no-scrollbar shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        {[
          { id: 'cadastro', label: 'Cadastro', icon: <Users size={14} /> },
          { id: 'entregas', label: 'Entregas', icon: <Truck size={14} /> },
          { id: 'acertos', label: 'Acertos', icon: <CheckCircle size={14} /> },
          { id: 'historico', label: 'Histórico', icon: <History size={14} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[120px] px-6 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 border-2 ${
              activeTab === tab.id 
                ? 'bg-black text-[#FFDE2E] border-black' 
                : 'text-black border-transparent hover:bg-black/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'cadastro' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="relative flex-1 w-full max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black opacity-40" size={18} />
              <input 
                placeholder="Pesquisar lojista..." 
                className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-yellow-100 text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {canEdit && (
              <button 
                onClick={() => {
                  setEditingShopkeeperId(null);
                  setNewShopkeeper({ name: '', storeName: '', taxId: '', phone: '', cep: '', address: '', observations: '' });
                  setIsViewing(false);
                  setShowShopkeeperForm(true);
                }}
                className="w-full md:w-auto flex items-center justify-center gap-3 text-[10px] font-black text-white uppercase tracking-widest bg-black px-8 py-4 rounded-2xl hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black"
              >
                <UserPlus size={16} /> Novo Lojista
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {shopkeepers.filter(s => s.storeName.toLowerCase().includes(searchTerm.toLowerCase()) || s.name.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
              <div key={s.id} className="bg-white rounded-[2rem] border-4 border-black overflow-hidden group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex flex-col">
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="w-14 h-14 bg-[#FFDE2E] rounded-2xl flex items-center justify-center text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Store size={24} />
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setEditingShopkeeperId(s.id);
                          setNewShopkeeper({ ...s });
                          setIsViewing(false);
                          setShowShopkeeperForm(true);
                        }}
                        title="Editar"
                        className="p-3 bg-white text-black rounded-xl border-2 border-black hover:bg-[#FFDE2E] transition-colors"
                      >
                        <FileText size={16} />
                      </button>
                      <button 
                        onClick={() => {
                          setEditingShopkeeperId(s.id);
                          setNewShopkeeper({ ...s });
                          setIsViewing(true);
                          setShowShopkeeperForm(true);
                        }}
                        title="Visualizar"
                        className="p-3 bg-white text-black rounded-xl border-2 border-black hover:bg-[#FFDE2E] transition-colors"
                      >
                        <Search size={16} />
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => {
                            if (confirm('Deseja excluir este lojista?')) {
                              setShopkeepers(shopkeepers.filter(sk => sk.id !== s.id));
                            }
                          }}
                          title="Excluir"
                          className="p-3 bg-white text-black rounded-xl border-2 border-black hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-black uppercase tracking-tight leading-tight">{s.storeName}</h4>
                    <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-1">{s.name}</p>
                  </div>
                  <div className="space-y-3 pt-6 border-t-2 border-black/5">
                    <div className="flex items-center gap-3 text-[10px] text-black font-black uppercase tracking-widest">
                      <Phone size={14} className="opacity-40" /> {s.phone}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-black font-black uppercase tracking-widest">
                      <MapPin size={14} className="opacity-40" /> {s.address}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {shopkeepers.length === 0 && (
              <div className="col-span-full py-20 text-center space-y-6 bg-white rounded-[3rem] border-4 border-black border-dashed">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mx-auto text-black opacity-20 border-4 border-black/10">
                   <Users size={40} />
                </div>
                <div>
                   <p className="text-sm font-black text-black uppercase tracking-widest">Nenhum lojista cadastrado</p>
                   <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-2">Comece cadastrando seu primeiro parceiro</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'entregas' && (
        <div className="space-y-6 text-black">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Entregas em Aberto</h4>
            {canEdit && (
              <button 
                onClick={() => setShowDeliveryForm(true)}
                className="w-full md:w-auto flex items-center justify-center gap-3 text-[10px] font-black text-white uppercase tracking-widest bg-purple-600 px-8 py-4 rounded-2xl hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black"
              >
                <Plus size={16} /> Nova Entrega
              </button>
            )}
          </div>

          <div className="bg-white rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b-4 border-black">
                    <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Data</th>
                    <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Lojista</th>
                    <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Itens</th>
                    <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Status</th>
                    <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {deliveries.filter(d => d.status === 'aberto').sort((a,b) => b.date - a.date).map(d => {
                    const lojista = shopkeepers.find(s => s.id === d.shopkeeperId);
                    return (
                      <tr key={d.id} className="hover:bg-zinc-50 transition-all">
                        <td className="p-6">
                          <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{new Date(d.date).toLocaleDateString('pt-BR')}</p>
                        </td>
                        <td className="p-6">
                          <p className="text-xs font-black text-black uppercase tracking-tight leading-tight">{lojista?.storeName}</p>
                          <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mt-0.5">{lojista?.name}</p>
                        </td>
                        <td className="p-6">
                          <span className="bg-zinc-100 border-2 border-zinc-200 px-3 py-1.5 rounded-lg text-[10px] font-black text-black opacity-60 uppercase tracking-widest">
                            {d.items.length} {d.items.length === 1 ? 'PRODUTO' : 'PRODUTOS'}
                          </span>
                        </td>
                        <td className="p-6">
                           <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-sky-100 text-sky-700 border-2 border-sky-200">Em Aberto</span>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex justify-end gap-3">
                            <button 
                              onClick={() => imprimirTermoEntrega(d)}
                              className="p-3 bg-white text-black rounded-xl border-2 border-black hover:bg-zinc-100 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                            >
                              <Printer size={16} />
                            </button>
                            <button 
                              onClick={() => {
                                const shopkeeperPendingDeliveries = deliveries.filter(del => del.shopkeeperId === d.shopkeeperId && del.status !== 'finalizado');
                                const grouped: Record<string, { totalSent: number, productId: string }> = {};
                                shopkeeperPendingDeliveries.forEach(del => {
                                  del.items.forEach(item => {
                                    if (!grouped[item.productId]) {
                                      grouped[item.productId] = { totalSent: 0, productId: item.productId };
                                    }
                                    grouped[item.productId].totalSent += (item.quantity - item.soldQuantity - item.returnedQuantity);
                                  });
                                });

                                setSettlementData(Object.values(grouped).filter(g => g.totalSent > 0).map(g => ({ 
                                  productId: g.productId, 
                                  sold: 0, 
                                  returned: 0 
                                })));
                                setSelectedShopkeeperForSettlement(d.shopkeeperId);
                                setActiveTab('acertos');
                              }}
                              className="bg-[#FFDE2E] text-black border-2 border-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                            >
                              Acertar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {deliveries.filter(d => d.status === 'aberto').length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-20 text-center text-[10px] font-black text-black opacity-20 uppercase tracking-widest italic">
                         Nenhuma entrega pendente de acerto
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'acertos' && (
        <div className="space-y-8 text-black">
           <div>
             <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Selecione o Lojista para Acerto</h4>
                <div className="relative w-full md:w-80">
                   <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black opacity-40" size={16} />
                   <input 
                      className="w-full bg-white border-4 border-black rounded-xl py-3 pl-12 pr-4 text-xs font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                      placeholder="Pesquisar lojista..."
                      value={settlementSearchTerm}
                      onChange={e => setSettlementSearchTerm(e.target.value)}
                   />
                </div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {shopkeepers.filter(s => {
                 const hasPending = deliveries.some(d => d.shopkeeperId === s.id && d.status !== 'finalizado');
                 const matchesSearch = s.storeName.toLowerCase().includes(settlementSearchTerm.toLowerCase()) || 
                                     s.name.toLowerCase().includes(settlementSearchTerm.toLowerCase());
                 return hasPending && matchesSearch;
               }).map(s => {
                  const isSelected = selectedShopkeeperForSettlement === s.id;
                  const shopkeeperPendingDeliveries = deliveries.filter(d => d.shopkeeperId === s.id && d.status !== 'finalizado');
                  const totalPendingItems = shopkeeperPendingDeliveries.reduce((acc, d) => 
                    acc + d.items.reduce((iAcc, item) => iAcc + (item.quantity - item.soldQuantity - item.returnedQuantity), 0), 0
                  );

                  return (
                    <button 
                      key={s.id}
                      onClick={() => {
                        const grouped: Record<string, { totalSent: number, productId: string }> = {};
                        shopkeeperPendingDeliveries.forEach(d => {
                          d.items.forEach(item => {
                            if (!grouped[item.productId]) {
                              grouped[item.productId] = { totalSent: 0, productId: item.productId };
                            }
                            grouped[item.productId].totalSent += (item.quantity - item.soldQuantity - item.returnedQuantity);
                          });
                        });

                        setSettlementData(Object.values(grouped).filter(g => g.totalSent > 0).map(g => ({ 
                          productId: g.productId, 
                          sold: 0, 
                          returned: 0 
                        })));
                        setSelectedShopkeeperForSettlement(s.id);
                      }}
                      className={`p-8 rounded-[2rem] border-4 transition-all text-left space-y-4 hover:translate-y-[-4px] ${
                        isSelected 
                          ? 'bg-[#FFDE2E] border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]' 
                          : 'bg-white border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)]'
                      }`}
                    >
                       <div className="flex justify-between items-start">
                          <div className={`p-4 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isSelected ? 'bg-black text-white' : 'bg-[#FFDE2E]'}`}>
                             <Store size={24} />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest opacity-40">
                             {shopkeeperPendingDeliveries.length} Entregas
                          </span>
                       </div>
                       <div>
                          <p className="text-sm font-black text-black uppercase truncate leading-tight">{s.storeName}</p>
                          <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-1.5">{totalPendingItems} Itens Pendentes</p>
                       </div>
                    </button>
                  )
               })}
               {shopkeepers.filter(s => deliveries.some(d => d.shopkeeperId === s.id && d.status !== 'finalizado')).length === 0 && (
                 <div className="col-span-full p-20 bg-white rounded-[3rem] border-4 border-black border-dashed text-center">
                   <p className="text-xs font-black text-black opacity-20 uppercase tracking-widest">Nenhum lojista com entregas pendentes</p>
                 </div>
               )}
             </div>
           </div>

           {selectedShopkeeperForSettlement && (
             <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="p-8 bg-zinc-900 rounded-[2.5rem] border border-zinc-800 space-y-8">
                   <div className="flex justify-between items-center pb-6 border-b border-zinc-800">
                      <div>
                        <h4 className="text-lg font-black text-zinc-100 uppercase tracking-tight">Acerto Agrupado</h4>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                           {shopkeepers.find(s => s.id === selectedShopkeeperForSettlement)?.storeName} - 
                           Todos os itens pendentes das {deliveries.filter(d => d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado').length} entregas em aberto.
                        </p>
                      </div>
                      <button onClick={() => setSelectedShopkeeperForSettlement(null)} className="text-zinc-500 hover:text-white">
                         <X size={24} />
                      </button>
                   </div>

                   <div className="space-y-4">
                      {settlementData.map(si => {
                        const p = products.find(prod => prod.id === si.productId);
                        // Find total pending across all deliveries
                        const pendingDeliveries = deliveries.filter(d => d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado');
                        const totalSent = pendingDeliveries.reduce((acc, d) => {
                          const item = d.items.find(i => i.productId === si.productId);
                          return acc + (item ? (item.quantity - item.soldQuantity - item.returnedQuantity) : 0);
                        }, 0);

                        // Find shopkeeper price (usually same across deliveries if recent, but we take first available)
                        const dWithPrice = pendingDeliveries.find(d => d.items.some(i => i.productId === si.productId));
                        const price = dWithPrice?.items.find(i => i.productId === si.productId)?.shopkeeperPrice || p?.shopkeeperPrice || p?.price || 0;

                        return (
                          <div key={si.productId} className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 bg-white rounded-2xl border-4 border-black items-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             <div className="lg:col-span-4 flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-black border-2 border-black overflow-hidden shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                   {p?.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" referrerPolicy="no-referrer" /> : <Package size={20} />}
                                </div>
                                <div>
                                  <p className="text-[11px] font-black text-black uppercase truncate leading-tight">{p?.name || 'Produto'}</p>
                                  <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mt-1">Total Enviado Acumulado: {totalSent}</p>
                                </div>
                             </div>
                             
                             <div className="lg:col-span-3">
                                <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-2 block">Vendidos</label>
                                <div className="flex items-center gap-3">
                                   <button 
                                      onClick={() => {
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, sold: Math.max(0, item.sold - 1) } : item));
                                      }}
                                      className="p-2.5 bg-white border-2 border-black rounded-lg text-black hover:bg-[#FFDE2E] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                                   >
                                      <Minus size={14} />
                                   </button>
                                   <input 
                                      type="number"
                                      className="w-16 p-2.5 bg-white rounded-lg border-2 border-black text-center text-xs font-black text-black outline-none focus:bg-yellow-50"
                                      value={si.sold}
                                      onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, sold: Math.min(totalSent - item.returned, val) } : item));
                                      }}
                                   />
                                   <button 
                                      onClick={() => {
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, sold: Math.min(totalSent - item.returned, item.sold + 1) } : item));
                                      }}
                                      className="p-2.5 bg-white border-2 border-black rounded-lg text-black hover:bg-[#FFDE2E] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                                   >
                                      <Plus size={14} />
                                   </button>
                                </div>
                             </div>

                             <div className="lg:col-span-3">
                                <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-2 block">Devolvidos</label>
                                <div className="flex items-center gap-3">
                                   <button 
                                      onClick={() => {
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, returned: Math.max(0, item.returned - 1) } : item));
                                      }}
                                      className="p-2.5 bg-white border-2 border-black rounded-lg text-black hover:bg-[#FFDE2E] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                                   >
                                      <Minus size={14} />
                                   </button>
                                   <input 
                                      type="number"
                                      className="w-16 p-2.5 bg-white rounded-lg border-2 border-black text-center text-xs font-black text-black outline-none focus:bg-yellow-50"
                                      value={si.returned}
                                      onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, returned: Math.min(totalSent - item.sold, val) } : item));
                                      }}
                                   />
                                   <button 
                                      onClick={() => {
                                        setSettlementData(prev => prev.map(item => item.productId === si.productId ? { ...item, returned: Math.min(totalSent - item.sold, item.returned + 1) } : item));
                                      }}
                                      className="p-2.5 bg-white border-2 border-black rounded-lg text-black hover:bg-[#FFDE2E] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none"
                                   >
                                      <Plus size={14} />
                                   </button>
                                </div>
                             </div>

                             <div className="lg:col-span-2 text-right">
                                <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-1 block">Subtotal Lojista</label>
                                <p className="text-sm font-black text-black italic">
                                   R$ {( si.sold * price ).toFixed(2)}
                                </p>
                             </div>
                          </div>
                        );
                      })}
                   </div>

                   <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t-4 border-black gap-6">
                      <div className="flex gap-12">
                         <div>
                            <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-2">TOTAL VENDIDO</p>
                            <p className="text-3xl font-black text-black italic leading-none">
                               R$ {settlementData.reduce((acc, s) => {
                                 const pendingDeliveries = deliveries.filter(d => d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado');
                                 const dWithProduct = pendingDeliveries.find(d => d.items.some(i => i.productId === s.productId));
                                 const price = dWithProduct?.items.find(i => i.productId === s.productId)?.shopkeeperPrice || products.find(p => p.id === s.productId)?.shopkeeperPrice || products.find(p => p.id === s.productId)?.price || 0;
                                 return acc + (s.sold * price);
                               }, 0).toFixed(2)}
                            </p>
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-2">LUCRO ESTIMADO</p>
                            <p className="text-3xl font-black text-blue-600 italic leading-none">
                               R$ {settlementData.reduce((acc, s) => {
                                 const pendingDeliveries = deliveries.filter(d => d.shopkeeperId === selectedShopkeeperForSettlement && d.status !== 'finalizado');
                                 const dWithProduct = pendingDeliveries.find(d => d.items.some(i => i.productId === s.productId));
                                 const item = dWithProduct?.items.find(i => i.productId === s.productId);
                                 const price = item?.shopkeeperPrice || products.find(p => p.id === s.productId)?.shopkeeperPrice || products.find(p => p.id === s.productId)?.price || 0;
                                 const cost = item?.costPrice || products.find(p => p.id === s.productId)?.costPrice || 0;
                                 return acc + (s.sold * (price - cost));
                               }, 0).toFixed(2)}
                            </p>
                         </div>
                      </div>
                      <button 
                        onClick={handleSaveSettlement}
                        className="w-full md:w-auto bg-black text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black active:translate-y-[2px] active:shadow-none flex items-center justify-center gap-4"
                      >
                         <CheckCircle size={20} /> Finalizar Acerto
                      </button>
                   </div>
                </div>
             </motion.div>
           )}
        </div>
      )}

      {activeTab === 'historico' && (
        <div className="space-y-8 text-black font-black">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
             <div className="p-8 bg-white rounded-[2.5rem] border-4 border-black space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 text-purple-600">
                   <TrendingUp size={28} />
                   <h5 className="text-[10px] font-black uppercase tracking-widest">Faturamento Lojistas</h5>
                </div>
                <p className="text-3xl font-black text-black leading-none">
                   R$ {sales.filter(s => s.paymentMethod === 'ACERTO LOJISTA').reduce((acc, s) => acc + s.total, 0).toFixed(2)}
                </p>
             </div>
             <div className="p-8 bg-[#FFDE2E] rounded-[2.5rem] border-4 border-black space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 text-black">
                   <CheckCircle size={28} />
                   <h5 className="text-[10px] font-black uppercase tracking-widest">Lucro Acumulado</h5>
                </div>
                <p className="text-3xl font-black text-black leading-none">
                   R$ {sales.filter(s => s.paymentMethod === 'ACERTO LOJISTA').reduce((acc, s) => acc + (s.totalProfit || 0), 0).toFixed(2)}
                </p>
             </div>
             <div className="p-8 bg-white rounded-[2.5rem] border-4 border-black space-y-4 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4 text-emerald-600">
                   <Users size={28} />
                   <h5 className="text-[10px] font-black uppercase tracking-widest">Lojistas Ativos</h5>
                </div>
                <p className="text-3xl font-black text-black leading-none">{shopkeepers.length}</p>
             </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
             <div className="p-8 border-b-4 border-black bg-zinc-50">
                <h4 className="text-[10px] font-black text-black uppercase tracking-widest opacity-40">Acertos Realizados</h4>
             </div>
             <div className="overflow-x-auto">
              <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white border-b-2 border-black/10">
                      <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Data</th>
                      <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Lojista</th>
                      <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Valor Acerto</th>
                      <th className="p-6 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Lucro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y-2 divide-black/5">
                    {sales.filter(s => s.paymentMethod === 'ACERTO LOJISTA').sort((a,b) => b.date - a.date).map(sale => {
                       const lojistaId = sale.customerId;
                       const lojista = shopkeepers.find(sk => sk.id === lojistaId);
                       return (
                         <tr key={sale.id} className="hover:bg-zinc-50 transition-all">
                            <td className="p-6 align-top">
                               <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                            </td>
                            <td className="p-6 align-top">
                               <p className="text-xs font-black text-black uppercase tracking-tight leading-tight">{lojista?.storeName || 'Lojista Excluído'}</p>
                               <div className="mt-3 space-y-2">
                                  {sale.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between text-[8px] font-black text-black opacity-40 uppercase tracking-widest">
                                      <span className="truncate mr-4">{products.find(p => p.id === item.productId)?.name || 'Produto'}</span>
                                      <span className="flex-shrink-0">{item.quantity} un</span>
                                    </div>
                                  ))}
                               </div>
                            </td>
                            <td className="p-6 align-top">
                               <p className="text-xs font-black text-black italic">R$ {sale.total.toFixed(2)}</p>
                            </td>
                            <td className="p-6 align-top">
                               <p className="text-xs font-black text-blue-600">R$ {(sale.totalProfit || 0).toFixed(2)}</p>
                            </td>
                         </tr>
                       );
                    })}
                    {sales.filter(s => s.paymentMethod === 'ACERTO LOJISTA').length === 0 && (
                      <tr>
                        <td colSpan={4} className="p-20 text-center text-[10px] font-black text-black opacity-20 uppercase tracking-widest italic">
                           Nenhum histórico de acerto disponível
                        </td>
                      </tr>
                    )}
                  </tbody>
              </table>
             </div>
          </div>
        </div>
      )}

      {/* Forms Modals */}
      <AnimatePresence>
        {showShopkeeperForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] border-4 border-black w-full max-w-2xl max-h-[90vh] overflow-y-auto p-10 no-scrollbar space-y-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">
                      {isViewing ? 'Detalhes do Lojista' : editingShopkeeperId ? 'Editar Lojista' : 'Novo Lojista'}
                    </h4>
                    <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-2">Informações cadastrais do parceiro</p>
                  </div>
                  <button onClick={() => setShowShopkeeperForm(false)} className="p-3 bg-white border-2 border-black rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                     <X size={24} />
                  </button>
               </div>

               <form onSubmit={handleSaveShopkeeper} className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Loja / Estabelecimento <span className="text-red-500">*</span></label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.storeName}
                           onChange={e => setNewShopkeeper({...newShopkeeper, storeName: e.target.value})}
                           placeholder="Ex: Boutique da Moda"
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Responsável / Contato <span className="text-red-500">*</span></label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.name}
                           onChange={e => setNewShopkeeper({...newShopkeeper, name: e.target.value})}
                           placeholder="Ex: Maria Oliveira"
                           required
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">CPF / CNPJ</label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.taxId}
                           onChange={e => setNewShopkeeper({...newShopkeeper, taxId: e.target.value})}
                           placeholder="000.000.000-00"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Telefone / WhatsApp</label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.phone}
                           onChange={e => setNewShopkeeper({...newShopkeeper, phone: maskPhone(e.target.value)})}
                           placeholder="(00) 00000-0000"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">CEP</label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.cep}
                           onChange={e => setNewShopkeeper({...newShopkeeper, cep: e.target.value})}
                           placeholder="00000-000"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Endereço Completo</label>
                        <input 
                           readOnly={isViewing}
                           className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                           value={newShopkeeper.address}
                           onChange={e => setNewShopkeeper({...newShopkeeper, address: e.target.value})}
                           placeholder="Rua, Número, Bairro, Cidade"
                        />
                     </div>
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Observações Internas</label>
                     <textarea 
                        readOnly={isViewing}
                        className={`w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[120px] ${isViewing ? 'opacity-60 cursor-default shadow-none' : ''}`}
                        value={newShopkeeper.observations}
                        onChange={e => setNewShopkeeper({...newShopkeeper, observations: e.target.value})}
                        placeholder="Notas sobre o parceiro, entregas, etc."
                     />
                  </div>
                  {!isViewing && (
                    <div className="pt-6">
                      <button type="submit" className="w-full bg-[#FFDE2E] text-black p-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black active:translate-y-[2px] active:shadow-none">
                          {editingShopkeeperId ? 'Salvar Edição' : 'Cadastrar Lojista'}
                      </button>
                    </div>
                  )}
               </form>
            </motion.div>
          </motion.div>
        )}

        {showDeliveryForm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="bg-white rounded-[2.5rem] border-4 border-black w-full max-w-4xl max-h-[90vh] overflow-y-auto p-10 no-scrollbar space-y-10 shadow-[16px_16px_0px_0px_rgba(0,0,0,1)]">
               <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-2xl font-black text-black uppercase tracking-tight leading-tight">Nova Entrega</h4>
                    <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-2">Selecione o parceiro e monte a grade</p>
                  </div>
                  <button onClick={() => setShowDeliveryForm(false)} className="p-3 bg-white border-2 border-black rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-y-[2px] active:shadow-none">
                     <X size={24} />
                  </button>
               </div>

               <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-4">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Selecione o Lojista</label>
                        <select 
                           className="w-full p-5 bg-white rounded-2xl border-4 border-black text-sm font-black uppercase text-black outline-none focus:ring-4 focus:ring-yellow-100 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] cursor-pointer appearance-none"
                           value={selectedLojistaId}
                           onChange={e => setSelectedLojistaId(e.target.value)}
                        >
                           <option value="">-- Escolha um Parceiro --</option>
                           {shopkeepers.map(s => (
                             <option key={s.id} value={s.id}>{s.storeName.toUpperCase()} ({s.name.toUpperCase()})</option>
                           ))}
                        </select>
                     </div>
                     <div className="flex flex-col justify-end">
                          <div className="p-6 bg-yellow-50 rounded-2xl border-4 border-black border-dashed text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                             <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Total da Entrega</p>
                             <p className="text-2xl font-black text-black italic">
                                R$ {deliveryCart.reduce((acc, item) => {
                                 const p = products.find(prod => prod.id === item.productId);
                                 return acc + (item.quantity * (p?.shopkeeperPrice || p?.price || 0));
                               }, 0).toFixed(2)}
                             </p>
                          </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Buscar Produtos</label>
                        <div className="relative">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-black opacity-40" size={18} />
                          <input 
                            placeholder="Nome, SKU ou ID..." 
                            className="w-full pl-14 pr-6 py-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-yellow-100 text-sm font-black text-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            value={deliveryProductSearch}
                            onChange={e => setDeliveryProductSearch(e.target.value)}
                          />
                        </div>
                        <div className="max-h-80 overflow-y-auto pr-4 no-scrollbar space-y-3">
                           {deliveryProductSearch.length >= 2 && products.filter(p => 
                             !deliveryCart.find(ci => ci.productId === p.id) && 
                             (p.name.toLowerCase().includes(deliveryProductSearch.toLowerCase()) || 
                              p.sku?.toLowerCase().includes(deliveryProductSearch.toLowerCase()) ||
                              p.barcode?.toLowerCase().includes(deliveryProductSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(deliveryProductSearch.toLowerCase())) && 
                             p.stock > 0
                           ).map(p => (
                             <button
                                key={p.id}
                                onClick={() => {
                                  setDeliveryCart([...deliveryCart, { productId: p.id, quantity: 1 }]);
                                  setDeliveryProductSearch('');
                                }}
                                className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border-2 border-black hover:bg-[#FFDE2E] transition-all text-left shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] group"
                             >
                                <div className="flex items-center gap-4">
                                   <div className="w-10 h-10 bg-white border-2 border-black rounded-lg flex items-center justify-center text-black group-hover:bg-white">
                                      <Package size={18} />
                                   </div>
                                   <div>
                                      <p className="text-[10px] font-black text-black uppercase truncate leading-tight">{p.name}</p>
                                      <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mt-1">Estoque: {p.stock} | R$ {(p.shopkeeperPrice || p.price).toFixed(2)}</p>
                                   </div>
                                </div>
                                <Plus size={16} className="text-black" />
                             </button>
                           ))}
                           {deliveryProductSearch.length >= 2 && products.filter(p => 
                             !deliveryCart.find(ci => ci.productId === p.id) && 
                             (p.name.toLowerCase().includes(deliveryProductSearch.toLowerCase()) || 
                              p.sku?.toLowerCase().includes(deliveryProductSearch.toLowerCase()) ||
                              p.barcode?.toLowerCase().includes(deliveryProductSearch.toLowerCase()) ||
                              p.id.toLowerCase().includes(deliveryProductSearch.toLowerCase())) && 
                             p.stock > 0
                           ).length === 0 && (
                             <p className="text-[10px] text-center text-black opacity-20 font-black uppercase py-8">Nenhum produto encontrado</p>
                           )}
                           {deliveryProductSearch.length < 2 && deliveryProductSearch.length > 0 && (
                             <p className="text-[10px] text-center text-black opacity-40 font-black uppercase py-8 italic tracking-widest">Digite mais caracteres...</p>
                           )}
                        </div>
                     </div>

                     <div className="space-y-6">
                        <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Grade da Entrega</label>
                        <div className="max-h-80 overflow-y-auto pr-4 no-scrollbar space-y-4">
                           {deliveryCart.map(item => {
                             const p = products.find(prod => prod.id === item.productId);
                             return (
                               <div key={item.productId} className="p-5 bg-white rounded-[1.5rem] border-4 border-black flex items-center justify-between shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                  <div className="flex-1 min-w-0">
                                     <p className="text-[11px] font-black text-black uppercase truncate leading-tight">{p?.name}</p>
                                     <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mt-1">R$ {(p?.shopkeeperPrice || p?.price || 0).toFixed(2)} / un</p>
                                  </div>
                                  <div className="flex items-center gap-4">
                                     <div className="flex items-center bg-zinc-50 rounded-xl border-2 border-black p-1">
                                        <button onClick={() => setDeliveryCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.max(1, i.quantity - 1) } : i))} className="p-1.5 text-black hover:bg-[#FFDE2E] rounded-lg transition-colors">
                                           <Minus size={12} />
                                        </button>
                                        <input 
                                           className="w-10 bg-transparent text-center text-xs font-black text-black outline-none"
                                           value={item.quantity}
                                           onChange={e => {
                                             const val = parseInt(e.target.value) || 1;
                                             setDeliveryCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.min(p?.stock || 0, val) } : i));
                                           }}
                                        />
                                        <button onClick={() => setDeliveryCart(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: Math.min(p?.stock || 0, i.quantity + 1) } : i))} className="p-1.5 text-black hover:bg-[#FFDE2E] rounded-lg transition-colors">
                                           <Plus size={12} />
                                        </button>
                                     </div>
                                     <button onClick={() => setDeliveryCart(deliveryCart.filter(i => i.productId !== item.productId))} className="p-2 text-black opacity-20 hover:text-red-500 hover:opacity-100 transition-all">
                                        <Trash2 size={20} />
                                     </button>
                                  </div>
                               </div>
                             );
                           })}
                           {deliveryCart.length === 0 && (
                             <div className="p-12 border-4 border-dashed border-black rounded-[2.5rem] bg-zinc-50 flex flex-col items-center justify-center text-center">
                                <Package className="text-black opacity-10 mb-4" size={40} />
                                <p className="text-[10px] font-black text-black opacity-20 uppercase tracking-widest italic">A grade está vazia</p>
                             </div>
                           )}
                        </div>
                     </div>
                  </div>

                  <button 
                     disabled={!selectedLojistaId || deliveryCart.length === 0}
                     onClick={handleSaveDelivery}
                     className="w-full bg-purple-600 text-white p-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all border-4 border-black active:translate-y-[2px] active:shadow-none disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none disabled:translate-y-0"
                  >
                     Finalizar Entrega e Gerar Termo
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
