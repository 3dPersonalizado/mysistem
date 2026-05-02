/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Calendar,
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  Check,
  X,
  PieChart as PieChartIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface FinanceViewProps {
  revenues: any[];
  setRevenues: (r: any[]) => void;
  purchases: any[];
  setPurchases: (p: any[]) => void;
  expenses: any[];
  setExpenses: (e: any[]) => void;
  rawMaterials: any[];
  setRawMaterials: (rm: any[]) => void;
  productRecipes: any[];
  setProductRecipes: (pr: any[]) => void;
  products: any[];
  addActivity: any;
  setView: (v: any) => void;
  canEdit: boolean;
  currentUser: any | null;
  paymentIcons: Record<string, string>;
}

export function FinanceView({ 
  revenues, 
  setRevenues, 
  purchases, 
  setPurchases, 
  expenses, 
  setExpenses,
  rawMaterials,
  setRawMaterials,
  productRecipes,
  setProductRecipes,
  products,
  addActivity,
  setView,
  canEdit,
  currentUser,
  paymentIcons
}: FinanceViewProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'revenues' | 'purchases' | 'expenses' | 'costs' | 'materials'>('overview');
  
  // Date filter states
  const [filterType, setFilterType] = useState<'day' | 'month' | 'year'>('month');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().substring(0, 10)); // YYYY-MM-DD

  // Add state for forms
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [newPurchase, setNewPurchase] = useState({ itemName: '', quantity: 0, totalValue: 0, rawMaterialId: '' });
  
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [newExpense, setNewExpense] = useState({ description: '', amount: 0, category: 'Outros' });

  // Materials form
  const [showMaterialForm, setShowMaterialForm] = useState(false);
  const [newMaterial, setNewMaterial] = useState({ name: '', unitCost: 0, unit: 'g' as any });

  // Recipe selection
  const [editingRecipeProductId, setEditingRecipeProductId] = useState<string | null>(null);

  const isAdmin = useMemo(() => {
    return currentUser?.id === 'admin' || currentUser?.roleId === 'role-gerente';
  }, [currentUser]);

  // Filtering logic
  const filteredRevenues = useMemo(() => {
    return revenues.filter(r => {
      const matchesUser = isAdmin || r.userId === currentUser?.id;
      if (!matchesUser) return false;

      if (filterType === 'day') return r.date.startsWith(selectedDate);
      if (filterType === 'month') return r.date.startsWith(selectedDate.substring(0, 7));
      return r.date.startsWith(selectedDate.substring(0, 4));
    });
  }, [revenues, selectedDate, filterType, isAdmin, currentUser]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const matchesUser = isAdmin || p.userId === currentUser?.id;
      if (!matchesUser) return false;

      if (filterType === 'day') return p.date.startsWith(selectedDate);
      if (filterType === 'month') return p.date.startsWith(selectedDate.substring(0, 7));
      return p.date.startsWith(selectedDate.substring(0, 4));
    });
  }, [purchases, selectedDate, filterType, isAdmin, currentUser]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchesUser = isAdmin || e.userId === currentUser?.id;
      if (!matchesUser) return false;

      if (filterType === 'day') return e.date.startsWith(selectedDate);
      if (filterType === 'month') return e.date.startsWith(selectedDate.substring(0, 7));
      return e.date.startsWith(selectedDate.substring(0, 4));
    });
  }, [expenses, selectedDate, filterType, isAdmin, currentUser]);

  // Calculations
  const totalRevenues = useMemo(() => filteredRevenues.reduce((acc, r) => acc + (r.status === 'confirmado' ? r.amount : 0), 0), [filteredRevenues]);
  const pendingRevenues = useMemo(() => filteredRevenues.reduce((acc, r) => acc + (r.status === 'pendente' ? r.amount : 0), 0), [filteredRevenues]);
  const totalPurchases = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.totalValue, 0), [filteredPurchases]);
  const totalExpenses = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  const netProfit = totalRevenues - totalPurchases - totalExpenses;

  const handleAddPurchase = () => {
    if (!newPurchase.itemName || newPurchase.quantity <= 0 || newPurchase.totalValue <= 0) return;
    
    const purchase = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      ...newPurchase,
      updatedAt: Date.now()
    };
    setPurchases([purchase, ...purchases]);

    // If purchase is linked to a raw material, update its unit cost
    if (newPurchase.rawMaterialId) {
      const unitCost = newPurchase.totalValue / newPurchase.quantity;
      setRawMaterials(rawMaterials.map(m => {
        if (m.id === newPurchase.rawMaterialId) {
          const updatedM = { ...m, unitCost, updatedAt: Date.now() };
          return updatedM;
        }
        return m;
      }));
      addActivity('system', 'Custo Atualizado', `Custo do insumo ${newPurchase.itemName} atualizado via compra.`);
    }

    addActivity('system', 'Nova Compra', `Compra de ${newPurchase.itemName} registrada.`);
    setNewPurchase({ itemName: '', quantity: 0, totalValue: 0, rawMaterialId: '' });
    setShowPurchaseForm(false);
  };

  const handleAddExpense = () => {
    if (!newExpense.description || newExpense.amount <= 0) return;
    const expense = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      ...newExpense,
      updatedAt: Date.now()
    };
    setExpenses([expense, ...expenses]);
    addActivity('system', 'Nova Despesa', `Despesa ${newExpense.description} registrada.`);
    setNewExpense({ description: '', amount: 0, category: 'Outros' });
    setShowExpenseForm(false);
  };

  const handleAddMaterial = () => {
    if (!newMaterial.name || newMaterial.unitCost <= 0) return;
    const material = {
      id: crypto.randomUUID(),
      userId: currentUser?.id,
      userName: currentUser?.name,
      ...newMaterial,
      updatedAt: Date.now()
    };
    setRawMaterials([...rawMaterials, material]);
    setNewMaterial({ name: '', unitCost: 0, unit: 'g' });
    setShowMaterialForm(false);
  };

  const updateRecipe = (productId: string, rawMaterialId: string, quantity: number) => {
    const existingRecipe = productRecipes.find(r => r.productId === productId);
    let newRecipes = [];
    
    let targetRecipe: any = null;
    if (existingRecipe) {
      const existingIngredient = existingRecipe.ingredients.find((i: any) => i.rawMaterialId === rawMaterialId);
      let newIngredients = [];
      
      if (quantity === 0) {
        newIngredients = existingRecipe.ingredients.filter((i: any) => i.rawMaterialId !== rawMaterialId);
      } else if (existingIngredient) {
        newIngredients = existingRecipe.ingredients.map((i: any) => i.rawMaterialId === rawMaterialId ? { ...i, quantity } : i);
      } else {
        newIngredients = [...existingRecipe.ingredients, { rawMaterialId, quantity }];
      }
      
      targetRecipe = { ...existingRecipe, ingredients: newIngredients, updatedAt: Date.now() };
      newRecipes = productRecipes.map(r => r.productId === productId ? targetRecipe : r);
    } else {
      if (quantity > 0) {
        targetRecipe = { id: crypto.randomUUID(), productId, ingredients: [{ rawMaterialId, quantity }], updatedAt: Date.now() };
        newRecipes = [...productRecipes, targetRecipe];
      } else {
        newRecipes = productRecipes;
      }
    }
    setProductRecipes(newRecipes);
  };

  const COLORS = ['#5d5dff', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  const chartData = useMemo(() => [
    { name: 'Receitas', value: totalRevenues },
    { name: 'Compras', value: totalPurchases },
    { name: 'Despesas', value: totalExpenses }
  ], [totalRevenues, totalPurchases, totalExpenses]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center gap-6">
        <div className="flex md:flex-wrap overflow-x-auto no-scrollbar justify-start md:justify-center gap-2 bg-[#FFDE2E] p-3 rounded-2xl md:rounded-[2.5rem] w-full max-w-4xl px-4 md:px-2 snap-x touch-pan-x scroll-smooth border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          {[
            { id: 'overview', label: 'Visão Geral', icon: TrendingUp },
            { id: 'revenues', label: 'Receitas', icon: ArrowUpCircle },
            { id: 'purchases', label: 'Compras', icon: ShoppingCart },
            { id: 'expenses', label: 'Despesas', icon: ArrowDownCircle },
            { id: 'materials', label: 'Insumos', icon: Package },
            { id: 'costs', label: 'Custos/Lucro', icon: Target }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 md:px-6 py-3 rounded-xl md:rounded-2xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all flex items-center gap-2 shrink-0 snap-center border-2 border-transparent ${activeTab === t.id ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)] scale-105' : 'text-black opacity-40 hover:opacity-100 hover:bg-black/5 hover:border-black/10'}`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <div className="flex bg-white p-1 rounded-xl border-4 border-black w-full max-w-[280px] justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            {[
              { id: 'day', label: 'Dia' },
              { id: 'month', label: 'Mês' },
              { id: 'year', label: 'Ano' }
            ].map(type => (
              <button
                key={type.id}
                onClick={() => setFilterType(type.id as any)}
                className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterType === type.id ? 'bg-black text-white' : 'text-black opacity-40 hover:opacity-100 hover:bg-zinc-50'}`}
              >
                {type.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 bg-white px-6 py-3 rounded-2xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] group transition-all">
            <Calendar size={16} className="text-black group-hover:scale-110 transition-transform" />
            {filterType === 'day' && (
              <input 
                type="date" 
                value={selectedDate} 
                onChange={(e) => setSelectedDate(e.target.value)}
                className="text-xs font-black uppercase tracking-widest outline-none bg-transparent text-black"
              />
            )}
            {filterType === 'month' && (
              <input 
                type="month" 
                value={selectedDate.substring(0, 7)} 
                onChange={(e) => setSelectedDate(e.target.value + '-01')}
                className="text-xs font-black uppercase tracking-widest outline-none bg-transparent text-black"
              />
            )}
            {filterType === 'year' && (
              <input 
                type="number" 
                min="2000" 
                max="2100"
                value={selectedDate.substring(0, 4)} 
                onChange={(e) => setSelectedDate(e.target.value + '-01-01')}
                className="text-xs font-black uppercase tracking-widest outline-none bg-transparent text-black w-20"
              />
            )}
          </div>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Receita Confirmada</p>
              <p className="text-2xl font-black text-emerald-600 tracking-tighter">R$ {totalRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
              <p className="text-[9px] font-black text-black opacity-50 mt-2">Pendente: R$ {pendingRevenues.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Compras</p>
              <p className="text-2xl font-black text-orange-600 tracking-tighter">R$ {totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Despesas</p>
              <p className="text-2xl font-black text-red-600 tracking-tighter">R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
            </div>
            <div className="bg-white p-6 rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mb-1">Lucro Líquido</p>
              <p className={`text-2xl font-black tracking-tighter ${netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                R$ {netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] min-h-[350px]">
              <h4 className="text-[10px] font-black uppercase text-black opacity-40 mb-6 tracking-widest">Distribuição Financeira</h4>
              <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '1rem', border: '2px solid #000', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', color: '#000' }}
                      itemStyle={{ color: '#000' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-full">
              <h4 className="text-[10px] font-black uppercase text-black opacity-40 mb-6 tracking-widest">
                Atividade Recente ({filterType === 'day' ? selectedDate : filterType === 'month' ? selectedDate.substring(0, 7) : selectedDate.substring(0, 4)})
              </h4>
              <div className="space-y-4">
                {[...filteredPurchases, ...filteredExpenses].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border-2 border-black">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl border-2 border-black ${(item as any).itemName ? 'bg-orange-100 text-orange-600' : 'bg-red-100 text-red-600'}`}>
                        {(item as any).itemName ? <ShoppingCart size={16} /> : <ArrowDownCircle size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-black">{(item as any).itemName || (item as any).description}</p>
                        <p className="text-[10px] font-black text-black opacity-40 uppercase">{new Date(item.date).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                    <p className={`text-xs font-black ${(item as any).itemName ? 'text-orange-600' : 'text-red-600'}`}>
                      R$ {((item as any).totalValue || (item as any).amount).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'revenues' && (
        <div className="bg-white rounded-[2rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden text-black">
          <div className="p-6 border-b-4 border-black flex flex-col md:flex-row justify-between items-center bg-[#FFDE2E]/10 gap-4">
            <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
              Histórico de Receitas ({filterType === 'day' ? selectedDate : filterType === 'month' ? selectedDate.substring(0, 7) : selectedDate.substring(0, 4)})
            </h4>
            <div className="flex flex-wrap gap-2 justify-center">
               <span className="bg-emerald-100 text-emerald-700 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase border-2 border-emerald-200">CONFIRMADO: R$ {totalRevenues.toFixed(2)}</span>
               <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase border-2 border-orange-200">PENDENTE: R$ {pendingRevenues.toFixed(2)}</span>
            </div>
          </div>
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-zinc-50 border-b-4 border-black text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">ID Pedido</th>
                  <th className="px-6 py-4">Método</th>
                  <th className="px-6 py-4">Valor</th>
                  <th className="px-6 py-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y-2 divide-black/10">
                {filteredRevenues.length > 0 ? filteredRevenues.map(r => (
                  <tr key={r.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 text-xs font-black text-black opacity-40">{new Date(r.date).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-xs font-black text-blue-600 uppercase">#{r.saleId.substring(0, 8)}</td>
                    <td className="px-6 py-4 text-[10px] font-black text-black uppercase italic">
                      <div className="flex items-center gap-2">
                        {r.paymentMethod && <span className="text-sm shrink-0">{paymentIcons[r.paymentMethod] || '📦'}</span>}
                        {r.paymentMethod || '---'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-black text-black">R$ {r.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border-2 ${
                        r.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        r.status === 'cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-orange-100 text-orange-700 border-orange-200'
                      }`}>
                        {r.status}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-20 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma receita para este mês</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y-2 divide-black/10">
             {filteredRevenues.length > 0 ? filteredRevenues.map(r => (
               <div key={r.id} className="p-4 space-y-3 hover:bg-zinc-50">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Data/Hora</p>
                     <p className="text-xs font-black text-black">{new Date(r.date).toLocaleString('pt-BR')}</p>
                   </div>
                   <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border-2 ${
                        r.status === 'confirmado' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        r.status === 'cancelado' ? 'bg-red-100 text-red-700 border-red-200' :
                        'bg-orange-100 text-orange-700 border-orange-200'
                      }`}>
                        {r.status}
                   </span>
                 </div>
                 <div className="flex justify-between items-end">
                   <div>
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">ID Pedido / Método</p>
                     <p className="text-xs font-black text-blue-600">#{r.saleId.substring(0, 8)} <span className="text-[9px] text-black opacity-40 italic">({paymentIcons[r.paymentMethod] || '📦'} {r.paymentMethod || '---'})</span></p>
                   </div>
                   <div className="text-right">
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Valor</p>
                     <p className="text-sm font-black text-black">R$ {r.amount.toFixed(2)}</p>
                   </div>
                 </div>
               </div>
             )) : (
               <div className="p-10 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma receita para este período</div>
             )}
          </div>
        </div>
      )}

      {activeTab === 'purchases' && (
        <div className="space-y-6">
          {canEdit && (
            <button 
              onClick={() => setShowPurchaseForm(true)}
              className="bg-orange-500 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 border-4 border-black"
            >
              <Plus size={18} /> Registrar Compra
            </button>
          )}

          <AnimatePresence>
            {showPurchaseForm && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-4 gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Vincular Insumo (Opcional)</label>
                  <select 
                    className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-orange-200 font-black text-xs uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                    value={newPurchase.rawMaterialId}
                    onChange={e => {
                      const material = rawMaterials.find(m => m.id === e.target.value);
                      setNewPurchase({
                        ...newPurchase, 
                        rawMaterialId: e.target.value,
                        itemName: material ? material.name : newPurchase.itemName
                      });
                    }}
                  >
                    <option value="" className="bg-white">Nenhum (Item Avulso)</option>
                    {rawMaterials.map(m => (
                      <option key={m.id} value={m.id} className="bg-white">{m.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Item / Matéria-Prima</label>
                  <input className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-orange-200 font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20" value={newPurchase.itemName ?? ''} onChange={e => setNewPurchase({...newPurchase, itemName: e.target.value})} placeholder="EX: FILAMENTO PLA" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Quantidade</label>
                  <input type="number" className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-orange-200 font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newPurchase.quantity ?? 0} onChange={e => setNewPurchase({...newPurchase, quantity: parseFloat(e.target.value)})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Valor Total</label>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-orange-200 font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newPurchase.totalValue ?? 0} onChange={e => setNewPurchase({...newPurchase, totalValue: parseFloat(e.target.value)})} />
                    <button onClick={handleAddPurchase} className="bg-emerald-500 text-white p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Check size={20} /></button>
                    <button onClick={() => setShowPurchaseForm(false)} className="bg-zinc-100 text-black p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><X size={20} /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-[2rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-4 border-black flex flex-col md:flex-row justify-between items-center bg-orange-500/10 gap-4">
              <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                Histórico de Compras ({filterType === 'day' ? selectedDate : filterType === 'month' ? selectedDate.substring(0, 7) : selectedDate.substring(0, 4)})
              </h4>
              <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase border-2 border-orange-200">TOTAL: R$ {totalPurchases.toFixed(2)}</span>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b-4 border-black text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4 text-center">Insumo</th>
                    <th className="px-6 py-4">Quantidade</th>
                    <th className="px-6 py-4">Valor Total</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {filteredPurchases.length > 0 ? filteredPurchases.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-black opacity-40">{new Date(p.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-black">{p.itemName}</td>
                      <td className="px-6 py-4 text-center">
                        {p.rawMaterialId ? (
                           <span className="text-[8px] font-black uppercase bg-blue-100 text-blue-700 px-2 py-1 rounded border-2 border-blue-200">VINCULADO</span>
                        ) : (
                           <span className="text-[8px] font-black uppercase bg-zinc-100 text-black opacity-40 px-2 py-1 rounded border-2 border-zinc-200">AVULSO</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs font-black text-black opacity-60">{p.quantity}</td>
                      <td className="px-6 py-4 text-xs font-black text-orange-600">R$ {p.totalValue.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        {canEdit && (
                          <button onClick={() => {
                            setPurchases(purchases.filter(x => x.id !== p.id));
                          }} className="text-black opacity-20 hover:text-red-600 transition-colors hover:scale-110"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6} className="px-6 py-20 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma compra para este mês</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y-2 divide-black/10">
               {filteredPurchases.length > 0 ? filteredPurchases.map(p => (
                 <div key={p.id} className="p-4 space-y-3 hover:bg-zinc-50 transition-colors">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Data</p>
                       <p className="text-xs font-black text-black">{new Date(p.date).toLocaleDateString('pt-BR')}</p>
                     </div>
                     {p.rawMaterialId ? (
                        <span className="text-[7px] font-black uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded border-2 border-blue-200">VINCULADO</span>
                     ) : (
                        <span className="text-[7px] font-black uppercase bg-zinc-100 text-black opacity-40 px-1.5 py-0.5 rounded border-2 border-zinc-200">AVULSO</span>
                     )}
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Item</p>
                     <p className="text-xs font-black uppercase text-black">{p.itemName}</p>
                   </div>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Qtd x Valor</p>
                       <p className="text-xs font-black text-black/60">{p.quantity} un - <span className="text-orange-600 font-black">R$ {p.totalValue.toFixed(2)}</span></p>
                     </div>
                     <button onClick={() => {
                       setPurchases(purchases.filter(x => x.id !== p.id));
                     }} className="p-2 text-black opacity-20 hover:text-red-600 bg-zinc-100 rounded-lg border-2 border-black/10 hover:scale-110 transition-all">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               )) : (
                 <div className="p-10 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma compra para este período</div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div className="space-y-6">
          {canEdit && (
            <button 
              onClick={() => setShowExpenseForm(true)}
              className="bg-red-500 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 border-4 border-black"
            >
              <Plus size={18} /> Registrar Despesa
            </button>
          )}

          <AnimatePresence>
            {showExpenseForm && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-red-500" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Descrição</label>
                  <input className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-red-100 font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20" value={newExpense.description ?? ''} onChange={e => setNewExpense({...newExpense, description: e.target.value})} placeholder="EX: ALUGUEL, LUZ, ETC." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Categoria</label>
                  <select className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-red-100 font-black text-xs uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newExpense.category ?? 'Outros'} onChange={e => setNewExpense({...newExpense, category: e.target.value})}>
                    <option className="bg-white">Fixa</option>
                    <option className="bg-white">Variável</option>
                    <option className="bg-white">Impostos</option>
                    <option className="bg-white">Outros</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Valor</label>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-red-100 font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newExpense.amount ?? 0} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value)})} />
                    <button onClick={handleAddExpense} className="bg-red-500 text-white p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Check size={20} /></button>
                    <button onClick={() => setShowExpenseForm(false)} className="bg-zinc-100 text-black p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><X size={20} /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-[2rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="p-6 border-b-4 border-black flex flex-col md:flex-row justify-between items-center bg-red-500/10 gap-4 text-black">
              <h4 className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                Histórico de Despesas ({filterType === 'day' ? selectedDate : filterType === 'month' ? selectedDate.substring(0, 7) : selectedDate.substring(0, 4)})
              </h4>
              <span className="bg-red-100 text-red-700 text-[9px] font-black px-3 py-1.5 rounded-lg uppercase border-2 border-red-200">TOTAL: R$ {totalExpenses.toFixed(2)}</span>
            </div>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b-4 border-black text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                    <th className="px-6 py-4">Data</th>
                    <th className="px-6 py-4">Descrição</th>
                    <th className="px-6 py-4">Categoria</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10">
                  {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
                    <tr key={e.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black text-black opacity-40">{new Date(e.date).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 text-xs font-black uppercase text-black">{e.description}</td>
                      <td className="px-6 py-4"><span className="text-[8px] font-black uppercase bg-zinc-100 text-black opacity-60 px-2 py-1 rounded border-2 border-zinc-200">{e.category}</span></td>
                      <td className="px-6 py-4 text-xs font-black text-red-600">R$ {e.amount.toFixed(2)}</td>
                      <td className="px-6 py-4 text-right">
                        {canEdit && (
                          <button onClick={() => {
                            setExpenses(expenses.filter(x => x.id !== e.id));
                          }} className="text-black opacity-20 hover:text-red-600 transition-all hover:scale-110"><Trash2 size={16} /></button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-20 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma despesa para este mês</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y-2 divide-black/10">
               {filteredExpenses.length > 0 ? filteredExpenses.map(e => (
                 <div key={e.id} className="p-4 space-y-3 hover:bg-zinc-50 transition-colors">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Data</p>
                       <p className="text-xs font-black text-black">{new Date(e.date).toLocaleDateString('pt-BR')}</p>
                     </div>
                     <span className="text-[7px] font-black uppercase bg-zinc-100 text-black opacity-60 px-1.5 py-0.5 rounded border-2 border-zinc-200">{e.category}</span>
                   </div>
                   <div>
                     <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Descrição</p>
                     <p className="text-xs font-black uppercase text-black">{e.description}</p>
                   </div>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Valor</p>
                       <p className="text-sm font-black text-red-600">R$ {e.amount.toFixed(2)}</p>
                     </div>
                     <button onClick={() => {
                       setExpenses(expenses.filter(x => x.id !== e.id));
                     }} className="p-2 text-black opacity-20 hover:text-red-600 bg-zinc-100 rounded-lg border-2 border-black/10 hover:scale-110 transition-all">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               )) : (
                 <div className="p-10 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhuma despesa para este período</div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="space-y-6">
          {canEdit && (
            <button 
              onClick={() => setShowMaterialForm(true)}
              className="bg-indigo-500 text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3 border-4 border-black"
            >
              <Plus size={18} /> Cadastrar Insumo (Matéria-prima)
            </button>
          )}

          <AnimatePresence>
            {showMaterialForm && (
              <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="bg-white p-8 rounded-[2rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] grid grid-cols-1 md:grid-cols-3 gap-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500" />
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Nome do Insumo</label>
                  <input className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-indigo-100 font-black text-black uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] placeholder:text-black/20" value={newMaterial.name ?? ''} onChange={e => setNewMaterial({...newMaterial, name: e.target.value})} placeholder="EX: FILAMENTO PLA, RESINA..." />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Unidade</label>
                  <select className="w-full p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-indigo-100 font-black text-xs uppercase text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newMaterial.unit ?? 'g'} onChange={e => setNewMaterial({...newMaterial, unit: e.target.value as any})}>
                    <option value="g" className="bg-white">Grama (g)</option>
                    <option value="kg" className="bg-white">Quilo (kg)</option>
                    <option value="ml" className="bg-white">Mililitro (ml)</option>
                    <option value="l" className="bg-white">Litro (l)</option>
                    <option value="un" className="bg-white">Unidade (un)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Custo p/ Unidade</label>
                  <div className="flex gap-2">
                    <input type="number" className="flex-1 p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-indigo-100 font-black text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]" value={newMaterial.unitCost ?? 0} onChange={e => setNewMaterial({...newMaterial, unitCost: parseFloat(e.target.value)})} />
                    <button onClick={handleAddMaterial} className="bg-indigo-500 text-white p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><Check size={20} /></button>
                    <button onClick={() => setShowMaterialForm(false)} className="bg-zinc-100 text-black p-4 rounded-xl border-2 border-black hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"><X size={20} /></button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-[2rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-zinc-50 border-b-4 border-black text-[10px] font-black text-black opacity-40 uppercase tracking-widest">
                    <th className="px-6 py-4">Insumo</th>
                    <th className="px-6 py-4">Unidade</th>
                    <th className="px-6 py-4">Custo Unitário</th>
                    <th className="px-6 py-4 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-black/10 text-black">
                  {rawMaterials.length > 0 ? rawMaterials.map(m => (
                    <tr key={m.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-6 py-4 text-xs font-black uppercase text-black">{m.name}</td>
                      <td className="px-6 py-4 text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{m.unit}</td>
                      <td className="px-6 py-4 text-xs font-black text-indigo-600 font-mono">R$ {m.unitCost.toFixed(4)}</td>
                        <td className="px-6 py-4 text-right">
                          {canEdit && (
                            <button onClick={() => {
                              setRawMaterials(rawMaterials.filter(x => x.id !== m.id));
                            }} className="text-black opacity-20 hover:text-red-600 transition-all hover:scale-110"><Trash2 size={16} /></button>
                          )}
                        </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={4} className="px-6 py-20 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhum insumo cadastrado</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y-2 divide-black/10">
               {rawMaterials.length > 0 ? rawMaterials.map(m => (
                 <div key={m.id} className="p-4 space-y-3 hover:bg-zinc-50 transition-colors">
                   <div className="flex justify-between items-start">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Insumo</p>
                       <p className="text-xs font-black uppercase text-black">{m.name}</p>
                     </div>
                     <span className="text-[8px] font-black uppercase bg-zinc-100 text-black opacity-60 px-2 py-1 rounded border-2 border-zinc-200">{m.unit}</span>
                   </div>
                   <div className="flex justify-between items-end">
                     <div>
                       <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest leading-none mb-1">Custo Unit.</p>
                       <p className="text-xs font-black text-indigo-600 font-mono">R$ {m.unitCost.toFixed(4)}</p>
                     </div>
                     <button onClick={() => {
                       setRawMaterials(rawMaterials.filter(x => x.id !== m.id));
                     }} className="p-2 text-black opacity-20 hover:text-red-600 bg-zinc-100 rounded-lg border-2 border-black/10 hover:scale-110 transition-all">
                       <Trash2 size={16} />
                     </button>
                   </div>
                 </div>
               )) : (
                 <div className="p-10 text-center text-black opacity-20 italic text-xs font-black uppercase">Nenhum insumo cadastrado</div>
               )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'costs' && (
        <div className="space-y-6">
           <div className="bg-white p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
             <div className="flex justify-between items-center mb-8 pb-4 border-b-2 border-black/5">
               <h4 className="text-[10px] font-black uppercase text-black opacity-40 tracking-widest">Lucratividade e Receitas (Ficha Técnica)</h4>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {products.map(p => {
                 const recipe = productRecipes.find(r => r.productId === p.id);
                 const isEditing = editingRecipeProductId === p.id;
                 
                 let calculatedCost = 0;
                 if (recipe) {
                   calculatedCost = recipe.ingredients.reduce((acc: number, ing: any) => {
                     const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                     return acc + (material ? material.unitCost * ing.quantity : 0);
                   }, 0);
                 } else {
                   calculatedCost = p.costPrice || 0;
                 }
                 const profit = p.price - calculatedCost;
                 const margin = p.price > 0 ? (profit / p.price) * 100 : 0;

                 return (
                   <div key={p.id} className={`p-8 rounded-[2.5rem] border-4 transition-all shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] group ${isEditing ? 'bg-[#FFDE2E]/10 border-black ring-4 ring-black/5' : 'bg-white border-black'}`}>
                     <div className="flex justify-between items-start mb-6">
                        <div className="min-w-0">
                          <p className="font-black text-black uppercase text-sm truncate">{p.name}</p>
                          <p className="text-[10px] font-black text-black opacity-40 mt-1 uppercase">Preço: R$ {p.price.toFixed(2)}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[10px] font-black px-3 py-1.5 rounded-lg border-2 ${margin > 30 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                            {margin.toFixed(1)}%
                          </span>
                          {canEdit && (
                            <button 
                              onClick={() => setEditingRecipeProductId(isEditing ? null : p.id)}
                              className="text-[9px] font-black p-1 text-blue-600 uppercase tracking-widest hover:scale-105 transition-all"
                            >
                              {isEditing ? 'Fechar [X]' : 'Ficha Técnica'}
                            </button>
                          )}
                        </div>
                     </div>

                     {isEditing ? (
                       <div className="space-y-4 pt-6 border-t-2 border-black/5">
                         <p className="text-[9px] font-black text-black opacity-40 uppercase tracking-widest mb-4">Configuração da Receita</p>
                         <div className="space-y-3 max-h-64 overflow-y-auto pr-2 no-scrollbar font-black uppercase">
                           {rawMaterials.map(m => {
                             const ing = recipe?.ingredients.find((i: any) => i.rawMaterialId === m.id);
                             const qty = ing?.quantity || 0;
                             
                             return (
                               <div key={m.id} className="flex items-center justify-between gap-3 p-3 bg-zinc-50 rounded-2xl border-2 border-black/10">
                                 <span className="text-[10px] font-black text-black opacity-60 uppercase truncate flex-1">{m.name}</span>
                                 <div className="flex items-center gap-1.5">
                                   <input 
                                     type="number" 
                                     value={qty ?? 0} 
                                     onChange={(e) => updateRecipe(p.id, m.id, parseFloat(e.target.value) || 0)}
                                     className="w-16 p-2 text-[10px] font-black text-right border-b-2 border-black/10 outline-none focus:border-blue-500 bg-white rounded-lg text-black"
                                   />
                                   <span className="text-[9px] font-black text-black opacity-40 uppercase w-4">{m.unit}</span>
                                 </div>
                               </div>
                             );
                           })}
                         </div>
                       </div>
                     ) : (
                       <div className="grid grid-cols-2 gap-4 border-t-2 border-black/5 pt-6">
                          <div className="bg-zinc-50 p-3 rounded-2xl border-2 border-black/10">
                             <p className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest mb-1 leading-none">Custo Base</p>
                             <p className="text-xs font-black text-black mb-0 leading-none">R$ {calculatedCost.toFixed(2)}</p>
                          </div>
                          <div className="bg-blue-50 p-3 rounded-2xl border-2 border-blue-200">
                             <p className="text-[8px] font-black text-blue-400 uppercase tracking-widest mb-1 leading-none">Margem Unit.</p>
                             <p className="text-xs font-black text-blue-600 mb-0 leading-none">R$ {profit.toFixed(2)}</p>
                          </div>
                       </div>
                     )}
                   </div>
                 );
               })}
             </div>
           </div>
        </div>
      )}
    </div>
  );
}
