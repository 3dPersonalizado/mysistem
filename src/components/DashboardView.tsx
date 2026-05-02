import { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Package, 
  ShoppingCart, 
  DollarSign,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  PieChart as PieChartIcon,
  ChevronRight,
  Boxes,
  BadgeDollarSign,
  AlertTriangle,
  User,
  Zap,
  Star,
  Truck
} from 'lucide-react';
import { motion } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface Sale {
  id: string;
  date: string | number;
  total: number;
  totalProfit?: number;
  items: any[];
  paymentMethod: string;
  customerName?: string;
  customerId?: string;
  status?: string;
  notes?: string;
  soldByUserId?: string;
}

interface Product {
  id: string;
  name: string;
  stock: number;
  imageUrl?: string;
}

interface Customer {
  id: string;
  name: string;
  whatsapp?: string;
  email?: string;
  address?: string;
}

interface DashboardViewProps {
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  expenses: any[];
  purchases: any[];
  revenues: any[];
  paymentMethods: string[];
  paymentIcons: Record<string, string>;
  goldCustomerIds?: Set<string>;
  onGoToProduct: (id: string) => void;
  onGoToSale?: (sale: Sale) => void;
  onGoToCustomer?: (id: string) => void;
  currentUser: any | null;
}

export function DashboardView({ 
  sales, 
  products, 
  customers,
  expenses, 
  purchases, 
  revenues, 
  paymentMethods,
  paymentIcons,
  goldCustomerIds,
  onGoToProduct,
  onGoToSale,
  onGoToCustomer,
  currentUser
}: DashboardViewProps) {
  const isAdmin = useMemo(() => {
    return currentUser?.id === 'admin' || currentUser?.roleId === 'role-gerente';
  }, [currentUser]);

  const filteredSalesData = useMemo(() => {
    if (isAdmin) return sales;
    return sales.filter(s => s.soldByUserId === currentUser?.id);
  }, [sales, isAdmin, currentUser]);

  const filteredRevenues = useMemo(() => {
    if (isAdmin) return revenues;
    return revenues.filter(r => r.userId === currentUser?.id);
  }, [revenues, isAdmin, currentUser]);

  const filteredExpenses = useMemo(() => {
    if (isAdmin) return expenses;
    return expenses.filter(e => e.userId === currentUser?.id);
  }, [expenses, isAdmin, currentUser]);

  const filteredPurchases = useMemo(() => {
    if (isAdmin) return purchases;
    return purchases.filter(p => p.userId === currentUser?.id);
  }, [purchases, isAdmin, currentUser]);

  // Date helpers
  const today = new Date().toISOString().split('T')[0];
  const now = useMemo(() => new Date(), []);
  const last7Days = [...Array(7)].map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split('T')[0];
  }).reverse();

  // 1. Calculations - Daily Indicators
  const yesterday = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }, []);

  const dailySales = useMemo(() => {
    return filteredSalesData.filter(s => {
      const saleDate = typeof s.date === 'number' ? new Date(s.date).toISOString() : s.date;
      return saleDate.startsWith(today);
    });
  }, [filteredSalesData, today]);

  const yesterdaySales = useMemo(() => {
    return filteredSalesData.filter(s => {
      const saleDate = typeof s.date === 'number' ? new Date(s.date).toISOString() : s.date;
      return saleDate.startsWith(yesterday);
    });
  }, [filteredSalesData, yesterday]);

  const calculateDayStats = (salesList: Sale[]) => {
    const total = salesList.reduce((acc, s) => s.status !== 'cancelado' ? acc + s.total : acc, 0);
    const profit = salesList.reduce((acc, s) => s.status !== 'cancelado' ? acc + (s.totalProfit || 0) : acc, 0);
    const count = salesList.filter(s => s.status !== 'cancelado').length;
    const canceledCount = salesList.filter(s => s.status === 'cancelado').length;
    const canceledValue = salesList.filter(s => s.status === 'cancelado').reduce((acc, s) => acc + s.total, 0);
    const ticketMedia = count > 0 ? total / count : 0;
    
    return { total, profit, count, canceledCount, canceledValue, ticketMedia };
  };

  const dayStats = useMemo(() => calculateDayStats(dailySales), [dailySales]);
  const prevDayStats = useMemo(() => calculateDayStats(yesterdaySales), [yesterdaySales]);

  const getComparison = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? { val: '+100%', up: true } : null;
    const diff = ((current - previous) / previous) * 100;
    if (diff === 0) return null;
    return { val: `${diff > 0 ? '+' : ''}${diff.toFixed(0)}%`, up: diff >= 0 };
  };

  const statsComparison = useMemo(() => ({
    sales: getComparison(dayStats.total, prevDayStats.total),
    profit: getComparison(dayStats.profit, prevDayStats.profit),
    canceled: getComparison(dayStats.canceledValue, prevDayStats.canceledValue),
    ticket: getComparison(dayStats.ticketMedia, prevDayStats.ticketMedia),
  }), [dayStats, prevDayStats]);

  // Conversion calculations
  const totalAttempts = dailySales.length;
  const successfulOrders = dayStats.count;
  const conversionRate = totalAttempts > 0 ? (successfulOrders / totalAttempts) * 100 : 0;

  // 2. Financial Summary (Overall)
  const totalPdvSales = useMemo(() => filteredSalesData.reduce((acc, s) => s.status !== 'cancelado' ? acc + s.total : acc, 0), [filteredSalesData]);
  const totalPdvProfit = useMemo(() => filteredSalesData.reduce((acc, s) => s.status !== 'cancelado' ? acc + (s.totalProfit || 0) : acc, 0), [filteredSalesData]);
  const totalFinanceRevenues = useMemo(() => filteredRevenues.reduce((acc, r) => r.status === 'confirmado' ? acc + r.amount : acc, 0), [filteredRevenues]);
  const totalIncome = totalPdvSales + totalFinanceRevenues;

  const totalFinanceExpenses = useMemo(() => filteredExpenses.reduce((acc, e) => acc + e.amount, 0), [filteredExpenses]);
  const totalFinancePurchases = useMemo(() => filteredPurchases.reduce((acc, p) => acc + p.totalValue, 0), [filteredPurchases]);
  const totalOutgo = totalFinanceExpenses + totalFinancePurchases;

  // Real profit from PDV + Extra Revenues - Other Expenses
  const pdvNetProfit = totalPdvProfit + totalFinanceRevenues - totalOutgo;
  const profitMargin = totalIncome > 0 ? (pdvNetProfit / totalIncome) * 100 : 0;

  // 3. Payment Methods Distribution
  const paymentData = useMemo(() => {
    const totals: Record<string, number> = {};
    filteredSalesData.forEach(s => {
      if (s.status !== 'cancelado') {
        const method = (s.paymentMethod || 'NÃO INFORMADO').toUpperCase();
        totals[method] = (totals[method] || 0) + s.total;
      }
    });

    const data = Object.entries(totals).map(([name, value]) => ({
      name,
      value,
      percentage: totalPdvSales > 0 ? (value / totalPdvSales) * 100 : 0
    })).sort((a, b) => b.value - a.value);

    return data;
  }, [filteredSalesData, totalPdvSales]);

  // 4. Charts Data - Last 7 Days
  const chartData7Days = useMemo(() => {
    return last7Days.map(date => {
      const daySales = filteredSalesData.filter(s => {
        const saleDate = typeof s.date === 'number' ? new Date(s.date).toISOString() : s.date;
        return saleDate.startsWith(date) && s.status !== 'cancelado';
      });
      const total = daySales.reduce((acc, s) => acc + s.total, 0);
      const profit = daySales.reduce((acc, s) => acc + (s.totalProfit || 0), 0);
      const count = daySales.length;
      const formattedDate = new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      return { date: formattedDate, total, profit, count };
    });
  }, [filteredSalesData, last7Days]);

  // 5. Monthly Comparison (Last 6 Months)
  const monthlyData = useMemo(() => {
    const months: Record<string, number> = {};
    filteredSalesData.forEach(s => {
      if (s.status !== 'cancelado') {
        const saleDateString = typeof s.date === 'number' ? new Date(s.date).toISOString() : s.date;
        const month = saleDateString.substring(0, 7); // YYYY-MM
        months[month] = (months[month] || 0) + s.total;
      }
    });

    return Object.entries(months)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, total]) => {
        const [year, m] = month.split('-');
        const date = new Date(parseInt(year), parseInt(m) - 1);
        return {
          name: date.toLocaleString('pt-BR', { month: 'short' }).toUpperCase(),
          total
        };
      });
  }, [filteredSalesData]);

    // 6. Smart Alerts with Priorities
  const alerts = useMemo(() => {
    const list: any[] = [];
    const nowTime = now.getTime();

    // 1. Pedidos parados (Priority: Critical if > 48h, Medium if > 24h)
    filteredSalesData.forEach(s => {
      const saleDate = typeof s.date === 'number' ? s.date : new Date(s.date).getTime();
      const diffHours = (nowTime - saleDate) / (1000 * 60 * 60);

      if (s.status !== 'finalizado' && s.status !== 'cancelado' && s.status !== 'entregue') {
         if (diffHours > 48) {
            list.push({
              id: `crit-delay-${s.id}`,
              priority: 1, // Critical
              title: 'Atraso Crítico',
              detail: `${s.customerName || 'Cliente'} - #${s.id.substring(0,6)}`,
              situation: `Parado há ${Math.floor(diffHours)}h`,
              onAction: () => onGoToSale?.(s),
              color: 'bg-red-500/10 text-red-400 border-red-500/20',
              icon: <AlertTriangle size={12} />
            });
         } else if (diffHours > 24) {
            list.push({
              id: `med-delay-${s.id}`,
              priority: 2, // Medium
              title: 'Atenção: Pedido',
              detail: `${s.customerName || 'Cliente'} - #${s.id.substring(0,6)}`,
              situation: `Aguardando há ${Math.floor(diffHours)}h`,
              onAction: () => onGoToSale?.(s),
              color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              icon: <AlertCircle size={12} />
            });
         }
      }
    });

    // 2. Produtos sem estoque (Priority: Critical)
    products.forEach(p => {
      if (p.stock <= 0) {
        list.push({
          id: `crit-stock-${p.id}`,
          priority: 1,
          title: 'Crítico: Sem Estoque',
          detail: p.name,
          situation: `0 unidades restantes`,
          onAction: () => onGoToProduct(p.id),
          color: 'bg-red-500/20 text-red-500 border-red-500/30',
          icon: <Boxes size={12} className="text-red-500" />
        });
      } else if (p.stock < 5) {
        list.push({
          id: `low-stock-${p.id}`,
          priority: 2,
          title: 'Atenção: Estoque Baixo',
          detail: p.name,
          situation: `${p.stock} unidades restantes`,
          onAction: () => onGoToProduct(p.id),
          color: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          icon: <AlertTriangle size={12} className="text-amber-500" />
        });
      }
    });

    // 3. Clientes com dados incompletos (Priority: Light)
    customers.forEach(c => {
      const isIncomplete = !c.whatsapp || (!c.address && !c.email);
      if (isIncomplete) {
        list.push({
          id: `low-cust-${c.id}`,
          priority: 3, // Light
          title: 'Cadastro Incompleto',
          detail: c.name,
          situation: !c.whatsapp ? 'Falta WhatsApp' : 'Falta Endereço',
          onAction: () => onGoToCustomer?.(c.id),
          color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <User size={12} />
        });
      }
    });

    // Sort by priority then limit
    return list.sort((a, b) => a.priority - b.priority).slice(0, 10);
  }, [filteredSalesData, products, customers, now, onGoToSale, onGoToProduct, onGoToCustomer]);

  // Ranking de Clientes (Top 5)
  const topCustomers = useMemo(() => {
    const stats: Record<string, { name: string, total: number, count: number, lastPurchase: number }> = {};
    filteredSalesData.forEach(s => {
      if (s.status !== 'cancelado' && s.customerId) {
        const saleDate = typeof s.date === 'number' ? s.date : new Date(s.date).getTime();
        if (!stats[s.customerId]) {
           const cust = customers.find(c => c.id === s.customerId);
           stats[s.customerId] = { name: cust?.name || 'Cliente', total: 0, count: 0, lastPurchase: 0 };
        }
        stats[s.customerId].total += s.total;
        stats[s.customerId].count += 1;
        if (saleDate > stats[s.customerId].lastPurchase) {
          stats[s.customerId].lastPurchase = saleDate;
        }
      }
    });
    return Object.values(stats)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [filteredSalesData, customers]);

  // 7. Inventory Alerts (used in JSX)
  const lowStock = products.filter(p => p.stock > 0 && p.stock < 5);

  // 8. Recent Sales (used in JSX)
  const recentSales = useMemo(() => {
    return [...filteredSalesData].sort((a, b) => {
      const dateA = typeof a.date === 'number' ? a.date : new Date(a.date).getTime();
      const dateB = typeof b.date === 'number' ? b.date : new Date(b.date).getTime();
      return dateB - dateA;
    }).slice(0, 5);
  }, [filteredSalesData]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* Header Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <KPIItem 
          title="Vendas do Dia" 
          value={`R$ ${dayStats.total.toFixed(2)}`} 
          icon={<DollarSign size={20} />} 
          color="bg-blue-500" 
          trend={`${dayStats.count} pedidos`}
          comparison={statsComparison.sales}
        />
        <KPIItem 
          title="Lucro do Dia" 
          value={`R$ ${dayStats.profit.toFixed(2)}`} 
          icon={<TrendingUp size={20} />} 
          color="bg-emerald-500" 
          trend="Baseado em custos"
          comparison={statsComparison.profit}
        />
        <KPIItem 
          title="Ticket Médio" 
          value={`R$ ${dayStats.ticketMedia.toFixed(2)}`} 
          icon={<BarChart3 size={20} />} 
          color="bg-purple-500" 
          trend="Média por venda"
          comparison={statsComparison.ticket}
        />
        <KPIItem 
          title="Cancelados" 
          value={`R$ ${dayStats.canceledValue.toFixed(2)}`} 
          icon={<XCircle size={20} />} 
          color="bg-red-500" 
          trend={`${dayStats.canceledCount} hoje`}
          comparison={statsComparison.canceled}
        />
        <KPIItem 
          title="Conversão do Dia" 
          value={`${conversionRate.toFixed(1)}%`} 
          icon={<Zap size={20} />} 
          color="bg-amber-500" 
          trend={`${successfulOrders}/${totalAttempts} pedidos`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">

        {/* Main Chart - Sales Last 7 Days */}
        <div className="lg:col-span-2 bg-white p-5 md:p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h4 className="text-xs md:text-sm font-black uppercase tracking-widest text-black">Desempenho Semanal</h4>
              <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Volume de vendas nos últimos 7 dias</p>
            </div>
          </div>

          <div className="h-[250px] md:h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData7Days}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1A1A1A" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1A1A1A" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0EEEB" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '1px solid #E5E1D8', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)', fontSize: '12px', color: '#1A1A1A' }}
                  itemStyle={{ color: '#1A1A1A' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  name="Vendas"
                  stroke="#1A1A1A" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Financial Summary Box */}
        <div className="bg-black text-white p-6 md:p-8 rounded-[2.5rem] shadow-[8px_8px_0px_0px_rgba(93,93,255,0.4)] flex flex-col justify-between relative overflow-hidden min-h-[300px] border-4 border-white/20">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#5d5dff]/20 blur-3xl -mr-32 -mt-32"></div>

          <div className="relative z-10">
            <h4 className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-[#5d5dff] mb-6">Resumo Financeiro</h4>
            <div className="space-y-6">
              <div>
                <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase mb-1">Faturamento Bruto</p>
                <p className="text-2xl md:text-3xl font-black">R$ {totalIncome.toFixed(2)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 py-6 border-y border-white/10">
                <div>
                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase mb-1">Despesas/Compras</p>
                  <p className="text-base md:text-lg font-black text-red-400">R$ {totalOutgo.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase mb-1">Margem Líquida</p>
                  <p className="text-base md:text-lg font-black text-emerald-400">{profitMargin.toFixed(1)}%</p>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <p className="text-[9px] md:text-[10px] font-bold text-zinc-500 uppercase">Lucro Líquido Real</p>
                </div>
                <p className="text-3xl md:text-4xl font-black text-emerald-400">R$ {pdvNetProfit.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 pt-8 flex items-center gap-3">
             <div className={`px-2 md:px-3 py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] font-black uppercase tracking-widest ${pdvNetProfit >= 0 ? 'bg-emerald-500 text-black' : 'bg-red-500 text-white'}`}>
                {pdvNetProfit >= 0 ? 'Saldo Positivo' : 'Saldo Negativo'}
             </div>
             <p className="text-[8px] md:text-[9px] text-zinc-400 font-bold uppercase tracking-widest">Geral do Período</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
        
        {/* Smart Alerts */}
        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              <Zap size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Alertas Ativos</h4>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Monitoramento em Tempo Real</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1 max-h-[400px] md:max-h-none custom-scrollbar">
            {alerts.map((alert) => (
              <button 
                key={alert.id}
                onClick={alert.onAction}
                className={`w-full text-left p-4 rounded-2xl border-2 border-black bg-zinc-50 transition-all hover:scale-[1.02] active:translate-y-0.5 active:translate-x-0.5 flex items-start gap-3 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}
              >
                <div className="shrink-0 mt-0.5">{alert.icon}</div>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex justify-between items-center">
                    <p className="text-[9px] font-black uppercase tracking-widest leading-none text-black">{alert.title}</p>
                    <ChevronRight size={10} className="text-black" />
                  </div>
                  <p className="text-[11px] font-black text-black truncate leading-tight">{alert.detail}</p>
                  <p className="text-[9px] font-bold text-black opacity-60 uppercase tracking-tighter">{alert.situation}</p>
                </div>
              </button>
            ))}
            {alerts.length === 0 && (
               <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
                  <CheckCircle2 size={40} className="mb-4 text-emerald-600" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-black">Sem pendências</p>
               </div>
            )}
          </div>
        </div>

        {/* Top Customers Ranking */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              <Star size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Ranking Cliente Ouro</h4>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Top 5 por Volume de Compras</p>
            </div>
          </div>

          <div className="flex-1 space-y-3">
             {topCustomers.map((cust, idx) => {
               const customerObj = customers.find(c => c.name === cust.name);
               const isGold = customerObj && goldCustomerIds?.has(customerObj.id);
               
               return (
                 <div key={idx} className="p-4 bg-zinc-50 rounded-2xl border-2 border-black group hover:bg-zinc-100 transition-all flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <span className={`text-[10px] font-black italic ${idx === 0 ? 'text-amber-600' : 'text-zinc-400'}`}>0{idx + 1}</span>
                         <p className="text-[10px] font-black text-black uppercase tracking-tighter truncate max-w-[120px]">{cust.name}</p>
                      </div>
                      <p className="text-xs font-black text-black tracking-tighter">R$ {cust.total.toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center justify-between">
                       <div className="flex flex-col gap-0.5">
                          <p className="text-[8px] text-zinc-500 font-bold uppercase">{cust.count} Pedidos</p>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase">Uilt. Compra: {new Date(cust.lastPurchase).toLocaleDateString('pt-BR')}</p>
                       </div>
                       {isGold && (
                          <div className="flex items-center gap-1 px-2 py-0.5 rounded border border-black bg-amber-400 text-black">
                             <Star size={8} fill="currentColor" />
                             <span className="text-[7px] font-black uppercase tracking-widest">Ouro</span>
                          </div>
                       )}
                    </div>
                 </div>
               );
             })}
             {topCustomers.length === 0 && (
               <div className="py-20 text-center opacity-20 italic text-[10px] text-black">Aguardando dados...</div>
             )}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              <PieChartIcon size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Formas de Pagamento</h4>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Distribuição das vendas PDV</p>
            </div>
          </div>

          <div className="space-y-4">
            {paymentData.map((item, idx) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2">
                    <span className="text-sm shrink-0">{paymentIcons[item.name] || (item.name === 'DINHEIRO' ? '💵' : item.name === 'PIX' ? '📲' : item.name.includes('CARTÃO') ? '💳' : '📦')}</span>
                    <span className="text-[10px] font-black text-black uppercase tracking-tight">{item.name}</span>
                  </div>
                  <span className="text-[10px] font-black text-black tracking-tight">R$ {item.value.toFixed(2)}</span>
                </div>
                <div className="h-3 bg-zinc-100 border border-black rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${item.percentage}%` }}
                    className="h-full border-r border-black"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                </div>
                <p className="text-[8px] text-right text-zinc-500 font-bold uppercase">{item.percentage.toFixed(1)}% do total</p>
              </div>
            ))}
            {paymentData.length === 0 && (
              <p className="text-xs text-black italic text-center py-8">Nenhuma venda realizada</p>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-8 rounded-[2.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col h-full">
           <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center">
              <Clock size={20} />
            </div>
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-widest text-black">Últimas Vendas</h4>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-1">Atividade recente do PDV</p>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {recentSales.map((sale) => {
              const statusIcon = 
                sale.status === 'cancelado' ? <XCircle size={10} className="text-red-600" /> : 
                sale.status === 'finalizado' ? <CheckCircle2 size={10} className="text-emerald-600" /> :
                sale.status === 'entregue' ? <CheckCircle2 size={10} className="text-emerald-600" /> :
                <Clock size={10} className="text-zinc-400" />;

              return (
                <button 
                  key={sale.id} 
                  onClick={() => onGoToSale?.(sale)}
                  className="w-full flex items-center justify-between p-4 bg-zinc-50 rounded-2xl group hover:bg-zinc-100 transition-all text-left border border-black/10"
                >
                   <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-white border border-black/20 ${
                        sale.status === 'cancelado' ? 'bg-red-500' : 
                        sale.status === 'finalizado' ? 'bg-emerald-500' :
                        'bg-black'
                      }`}>
                         <ShoppingCart size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                         <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-[10px] font-black text-black uppercase tracking-tighter truncate">
                              {sale.customerName || 'Cliente Balcão'}
                            </p>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase">• #{sale.id.substring(0, 6)}</span>
                         </div>
                         <div className="flex items-center gap-4">
                            <p className="text-[9px] text-zinc-500 font-bold uppercase">
                              {new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className="text-[9px] font-black text-black">R$ {sale.total.toFixed(2)}</p>
                         </div>
                      </div>
                   </div>
                   <div className="flex flex-col items-end gap-1">
                      <div className={`px-2 py-0.5 rounded text-[7px] font-black uppercase tracking-[0.15em] border-2 border-black shadow-[1px_1px_0px_0px_rgba(0,0,0,1)] ${
                        sale.status === 'cancelado' ? 'text-red-600 bg-red-100' : 
                        sale.status === 'finalizado' ? 'text-emerald-600 bg-emerald-100' :
                        'text-indigo-600 bg-indigo-100'
                      }`}>
                        {sale.status === 'cancelado' ? 'Cancelado' : 
                         sale.status === 'finalizado' ? 'Finalizado' :
                         sale.status === 'em_separacao' ? 'Separação' :
                         sale.status === 'embalado' ? 'Embalado' :
                         sale.status === 'enviado' ? 'Enviado' : 'Processando'}
                      </div>
                      <div className="flex items-center gap-1 opacity-50">
                        {statusIcon}
                      </div>
                   </div>
                </button>
              );
            })}
            {recentSales.length === 0 && (
               <p className="text-xs text-zinc-600 italic text-center py-12 uppercase font-black">Nenhuma venda</p>
            )}
          </div>
        </div>
      </div>

      {/* Monthly Chart */}
      <div className="bg-white p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-black opacity-40">Comparativo Mensal</h4>
              <p className="text-xl font-black text-black mt-1">Histórico de Faturamento</p>
            </div>
          </div>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E1D8" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#A1A1A1' }}
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{ fill: '#F5F5F0' }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: '2px solid #000', boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)', fontSize: '10px', color: '#000' }}
                  itemStyle={{ color: '#000' }}
                />
                <Bar 
                  dataKey="total" 
                  radius={[4, 4, 0, 0]} 
                  fill="#000"
                  activeBar={<Cell fill="#5D5DFF" />}
                >
                   {monthlyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === monthlyData.length - 1 ? '#5D5DFF' : '#000'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
      </div>
    </div>
  );
}

export function KPIItem({ title, value, icon, color, trend, comparison }: { title: string, value: string, icon: any, color: string, trend: string, comparison?: { val: string, up: boolean } | null }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex flex-col justify-between group hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all h-full">
      <div className="flex items-center justify-between mb-6">
        <div className={`w-10 h-10 ${color} border-2 border-black rounded-xl flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{title}</p>
        </div>
      </div>
      <div>
        <div className="flex items-end justify-between mb-1">
          <p className="text-xl font-black text-black leading-none">{value}</p>
          {comparison && (
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-black uppercase border border-black/10 ${comparison.up ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {comparison.up ? <TrendingUp size={8} /> : <TrendingDown size={8} />}
              {comparison.val}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
           <CheckCircle2 size={10} className="text-black" />
           <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest truncate">{trend}</p>
        </div>
      </div>
    </div>
  );
}
