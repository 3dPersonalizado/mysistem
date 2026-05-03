/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useMemo, useRef, ChangeEvent, FormEvent, MouseEvent, forwardRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { QRCodeCanvas } from 'qrcode.react';
import { DashboardView } from './components/DashboardView';
import { 
  TrendingUp, BarChart3, Users, LayoutGrid, Store, CreditCard, 
  Package, UserPlus, Handshake, Boxes, Tag, Truck, Calculator, 
  BadgeDollarSign, Plus, Minus, Search, X, ChevronLeft, ArrowLeft, Trash2, Save, 
  ShoppingBag, Pencil, Edit, Image as ImageIcon, Printer, ChevronRight, ChevronDown, 
  Zap, Link, Download, Upload, Database, Loader2, Check, History, Lock, Unlock, 
  Info, Eye, Receipt, User, ScanLine, QrCode, Barcode, ShieldCheck, Star, AlertCircle,
  Clock, Send, CheckCircle2, RefreshCw, RotateCcw, LayoutDashboard, Cake, Play,
  Monitor, Cpu, AlertTriangle, Cloud, CloudOff, Wifi, WifiOff, Smartphone, CheckCircle, MapPin, CheckSquare, FileText, Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './lib/db';
import { APP_VERSION } from './lib/version';
import { uploadToServer } from './lib/utils';
import { 
  salvarDados, 
  carregarDados, 
  STORAGE_KEYS, 
  salvarBackupArquivo, 
  carregarBackupArquivo,
  exportarBackup,
  importarBackup,
  LocalBackup,
  GalleryItem
} from './lib/persistence';
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
  LineChart,
  Line,
  Legend
} from 'recharts';

import { AppUpdater } from './components/AppUpdater';
import { FinanceView } from './components/FinanceView';
import { CustomerExperienceView } from './components/CustomerExperienceView';
import { CatalogView } from './components/CatalogView';
import { ShopkeeperView } from './components/ShopkeeperView';
import { CouponVisualEditor } from './components/CouponVisualEditor';
import { UniversalImageSelector } from './components/UniversalImageSelector';

// --- Types ---
export interface Product {
  id: string;
  name: string;
  price: number; // Varejo
  costPrice?: number;
  stock: number;
  wholesalePrice?: number; // Atacado
  wholesaleMinQty?: number; // Quantidade mínima para atacado
  category?: string;
  categoryId?: string;
  subcategoryId?: string;
  sku?: string; // Código fornecedor
  barcode?: string;
  imageUrl?: string;
  updatedByUserId?: string;
  updatedByUserName?: string;
  showInCatalog?: boolean;
  locationRow?: string;
  locationShelf?: string;
  locationDrawer?: string;
  shopkeeperPrice?: number;
}

export interface Category {
  id: string;
  name: string;
  updatedAt?: number;
}

export interface Subcategory {
  id: string;
  categoryId: string;
  name: string;
  updatedAt?: number;
}

interface Activity {
  id: string;
  type: 'customer' | 'product' | 'sale' | 'system' | 'product_edit' | 'auth' | 'security' | 'ajustes';
  action: string;
  details: string;
  timestamp: string;
  user: string;
  userRole?: string;
  productId?: string;
  productName?: string;
  field?: string;
  oldValue?: any;
  newValue?: any;
}

interface Customer {
  id: string;
  displayId: string;
  name: string;
  email?: string;
  whatsapp?: string;
  phone?: string; // Backward compatibility
  dob?: string;
  taxId?: string; // CPF/CNPJ
  image?: string; // Base64 image
  address?: {
    cep: string;
    street: string;
    number: string;
    neighborhood: string;
    city: string;
    state: string;
    complement?: string;
  };
  debt: number;
  updatedAt?: number;
  createdAt?: number;
  notes?: string;
}

interface DeliveryChannel {
  id: string;
  name: string;
  updatedAt?: number;
}

interface DeliveryMethod {
  id: string;
  name: string;
  isActive: boolean;
  updatedAt?: number;
}

interface PaymentEntry {
  method: string;
  amount: number;
  date: number;
}

interface SaleItem {
  productId: string;
  quantity: number;
  price: number;
  cost: number;
  profit: number;
}

interface SaleReturnItem {
  productId: string;
  quantity: number;
}

interface SaleReturn {
  id: string;
  items: SaleReturnItem[];
  reason: string;
  date: number;
  userId: string;
  userName: string;
}

interface Sale {
  id: string;
  sequentialId?: string; // e.g. "00001"
  items: SaleItem[];
  originalItems?: SaleItem[];
  returns?: SaleReturn[];
  total: number;
  totalCost: number;
  totalProfit: number;
  date: number;
  customerId?: string;
  deliveryChannelId?: string;
  deliveryMethodId?: string;
  cashierSessionId?: string;
  paymentMethod: string; // Keep for backward compatibility (primary or summary)
  payments?: PaymentEntry[];
  trackingCode?: string;
  deliveryMethod?: string;
  receivedAmount?: number;
  change?: number;
  status?: 'pendente' | 'em_separacao' | 'separado' | 'embalado' | 'enviado' | 'em_transporte' | 'entregue' | 'cancelado' | 'falta_confirmada';
  notes?: string;
  soldByUserId?: string;
  soldByUserName?: string;
  separatedByUserId?: string;
  separatedByUserName?: string;
  packedByUserId?: string;
  packedByUserName?: string;
  startedSeparationByUserId?: string;
  startedSeparationByUserName?: string;
  startedSeparationAt?: string;
  separatedByAt?: string;
  packedAt?: string;
  shippedByUserId?: string;
  shippedByUserName?: string;
  shippedAt?: string;
  missingConfirmedByUserId?: string;
  missingConfirmedByUserName?: string;
  youtubeLink?: string;
  separationTimestamp?: string;
  updatedAt?: number;
  greetingConfig?: GreetingCouponConfig;
}

interface Revenue {
  id: string;
  saleId: string;
  amount: number;
  paymentMethod?: string;
  status: 'pendente' | 'confirmado' | 'cancelado';
  date: string;
  updatedAt: number;
  userId?: string;
  userName?: string;
}

interface Purchase {
  id: string;
  date: string;
  itemName: string;
  quantity: number;
  totalValue: number;
  rawMaterialId?: string;
  updatedAt: number;
  userId?: string;
  userName?: string;
}

interface Expense {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  updatedAt: number;
  userId?: string;
  userName?: string;
}

interface RawMaterial {
  id: string;
  name: string;
  unitCost: number;
  unit: 'g' | 'ml' | 'unidade';
  updatedAt: number;
}

interface ProductIngredient {
  rawMaterialId: string;
  quantity: number;
}

interface ProductRecipe {
  id: string;
  productId: string;
  ingredients: ProductIngredient[];
  updatedAt: number;
}

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

interface CouponConfig {
  format: '58mm' | '80mm' | 'a4' | 'a6' | 'custom';
  orientation?: 'portrait' | 'landscape';
  customWidth?: number;
  customHeight?: number;
  printerName?: string;
  profileName?: string;
  outputType: 'impressora' | 'pdf';
  printMode: 'browser' | 'auto';
  headerMessage: string;
  footerMessage: string;
  defaultMessage: string;
  // Visibilidade Empresa
  showLogo: boolean;
  showCompanyName: boolean;
  showCompanyId: boolean;
  showCompanyAddress: boolean;
  showIdNumber: boolean; 
  showAddress: boolean;
  // Visibilidade Cliente
  showCustomer: boolean;
  showCustomerData: boolean; // Se true, exibe todos os dados disponíveis (Nome, Doc, Fone, Endereço)
  // Visibilidade Itens
  showItemName: boolean;
  showItemQty: boolean;
  showItemPrice: boolean;
  showItemUnitPrice: boolean;
  showItemSubtotal: boolean;
  // Visibilidade Totais
  showDiscounts: boolean;
  showDiscount: boolean;
  showFinalTotal: boolean;
  // Visibilidade Pagamento
  showPaymentMethod: boolean;
  showChange: boolean;
  // Extras
  showOrderNumber: boolean;
  showDateTime: boolean;
  showOrderQrCode: boolean;
  showPrice: boolean;
  qrCodeDesign?: QRCodeDesignConfig;
}

// --- Helpers ---
const maskCEP = (value: string) => {
  return value.replace(/\D/g, '').replace(/^(\d{5})(\d)/, '$1-$2').substring(0, 9);
};

const maskPhone = (value: string) => {
  const nums = value.replace(/\D/g, '');
  if (nums.length <= 10) return nums.replace(/^(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  return nums.replace(/^(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3').substring(0, 15);
};

const maskCPF_CNPJ = (value: string) => {
  const nums = value.replace(/\D/g, '');
  if (nums.length <= 11) {
    return nums.replace(/^(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4').substring(0, 14);
  }
  return nums.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5').substring(0, 18);
};

const validateEmail = (email: string) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export interface CompanyInfo {
  logo?: string;
  name: string;
  tradeName?: string;
  slogan?: string;
  idNumber: string; // CPF/CNPJ
  stateRegistration?: string;
  email: string;
  website: string;
  address: {
    logradouro: string;
    cep: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
  };
  pix: string;
  phone: string;
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

interface BarcodeDesignConfig {
  type: 'code128' | 'ean13';
  height: number;
  width: number; // bar thickness
  showText: boolean;
  color: string;
  backgroundColor: string;
}

interface CouponPDVConfig {
  headerMessage: string;
  showOrderNumber: boolean;
  showDateTime: boolean;
  showSoldBy: boolean;
  showQrCode: boolean;
  format: '58mm' | '80mm' | 'a4' | 'a6' | 'custom';
  orientation?: 'portrait' | 'landscape';
  customWidth?: number;
  customHeight?: number;
  printerName?: string;
  profileName?: string;
  printMode: 'browser' | 'auto';
  qrCodeDesign?: QRCodeDesignConfig;
}

interface LabelConfig {
  width: number; // mm
  height: number; // mm
  format: 'a4' | 'a6' | 'custom' | 'thermal';
  showProductName: boolean;
  showBarcode: boolean;
  showCodeNumber: boolean;
  showPrice: boolean;
  showPrintDate: boolean;
  printerName: string;
  profileName?: string;
  printMode: 'browser' | 'auto';
  sheetType?: 'a4' | 'thermal';
  labelsPerSheet?: number;
  barcodeDesign?: BarcodeDesignConfig;
}

interface SystemUser {
  id: string;
  username: string;
  name: string;
  password?: string;
  roleId?: string;
  isActive?: boolean;
  deactivatedAt?: string;
}

type AccessLevel = 'total' | 'limitado' | 'nenhum';

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

interface GreetingCouponConfig {
  title: string;
  message: string;
  showCustomerName: boolean;
  showOrderNumber: boolean;
  footerText: string;
  qrCodeText: string;
  format: '58mm' | '80mm' | 'a4' | 'a6' | 'custom';
  orientation?: 'portrait' | 'landscape';
  width?: number;
  height?: number;
  printerName?: string;
  printMode?: 'browser' | 'auto';
  backgroundImage?: string;
  backgroundOpacity?: number;
  emojiOpacity?: number;
  emojis?: Emoji[];
  customEmojis?: string[];
  qrCodeDesign?: QRCodeDesignConfig;
}

interface ModulePermissions {
  dashboard: AccessLevel;
  pdv: AccessLevel;
  separacao: AccessLevel;
  estoque: AccessLevel;
  financeiro: AccessLevel;
  historico: AccessLevel;
  consultarPedido: AccessLevel;
  customerExperience: AccessLevel;
  ajustes: AccessLevel;
  lojistas: AccessLevel;
  devolucao: AccessLevel;
}

interface Role {
  id: string;
  name: string;
  isDefault?: boolean;
  permissions: ModulePermissions;
}

const DEFAULT_PERMISSIONS: ModulePermissions = {
  dashboard: 'nenhum',
  pdv: 'nenhum',
  separacao: 'nenhum',
  estoque: 'nenhum',
  financeiro: 'nenhum',
  historico: 'nenhum',
  consultarPedido: 'nenhum',
  customerExperience: 'nenhum',
  ajustes: 'nenhum',
  lojistas: 'nenhum',
  devolucao: 'nenhum'
};

const INITIAL_ROLES: Role[] = [
  {
    id: 'role-gerente',
    name: 'Gerente',
    isDefault: true,
    permissions: {
      dashboard: 'total',
      pdv: 'total',
      separacao: 'total',
      estoque: 'total',
      financeiro: 'total',
      historico: 'total',
      consultarPedido: 'total',
      customerExperience: 'total',
      ajustes: 'total',
      lojistas: 'total',
      devolucao: 'total',
    }
  },
  {
    id: 'role-caixa',
    name: 'Operador de caixa',
    isDefault: true,
    permissions: {
      dashboard: 'limitado',
      pdv: 'total',
      separacao: 'nenhum',
      estoque: 'limitado',
      financeiro: 'nenhum',
      historico: 'nenhum',
      consultarPedido: 'nenhum',
      customerExperience: 'nenhum',
      ajustes: 'nenhum',
      lojistas: 'nenhum',
      devolucao: 'nenhum',
    }
  },
  {
    id: 'role-separador',
    name: 'Separador',
    isDefault: true,
    permissions: {
      dashboard: 'nenhum',
      pdv: 'nenhum',
      separacao: 'total',
      estoque: 'limitado',
      financeiro: 'nenhum',
      historico: 'nenhum',
      consultarPedido: 'total',
      customerExperience: 'total',
      ajustes: 'nenhum',
      lojistas: 'nenhum',
      devolucao: 'nenhum',
    }
  },
  {
    id: 'role-estoquista',
    name: 'Estoquista',
    isDefault: true,
    permissions: {
      dashboard: 'nenhum',
      pdv: 'nenhum',
      separacao: 'nenhum',
      estoque: 'total',
      financeiro: 'nenhum',
      historico: 'nenhum',
      consultarPedido: 'nenhum',
      customerExperience: 'nenhum',
      ajustes: 'nenhum',
      lojistas: 'nenhum',
      devolucao: 'total',
    }
  },
  {
    id: 'role-financeiro',
    name: 'Financeiro',
    isDefault: true,
    permissions: {
      dashboard: 'total',
      pdv: 'nenhum',
      separacao: 'nenhum',
      estoque: 'nenhum',
      financeiro: 'total',
      historico: 'total',
      consultarPedido: 'nenhum',
      customerExperience: 'nenhum',
      ajustes: 'nenhum',
      lojistas: 'nenhum',
      devolucao: 'nenhum',
    }
  }
];

interface CashierSession {
  id: string;
  isOpen: boolean;
  openedAt: string;
  closedAt?: string;
  userId?: string;
  userName?: string;
  openingBalance: number;
  closingBalance?: number;
  totalSales: number;
  totalCanceled: number;
  salesCount: number;
  canceledCount: number;
  salesByMethod: Record<string, number>;
  reforsos?: number;
  sangrias?: number;
  estornos?: number;
  descontos?: number;
  acrescimos?: number;
  taxaEntrega?: number;
  updatedAt?: number;
}


type View = 'dashboard' | 'summary' | 'adjust' | 'payments' | 'add-product' | 'add-customer' | 'movement' | 'delivery' | 'cashier' | 'finance' | 'sales-history' | 'pos' | 'separation' | 'results' | 'consultar-pedido' | 'search-order' | 'customer-experience' | 'catalog' | 'lojistas' | 'auditoria' | 'returns';

const INITIAL_QR_DESIGN: QRCodeDesignConfig = {
  style: 'standard',
  color: '#000000',
  backgroundColor: '#FFFFFF',
  opacity: 100,
  dotType: 'square',
  cornerType: 'standard'
};

const PAYMENT_ICON_LIBRARY = [
  { char: '💵', label: 'Dinheiro' },
  { char: '💳', label: 'Cartão' },
  { char: '📲', label: 'Pix' },
  { char: '🏦', label: 'Banco' },
  { char: '🔗', label: 'Link' },
  { char: '📦', label: 'Outro' },
  { char: '💰', label: 'Saco de Dinheiro' },
  { char: '⚡', label: 'Raio' },
  { char: '💎', label: 'Diamante' },
  { char: '🎁', label: 'Presente' }
];

const DEFAULT_PAYMENT_ICONS: Record<string, string> = {
  'DINHEIRO': '💵',
  'PIX': '📲',
  'CARTÃO DE CRÉDITO': '💳',
  'CARTÃO DE DÉBITO': '💳',
  'MULTIMEIOS': '💰'
};

const INITIAL_BARCODE_DESIGN: BarcodeDesignConfig = {
  type: 'code128',
  height: 40,
  width: 2,
  showText: true,
  color: '#000000',
  backgroundColor: '#FFFFFF'
};

const INITIAL_COUPON_PDV_CONFIG: CouponPDVConfig = {
  headerMessage: 'COMPROVANTE DE PEDIDO',
  showOrderNumber: true,
  showDateTime: true,
  showSoldBy: true,
  showQrCode: true,
  format: '80mm',
  orientation: 'portrait',
  printMode: 'browser',
  profileName: 'BALCÃO',
  qrCodeDesign: INITIAL_QR_DESIGN
};

const INITIAL_COUPON_CONFIG: CouponConfig = {
  format: '80mm',
  orientation: 'portrait',
  outputType: 'impressora',
  printMode: 'browser',
  printerName: '',
  profileName: 'GERAL',
  customWidth: 80,
  customHeight: 300,
  headerMessage: 'CUPOM DE VENDA',
  footerMessage: 'Obrigado pela preferência!',
  defaultMessage: 'Obrigado pela preferência! Volte sempre.',
  showLogo: true,
  showCompanyName: true,
  showCompanyId: true,
  showCompanyAddress: true,
  showIdNumber: true,
  showAddress: true,
  showCustomer: true,
  showCustomerData: true,
  showItemName: true,
  showItemQty: true,
  showItemPrice: true,
  showItemUnitPrice: true,
  showItemSubtotal: true,
  showDiscounts: true,
  showDiscount: true,
  showFinalTotal: true,
  showPaymentMethod: true,
  showChange: true,
  showOrderNumber: true,
  showDateTime: true,
  showOrderQrCode: true,
  showPrice: true,
  qrCodeDesign: INITIAL_QR_DESIGN
};

const INITIAL_GREETING_COUPON_CONFIG: GreetingCouponConfig = {
  title: 'MUITO OBRIGADO!',
  message: 'Preparamos seu pedido com muito carinho. Esperamos que você adore sua nova aquisição!',
  showCustomerName: true,
  showOrderNumber: true,
  footerText: 'Siga-nos no Instagram: @loja_exemplo',
  qrCodeText: 'Acesse seu vídeo',
  format: '80mm',
  orientation: 'portrait',
  width: 80,
  height: 150,
  printMode: 'browser',
  backgroundOpacity: 10,
  emojiOpacity: 100,
  emojis: [],
  customEmojis: [],
  qrCodeDesign: INITIAL_QR_DESIGN
};

interface PrinterConfig {
  id: string;
  name: string;
  displayName?: string;
  type: 'thermal' | 'desktop';
  connection: 'usb' | 'network' | 'bluetooth';
}

// --- Main App ---
// Helper for scan feedback
const playScanFeedback = () => {
  // Beep
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(800, audioCtx.currentTime);
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (err) {
    console.warn("Audio feedback failed");
  }

  // Vibration
  if ('vibrate' in navigator) {
    navigator.vibrate(80);
  }
};

// --- Global Utilities ---
const getPaperDimensions = (config: { 
  format?: string, 
  orientation?: 'portrait' | 'landscape', 
  customWidth?: number, 
  customHeight?: number,
  width?: number,
  height?: number
}) => {
  const isLandscape = config.orientation === 'landscape';
  const cWidth = config.customWidth || config.width || 80;
  const cHeight = config.customHeight || config.height || 100;
  
  let widthMm: number;
  let heightMm: number | 'auto' = 'auto';
  let pageSizeCss: string;

  switch (config.format) {
    case '58mm':
      widthMm = 58;
      pageSizeCss = '58mm auto';
      break;
    case '80mm':
      widthMm = 80;
      pageSizeCss = '80mm auto';
      break;
    case 'a4':
      widthMm = isLandscape ? 297 : 210;
      heightMm = isLandscape ? 210 : 297;
      pageSizeCss = `A4 ${config.orientation || 'portrait'}`;
      break;
    case 'a6':
      widthMm = isLandscape ? 148 : 105;
      heightMm = isLandscape ? 105 : 148;
      pageSizeCss = `A6 ${config.orientation || 'portrait'}`;
      break;
    case 'custom':
      widthMm = isLandscape ? cHeight : cWidth;
      heightMm = isLandscape ? cWidth : cHeight;
      pageSizeCss = `${widthMm}mm ${heightMm}mm`;
      break;
    default:
      widthMm = 80;
      pageSizeCss = '80mm auto';
  }

  return {
    widthMm,
    heightMm,
    orientation: config.orientation || (isLandscape ? 'landscape' : 'portrait'),
    pageSizeCss,
    format: config.format,
    widthCss: `${widthMm}mm`,
    heightCss: heightMm === 'auto' ? 'auto' : `${heightMm}mm`
  };
};

export default function App() {
  const [view, setView] = useState<View>('dashboard');

  const handleConfirmReturn = (saleId: string, items: { productId: string, quantity: number }[], reason: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale || !currentUser) return;

    const returnId = Date.now().toString();
    const newReturn: SaleReturn = {
      id: returnId,
      items: items,
      reason,
      date: Date.now(),
      userId: currentUser.id,
      userName: currentUser.name
    };

    // Update Sale
    setSales(prev => prev.map(s => {
      if (s.id === saleId) {
        return {
          ...s,
          returns: [...(s.returns || []), newReturn]
        };
      }
      return s;
    }));

    // Update Stock
    setProducts((prevP: Product[]) => prevP.map(p => {
      const returnedItem = items.find(ri => ri.productId === p.id);
      if (returnedItem) {
        return { ...p, stock: (p.stock || 0) + returnedItem.quantity };
      }
      return p;
    }));

    // Audit / Activity
    addActivity('sale', 'Devolução Realizada', `Usuário ${currentUser.name} realizou devolução no pedido ${sale.sequentialId || sale.id.substring(0, 8)}`);
    
    alert('Devolução registrada com sucesso!');
    setView('sales-history');
  };
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isRightDrawerOpen, setIsRightDrawerOpen] = useState(false);
  const [hardwarePrinters, setHardwarePrinters] = useState<any[]>([]);
  const [registeredPrinters, setRegisteredPrinters] = useState<any[]>(() => carregarDados(STORAGE_KEYS.REGISTERED_PRINTERS, []));
  const [selectedPrinter, setSelectedPrinter] = useState<string>('');
  const [selectedLabelPrinter, setSelectedLabelPrinter] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'restore' | 'delete' } | null>(null);
  
  // PWA Automatic Reload on Update
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        // Quando o novo service worker assume o controle, recarregamos a página
        window.location.reload();
      });
    }
  }, []);

  const performUnifiedPrint = async (type: string, content: string, printer: string, mode: string, dims?: { width?: number, height?: number, format?: string, orientation?: 'portrait' | 'landscape' }) => {
    // Definir impressora alvo. Se não tiver impressora específica passada, usamos a global
    const targetPrinter = printer || selectedPrinter;
    
    console.log(`[Impressão] Solicitando impressão de "${type}" em "${targetPrinter}" (Modo: ${mode})`);
    console.log("[Impressão] Electron API disponível?", !!(window as any).electronAPI);
    
    // Se for modo automático e estivermos no Electron
    if (mode === 'auto') {
      if (!(window as any).electronAPI) {
        alert('Impressão automática só funciona no aplicativo instalado');
        // Fallback para diálogo do navegador
      } else {
        try {
          if (!targetPrinter) {
            alert('Nenhuma impressora real selecionada. Por favor, configure uma impressora nas configurações de Hardware.');
            return false;
          }

          const printOptions: any = { deviceName: targetPrinter, silent: true };
          
          if (dims?.format === 'custom' && dims.width && dims.height) {
            printOptions.pageSize = { width: Math.round(dims.width * 1000), height: Math.round(dims.height * 1000) };
          } else if (dims?.format === 'a4') {
            printOptions.pageSize = 'A4';
          } else if (dims?.format === 'a6') {
            const w = dims.orientation === 'landscape' ? 148000 : 105000;
            const h = dims.orientation === 'landscape' ? 105000 : 148000;
            printOptions.pageSize = { width: w, height: h };
          } else if (dims?.format === '58mm') {
            printOptions.pageSize = { width: 58000, height: 297000 };
          } else if (dims?.format === '80mm') {
            printOptions.pageSize = { width: 80000, height: 297000 };
          }

          if (dims?.orientation) {
            printOptions.landscape = dims.orientation === 'landscape';
          }

          console.log(`[Impressão] Executando chamada via Electron API para: "${targetPrinter}"`);
          const startTime = Date.now();
          const result = await (window as any).electronAPI.print(content, printOptions);
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          
          if (result.success) {
            console.log(`[Impressão] [SUCCESS] - Trabalho entregue ao Windows em: ${targetPrinter} (Tempo: ${duration}s)`);
            return true;
          } else {
            console.error('[Impressão] [ERROR] - Falha reportada pelo Electron:', result);
            
            let errorMsg = `Erro ao imprimir em "${targetPrinter}": ${result.error || 'Erro desconhecido'}.`;
            if (result.code === 'TIMEOUT') {
              errorMsg = `TIMEOUT: A impressora "${targetPrinter}" demorou mais de 60 segundos para responder.\n\nIsso pode ocorrer se a impressora estiver offline, sem papel, com o driver travado ou se o trabalho for muito grande.`;
            } else if (result.code === 'DRIVER_FAILURE') {
              errorMsg = `FALHA NO DRIVER: O Windows recusou o trabalho para "${targetPrinter}".\n\nCertifique-se de que a impressora está ligada, conectada ao cabo USB/Rede e que não há outros erros no painel de controle do Windows.`;
            }
            
            const tryFallback = confirm(`${errorMsg}\n\nDeseja abrir o diálogo de impressão do navegador como fallback?`);
            if (!tryFallback) return false;
          }
        } catch (error) {
          console.error('[Impressão] Falha crítica IPC:', error);
          alert('Erro de comunicação com o sistema de impressão Desktop.');
          return false;
        }
      }
    }
    
    // Se for modo browser ou se o usuário aceitou o fallback
    console.log("[Impressão] Iniciando fallback para navegador...");
    try {
      const win = window.open('', '_blank');
      if (win) {
        win.document.write(content);
        win.document.close();
        win.focus();
        
        setTimeout(() => {
          win.print();
          // win.close(); 
        }, 500);
        return true;
      }
    } catch (err) {
      console.error('[Impressão] Erro no fallback do navegador:', err);
    }
    
    return false;
  };
  const [printers, setPrinters] = useState<PrinterConfig[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [catalogDescriptions, setCatalogDescriptions] = useState<Record<string, string>>({});
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [deliveryChannels, setDeliveryChannels] = useState<DeliveryChannel[]>([]);
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([]);
  const [closedSessions, setClosedSessions] = useState<CashierSession[]>([]);
  const [shopkeepers, setShopkeepers] = useState<Shopkeeper[]>([]);
  const [shopkeeperDeliveries, setShopkeeperDeliveries] = useState<ShopkeeperDelivery[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [gallerySearchTerm, setGallerySearchTerm] = useState('');
  
  const [payments, setPayments] = useState<any[]>([]);


  const generateReceiptHTML = async (sale: Sale, products: Product[], customers: Customer[], company: CompanyInfo, config: CouponConfig, customTitle?: string) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const itemsHtml = sale.items.map(item => {
      const p = products.find(prod => prod.id === item.productId);
      const originalPrice = p?.price || item.price;
      const discountPerUnit = originalPrice - item.price;
      const hasDiscount = config.showDiscount && discountPerUnit > 0;

      return `
        <div style="display: flex; justify-content: space-between; font-size: 10px; margin-bottom: 2px;">
          <span>${config.showItemQty ? `${item.quantity}x ` : ''}${config.showItemName ? (p?.name || 'Item') : ''}</span>
          ${config.showItemSubtotal ? `<span>R$ ${(item.price * item.quantity).toFixed(2)}</span>` : ''}
        </div>
        ${(config.showItemUnitPrice || hasDiscount) ? `
          <div style="font-size: 8px; font-style: italic; opacity: 0.7;">
            ${config.showItemUnitPrice ? `Unit: R$ ${item.price.toFixed(2)}` : ''}
            ${hasDiscount ? `<span style="color: #e67e22;"> (Economia: R$ ${(discountPerUnit * item.quantity).toFixed(2)})</span>` : ''}
          </div>
        ` : ''}
      `;
    }).join('');

    const qrDataUrl = await generateStyledQRCode(sale.sequentialId?.toString() || sale.id, config.qrCodeDesign || INITIAL_QR_DESIGN);
    let qrHtml = '';
    if (qrDataUrl) {
      qrHtml = `
        <div class="qr-code" style="text-align: center; margin-top: 15px; opacity: ${(config.qrCodeDesign?.opacity ?? 100) / 100};">
          <img src="${qrDataUrl}" style="width: 35mm; height: 35mm;" />
          <div style="font-size: 8px; margin-top: 4px; font-weight: bold;">REFERÊNCIA DO PEDIDO</div>
          <div style="font-size: 8px;">PEDIDO: #${sale.sequentialId}</div>
          <div style="font-size: 8px;">${new Date(sale.date).toLocaleString('pt-BR')}</div>
        </div>
      `;
    }

    const { pageSizeCss, widthCss, heightCss } = getPaperDimensions(config);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${customTitle || 'Cupom'} #${sale.sequentialId}</title>
          <style>
            @page {
              size: ${pageSizeCss};
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              width: ${widthCss};
              min-height: ${heightCss === 'auto' ? '100vh' : heightCss};
              margin: 0 auto;
              padding: ${config.format === 'a4' ? '15mm' : config.format === 'a6' ? '10mm' : '3mm'}; 
              box-sizing: border-box;
              overflow-x: hidden;
            }
            .header { text-align: center; margin-bottom: 10px; }
            .header img { max-width: 40mm; max-height: 20mm; margin-bottom: 5px; }
            .header h3 { margin: 0; font-size: 14px; text-transform: uppercase; }
            .header div { font-size: 9px; margin-top: 2px; }
            .items { margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px; }
            .total { font-weight: bold; font-size: 14px; margin-top: 10px; text-align: right; border-top: 1px solid #000; padding-top: 5px; }
            .footer { text-align: center; margin-top: 20px; font-size: 9px; border-top: 1px dashed #000; padding-top: 10px; }
            
            /* Evitar quebra de página no meio de blocos significativos */
            .header, .items, .total, .footer, .qr-code {
              page-break-inside: avoid;
            }

            @media print {
              body { 
                width: ${widthCss} !important;
                margin: 0 !important;
                padding: ${config.format === 'a4' ? '10mm' : config.format === 'a6' ? '7mm' : '2mm'} !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            ${company.logo && config.showLogo ? `<img src="${company.logo}" />` : ''}
            ${config.showCompanyName ? `<h3>${company.tradeName || company.name || 'EMPRESA'}</h3>` : ''}
            ${config.showIdNumber ? `<div>CPF/CNPJ: ${company.idNumber || '---'}${company.stateRegistration ? ` | IE: ${company.stateRegistration}` : ''}</div>` : ''}
            ${config.showAddress ? `
              <div>${company.address.logradouro}, ${company.address.numero} - ${company.address.bairro}</div>
              <div>${company.address.cidade}/${company.address.estado}</div>
            ` : ''}
          </div>
          ${customTitle ? `<div style="text-align: center; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; font-size: 12px; border-bottom: 1px dashed #000; padding-bottom: 5px;">${customTitle}</div>` : ''}
          ${config.headerMessage ? `<div style="text-align: center; margin-bottom: 10px; border-bottom: 1px dashed #000; padding-bottom: 5px; font-size: 9px;">${config.headerMessage}</div>` : ''}
          <div class="items">${itemsHtml}</div>
          ${config.showFinalTotal ? `<div class="total">TOTAL: R$ ${sale.total.toFixed(2)}</div>` : ''}
          
          ${(config.showPaymentMethod || config.showChange) ? `
            <div style="font-size: 10px; margin-top: 10px; border-top: 1px dashed #000; padding-top: 5px;">
              <b style="text-transform: uppercase;">Pagamento:</b><br>
              ${sale.payments && sale.payments.length > 0 
                ? sale.payments.map(p => `<div style="display: flex; justify-content: space-between;"><span>${p.method}:</span> <span>R$ ${p.amount.toFixed(2)}</span></div>`).join('')
                : `<div style="display: flex; justify-content: space-between;"><span>${sale.paymentMethod}:</span> <span>R$ ${sale.total.toFixed(2)}</span></div>`
              }
              ${config.showChange && (sale.change || 0) > 0 ? `<div style="display: flex; justify-content: space-between; margin-top: 2px; font-weight: bold;"><span>TROCO:</span> <span>R$ ${sale.change?.toFixed(2)}</span></div>` : ''}
            </div>
          ` : ''}

          ${customer && config.showCustomer && config.showCustomerData ? `
            <div style="margin-top: 10px; font-size: 10px; border-top: 1px dashed #000; padding-top: 5px;">
              <b style="text-transform: uppercase;">Dados do Cliente:</b><br>
              <b>NOME:</b> ${customer.name}<br>
              ${(customer.whatsapp || customer.phone) ? `<b>FONE:</b> ${customer.whatsapp || customer.phone}<br>` : ''}
              ${customer.taxId ? `<b>DOC:</b> ${customer.taxId}<br>` : ''}
              ${customer.address ? `
                <b>END:</b> ${customer.address.street}${customer.address.number ? `, ${customer.address.number}` : ''}<br>
                ${customer.address.neighborhood ? `<b>BAIRRO:</b> ${customer.address.neighborhood}<br>` : ''}
                ${customer.address.city ? `<b>CIDADE:</b> ${customer.address.city} - ${customer.address.state || ''}<br>` : ''}
                ${customer.address.cep ? `<b>CEP:</b> ${customer.address.cep}<br>` : ''}
                ${customer.address.complement ? `<b>COMPL:</b> ${customer.address.complement}<br>` : ''}
              ` : ''}
            </div>
          ` : ''}
          <div class="footer">
            <p>${String(config.footerMessage || config.defaultMessage || '')}</p>
            ${qrHtml}
            <p style="font-size: 8px; margin-top: 10px;">
              ${config.showOrderNumber ? `PEDIDO: #${sale.sequentialId}` : ''} 
              ${config.showDateTime ? ` | ${new Date(sale.date).toLocaleString('pt-BR')}` : ''}
            </p>
            ${sale.soldByUserName ? `<p style="font-size: 8px; margin-top: 2px;">VENDIDO POR: ${sale.soldByUserName}</p>` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const generateStyledQRCode = async (content: string, design?: QRCodeDesignConfig) => {
    if (!design) return await QRCode.toDataURL(content);
    
    // Level 'H' is needed for logo/customizations to ensure scannability (High error correction)
    const options: any = {
      level: 'H',
      margin: 1,
      scale: 8,
      color: {
        dark: design.color || '#000000',
        light: design.backgroundColor || '#FFFFFF'
      }
    };

    try {
      const dataUrl = await QRCode.toDataURL(content, options);
      
      // If no advanced styling or logo, return basic dataUrl
      if (design.style === 'standard' && !design.logoUrl && design.dotType === 'square') {
        return dataUrl;
      }

      // Final canvas composite for Logo or Styles
      return new Promise<string>((resolve) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const qrImg = new Image();
        qrImg.src = dataUrl;
        
        qrImg.onload = () => {
          canvas.width = qrImg.width;
          canvas.height = qrImg.height;
          if (!ctx) { resolve(dataUrl); return; }

          ctx.fillStyle = design.backgroundColor || '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          // Draw standard first as fallback
          ctx.drawImage(qrImg, 0, 0);

          if (design.style === 'logo' && design.logoUrl) {
            const logoImg = new Image();
            logoImg.crossOrigin = "anonymous";
            logoImg.src = design.logoUrl;
            logoImg.onload = () => {
              const logoSize = canvas.width * 0.22;
              const x = (canvas.width - logoSize) / 2;
              const y = (canvas.height - logoSize) / 2;
              
              // White quiet zone around logo
              ctx.fillStyle = design.backgroundColor || '#FFFFFF';
              ctx.beginPath();
              ctx.roundRect(x - 4, y - 4, logoSize + 8, logoSize + 8, 4);
              ctx.fill();
              
              ctx.drawImage(logoImg, x, y, logoSize, logoSize);
              resolve(canvas.toDataURL());
            };
            logoImg.onerror = () => resolve(dataUrl);
          } else {
            resolve(canvas.toDataURL());
          }
        };
        qrImg.onerror = () => resolve(dataUrl);
      });
    } catch (e) {
      console.error(e);
      return '';
    }
  };

  const generateSimpleReceiptHTML = async (sale: Sale, company: CompanyInfo, config: CouponPDVConfig) => {
    const qrContent = sale.sequentialId?.toString() || sale.id;
    const qrDataUrl = await generateStyledQRCode(qrContent, config.qrCodeDesign || INITIAL_QR_DESIGN);

    const { pageSizeCss, widthCss, heightCss } = getPaperDimensions(config);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Via Separação #${sale.sequentialId}</title>
          <style>
            @page { 
              size: ${pageSizeCss};
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              width: ${widthCss}; 
              min-height: ${heightCss === 'auto' ? '100vh' : heightCss};
              margin: 0 auto; 
              padding: ${config.format === 'a4' ? '15mm' : '5mm'}; 
              text-align: center; 
              box-sizing: border-box;
              overflow-x: hidden;
              color: #000;
            }
            .header-msg { font-size: 14px; font-weight: bold; margin-bottom: 10px; text-transform: uppercase; }
            .order-info { font-size: 32px; font-weight: 900; margin-bottom: 15px; border: 3px solid #000; padding: 10px; page-break-inside: avoid; }
            .qr-code { margin: 20px 0; page-break-inside: avoid; }
            .qr-code img { width: 45mm; height: 45mm; }
            .details { font-size: 11px; font-weight: bold; page-break-inside: avoid; line-height: 1.6; }
            @media print {
              body { width: ${widthCss} !important; border: none; padding: ${config.format === 'a4' ? '10mm' : '3mm'} !important; }
            }
          </style>
        </head>
        <body>
          <div class="header-msg">${config.headerMessage}</div>
          <div class="order-info">PEDIDO: #${sale.sequentialId}</div>
          <div class="qr-code">
            <img src="${qrDataUrl}" />
          </div>
          <div class="details">
            ${config.showDateTime ? `<div>DATA: ${new Date(sale.date).toLocaleDateString('pt-BR')}</div><div>HORA: ${new Date(sale.date).toLocaleTimeString('pt-BR')}</div>` : ''}
            ${config.showSoldBy ? `<div>USUÁRIO: ${sale.soldByUserName || '---'}</div>` : ''}
          </div>
        </body>
      </html>
    `;
  };

  const imprimirPedidoPDV = async (sale: Sale) => {
    const html = await generateSimpleReceiptHTML(sale, company, couponPDVConfig);
    const dims = getPaperDimensions(couponPDVConfig);
    return performUnifiedPrint('cupom-pdv', html, couponPDVConfig.printerName || selectedPrinter, couponPDVConfig.printMode, {
      width: dims.widthMm,
      height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
      format: couponPDVConfig.format,
      orientation: couponPDVConfig.orientation
    });
  };

  const generateGreetingCupomHTML = async (sale: Sale, customers: Customer[], config: GreetingCouponConfig) => {
    const customer = customers.find(c => c.id === sale.customerId);
    const qrContent = sale.youtubeLink || '';
    const qrDataUrl = await generateStyledQRCode(qrContent, config.qrCodeDesign || INITIAL_QR_DESIGN);

    const { pageSizeCss, widthCss, heightCss } = getPaperDimensions(config);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Cupom Saudação</title>
          <style>
            @page { 
              size: ${pageSizeCss}; 
              margin: 0;
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: #fff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              font-family: 'Arial', sans-serif; 
              margin: 0 auto; 
              padding: ${config.format === 'a4' ? '15mm' : '5mm'}; 
              text-align: center; 
              width: ${widthCss};
              min-height: ${heightCss === 'auto' ? '100vh' : heightCss};
              box-sizing: border-box;
              overflow-x: hidden;
              color: #000;
              position: relative;
            }
            .bg-image {
              position: absolute;
              inset: 0;
              z-index: 1;
              background-image: url('${config.backgroundImage || ''}');
              background-size: cover;
              background-position: center;
              opacity: ${(config.backgroundOpacity ?? 10) / 100};
              display: ${config.backgroundImage ? 'block' : 'none'};
            }
            .content { position: relative; z-index: 3; }
            .emoji { position: absolute; z-index: 2; pointer-events: none; }
            .title { font-size: 18px; font-weight: 900; margin-bottom: 5mm; text-transform: uppercase; page-break-inside: avoid; }
            .message { font-size: 12px; font-style: italic; margin-bottom: 8mm; line-height: 1.4; page-break-inside: avoid; }
            .qr-container { 
              margin: 5mm auto; 
              text-align: center; 
              page-break-inside: avoid;
              background: rgba(255, 255, 255, 0.8);
              padding: 2mm;
              display: inline-block;
              border-radius: 2mm;
            }
            .qr-container img { width: 40mm; height: 40mm; }
            .qr-label { font-size: 10px; font-weight: bold; margin-top: 2mm; text-transform: uppercase; }
            .details { font-size: 9px; color: #666; margin-top: 5mm; page-break-inside: avoid; }
            .footer { margin-top: 10mm; font-size: 9px; border-top: 1px dashed #ccc; padding-top: 3mm; page-break-inside: avoid; }
            
            @media print {
              body { 
                width: ${widthCss} !important;
                padding: ${config.format === 'a4' ? '10mm' : '3mm'} !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="bg-image"></div>
          ${(config.emojis || []).map(emoji => `
            <div class="emoji" style="left: ${emoji.x * 100}%; top: ${emoji.y * 100}%; width: ${emoji.size}px; height: ${emoji.size}px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -50%) rotate(${emoji.rotation || 0}deg); opacity: ${((emoji.opacity ?? 100) / 100) * ((config.emojiOpacity ?? 100) / 100)};">
              ${emoji.isImage ? `<img src="${emoji.char}" style="width: 100%; height: 100%; object-fit: contain;" />` : `<span style="font-size: ${emoji.size}px; line-height: 1;">${emoji.char}</span>`}
            </div>
          `).join('')}
          <div class="content">
            <div class="title">${config.title}</div>
            <div class="message">"${config.message}"</div>
            
            <div class="qr-container">
            <img src="${qrDataUrl}" />
            <div class="qr-label">${config.qrCodeText || 'Acesse seu vídeo'}</div>
          </div>

          <div class="details">
            ${config.showOrderNumber ? `<div>PEDIDO: #${sale.sequentialId}</div>` : ''}
            ${config.showCustomerName && customer ? `<div>CLIENTE: ${customer.name}</div>` : ''}
            <div>DATA: ${new Date(sale.date).toLocaleDateString('pt-BR')}</div>
          </div>

          <div class="footer">
            ${config.footerText || ''}
          </div>
        </body>
      </html>
    `;
  };

  const imprimirGreetingCupom = async (sale: Sale) => {
    const activeConfig = sale.greetingConfig || greetingCouponConfig;
    const html = await generateGreetingCupomHTML(sale, customers, activeConfig);
    const dims = getPaperDimensions(activeConfig);
    return performUnifiedPrint('cupom-saudacao', html, activeConfig.printerName || selectedPrinter, activeConfig.printMode || couponConfig.printMode, {
      width: dims.widthMm,
      height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
      format: activeConfig.format,
      orientation: activeConfig.orientation
    });
  };

  const imprimirCupom = async (saleOrHtml: Sale | string, customTitle?: string) => {
    const html = typeof saleOrHtml === 'string' 
      ? saleOrHtml 
      : await generateReceiptHTML(saleOrHtml, products, customers, company, couponConfig, customTitle);
    
    const dims = getPaperDimensions(couponConfig);
    return performUnifiedPrint('cupom', html, couponConfig.printerName || selectedPrinter, couponConfig.printMode, {
      width: dims.widthMm,
      height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
      format: couponConfig.format,
      orientation: couponConfig.orientation
    });
  };

  const imprimirEtiqueta = async (product: Product, quantity: number) => {
    // Validação de segurança para etiquetas (PONTO 6)
    if (labelConfig.printMode === 'auto' && !labelConfig.printerName) {
      alert('⚠️ Selecione uma impressora de etiquetas nas configurações.');
      return false;
    }

    // Reutilizando lógica do LabelPrintModal de forma simplificada para chamada direta
    const generateLabelHtml = (p: Product, config: LabelConfig) => `
      <div class="label" style="
        width: ${config.width}mm; 
        height: ${config.height}mm; 
        padding: 2mm; 
        box-sizing: border-box; 
        display: flex; 
        flex-direction: column; 
        align-items: center; 
        justify-content: center; 
        text-align: center;
        overflow: hidden;
        position: relative;
        background: white;
        ${config.sheetType === 'a4' ? 'border: 0.1mm solid #eee;' : ''}
      ">
        ${config.showProductName ? `<div style="font-size: 8pt; font-weight: 900; text-transform: uppercase; margin-bottom: 1mm; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${p.name}</div>` : ''}
        ${config.showBarcode ? `
          <div style="display: flex; flex-direction: column; items: center;">
            <svg class="barcode"></svg>
            ${config.showCodeNumber ? `<div style="font-size: 6pt; font-family: monospace; margin-top: 0.5mm;">${p.sku || ''}</div>` : ''}
          </div>
        ` : ''}
        <div style="display: flex; justify-content: space-between; width: 100%; margin-top: auto; align-items: flex-end;">
          ${config.showPrintDate ? `<div style="font-size: 5pt; font-family: monospace;">${new Date().toLocaleDateString('pt-BR')}</div>` : '<div></div>'}
          ${config.showPrice ? `<div style="font-size: 10pt; font-weight: 900; font-style: italic;">R$ ${Number(p.price).toFixed(2)}</div>` : ''}
        </div>
      </div>
    `;

    const labels = Array.from({ length: quantity }).map(() => generateLabelHtml(product, labelConfig)).join('');

    const paperConfig = labelConfig.sheetType === 'a4' ? { ...labelConfig, format: 'a4' } : 
                       labelConfig.format === 'a6' ? { ...labelConfig, format: 'a6' } : 
                       { ...labelConfig, format: 'custom', customWidth: labelConfig.width, customHeight: labelConfig.height };
    
    const dims = getPaperDimensions(paperConfig as any);

    const fullHtml = `
      <html>
        <head>
          <meta charset="utf-8">
          <title>Etiquetas - ${product.name}</title>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.0/dist/JsBarcode.all.min.js"></script>
          <style>
            @page { 
              margin: 0; 
              size: ${dims.pageSizeCss}; 
            }
            html, body {
              margin: 0;
              padding: 0;
              background-color: white;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            body { 
              margin: 0; 
              padding: 0; 
              width: ${dims.widthCss};
            }
            .sheet {
              display: flex;
              flex-wrap: wrap;
              width: 100%;
              ${labelConfig.sheetType === 'a4' ? 'padding: 5mm;' : 'padding: 0;'}
              box-sizing: border-box;
            }
            .label {
              page-break-inside: avoid;
            }
          </style>
        </head>
        <body>
          <div class="sheet">
            ${labels}
          </div>
          <script>
            window.onload = () => {
              const barcodes = document.querySelectorAll('.barcode');
              const bDesign = ${JSON.stringify(labelConfig.barcodeDesign || INITIAL_BARCODE_DESIGN)};
              barcodes.forEach(el => {
                JsBarcode(el, "${product.sku || '123456789012'}", {
                  format: bDesign.type.toUpperCase(),
                  width: bDesign.width,
                  height: bDesign.height,
                  displayValue: bDesign.showText,
                  lineColor: bDesign.color,
                  background: bDesign.backgroundColor,
                  margin: 0
                });
              });
            };
          </script>
        </body>
      </html>
    `;

    return performUnifiedPrint('etiqueta', fullHtml, labelConfig.printerName || selectedPrinter, labelConfig.printMode, {
      width: dims.widthMm,
      height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
      format: dims.format as any
    });
  };

  const addActivity = (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => {
    const userRole = currentUser ? roles.find(r => r.id === currentUser.roleId)?.name : 'Sistema';
    const newActivity: Activity = {
      id: crypto.randomUUID(),
      type,
      action,
      details,
      timestamp: new Date().toLocaleString('pt-BR'),
      user: currentUser?.name || 'Sistema',
      userRole,
      ...extra
    };
    setActivities(prev => [newActivity, ...prev].slice(0, 1000));
  };

  const [sales, setSales] = useState<Sale[]>([]);

  // Gold Customer Logic - Shared
  const goldCustomerIds = useMemo(() => {
    const stats: Record<string, { totalSpent: number, orderCount: number }> = {};
    sales.forEach(s => {
      if (s.status !== 'cancelado' && s.customerId) {
        if (!stats[s.customerId]) stats[s.customerId] = { totalSpent: 0, orderCount: 0 };
        stats[s.customerId].totalSpent += s.total;
        stats[s.customerId].orderCount += 1;
      }
    });

    const ids = new Set<string>();
    const LIMIT_VALUE = 1000;
    const MIN_ORDERS = 3;

    Object.entries(stats).forEach(([id, s]: [string, any]) => {
      if (s.orderCount >= MIN_ORDERS || s.totalSpent >= LIMIT_VALUE) {
        ids.add(id);
      }
    });
    return ids;
  }, [sales]);

  const [company, setCompany] = useState<CompanyInfo>({
    name: '',
    tradeName: '',
    slogan: '',
    idNumber: '',
    stateRegistration: '',
    email: '',
    website: '',
    address: { logradouro: '', cep: '', numero: '', bairro: '', cidade: '', estado: '' },
    pix: '',
    phone: ''
  });
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [rawMaterialsStructured, setRawMaterialsStructured] = useState<RawMaterial[]>([]);
  const [productRecipes, setProductRecipes] = useState<ProductRecipe[]>([]);

  const [couponConfig, setCouponConfig] = useState<CouponConfig>(carregarDados(STORAGE_KEYS.COUPON_CONFIG, INITIAL_COUPON_CONFIG));
  const [greetingCouponConfig, setGreetingCouponConfig] = useState<GreetingCouponConfig>(carregarDados(STORAGE_KEYS.GREETING_COUPON_CONFIG, INITIAL_GREETING_COUPON_CONFIG));
  
  useEffect(() => {
    salvarDados(STORAGE_KEYS.COUPON_CONFIG, couponConfig);
  }, [couponConfig]);

  useEffect(() => {
    salvarDados(STORAGE_KEYS.GREETING_COUPON_CONFIG, greetingCouponConfig);
  }, [greetingCouponConfig]);

  const [couponPDVConfig, setCouponPDVConfig] = useState<CouponPDVConfig>(() => carregarDados(STORAGE_KEYS.COUPON_PDV_CONFIG, INITIAL_COUPON_PDV_CONFIG));

  useEffect(() => {
    salvarDados(STORAGE_KEYS.COUPON_PDV_CONFIG, couponPDVConfig);
  }, [couponPDVConfig]);

  useEffect(() => {
    salvarDados(STORAGE_KEYS.REGISTERED_PRINTERS, registeredPrinters);
  }, [registeredPrinters]);

  useEffect(() => {
    salvarDados(STORAGE_KEYS.SHOPKEEPERS, shopkeepers);
  }, [shopkeepers]);

  useEffect(() => {
    salvarDados(STORAGE_KEYS.SHOPKEEPER_DELIVERIES, shopkeeperDeliveries);
  }, [shopkeeperDeliveries]);

  const [labelConfig, setLabelConfig] = useState<LabelConfig>(() => carregarDados(STORAGE_KEYS.LABEL_CONFIG, {
    width: 50,
    height: 30,
    format: 'thermal',
    showProductName: true,
    showBarcode: true,
    showCodeNumber: true,
    showPrice: true,
    showPrintDate: false,
    sheetType: 'thermal',
    labelsPerSheet: 1,
    printMode: 'browser',
    printerName: '',
    profileName: 'ETIQUETAS'
  }));
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLogged, setIsLogged] = useState(false);
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(null);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>(() => carregarDados(STORAGE_KEYS.ROLES, INITIAL_ROLES));
  const [paymentMethods, setPaymentMethods] = useState<string[]>(['DINHEIRO', 'PIX', 'CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO']);
  const [paymentIcons, setPaymentIcons] = useState<Record<string, string>>(() => carregarDados(STORAGE_KEYS.PAYMENT_ICONS, DEFAULT_PAYMENT_ICONS));

  useEffect(() => {
    salvarDados(STORAGE_KEYS.PAYMENT_ICONS, paymentIcons);
  }, [paymentIcons]);

  const [customPaymentMethods, setCustomPaymentMethods] = useState<string[]>([]);
  const [hiddenPaymentMethods, setHiddenPaymentMethods] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  
  const [openSessions, setOpenSessions] = useState<Record<string, CashierSession>>({});
  
  const [cashierSession, setCashierSession] = useState<CashierSession>({
    id: '',
    isOpen: false,
    openedAt: '',
    openingBalance: 0,
    totalSales: 0,
    totalCanceled: 0,
    salesCount: 0,
    canceledCount: 0,
    salesByMethod: {}
  });

  // Sincroniza a sessão ativa na UI com a persistência por usuário
  useEffect(() => {
    if (currentUser) {
      if (cashierSession.isOpen && cashierSession.userId === currentUser.id) {
        setOpenSessions(prev => ({
          ...prev,
          [currentUser.id]: { ...cashierSession, updatedAt: Date.now() }
        }));
      } else if (!cashierSession.isOpen) {
        setOpenSessions(prev => {
          if (prev[currentUser.id]) {
            const next = { ...prev };
            delete next[currentUser.id];
            return next;
          }
          return prev;
        });
      }
    }
  }, [cashierSession, currentUser]);

  // Carrega impressoras do sistema no boot
  useEffect(() => {
    const loadSystemPrinters = async () => {
      if ((window as any).electronAPI) {
        try {
          const sysPrinters = await (window as any).electronAPI.getPrinters();
          if (sysPrinters && Array.isArray(sysPrinters)) {
            setHardwarePrinters(sysPrinters);
            const formatted: PrinterConfig[] = sysPrinters.map((p: any) => ({
              id: p.name,
              name: p.name,
              displayName: p.displayName || p.name,
              type: 'thermal',
              connection: 'usb'
            }));
            setPrinters(formatted);
          }
        } catch (err) {
          console.error("Erro ao carregar impressoras no boot:", err);
        }
      }
    };
    loadSystemPrinters();
  }, []);
  
  
// Persistence
useEffect(() => {
  const initData = async () => {
    console.log("%c[Persistência] INICIANDO CARREGAMENTO DE DADOS...", "color: #5d5dff; font-weight: bold;");
    
    // Tenta carregar do backup de arquivo primeiro (Electron)
    let backupData = await carregarBackupArquivo();
    
    const productsData = backupData?.products || carregarDados(STORAGE_KEYS.PRODUCTS, []);
    const catalogDescriptionsData = backupData?.catalogDescriptions || carregarDados(STORAGE_KEYS.CATALOG_DESCRIPTIONS, {});
    const customersData = backupData?.customers || carregarDados(STORAGE_KEYS.CUSTOMERS, []);
    const salesData = backupData?.sales || carregarDados(STORAGE_KEYS.SALES, []);
    const activitiesData = backupData?.activities || carregarDados(STORAGE_KEYS.ACTIVITIES, []);
    const categoriesData = backupData?.categories || carregarDados(STORAGE_KEYS.CATEGORIES, []);
    const subcategoriesData = backupData?.subcategories || carregarDados(STORAGE_KEYS.SUBCATEGORIES, []);
    const deliveryChannelsData = backupData?.delivery_channels || carregarDados(STORAGE_KEYS.DELIVERY_CHANNELS, [
      { id: 'pdv', name: 'PDV' }
    ]);

    // Ensure at least PDV exists
    if (deliveryChannelsData.length === 0 || !deliveryChannelsData.find((d: any) => d.name === 'PDV' || d.id === 'pdv')) {
      deliveryChannelsData.push({ id: 'pdv', name: 'PDV' });
    }
    const deliveryMethodsData = backupData?.delivery_methods || carregarDados(STORAGE_KEYS.DELIVERY_METHODS, []);
    const closedSessionsData = backupData?.closed_sessions || carregarDados(STORAGE_KEYS.CLOSED_SESSIONS, []);
    const usersData = backupData?.users || carregarDados(STORAGE_KEYS.USERS, []);
    const rolesData = backupData?.roles || carregarDados(STORAGE_KEYS.ROLES, INITIAL_ROLES);
    
    // Ensure default roles exist and have correct permissions
    const mergedRoles = [...rolesData];
    INITIAL_ROLES.forEach(initRole => {
      if (!mergedRoles.find(r => r.id === initRole.id)) {
        mergedRoles.push(initRole);
      }
    });

    const paymentMethodsData = (backupData?.paymentMethods || carregarDados(STORAGE_KEYS.PAYMENT_METHODS, ['DINHEIRO', 'PIX', 'CARTÃO DE CRÉDITO', 'CARTÃO DE DÉBITO'])).filter((m: string) => m !== 'OUTROS');
    const customPaymentMethodsData = (backupData?.customPaymentMethods || carregarDados(STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, [])).filter((m: string) => m !== 'OUTROS');
    const hiddenPaymentMethodsData = backupData?.hiddenPaymentMethods || carregarDados(STORAGE_KEYS.HIDDEN_PAYMENT_METHODS, []);
    const printersData = backupData?.printers || carregarDados(STORAGE_KEYS.PRINTERS, []);
    let finalPrinters = printersData.filter((p: any) => 
      !p.name.includes('Impressora Balcão') && 
      !p.name.includes('Impressora Cozinha')
    );
    
    // Carrega impressoras reais do sistema se estiver no Electron
    if ((window as any).electronAPI) {
      try {
        const sysPrinters = await (window as any).electronAPI.getPrinters();
        if (sysPrinters && Array.isArray(sysPrinters)) {
          setHardwarePrinters(sysPrinters);
        }
      } catch (err) {
        console.error("Erro ao carregar hardware no init:", err);
      }
    }

    const companyData = backupData?.company || carregarDados(STORAGE_KEYS.COMPANY_INFO, {
      name: '', tradeName: '', slogan: '', idNumber: '', stateRegistration: '', email: '', website: '', address: { logradouro: '', cep: '', numero: '', bairro: '', cidade: '', estado: '' }, pix: '', phone: ''
    });
    
    const couponConfigData = backupData?.couponConfig || carregarDados(STORAGE_KEYS.COUPON_CONFIG, {
      format: '80mm',
      headerMessage: 'CUPOM DE VENDA',
      footerMessage: 'Obrigado pela preferência!',
      showLogo: true,
      showCompanyName: true,
      showCompanyId: true,
      showCompanyAddress: true,
      showCustomerName: true,
      showCustomerId: true,
      showCustomerPhone: true,
      showCustomerAddress: true,
      showCustomerCep: true,
      showItemName: true,
      showItemQty: true,
      showItemPrice: true,
      showItemUnitPrice: true,
      showItemSubtotal: true,
      showDiscounts: true,
      showFinalTotal: true,
      showPaymentMethod: true,
      showChange: true,
      showOrderNumber: true,
      showDateTime: true,
    });
    
    const revenuesData = backupData?.revenues || carregarDados(STORAGE_KEYS.REVENUES, []);
    const purchasesData = backupData?.purchases || carregarDados(STORAGE_KEYS.PURCHASES, []);
    const expensesData = backupData?.expenses || carregarDados(STORAGE_KEYS.EXPENSES, []);
    const rawMaterialsStructuredData = backupData?.rawMaterialsStructured || carregarDados(STORAGE_KEYS.RAW_MATERIALS, []);
    const productRecipesData = backupData?.productRecipes || carregarDados(STORAGE_KEYS.PRODUCT_RECIPES, []);
    const shopkeepersData = backupData?.shopkeepers || carregarDados(STORAGE_KEYS.SHOPKEEPERS, []);
    const shopkeeperDeliveriesData = backupData?.shopkeeperDeliveries || carregarDados(STORAGE_KEYS.SHOPKEEPER_DELIVERIES, []);
    const galleryData = backupData?.gallery || carregarDados(STORAGE_KEYS.GALLERY, []);

    setRevenues(revenuesData);
    setPurchases(purchasesData);
    setExpenses(expensesData);
    setRawMaterialsStructured(rawMaterialsStructuredData);
    setProductRecipes(productRecipesData);
    
    const labelConfigData = backupData?.labelConfig || carregarDados(STORAGE_KEYS.LABEL_CONFIG, {
      format: '50x30', showBarcode: true, showCodeNumber: true, showPrice: true, showDate: true, printMode: 'browser'
    });
    
    const cashierSessionData = backupData?.cashierSession || carregarDados(STORAGE_KEYS.CASHIER_SESSION, {
      id: '', isOpen: false, openedAt: '', openingBalance: 0, totalSales: 0, totalCanceled: 0, salesCount: 0, canceledCount: 0, salesByMethod: {}
    });
    
    const openSessionsData = backupData?.openSessions || carregarDados(STORAGE_KEYS.OPEN_SESSIONS, {});

    const selectedPrinterData = backupData?.selectedPrinter || carregarDados(STORAGE_KEYS.SELECTED_PRINTER, '');
    const selectedLabelPrinterData = backupData?.selectedLabelPrinter || carregarDados(STORAGE_KEYS.SELECTED_LABEL_PRINTER, '');

    setProducts(productsData);
    setCatalogDescriptions(catalogDescriptionsData);
    setCustomers(customersData);
    setSales(salesData);
    setActivities(activitiesData);
    setCategories(categoriesData);
    setSubcategories(subcategoriesData);
    setDeliveryChannels(deliveryChannelsData);
    setDeliveryMethods(deliveryMethodsData);
    setClosedSessions(closedSessionsData);
    setUsers(usersData);
    setShopkeepers(shopkeepersData);
    setShopkeeperDeliveries(shopkeeperDeliveriesData);
    
    // Auto-cleanup for inactive users (> 15 days)
    const now = new Date();
    const fifteenDaysInMs = 15 * 24 * 60 * 60 * 1000;
    const finalUsers = usersData.filter((u: SystemUser) => {
      if (!u.isActive && u.deactivatedAt) {
        const deactivationDate = new Date(u.deactivatedAt);
        if (now.getTime() - deactivationDate.getTime() > fifteenDaysInMs) {
          console.log(`[Segurança] Usuário ${u.name} excluído automaticamente por inatividade.`);
          return false;
        }
      }
      return true;
    });
    if (finalUsers.length !== usersData.length) {
      setUsers(finalUsers);
    }

    setRoles(mergedRoles);
    setPaymentMethods(paymentMethodsData);
    setCustomPaymentMethods(customPaymentMethodsData);
    setHiddenPaymentMethods(hiddenPaymentMethodsData);
    setPrinters(finalPrinters);
    setSelectedPrinter(selectedPrinterData);
    setSelectedLabelPrinter(selectedLabelPrinterData);
    setCompany(companyData);
    setCouponConfig(couponConfigData);
    setLabelConfig(labelConfigData);
    setCashierSession(cashierSessionData);
    setOpenSessions(openSessionsData);
    setSelectedPrinter(selectedPrinterData);

    console.log("CARREGANDO DADOS");
    setIsLoaded(true);
  };

  initData();
}, []);

// Ensure "Em mãos" delivery method exists
useEffect(() => {
  if (isLoaded) {
    if (deliveryMethods.length > 0) {
      if (!deliveryMethods.find(m => m.name.toUpperCase() === 'EM MÃOS')) {
        setDeliveryMethods(prev => [{ id: 'em-maos', name: 'Em mãos', isActive: true }, ...prev]);
      }
    } else {
      setDeliveryMethods([{ id: 'em-maos', name: 'Em mãos', isActive: true }]);
    }
  }
}, [isLoaded, deliveryMethods.length]);

useEffect(() => {
  if (!isLoaded) return;

  const saveAll = async () => {
    console.log("SALVANDO DADOS");
    
    // Salva no LocalStorage
    salvarDados(STORAGE_KEYS.PRODUCTS, products);
    salvarDados(STORAGE_KEYS.CUSTOMERS, customers);
    salvarDados(STORAGE_KEYS.SALES, sales);
    salvarDados(STORAGE_KEYS.ACTIVITIES, activities);
    salvarDados(STORAGE_KEYS.CATEGORIES, categories);
    salvarDados(STORAGE_KEYS.SUBCATEGORIES, subcategories);
    salvarDados(STORAGE_KEYS.DELIVERY_CHANNELS, deliveryChannels);
    salvarDados(STORAGE_KEYS.DELIVERY_METHODS, deliveryMethods);
    salvarDados(STORAGE_KEYS.CLOSED_SESSIONS, closedSessions);
    salvarDados(STORAGE_KEYS.USERS, users);
    salvarDados(STORAGE_KEYS.ROLES, roles);
    salvarDados(STORAGE_KEYS.PAYMENT_METHODS, paymentMethods);
    salvarDados(STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, customPaymentMethods);
    salvarDados(STORAGE_KEYS.HIDDEN_PAYMENT_METHODS, hiddenPaymentMethods);
    salvarDados(STORAGE_KEYS.PRINTERS, printers);
    salvarDados(STORAGE_KEYS.COMPANY_INFO, company);
    salvarDados(STORAGE_KEYS.COUPON_CONFIG, couponConfig);
    salvarDados(STORAGE_KEYS.LABEL_CONFIG, labelConfig);
    salvarDados(STORAGE_KEYS.CASHIER_SESSION, cashierSession);
    salvarDados(STORAGE_KEYS.SELECTED_PRINTER, selectedPrinter);
    salvarDados(STORAGE_KEYS.SELECTED_LABEL_PRINTER, selectedLabelPrinter);
    salvarDados(STORAGE_KEYS.REVENUES, revenues);
    salvarDados(STORAGE_KEYS.PURCHASES, purchases);
    salvarDados(STORAGE_KEYS.EXPENSES, expenses);
    salvarDados(STORAGE_KEYS.RAW_MATERIALS, rawMaterialsStructured);
    salvarDados(STORAGE_KEYS.PRODUCT_RECIPES, productRecipes);
    salvarDados(STORAGE_KEYS.GALLERY, gallery);

    // Salva Backup em Arquivo (Electron)
    const backupObj = {
      products, customers, sales, activities, categories, subcategories,
      delivery_channels: deliveryChannels, 
      delivery_methods: deliveryMethods,
      closed_sessions: closedSessions,
      users, roles, paymentMethods,
      customPaymentMethods, hiddenPaymentMethods, printers, company, couponConfig, labelConfig,
      cashierSession, openSessions, selectedPrinter, selectedLabelPrinter,
      revenues, purchases, expenses, rawMaterialsStructured, productRecipes,
      gallery
    };
    await salvarBackupArquivo(backupObj);
  };

  saveAll();
}, [
  isLoaded, products, customers, sales, activities, categories, subcategories, 
  deliveryChannels, deliveryMethods, closedSessions, users, roles, paymentMethods, customPaymentMethods, hiddenPaymentMethods,
  printers, company, couponConfig, labelConfig, cashierSession, openSessions, selectedPrinter, selectedLabelPrinter,
  revenues, purchases, expenses, rawMaterialsStructured, productRecipes, gallery
]);

  const calculateProductCost = (productId: string) => {
    const recipe = productRecipes.find(r => r.productId === productId);
    if (!recipe) {
      const product = products.find(p => p.id === productId);
      return product?.costPrice || 0;
    }

    return recipe.ingredients.reduce((total, ing) => {
      const material = rawMaterialsStructured.find(m => m.id === ing.rawMaterialId);
      if (!material) return total;
      return total + (ing.quantity * material.unitCost);
    }, 0);
  };

  const createRevenueForSale = (sale: Sale) => {
    const paymentGroups: Record<string, number> = {};
    const revenuesToCreate: Revenue[] = [];

    if (sale.payments && sale.payments.length > 0) {
      // Group to identify multiples of the same method
      sale.payments.forEach((p) => {
        paymentGroups[p.method] = (paymentGroups[p.method] || 0) + 1;
      });

      const currentCounts: Record<string, number> = {};
      
      sale.payments.forEach((p) => {
        currentCounts[p.method] = (currentCounts[p.method] || 0) + 1;
        
        let methodDisplayName = p.method;
        // Add index only if there are multiples and it's not cash
        if (p.method !== 'DINHEIRO' && paymentGroups[p.method] > 1) {
          methodDisplayName = `${p.method} ${currentCounts[p.method]}`;
        }

        revenuesToCreate.push({
          id: crypto.randomUUID(),
          saleId: sale.id,
          amount: p.amount,
          paymentMethod: methodDisplayName,
          status: 'pendente',
          date: new Date(sale.date).toISOString(),
          updatedAt: Date.now(),
          userId: currentUser?.id,
          userName: currentUser?.name
        });
      });
    } else {
      // Fallback for backward compatibility
      revenuesToCreate.push({
        id: crypto.randomUUID(),
        saleId: sale.id,
        amount: sale.total,
        paymentMethod: sale.paymentMethod,
        status: 'pendente',
        date: new Date(sale.date).toISOString(),
        updatedAt: Date.now(),
        userId: currentUser?.id,
        userName: currentUser?.name
      });
    }

    setRevenues(prev => [...prev, ...revenuesToCreate]);
  };

  const addSaleToCashier = (sale: Sale) => {
    if (cashierSession.isOpen) {
      const updated = {
        ...cashierSession,
        totalSales: cashierSession.totalSales + sale.total,
        salesCount: cashierSession.salesCount + 1,
        salesByMethod: {
          ...cashierSession.salesByMethod,
          [sale.paymentMethod]: (cashierSession.salesByMethod[sale.paymentMethod] || 0) + sale.total
        },
        updatedAt: Date.now()
      };
      setCashierSession(updated);
    }
  };

  const addCancellationToCashier = (amount: number) => {
    if (cashierSession.isOpen) {
      const updated = {
        ...cashierSession,
        totalCanceled: cashierSession.totalCanceled + amount,
        canceledCount: cashierSession.canceledCount + 1,
        updatedAt: Date.now()
      };
      setCashierSession(updated);
    }
  };

  const handleLogin = () => {
    if (loginUsername.toUpperCase() === 'ADM' && loginPassword === '1234') {
      const adminUser: SystemUser = {
        id: 'admin',
        username: 'ADM',
        name: 'Administrador',
        roleId: 'role-gerente'
      };
      setCurrentUser(adminUser);
      setIsLogged(true);

      // Carrega sessão de caixa do usuário se existir
      const session = openSessions[adminUser.id];
      if (session && session.isOpen) {
        setCashierSession(session);
      } else {
        setCashierSession({
          id: '', isOpen: false, openedAt: '', openingBalance: 0, totalSales: 0, totalCanceled: 0, salesCount: 0, canceledCount: 0, salesByMethod: {}
        });
      }
      return;
    }

    const user = users.find(u => u.username.toUpperCase() === loginUsername.toUpperCase() && u.password === loginPassword);
    if (user) {
      if (user.isActive === false) {
        alert('Usuário inativo. Entre em contato com o administrador.');
        return;
      }
      setCurrentUser(user);
      setIsLogged(true);
      addActivity('auth', 'Login Realizado', `O usuário ${user.name} acessou o sistema.`);

      // Carrega sessão de caixa do usuário se existir
      const session = openSessions[user.id];
      if (session && session.isOpen) {
        setCashierSession(session);
      } else {
        setCashierSession({
          id: '', isOpen: false, openedAt: '', openingBalance: 0, totalSales: 0, totalCanceled: 0, salesCount: 0, canceledCount: 0, salesByMethod: {}
        });
      }
    } else {
      alert('Credenciais Incorretas!');
    }
  };

  const handleLogout = () => {
    setIsLogged(false);
    
    // Salva o estado do caixa atual na lista de sessões abertas antes de sair
    if (currentUser) {
      addActivity('auth', 'Logout Realizado', `O usuário ${currentUser.name} saiu do sistema.`);
      
      if (cashierSession.isOpen) {
        setOpenSessions(prev => ({
          ...prev,
          [currentUser.id]: { ...cashierSession, updatedAt: Date.now() }
        }));
      } else {
        setOpenSessions(prev => {
          const next = { ...prev };
          delete next[currentUser.id];
          return next;
        });
      }
    }

    setCurrentUser(null);
    setCashierSession({
      id: '', isOpen: false, openedAt: '', openingBalance: 0, totalSales: 0, totalCanceled: 0, salesCount: 0, canceledCount: 0, salesByMethod: {}
    });
    setLoginUsername('');
    setLoginPassword('');
    setView('dashboard');
  };

  const getUserPermissions = () => {
    if (!currentUser) return DEFAULT_PERMISSIONS;
    if (currentUser.id === 'admin') {
      return {
        dashboard: 'total',
        pdv: 'total',
        separacao: 'total',
        estoque: 'total',
        financeiro: 'total',
        historico: 'total',
        consultarPedido: 'total',
        customerExperience: 'total',
        ajustes: 'total',
        lojistas: 'total',
        devolucao: 'total',
      } as ModulePermissions;
    }
    const role = roles.find(r => r.id === currentUser.roleId);
    return role ? role.permissions : DEFAULT_PERMISSIONS;
  };

  const canAccess = (module: keyof ModulePermissions) => {
    return getUserPermissions()[module] !== 'nenhum';
  };

  const canEdit = (module: keyof ModulePermissions) => {
    return getUserPermissions()[module] === 'total';
  };

  const menuItems = [
    { id: 'pos', icon: ShoppingBag, label: 'PDV / VENDAS', color: 'bg-[#5d5dff] text-zinc-100 shadow-lg shadow-blue-900/20', module: 'pdv' },
    { id: 'consultar-pedido', icon: Search, label: 'CONSULTAR PEDIDO', color: 'bg-sky-600 text-zinc-100 shadow-lg shadow-sky-900/20', module: 'consultarPedido' },
    { id: 'customer-experience', icon: Star, label: 'EXP. CLIENTE', color: 'bg-amber-600 text-zinc-100 shadow-lg shadow-amber-900/20', module: 'customerExperience' },
    { id: 'catalog', icon: LayoutGrid, label: 'CATÁLOGO', color: 'bg-pink-600 text-zinc-100 shadow-lg shadow-pink-900/20', module: 'pdv' },
    { id: 'summary', icon: LayoutDashboard, label: 'DASHBOARD', color: 'bg-zinc-800 text-indigo-400', module: 'dashboard' },
    { id: 'sales-history', icon: History, label: 'HISTÓRICO', color: 'bg-zinc-800 text-indigo-400', module: 'historico' },
    { id: 'payments', icon: CreditCard, label: 'PAGAMENTOS', color: 'bg-zinc-800 text-teal-400', module: 'financeiro' },
    { id: 'add-product', icon: Package, label: 'ESTOQUE', color: 'bg-emerald-600 text-zinc-100 shadow-lg shadow-emerald-900/20', module: 'estoque' },
    { id: 'lojistas', icon: Store, label: 'LOJISTAS', color: 'bg-zinc-800 text-purple-400', module: 'lojistas' },
    { id: 'add-customer', icon: UserPlus, label: '+ CLIENTE', color: 'bg-zinc-800 text-indigo-400', module: 'pdv' },
    { id: 'delivery', icon: Truck, label: '+ ENTREGA', color: 'bg-zinc-800 text-emerald-400', module: 'pdv' },
    { id: 'cashier', icon: Calculator, label: cashierSession.isOpen ? 'FECHAR CAIXA' : 'ABRIR CAIXA', color: cashierSession.isOpen ? 'bg-red-900/40 text-red-400' : 'bg-zinc-800 text-sky-400', module: 'pdv' },
    { id: 'historico_caixa', icon: History, label: 'HISTÓRICO CAIXA', color: 'bg-zinc-800 text-amber-400', module: 'ajustes' },
    { id: 'auditoria', icon: ShieldCheck, label: 'AUDITORIA', color: 'bg-zinc-800 text-red-400', module: 'ajustes' },
    { id: 'returns', icon: RotateCcw, label: 'DEVOLUÇÃO', color: 'bg-red-600 text-zinc-100 shadow-lg shadow-red-900/20', module: 'devolucao' },
  ].filter(item => {
    if (item.id === 'historico_caixa' || item.id === 'auditoria') {
      const isAdmin = currentUser?.id === 'admin';
      return isAdmin;
    }
    return canAccess(item.module as keyof ModulePermissions);
  });

  const permissions = getUserPermissions();

  const adjustItem = { id: 'adjust', icon: Store, label: 'AJUSTE', color: 'bg-zinc-800 text-orange-400', module: 'ajustes' };
  const financeItem = { id: 'finance', icon: BadgeDollarSign, label: 'FINANCEIRO', color: 'bg-zinc-800 text-green-400', module: 'financeiro' };
  const separationItem = { id: 'separation', icon: Handshake, label: 'SEPARAÇÃO', color: 'bg-zinc-800 text-orange-400', module: 'separacao' };

  return (
    <div className="w-full max-w-7xl mx-auto md:px-4 md:py-8 py-4 px-2 min-h-screen flex flex-col items-center relative overflow-x-hidden">
      
      {/* Mobile Header / Top Bar */}
      {isLogged && (
        <div className="w-full mb-6 px-4 md:px-0 flex justify-between items-center bg-white p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] sticky top-2 z-50 transition-all">
          <div className="flex items-center gap-3 overflow-hidden ml-2">
             {company.logo && <img src={company.logo} className="w-8 h-8 object-contain shrink-0" alt="Logo" />}
             <div className="flex flex-col">
               <h1 className="text-[10px] font-black uppercase text-black truncate max-w-[150px] leading-tight">{company.name}</h1>
               <div className="flex items-center gap-1.5 leading-none">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></div>
                  <span className="text-[8px] font-black text-black opacity-60 uppercase tracking-widest">Sistema Ativo</span>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-3 bg-white text-black border-2 border-black rounded-xl hover:bg-zinc-100 active:translate-y-0.5 active:translate-x-0.5 transition-all flex items-center gap-2 md:px-4"
            >
              <LayoutDashboard size={18} />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Navegação</span>
            </button>
            <button 
              onClick={() => setIsRightDrawerOpen(true)}
              className="p-3 bg-[#5d5dff] text-white border-2 border-black rounded-xl hover:bg-[#4a4aff] active:translate-y-0.5 active:translate-x-0.5 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] flex items-center gap-2 md:px-4"
            >
              <LayoutGrid size={18} />
              <span className="hidden md:inline text-[10px] font-black uppercase tracking-widest">Gerenciar</span>
            </button>
          </div>
        </div>
      )}

      {/* Mobile Sidebar Menu Drawer (Main functionality) */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[110] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-72 bg-[#FFDE2E] h-full border-l-4 border-black p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-black">Navegação</h3>
                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2 text-black hover:bg-white/20 rounded-lg">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                <button 
                   onClick={() => { setView('dashboard'); setIsMobileMenuOpen(false); }}
                   className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 border-black ${view === 'dashboard' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.3)]' : 'bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <LayoutDashboard size={20} />
                  <span className="text-xs font-black uppercase tracking-widest">Painel Início</span>
                </button>

                <div className="h-1 bg-black my-2 opacity-10" />

                {menuItems.map(item => (
                  <button 
                    key={item.id}
                    onClick={() => { setView(item.id as View); setIsMobileMenuOpen(false); }}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all border-2 border-black ${view === item.id ? 'bg-[#5d5dff] text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <item.icon size={20} />
                    <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Right Drawer (Settings, Finance, Separation, Logout) */}
      <AnimatePresence>
        {isRightDrawerOpen && (
          <div className="fixed inset-0 z-[120] flex justify-end">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setIsRightDrawerOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 bg-[#FFDE2E] h-full border-l-4 border-black p-8 flex flex-col gap-8 shadow-2xl overflow-y-auto no-scrollbar"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black mb-1">Painel de Controle</h3>
                  <p className="text-[9px] font-black text-blue-600 uppercase tracking-widest">Opções do Sistema</p>
                </div>
                <button 
                  onClick={() => setIsRightDrawerOpen(false)} 
                  className="p-3 bg-black text-white rounded-2xl transition-all hover:scale-110 active:scale-95 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.3)]"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                {canAccess('ajustes') && (
                  <button 
                    onClick={() => { setView('adjust'); setIsRightDrawerOpen(false); }}
                    className={`flex items-center gap-5 p-5 rounded-3xl transition-all group border-2 border-black ${view === 'adjust' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-white text-black hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all border-2 border-black ${view === 'adjust' ? 'bg-orange-500 text-white' : 'bg-zinc-100 text-black group-hover:bg-orange-500 group-hover:text-white'}`}>
                      <adjustItem.icon size={22} />
                    </div>
                    <div className="flex flex-col items-start translate-y-[1px]">
                      <span className="text-xs font-black uppercase tracking-widest">Ajustes</span>
                      <span className="text-[8px] font-bold uppercase tracking-tight opacity-60">Configurações Gerais</span>
                    </div>
                  </button>
                )}

                {currentUser?.id === 'admin' && (
                  <button 
                    onClick={() => { setView('auditoria'); setIsRightDrawerOpen(false); }}
                    className={`flex items-center gap-5 p-5 rounded-3xl transition-all group border-2 border-black ${view === 'auditoria' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-white text-black hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all border-2 border-black ${view === 'auditoria' ? 'bg-red-500 text-white' : 'bg-zinc-100 text-black group-hover:bg-red-500 group-hover:text-white'}`}>
                      <ShieldCheck size={22} />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-black uppercase tracking-widest leading-none mb-1">AUDITORIA</span>
                      <span className="text-[8px] font-bold opacity-60 uppercase tracking-tight">Gestão de Usuários</span>
                    </div>
                  </button>
                )}

                {canAccess('financeiro') && (
                  <button 
                    onClick={() => { setView('finance'); setIsRightDrawerOpen(false); }}
                    className={`flex items-center gap-5 p-5 rounded-3xl transition-all group border-2 border-black ${view === 'finance' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-white text-black hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all border-2 border-black ${view === 'finance' ? 'bg-green-500 text-white' : 'bg-zinc-100 text-black group-hover:bg-green-500 group-hover:text-white'}`}>
                      <financeItem.icon size={22} />
                    </div>
                    <div className="flex flex-col items-start translate-y-[1px]">
                      <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
                      <span className="text-[8px] font-bold uppercase tracking-tight opacity-60">Caixa e Receitas</span>
                    </div>
                  </button>
                )}

                {canAccess('separacao') && (
                  <button 
                    onClick={() => { setView('separation'); setIsRightDrawerOpen(false); }}
                    className={`flex items-center gap-5 p-5 rounded-3xl transition-all group border-2 border-black ${view === 'separation' ? 'bg-black text-white shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-white text-black hover:bg-zinc-50 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}`}
                  >
                    <div className={`p-3 rounded-2xl transition-all border-2 border-black ${view === 'separation' ? 'bg-blue-500 text-white' : 'bg-zinc-100 text-black group-hover:bg-blue-500 group-hover:text-white'}`}>
                      <separationItem.icon size={22} />
                    </div>
                    <div className="flex flex-col items-start translate-y-[1px]">
                      <span className="text-xs font-black uppercase tracking-widest">Separação</span>
                      <span className="text-[8px] font-bold uppercase tracking-tight opacity-60">Logística de Pedidos</span>
                    </div>
                  </button>
                )}

                <div className="h-1 bg-black my-4 opacity-10" />

                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-5 p-5 rounded-3xl bg-red-500 text-white border-2 border-black transition-all group shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5"
                >
                  <div className="p-3 bg-white text-red-500 rounded-2xl border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                    <Zap size={22} />
                  </div>
                  <div className="flex flex-col items-start translate-y-[1px]">
                    <span className="text-xs font-black uppercase tracking-widest">Sair</span>
                    <span className="text-[8px] font-bold uppercase tracking-tight opacity-90 group-hover:opacity-100">Encerrar Sessão</span>
                  </div>
                </button>
              </div>

              <div className="mt-auto p-6 bg-white rounded-3xl border-2 border-black text-center space-y-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 <p className="text-[10px] font-black text-black uppercase tracking-widest">Versão do Sistema</p>
                 <p className="text-[9px] font-bold text-black opacity-60 uppercase">v{APP_VERSION} • Produção Local</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {!isLogged ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#FFDE2E] p-4">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-10 rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black max-w-sm w-full space-y-8 flex flex-col items-center">
             <div className="w-24 h-24 bg-[#FFDE2E] rounded-full flex items-center justify-center text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <ShieldCheck size={42} />
             </div>
             <div className="text-center space-y-1">
                <h2 className="text-2xl font-black text-black uppercase tracking-tighter">Acesso Restrito</h2>
                <p className="text-[10px] font-bold text-black opacity-60 uppercase tracking-widest leading-none">Insira as Credenciais</p>
             </div>
             <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }} className="w-full space-y-4">
                <Input label="USUÁRIO" value={loginUsername} onChange={setLoginUsername} placeholder="ADM" />
                <Input label="Senha" value={loginPassword} onChange={setLoginPassword} type="password" placeholder="****" />
                <button 
                  type="submit"
                  className="w-full bg-[#FFDE2E] text-black p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5 active:translate-x-0.5"
                >
                  Entrar no Sistema
                </button>
             </form>
             <p className="text-[8px] font-black text-black opacity-30 uppercase tracking-widest pt-4">Padrão: ADM / 1234</p>
          </motion.div>
        </div>
      ) : null}

      {/* Logo Section */}
      {view === 'dashboard' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 md:mb-16 space-y-2 flex flex-col items-center w-full"
        >
          {company.logo ? (
            <div className="relative inline-block mb-4">
              <div className="absolute inset-0 bg-[#5d5dff]/5 rounded-full blur-3xl" />
              <img 
                src={company.logo} 
                alt="Logo" 
                className="relative max-h-24 md:max-h-32 w-auto mx-auto object-contain" 
              />
            </div>
          ) : null}
          <h2 className="text-xl md:text-2xl font-black font-display tracking-tight text-[#1A1A1A] uppercase">
            {company.name}
          </h2>
          <p className="text-[8px] md:text-[10px] font-black tracking-[0.4em] text-[#5d5dff] uppercase">
            {company.slogan}
          </p>
        </motion.div>
      )}

      {/* Main Content Area */}
      <AnimatePresence mode="wait">
        {view === 'dashboard' ? (
          <motion.div 
            key="dashboard"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] sm:grid-cols-[repeat(auto-fit,minmax(140px,1fr))] md:grid-cols-6 gap-x-4 md:gap-x-6 gap-y-6 md:gap-y-12 w-full px-2 md:px-4 justify-items-center"
          >
            {menuItems.map((item) => (
              <button
                id={`menu-${item.id}`}
                key={item.id}
                onClick={() => setView(item.id as View)}
                className="flex flex-col items-center group cursor-pointer transition-transform duration-200"
              >
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl flex items-center justify-center mb-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all group-hover:translate-y-[-4px] group-hover:translate-x-[-4px] group-hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] group-active:translate-y-0 group-active:translate-x-0 group-active:shadow-none ${item.color.replace('shadow-lg', '').replace('shadow-blue-500/40', '')}`}>
                  <item.icon size={36} />
                </div>
                <span className="text-[11px] font-black tracking-widest text-black group-hover:text-[#5d5dff] transition-colors text-center leading-tight uppercase">
                  {item.label}
                </span>
              </button>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="sub-view"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full bg-white rounded-[2.5rem] shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black overflow-hidden"
          >
            <div className="p-4 md:p-6 border-b-4 border-black bg-[#FFDE2E] flex items-center justify-between">
              {!isScanning && (
                <button 
                  onClick={() => setView('dashboard')}
                  className="p-3 md:p-2 bg-black text-white rounded-xl transition-all hover:scale-110 active:scale-95 flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                >
                  <ChevronLeft size={24} />
                </button>
              )}
              {isScanning && <div className="w-10"></div>}
              <h3 className="text-xs md:text-lg font-black uppercase tracking-[0.2em] md:tracking-widest text-black/80 truncate px-2">
                {menuItems.find(m => m.id === view)?.label || view.replace(/-/g, ' ')}
              </h3>
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-3 bg-black text-white rounded-xl shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              >
                <LayoutGrid size={20} />
              </button>
              <div className="hidden md:block w-10"></div>
            </div>

            <div className="p-4 md:p-6 min-h-[400px]">
              {view === 'add-product' && permissions.estoque !== 'nenhum' && (
                <ProductView 
                  products={products} 
                  setProducts={setProducts} 
                  setView={setView} 
                  categories={categories}
                  setCategories={setCategories}
                  subcategories={subcategories}
                  setSubcategories={setSubcategories}
                  addActivity={addActivity}
                  labelConfig={labelConfig}
                  imprimirEtiqueta={imprimirEtiqueta}
                  calculateProductCost={calculateProductCost}
                  currentUser={currentUser}
                  canEdit={permissions.estoque === 'total'}
                  catalogDescriptions={catalogDescriptions}
                  setCatalogDescriptions={setCatalogDescriptions}
                  gallery={gallery}
                  setGallery={setGallery}
                />
              )}
              {view === 'movement' && permissions.historico !== 'nenhum' && (
                <ActivityView 
                  activities={activities}
                  sales={sales} 
                  products={products} 
                  customers={customers}
                  company={company}
                  couponConfig={couponConfig}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  onCancelSale={(saleId) => {
                    const sale = sales.find(s => s.id === saleId);
                    if (sale && confirm('Deseja realmente CANCELAR esta venda? Esta ação não pode ser desfeita.')) {
                      const updatedAt = Date.now();
                      setSales((prev: any) => prev.map((s: any) => s.id === saleId ? { ...s, status: 'cancelado', updatedAt } : s));
                      addCancellationToCashier(sale.total);
                      addActivity('sale', 'Venda Cancelada', `Venda #${sale.sequentialId || sale.id.substring(0, 8)} de R$ ${sale.total.toFixed(2)} foi cancelada.`);
                    }
                  }}
                  canEdit={permissions.historico === 'total'}
                  currentUser={currentUser}
                  paymentIcons={paymentIcons}
                />
              )}
              {view === 'sales-history' && permissions.historico !== 'nenhum' && (
                <ActivityView 
                  activities={activities}
                  sales={sales} 
                  products={products} 
                  customers={customers}
                  company={company}
                  couponConfig={couponConfig}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  onCancelSale={(saleId) => {
                    const sale = sales.find(s => s.id === saleId);
                    if (sale && confirm('Deseja realmente CANCELAR esta venda?')) {
                      const updatedAt = Date.now();
                      setSales((prev: any) => prev.map((s: any) => s.id === saleId ? { ...s, status: 'cancelado', updatedAt } : s));
                      addCancellationToCashier(sale.total);
                      addActivity('sale', 'Venda Cancelada', `Venda #${sale.sequentialId || sale.id.substring(0, 8)} de R$ ${sale.total.toFixed(2)} foi cancelada.`);
                    }
                  }}
                  canEdit={permissions.historico === 'total'}
                  currentUser={currentUser}
                  paymentIcons={paymentIcons}
                />
              )}
              {view === 'pos' && permissions.pdv !== 'nenhum' && (
                <POSView 
                  sales={sales}
                  products={products} 
                  setSales={setSales} 
                  setProducts={setProducts} 
                  paymentMethods={paymentMethods} 
                  paymentIcons={paymentIcons}
                  addActivity={addActivity}
                  cashierSession={cashierSession}
                  addSaleToCashier={addSaleToCashier}
                  customers={customers}
                  setCustomers={setCustomers}
                  deliveryChannels={deliveryChannels}
                  setDeliveryChannels={setDeliveryChannels}
                  deliveryMethods={deliveryMethods}
                  company={company}
                  couponConfig={couponConfig}
                  setView={setView}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  calculateProductCost={calculateProductCost}
                  createRevenueForSale={createRevenueForSale}
                  goldCustomerIds={goldCustomerIds}
                  currentUser={currentUser}
                  canEdit={permissions.pdv === 'total'}
                  gallery={gallery}
                  setGallery={setGallery}
                />
              )}
              {view === 'separation' && permissions.separacao !== 'nenhum' && (
                <SeparationView 
                  sales={sales}
                  setSales={setSales}
                  products={products}
                  setProducts={setProducts}
                  addActivity={addActivity}
                  customers={customers}
                  deliveryChannels={deliveryChannels}
                  deliveryMethods={deliveryMethods}
                  revenues={revenues}
                  setRevenues={setRevenues}
                  currentUser={currentUser}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  setIsScanning={setIsScanning}
                  canEdit={permissions.separacao === 'total'}
                />
              )}
              {view === 'returns' && permissions.devolucao !== 'nenhum' && (
                <ReturnsView 
                  sales={sales}
                  products={products}
                  customers={customers}
                  onConfirmReturn={handleConfirmReturn}
                />
              )}
              {view === 'lojistas' && permissions.lojistas !== 'nenhum' && (
                <ShopkeeperView 
                  shopkeepers={shopkeepers}
                  setShopkeepers={setShopkeepers}
                  deliveries={shopkeeperDeliveries}
                  setDeliveries={setShopkeeperDeliveries}
                  products={products}
                  setProducts={setProducts}
                  addActivity={addActivity}
                  canEdit={permissions.lojistas === 'total'}
                  company={company}
                  sales={sales}
                  setSales={setSales}
                  revenues={revenues}
                  setRevenues={setRevenues}
                  addSaleToCashier={addSaleToCashier}
                  currentUser={currentUser}
                />
              )}
              {view === 'finance' && permissions.financeiro !== 'nenhum' && (
                <FinanceView 
                  revenues={revenues}
                  setRevenues={setRevenues}
                  purchases={purchases}
                  setPurchases={setPurchases}
                  expenses={expenses}
                  setExpenses={setExpenses}
                  rawMaterials={rawMaterialsStructured}
                  setRawMaterials={setRawMaterialsStructured}
                  productRecipes={productRecipes}
                  setProductRecipes={setProductRecipes}
                  products={products}
                  addActivity={addActivity}
                  setView={setView}
                  canEdit={permissions.financeiro === 'total'}
                  currentUser={currentUser}
                  paymentIcons={paymentIcons}
                />
              )}
               {view === 'delivery' && permissions.pdv !== 'nenhum' && (
                <DeliveryView 
                  sales={sales}
                  deliveryChannels={deliveryChannels}
                  deliveryMethods={deliveryMethods}
                  setDeliveryMethods={setDeliveryMethods}
                  products={products}
                  customers={customers}
                  company={company}
                  couponConfig={couponConfig}
                  addActivity={addActivity}
                  setSales={setSales}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  canEdit={permissions.pdv === 'total'}
                  currentUser={currentUser}
                  paymentIcons={paymentIcons}
                />
              )}
              {view === 'cashier' && permissions.pdv !== 'nenhum' && (
                <CashierView 
                  cashierSession={cashierSession}
                  setCashierSession={setCashierSession}
                  sales={sales}
                  closedSessions={closedSessions}
                  setClosedSessions={setClosedSessions}
                  addActivity={addActivity}
                  users={users}
                  couponConfig={couponConfig}
                  imprimirCupom={imprimirCupom}
                  canEdit={permissions.pdv === 'total'}
                  currentUser={currentUser}
                />
              )}
              {view === 'historico_caixa' && (
                <CashierHistoryView 
                  closedSessions={closedSessions}
                  imprimirCupom={imprimirCupom}
                  couponConfig={couponConfig}
                  canEdit={permissions.pdv === 'total'}
                />
              )}
              {view === 'auditoria' && <AuditoriaView activities={activities} users={users} roles={roles} sales={sales} closedSessions={closedSessions} />}
              {view === 'summary' && permissions.dashboard !== 'nenhum' && (
                <DashboardView 
                  sales={sales} 
                  products={products} 
                  customers={customers}
                  expenses={expenses}
                  purchases={purchases}
                  revenues={revenues}
                  paymentMethods={paymentMethods} 
                  paymentIcons={paymentIcons}
                  goldCustomerIds={goldCustomerIds}
                  currentUser={currentUser}
                  onGoToProduct={(productId) => {
                    if (permissions.estoque !== 'nenhum') {
                      setView('add-product');
                      setTimeout(() => {
                        const element = document.getElementById(`product-${productId}`);
                        if (element) {
                          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                          element.classList.add('ring-4', 'ring-blue-400', 'ring-offset-2');
                          setTimeout(() => element.classList.remove('ring-4', 'ring-blue-400', 'ring-offset-2'), 3000);
                        }
                      }, 500);
                    }
                  }}
                />
              )}
              {view === 'add-customer' && permissions.pdv !== 'nenhum' && (
                <CustomerView 
                  customers={customers} 
                  setCustomers={setCustomers} 
                  addActivity={addActivity} 
                  sales={sales}
                  imprimirCupom={imprimirCupom}
                  company={company}
                  couponConfig={couponConfig}
                  products={products}
                  goldCustomerIds={goldCustomerIds}
                  canEdit={permissions.pdv === 'total'}
                  currentUser={currentUser}
                  gallery={gallery}
                  setGallery={setGallery}
                  paymentIcons={paymentIcons}
                />
              )}
              {view === 'payments' && permissions.financeiro !== 'nenhum' && (
                <PaymentsView 
                  paymentMethods={paymentMethods} 
                  setPaymentMethods={setPaymentMethods} 
                  paymentIcons={paymentIcons}
                  setPaymentIcons={setPaymentIcons}
                  customPaymentMethods={customPaymentMethods} 
                  setCustomPaymentMethods={setCustomPaymentMethods} 
                  hiddenPaymentMethods={hiddenPaymentMethods}
                  setHiddenPaymentMethods={setHiddenPaymentMethods}
                  sales={sales} 
                  addActivity={addActivity}
                  canEdit={permissions.financeiro === 'total'}
                  currentUser={currentUser}
                />
              )}
              {view === 'adjust' && permissions.ajustes !== 'nenhum' && (
                <SettingsView 
                  currentUser={currentUser}
                  addActivity={addActivity}
                  company={company} 
                  setCompany={setCompany} 
                  couponConfig={couponConfig}
                  setCouponConfig={setCouponConfig}
                  couponPDVConfig={couponPDVConfig}
                  setCouponPDVConfig={setCouponPDVConfig}
                  users={users}
                  setUsers={setUsers}
                  setCurrentUser={setCurrentUser}
                  roles={roles}
                  setRoles={setRoles}
                  labelConfig={labelConfig}
                  setLabelConfig={setLabelConfig}
                  greetingCouponConfig={greetingCouponConfig}
                  setGreetingCouponConfig={setGreetingCouponConfig}
                  onBack={() => setView('dashboard')} 
                  setView={setView}
                  printers={printers}
                  setPrinters={setPrinters}
                  selectedPrinter={selectedPrinter}
                  setSelectedPrinter={setSelectedPrinter}
                  selectedLabelPrinter={selectedLabelPrinter}
                  setSelectedLabelPrinter={setSelectedLabelPrinter}
                  hardwarePrinters={hardwarePrinters}
                  setHardwarePrinters={setHardwarePrinters}
                  registeredPrinters={registeredPrinters}
                  setRegisteredPrinters={setRegisteredPrinters}
                  products={products}
                  customers={customers}
                  sales={sales}
                  activities={activities}
                  categories={categories}
                  subcategories={subcategories}
                  deliveryChannels={deliveryChannels}
                  deliveryMethods={deliveryMethods}
                  setDeliveryMethods={setDeliveryMethods}
                  paymentMethods={paymentMethods}
                  customPaymentMethods={customPaymentMethods}
                  cashierSession={cashierSession}
                  revenues={revenues}
                  purchases={purchases}
                  expenses={expenses}
                  rawMaterials={[]}
                  rawMaterialsStructured={rawMaterialsStructured}
                  productRecipes={productRecipes}
                  shopkeepers={shopkeepers}
                  shopkeeperDeliveries={shopkeeperDeliveries}
                  catalogDescriptions={catalogDescriptions}
                  canEdit={permissions.ajustes === 'total'}
                  imprimirCupom={imprimirCupom}
                  imprimirPedidoPDV={imprimirPedidoPDV}
                  performUnifiedPrint={performUnifiedPrint}
                  generateReceiptHTML={generateReceiptHTML}
                  generateSimpleReceiptHTML={generateSimpleReceiptHTML}
                  hiddenPaymentMethods={hiddenPaymentMethods}
                  closedSessions={closedSessions}
                  openSessions={openSessions}
                  generateGreetingCupomHTML={generateGreetingCupomHTML}
                  gallery={gallery}
                  setGallery={setGallery}
                  gallerySearchTerm={gallerySearchTerm}
                  setGallerySearchTerm={setGallerySearchTerm}
                />
              )}
              {view === 'results' && (
                <ResultsView 
                  sales={sales}
                  products={products}
                  customers={customers}
                  cashierSession={cashierSession}
                  canEdit={permissions.dashboard === 'total'}
                  currentUser={currentUser}
                />
              )}
              {view === 'consultar-pedido' && (
                <ConsultarPedidoView 
                  sales={sales}
                  products={products}
                  customers={customers}
                  company={company}
                  couponConfig={couponConfig}
                  imprimirCupom={imprimirCupom}
                  currentUser={currentUser}
                  paymentIcons={paymentIcons}
                />
              )}

              {view === 'customer-experience' && (
                <CustomerExperienceView 
                  sales={sales}
                  customers={customers}
                  company={company}
                  greetingCouponConfig={greetingCouponConfig}
                  onUpdateSale={(id, data) => {
                    const updatedAt = Date.now();
                    setSales(prev => prev.map(s => s.id === id ? { ...s, ...data, updatedAt } : s));
                  }}
                  onPrintGreeting={imprimirGreetingCupom}
                />
              )}
              {view === 'catalog' && (
                <CatalogView 
                  products={products}
                  categories={categories}
                  subcategories={subcategories}
                  company={company}
                  catalogDescriptions={catalogDescriptions}
                  setCatalogDescriptions={setCatalogDescriptions}
                  canEdit={permissions.pdv === 'total'}
                />
              )}
              {view === 'auditoria' && <AuditoriaView activities={activities} users={users} roles={roles} sales={sales} closedSessions={closedSessions} />}
              {/* Other views as placeholders for now */}
              {!['add-product', 'add-customer', 'cashier', 'summary', 'adjust', 'payments', 'pos', 'sales-history', 'delivery', 'movement', 'separation', 'results', 'consultar-pedido', 'customer-experience', 'catalog', 'auditoria'].includes(view) && (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 py-20">
                  <Package size={64} className="mb-4 opacity-20" />
                  <p className="font-medium italic">Funcionalidade em desenvolvimento...</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <AppUpdater />
    </div>
  );
}

// --- Sub Components ---

interface ActivityViewProps { 
  activities: Activity[];
  sales: Sale[];
  products: Product[];
  customers: Customer[];
  company: CompanyInfo;
  couponConfig: CouponConfig;
  imprimirCupom: (sale: Sale) => Promise<boolean>;
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>;
  onCancelSale: (id: string) => void;
  canEdit: boolean;
  currentUser: SystemUser | null;
  paymentIcons: Record<string, string>;
}

function ActivityView({ 
  activities,
  sales,
  products,
  customers,
  company,
  couponConfig,
  imprimirCupom,
  imprimirPedidoPDV,
  onCancelSale,
  canEdit,
  currentUser,
  paymentIcons
}: ActivityViewProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'modifications' | 'vendas'>('all');
  const [userFilter, setUserFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState<'todos' | Activity['type']>('todos');
  const [dateFilter, setDateFilter] = useState('');

  const filteredActivities = useMemo(() => {
    let list = [...activities];

    const isAdmin = currentUser?.id === 'admin' || (currentUser && currentUser.roleId === 'role-gerente');

    if (!isAdmin) {
      list = list.filter(a => a.user === currentUser?.name);
    }

    if (activeTab === 'modifications') {
      list = list.filter(a => a.type === 'product_edit');
    }

    if (userFilter) {
      list = list.filter(a => a.user.toLowerCase().includes(userFilter.toLowerCase()));
    }

    if (typeFilter !== 'todos') {
      list = list.filter(a => a.type === typeFilter);
    }

    if (dateFilter) {
      const [year, month, day] = dateFilter.split('-').map(Number);
      list = list.filter(a => {
        const cleanTimestamp = a.timestamp.replace(',', '');
        const [datePart] = cleanTimestamp.split(' ');
        const [d, m, y] = datePart.split('/').map(Number);
        return d === day && m === month && y === year;
      });
    }

    return list;
  }, [activities, activeTab, userFilter, typeFilter, dateFilter]);

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'customer': return 'Cliente';
      case 'product': return 'Produto';
      case 'product_edit': return 'Edição';
      case 'sale': return 'Venda';
      case 'auth': return 'Acesso';
      case 'security': return 'Segurança';
      case 'system': return 'Sistema';
      default: return 'Geral';
    }
  };

  const getActivityTypeColor = (type: Activity['type']) => {
    switch (type) {
      case 'customer': return 'bg-indigo-500/10 text-indigo-400';
      case 'product': return 'bg-amber-500/10 text-amber-400';
      case 'product_edit': return 'bg-purple-500/10 text-purple-400';
      case 'sale': return 'bg-green-500/10 text-green-400';
      case 'auth': return 'bg-blue-500/10 text-blue-400';
      case 'security': return 'bg-red-500/10 text-red-400';
      default: return 'bg-zinc-800 text-zinc-400';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex gap-4 border-b border-zinc-800">
          <button 
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'all' ? 'text-[#5d5dff] border-b-2 border-[#5d5dff]' : 'text-zinc-500'
            }`}
          >
            Log De Ações
          </button>
          <button 
            onClick={() => setActiveTab('vendas')}
            className={`pb-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'vendas' ? 'text-[#5d5dff] border-b-2 border-[#5d5dff]' : 'text-zinc-500'
            }`}
          >
            Vendas (Histórico)
          </button>
          <button 
            onClick={() => setActiveTab('modifications')}
            className={`pb-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'modifications' ? 'text-[#5d5dff] border-b-2 border-[#5d5dff]' : 'text-zinc-500'
            }`}
          >
            Alterações
          </button>
        </div>

        {activeTab !== 'vendas' && (
          <div className="flex flex-wrap gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Data</label>
              <input 
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="p-2 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-900 text-zinc-100"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Tipo</label>
              <select
                value={typeFilter}
                onChange={e => setTypeFilter(e.target.value as any)}
                className="p-2 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-900 text-zinc-100"
              >
                <option value="todos">Todos</option>
                <option value="sale">Vendas</option>
                <option value="product">Produtos</option>
                <option value="customer">Clientes</option>
                <option value="auth">Acesso</option>
                <option value="security">Segurança</option>
                <option value="system">Sistema</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest ml-1">Usuário</label>
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600" />
                <input 
                  placeholder="BUSCAR USUÁRIO..."
                  value={userFilter}
                  onChange={e => setUserFilter(e.target.value)}
                  className="pl-9 p-2 border border-zinc-800 rounded-xl text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-blue-400 bg-zinc-900 text-zinc-100 placeholder:text-zinc-700"
                />
              </div>
            </div>
            { (dateFilter || userFilter || typeFilter !== 'todos') && (
              <button 
                onClick={() => { setDateFilter(''); setUserFilter(''); setTypeFilter('todos'); }}
                className="self-end p-2 text-red-500 hover:bg-red-500/10 rounded-xl transition-colors"
                title="Limpar Filtros"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'vendas' ? (
          <SalesHistoryView 
            sales={sales}
            products={products}
            customers={customers}
            company={company}
            couponConfig={couponConfig}
            imprimirCupom={imprimirCupom}
            imprimirPedidoPDV={imprimirPedidoPDV}
            onCancel={onCancelSale}
            canEdit={canEdit}
            currentUser={currentUser}
            paymentIcons={paymentIcons}
          />
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden lg:block bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] no-scrollbar">
                <table className="w-full text-left">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-zinc-800 border-b border-zinc-700 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                      <th className="px-6 py-4">Data/Hora</th>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Função</th>
                      <th className="px-6 py-4">Ação</th>
                      <th className="px-6 py-4">Detalhes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    {filteredActivities.length > 0 ? (
                      filteredActivities.map((activity) => (
                        <tr key={activity.id} className="hover:bg-zinc-800/30 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <p className="text-xs font-bold text-zinc-400">{activity.timestamp}</p>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-[10px]">
                                {activity.user.charAt(0)}
                              </div>
                              <p className="text-xs font-black text-zinc-100 uppercase">{activity.user}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800/50 px-2 py-0.5 rounded-full">
                              {activity.userRole || 'SISTEMA'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`w-fit text-[8px] font-black uppercase px-2 py-0.5 rounded-lg ${getActivityTypeColor(activity.type).replace('bg-', 'bg-').replace('50', '500/10' )}`}>
                                {getActivityTypeLabel(activity.type)}
                              </span>
                              <p className="text-[10px] font-black text-zinc-100 uppercase tracking-tighter">
                                {activity.action}
                              </p>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {activity.type === 'product_edit' ? (
                              <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest leading-none">
                                  Campo: {activity.field}
                                </p>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold text-red-400 line-through opacity-50">{activity.oldValue}</span>
                                  <ChevronRight size={10} className="text-zinc-600" />
                                  <span className="text-xs font-bold text-emerald-400">{activity.newValue}</span>
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs font-medium text-zinc-400 max-w-sm">{activity.details}</p>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <History size={40} className="mx-auto text-zinc-800 mb-4" />
                          <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Nenhuma atividade registrada</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden space-y-4">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="bg-zinc-900 p-5 rounded-3xl border border-zinc-800 space-y-4 shadow-sm relative overflow-hidden">
                    {/* Activity Type Indicator */}
                    <div className={`absolute top-0 left-0 w-1 h-full ${getActivityTypeColor(activity.type).split(' ')[1].replace('text-', 'bg-')}`} />
                    
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-zinc-800 text-zinc-100 flex items-center justify-center font-black text-sm border border-zinc-700">
                          {activity.user.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-zinc-100 uppercase tracking-tight">{activity.user}</p>
                          <p className="text-[10px] font-bold text-zinc-500">{activity.timestamp}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg ${getActivityTypeColor(activity.type)}`}>
                        {getActivityTypeLabel(activity.type)}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-black text-zinc-100 uppercase tracking-tight leading-snug">{activity.action}</h4>
                      {activity.type === 'product_edit' ? (
                        <div className="bg-black/20 p-3 rounded-2xl border border-zinc-800/50 space-y-2">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Campo: {activity.field}</p>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-bold text-red-400 line-through opacity-50 bg-red-400/5 px-2 py-0.5 rounded-md">{activity.oldValue}</span>
                            <ChevronRight size={10} className="text-zinc-700" />
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/5 px-2 py-0.5 rounded-md">{activity.newValue}</span>
                          </div>
                        </div>
                      ) : (
                        <p className="text-[11px] font-medium text-zinc-400 leading-relaxed">{activity.details}</p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-12 text-center">
                  <History size={40} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Nenhuma atividade registrada</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function AuditoriaView({ 
  activities, 
  users, 
  roles,
  sales,
  closedSessions
}: { 
  activities: Activity[], 
  users: SystemUser[], 
  roles: Role[],
  sales: Sale[],
  closedSessions: CashierSession[]
}) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const getRoleUsers = (roleId: string) => users.filter(u => u.roleId === roleId);
  const getUserActivities = (userName: string) => activities.filter(a => a.user === userName);
  const getUserSales = (userName: string) => sales.filter(s => s.soldByUserName === userName);
  const getUserCashierSessions = (userName: string) => closedSessions.filter(s => s.userName === userName);

  if (!selectedRole) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-1 mb-8">
          <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Auditoria de Sistema</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nível 1: Selecione a Função</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {roles.map(role => {
            const roleUsers = getRoleUsers(role.id);
            return (
              <button 
                key={role.id}
                onClick={() => setSelectedRole(role.id)}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] text-left hover:border-blue-500/50 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-zinc-800 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all text-zinc-400">
                    <Users size={24} />
                  </div>
                  <span className="text-[10px] font-black bg-zinc-800 px-3 py-1 rounded-full text-zinc-500 uppercase">{roleUsers.length} Usuários</span>
                </div>
                <h4 className="text-lg font-black text-zinc-100 uppercase tracking-tight mb-2">{role.name}</h4>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-widest">Ver auditoria por usuários</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (selectedRole && !selectedUserId) {
    const roleUsers = getRoleUsers(selectedRole);
    const roleName = roles.find(r => r.id === selectedRole)?.name;

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setSelectedRole(null)} className="p-3 bg-zinc-900 text-zinc-400 rounded-2xl hover:text-white border border-zinc-800 transition-all"><ArrowLeft size={20} /></button>
          <div className="flex flex-col">
            <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Usuários: {roleName}</h3>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nível 2: Selecione o Usuário</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roleUsers.length > 0 ? roleUsers.map(user => (
            <button 
              key={user.id}
              onClick={() => setSelectedUserId(user.id)}
              className="flex items-center gap-6 p-6 bg-zinc-900 border border-zinc-800 rounded-[2.5rem] hover:bg-zinc-800/50 transition-all group"
            >
              <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xl group-hover:bg-blue-500 group-hover:text-white transition-all capitalize">
                {user.name.charAt(0)}
              </div>
              <div className="flex flex-col text-left">
                <h4 className="text-lg font-black text-zinc-100 uppercase tracking-tighter">{user.name}</h4>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">@{user.username}</p>
              </div>
              <div className="ml-auto p-2 text-zinc-700 group-hover:text-blue-500">
                <ChevronRight size={24} />
              </div>
            </button>
          )) : (
            <div className="col-span-full py-20 text-center">
              <p className="text-zinc-600 font-black uppercase tracking-widest">Nenhum usuário nesta função</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const user = users.find(u => u.id === selectedUserId);
  const userActivities = user ? getUserActivities(user.name) : [];
  const userSales = user ? getUserSales(user.name) : [];
  const userSessions = user ? getUserCashierSessions(user.name) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => setSelectedUserId(null)} className="p-3 bg-zinc-900 text-zinc-400 rounded-2xl hover:text-white border border-zinc-800 transition-all"><ArrowLeft size={20} /></button>
        <div className="flex flex-col">
          <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Auditoria: {user?.name}</h3>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Nível 3: Histórico Completo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-zinc-950 p-6 rounded-[2.5rem] border border-zinc-800">
            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Resumo do Usuário</h5>
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Vendas Realizadas</span>
                <span className="font-black text-zinc-100">{userSales.length}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Ações em Log</span>
                <span className="font-black text-zinc-100">{userActivities.length}</span>
              </div>
              <div className="flex justify-between items-center bg-zinc-900/50 p-4 rounded-2xl border border-zinc-900">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Caixas Fechados</span>
                <span className="font-black text-zinc-100">{userSessions.length}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl text-zinc-100">
            <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
              <h5 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">Linha do Tempo de Atividades</h5>
              <div className="flex gap-2">
                 <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                 <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                 <div className="w-2 h-2 rounded-full bg-amber-500"></div>
              </div>
            </div>
            <div className="max-h-[600px] overflow-y-auto p-6 space-y-4 no-scrollbar">
              {userActivities.length > 0 ? userActivities.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 relative group text-left">
                  {idx !== userActivities.length - 1 && (
                    <div className="absolute left-4 top-10 bottom-0 w-px bg-zinc-800 group-hover:bg-blue-500/30 transition-colors"></div>
                  )}
                  <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center border-4 border-zinc-900 z-10 ${
                    activity.type === 'auth' ? 'bg-blue-500 text-white' :
                    activity.type === 'sale' ? 'bg-emerald-500 text-white' :
                    activity.type === 'product_edit' ? 'bg-amber-500 text-white' : 'bg-zinc-800 text-zinc-400'
                  }`}>
                    {activity.type === 'auth' ? <Lock size={12} /> : 
                     activity.type === 'sale' ? <ShoppingBag size={12} /> : 
                     activity.type === 'product_edit' ? <Edit size={12} /> : <Check size={12} />}
                  </div>
                  <div className="flex flex-col gap-1 pb-8">
                     <div className="flex items-center gap-3">
                        <span className="text-[9px] font-black text-zinc-500 uppercase">{activity.timestamp}</span>
                        <span className="text-[8px] font-bold text-blue-500 uppercase tracking-widest">{activity.type}</span>
                     </div>
                     <h6 className="text-[12px] font-black text-zinc-100 uppercase tracking-tight">{activity.action}</h6>
                     <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">{activity.details}</p>
                  </div>
                </div>
              )) : (
                <div className="py-20 text-center">
                  <Clock size={40} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-xs font-black text-zinc-700 uppercase tracking-widest">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReturnsView({ 
  sales, 
  products, 
  onConfirmReturn,
  customers 
}: { 
  sales: Sale[], 
  products: Product[], 
  onConfirmReturn: (saleId: string, items: { productId: string, quantity: number }[], reason: string) => void,
  customers: Customer[] 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [returnQuantities, setReturnQuantities] = useState<Record<string, number>>({});
  const [reason, setReason] = useState('');

  const filteredSales = useMemo(() => {
    if (!searchTerm) return [];
    return sales.filter(s => {
      const customer = customers.find(c => c.id === s.customerId);
      const customerName = (customer?.name || s.customerId || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return (s.sequentialId && s.sequentialId.includes(searchTerm)) || 
             customerName.includes(term);
    }).slice(0, 5);
  }, [sales, searchTerm, customers]);

  const handleSelectSale = (sale: Sale) => {
    setSelectedSale(sale);
    // Reset return quantities
    const initialQtys: Record<string, number> = {};
    sale.items.forEach(item => {
      initialQtys[item.productId] = 0;
    });
    setReturnQuantities(initialQtys);
    setReason('');
  };

  const handleQtyChange = (productId: string, val: number, max: number) => {
    const qty = Math.max(0, Math.min(max, val));
    setReturnQuantities(prev => ({ ...prev, [productId]: qty }));
  };

  const totalReturnItems = Object.values(returnQuantities).reduce((acc: number, q: number) => acc + q, 0);

  const handleSubmit = () => {
    if (!selectedSale) return;
    if (totalReturnItems === 0) {
      alert('Selecione ao menos um item para devolver.');
      return;
    }
    const itemsToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => Number(qty) > 0)
      .map(([productId, quantity]) => ({ productId, quantity: Number(quantity) }));
    
    if (window.confirm('Deseja confirmar esta devolução? Os itens retornarão ao estoque.')) {
      onConfirmReturn(selectedSale.id, itemsToReturn, reason);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-8">
        <h3 className="text-2xl font-black text-zinc-100 uppercase tracking-tighter">Devolução de Pedidos</h3>
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Inicie o processo de devolução</p>
      </div>

      {!selectedSale ? (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={20} />
            <input 
              type="text"
              placeholder="Buscar por Nº do Pedido ou Nome do Cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 p-5 pl-12 rounded-[2rem] text-zinc-100 font-bold focus:outline-none focus:border-blue-500 transition-all"
            />
          </div>

          <div className="space-y-3">
             {filteredSales.map((sale) => {
               const customer = customers.find(c => c.id === sale.customerId);
               return (
                 <button 
                   key={sale.id}
                   onClick={() => handleSelectSale(sale)}
                   className="w-full bg-zinc-900 border border-zinc-800 p-5 rounded-3xl flex items-center justify-between hover:bg-zinc-800 transition-all group"
                 >
                    <div className="flex flex-col items-start">
                       <span className="text-[10px] font-black text-blue-500 uppercase">Pedido #{sale.sequentialId}</span>
                       <span className="text-sm font-black text-zinc-100 uppercase">{customer?.name || 'Venda Local'}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex flex-col items-end">
                         <span className="text-xs font-black text-zinc-300">R$ {sale.total.toFixed(2)}</span>
                         <span className="text-[10px] font-bold text-zinc-500">{new Date(sale.date).toLocaleDateString()}</span>
                      </div>
                      <ChevronRight size={20} className="text-zinc-700 group-hover:text-blue-500 transition-colors" />
                    </div>
                 </button>
               )
             })}
             {searchTerm && filteredSales.length === 0 && (
               <div className="py-10 text-center text-zinc-600 font-bold uppercase tracking-widest text-[10px]">
                 Nenhum pedido encontrado
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 overflow-hidden shadow-2xl text-zinc-100">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
                <div className="flex items-center gap-4">
                  <button onClick={() => setSelectedSale(null)} className="p-2 text-zinc-500 hover:text-white transition-all"><ArrowLeft size={20} /></button>
                  <h5 className="text-[10px] font-black text-zinc-200 uppercase tracking-widest">Itens para Devolução</h5>
                </div>
                <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest bg-zinc-800 px-3 py-1 rounded-full">
                  #{selectedSale.sequentialId}
                </div>
              </div>
              <div className="p-6 space-y-4">
                {selectedSale.items.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-600 overflow-hidden">
                           {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={24} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-xs font-black text-zinc-100 uppercase tracking-tight">{product?.name || 'Produto Removido'}</span>
                           <span className="text-[10px] font-bold text-zinc-500 uppercase">Enviado: {item.quantity} un</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => handleQtyChange(item.productId, returnQuantities[item.productId] - 1, item.quantity)}
                          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-800 hover:text-white"
                        >
                          <Minus size={14} />
                        </button>
                        <input 
                          type="number"
                          value={returnQuantities[item.productId]}
                          readOnly
                          className="w-12 bg-transparent text-center font-black text-zinc-100 focus:outline-none"
                        />
                        <button 
                          onClick={() => handleQtyChange(item.productId, returnQuantities[item.productId] + 1, item.quantity)}
                          className="w-8 h-8 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-800 hover:text-white"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="p-6 bg-zinc-950 border-t border-zinc-800 space-y-4">
                 <div className="flex flex-col gap-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Motivo da Devolução</label>
                    <textarea 
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Descreva o motivo (erro de envio, desistência, defeito...)"
                      className="w-full bg-zinc-900 border border-zinc-800 p-4 rounded-2xl text-zinc-100 font-bold placeholder:text-zinc-700 focus:outline-none focus:border-red-500/50 transition-all min-h-[80px]"
                    />
                 </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-950 p-8 rounded-[2.5rem] border border-zinc-800 sticky top-8">
               <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-900 pb-4">Resumo da Devolução</h5>
               <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-zinc-400 uppercase">Itens Selecionados:</span>
                     <span className="font-black text-zinc-100">{totalReturnItems}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                     <span className="font-bold text-zinc-400 uppercase">Pedido Original:</span>
                     <span className="font-black text-zinc-100">#{selectedSale.sequentialId}</span>
                  </div>
               </div>
               <button 
                 onClick={handleSubmit}
                 disabled={totalReturnItems === 0}
                 className="w-full bg-red-600 text-white p-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all disabled:opacity-50 disabled:grayscale shadow-lg shadow-red-900/20"
               >
                 Confirmar Devolução
               </button>
               <p className="text-[10px] text-center text-zinc-600 font-bold mt-6 uppercase leading-relaxed">
                 Atenção: Ao confirmar, os itens retornarão automaticamente ao estoque.
               </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Geração de PDF dinâmico para Clientes
 * Inclui apenas campos preenchidos
 */
export async function generateCustomerPDF(customer: Customer, company: CompanyInfo) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Configurações de Design
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 25;

  // Cabeçalho Empresa
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(40, 40, 40);
  doc.text(company.name.toUpperCase(), margin, currentY);
  
  currentY += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(`${company.address} | ${company.phone}`, margin, currentY);

  currentY += 15;
  doc.setDrawColor(230, 230, 230);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // Título do Documento
  currentY += 15;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('FICHA CADASTRAL DO CLIENTE', margin, currentY);

  currentY += 10;
  
  // Imagem do Cliente (se houver)
  if (customer.image) {
    try {
      doc.addImage(customer.image, 'JPEG', margin, currentY, 35, 42);
      currentY += 50;
    } catch (e) {
      console.error('Erro ao adicionar imagem ao PDF do cliente:', e);
      currentY += 10;
    }
  }

  // Lista de campos a exibir (apenas se preenchidos)
  const formatAddress = (addr: any) => {
    if (!addr) return '';
    const parts = [addr.street, addr.number, addr.neighborhood, addr.city, addr.state].filter(Boolean);
    return parts.join(', ');
  };

  const fields = [
    { label: 'NOME COMPLETO', value: customer.name },
    { label: 'WHATSAPP / TELEFONE', value: customer.whatsapp },
    { label: 'E-MAIL', value: customer.email },
    { label: 'DATA DE NASCIMENTO', value: customer.dob },
    { label: 'CPF / CNPJ', value: customer.taxId },
    { label: 'ENDEREÇO COMPLETO', value: formatAddress(customer.address) },
    { label: 'OBSERVAÇÕES', value: customer.notes }
  ].filter(f => f.value && typeof f.value === 'string' && f.value.trim() !== '');

  // Renderizar campos
  fields.forEach(field => {
    if (currentY > 260) {
      doc.addPage();
      currentY = 25;
    }

    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(150, 150, 150);
    doc.text(field.label, margin, currentY);

    currentY += 5;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(20, 20, 20);
    
    // Suporte a múltiplas linhas para textos longos (endereço/notas)
    const splitValue = doc.splitTextToSize(field.value || '', pageWidth - (margin * 2));
    doc.text(splitValue, margin, currentY);
    
    currentY += (splitValue.length * 6) + 4;
  });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  const footerText = `Gerado em ${new Date().toLocaleString('pt-BR')} | Sistema Gestão Pro`;
  doc.text(footerText, pageWidth / 2, 285, { align: 'center' });

  // Salvar/Abrir
  const fileName = `CLIENTE_${customer.name.replace(/\s+/g, '_').toUpperCase()}.pdf`;
  doc.save(fileName);
}

function SettingsView({ 
  currentUser,
  addActivity,
  company, 
  setCompany, 
  couponConfig, 
  setCouponConfig, 
  couponPDVConfig,
  setCouponPDVConfig,
  users, 
  setUsers, 
  setCurrentUser,
  roles,
  setRoles,
  labelConfig,
  setLabelConfig,
  onBack,
  setView,
  printers,
  setPrinters,
  selectedPrinter,
  setSelectedPrinter,
  selectedLabelPrinter,
  setSelectedLabelPrinter,
  products,
  customers,
  sales,
  activities,
  categories,
  subcategories,
  deliveryChannels,
  deliveryMethods,
  setDeliveryMethods,
  paymentMethods,
  customPaymentMethods,
  hiddenPaymentMethods,
  cashierSession,
  revenues,
  purchases,
  expenses,
  rawMaterials,
  rawMaterialsStructured,
  productRecipes,
  shopkeepers,
  shopkeeperDeliveries,
  catalogDescriptions,
  canEdit,
  imprimirCupom,
  imprimirPedidoPDV,
  performUnifiedPrint,
  greetingCouponConfig,
  setGreetingCouponConfig,
  hardwarePrinters,
  setHardwarePrinters,
  registeredPrinters,
  setRegisteredPrinters,
  generateReceiptHTML,
  generateSimpleReceiptHTML,
  closedSessions,
  openSessions,
  generateGreetingCupomHTML,
  gallery,
  setGallery,
  gallerySearchTerm,
  setGallerySearchTerm
}: { 
  currentUser: SystemUser | null,
  addActivity: (type: Activity['type'], action: string, details: string) => void,
  company: CompanyInfo, 
  setCompany: any, 
  couponConfig: CouponConfig, 
  setCouponConfig: any, 
  couponPDVConfig: CouponPDVConfig,
  setCouponPDVConfig: any,
  users: SystemUser[], 
  setUsers: any, 
  setCurrentUser: (u: SystemUser | null) => void,
  roles: Role[],
  setRoles: any,
  labelConfig: LabelConfig,
  setLabelConfig: any,
  onBack: () => void,
  setView: any,
  printers: PrinterConfig[],
  setPrinters: any,
  selectedPrinter: string,
  setSelectedPrinter: any,
  selectedLabelPrinter: string,
  setSelectedLabelPrinter: any,
  products: Product[],
  customers: Customer[],
  sales: Sale[],
  activities: Activity[],
  categories: Category[],
  subcategories: Subcategory[],
  deliveryChannels: DeliveryChannel[],
  deliveryMethods: DeliveryMethod[],
  setDeliveryMethods: any,
  paymentMethods: string[],
  customPaymentMethods: string[],
  hiddenPaymentMethods: string[],
  cashierSession: CashierSession,
  closedSessions: CashierSession[],
  openSessions: Record<string, CashierSession>,
  revenues: Revenue[],
  purchases: Purchase[],
  expenses: Expense[],
  rawMaterials: RawMaterial[],
  rawMaterialsStructured: RawMaterial[],
  productRecipes: ProductRecipe[],
  shopkeepers: Shopkeeper[],
  shopkeeperDeliveries: ShopkeeperDelivery[],
  catalogDescriptions: Record<string, string>,
  canEdit: boolean,
  imprimirCupom: (saleOrHtml: Sale | string, customTitle?: string) => Promise<boolean>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  performUnifiedPrint: (type: string, content: string, printer: string, mode: string, dims?: { width?: number, height?: number, format?: string, orientation?: 'portrait' | 'landscape' }) => Promise<boolean>,
  greetingCouponConfig: GreetingCouponConfig,
  setGreetingCouponConfig: any,
  hardwarePrinters: any[],
  setHardwarePrinters: (p: any[]) => void,
  registeredPrinters: any[],
  setRegisteredPrinters: (p: any[]) => void,
  generateReceiptHTML: any,
  generateSimpleReceiptHTML: any,
  generateGreetingCupomHTML: any,
  gallery: GalleryItem[],
  setGallery: any,
  gallerySearchTerm: string,
  setGallerySearchTerm: (v: string) => void
}) {
  const [activeTab, setActiveTab] = useState('empresa');
  const [localCompany, setLocalCompany] = useState<CompanyInfo>(company);
  const [localCoupon, setLocalCoupon] = useState<CouponConfig>(couponConfig);
  const [localCouponPDV, setLocalCouponPDV] = useState<CouponPDVConfig>(couponPDVConfig);
  const [simulatedCustomer, setSimulatedCustomer] = useState<Customer | null>(null);
  const [localRoles, setLocalRoles] = useState<Role[]>(roles);
  const [localLabel, setLocalLabel] = useState<LabelConfig>(labelConfig);
  const [localGreeting, setLocalGreeting] = useState<GreetingCouponConfig>(greetingCouponConfig);
  const [localDeliveryMethods, setLocalDeliveryMethods] = useState<DeliveryMethod[]>(deliveryMethods);
  const [localPrinters, setLocalPrinters] = useState<PrinterConfig[]>(printers);
  const [localSelectedPrinter, setLocalSelectedPrinter] = useState<string>(selectedPrinter);
  const [localHardwarePrinters, setLocalHardwarePrinters] = useState<any[]>(hardwarePrinters);

  useEffect(() => {
    if (printers) {
      setLocalPrinters(printers);
    }
  }, [printers]);

  useEffect(() => {
    if (hardwarePrinters) {
      setLocalHardwarePrinters(hardwarePrinters);
    }
  }, [hardwarePrinters]);

  useEffect(() => {
    const fetchSystemPrinters = async () => {
      if ((window as any).electronAPI) {
        try {
          const sysPrinters = await (window as any).electronAPI.getPrinters();
          if (sysPrinters && Array.isArray(sysPrinters)) {
            setLocalHardwarePrinters(sysPrinters);
            
            // Define a primeira impressora como padrão se nenhuma estiver selecionada
            if (!selectedPrinter && sysPrinters.length > 0) {
              setSelectedPrinter(sysPrinters[0].name);
              setLocalSelectedPrinter(sysPrinters[0].name);
            }
          }
        } catch (err) {
          console.error("Erro ao carregar impressoras do sistema:", err);
        }
      }
    };
    fetchSystemPrinters();
  }, []);
  
  // User Management Extension States
  const [userTab, setUserTab] = useState<'ativos' | 'inativos'>('ativos');
  const [gallerySubTab, setGallerySubTab] = useState<'saudacao' | 'clientes' | 'produtos'>('saudacao');
  const [showResetModal, setShowResetModal] = useState(false);
  const [resettingUser, setResettingUser] = useState<SystemUser | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<SystemUser | null>(null);
  const [showRoleEditModal, setShowRoleEditModal] = useState(false);
  const [editingRoleUser, setEditingRoleUser] = useState<SystemUser | null>(null);
  const [selectedEditRoleId, setSelectedEditRoleId] = useState('');

  const [newUser, setNewUser] = useState({ name: '', username: '', password: '', roleId: '' });
  const [printSubTab, setPrintSubTab] = useState<'pdv' | 'cliente' | 'etiquetas' | 'saudacao'>('pdv');
  const [reprintSubTab, setReprintSubTab] = useState<'inicial' | 'final'>('inicial');
  const [newRole, setNewRole] = useState({ name: '' });
  const [isEditingRole, setIsEditingRole] = useState<string | null>(null);
  const [expandedRoles, setExpandedRoles] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isFetchingCEP, setIsFetchingCEP] = useState(false);
  
  const [localBackups, setLocalBackups] = useState<LocalBackup[]>(() => carregarDados(STORAGE_KEYS.LOCAL_BACKUPS, []));
  const [pendingAction, setPendingAction] = useState<{ id: string; type: 'restore' | 'delete' } | null>(null);

  useEffect(() => {
    const lastBackupDate = carregarDados(STORAGE_KEYS.LAST_AUTO_BACKUP, '');
    const today = new Date().toISOString().split('T')[0];

    if (lastBackupDate !== today) {
      const dataToBackup = {
        products, catalogDescriptions, customers, sales, activities, categories, subcategories,
        delivery_channels: deliveryChannels, delivery_methods: deliveryMethods, closed_sessions: closedSessions,
        openSessions, users, roles, paymentMethods, customPaymentMethods, hiddenPaymentMethods,
        printers, registeredPrinters, company, couponConfig, couponPDVConfig, greetingCouponConfig,
        labelConfig, cashierSession, selectedPrinter, selectedLabelPrinter, revenues, purchases, expenses,
        rawMaterialsStructured, productRecipes, shopkeepers, shopkeeperDeliveries
      };

      const newBackup: LocalBackup = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        date: new Date().toISOString(),
        data: dataToBackup,
        size: JSON.stringify(dataToBackup).length
      };

      setLocalBackups(prev => {
        const updated = [newBackup, ...prev].slice(0, 10);
        salvarDados(STORAGE_KEYS.LOCAL_BACKUPS, updated);
        return updated;
      });
      salvarDados(STORAGE_KEYS.LAST_AUTO_BACKUP, today);
      console.log('[Backup] Backup automático realizado.');
    }
  }, []);
  
  const handleRestoreFromData = (imported: any) => {
    try {
      // 1. Garantir leitura correta e validar se o conteúdo não está vazio
      if (!imported || typeof imported !== 'object') {
        throw new Error('Arquivo de backup inválido ou vazio.');
      }

      // 2. Mapeamento Inteligente (Suporta Inglês e Português)
      // Extrai dados das chaves possíveis, priorizando as do sistema mas aceitando as sugeridas pelo usuário
      const restoreData: Record<string, any> = {};
      
      // Mapeamento de chaves
      const mapping = [
        { internal: 'products', keys: ['products', 'produtos'] },
        { internal: 'customers', keys: ['customers', 'clientes'] },
        { internal: 'sales', keys: ['sales', 'pedidos', 'vendas'] },
        { internal: 'activities', keys: ['activities', 'atividades', 'historico_atividades'] },
        { internal: 'categories', keys: ['categories', 'categorias'] },
        { internal: 'subcategories', keys: ['subcategories', 'subcategorias'] },
        { internal: 'delivery_channels', keys: ['delivery_channels', 'deliveryChannels', 'canais_entrega'] },
        { internal: 'delivery_methods', keys: ['delivery_methods', 'deliveryMethods', 'metodos_entrega'] },
        { internal: 'closed_sessions', keys: ['closed_sessions', 'closedSessions', 'sessoes_fechadas'] },
        { internal: 'users', keys: ['users', 'usuarios'] },
        { internal: 'roles', keys: ['roles', 'cargos', 'permissoes'] },
        { internal: 'paymentMethods', keys: ['paymentMethods', 'metodos_pagamento'] },
        { internal: 'customPaymentMethods', keys: ['customPaymentMethods', 'metodos_pagamento_personalizados'] },
        { internal: 'hiddenPaymentMethods', keys: ['hiddenPaymentMethods', 'metodos_pagamento_ocultos'] },
        { internal: 'printers', keys: ['printers', 'impressoras'] },
        { internal: 'registeredPrinters', keys: ['registeredPrinters'] },
        { internal: 'company', keys: ['company', 'empresa', 'dados_empresa'] },
        { internal: 'couponConfig', keys: ['couponConfig', 'configuracao_cupom'] },
        { internal: 'couponPDVConfig', keys: ['couponPDVConfig', 'configuracao_pdv'] },
        { internal: 'greetingCouponConfig', keys: ['greetingCouponConfig', 'configuracao_saudacao'] },
        { internal: 'labelConfig', keys: ['labelConfig', 'configuracao_etiqueta'] },
        { internal: 'cashierSession', keys: ['cashierSession', 'sessao_caixa'] },
        { internal: 'revenues', keys: ['revenues', 'receitas'] },
        { internal: 'purchases', keys: ['purchases', 'compras'] },
        { internal: 'expenses', keys: ['expenses', 'despesas'] },
        { internal: 'rawMaterialsStructured', keys: ['rawMaterialsStructured', 'rawMaterials', 'materias_primas'] },
        { internal: 'productRecipes', keys: ['productRecipes', 'receitas_produtos'] },
        { internal: 'shopkeepers', keys: ['shopkeepers', 'lojistas'] },
        { internal: 'shopkeeperDeliveries', keys: ['shopkeeperDeliveries', 'entregas_lojistas'] },
        { internal: 'gallery', keys: ['gallery', 'galeria'] },
        { internal: 'catalogDescriptions', keys: ['catalogDescriptions', 'descricoes_catalogo'] },
        { internal: 'openSessions', keys: ['openSessions', 'sessoes_abertas'] },
        { internal: 'selectedPrinter', keys: ['selectedPrinter'] },
        { internal: 'selectedLabelPrinter', keys: ['selectedLabelPrinter'] }
      ];

      // Busca dados nas chaves diretas
      mapping.forEach(m => {
        for (const k of m.keys) {
          if (imported[k] !== undefined) {
            restoreData[m.internal] = imported[k];
            break;
          }
        }
      });

      // Trata a chave especial 'configuracoes' se existir (pode conter sub-objetos)
      if (imported.configuracoes && typeof imported.configuracoes === 'object' && !Array.isArray(imported.configuracoes)) {
        if (restoreData.company === undefined && imported.configuracoes.empresa) restoreData.company = imported.configuracoes.empresa;
        if (restoreData.couponConfig === undefined && imported.configuracoes.cupom) restoreData.couponConfig = imported.configuracoes.cupom;
        if (restoreData.couponPDVConfig === undefined && imported.configuracoes.pdv) restoreData.couponPDVConfig = imported.configuracoes.pdv;
        if (restoreData.labelConfig === undefined && imported.configuracoes.etiqueta) restoreData.labelConfig = imported.configuracoes.etiqueta;
      }

      // 3. Validar estrutura mínima para evitar importação acidental de lixo
      const hasMinData = restoreData.products || restoreData.customers || restoreData.sales;
      if (!hasMinData) {
        throw new Error('Estrutura do JSON incorreta: Não foram encontrados produtos, clientes ou pedidos. O backup pode ser de outro sistema ou estar corrompido.');
      }

      // 4. Preparar lista para restauração no Storage
      const keysToRestore = [
        { key: STORAGE_KEYS.PRODUCTS, data: restoreData.products },
        { key: STORAGE_KEYS.CATALOG_DESCRIPTIONS, data: restoreData.catalogDescriptions },
        { key: STORAGE_KEYS.CUSTOMERS, data: restoreData.customers },
        { key: STORAGE_KEYS.SALES, data: restoreData.sales },
        { key: STORAGE_KEYS.ACTIVITIES, data: restoreData.activities },
        { key: STORAGE_KEYS.CATEGORIES, data: restoreData.categories },
        { key: STORAGE_KEYS.SUBCATEGORIES, data: restoreData.subcategories },
        { key: STORAGE_KEYS.DELIVERY_CHANNELS, data: restoreData.delivery_channels },
        { key: STORAGE_KEYS.DELIVERY_METHODS, data: restoreData.delivery_methods },
        { key: STORAGE_KEYS.CLOSED_SESSIONS, data: restoreData.closed_sessions },
        { key: STORAGE_KEYS.OPEN_SESSIONS, data: restoreData.openSessions },
        { key: STORAGE_KEYS.USERS, data: restoreData.users },
        { key: STORAGE_KEYS.ROLES, data: restoreData.roles },
        { key: STORAGE_KEYS.PAYMENT_METHODS, data: restoreData.paymentMethods },
        { key: STORAGE_KEYS.CUSTOM_PAYMENT_METHODS, data: restoreData.customPaymentMethods },
        { key: STORAGE_KEYS.HIDDEN_PAYMENT_METHODS, data: restoreData.hiddenPaymentMethods },
        { key: STORAGE_KEYS.PRINTERS, data: restoreData.printers },
        { key: STORAGE_KEYS.REGISTERED_PRINTERS, data: restoreData.registeredPrinters },
        { key: STORAGE_KEYS.COMPANY_INFO, data: restoreData.company },
        { key: STORAGE_KEYS.COUPON_CONFIG, data: restoreData.couponConfig },
        { key: STORAGE_KEYS.COUPON_PDV_CONFIG, data: restoreData.couponPDVConfig },
        { key: STORAGE_KEYS.GREETING_COUPON_CONFIG, data: restoreData.greetingCouponConfig },
        { key: STORAGE_KEYS.LABEL_CONFIG, data: restoreData.labelConfig },
        { key: STORAGE_KEYS.CASHIER_SESSION, data: restoreData.cashierSession },
        { key: STORAGE_KEYS.SELECTED_PRINTER, data: restoreData.selectedPrinter },
        { key: STORAGE_KEYS.SELECTED_LABEL_PRINTER, data: restoreData.selectedLabelPrinter },
        { key: STORAGE_KEYS.REVENUES, data: restoreData.revenues },
        { key: STORAGE_KEYS.PURCHASES, data: restoreData.purchases },
        { key: STORAGE_KEYS.EXPENSES, data: restoreData.expenses },
        { key: STORAGE_KEYS.RAW_MATERIALS, data: restoreData.rawMaterialsStructured },
        { key: STORAGE_KEYS.PRODUCT_RECIPES, data: restoreData.productRecipes },
        { key: STORAGE_KEYS.SHOPKEEPERS, data: restoreData.shopkeepers },
        { key: STORAGE_KEYS.SHOPKEEPER_DELIVERIES, data: restoreData.shopkeeperDeliveries },
        { key: STORAGE_KEYS.GALLERY, data: restoreData.gallery }
      ];

      console.log('[Backup] Iniciando restauração de dados...');
      for (const item of keysToRestore) {
        if (item.data !== undefined && item.data !== null) {
          console.log(`[Backup] Restaurando chave: ${item.key}`);
          const success = salvarDados(item.key, item.data);
          if (!success) {
             throw new Error(`Falha ao gravar dados (${item.key}). O armazenamento local pode estar cheio.`);
          }
        } else {
          console.warn(`[Backup] Chave não encontrada no backup ou vazia: ${item.key}`);
        }
      }
      
      // 5. Garantir que os dados importados substituam corretamente e o sistema atualize
      alert('Backup restaurado com sucesso! O sistema voltará exatamente ao estado salvo.');
      window.location.reload();
    } catch (err: any) {
      console.error('Erro ao restaurar dados:', err);
      alert('Erro ao importar backup: ' + err.message);
    }
  };

  const handleCreateManualBackup = () => {
    try {
      const dataToBackup = {
        products, catalogDescriptions, customers, sales, activities, categories, subcategories,
        delivery_channels: deliveryChannels, delivery_methods: deliveryMethods, closed_sessions: closedSessions,
        openSessions, users, roles, paymentMethods, customPaymentMethods, hiddenPaymentMethods,
        printers, registeredPrinters, company, couponConfig, couponPDVConfig, greetingCouponConfig,
        labelConfig, cashierSession, selectedPrinter, selectedLabelPrinter, revenues, purchases, expenses,
        rawMaterialsStructured, productRecipes, shopkeepers, shopkeeperDeliveries
      };
      
      const newBackup: LocalBackup = {
        id: Date.now().toString() + Math.random().toString(36).substring(2),
        date: new Date().toISOString(),
        data: dataToBackup,
        size: JSON.stringify(dataToBackup).length
      };
      
      let quotaExceeded = false;
      setLocalBackups(prev => {
        // Reduzido para 5 pontos para evitar estourar o LocalStorage (5MB limit)
        const updated = [newBackup, ...prev].slice(0, 5);
        const success = salvarDados(STORAGE_KEYS.LOCAL_BACKUPS, updated);
        if (!success) {
          quotaExceeded = true;
          return prev;
        }
        return updated;
      });

      if (quotaExceeded) {
        alert('Não foi possível salvar o backup. O seu armazenamento local (navegador) está cheio. Tente excluir backups antigos primeiro ou exportar para arquivo.');
        return;
      }
      
      // Feedback visual
      const notify = document.createElement('div');
      notify.className = 'fixed bottom-10 right-10 bg-emerald-600 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-2xl z-[200] animate-in fade-in slide-in-from-bottom-2';
      notify.innerText = 'Ponto de restauração criado!';
      document.body.appendChild(notify);
      setTimeout(() => {
        notify.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-2');
        setTimeout(() => notify.remove(), 500);
      }, 3000);
      
    } catch (err: any) {
      console.error('Erro ao criar backup local:', err);
      alert('Erro ao criar backup: ' + err.message);
    }
  };

  const handleDeleteBackup = (id: string) => {
    setLocalBackups(prev => {
      const updated = prev.filter(b => b.id !== id);
      salvarDados(STORAGE_KEYS.LOCAL_BACKUPS, updated);
      return updated;
    });
  };

  const [newPrinter, setNewPrinter] = useState<{ name: string; type: 'thermal' | 'desktop' }>({
    name: '',
    type: 'thermal'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const couponRef = useRef<HTMLDivElement>(null);

  const handleSave = () => {
    if (localCompany.email && !validateEmail(localCompany.email)) {
      alert('E-mail inválido!');
      return;
    }
    
    // Atualiza estados do App
    setCompany(localCompany);
    setCouponConfig(localCoupon);
    setCouponPDVConfig(localCouponPDV);
    setRoles(localRoles);
    setLabelConfig(localLabel);
    setGreetingCouponConfig(localGreeting);
    setDeliveryMethods(localDeliveryMethods);
    setPrinters(localPrinters);
    setSelectedPrinter(localSelectedPrinter);

    // Persiste no banco local
    salvarDados(STORAGE_KEYS.COMPANY_INFO, localCompany);
    salvarDados(STORAGE_KEYS.COUPON_CONFIG, localCoupon);
    salvarDados(STORAGE_KEYS.COUPON_PDV_CONFIG, localCouponPDV);
    salvarDados(STORAGE_KEYS.ROLES, localRoles);
    salvarDados(STORAGE_KEYS.LABEL_CONFIG, localLabel);
    salvarDados(STORAGE_KEYS.GREETING_COUPON_CONFIG, localGreeting);
    salvarDados(STORAGE_KEYS.DELIVERY_METHODS, localDeliveryMethods);
    salvarDados(STORAGE_KEYS.PRINTERS, localPrinters);
    salvarDados(STORAGE_KEYS.SELECTED_PRINTER, localSelectedPrinter);
    
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 2000);
  };

  const addPrinter = () => {
    if (!newPrinter.name) return;
    const printer: PrinterConfig = {
      id: crypto.randomUUID(),
      name: newPrinter.name,
      type: newPrinter.type,
      connection: 'usb'
    };
    setLocalPrinters([...localPrinters, printer]);
    setNewPrinter({ name: '', type: 'thermal' });
  };

  const handleCancel = () => {
    onBack();
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalCompany({ ...localCompany, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const addUser = () => {
    if (!newUser.username || !newUser.name) return;
    const user: SystemUser = {
      id: crypto.randomUUID(),
      username: newUser.username,
      name: newUser.name,
      password: newUser.password,
      roleId: newUser.roleId,
      isActive: true
    };
    setUsers([...users, user]);
    addActivity('security', 'Cadastro de Usuário', `Novo usuário ${user.name} (@${user.username}) cadastrado.`);
    setNewUser({ name: '', username: '', password: '', roleId: '' });
  };

  const addRole = () => {
    if (!newRole.name) return;
    const role: Role = {
      id: crypto.randomUUID(),
      name: newRole.name,
      permissions: { ...DEFAULT_PERMISSIONS }
    };
    setLocalRoles([...localRoles, role]);
    setNewRole({ name: '' });
  };

  const setPermissionLevel = (roleId: string, module: keyof ModulePermissions, level: AccessLevel) => {
    const role = localRoles.find(r => r.id === roleId);
    setLocalRoles(localRoles.map(r => r.id === roleId ? {
      ...r,
      permissions: { ...r.permissions, [module]: level }
    } : r));
    if (role) {
      addActivity('security', 'Alteração de Permissões', `Permissão do módulo "${module}" alterada para ${level} na função ${role.name}.`);
    }
  };

  const handleCEPChange = async (cep: string) => {
    const masked = maskCEP(cep);
    setLocalCompany(prev => ({ ...prev, address: { ...prev.address, cep: masked } }));

    if (masked.length === 9) {
      const cleanCEP = masked.replace(/\D/g, '');
      setIsFetchingCEP(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
        const data = await response.json();
        
        if (data.erro) {
          alert('CEP não encontrado!');
        } else {
          setLocalCompany(prev => ({
            ...prev,
            address: {
              ...prev.address,
              logradouro: data.logradouro || prev.address.logradouro,
              bairro: data.bairro || prev.address.bairro,
              cidade: data.localidade || prev.address.cidade,
              estado: data.uf || prev.address.estado
            }
          }));
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        alert('Erro ao buscar CEP. Verifique sua conexão.');
      } finally {
        setIsFetchingCEP(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 overflow-x-auto no-scrollbar snap-x touch-pan-x whitespace-nowrap scroll-smooth px-1 py-1">
        {[
          { id: 'empresa', label: 'Empresa', color: 'bg-blue-400' },
          { id: 'cupons-etiquetas', label: 'Cupons e Etiquetas', color: 'bg-emerald-400' },
          { id: 'entrega', label: 'Entrega', color: 'bg-amber-400' },
          { id: 'impressao', label: 'Impressão', color: 'bg-orange-400' },
          { id: 'galeria', label: 'Galeria', color: 'bg-pink-400' },
          { id: 'seguranca', label: 'Segurança', color: 'bg-red-400' },
          { id: 'backup', label: 'Backup', color: 'bg-purple-400' },
          (currentUser?.id === 'admin' || canEdit) && { id: 'reimpressao', label: 'Reimpressão', color: 'bg-indigo-400' }
        ].filter(Boolean).map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-4 text-[10px] font-black tracking-widest uppercase transition-all whitespace-nowrap snap-center border-2 border-black rounded-2xl ${activeTab === tab.id ? `${tab.color} text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-1 -translate-x-1` : 'bg-white text-zinc-400 hover:text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {activeTab === 'empresa' && (
          <div className="space-y-8">
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleLogoUpload} 
              className="hidden" 
              accept="image/*"
            />
            
            {/* Header: Logo Selector */}
            <div className="flex flex-col items-center">
              <div className="w-48">
                 <UniversalImageSelector 
                   label="Logotipo da Empresa"
                   value={localCompany.logo}
                   onChange={(url) => setLocalCompany({ ...localCompany, logo: url })}
                   category="logo"
                   gallery={gallery}
                   setGallery={setGallery}
                 />
              </div>
            </div>

            {/* Section: Dados da Empresa */}
            <div className="bg-white p-4 md:p-8 rounded-[2rem] border-4 border-black space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-blue-500 text-white rounded-2xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Store size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-widest">Dados da Empresa</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Informações básicas e fiscais</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input 
                  label="RAZÃO SOCIAL / NOME" 
                  value={localCompany.name} 
                  onChange={v => setLocalCompany({...localCompany, name: v})} 
                  placeholder="Nome oficial da empresa"
                />
                <Input 
                  label="NOME FANTASIA (OPCIONAL)" 
                  value={localCompany.tradeName || ''} 
                  onChange={v => setLocalCompany({...localCompany, tradeName: v})} 
                  placeholder="Nome comercial"
                />
                <Input 
                  label="SLOGAN DA EMPRESA" 
                  value={localCompany.slogan || ''} 
                  onChange={v => setLocalCompany({...localCompany, slogan: v})} 
                  placeholder="Ex: Qualidade e Inovação"
                />
                <Input 
                  label="CPF / CNPJ" 
                  value={localCompany.idNumber} 
                  onChange={v => setLocalCompany({...localCompany, idNumber: maskCPF_CNPJ(v)})} 
                  placeholder="00.000.000/0001-00"
                />
                <Input 
                  label="INSCRIÇÃO ESTADUAL (OPCIONAL)" 
                  value={localCompany.stateRegistration || ''} 
                  onChange={v => setLocalCompany({...localCompany, stateRegistration: v})} 
                  placeholder="Ex: 000.000.000.000"
                />
                <Input 
                  label="WEBSITE" 
                  value={localCompany.website} 
                  onChange={v => setLocalCompany({...localCompany, website: v})} 
                  placeholder="www.empresa.com"
                />
              </div>
            </div>

            {/* Section: Endereço */}
            <div className="bg-white p-4 md:p-8 rounded-[2rem] border-4 border-black space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <Truck size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-widest">Endereço</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Localização oficial da empresa</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Input 
                    label="CEP" 
                    value={localCompany.address.cep} 
                    onChange={handleCEPChange} 
                    placeholder="00000-000"
                  />
                  {isFetchingCEP && (
                    <div className="absolute right-3 bottom-4">
                      <Loader2 size={16} className="text-blue-500 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="md:col-span-2">
                  <Input 
                    label="LOGRADOURO (RUA / AV)" 
                    value={localCompany.address.logradouro} 
                    onChange={v => setLocalCompany({...localCompany, address: {...localCompany.address, logradouro: v}})} 
                    placeholder="Rua, Av..."
                  />
                </div>
                <Input 
                  label="NÚMERO" 
                  value={localCompany.address.numero} 
                  onChange={v => setLocalCompany({...localCompany, address: {...localCompany.address, numero: v}})} 
                  placeholder="123"
                />
                <Input 
                  label="BAIRRO" 
                  value={localCompany.address.bairro} 
                  onChange={v => setLocalCompany({...localCompany, address: {...localCompany.address, bairro: v}})} 
                  placeholder="Bairro"
                />
                <Input 
                  label="CIDADE" 
                  value={localCompany.address.cidade} 
                  onChange={v => setLocalCompany({...localCompany, address: {...localCompany.address, cidade: v}})} 
                  placeholder="Cidade"
                />
                <Input 
                  label="ESTADO (UF)" 
                  value={localCompany.address.estado} 
                  onChange={v => setLocalCompany({...localCompany, address: {...localCompany.address, estado: v.toUpperCase().substring(0, 2)}})} 
                  placeholder="UF"
                />
              </div>
            </div>

            {/* Section: Contato & Pagamento */}
            <div className="bg-white p-4 md:p-8 rounded-[2rem] border-4 border-black space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                  <CreditCard size={22} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-black uppercase tracking-widest">Contato & Pagamento</h3>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">Comunicação e transações</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input 
                  label="EMAIL" 
                  value={localCompany.email} 
                  onChange={v => setLocalCompany({...localCompany, email: v})} 
                  placeholder="contato@empresa.com"
                />
                <Input 
                  label="TELEFONE" 
                  value={localCompany.phone} 
                  onChange={v => setLocalCompany({...localCompany, phone: maskPhone(v)})} 
                  placeholder="(00) 00000-0000"
                />
                <Input 
                  label="CHAVE PIX" 
                  value={localCompany.pix} 
                  onChange={v => setLocalCompany({...localCompany, pix: v})} 
                  placeholder="CPF, CNPJ, Email ou Celular"
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cupons-etiquetas' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sub-abas de Navegação */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 p-1 w-full md:w-fit snap-x touch-pan-x scroll-smooth">
               {[
                 { id: 'pdv', label: 'Via PDV', icon: <FileText size={16} />, color: 'bg-black' },
                 { id: 'cliente', label: 'Cupom Cliente', icon: <Printer size={16} />, color: 'bg-blue-600' },
                 { id: 'saudacao', label: 'Cupom Saudação', icon: <Star size={16} />, color: 'bg-amber-500' },
                 { id: 'etiquetas', label: 'Etiquetas', icon: <Tag size={16} />, color: 'bg-emerald-600' }
               ].map(sub => (
                 <button
                   key={sub.id}
                   onClick={() => setPrintSubTab(sub.id as any)}
                   className={`px-6 py-4 rounded-2xl text-[10px] whitespace-nowrap font-black uppercase tracking-widest transition-all flex items-center gap-3 border-2 border-black snap-center ${
                     printSubTab === sub.id ? `${sub.color} text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] -translate-y-0.5` : 'bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'
                   }`}
                 >
                   {sub.icon} {sub.label}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Lado Esquerdo: Configurações */}
              <div className="space-y-6">
                
                {printSubTab === 'pdv' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Estrutura & Hardware</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Configurações para impressão rápida do PDV</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Formato</label>
                          <select 
                            value={localCouponPDV.format}
                            onChange={e => setLocalCouponPDV({...localCouponPDV, format: e.target.value as any})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="58mm">Térmica 58mm</option>
                            <option value="80mm">Térmica 80mm</option>
                            <option value="a4">Folha A4</option>
                            <option value="a6">Folha A6</option>
                            <option value="custom">Personalizado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Orientação</label>
                          <select 
                            value={localCouponPDV.orientation || 'portrait'}
                            onChange={e => setLocalCouponPDV({...localCouponPDV, orientation: e.target.value as any})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="portrait">Vertical (Retrato)</option>
                            <option value="landscape">Horizontal (Paisagem)</option>
                          </select>
                        </div>
                      </div>

                      {localCouponPDV.format === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <Input label="Largura (mm)" type="number" value={localCouponPDV.customWidth || 0} onChange={v => setLocalCouponPDV({...localCouponPDV, customWidth: parseInt(v) || 0})} />
                          <Input label="Altura (mm)" type="number" value={localCouponPDV.customHeight || 0} onChange={v => setLocalCouponPDV({...localCouponPDV, customHeight: parseInt(v) || 0})} />
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Conteúdo do Pedido</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Defina os elementos visíveis na via simplificada</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <Checkbox label="Ver Data/Hora" checked={localCouponPDV.showDateTime} onChange={v => setLocalCouponPDV({...localCouponPDV, showDateTime: v})} />
                        <Checkbox label="Ver Vendedor" checked={localCouponPDV.showSoldBy} onChange={v => setLocalCouponPDV({...localCouponPDV, showSoldBy: v})} />
                        <Checkbox label="Ver QR Code" checked={localCouponPDV.showQrCode} onChange={v => setLocalCouponPDV({...localCouponPDV, showQrCode: v})} />
                        <Checkbox label="Nº Pedido" checked={localCouponPDV.showOrderNumber} onChange={v => setLocalCouponPDV({...localCouponPDV, showOrderNumber: v})} />
                      </div>

                      <div className="space-y-2">
                        <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Mensagem de Topo</label>
                        <input 
                           type="text"
                           value={localCouponPDV.headerMessage}
                           onChange={e => setLocalCouponPDV({...localCouponPDV, headerMessage: e.target.value})}
                           className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        />
                      </div>

                      <button 
                        onClick={async () => {
                          const mockSale: Sale = {
                            id: 'test-sep',
                            sequentialId: '9999',
                            date: Date.now(),
                            total: 0,
                            totalCost: 0,
                            totalProfit: 0,
                            items: [],
                            status: 'pendente',
                            updatedAt: Date.now(),
                            paymentMethod: 'pix',
                            soldByUserName: currentUser?.name || 'ADMIN'
                          };
                          const testHtml = await generateSimpleReceiptHTML(mockSale, company, localCouponPDV);
                          const dims = getPaperDimensions(localCouponPDV as any);
                          performUnifiedPrint('Teste Simples Separaçao', testHtml, localCouponPDV.printerName || selectedPrinter, localCouponPDV.printMode || localCoupon.printMode, { 
                            width: dims.widthMm,
                            height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
                            format: localCouponPDV.format,
                            orientation: localCouponPDV.orientation
                          });
                        }}
                        className="w-full p-5 bg-black text-[#FFDE2E] rounded-[1.5rem] border-2 border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                      >
                        <Printer size={16} /> Imprimir Teste PDV
                      </button>
                    </div>

                    <QRCodeDesignSettings 
                      config={localCouponPDV.qrCodeDesign || INITIAL_QR_DESIGN} 
                      onChange={d => setLocalCouponPDV({...localCouponPDV, qrCodeDesign: d})} 
                    />
                  </div>
                )}

                {printSubTab === 'cliente' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Layout do Cupom</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Configurações para o cupom completo do cliente</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Formato Papel</label>
                          <select 
                            value={localCoupon.format ?? '58mm'}
                            onChange={e => setLocalCoupon({...localCoupon, format: e.target.value as any})}
                            className="w-full p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold uppercase transition-all text-zinc-100"
                          >
                            <option value="58mm">Térmica 58mm</option>
                            <option value="80mm">Térmica 80mm</option>
                            <option value="a4">Folha A4</option>
                            <option value="a6">Folha A6</option>
                            <option value="custom">Personalizado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Orientação</label>
                          <select 
                            value={localCoupon.orientation || 'portrait'}
                            onChange={e => setLocalCoupon({...localCoupon, orientation: e.target.value as any})}
                            className="w-full p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold uppercase transition-all text-zinc-100"
                          >
                            <option value="portrait">Vertical (Retrato)</option>
                            <option value="landscape">Horizontal (Paisagem)</option>
                          </select>
                        </div>
                      </div>

                      {localCoupon.format === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <Input label="Largura (mm)" type="number" value={localCoupon.width || 0} onChange={v => setLocalCoupon({...localCoupon, width: parseInt(v) || 0})} />
                          <Input label="Altura (mm)" type="number" value={localCoupon.height || 0} onChange={v => setLocalCoupon({...localCoupon, height: parseInt(v) || 0})} />
                        </div>
                      )}
                    </div>

                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Visibilidade de Dados</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">O que deve aparecer no cupom final</p>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="space-y-4">
                          <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" /> Dados da Empresa
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <Checkbox label="Ver Logo" checked={localCoupon.showLogo} onChange={v => setLocalCoupon({...localCoupon, showLogo: v})} />
                            <Checkbox label="Nome Empresa" checked={localCoupon.showCompanyName} onChange={v => setLocalCoupon({...localCoupon, showCompanyName: v})} />
                            <Checkbox label="CPF / CNPJ" checked={localCoupon.showIdNumber} onChange={v => setLocalCoupon({...localCoupon, showIdNumber: v})} />
                            <Checkbox label="Endereço" checked={localCoupon.showAddress} onChange={v => setLocalCoupon({...localCoupon, showAddress: v})} />
                          </div>
                        </div>

                        <div className="w-full border-t-2 border-black/10"></div>

                        <div className="space-y-4">
                          <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" /> Dados do Cliente
                          </div>
                          <div className="grid grid-cols-1 gap-4">
                            <Checkbox label="Exibir Bloco de Dados do Cliente" checked={localCoupon.showCustomerData} onChange={v => setLocalCoupon({...localCoupon, showCustomerData: v})} />
                            <p className="text-[9px] text-zinc-500 font-bold uppercase ml-1 opacity-60">Se ativado, exibirá Nome, Documento, WhatsApp e Endereço (se disponíveis no cadastro).</p>
                          </div>
                        </div>

                        <div className="w-full border-t-2 border-black/10"></div>

                        <div className="space-y-4">
                          <div className="text-[9px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-blue-600" /> Itens & Totais
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Checkbox label="Preço Unitário" checked={localCoupon.showItemUnitPrice} onChange={v => setLocalCoupon({...localCoupon, showItemUnitPrice: v})} />
                            <Checkbox label="Subtotal Item" checked={localCoupon.showItemSubtotal} onChange={v => setLocalCoupon({...localCoupon, showItemSubtotal: v})} />
                            <Checkbox label="Descontos" checked={localCoupon.showDiscount} onChange={v => setLocalCoupon({...localCoupon, showDiscount: v})} />
                            <Checkbox label="Total Final" checked={localCoupon.showFinalTotal} onChange={v => setLocalCoupon({...localCoupon, showFinalTotal: v})} />
                            <Checkbox label="Pagamento / Troco" checked={localCoupon.showChange} onChange={v => setLocalCoupon({...localCoupon, showChange: v})} />
                            <Checkbox label="Data / Hora" checked={localCoupon.showDateTime} onChange={v => setLocalCoupon({...localCoupon, showDateTime: v})} />
                            <Checkbox label="Nº do Pedido" checked={localCoupon.showOrderNumber} onChange={v => setLocalCoupon({...localCoupon, showOrderNumber: v})} />
                            <Checkbox label="QR Code do Pedido" checked={localCoupon.showOrderQrCode} onChange={v => setLocalCoupon({...localCoupon, showOrderQrCode: v})} />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Mensagens</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Textos adicionais para o topo e rodapé</p>
                      </div>
                      <div className="space-y-6">
                        <Input label="Cabeçalho (Header)" value={localCoupon.headerMessage} onChange={v => setLocalCoupon({...localCoupon, headerMessage: v})} />
                        <Input label="Rodapé (Footer)" value={localCoupon.footerMessage} onChange={v => setLocalCoupon({...localCoupon, footerMessage: v})} />
                        
                        <button 
                          onClick={async () => {
                            const mockSale: Sale = {
                              id: 'test-client',
                              sequentialId: '7777',
                              date: Date.now(),
                              total: 100,
                              totalCost: 60,
                              totalProfit: 40,
                              items: [{ productId: 'p1', quantity: 2, price: 50, cost: 30, profit: 20 }],
                              status: 'pendente',
                              updatedAt: Date.now(),
                              paymentMethod: 'pix'
                            };
                            const testHtml = await generateReceiptHTML(mockSale, [], [], company, localCoupon, 'VIA CLIENTE (TESTE)');
                            const dims = getPaperDimensions(localCoupon as any);
                            performUnifiedPrint('Teste Cupom Cliente', testHtml, selectedPrinter, localCoupon.printMode, {
                              width: dims.widthMm,
                              height: dims.heightMm === 'auto' ? undefined : dims.heightMm,
                              format: localCoupon.format,
                              orientation: localCoupon.orientation
                            });
                          }}
                          className="w-full p-5 bg-black text-[#FFDE2E] rounded-[1.5rem] border-2 border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                        >
                          <Printer size={16} /> Imprimir Teste Cliente
                        </button>
                      </div>
                    </div>

                    <QRCodeDesignSettings 
                      config={localCoupon.qrCodeDesign || INITIAL_QR_DESIGN} 
                      onChange={d => setLocalCoupon({...localCoupon, qrCodeDesign: d})} 
                    />
                  </div>
                )}

                {printSubTab === 'saudacao' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Formato do Papel NO TOPO */}
                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                       <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Hardware & Formato</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Dimensões para impressão da etiqueta de saudação</p>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Formato</label>
                          <select 
                            value={localGreeting.format}
                            onChange={e => setLocalGreeting({...localGreeting, format: e.target.value as any})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="58mm">Térmica 58mm</option>
                            <option value="80mm">Térmica 80mm</option>
                            <option value="a4">Folha A4</option>
                            <option value="a6">Folha A6</option>
                            <option value="custom">Personalizado</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Orientação</label>
                          <select 
                            value={localGreeting.orientation || 'portrait'}
                            onChange={e => setLocalGreeting({...localGreeting, orientation: e.target.value as any})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="portrait">Vertical (Retrato)</option>
                            <option value="landscape">Horizontal (Paisagem)</option>
                          </select>
                        </div>
                      </div>

                      {localGreeting.format === 'custom' && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-300">
                          <Input label="Largura (mm)" type="number" value={localGreeting.width || 0} onChange={v => setLocalGreeting({...localGreeting, width: parseInt(v) || 0})} />
                          <Input label="Altura (mm)" type="number" value={localGreeting.height || 0} onChange={v => setLocalGreeting({...localGreeting, height: parseInt(v) || 0})} />
                        </div>
                      )}
                    </div>

                    {/* Conteúdo da Saudação */}
                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                       <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Conteúdo & Experiência</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Personalize os textos base do cupom de saudação</p>
                      </div>
                      
                      <div className="space-y-6">
                        <Input 
                          label="Título da Etiqueta" 
                          value={localGreeting.title} 
                          onChange={v => setLocalGreeting({...localGreeting, title: v})} 
                        />
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Mensagem de Agradecimento</label>
                          <textarea 
                            value={localGreeting.message}
                            onChange={e => setLocalGreeting({...localGreeting, message: e.target.value})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[120px]"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <Checkbox label="Exibir Nome Cliente" checked={localGreeting.showCustomerName} onChange={v => setLocalGreeting({...localGreeting, showCustomerName: v})} />
                        <Checkbox label="Exibir Nº Pedido" checked={localGreeting.showOrderNumber} onChange={v => setLocalGreeting({...localGreeting, showOrderNumber: v})} />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Input label="Texto do Rodapé" value={localGreeting.footerText} onChange={v => setLocalGreeting({...localGreeting, footerText: v})} />
                        <Input label="CTA QR Code" value={localGreeting.qrCodeText || 'Acesse seu vídeo'} onChange={v => setLocalGreeting({...localGreeting, qrCodeText: v})} />
                      </div>

                      <button 
                        onClick={async () => {
                          const mockSale: Sale = {
                            id: 'test-greet',
                            sequentialId: '8888',
                            date: Date.now(),
                            total: 0,
                            totalCost: 0,
                            totalProfit: 0,
                            items: [],
                            status: 'pendente',
                            updatedAt: Date.now(),
                            customerId: 'test-c',
                            paymentMethod: 'pix'
                          };
                          const testHtml = await generateGreetingCupomHTML(mockSale, [{ id: 'test-c', name: 'CLIENTE TESTE' } as any], localGreeting);
                          const dimsSet = getPaperDimensions(localGreeting as any);
                          performUnifiedPrint('Teste Saudacao', testHtml, localGreeting.printerName || selectedPrinter, localGreeting.printMode || localCoupon.printMode, {
                            width: dimsSet.widthMm,
                            height: dimsSet.heightMm === 'auto' ? undefined : dimsSet.heightMm,
                            format: localGreeting.format,
                            orientation: localGreeting.orientation
                          });
                        }}
                        className="w-full p-5 bg-black text-[#FFDE2E] rounded-[1.5rem] border-2 border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                      >
                        <Star size={18} /> Imprimir Teste Saudação
                      </button>

                      <button 
                        onClick={() => {
                          setGreetingCouponConfig(localGreeting);
                          alert('Modelo de cupom salvo com sucesso!');
                        }}
                        className="w-full p-6 bg-[#FFDE2E] text-black border-4 border-black rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[10px_10px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5 active:translate-x-0.5"
                      >
                        <Check size={20} className="inline mr-2" /> Salvar Modelo de Cupom
                      </button>
                    </div>
                  </div>
                )}

                {printSubTab === 'etiquetas' && (
                  <div className="space-y-6 animate-in fade-in duration-300">
                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Formato do Papel</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Dimensões da etiqueta e tipo de folha</p>
                      </div>

                      <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Tipo de Folha</label>
                            <select 
                              value={localLabel.sheetType}
                              onChange={e => setLocalLabel({...localLabel, sheetType: e.target.value as any})}
                              className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            >
                              <option value="thermal">Rolo Térmico</option>
                              <option value="a4">Folha A4 (Múltiplas)</option>
                            </select>
                          </div>
                          <div className="space-y-2">
                             <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Formato</label>
                             <select 
                               value={localLabel.format}
                               onChange={e => setLocalLabel({...localLabel, format: e.target.value as any})}
                               className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                             >
                               {localLabel.sheetType === 'thermal' ? (
                                 <>
                                   <option value="custom">Personalizado</option>
                                   <option value="58mm">Térmica 58mm</option>
                                   <option value="80mm">Térmica 80mm</option>
                                 </>
                               ) : (
                                 <>
                                   <option value="a4">Folha A4</option>
                                   <option value="a6">Folha A6</option>
                                 </>
                               )}
                             </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Largura (mm)</label>
                            <input 
                              type="number" 
                              value={localLabel.width} 
                              onChange={e => setLocalLabel({...localLabel, width: parseInt(e.target.value) || 0})}
                              className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Altura (mm)</label>
                            <input 
                              type="number" 
                              value={localLabel.height} 
                              onChange={e => setLocalLabel({...localLabel, height: parseInt(e.target.value) || 0})}
                              className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                            />
                          </div>
                        </div>
                      </div>

                      <BarcodeDesignSettings 
                        config={localLabel.barcodeDesign || INITIAL_BARCODE_DESIGN} 
                        onChange={d => setLocalLabel({...localLabel, barcodeDesign: d})} 
                      />
                    </div>

                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                      <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Hardware & Conexão</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Vincule uma impressora específica para etiquetas</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Impressora de Etiquetas</label>
                          <select 
                            value={localLabel.printerName}
                            onChange={e => setLocalLabel({...localLabel, printerName: e.target.value})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="">Mesma do Sistema (Padrão)</option>
                            {localPrinters.map(p => (
                              <option key={p.id} value={p.name}>{p.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Modo de Impressão</label>
                          <select 
                            value={localLabel.printMode}
                            onChange={e => setLocalLabel({...localLabel, printMode: e.target.value as any})}
                            className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                          >
                            <option value="browser">Navegador (Diálogo)</option>
                            <option value="auto">Automático (Desktop)</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8">
                       <div>
                        <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase mb-1">Campos da Etiqueta</h4>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">O que deve ser impresso na etiqueta</p>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <Checkbox label="Nome Produto" checked={localLabel.showProductName} onChange={v => setLocalLabel({...localLabel, showProductName: v})} />
                        <Checkbox label="Preço Venda" checked={localLabel.showPrice} onChange={v => setLocalLabel({...localLabel, showPrice: v})} />
                        <Checkbox label="Código Barras" checked={localLabel.showBarcode} onChange={v => setLocalLabel({...localLabel, showBarcode: v})} />
                        <Checkbox label="Texto SKU" checked={localLabel.showCodeNumber} onChange={v => setLocalLabel({...localLabel, showCodeNumber: v})} />
                        <Checkbox label="Data Impressão" checked={localLabel.showPrintDate} onChange={v => setLocalLabel({...localLabel, showPrintDate: v})} />
                      </div>

                      <button 
                        onClick={() => {
                          const testHtml = `
                            <html>
                              <body style="font-family: sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; width: ${localLabel.width}mm; height: ${localLabel.height}mm; overflow: hidden; padding: 2mm;">
                                <p style="font-size: 10px; font-weight: bold; margin: 0; text-align: center;">PRODUTO TESTE EXEMPLO</p>
                                <div style="width: 80%; height: 10mm; border: 1px solid #000; margin: 2mm 0; display: flex; items-center; justify-center; font-size: 8px;">COD BARRAS</div>
                                <p style="font-size: 12px; font-weight: bold; margin: 0;">R$ 99,99</p>
                              </body>
                            </html>
                          `;
                          performUnifiedPrint('Teste Etiqueta', testHtml, selectedLabelPrinter || selectedPrinter, localLabel.printMode, {
                            width: localLabel.width,
                            height: localLabel.height,
                            format: 'custom'
                          });
                        }}
                        className="w-full p-5 bg-black text-[#FFDE2E] rounded-[1.5rem] border-2 border-black font-black text-xs uppercase tracking-widest transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
                      >
                        <Tag size={16} /> Imprimir Teste Etiqueta
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Lado Direito: Prévia Visual */}
              <div className="sticky top-6 h-fit hidden lg:block">
                <div className="bg-zinc-950 rounded-[3rem] p-12 border border-zinc-800 shadow-inner flex flex-col items-center min-h-[400px]">
                  <div className="flex items-center gap-3 mb-10 bg-zinc-900 px-6 py-2.5 rounded-full border border-zinc-800 shadow-sm">
                     <div className="animate-pulse w-2 h-2 rounded-full bg-blue-500" />
                     <span className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em]">Simulação Visual</span>
                  </div>

                  {(() => {
                    const config = printSubTab === 'pdv' ? localCouponPDV : 
                                  printSubTab === 'cliente' ? localCoupon : 
                                  printSubTab === 'saudacao' ? localGreeting : 
                                  { ...localLabel, format: localLabel.sheetType === 'a4' ? 'a4' : 'custom', customWidth: localLabel.width, customHeight: localLabel.height };
                    
                    const dims = getPaperDimensions(config);
                    
                    // Escala para prévia (alvo ~250px largura)
                    const TARGET_WIDTH_PX = 250;
                    const scale = TARGET_WIDTH_PX / dims.widthMm;
                    
                    return (
                      <div 
                        style={{ 
                          width: `${dims.widthMm * scale}px`, 
                          height: dims.heightMm === 'auto' ? 'auto' : `${(dims.heightMm as number) * scale}px`,
                          minHeight: dims.heightMm === 'auto' ? '350px' : 'auto'
                        }}
                        className="bg-white rounded-sm shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden transition-all duration-500 border border-zinc-200"
                      >
                         {/* Conteúdo Simulado */}
                         <div className="p-4 text-black font-sans select-none" style={{ zoom: scale / 3.78 }}>
                            {printSubTab === 'pdv' && (
                              <div className="text-center space-y-4">
                                 <p className="text-[10px] font-bold uppercase">{localCouponPDV.headerMessage}</p>
                                 <div className="border-4 border-black p-4 text-2xl font-black">PEDIDO: #9999</div>
                                 <div className="w-24 h-24 bg-zinc-100 mx-auto rounded flex items-center justify-center text-[10px] text-zinc-400">QR CODE</div>
                              </div>
                            )}
                            {printSubTab === 'cliente' && (
                              <div className="space-y-4">
                                 <div className="text-center border-b border-black pb-4">
                                    <h3 className="font-bold uppercase text-lg leading-tight">{company.tradeName || 'Sua Empresa'}</h3>
                                    <p className="text-[9px] uppercase tracking-tighter">{localCoupon.headerMessage}</p>
                                 </div>
                                 <div className="space-y-2 border-b border-black pb-4">
                                    <div className="flex justify-between text-[11px] font-bold"><span>ITEM EXEMPLO 1</span> <span>R$ 50,00</span></div>
                                    <div className="flex justify-between text-[11px] font-bold"><span>ITEM EXEMPLO 2</span> <span>R$ 50,00</span></div>
                                 </div>
                                 <div className="text-right font-black text-xl">TOTAL: R$ 100,00</div>
                                 <div className="text-center pt-4 border-t border-dashed border-black">
                                    <p className="text-[10px] mb-2">{localCoupon.footerMessage}</p>
                                    <div className="w-16 h-16 bg-zinc-100 mx-auto rounded flex items-center justify-center text-[8px] text-zinc-400">QR</div>
                                 </div>
                              </div>
                            )}
                            {printSubTab === 'saudacao' && (
                              <div className="text-center space-y-6 pt-4">
                                 <h2 className="text-2xl font-black uppercase tracking-tighter leading-none">{localGreeting.title}</h2>
                                 <p className="italic text-zinc-700 text-sm leading-relaxed">"{localGreeting.message}"</p>
                                 <div className="w-32 h-32 bg-zinc-100 mx-auto rounded flex items-center justify-center text-[10px] text-zinc-400">QR CODE</div>
                                 <p className="text-[10px] font-bold uppercase border-t border-zinc-200 pt-4">{localGreeting.footerText}</p>
                              </div>
                            )}
                            {printSubTab === 'etiquetas' && (
                              <div className="h-full flex flex-col items-center justify-center p-2 text-center min-h-[100px]">
                                 <p className="font-black text-[14px] uppercase mb-2 leading-tight">NOME DO PRODUTO</p>
                                 <div className="w-full h-8 bg-zinc-100 border border-zinc-300 mb-2 flex items-center justify-center text-[8px]">BARCODE</div>
                                 <p className="text-2xl font-black italic">R$ 99,99</p>
                              </div>
                            )}
                         </div>
                         
                         {/* Overlay de Dimensões */}
                         <div className="absolute inset-0 border-2 border-dashed border-blue-500/20 pointer-events-none flex items-end justify-center pb-2">
                            <div className="bg-blue-600 text-[8px] text-white px-3 py-1 rounded-full font-black uppercase tracking-tighter shadow-xl flex items-center gap-2">
                               <Maximize2 size={8} /> {dims.widthMm}mm x {dims.heightMm === 'auto' ? 'ALTURA VARIÁVEL' : `${dims.heightMm}mm`}
                            </div>
                         </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'seguranca' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Roles Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 bg-white p-6 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-blue-600 text-white rounded-2xl border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <ShieldCheck size={32} />
                   </div>
                   <div>
                      <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase">Gestão de Funções</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Configure permissões por cargo</p>
                   </div>
                </div>
                <div className="flex gap-4 w-full sm:w-auto">
                  <input 
                    placeholder="Nova Função..." 
                    className="flex-1 sm:w-64 p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                    value={newRole.name ?? ''}
                    onChange={e => setNewRole({name: e.target.value})}
                  />
                  <button onClick={addRole} className="bg-[#FFDE2E] text-black px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center gap-3">
                    <Plus size={18} /> Cadastrar
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-8">
                {localRoles.map(role => {
                  const isExpanded = expandedRoles.includes(role.id);
                  return (
                    <div key={role.id} className="bg-white rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] overflow-hidden">
                      <div className="p-8 flex items-center justify-between border-b-2 border-black/5">
                        <div 
                          className="flex items-center gap-5 cursor-pointer flex-1 group"
                          onClick={() => setExpandedRoles(prev => prev.includes(role.id) ? prev.filter(id => id !== role.id) : [...prev, role.id])}
                        >
                          <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white border-2 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] group-hover:scale-105 transition-transform">
                            <Lock size={24} />
                          </div>
                          <div>
                            <div className="flex items-center gap-3">
                              <h5 className="text-lg font-black text-black uppercase tracking-tight">{role.name}</h5>
                              <div className={`p-1 bg-zinc-100 rounded-full border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown size={14} className="text-black" />
                              </div>
                            </div>
                            {role.isDefault && <span className="text-[8px] bg-black text-white px-3 py-1 rounded-full font-black uppercase tracking-[0.2em] mt-1 inline-block">Função Padrão</span>}
                          </div>
                        </div>
                        {!role.isDefault && (
                          <button 
                            onClick={() => setLocalRoles(localRoles.filter(r => r.id !== role.id))}
                            className="bg-red-500 text-white p-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] hover:bg-red-600 transition-all hover:scale-110 active:scale-95"
                          >
                            <Trash2 size={20} />
                          </button>
                        )}
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden bg-zinc-50"
                          >
                            <div className="p-8 grid grid-cols-1 gap-4 border-t-2 border-black/5">
                              {[
                                { id: 'dashboard', label: 'Dashboard' },
                                { id: 'pdv', label: 'PDV / Vendas' },
                                { id: 'consultarPedido', label: 'Consultar Pedido' },
                                { id: 'separacao', label: 'Separação' },
                                { id: 'estoque', label: 'Estoque' },
                                { id: 'financeiro', label: 'Financeiro' },
                                { id: 'historico', label: 'Histórico' },
                                { id: 'ajustes', label: 'Ajustes' },
                              ].map(mod => (
                                <div key={mod.id} className="flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-b-2 border-black/5 last:border-0 hover:bg-black/5 px-4 rounded-2xl transition-colors">
                                   <div className="flex flex-col">
                                     <span className="text-xs font-black uppercase tracking-[0.2em] text-black">{mod.label}</span>
                                   </div>
                                   <div className="flex gap-2 p-1 border-2 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                      {[
                                        { id: 'total', label: 'Acesso Total', activeColor: 'bg-emerald-500' },
                                        { id: 'limitado', label: 'Acesso Limitado', activeColor: 'bg-amber-500' },
                                        { id: 'nenhum', label: 'Sem Acesso', activeColor: 'bg-red-500' },
                                      ].map(level => {
                                         const isActive = role.permissions[mod.id as keyof ModulePermissions] === level.id;
                                         return (
                                           <button
                                             key={level.id}
                                             onClick={() => setPermissionLevel(role.id, mod.id as keyof ModulePermissions, level.id as AccessLevel)}
                                             className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${isActive ? `${level.activeColor} text-white shadow-inner` : 'text-zinc-400 hover:text-black hover:bg-zinc-100'}`}
                                           >
                                             {level.label}
                                           </button>
                                         );
                                      })}
                                   </div>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="w-full border-t-4 border-black/10 my-12" />

            {/* Users Section */}
            <div className="space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                   <div className="w-16 h-16 bg-amber-500 text-white rounded-2xl border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                      <UserPlus size={32} />
                   </div>
                   <div>
                      <h4 className="text-[12px] font-black text-black tracking-[0.2em] uppercase">Gestão de Usuários</h4>
                      <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-tight">Controle de acesso ao sistema</p>
                   </div>
                </div>
                <div className="flex p-2 bg-white rounded-3xl border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <button 
                    onClick={() => setUserTab('ativos')}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${userTab === 'ativos' ? 'bg-[#FFDE2E] text-black shadow-inner' : 'text-zinc-500 hover:text-black'}`}
                  >
                    Ativos
                  </button>
                  <button 
                    onClick={() => setUserTab('inativos')}
                    className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${userTab === 'inativos' ? 'bg-red-500 text-white shadow-inner' : 'text-zinc-500 hover:text-black hover:text-red-500'}`}
                  >
                    Inativos
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-zinc-50 p-6 md:p-10 rounded-[3rem] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)]">
                <Input label="NOME COMPLETO" value={newUser.name} onChange={v => setNewUser({...newUser, name: v})} placeholder="Ex: João Silva" />
                <Input label="LOGIN DE ACESSO" value={newUser.username} onChange={v => setNewUser({...newUser, username: v})} placeholder="Ex: joao.vendas" />
                <Input label="SENHA" value={newUser.password} onChange={v => setNewUser({...newUser, password: v})} type="password" placeholder="****" />
                <div className="space-y-1.5 flex flex-col">
                  <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1 block">Função / Cargo</label>
                  <select 
                    value={newUser.roleId ?? ''} 
                    onChange={e => setNewUser({...newUser, roleId: e.target.value})}
                    className="w-full p-4 bg-white rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <option value="">Sem Função</option>
                    {localRoles.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
                <button 
                  onClick={addUser}
                  className="md:col-span-2 lg:col-span-4 bg-black text-[#FFDE2E] p-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] hover:translate-x-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all flex items-center justify-center gap-4 active:translate-y-0 active:shadow-none"
                >
                  <UserPlus size={22} /> Confirmar Cadastro
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {users.filter(u => userTab === 'ativos' ? (u.isActive !== false) : (u.isActive === false)).map(u => {
                  const role = localRoles.find(r => r.id === u.roleId);
                  return (
                    <div key={u.id} className="p-6 bg-white rounded-[2rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] flex items-center justify-between group hover:translate-y-[-2px] transition-all">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-lg uppercase border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${u.isActive !== false ? 'bg-[#FFDE2E] text-black' : 'bg-zinc-200 text-zinc-500'}`}>
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-black text-black uppercase tracking-tight">{u.name}</p>
                          <div className="flex flex-col gap-0.5">
                             <div className="flex items-center gap-2">
                               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">User: {u.username}</p>
                               {role && <span className="text-[8px] bg-black text-white px-2 py-0.5 rounded-full font-black uppercase tracking-widest">{role.name}</span>}
                             </div>
                             {!u.isActive && u.deactivatedAt && (
                               <p className="text-[8px] font-bold text-red-600 uppercase mt-1">Desativado em: {new Date(u.deactivatedAt).toLocaleDateString('pt-BR')}</p>
                             )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {u.isActive !== false ? (
                          <>
                            <button 
                              onClick={() => {
                                setResettingUser(u);
                                setVerificationCode(Math.floor(100000 + Math.random() * 900000).toString());
                                setShowResetModal(true);
                              }}
                              className="p-3 bg-white border-2 border-black rounded-xl hover:bg-[#FFDE2E] shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              <Lock size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                setEditingRoleUser(u);
                                setSelectedEditRoleId(u.roleId || '');
                                setShowRoleEditModal(true);
                              }}
                              className="p-3 bg-white border-2 border-black rounded-xl hover:bg-indigo-400 hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              <ShieldCheck size={18} />
                            </button>
                            <button 
                              onClick={() => {
                                if (u.id === currentUser?.id) {
                                  alert('Você não pode desativar seu próprio usuário!');
                                  return;
                                }
                                if (u.username === 'admin') {
                                  alert('O administrador principal não pode ser desativado!');
                                  return;
                                }
                                setDeactivatingUser(u);
                                setShowDeactivateModal(true);
                              }}
                              className="p-3 bg-white border-2 border-black rounded-xl hover:bg-red-500 hover:text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => {
                              setUsers(users.map(usr => usr.id === u.id ? { ...usr, isActive: true, deactivatedAt: undefined } : usr));
                              addActivity('security', 'Usuário Reativado', `O usuário ${u.name} foi reativado no sistema.`);
                              alert('Usuário reativado com sucesso');
                            }}
                            className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all flex items-center gap-2"
                          >
                            <RefreshCw size={14} /> Reativar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Password Reset Modal */}
            {showResetModal && resettingUser && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black animate-in zoom-in-95 duration-200">
                   <div className="flex flex-col items-center text-center space-y-4 mb-8">
                      <div className="w-20 h-20 bg-[#FFDE2E] text-black rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-2">
                        <Lock size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-black uppercase tracking-tight">Redefinir Senha</h3>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Usuário: {resettingUser.name}</p>
                   </div>

                   <div className="bg-zinc-50 p-8 rounded-[2rem] border-4 border-black mb-8 text-center shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-[0.2em] mb-3">Código de Verificação</p>
                      <p className="text-4xl font-black text-black tracking-[0.5em]">{verificationCode}</p>
                   </div>

                   <div className="space-y-6">
                      <Input 
                        label="NOVA SENHA" 
                        type="password"
                        value={newPassword} 
                        onChange={setNewPassword} 
                        placeholder="Mínimo 6 caracteres" 
                      />
                      <Input 
                        label="CONFIRMAR NOVA SENHA" 
                        type="password"
                        value={confirmPassword} 
                        onChange={setConfirmPassword} 
                        placeholder="Digite novamente" 
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-6 mt-10">
                      <button 
                        onClick={() => {
                          setShowResetModal(false);
                          setResettingUser(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="p-5 rounded-2xl border-4 border-black text-[11px] font-black uppercase tracking-widest text-black hover:bg-zinc-100 transition-all flex items-center justify-center"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          if (newPassword !== confirmPassword) {
                            alert('As senhas não coincidem!');
                            return;
                          }
                          if (newPassword.length < 4) {
                            alert('Senha muito curta!');
                            return;
                          }
                          setUsers(users.map(u => u.id === resettingUser.id ? { ...u, password: newPassword } : u));
                          addActivity('security', 'Senha Redefinida', `Senha do usuário ${resettingUser.name} foi redefinida manualmente.`);
                          alert('Senha redefinida com sucesso');
                          setShowResetModal(false);
                          setResettingUser(null);
                          setNewPassword('');
                          setConfirmPassword('');
                        }}
                        className="p-5 rounded-2xl bg-black text-[#FFDE2E] text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center"
                      >
                        Salvar Nova Senha
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* Role Edit Modal */}
            {showRoleEditModal && editingRoleUser && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black animate-in zoom-in-95 duration-200">
                   <div className="flex flex-col items-center text-center space-y-4 mb-8">
                      <div className="w-20 h-20 bg-indigo-500 text-white rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-2">
                        <ShieldCheck size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-black uppercase tracking-tight">Editar Função</h3>
                      <p className="text-[10px] text-zinc-500 font-black uppercase tracking-[0.2em]">Usuário: {editingRoleUser.name}</p>
                   </div>

                   <div className="space-y-6">
                      <div className="space-y-1.5 flex flex-col">
                        <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1 block">Nova Função / Cargo</label>
                        <select 
                          value={selectedEditRoleId} 
                          onChange={e => setSelectedEditRoleId(e.target.value)}
                          className="w-full p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        >
                          <option value="">Sem Função</option>
                          {localRoles.map(r => (
                            <option key={r.id} value={r.id}>{r.name}</option>
                          ))}
                        </select>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6 mt-10">
                      <button 
                        onClick={() => {
                          setShowRoleEditModal(false);
                          setEditingRoleUser(null);
                        }}
                        className="p-5 rounded-2xl border-4 border-black text-[11px] font-black uppercase tracking-widest text-black hover:bg-zinc-100 transition-all flex items-center justify-center"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          const updatedUsers = users.map(u => u.id === editingRoleUser.id ? { ...u, roleId: selectedEditRoleId } : u);
                          setUsers(updatedUsers);

                          if (currentUser && editingRoleUser.id === currentUser.id) {
                            const updatedMe = updatedUsers.find(u => u.id === currentUser.id);
                            if (updatedMe) setCurrentUser(updatedMe);
                          }

                          const newRoleName = localRoles.find(r => r.id === selectedEditRoleId)?.name || 'Sem Função';
                          addActivity('security', 'Função Alterada', `Função do usuário ${editingRoleUser.name} alterada para ${newRoleName}.`);
                          alert('Função atualizada com sucesso');
                          setShowRoleEditModal(false);
                          setEditingRoleUser(null);
                        }}
                        className="p-5 rounded-2xl bg-black text-[#FFDE2E] text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center"
                      >
                        Salvar Alteração
                      </button>
                   </div>
                </div>
              </div>
            )}

            {/* Deactivation Modal */}
            {showDeactivateModal && deactivatingUser && (
              <div className="fixed inset-0 bg-black/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] border-4 border-black animate-in zoom-in-95 duration-200">
                   <div className="flex flex-col items-center text-center space-y-4 mb-8">
                      <div className="w-20 h-20 bg-red-500 text-white rounded-[2rem] border-4 border-black flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mb-2">
                        <Trash2 size={40} />
                      </div>
                      <h3 className="text-2xl font-black text-black uppercase tracking-tight">Desativar Usuário?</h3>
                      <p className="text-[11px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                        TEM CERTEZA QUE DESEJA DESATIVAR ESTE USUÁRIO? ELE SERÁ MOVIDO PARA A LISTA DE INATIVOS.
                      </p>
                   </div>

                    <div className="bg-zinc-50 p-8 rounded-[2rem] border-4 border-black mb-8 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center font-black text-black border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)]">
                           {deactivatingUser.name.charAt(0)}
                         </div>
                         <div className="text-left">
                            <p className="text-lg font-black text-black uppercase leading-none">{deactivatingUser.name}</p>
                            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">
                               {localRoles.find(r => r.id === deactivatingUser.roleId)?.name || 'Sem Função'}
                            </p>
                         </div>
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <button 
                        onClick={() => {
                          setShowDeactivateModal(false);
                          setDeactivatingUser(null);
                        }}
                        className="p-5 rounded-2xl border-4 border-black text-[11px] font-black uppercase tracking-widest text-black hover:bg-zinc-100 transition-all flex items-center justify-center"
                      >
                        Cancelar
                      </button>
                      <button 
                        onClick={() => {
                          setUsers(users.map(u => u.id === deactivatingUser.id ? { ...u, isActive: false, deactivatedAt: new Date().toISOString() } : u));
                          addActivity('security', 'Usuário Desativado', `O usuário ${deactivatingUser.name} foi desativado.`);
                          alert('Usuário desativado com sucesso');
                          setShowDeactivateModal(false);
                          setDeactivatingUser(null);
                        }}
                        className="p-5 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.3)] active:translate-y-0.5 active:shadow-none flex items-center justify-center"
                      >
                        Confirmar
                      </button>
                   </div>
                </div>
              </div>
            )}
          </div>
        )}


        {activeTab === 'entrega' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white p-4 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8 text-black">
              <div className="flex items-center gap-3">
                <Truck size={24} />
                <h3 className="text-[12px] font-black uppercase tracking-widest">Configuração de Entrega</h3>
              </div>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <label className="text-[9px] font-black text-black opacity-40 tracking-widest uppercase ml-1">Adicionar Novo Tipo</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         id="new-delivery-method"
                         placeholder="NOME DO TIPO (EX: MOTOBOY)" 
                         className="flex-1 p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                       />
                       <button 
                         onClick={() => {
                           const input = document.getElementById('new-delivery-method') as HTMLInputElement;
                           if (input.value.trim()) {
                             setLocalDeliveryMethods([...localDeliveryMethods, { id: crypto.randomUUID(), name: input.value.trim(), isActive: true }]);
                             input.value = '';
                           }
                         }}
                         className="bg-[#FFDE2E] text-black p-4 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all"
                       >
                         <Plus size={20} />
                       </button>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-50 rounded-[2rem] overflow-hidden border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                  <div className="p-5 border-b-4 border-black flex justify-between bg-black text-[#FFDE2E]">
                    <span className="text-[10px] font-black uppercase tracking-widest">Tipos de Entrega</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">Ações</span>
                  </div>
                  <div className="divide-y-2 divide-black">
                    {localDeliveryMethods.map(method => (
                      <div key={method.id} className="p-5 flex items-center justify-between bg-white hover:bg-zinc-50 transition-colors">
                        <div className="flex items-center gap-4">
                          <Truck size={18} className={method.isActive ? 'text-black' : 'text-zinc-300'} />
                          <span className={`text-sm font-black uppercase tracking-tight ${method.isActive ? 'text-black' : 'text-zinc-300 line-through'}`}>{method.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => {
                              setLocalDeliveryMethods(localDeliveryMethods.map(m => m.id === method.id ? { ...m, isActive: !m.isActive } : m));
                            }}
                            className={`p-3 rounded-xl border-2 border-black transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${method.isActive ? 'bg-[#FFDE2E]' : 'bg-zinc-200'}`}
                          >
                            {method.isActive ? <Unlock size={16} /> : <Lock size={16} />}
                          </button>
                          <button 
                            onClick={() => {
                              if(confirm('Excluir este método?')) {
                                setLocalDeliveryMethods(localDeliveryMethods.filter(m => m.id !== method.id));
                              }
                            }}
                            className="p-3 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'impressao' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-6">
              {/* Modo de Impressão Global */}
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 text-black">
                <div>
                  <h4 className="text-[11px] font-black text-black tracking-[0.2em] uppercase mb-1">Modo de Operação</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Defina como o sistema deve disparar as impressões</p>
                </div>
                <div className="flex gap-4">
                  {[
                    { id: 'browser', label: 'Navegador (Padrão)', icon: <Monitor size={14} /> },
                    { id: 'auto', label: 'Automático (Desktop)', icon: <Cpu size={14} /> }
                  ].map(mode => (
                    <button 
                      key={mode.id}
                      onClick={() => {
                        setLocalCoupon({ ...localCoupon, printMode: mode.id as any });
                        setLocalCouponPDV({ ...localCouponPDV, printMode: mode.id as any });
                        setLocalLabel({ ...localLabel, printMode: mode.id as any });
                      }}
                      className={`flex-1 p-5 rounded-2xl border-4 transition-all flex flex-col items-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${
                        localCoupon.printMode === mode.id ? 'border-black bg-[#FFDE2E] text-black scale-105' : 'border-black bg-zinc-50 text-zinc-400 hover:bg-zinc-100'
                      }`}
                    >
                      <div className={localCoupon.printMode === mode.id ? 'text-black' : 'text-zinc-600'}>{mode.icon}</div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{mode.label}</span>
                    </button>
                  ))}
                </div>
                {localCoupon.printMode === 'auto' && (
                  <div className={`p-4 rounded-2xl border-4 flex gap-3 ${
                    (window as any).electronAPI 
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                      : 'bg-amber-50 border-amber-500 text-amber-700'
                  }`}>
                    <div className="shrink-0 mt-0.5">
                      {(window as any).electronAPI ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
                    </div>
                    <p className="text-[9px] font-black uppercase leading-relaxed">
                      {(window as any).electronAPI 
                        ? 'Modo desktop ativo. As impressoras do seu sistema serão usadas para impressão direta.'
                        : 'O modo automático funciona de forma otimizada na versão Desktop instalada.'
                      }
                    </p>
                  </div>
                )}
              </div>

              {/* Hardware & Dispositivos */}
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8 text-black">
                <div className="flex items-center justify-between border-b-4 border-black pb-4">
                  <div>
                    <h4 className="text-[11px] font-black text-black tracking-[0.2em] uppercase mb-1">1. Sincronizar Hardware</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Busca impressoras instaladas no Windows</p>
                  </div>
                  <button 
                    disabled={!(window as any).electronAPI}
                    onClick={async () => {
                      console.log("[Hardware] Solicitando sincronização de impressoras...");
                      try {
                        const sysPrinters = await (window as any).electronAPI.getPrinters();
                        console.log("[Hardware] Impressoras reais encontradas:", sysPrinters);
                        
                        if (sysPrinters && Array.isArray(sysPrinters)) {
                          setLocalHardwarePrinters(sysPrinters);
                          setHardwarePrinters(sysPrinters); 
                        } else {
                          alert('O sistema não retornou uma lista válida de impressoras.');
                        }
                      } catch (err) {
                        console.error('[Hardware] Erro crítico ao carregar:', err);
                        alert('Erro ao carregar impressoras reais. Verifique se o Electron está corretamente configurado.');
                      }
                    }}
                    className={`p-3 rounded-xl transition-all flex items-center gap-2 border-4 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none ${
                      (window as any).electronAPI 
                        ? 'bg-[#FFDE2E] text-black hover:bg-yellow-400' 
                        : 'bg-zinc-100 text-zinc-400 border-zinc-200 cursor-not-allowed opacity-50 shadow-none'
                    }`}
                  >
                    <RefreshCw size={14} /> <span className="text-[10px] font-black uppercase">Sincronizar</span>
                  </button>
                </div>

                {/* Lista de Impressoras Encontradas */}
                {localHardwarePrinters.length > 0 && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    <h5 className="text-[9px] font-black text-black uppercase tracking-widest flex items-center gap-2">
                      <CheckCircle size={12} className="text-emerald-500" /> Impressoras sistema:
                    </h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {localHardwarePrinters.map((p: any) => {
                        const isRegistered = registeredPrinters.some(r => r.name === p.name);
                        return (
                          <div key={p.name} className="p-4 bg-zinc-50 border-2 border-black rounded-2xl flex items-center justify-between group hover:bg-[#FFDE2E]/10 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-white border-2 border-black flex items-center justify-center text-black">
                                <Printer size={16} />
                              </div>
                              <div className="max-w-[150px]">
                                <p className="text-[10px] font-black text-black uppercase truncate">{p.displayName || p.name}</p>
                                <p className="text-[8px] font-bold text-zinc-500 uppercase truncate">{p.name}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                if (isRegistered) {
                                  alert('Impressora já está cadastrada.');
                                  return;
                                }
                                const newRegistered = [...registeredPrinters, {
                                  id: p.name,
                                  name: p.name,
                                  displayName: p.displayName || p.name,
                                  type: 'thermal',
                                  connection: 'usb'
                                }];
                                setRegisteredPrinters(newRegistered);
                                addActivity('ajustes', 'Impressora Cadastrada', `Impressora ${p.name} cadastrada para uso.`);
                              }}
                              disabled={isRegistered}
                              className={`p-2 rounded-lg border-2 border-black transition-all ${
                                isRegistered 
                                  ? 'bg-emerald-500 text-white cursor-not-allowed opacity-70 shadow-none' 
                                  : 'bg-[#FFDE2E] text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none'
                              }`}
                            >
                              {isRegistered ? <Check size={14} /> : <Plus size={14} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Impressoras Cadastradas */}
                <div className="pt-4 border-t-4 border-black space-y-6">
                  <div>
                    <h4 className="text-[11px] font-black text-black tracking-[0.2em] uppercase mb-1">2. Impressoras Ativas</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Hardware disponível para uso no Cloud</p>
                  </div>

                  {registeredPrinters.length === 0 ? (
                    <div className="p-8 bg-zinc-50 border-4 border-dashed border-black rounded-[2rem] flex flex-col items-center justify-center text-center gap-4">
                      <div className="w-12 h-12 bg-white border-2 border-black rounded-2xl flex items-center justify-center text-zinc-300">
                        <Monitor size={24} />
                      </div>
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest max-w-[200px]">Nenhuma impressora. Sincronize acima.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {registeredPrinters.map(p => (
                        <div key={p.id} className="p-5 bg-white border-4 border-black rounded-[1.5rem] flex items-center justify-between hover:bg-zinc-50 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-[#FFDE2E] border-2 border-black flex items-center justify-center shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                              <Printer size={20} />
                            </div>
                            <div>
                              <p className="text-[11px] font-black text-black uppercase tracking-tight">{p.displayName}</p>
                              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Device: {p.name}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => {
                              if (confirm('Deseja remover esta impressora cadastrada?')) {
                                setRegisteredPrinters(registeredPrinters.filter(r => r.id !== p.id));
                              }
                            }}
                            className="p-3 bg-red-50 text-red-600 border-2 border-black rounded-xl hover:bg-red-600 hover:text-white transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:shadow-none"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t-4 border-black">
                  <div className="mb-6">
                    <h4 className="text-[11px] font-black text-black tracking-[0.2em] uppercase mb-1">3. Utilizar nos Perfis</h4>
                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-tight">Vincule as impressoras cadastradas aos blocos de uso</p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Coluna Cupom */}
                    <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#5d5dff] border-2 border-black flex items-center justify-center text-white shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <FileText size={20} />
                        </div>
                        <h5 className="text-[12px] font-black text-black uppercase tracking-widest">Cupom / PDV</h5>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Nome do Perfil</label>
                          <input 
                            type="text"
                            value={localCouponPDV.profileName || ''}
                            onChange={e => setLocalCouponPDV({...localCouponPDV, profileName: e.target.value})}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black"
                            placeholder="Ex: Balcão"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Impressora</label>
                          <select 
                            value={localCouponPDV.printerName || ''}
                            onChange={e => {
                              setLocalCouponPDV({...localCouponPDV, printerName: e.target.value});
                              setLocalCoupon({...localCoupon, printerName: e.target.value});
                              setLocalSelectedPrinter(e.target.value);
                              setSelectedPrinter(e.target.value);
                            }}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black cursor-pointer"
                          >
                            <option value="">Nenhuma impressora ativa</option>
                            {registeredPrinters.map((p) => (
                              <option key={p.id} value={p.name}>{p.displayName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Modo de Impressão</label>
                          <select 
                            value={localCouponPDV.printMode || 'browser'}
                            onChange={e => {
                              setLocalCouponPDV({...localCouponPDV, printMode: e.target.value as any});
                              setLocalCoupon({...localCoupon, printMode: e.target.value as any});
                            }}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black cursor-pointer"
                          >
                            <option value="browser">Diálogo do Sistema (Navegador)</option>
                            <option value="auto">Automático (Desktop / Silencioso)</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => performUnifiedPrint('Teste Cupom PDV', `
                          <html>
                            <body style="font-family: sans-serif; text-align: center; padding: 10mm;">
                              <h2 style="margin: 0;">TESTE PDV</h2>
                              <p>Perfil: ${localCouponPDV.profileName || 'Cupom'}</p>
                              <p>Hardware: ${localCouponPDV.printerName || 'Padrão'}</p>
                              <p>Modo: ${localCouponPDV.printMode === 'auto' ? 'Automático' : 'Diálogo'}</p>
                              <hr/>
                              <p>${new Date().toLocaleString()}</p>
                            </body>
                          </html>
                        `, localCouponPDV.printerName, localCouponPDV.printMode)}
                        className="w-full py-4 bg-black text-[#FFDE2E] text-[10px] font-black uppercase border-4 border-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]"
                      >
                        <Printer size={16} /> Testar Impressão
                      </button>
                    </div>

                    {/* Coluna Etiqueta */}
                    <div className="space-y-4 p-8 bg-zinc-50 rounded-[2.5rem] border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-[#FFDE2E] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            <Tag size={20} />
                        </div>
                        <h5 className="text-[12px] font-black text-black uppercase tracking-widest">Etiquetas</h5>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Nome do Perfil</label>
                          <input 
                            type="text"
                            value={localLabel.profileName || ''}
                            onChange={e => setLocalLabel({...localLabel, profileName: e.target.value})}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black"
                            placeholder="Ex: Etiquetas"
                          />
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Impressora</label>
                          <select 
                            value={localLabel.printerName || selectedLabelPrinter}
                            onChange={e => {
                              setSelectedLabelPrinter(e.target.value);
                              setLocalLabel({...localLabel, printerName: e.target.value});
                            }}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black cursor-pointer"
                          >
                            <option value="">Nenhuma impressora ativa</option>
                            {registeredPrinters.map((p) => (
                              <option key={p.id} value={p.name}>{p.displayName}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[8px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Modo de Impressão</label>
                          <select 
                            value={localLabel.printMode || 'browser'}
                            onChange={e => setLocalLabel({...localLabel, printMode: e.target.value as any})}
                            className="w-full p-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-xs font-black transition-all uppercase text-black cursor-pointer"
                          >
                            <option value="browser">Diálogo do Sistema (Navegador)</option>
                            <option value="auto">Automático (Desktop / Silencioso)</option>
                          </select>
                        </div>
                      </div>
                      <button 
                        onClick={() => performUnifiedPrint('Teste Etiqueta', `
                          <html>
                            <body style="font-family: sans-serif; text-align: center; padding: 5mm;">
                              <h3 style="margin: 0;">ETIQUETA TESTE</h3>
                              <p style="font-size: 10px;">Perfil: ${localLabel.profileName || 'Geral'}</p>
                              <p style="font-size: 10px;">Hardware: ${localLabel.printerName || selectedLabelPrinter || 'Default'}</p>
                              <p style="font-size: 8px;">${new Date().toLocaleString()}</p>
                            </body>
                          </html>
                        `, localLabel.printerName || selectedLabelPrinter, localLabel.printMode)}
                        className="w-full py-4 bg-black text-[#FFDE2E] text-[10px] font-black uppercase border-4 border-black rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]"
                      >
                        <Printer size={16} /> Testar Impressão
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t-4 border-black">
                   <button 
                      onClick={async () => {
                        const testContent = `
                          <html>
                            <body style="font-family: sans-serif; padding: 10mm; text-align: center;">
                              <h2>TESTE DE IMPRESSÃO</h2>
                              <p>Perfil: ${localCouponPDV.profileName || 'Geral'}</p>
                              <p>Hardware: ${localCouponPDV.printerName || localSelectedPrinter || 'Padrão'}</p>
                              <p>Modo: ${localCouponPDV.printMode === 'auto' ? 'Automático (Silencioso)' : 'Diálogo'}</p>
                              <p>Data: ${new Date().toLocaleString()}</p>
                              <hr />
                              <p>Sistema Ativo - Impressão OK</p>
                            </body>
                          </html>
                        `;
                        
                        // Usa a função unificada que já lida com Electron vs Browser
                        await performUnifiedPrint('Teste Geral', testContent, localCouponPDV.printerName || localSelectedPrinter, localCouponPDV.printMode);
                      }}
                      className="w-full p-5 bg-[#5d5dff] hover:bg-[#4d4dff] text-white border-4 border-black rounded-2xl text-[12px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-4 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px]"
                    >
                      <Printer size={20} /> Testar Impressora Geral
                    </button>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                       <div className="p-4 bg-zinc-50 border-4 border-black rounded-2xl flex items-center gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black text-black flex items-center justify-center font-black text-sm">P</div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-400 uppercase">Status Impressora</p>
                            <p className="text-[10px] font-black text-black uppercase">{localCouponPDV.printerName ? 'Configurada' : 'Não Definida'}</p>
                          </div>
                       </div>
                       <div className="p-4 bg-zinc-50 border-4 border-black rounded-2xl flex items-center gap-4 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                          <div className="w-10 h-10 rounded-xl bg-white border-2 border-black text-black flex items-center justify-center font-black text-sm">M</div>
                          <div>
                            <p className="text-[8px] font-black text-zinc-400 uppercase">Modo Atual (PDV)</p>
                            <p className="text-[10px] font-black text-black uppercase">{localCouponPDV.printMode === 'auto' ? 'Automático' : 'Diálogo'}</p>
                          </div>
                       </div>
                    </div>
                </div>
              </div>

              {/* Status Section */}
              <div className="bg-white p-8 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 text-black">
                <div>
                  <h4 className="text-[11px] font-black text-black tracking-[0.2em] uppercase mb-2">Status da Conexão</h4>
                  <div className="flex items-center gap-4 bg-zinc-50 p-4 border-2 border-black rounded-2xl">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] ${localCouponPDV.printMode === 'auto' && (window as any).electronAPI ? 'bg-emerald-400 text-black' : 'bg-blue-400 text-black'}`}>
                      <Monitor size={28} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase text-black tracking-widest">
                        Ambiente: {(window as any).electronAPI ? 'Desktop' : 'Navegador'}
                      </p>
                      <p className="text-[10px] font-bold uppercase text-zinc-500 mt-0.5">
                        {localCouponPDV.printMode === 'auto' && (window as any).electronAPI ? 'Pronto para impressão direta' : 'Pronto para imprimir via Diálogo'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'galeria' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Sub-abas da Galeria */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex overflow-x-auto no-scrollbar bg-white p-2 rounded-[2rem] border-4 border-black w-full md:w-fit snap-x touch-pan-x scroll-smooth shrink-0 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                 {[
                   { id: 'saudacao', label: 'Cupom Saudação', icon: <Star size={14} /> },
                   { id: 'clientes', label: 'Clientes', icon: <Users size={14} /> },
                   { id: 'produtos', label: 'Produtos', icon: <Package size={14} /> }
                 ].map(sub => (
                   <button
                     key={sub.id}
                     onClick={() => {
                        setGallerySubTab(sub.id as any);
                        setGallerySearchTerm('');
                     }}
                     className={`px-6 md:px-8 py-3.5 rounded-[1.5rem] text-[10px] whitespace-nowrap font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shrink-0 snap-center ${
                       gallerySubTab === sub.id ? 'bg-[#FFDE2E] text-black border-2 border-black active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:text-black'
                     }`}
                   >
                     {sub.icon} {sub.label}
                   </button>
                 ))}
              </div>

              <div className="relative flex-1 md:max-w-md">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-black" size={20} />
                <input 
                  type="text"
                  placeholder="Pesquisar..."
                  value={gallerySearchTerm}
                  onChange={(e) => setGallerySearchTerm(e.target.value)}
                  className="w-full pl-16 pr-6 py-4 bg-zinc-50 border-4 border-black rounded-[2rem] text-sm font-black uppercase tracking-wider text-black placeholder:text-zinc-400 focus:ring-4 focus:ring-[#FFDE2E] transition-all outline-none shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                />
              </div>
            </div>

            <div className="bg-white md:p-10 p-6 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8 text-black">
              {gallerySubTab === 'saudacao' && (
                <div className="space-y-8">
                  {(() => {
                    const filteredItems = (gallery || [])
                      .filter(i => (i.type === 'greeting' || i.category === 'greeting_bg') && 
                                   (i.name?.toLowerCase().includes((gallerySearchTerm || '').toLowerCase()) || 
                                    i.url.toLowerCase().includes((gallerySearchTerm || '').toLowerCase())));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between border-b-4 border-black pb-6">
                          <div>
                            <h4 className="text-[12px] font-black text-black uppercase tracking-widest">Galeria de Fundo</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Imagens para o fundo dos cupons de saudação</p>
                          </div>
                          <div className="text-[10px] font-black text-black uppercase bg-[#FFDE2E] px-6 py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {filteredItems.length} Itens
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {filteredItems.length === 0 ? (
                            <div className="col-span-full py-24 border-4 border-dashed border-black rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-300">
                              <ImageIcon size={64} className="mb-6 opacity-20" />
                              <p className="text-[12px] font-black uppercase tracking-widest">Nenhum item encontrado</p>
                            </div>
                          ) : (
                            filteredItems.map(item => (
                              <div key={item.id} className="group relative aspect-square bg-zinc-50 rounded-[2rem] border-4 border-black overflow-hidden hover:translate-y-[-4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover p-1 rounded-[1.5rem]" />
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                   <button
                                     onClick={() => {
                                       setLocalGreeting(prev => ({ ...prev, backgroundImage: item.url }));
                                       alert('Imagem selecionada!');
                                     }}
                                     className="w-full p-3 bg-[#FFDE2E] text-black border-2 border-black rounded-xl font-black uppercase text-[9px] hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                   >
                                     Selecionar
                                   </button>
                                   <button
                                     onClick={() => {
                                       if(confirm('Excluir imagem?')) {
                                         setGallery((prev: GalleryItem[]) => prev.filter(i => i.id !== item.id));
                                       }
                                     }}
                                     className="w-full p-3 bg-red-500 text-white border-2 border-black rounded-xl font-black uppercase text-[9px] hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                   >
                                     Excluir
                                   </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {gallerySubTab === 'clientes' && (
                <div className="space-y-8">
                  {(() => {
                    const filteredItems = (gallery || [])
                      .filter(i => i.type === 'customer' && 
                                   (i.name?.toLowerCase().includes((gallerySearchTerm || '').toLowerCase()) || 
                                    i.url.toLowerCase().includes((gallerySearchTerm || '').toLowerCase())));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between border-b-4 border-black pb-6">
                          <div>
                            <h4 className="text-[12px] font-black text-black uppercase tracking-widest">Galeria de Clientes</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Fotos vinculadas aos registros de clientes</p>
                          </div>
                          <div className="text-[10px] font-black text-black uppercase bg-[#FFDE2E] px-6 py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {filteredItems.length} Itens
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {filteredItems.length === 0 ? (
                            <div className="col-span-full py-24 border-4 border-dashed border-black rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-300">
                              <Users size={64} className="mb-6 opacity-20" />
                              <p className="text-[12px] font-black uppercase tracking-widest">Nenhum cliente encontrado</p>
                            </div>
                          ) : (
                            filteredItems.map(item => (
                              <div key={item.id} className="group relative aspect-square bg-zinc-50 rounded-[2rem] border-4 border-black overflow-hidden hover:translate-y-[-4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover p-1 rounded-[1.5rem]" />
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                   <div className="text-[10px] font-black text-white text-center line-clamp-2 uppercase border-b-2 border-white/20 pb-2 mb-2">
                                     {item.name}
                                   </div>
                                   <button
                                     onClick={() => {
                                       if(confirm('Excluir imagem?')) {
                                         setGallery((prev: GalleryItem[]) => prev.filter(i => i.id !== item.id));
                                       }
                                     }}
                                     className="w-full p-3 bg-red-500 text-white border-2 border-black rounded-xl font-black uppercase text-[9px] hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                   >
                                     Excluir
                                   </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {gallerySubTab === 'produtos' && (
                <div className="space-y-8">
                   {(() => {
                    const filteredItems = (gallery || [])
                      .filter(i => i.type === 'product' && 
                                   (i.name?.toLowerCase().includes((gallerySearchTerm || '').toLowerCase()) || 
                                    i.url.toLowerCase().includes((gallerySearchTerm || '').toLowerCase())))
                      .sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                    
                    return (
                      <>
                        <div className="flex items-center justify-between border-b-4 border-black pb-6">
                          <div>
                            <h4 className="text-[12px] font-black text-black uppercase tracking-widest">Galeria de Produtos</h4>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Fotos vinculadas ao catálogo de produtos</p>
                          </div>
                          <div className="text-[10px] font-black text-black uppercase bg-[#FFDE2E] px-6 py-2 rounded-full border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                            {filteredItems.length} Itens
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                          {filteredItems.length === 0 ? (
                            <div className="col-span-full py-24 border-4 border-dashed border-black rounded-[2.5rem] flex flex-col items-center justify-center text-zinc-300">
                              <Package size={64} className="mb-6 opacity-20" />
                              <p className="text-[12px] font-black uppercase tracking-widest">Nenhum produto encontrado</p>
                            </div>
                          ) : (
                            filteredItems.map(item => (
                              <div key={item.id} className="group relative aspect-square bg-zinc-50 rounded-[2rem] border-4 border-black overflow-hidden hover:translate-y-[-4px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                <img src={item.url} alt={item.name} className="w-full h-full object-cover p-1 rounded-[1.5rem]" />
                                <div className="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3 p-4">
                                   <div className="text-[10px] font-black text-white text-center line-clamp-2 uppercase border-b-2 border-white/20 pb-2 mb-2">
                                     {item.name}
                                   </div>
                                   <button
                                     onClick={() => {
                                       if(confirm('Excluir imagem?')) {
                                         setGallery((prev: GalleryItem[]) => prev.filter(i => i.id !== item.id));
                                       }
                                     }}
                                     className="w-full p-3 bg-red-500 text-white border-2 border-black rounded-xl font-black uppercase text-[9px] hover:translate-y-[-2px] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                                   >
                                     Excluir
                                   </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'backup' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white border-4 border-black p-8 md:p-10 rounded-[2.5rem] space-y-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-black">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#FFDE2E] border-4 border-black rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                   <ShieldCheck size={32} />
                </div>
                <div>
                  <h4 className="text-xl font-black uppercase tracking-widest">Segurança de Dados</h4>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Proteção e restauração do sistema</p>
                </div>
              </div>
              <p className="text-sm text-black font-bold border-l-4 border-black pl-4 py-2 bg-zinc-50 rounded-r-xl">
                Backups automáticos realizados diariamente. Recomendamos exportar cópias manuais para armazenamento externo regularmente.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <button 
                  id="btn-export-backup"
                  onClick={() => exportarBackup({
                    products, catalogDescriptions, customers, sales, activities, categories, subcategories,
                    delivery_channels: deliveryChannels, delivery_methods: deliveryMethods, closed_sessions: closedSessions,
                    openSessions, users, roles, paymentMethods, customPaymentMethods, hiddenPaymentMethods,
                    printers, registeredPrinters, company, couponConfig, couponPDVConfig, greetingCouponConfig,
                    labelConfig, cashierSession, selectedPrinter, selectedLabelPrinter, revenues, purchases, expenses,
                    rawMaterialsStructured, productRecipes, shopkeepers, shopkeeperDeliveries
                  })}
                  className="bg-[#5d5dff] text-white p-6 rounded-2xl border-4 border-black font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] transition-all flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group"
                >
                  <Download size={24} className="group-hover:translate-y-1 transition-transform" /> Exportar Backup (.json)
                </button>
                <button 
                  id="btn-import-backup"
                  onClick={async () => {
                    const imported = await importarBackup();
                    if (imported) {
                      if (confirm('Importar backup? Isso apagará os dados atuais.')) {
                        handleRestoreFromData(imported);
                      }
                    }
                  }}
                  className="bg-white text-black p-6 rounded-2xl border-4 border-black font-black text-xs uppercase tracking-widest hover:translate-y-[-4px] hover:bg-[#FFDE2E] transition-all flex items-center justify-center gap-3 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] group"
                >
                  <Upload size={24} className="group-hover:-translate-y-1 transition-transform" /> Importar de Arquivo
                </button>
              </div>
            </div>

            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-8 text-black">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b-4 border-black pb-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-zinc-100 border-2 border-black rounded-2xl flex items-center justify-center text-black">
                    <History size={24} />
                  </div>
                  <div>
                    <h4 className="text-[12px] font-black uppercase tracking-widest">Pontos de Restauração</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-1">Últimos snapshots salvos localmente</p>
                  </div>
                </div>
                <button 
                  onClick={handleCreateManualBackup}
                  className="px-8 py-4 bg-[#FFDE2E] text-black border-4 border-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:translate-y-[-2px] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] flex items-center gap-3"
                >
                  <Database size={16} /> Criar snapshot
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {localBackups.length === 0 ? (
                  <div className="p-20 border-4 border-dashed border-black rounded-[3rem] flex flex-col items-center justify-center text-zinc-300">
                    <Database size={64} className="mb-4 opacity-10" />
                    <p className="text-[12px] font-black uppercase tracking-widest">Nenhum backup local</p>
                  </div>
                ) : (
                  localBackups.map((bak) => (
                    <div key={bak.id} className="group p-6 bg-zinc-50 border-4 border-black rounded-[2rem] hover:bg-white hover:translate-y-[-2px] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-white border-2 border-black rounded-xl flex items-center justify-center text-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] group-hover:bg-[#FFDE2E] transition-colors">
                          <Database size={24} />
                        </div>
                        <div>
                          <p className="text-xs font-black text-black uppercase">
                            {new Date(bak.date).toLocaleDateString('pt-BR')} • {new Date(bak.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                             <span className="text-[9px] px-3 py-0.5 bg-black text-[#FFDE2E] rounded-full font-black uppercase">
                               {(bak.size / 1024).toFixed(1)} KB
                             </span>
                             <span className="text-[9px] text-zinc-500 font-bold uppercase">LocalStorage</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 self-end sm:self-center">
                        {pendingAction?.id === bak.id ? (
                          <div className="flex items-center gap-3 animate-in fade-in zoom-in-95 duration-200">
                             <span className="text-[10px] font-black uppercase text-red-600 tracking-widest">Confirmar?</span>
                             <button 
                               onClick={() => {
                                 if (pendingAction.type === 'restore') handleRestoreFromData(bak.data);
                                 if (pendingAction.type === 'delete') handleDeleteBackup(bak.id);
                                 setPendingAction(null);
                               }}
                               className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-white border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:scale-95 ${pendingAction.type === 'restore' ? 'bg-emerald-500' : 'bg-red-500'}`}
                             >
                               SOU EU
                             </button>
                             <button 
                               onClick={() => setPendingAction(null)}
                               className="px-6 py-2 bg-white text-black border-2 border-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-100"
                             >
                               CANELAR
                             </button>
                          </div>
                        ) : (
                          <>
                            <button 
                              onClick={() => exportarBackup(bak.data)}
                              className="p-4 bg-white border-2 border-black rounded-xl hover:bg-[#FFDE2E] transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              title="Download"
                            >
                              <Download size={18} />
                            </button>
                            <button 
                              onClick={() => setPendingAction({ id: bak.id, type: 'restore' })}
                              className="p-4 bg-white border-2 border-black rounded-xl hover:bg-emerald-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              title="Restaurar"
                            >
                              <RefreshCw size={18} />
                            </button>
                            <button 
                              onClick={() => setPendingAction({ id: bak.id, type: 'delete' })}
                              className="p-4 bg-white border-2 border-black rounded-xl hover:bg-red-400 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                              title="Excluir"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            
            <div className="bg-zinc-50 border-4 border-black p-8 rounded-[2.5rem] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <h5 className="text-[10px] font-black text-black/50 uppercase tracking-widest mb-4">Metadados Técnicos</h5>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Localização</span>
                  <span className="text-[10px] font-black text-black">Navegador Local</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Snapshotting</span>
                  <span className="text-[10px] font-black text-black">Sincronizado</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-zinc-400 uppercase">Integridade</span>
                  <span className="text-[10px] font-black text-black">Verificado</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reimpressao' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
             {/* Sub-abas de Reimpressão */}
             <div className="flex bg-white p-2 rounded-[2rem] border-4 border-black w-fit shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                {[
                  { id: 'inicial', label: 'Venda Inicial', icon: <FileText size={14} /> },
                  { id: 'final', label: 'Venda Final', icon: <CheckCircle size={14} /> }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setReprintSubTab(sub.id as any)}
                    className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center gap-3 shrink-0 ${
                      reprintSubTab === sub.id ? 'bg-[#FFDE2E] text-black border-2 border-black active:scale-95 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : 'text-zinc-500 hover:text-black'
                    }`}
                  >
                    {sub.icon} {sub.label}
                  </button>
                ))}
             </div>

             <div className="bg-white rounded-[2.5rem] border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-sans">
                        <thead>
                            <tr className="bg-zinc-50 border-b-4 border-black">
                                <th className="p-6 text-[10px] font-black text-black uppercase tracking-widest">Nº Pedido</th>
                                <th className="p-6 text-[10px] font-black text-black uppercase tracking-widest">Cliente</th>
                                <th className="p-6 text-[10px] font-black text-black uppercase tracking-widest">Data e Hora</th>
                                <th className="p-6 text-[10px] font-black text-black uppercase tracking-widest">Usuário</th>
                                <th className="p-6 text-[10px] font-black text-black uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="text-black">
                            {sales
                              .filter(sale => {
                                if (reprintSubTab === 'inicial') return sale.status !== 'cancelado';
                                return ['separado', 'embalado', 'enviado', 'em_transporte', 'entregue'].includes(sale.status || '');
                              })
                              .sort((a, b) => b.date - a.date)
                              .map(sale => {
                                const customer = customers.find(c => c.id === sale.customerId);
                                const userName = reprintSubTab === 'inicial' ? sale.soldByUserName : sale.separatedByUserName;
                                const displayDate = reprintSubTab === 'inicial' 
                                    ? new Date(sale.date).toLocaleString('pt-BR')
                                    : (sale.separationTimestamp ? new Date(sale.separationTimestamp).toLocaleString('pt-BR') : new Date(sale.date).toLocaleString('pt-BR'));

                                return (
                                    <tr key={sale.id} className="border-b-2 border-zinc-100 hover:bg-[#FFDE2E]/10 transition-all group">
                                        <td className="p-6">
                                            <span className="text-[10px] font-black text-black uppercase bg-white px-3 py-1.5 rounded-lg border-2 border-black font-mono shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                                                {sale.sequentialId || sale.id.substring(0, 8)}
                                            </span>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-xs font-black text-black uppercase tracking-tighter">{customer?.name || 'Cliente Geral'}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{displayDate}</p>
                                        </td>
                                        <td className="p-6">
                                            <p className="text-[10px] font-black text-black uppercase tracking-widest">{userName || 'Sistema'}</p>
                                        </td>
                                        <td className="p-6 text-right">
                                            <button 
                                                onClick={() => reprintSubTab === 'inicial' ? imprimirPedidoPDV(sale) : imprimirCupom(sale)}
                                                className="px-6 py-3 bg-black text-[#FFDE2E] rounded-xl font-black text-[10px] uppercase tracking-widest border-2 border-black hover:translate-y-[-2px] transition-all active:scale-95 flex items-center gap-2 ml-auto shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]"
                                            >
                                                <Printer size={14} /> Reimprimir
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {sales.filter(sale => {
                                 if (reprintSubTab === 'inicial') return sale.status !== 'cancelado';
                                 return ['separado', 'embalado', 'enviado', 'em_transporte', 'entregue'].includes(sale.status || '');
                            }).length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-20 text-center">
                                        <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Nenhum cupom encontrado para esta categoria</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
             </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-6 pt-12">
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-emerald-500 text-white p-5 rounded-2xl flex items-center justify-center gap-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              <CheckCircle2 size={24} />
              <span className="font-black text-[12px] uppercase tracking-widest">Alterações salvas com sucesso</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-6">
          <button 
            onClick={handleCancel}
            className="flex-1 bg-white text-black py-5 rounded-2xl font-black text-sm tracking-widest uppercase border-4 border-black hover:bg-zinc-100 transition-all shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-1 active:shadow-none"
          >
            Cancelar
          </button>
          {canEdit && (
            <button 
              onClick={handleSave}
              className="flex-1 bg-[#5d5dff] text-white py-5 rounded-2xl font-black text-sm tracking-widest uppercase border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-all active:translate-y-1 active:shadow-none"
            >
              Salvar Alterações
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string, checked: boolean, onChange: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)}
      className="flex items-center gap-3 cursor-pointer group transition-all"
    >
      <div 
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${checked ? 'bg-[#FFDE2E]' : 'bg-white'}`}
      >
        <Check size={18} className={`transition-all ${checked ? 'text-black opacity-100' : 'text-black opacity-10 scale-50'}`} strokeWidth={4} />
      </div>
      <span className="text-[10px] font-black text-black uppercase tracking-widest select-none group-hover:translate-x-1 transition-transform">{label}</span>
    </button>
  );
}

function QRCodeDesignSettings({ 
  config, 
  onChange 
}: { 
  config: QRCodeDesignConfig, 
  onChange: (c: QRCodeDesignConfig) => void 
}) {
  return (
    <div className="space-y-6 bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800/50">
       <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
             <QrCode size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-zinc-100 tracking-[0.2em] uppercase">Design do QR Code</h4>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight">Estilize o código de resposta rápida</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Estilo Visual</label>
            <select 
              value={config.style}
              onChange={e => onChange({...config, style: e.target.value as any})}
              className="w-full p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none text-sm font-bold uppercase text-zinc-100 transition-all focus:ring-2 focus:ring-blue-500"
            >
              <option value="standard">Padrão (Nítido)</option>
              <option value="suave">Suave (Arredondado)</option>
              <option value="moderno">Moderno (Pontilhado)</option>
              <option value="elegante">Elegante (Minimalista)</option>
              <option value="logo">Com Logotipo Central</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Formato dos Pontos</label>
            <div className="grid grid-cols-2 gap-2">
               <button 
                 onClick={() => onChange({...config, dotType: 'square'})}
                 className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${config.dotType === 'square' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
               >
                 Quadrado
               </button>
               <button 
                 onClick={() => onChange({...config, dotType: 'rounded'})}
                 className={`p-3 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${config.dotType === 'rounded' ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-800 border-zinc-700 text-zinc-500 hover:text-zinc-300'}`}
               >
                 Redondo
               </button>
            </div>
          </div>
       </div>

       <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Cor do Código</label>
            <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
               <input 
                 type="color" 
                 value={config.color} 
                 onChange={e => onChange({...config, color: e.target.value})}
                 className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
               />
               <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{config.color}</span>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Cor de Fundo</label>
            <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
               <input 
                 type="color" 
                 value={config.backgroundColor} 
                 onChange={e => onChange({...config, backgroundColor: e.target.value})}
                 className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
               />
               <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{config.backgroundColor}</span>
            </div>
          </div>
          <div className="space-y-2 col-span-2 lg:col-span-1">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1 block mb-1">Opacidade ({config.opacity}%)</label>
            <input 
              type="range" 
              min="0" max="100" 
              value={config.opacity} 
              onChange={e => onChange({...config, opacity: parseInt(e.target.value)})}
              className="w-full accent-blue-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>
       </div>

       {config.style === 'logo' && (
          <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Logo do QR Code (URL ou Upload)</label>
            <div className="flex gap-2">
               <input 
                 type="text" 
                 placeholder="https://sua-logo.com/imagem.png"
                 value={config.logoUrl || ''} 
                 onChange={e => onChange({...config, logoUrl: e.target.value})}
                 className="flex-1 p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none text-xs font-bold text-zinc-100 placeholder:text-zinc-600 focus:ring-2 focus:ring-blue-500"
               />
               <label className="p-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl border border-zinc-700 cursor-pointer text-zinc-400 transition-all hover:text-white flex items-center justify-center">
                  <Upload size={18} />
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (ev) => onChange({...config, logoUrl: ev.target?.result as string});
                        reader.readAsDataURL(file);
                      }
                    }} 
                  />
               </label>
            </div>
          </div>
       )}
    </div>
  );
}

function BarcodeDesignSettings({ 
  config, 
  onChange 
}: { 
  config: BarcodeDesignConfig, 
  onChange: (c: BarcodeDesignConfig) => void 
}) {
  return (
    <div className="space-y-6 bg-zinc-900/50 p-6 rounded-[2rem] border border-zinc-800/50">
       <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
             <Barcode size={18} />
          </div>
          <div>
            <h4 className="text-[10px] font-black text-zinc-100 tracking-[0.2em] uppercase">Design do Código de Barras</h4>
            <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-tight">Estilize o código para leitura rápida</p>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Tipo de Código</label>
            <select 
              value={config.type}
              onChange={e => onChange({...config, type: e.target.value as any})}
              className="w-full p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none text-sm font-bold uppercase text-zinc-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value="code128">CODE 128 (Alfanumérico)</option>
              <option value="ean13">EAN-13 (Numérico 13 dígitos)</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1 block mb-1">Altura ({config.height}px)</label>
            <input 
              type="range" min="10" max="150" step="5"
              value={config.height}
              onChange={e => onChange({...config, height: parseInt(e.target.value)})}
              className="w-full accent-emerald-500 h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Espessura Barras ({config.width})</label>
            <select 
              value={config.width}
              onChange={e => onChange({...config, width: parseInt(e.target.value)})}
              className="w-full p-4 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none text-sm font-bold uppercase text-zinc-100 focus:ring-2 focus:ring-emerald-500"
            >
              <option value={1}>Fina (1x)</option>
              <option value={2}>Normal (2x)</option>
              <option value={3}>Grossa (3x)</option>
              <option value={4}>Muito Grossa (4x)</option>
            </select>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="flex gap-4">
             <div className="space-y-2 flex-1">
               <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Cor das Barras</label>
               <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
                  <input 
                    type="color" 
                    value={config.color} 
                    onChange={e => onChange({...config, color: e.target.value})}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{config.color}</span>
               </div>
             </div>
             <div className="space-y-2 flex-1">
               <label className="text-[9px] font-black text-zinc-500 tracking-wider uppercase ml-1">Cor de Fundo</label>
               <div className="flex items-center gap-2 bg-zinc-800 p-3 rounded-2xl border border-zinc-700">
                  <input 
                    type="color" 
                    value={config.backgroundColor} 
                    onChange={e => onChange({...config, backgroundColor: e.target.value})}
                    className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-none p-0"
                  />
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">{config.backgroundColor}</span>
               </div>
             </div>
          </div>
          <div className="flex items-center justify-center p-4 bg-zinc-800/20 rounded-2xl border border-zinc-800/50">
             <Checkbox label="Mostrar Números" checked={config.showText} onChange={v => onChange({...config, showText: v})} />
          </div>
       </div>
    </div>
  );
}

function PaymentsView({ 
  paymentMethods, 
  setPaymentMethods, 
  paymentIcons,
  setPaymentIcons,
  customPaymentMethods, 
  setCustomPaymentMethods,
  hiddenPaymentMethods,
  setHiddenPaymentMethods,
  sales,
  addActivity,
  canEdit,
  currentUser
}: { 
  paymentMethods: string[], 
  setPaymentMethods: any, 
  paymentIcons: Record<string, string>,
  setPaymentIcons: any,
  customPaymentMethods: string[], 
  setCustomPaymentMethods: any,
  hiddenPaymentMethods: string[],
  setHiddenPaymentMethods: any,
  sales: Sale[],
  addActivity: (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => void,
  canEdit: boolean,
  currentUser: any | null
}) {
  const [newMethodName, setNewMethodName] = useState('');
  const [newMethodIcon, setNewMethodIcon] = useState('📦');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [methodToDelete, setMethodToDelete] = useState<{id: string, name: string} | null>(null);
  const [showIconLibrary, setShowIconLibrary] = useState(false);
  
  const staticMethods = [
    { id: 'DINHEIRO', label: 'DINHEIRO', defaultIcon: '💵', color: 'text-green-400 bg-green-500/10' },
    { id: 'PIX', label: 'PIX', defaultIcon: '📲', color: 'text-teal-400 bg-teal-500/10' },
    { id: 'CARTÃO DE CRÉDITO', label: 'CARTÃO DE CRÉDITO', defaultIcon: '💳', color: 'text-blue-400 bg-blue-500/10' },
    { id: 'CARTÃO DE DÉBITO', label: 'CARTÃO DE DÉBITO', defaultIcon: '💳', color: 'text-indigo-400 bg-indigo-500/10' },
  ];

  const isUsed = (methodId: string) => sales.some(s => s.paymentMethod === methodId);

  // Compute the full list of manageable payment methods
  const allMethodsList = useMemo(() => {
    const list = [
      ...staticMethods.map(m => ({
        id: m.id,
        name: m.label,
        icon: paymentIcons[m.id] || m.defaultIcon,
        color: m.color,
        isCustom: false,
        isHidden: hiddenPaymentMethods.includes(m.id),
        isActive: paymentMethods.includes(m.id)
      })),
      ...customPaymentMethods.map(name => ({
        id: name,
        name: name,
        icon: paymentIcons[name] || '📦',
        color: 'text-blue-400 bg-blue-500/10',
        isCustom: true,
        isHidden: false,
        isActive: paymentMethods.includes(name)
      }))
    ];
    // Filter out hidden static ones to keep the list clean
    return list.filter(item => !item.isHidden);
  }, [paymentMethods, customPaymentMethods, hiddenPaymentMethods, paymentIcons]);

  const toggleMethod = (methodId: string) => {
    setPaymentMethods((prev: string[]) => {
      const active = prev.includes(methodId);
      if (active) {
        if (prev.length <= 1) {
          alert('Mantenha pelo menos um meio de pagamento ativo para o PDV.');
          return prev;
        }
        return prev.filter(m => m !== methodId);
      }
      return [...prev, methodId];
    });
  };

  const handleAdd = () => {
    const name = newMethodName.trim().toUpperCase();
    if (!name) return;

    // Check duplicates
    const alreadyExists = allMethodsList.some(m => m.name === name);
    if (alreadyExists) {
      alert('Este meio de pagamento já está na lista.');
      return;
    }

    // Check if it's a hidden static method being "restored"
    if (hiddenPaymentMethods.includes(name)) {
      setHiddenPaymentMethods((prev: string[]) => prev.filter(id => id !== name));
      setPaymentMethods((prev: string[]) => prev.includes(name) ? prev : [...prev, name]);
    } else {
      setCustomPaymentMethods((prev: string[]) => prev.includes(name) ? prev : [...prev, name]);
      setPaymentMethods((prev: string[]) => prev.includes(name) ? prev : [...prev, name]);
    }

    // Save Icon
    setPaymentIcons((prev: Record<string, string>) => ({
      ...prev,
      [name]: newMethodIcon
    }));

    setNewMethodName('');
    setNewMethodIcon('📦');
    setShowAddForm(false);
    addActivity('system', 'Pagamento Adicionado', `Meio de pagamento "${name}" criado com ícone ${newMethodIcon}.`);
  };

  const confirmDelete = () => {
    if (!methodToDelete) return;

    const { id } = methodToDelete;
    
    // 1. Remove from the active payment methods (PDV list)
    setPaymentMethods((prev: string[]) => prev.filter(m => m !== id));
    
    // 2. Remove from custom list
    setCustomPaymentMethods((prev: string[]) => prev.filter(m => m !== id));
    
    if (addActivity) {
      addActivity('system', 'Pagamento Excluído', `Meio de pagamento "${id}" removido.`);
    }

    setShowDeleteModal(false);
    setMethodToDelete(null);
  };

  const handleDeleteClick = (e: MouseEvent, method: any) => {
    e.stopPropagation();
    if (!method.isCustom) {
      alert('Não é permitido excluir meios de pagamento padrão.');
      return;
    }
    setMethodToDelete({ id: method.id, name: method.name });
    setShowDeleteModal(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && methodToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-zinc-900 rounded-[3rem] w-full max-w-md p-8 shadow-2xl border border-zinc-800"
          >
            <div className="flex flex-col items-center text-center space-y-4 mb-8">
              <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mb-2">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tight">Excluir Meio de Pagamento?</h3>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
                Tem certeza que deseja excluir o meio de pagamento <span className="text-red-500">"{methodToDelete.name}"</span>? Esta ação não afetará o histórico de vendas passadas.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setShowDeleteModal(false);
                  setMethodToDelete(null);
                }}
                className="p-4 rounded-2xl border border-zinc-800 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 transition-all"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="p-4 rounded-2xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
              >
                Confirmar Exclusão
              </button>
            </div>
          </motion.div>
        </div>
      )}
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 px-4 md:px-0">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl shadow-sm border border-blue-900/30">
              <CreditCard size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-zinc-100 tracking-tighter uppercase leading-none">Pagamentos</h2>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mt-1">Configuração de Meios de Recebimento</p>
            </div>
          </div>
        </div>

        {(!showAddForm && canEdit) ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-[#5d5dff] text-white px-8 py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-3 w-full md:w-auto"
          >
            <Plus size={20} /> Novo Meio de Pagamento
          </button>
        ) : showAddForm && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col bg-zinc-900 p-6 rounded-[2.5rem] border border-zinc-800 w-full md:w-[450px] shadow-2xl space-y-6"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Novo Pagamento</h4>
              <button 
                onClick={() => { setShowAddForm(false); setNewMethodName(''); setShowIconLibrary(false); }}
                className="text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setShowIconLibrary(!showIconLibrary)}
                  className="w-16 h-16 bg-zinc-800 rounded-2xl border border-zinc-700 flex items-center justify-center text-3xl hover:bg-zinc-750 transition-all shadow-inner relative group"
                >
                  {newMethodIcon}
                  <div className="absolute -bottom-1 -right-1 bg-indigo-600 rounded-full p-1 border-2 border-zinc-900 group-hover:scale-110 transition-transform">
                    <Edit size={10} className="text-white" />
                  </div>
                </button>
                <div className="flex-1">
                  <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1 block ml-2">Nome do Método</label>
                  <input 
                    autoFocus
                    value={newMethodName}
                    onChange={e => setNewMethodName(e.target.value)}
                    placeholder="EX: VALE REFEIÇÃO"
                    className="w-full bg-zinc-800 px-5 py-4 rounded-2xl font-black uppercase text-xs outline-none border border-zinc-700 focus:ring-2 focus:ring-indigo-500 placeholder:text-zinc-700 text-zinc-100"
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
              </div>

              {showIconLibrary && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="bg-black/20 p-4 rounded-2xl border border-zinc-800 grid grid-cols-5 gap-3"
                >
                  {PAYMENT_ICON_LIBRARY.map((icon) => (
                    <button 
                      key={icon.char}
                      onClick={() => { setNewMethodIcon(icon.char); setShowIconLibrary(false); }}
                      className={`text-2xl p-3 rounded-xl border transition-all ${newMethodIcon === icon.char ? 'bg-indigo-600/20 border-indigo-500' : 'bg-zinc-800 border-zinc-700 hover:border-zinc-500'}`}
                      title={icon.label}
                    >
                      {icon.char}
                    </button>
                  ))}
                </motion.div>
              )}

              <button 
                onClick={handleAdd}
                className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-[0.98]"
              >
                Salvar Método de Pagamento
              </button>
            </div>
          </motion.div>
        )}
      </div>

      {/* Main List Layout */}
      <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-sm overflow-hidden mx-4 md:mx-0">
        <div className="grid grid-cols-1 divide-y divide-zinc-800">
          <div className="bg-black/20 px-8 py-4 hidden md:grid grid-cols-12 gap-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-5">Meio de Pagamento</div>
            <div className="col-span-2 text-center">Status</div>
            <div className="col-span-4 text-right">Ações Gerenciais</div>
          </div>

          {allMethodsList.map((method, idx) => (
            <div 
              key={method.id} 
              className={`px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-4 items-center transition-all group ${!method.isActive ? 'bg-zinc-950/30' : 'hover:bg-zinc-800/40'}`}
            >
              <div className="hidden md:flex col-span-1 justify-center">
                <span className="text-[10px] font-black text-zinc-700">{(idx + 1).toString().padStart(2, '0')}</span>
              </div>
              
              <div className="col-span-1 md:col-span-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-sm text-2xl ${method.isActive ? method.color : 'bg-zinc-800 text-zinc-700 filter grayscale'}`}>
                  {typeof method.icon === 'string' ? method.icon : <method.icon size={24} />}
                </div>
                <div>
                  <p className={`text-sm font-black uppercase tracking-tight ${method.isActive ? 'text-zinc-100' : 'text-zinc-600'}`}>
                    {method.name}
                  </p>
                  <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    {method.isCustom ? 'Personalizado' : 'Sistema'}
                  </p>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 flex justify-start md:justify-center">
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border transition-all ${
                  method.isActive 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-900/30' 
                    : 'bg-zinc-800 text-zinc-600 border-zinc-700'
                }`}>
                  {method.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>

              <div className="col-span-1 md:col-span-4 flex justify-start md:justify-end gap-3 mt-2 md:mt-0">
                {canEdit && (
                  <button
                    onClick={() => toggleMethod(method.id)}
                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${
                      method.isActive
                        ? 'bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-900/30'
                        : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-900/30'
                    }`}
                  >
                    {method.isActive ? 'Desativar' : 'Ativar'}
                  </button>
                )}
                {method.isCustom && canEdit && (
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, method)}
                    className="p-3 text-zinc-500 hover:text-white hover:bg-red-500 rounded-xl transition-all border border-transparent hover:border-red-600 active:scale-90 shadow-sm"
                    title="Excluir Permanentemente"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
              </div>
            </div>
          ))}

          {allMethodsList.length === 0 && (
            <div className="py-20 text-center space-y-3">
              <CreditCard size={48} className="mx-auto text-zinc-800" />
              <p className="text-sm font-black text-zinc-700 uppercase tracking-widest">Nenhum meio de pagamento configurado</p>
            </div>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-indigo-500/5 p-8 rounded-[2.5rem] border border-indigo-900/30 flex items-start gap-6">
        <div className="p-4 bg-zinc-900 rounded-2xl shadow-sm text-indigo-400 border border-indigo-900/30">
          <ShieldCheck size={32} />
        </div>
        <div className="space-y-2">
          <h4 className="text-sm font-black text-indigo-100 uppercase tracking-tight">Regras de Negócio & Segurança</h4>
          <p className="text-[11px] font-medium text-indigo-400 leading-relaxed italic">
            Para garantir a integridade dos seus relatórios financeiros, meios de pagamento que já possuem movimentação no histórico de vendas não podem ser excluídos permanentemente. Caso deseje parar de usá-los, utilize a função <span className="font-black text-indigo-100 uppercase">Desativar</span>. Eles ficarão ocultos no PDV e na finalização de novas vendas, mas serão preservados nos registros antigos.
          </p>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-zinc-800/50 flex flex-col items-center gap-2">
        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">LukasFe3D Hub v{APP_VERSION}</p>
      </div>
    </div>
  );
}



const Input = forwardRef<HTMLInputElement, { label: string, value: any, onChange: (v: string) => void, placeholder?: string, type?: string, onKeyDown?: (e: any) => void, autoFocus?: boolean }>(
  ({ label, value, onChange, placeholder = "", type = 'text', onKeyDown, autoFocus }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <label className="text-[9px] font-black text-black opacity-40 tracking-wider uppercase ml-1">{label}</label>
        <input 
          ref={ref}
          type={type}
          autoFocus={autoFocus}
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black transition-all uppercase text-black placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] focus:translate-y-[-2px] focus:translate-x-[-2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        />
      </div>
    );
  }
);

function LabelPrintModal({ product, labelConfig, onClose, imprimirEtiqueta }: { product: Product, labelConfig: LabelConfig, onClose: () => void, imprimirEtiqueta: (product: Product, qty: number) => Promise<boolean> }) {
  const [quantity, setQuantity] = useState('1');

  const handlePrint = async () => {
    const qty = parseInt(quantity) || 1;
    await imprimirEtiqueta(product, qty);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 p-8 rounded-[3rem] max-w-sm w-full space-y-8 shadow-2xl relative border border-zinc-800">
        <button onClick={onClose} className="absolute top-8 right-8 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
          <X size={20} />
        </button>
        
        <div className="text-center space-y-3">
          <div className="w-20 h-20 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-zinc-950 shadow-xl">
            <Tag size={32} />
          </div>
          <h4 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Gerar Etiquetas</h4>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest leading-relaxed">
            {product.name}<br/>
            <span className="text-blue-400">{labelConfig.width}x{labelConfig.height}mm • {labelConfig.sheetType === 'a4' ? 'Folha A4' : 'Térmica'}</span>
          </p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Quantidade de Etiquetas</label>
            <input 
              type="number"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              className="w-full p-5 bg-zinc-950 rounded-2xl border border-zinc-800 outline-none focus:ring-4 focus:ring-blue-500/20 text-lg font-black text-center transition-all text-zinc-100"
              placeholder="1"
              autoFocus
            />
          </div>

          <div className="flex gap-4">
            <button onClick={onClose} className="flex-1 p-5 rounded-2xl bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all">
              Cancelar
            </button>
            <button 
              onClick={handlePrint} 
              className="flex-1 p-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-3"
            >
              <Printer size={18} /> Imprimir
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ProductView({ 
  products, 
  setProducts, 
  setView, 
  categories,
  setCategories,
  subcategories,
  setSubcategories,
  addActivity,
  labelConfig,
  imprimirEtiqueta,
  calculateProductCost,
  currentUser,
  canEdit,
  catalogDescriptions,
  setCatalogDescriptions,
  gallery,
  setGallery
}: { 
  products: Product[], 
  setProducts: any, 
  setView: (v: View) => void, 
  categories: Category[],
  setCategories: any,
  subcategories: Subcategory[],
  setSubcategories: any,
  addActivity: (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => void,
  labelConfig: LabelConfig,
  imprimirEtiqueta: (product: Product, qty: number) => Promise<boolean>,
  calculateProductCost: (productId: string) => number,
  currentUser: SystemUser | null,
  canEdit: boolean,
  catalogDescriptions: Record<string, string>,
  setCatalogDescriptions: any,
  gallery: GalleryItem[],
  setGallery: any
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedLabelProduct, setSelectedLabelProduct] = useState<Product | null>(null);
  const [showWholesaleFields, setShowWholesaleFields] = useState(false);
  const [newProduct, setNewProduct] = useState({ 
    name: '', 
    price: '', 
    costPrice: '', 
    stock: '', 
    wholesalePrice: '',
    wholesaleMinQty: '',
    categoryId: '', 
    subcategoryId: '', 
    sku: '', 
    imageUrl: '',
    showInCatalog: true,
    locationRow: '',
    locationShelf: '',
    locationDrawer: '',
    shopkeeperPrice: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  
  // Category management state
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newSubCatName, setNewSubCatName] = useState('');
  const [selectedCatId, setSelectedCatId] = useState('');

  const addCategory = () => {
    if (!newCatName) return;
    const cat: Category = { id: crypto.randomUUID(), name: newCatName, updatedAt: Date.now() };
    setCategories([...categories, cat]);
    setNewCatName('');
  };

  const removeCategory = (id: string) => {
    if (confirm('Remover esta categoria removerá também todas as suas subcategorias. Continuar?')) {
      setCategories(categories.filter(c => c.id !== id));
      setSubcategories(subcategories.filter(s => s.categoryId !== id));
    }
  };

  const addSubcategory = () => {
    if (!newSubCatName || !selectedCatId) return;
    const sub: Subcategory = { id: crypto.randomUUID(), categoryId: selectedCatId, name: newSubCatName, updatedAt: Date.now() };
    setSubcategories([...subcategories, sub]);
    setNewSubCatName('');
  };

  const removeSubcategory = (id: string) => {
    setSubcategories(subcategories.filter(s => s.id !== id));
  };

  const normalizeBarcode = (code: string) => {
    if (!code) return '';
    // Remove leading zeros and trim spaces
    return code.trim().replace(/^0+/, '') || '0';
  };

  const generateBarcode = () => {
    // Find all numeric barcodes
    const numericBarcodes = products
      .map(p => {
        const normalized = p.sku?.trim() || '';
        const num = parseInt(normalized, 10);
        return isNaN(num) ? null : num;
      })
      .filter((n): n is number => n !== null);

    const maxBarcode = numericBarcodes.length > 0 ? Math.max(...numericBarcodes) : 0;
    
    let nextNum = maxBarcode + 1;
    let nextCode = nextNum.toString().padStart(4, '0');
    
    // Safety check: ensure nextCode is really unique in normalized terms
    const normalizedNext = normalizeBarcode(nextCode);
    while (products.some(p => normalizeBarcode(p.sku || '') === normalizedNext)) {
      nextNum++;
      nextCode = nextNum.toString().padStart(4, '0');
    }
    
    setNewProduct({ ...newProduct, sku: nextCode });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const saveProduct = () => {
    if (!newProduct.name || !newProduct.price) return;
    
    if (!newProduct.sku) {
      alert('⚠️ CÓDIGO DE BARRAS OBRIGATÓRIO! Por favor, gere ou insira um código de barras antes de salvar.');
      return;
    }

    // Barcode uniqueness validation
    const currentNormalized = normalizeBarcode(newProduct.sku);
    const isDuplicate = products.some(p => {
      // If editing, skip the current product
      if (editingId && p.id === editingId) return false;
      return normalizeBarcode(p.sku || '') === currentNormalized;
    });

    if (isDuplicate) {
      alert('⚠️ CÓDIGO DE BARRAS JÁ CADASTRADO PARA OUTRO PRODUTO!');
      return;
    }
    
    if (editingId) {
      const oldProduct = products.find(p => p.id === editingId);
      if (oldProduct) {
        const fields = [
          { key: 'name', label: 'Nome' },
          { key: 'price', label: 'Preço' },
          { key: 'costPrice', label: 'Custo' },
          { key: 'stock', label: 'Estoque' },
          { key: 'categoryId', label: 'Categoria' },
          { key: 'subcategoryId', label: 'Subcategoria' },
          { key: 'sku', label: 'SKU' },
          { key: 'wholesalePrice', label: 'Preço Atacado' },
          { key: 'wholesaleMinQty', label: 'Qtd Mín. Atacado' },
          { key: 'locationRow', label: 'Rua' },
          { key: 'locationShelf', label: 'Prateleira' },
          { key: 'locationDrawer', label: 'Gaveta' },
        ];

        fields.forEach(field => {
          const newVal = newProduct[field.key as keyof typeof newProduct];
          const oldVal = String(oldProduct[field.key as keyof Product] || '');
          const compareVal = String(newVal || '');
          
          if (compareVal !== oldVal) {
            addActivity('product_edit', 'Edição de Produto', `Alterado ${field.label} de "${oldProduct.name}"`, {
              productId: editingId,
              productName: oldProduct.name,
              field: field.label,
              oldValue: oldVal,
              newValue: compareVal
            });
          }
        });
      }

      setProducts(products.map(p => p.id === editingId ? {
        ...p,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.costPrice) || 0,
        stock: parseInt(newProduct.stock) || 0,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || undefined,
        wholesaleMinQty: parseInt(newProduct.wholesaleMinQty) || undefined,
        categoryId: newProduct.categoryId,
        subcategoryId: newProduct.subcategoryId,
        sku: newProduct.sku,
        imageUrl: newProduct.imageUrl,
        showInCatalog: newProduct.showInCatalog,
        locationRow: newProduct.locationRow,
        locationShelf: newProduct.locationShelf,
        locationDrawer: newProduct.locationDrawer,
        shopkeeperPrice: newProduct.shopkeeperPrice ? parseFloat(String(newProduct.shopkeeperPrice)) : undefined,
        updatedByUserId: currentUser?.id,
        updatedByUserName: currentUser?.name,
      } : p));

      // Sync Queue
      const updatedProduct = {
        id: editingId,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.costPrice) || 0,
        stock: parseInt(newProduct.stock) || 0,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || undefined,
        wholesaleMinQty: parseInt(newProduct.wholesaleMinQty) || undefined,
        categoryId: newProduct.categoryId,
        subcategoryId: newProduct.subcategoryId,
        sku: newProduct.sku,
        imageUrl: newProduct.imageUrl,
        showInCatalog: newProduct.showInCatalog,
        locationRow: newProduct.locationRow,
        locationShelf: newProduct.locationShelf,
        locationDrawer: newProduct.locationDrawer,
        shopkeeperPrice: newProduct.shopkeeperPrice ? parseFloat(String(newProduct.shopkeeperPrice)) : undefined,
      };

      setEditingId(null);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowForm(false);
      }, 1500);
    } else {
      const product: Product = {
        id: crypto.randomUUID(),
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        costPrice: parseFloat(newProduct.costPrice) || 0,
        stock: parseInt(newProduct.stock) || 0,
        wholesalePrice: parseFloat(newProduct.wholesalePrice) || undefined,
        wholesaleMinQty: parseInt(newProduct.wholesaleMinQty) || undefined,
        categoryId: newProduct.categoryId,
        subcategoryId: newProduct.subcategoryId,
        sku: newProduct.sku,
        imageUrl: newProduct.imageUrl,
        showInCatalog: newProduct.showInCatalog,
        locationRow: newProduct.locationRow,
        locationShelf: newProduct.locationShelf,
        locationDrawer: newProduct.locationDrawer,
        shopkeeperPrice: newProduct.shopkeeperPrice ? parseFloat(String(newProduct.shopkeeperPrice)) : undefined,
        updatedByUserId: currentUser?.id,
        updatedByUserName: currentUser?.name,
      };
      setProducts([...products, product]);
      
      addActivity('product', 'Novo Produto', `O produto ${product.name} foi cadastrado.`);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        setShowForm(false);
      }, 1500);
    }
    setNewProduct({ name: '', price: '', costPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '', categoryId: '', subcategoryId: '', sku: '', imageUrl: '', showInCatalog: true, locationRow: '', locationShelf: '', locationDrawer: '', shopkeeperPrice: '' });
  };

  const editProduct = (p: Product) => {
    setEditingId(p.id);
    setNewProduct({
      name: p.name,
      price: p.price.toString(),
      costPrice: p.costPrice?.toString() || '',
      stock: p.stock.toString(),
      wholesalePrice: p.wholesalePrice?.toString() || '',
      wholesaleMinQty: p.wholesaleMinQty?.toString() || '',
      categoryId: p.categoryId || '',
      subcategoryId: p.subcategoryId || '',
      sku: p.sku || '',
      imageUrl: p.imageUrl || '',
      showInCatalog: p.showInCatalog ?? true,
      locationRow: p.locationRow || '',
      locationShelf: p.locationShelf || '',
      locationDrawer: p.locationDrawer || '',
      shopkeeperPrice: p.shopkeeperPrice || ''
    });
    setShowForm(true);
  };

  const removeProduct = (id: string) => {
    const product = products.find(p => p.id === id);
    if (confirm('Tem certeza que deseja remover este item?')) {
      if (product) {
        addActivity('product', 'Produto Excluído', `O produto ${product.name} foi removido do estoque.`);
      }
      setProducts(products.filter(p => p.id !== id));
    }
  };

  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = await uploadToServer(file, 'product');
      setNewProduct({ ...newProduct, imageUrl: url });

      // Salvar automaticamente na galeria de produtos
      const isDup = gallery.some((i: GalleryItem) => i.url === url);
      if (!isDup) {
        const newItem: GalleryItem = {
          id: crypto.randomUUID(),
          type: 'product',
          category: 'product_photo',
          name: newProduct.name || file.name,
          url: url,
          createdAt: Date.now(),
          metadata: { sku: newProduct.sku }
        };
        setGallery((prev: GalleryItem[]) => [...prev, newItem]);
      }
    }
  };

  const filteredProducts = products.filter(p => {
    const catName = categories.find(c => c.id === p.categoryId)?.name || p.category || '';
    const subCatName = subcategories.find(s => s.id === p.subcategoryId)?.name || '';
    const searchLower = searchTerm.toLowerCase();
    return (
      p.name.toLowerCase().includes(searchLower) || 
      p.sku?.toLowerCase().includes(searchLower) ||
      catName.toLowerCase().includes(searchLower) ||
      subCatName.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-500/10 text-blue-400 rounded-2xl">
            <Boxes size={24} />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter leading-none">Estoque</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Gestão de produtos e saldos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {canEdit && (
            <button 
              onClick={() => setShowCategoryManager(!showCategoryManager)}
              className="flex items-center gap-2 text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-800 px-4 py-3 rounded-2xl hover:bg-zinc-700 transition-colors border border-zinc-700"
            >
              <LayoutGrid size={16} />
              Categorias
            </button>
          )}
          
          {canEdit && (
            <button 
              onClick={() => {
                setEditingId(null);
                setNewProduct({ name: '', price: '', costPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '', categoryId: '', subcategoryId: '', sku: '', imageUrl: '', showInCatalog: true, locationRow: '', locationShelf: '', locationDrawer: '', shopkeeperPrice: '' });
                setShowForm(true);
              }}
              className="flex items-center gap-2 text-[10px] font-black text-white uppercase tracking-widest bg-[#5d5dff] px-6 py-3 rounded-2xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20"
            >
              <Plus size={16} /> Novo Produto
            </button>
          )}
        </div>
      </div>

      {/* Category Manager */}
      <AnimatePresence>
        {showCategoryManager && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm"
          >
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Categories */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Categorias Principais</label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Nome da categoria..." 
                    className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold uppercase transition-all text-zinc-100 placeholder:text-zinc-700"
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                  />
                  <button onClick={addCategory} className="bg-[#5d5dff] text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {categories.map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${selectedCatId === c.id ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 bg-zinc-950/50 hover:bg-zinc-800'}`} onClick={() => setSelectedCatId(c.id)}>
                      <span className={`text-[10px] font-bold uppercase ${selectedCatId === c.id ? 'text-blue-400' : 'text-zinc-400'}`}>{c.name}</span>
                      <button onClick={(e) => { e.stopPropagation(); removeCategory(c.id); }} className="text-zinc-600 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {categories.length === 0 && <p className="text-[10px] text-zinc-600 italic text-center py-4">Nenhuma categoria criada.</p>}
                </div>
              </div>

              {/* Subcategories */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">
                  Subcategorias {selectedCatId ? `de ${categories.find(c => c.id === selectedCatId)?.name}` : ''}
                </label>
                <div className="flex gap-2">
                  <input 
                    placeholder="Nome da subcategoria..." 
                    className="flex-1 p-3 bg-zinc-800 rounded-xl border border-zinc-700 outline-none focus:ring-2 focus:ring-blue-400 text-sm font-bold uppercase transition-all disabled:opacity-50 text-zinc-100 placeholder:text-zinc-700"
                    value={newSubCatName}
                    onChange={e => setNewSubCatName(e.target.value)}
                    disabled={!selectedCatId}
                  />
                  <button onClick={addSubcategory} disabled={!selectedCatId} className="bg-[#5d5dff] text-white px-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 no-scrollbar">
                  {subcategories.filter(s => s.categoryId === selectedCatId).map(s => {
                    const cat = categories.find(c => c.id === selectedCatId);
                    return (
                      <div key={s.id} className="flex items-center justify-between p-3 rounded-xl border border-zinc-800 bg-zinc-950/50">
                        <span className="text-[10px] font-bold uppercase text-zinc-400">{cat?.name} &gt; {s.name}</span>
                        <button onClick={() => removeSubcategory(s.id)} className="text-zinc-600 hover:text-red-500 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                  {!selectedCatId && <p className="text-[10px] text-zinc-600 italic text-center py-4">Selecione uma categoria para gerenciar subcategorias.</p>}
                  {selectedCatId && subcategories.filter(s => s.categoryId === selectedCatId).length === 0 && <p className="text-[10px] text-zinc-600 italic text-center py-4">Nenhuma subcategoria para esta categoria.</p>}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-zinc-900 rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-8 no-scrollbar relative border border-zinc-800"
            >
              <button 
                onClick={() => {
                  setShowForm(false);
                  setEditingId(null);
                  setNewProduct({ name: '', price: '', costPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '', categoryId: '', subcategoryId: '', sku: '', imageUrl: '' });
                }}
                className="absolute top-8 right-8 p-2 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
              >
                <X size={24} />
              </button>

              <div className="mb-8">
                <h4 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">
                  {editingId ? 'Editar Produto' : 'Novo Produto'}
                </h4>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                  Preencha as informações abaixo para {editingId ? 'atualizar o item' : 'cadastrar no estoque'}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {/* Left Column: Image Selector */}
                <div className="md:col-span-1">
                   <UniversalImageSelector 
                     label="FOTO DO PRODUTO"
                     value={newProduct.imageUrl}
                     onChange={(url) => {
                       setNewProduct({ ...newProduct, imageUrl: url });
                       // Auto-save to gallery if it's a new upload (base64)
                       if (url && url.startsWith('data:')) {
                         const isDup = (gallery || []).some((i: GalleryItem) => i.url === url);
                         if (!isDup) {
                           setGallery((prev: GalleryItem[]) => [
                             {
                               id: crypto.randomUUID(),
                               url,
                               type: 'product',
                               name: newProduct.name || 'Produto sem nome',
                               timestamp: Date.now()
                             },
                             ...prev
                           ]);
                         }
                       }
                     }}
                     category="product"
                     gallery={gallery}
                     setGallery={setGallery}
                   />
                </div>

                {/* Right Column: Fields */}
                <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2 lg:col-span-2">
                    <Input label="NOME DO PRODUTO" value={newProduct.name} onChange={v => setNewProduct({...newProduct, name: v})} placeholder="Ex: Camiseta Oversized" />
                  </div>

                  <div className="col-span-1">
                    <Input label="CUSTO (R$)" value={newProduct.costPrice} onChange={v => setNewProduct({...newProduct, costPrice: v})} placeholder="0.00" type="number" />
                  </div>

                  <div className="col-span-1">
                    <Input label="VENDAVAREJO (R$)" value={newProduct.price} onChange={v => setNewProduct({...newProduct, price: v})} placeholder="0.00" type="number" />
                  </div>

                  <div className="md:col-span-1 lg:col-span-1">
                    <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase mb-2 block ml-1">CÓD. BARRAS / EAN *</label>
                    <div className="relative group">
                      <input 
                        placeholder="DIGITE OU BIPE" 
                        className="w-full p-4 pr-12 bg-zinc-800 rounded-2xl border border-zinc-700 outline-none focus:ring-2 focus:ring-[#5d5dff] text-sm font-black uppercase transition-all text-zinc-100"
                        value={newProduct.sku}
                        onChange={e => setNewProduct({...newProduct, sku: e.target.value})}
                      />
                      <button 
                        onClick={generateBarcode} 
                        type="button"
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl bg-zinc-900 shadow-sm flex items-center justify-center text-[#5d5dff] hover:bg-[#5d5dff] hover:text-white transition-all group/btn"
                      >
                        <ScanLine size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="col-span-1">
                    <Input label="ESTOQUE ATUAL" value={newProduct.stock} onChange={v => setNewProduct({...newProduct, stock: v})} placeholder="0" type="number" />
                  </div>

                  <div className="md:col-span-1 flex flex-col justify-end">
                    <button 
                       onClick={() => setShowWholesaleFields(!showWholesaleFields)}
                       className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${showWholesaleFields ? 'bg-orange-500/10 text-orange-400' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                    >
                      <BadgeDollarSign size={14} /> Atacado {showWholesaleFields ? 'On' : 'Off'}
                    </button>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-pink-400 tracking-[0.2em] uppercase mb-2 block ml-1">CATÁLOGO</label>
                    <button 
                       onClick={() => setNewProduct({...newProduct, showInCatalog: !newProduct.showInCatalog})}
                       className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${newProduct.showInCatalog ? 'bg-pink-500/20 text-pink-500' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                    >
                      {newProduct.showInCatalog ? 'EXIBIR NO CATÁLOGO' : 'NÃO EXIBIR'}
                    </button>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-blue-400 tracking-[0.2em] uppercase mb-2 block ml-1">CATEGORIA</label>
                    <select 
                      value={newProduct.categoryId} 
                      onChange={e => setNewProduct({...newProduct, categoryId: e.target.value, subcategoryId: ''})}
                      className="w-full p-4 bg-blue-500/10 rounded-2xl border border-blue-900/30 outline-none focus:ring-2 focus:ring-[#5d5dff] text-sm font-bold uppercase cursor-pointer text-zinc-100"
                    >
                      <option value="" className="bg-zinc-900">Sem Categoria</option>
                      {categories.map(c => (
                        <option key={c.id} value={c.id} className="bg-zinc-900">{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-1">
                    <label className="text-[10px] font-black text-rose-400 tracking-[0.2em] uppercase mb-2 block ml-1">SUBCATEGORIA</label>
                    <select 
                      value={newProduct.subcategoryId} 
                      onChange={e => setNewProduct({...newProduct, subcategoryId: e.target.value})}
                      disabled={!newProduct.categoryId}
                      className="w-full p-4 bg-rose-500/10 rounded-2xl border border-rose-900/30 outline-none focus:ring-2 focus:ring-[#5d5dff] text-sm font-bold uppercase cursor-pointer disabled:opacity-50 text-zinc-100"
                    >
                      <option value="" className="bg-zinc-900">Sem Subcategoria</option>
                      {subcategories.filter(s => s.categoryId === newProduct.categoryId).map(s => (
                        <option key={s.id} value={s.id} className="bg-zinc-900">{s.name}</option>
                      ))}
                    </select>
                  </div>

                  {showWholesaleFields && (
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-orange-500/10 rounded-3xl border border-orange-900/30 mt-2">
                      <Input label="PREÇO ATACADO (R$)" value={newProduct.wholesalePrice} onChange={v => setNewProduct({...newProduct, wholesalePrice: v})} placeholder="0.00" type="number" />
                      <Input label="MÍNIMO ATACADO" value={newProduct.wholesaleMinQty} onChange={v => setNewProduct({...newProduct, wholesaleMinQty: v})} placeholder="Quantidade" type="number" />
                    </motion.div>
                  )}

                  <div className="md:col-span-1">
                    <Input label="RUA" value={newProduct.locationRow} onChange={v => setNewProduct({...newProduct, locationRow: v})} placeholder="Ex: A" />
                  </div>
                  <div className="md:col-span-1">
                    <Input label="PRATELEIRA" value={newProduct.locationShelf} onChange={v => setNewProduct({...newProduct, locationShelf: v})} placeholder="Ex: 03" />
                  </div>
                  <div className="md:col-span-1">
                    <Input label="GAVETA" value={newProduct.locationDrawer} onChange={v => setNewProduct({...newProduct, locationDrawer: v})} placeholder="Ex: 02" />
                  </div>
                  <div className="md:col-span-1">
                    <Input label="PREÇO LOJISTA (R$)" value={newProduct.shopkeeperPrice} onChange={v => setNewProduct({...newProduct, shopkeeperPrice: v})} placeholder="0.00" type="number" />
                  </div>
                </div>
              </div>

              <div className="mt-12 flex flex-col items-end gap-4 border-t border-zinc-800 pt-8">
                <AnimatePresence>
                  {showSuccess && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                    >
                      <CheckCircle2 size={14} />
                      <span className="font-black text-[9px] uppercase tracking-widest">{editingId ? 'Alterações salvas!' : 'Produto cadastrado!'}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex gap-4">
                  <button 
                    onClick={() => {
                      setShowForm(false);
                      setEditingId(null);
                      setNewProduct({ name: '', price: '', costPrice: '', stock: '', wholesalePrice: '', wholesaleMinQty: '', categoryId: '', subcategoryId: '', sku: '', imageUrl: '', showInCatalog: true, locationRow: '', locationShelf: '', locationDrawer: '', shopkeeperPrice: '' });
                    }}
                    className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={saveProduct} 
                    className="bg-[#5d5dff] text-white px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-3"
                  >
                    <Save size={16} /> {editingId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stock List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              placeholder="Pesquisar no estoque..." 
              className="w-full pl-12 pr-4 py-3 bg-zinc-900 rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-[#5d5dff] text-sm font-medium text-zinc-100 placeholder:text-zinc-600"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {filteredProducts.map(p => (
            <div key={p.id} className="bg-zinc-900 p-4 rounded-3xl border border-zinc-800 shadow-sm flex flex-col sm:flex-row items-center gap-6 hover:bg-zinc-800/50 transition-all group">
              {/* Product Thumbnail */}
              <div className="w-20 h-20 rounded-2xl bg-zinc-950 flex items-center justify-center overflow-hidden shrink-0 border border-zinc-800">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                ) : (
                  <Package size={24} className="text-zinc-700" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 text-center sm:text-left">
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                  <h4 className="font-black text-zinc-100 uppercase tracking-tight truncate max-w-[200px]">{p.name}</h4>
                  {canEdit && (
                    <button onClick={() => editProduct(p)} className="p-1 text-zinc-600 hover:text-blue-500 transition-colors">
                      <Pencil size={14} />
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">SKU: {p.sku || 'N/A'}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                      {categories.find(c => c.id === p.categoryId)?.name || p.category || 'Geral'}
                    </span>
                    {p.subcategoryId && (
                      <span className="text-[9px] font-black bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                        {subcategories.find(s => s.id === p.subcategoryId)?.name}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Prices */}
              <div className="flex items-center gap-8 text-center sm:text-left">
                <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-0.5">Custo</p>
                  <p className="font-bold text-zinc-400 text-sm italic">R$ {calculateProductCost(p.id).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[9px] font-black text-blue-500/10 uppercase tracking-widest mb-0.5">Venda</p>
                  <div className="flex items-center gap-1 justify-center sm:justify-start">
                    <p className="font-black text-blue-400">R$ {p.price.toFixed(2)}</p>
                    {canEdit && (
                      <button onClick={() => editProduct(p)} className="p-1 text-zinc-600 hover:text-blue-400 transition-colors">
                        <Pencil size={12} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="px-6 py-2 bg-zinc-950 rounded-2xl border border-zinc-800">
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 text-center">Saldo</p>
                  <p className={`font-black text-lg leading-tight text-center ${p.stock < 5 ? 'text-red-500' : 'text-zinc-100'}`}>{p.stock}</p>
                </div>
              </div>

              <div className="flex gap-2 w-full sm:w-auto items-center">
                {canEdit && (
                  <button 
                    onClick={() => removeProduct(p.id)}
                    className="p-3 text-zinc-600 hover:text-red-500 transition-colors flex items-center justify-center"
                  >
                    <Trash2 size={20} />
                  </button>
                )}
                <button 
                  onClick={() => setSelectedLabelProduct(p)}
                  className="p-3 text-blue-400/50 hover:text-blue-400 transition-colors flex items-center justify-center"
                  title="Imprimir Etiqueta"
                >
                  <Tag size={20} />
                </button>
              </div>
            </div>
          ))}
          {filteredProducts.length === 0 && (
            <div className="py-20 text-center">
              <Package size={64} className="mx-auto mb-4 text-gray-100" />
              <p className="text-gray-400 font-medium italic">Nenhum produto cadastrado no estoque.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selectedLabelProduct && (
          <LabelPrintModal 
            product={selectedLabelProduct} 
            labelConfig={labelConfig} 
            onClose={() => setSelectedLabelProduct(null)} 
            imprimirEtiqueta={imprimirEtiqueta}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function CustomerForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isEditing = false,
  showSuccess,
  gallery,
  setGallery
}: { 
  initialData: any, 
  onSubmit: (data: any) => void, 
  onCancel: () => void, 
  isEditing?: boolean,
  showSuccess?: boolean,
  gallery: GalleryItem[],
  setGallery: any
}) {
  const [data, setData] = useState(initialData);

  const handleDobChange = (v: string) => {
    const digits = v.replace(/\D/g, '');
    let formatted = '';
    if (digits.length <= 2) {
      formatted = digits;
    } else if (digits.length <= 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    } else {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4, 8)}`;
    }
    setData({ ...data, dob: formatted });
  };

  return (
    <div className="p-6 space-y-8">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="shrink-0 space-y-4">
          <UniversalImageSelector 
            label="Foto do Cliente (Estilo 3x4)"
            value={data.image}
            onChange={(url) => {
              setData({ ...data, image: url });
              // Auto-save to gallery if it's a new upload (base64)
              if (url && url.startsWith('data:')) {
                const isDup = (gallery || []).some((i: GalleryItem) => i.url === url);
                if (!isDup) {
                  setGallery((prev: GalleryItem[]) => [
                    {
                      id: crypto.randomUUID(),
                      url,
                      type: 'customer',
                      name: data.name || 'Cliente sem nome',
                      timestamp: Date.now()
                    },
                    ...prev
                  ]);
                }
              }
            }}
            category="customer"
            gallery={gallery}
            setGallery={setGallery}
            aspectRatio="w-40 h-48"
          />
        </div>

        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase block">Dados Pessoais (Obrigatório: Nome)</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <Input label="Nome Completo *" value={data.name} onChange={v => setData({...data, name: v})} placeholder="Ex: João Silva" />
              </div>
              <Input label="E-mail" value={data.email} onChange={v => setData({...data, email: v})} placeholder="joao@email.com" />
              <Input label="WhatsApp" value={data.whatsapp} onChange={v => setData({...data, whatsapp: v})} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Input label="Data de Nasc." value={data.dob} onChange={handleDobChange} placeholder="DD/MM/AAAA" />
        <Input label="CPF / CNPJ" value={data.taxId} onChange={v => setData({...data, taxId: v})} placeholder="000.000.000-00" />
      </div>

      <div className="space-y-4">
        <label className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase block">Endereço (Opcional)</label>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Input label="CEP" value={data.address.cep} onChange={v => setData({...data, address: {...data.address, cep: v}})} placeholder="00000-000" />
          <div className="md:col-span-2">
            <Input label="Logradouro" value={data.address.street} onChange={v => setData({...data, address: {...data.address, street: v}})} placeholder="Rua, Avenida, etc." />
          </div>
          <Input label="Número" value={data.address.number} onChange={v => setData({...data, address: {...data.address, number: v}})} placeholder="123" />
          <Input label="Bairro" value={data.address.neighborhood} onChange={v => setData({...data, address: {...data.address, neighborhood: v}})} placeholder="Ex: Centro" />
          <Input label="Cidade" value={data.address.city} onChange={v => setData({...data, address: {...data.address, city: v}})} placeholder="Sua Cidade" />
          <Input label="Estado" value={data.address.state} onChange={v => setData({...data, address: {...data.address, state: v}})} placeholder="UF" />
          <Input label="Complemento" value={data.address.complement} onChange={v => setData({...data, address: {...data.address, complement: v}})} placeholder="Apto, Sala, etc." />
        </div>
      </div>

      <div className="flex flex-col items-end gap-4 pt-4">
        <AnimatePresence>
          {showSuccess && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-emerald-600 text-white px-6 py-2 rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <CheckCircle2 size={14} />
              <span className="font-black text-[9px] uppercase tracking-widest">{isEditing ? 'Alterações salvas!' : 'Cliente cadastrado!'}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-end items-center gap-4 w-full">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-800 transition-all"
          >
            Cancelar
          </button>
          <button 
            onClick={() => onSubmit(data)}
            className="bg-[#5d5dff] text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2"
          >
            {isEditing ? <Check size={18} /> : <Plus size={18} />}
            {isEditing ? 'Salvar Alterações' : 'Salvar Cliente'}
          </button>
        </div>
      </div>
    </div>
  );
}

function CustomerView({ 
  customers, 
  setCustomers, 
  addActivity, 
  sales, 
  imprimirCupom, 
  company, 
  couponConfig,
  products,
  goldCustomerIds,
  canEdit,
  currentUser,
  gallery,
  setGallery,
  paymentIcons
}: { 
  customers: Customer[], 
  setCustomers: any, 
  addActivity: (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => void,
  sales: Sale[],
  imprimirCupom: (sale: Sale | string, customTitle?: string) => Promise<any>,
  company: any,
  couponConfig: CouponConfig,
  products: Product[],
  goldCustomerIds: Set<string>,
  canEdit: boolean,
  currentUser: any | null,
  gallery: GalleryItem[],
  setGallery: any,
  paymentIcons: Record<string, string>
}) {
  const [showForm, setShowForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingSale, setViewingSale] = useState<Sale | null>(null);
  const INITIAL_CUSTOMER_STATE = { 
    name: '', 
    email: '', 
    whatsapp: '', 
    dob: '', 
    taxId: '',
    image: '',
    address: {
      cep: '',
      street: '',
      number: '',
      neighborhood: '',
      city: '',
      state: '',
      complement: ''
    }
  };
  const [newCustomer, setNewCustomer] = useState(INITIAL_CUSTOMER_STATE);

  const [isDeleting, setIsDeleting] = useState(false);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  const checkBirthday = (dob: string) => {
    if (!dob) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const parts = dob.split('/');
    if (parts.length < 2) return false;
    
    const day = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    if (isNaN(day) || isNaN(month)) return false;
    
    // Check for this year
    let bday = new Date(today.getFullYear(), month - 1, day);
    
    const diffTime = bday.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      const bdayNext = new Date(today.getFullYear() + 1, month - 1, day);
      const diffTimeNext = bdayNext.getTime() - today.getTime();
      const diffDaysNext = Math.ceil(diffTimeNext / (1000 * 60 * 60 * 24));
      return diffDaysNext >= 0 && diffDaysNext <= 7;
    }

    return diffDays >= 0 && diffDays <= 7;
  };

  const addCustomer = (customerData: any) => {
    if (!customerData.name) return alert('O nome do cliente é obrigatório.');
    
    if (customerData.dob) {
      if (checkBirthday(customerData.dob)) {
        alert(`🎉 ALERTA DE ANIVERSÁRIO!\nO aniversário de ${customerData.name} é nos próximos 7 dias!`);
      }
    }

    let clientToSelect: Customer | null = null;
    let finalClient: Customer | null = null;

    if (editingId) {
      setCustomers((prev: Customer[]) => prev.map(c => {
        if (c.id === editingId) {
          const updated = { ...c, ...customerData, updatedAt: Date.now() };
          clientToSelect = updated;
          finalClient = updated;
          addActivity('customer', 'Cliente Editado', `Dados de ${updated.name} atualizados.`);
          return updated;
        }
        return c;
      }));
      setEditingId(null);
    } else {
      const uuid = crypto.randomUUID();
      const client: Customer = {
        id: uuid,
        displayId: `CUST-${uuid.substring(0, 4).toUpperCase()}`,
        ...customerData,
        debt: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      finalClient = client;
      setCustomers((prev: Customer[]) => [...prev, client]);
      addActivity('customer', 'Novo Cliente', `Cliente ${client.name} cadastrado com ID ${client.displayId}.`);
    }

    // Gerar PDF Automático
    if (finalClient) {
      generateCustomerPDF(finalClient, company);
    }

    setNewCustomer(INITIAL_CUSTOMER_STATE);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      setShowForm(false);
      setSelectedCustomer(clientToSelect);
    }, 1500);
  };

  const handleEdit = (customer: Customer) => {
    setNewCustomer({
      name: customer.name || '',
      email: customer.email || '',
      whatsapp: customer.whatsapp || customer.phone || '',
      dob: customer.dob || '',
      taxId: customer.taxId || '',
      image: customer.image || '',
      address: {
        cep: customer.address?.cep || '',
        street: customer.address?.street || '',
        number: customer.address?.number || '',
        neighborhood: customer.address?.neighborhood || '',
        city: customer.address?.city || '',
        state: customer.address?.state || '',
        complement: customer.address?.complement || ''
      }
    });
    setEditingId(customer.id);
    setShowForm(true);
    setSelectedCustomer(null);
  };

  const confirmDelete = () => {
    if (selectedCustomer) {
      addActivity('customer', 'Cliente Excluído', `Cliente ${selectedCustomer.name} (${selectedCustomer.displayId}) removido do sistema.`);
      setCustomers((prev: Customer[]) => prev.filter(c => c.id !== selectedCustomer.id));
      
      setSelectedCustomer(null);
      setIsDeleting(false);
    }
  };

  const filteredCustomers = customers.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.whatsapp?.includes(searchTerm) || 
      c.phone?.includes(searchTerm) || 
      c.taxId?.includes(searchTerm);
    
    const matchesLetter = activeLetter ? c.name.toUpperCase().startsWith(activeLetter) : true;
    
    return matchesSearch && matchesLetter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">
          {selectedCustomer ? `Perfil: ${selectedCustomer.name}` : showForm ? (editingId ? 'Editar Cliente' : 'Cadastro de Cliente') : 'Gestão de Clientes'}
        </h3>
        <button 
          onClick={() => {
            if (selectedCustomer) {
              setSelectedCustomer(null);
            } else if (showForm) {
              setShowForm(false);
              setEditingId(null);
              setNewCustomer({
                name: '', email: '', whatsapp: '', dob: '', taxId: '', image: '',
                address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' }
              });
            }
          }}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-sm ${
            showForm || selectedCustomer
            ? 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800' 
            : 'hidden'
          }`}
        >
          <ArrowLeft size={16} /> Voltar para Lista
        </button>
        {!showForm && !selectedCustomer && canEdit && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all bg-[#5d5dff] text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20"
          >
            <Plus size={16} /> Novo Cliente
          </button>
        )}
      </div>

      {!showForm && !selectedCustomer && (
        <div className="space-y-2">
          {customers.filter(c => checkBirthday(c.dob || '')).map(c => (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              key={`bday-alert-${c.id}`}
              className="bg-red-500/10 border border-red-900/30 p-4 rounded-2xl flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-zinc-900 shadow-sm flex items-center justify-center text-red-500">
                  <Cake size={20} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-red-500 uppercase tracking-widest leading-none mb-1">Alerta de Aniversário</h4>
                  <p className="text-xs font-bold text-zinc-100">O cliente <span className="text-red-400">{c.name}</span> faz aniversário em breve!</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(c)}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all"
              >
                Ver Perfil
              </button>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {selectedCustomer ? (
          <motion.div
            key="profile"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden"
          >
            <div className="p-8">
              <div className="flex flex-col md:flex-row gap-8">
                <div className="flex flex-col items-center text-center space-y-4">
                  <div className="relative group">
                    {selectedCustomer.image ? (
                      <img 
                        src={selectedCustomer.image} 
                        className="w-32 h-32 rounded-3xl object-cover border-4 border-zinc-800 shadow-xl"
                        alt={selectedCustomer.name}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-3xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-3xl uppercase border-4 border-zinc-800 shadow-xl">
                        {selectedCustomer.name.substring(0, 2)}
                      </div>
                    )}
                    <div className="absolute -bottom-2 right-0 bg-[#5d5dff] text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-blue-500/20">
                      {selectedCustomer.displayId || 'REF-N/A'}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-3">
                      <h4 className="font-black text-2xl text-zinc-100 uppercase tracking-tighter">{selectedCustomer.name}</h4>
                      {goldCustomerIds.has(selectedCustomer.id) && (
                        <div className="flex items-center gap-1 bg-amber-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20">
                          <Star size={10} fill="currentColor" />
                          CLIENTE OURO
                        </div>
                      )}
                    </div>
                    <p className="text-xs font-black text-zinc-600 uppercase tracking-widest mt-1">UUID: {selectedCustomer.id.substring(0, 18)}...</p>
                  </div>
                  <div className="w-full pt-4 border-t border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest mb-1">Dívida Total</p>
                    <p className={`text-2xl font-black ${selectedCustomer.debt > 0 ? 'text-red-500' : 'text-green-500'}`}>
                      R$ {selectedCustomer.debt.toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase border-b border-zinc-800 pb-2">Informações de Contato</h5>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">E-mail</p>
                        <p className="text-sm font-bold text-zinc-100">{selectedCustomer.email || 'Nenhum e-mail cadastrado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">WhatsApp / Telefone</p>
                        <p className="text-sm font-bold text-zinc-100">{selectedCustomer.whatsapp || selectedCustomer.phone || 'Nenhum contato cadastrado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">CPF / CNPJ</p>
                        <p className="text-sm font-bold text-zinc-100">{selectedCustomer.taxId || 'Não informado'}</p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Data de Nascimento</p>
                        <p className="text-sm font-bold text-zinc-100">{selectedCustomer.dob || 'Não informado'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h5 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase border-b border-zinc-800 pb-2">Endereço de Entrega</h5>
                    {selectedCustomer.address?.street ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">CEP</p>
                            <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.cep}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Número</p>
                            <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.number}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Logradouro</p>
                          <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.street}</p>
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Bairro</p>
                          <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.neighborhood}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Cidade</p>
                            <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.city}</p>
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Estado</p>
                            <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.state}</p>
                          </div>
                        </div>
                        {selectedCustomer.address.complement && (
                          <div>
                            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest mb-1">Complemento</p>
                            <p className="text-sm font-bold text-zinc-100">{selectedCustomer.address.complement}</p>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="h-full flex items-center justify-center text-center p-8 bg-zinc-950 rounded-2xl border border-zinc-800">
                        <p className="text-xs font-black text-zinc-600 uppercase tracking-widest">Nenhum endereço cadastrado</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Purchase History */}
              <div className="mt-12 pt-12 border-t border-zinc-800 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-zinc-500 tracking-[0.2em] uppercase">Histórico de Compras</h4>
                  <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest">{sales.filter(s => s.customerId === selectedCustomer.id).length} Pedidos localizados</p>
                </div>

                <div className="bg-zinc-950 rounded-3xl border border-zinc-800 overflow-hidden">
                  {/* Desktop Table */}
                  <div className="hidden lg:block">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-black/20 text-[8px] font-black text-zinc-500 uppercase tracking-[0.2em]">
                          <th className="px-6 py-4">Data</th>
                          <th className="px-6 py-4">Itens</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right">Total</th>
                          <th className="px-6 py-4 text-right">Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800">
                        {sales.filter(s => s.customerId === selectedCustomer.id)
                          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map(sale => (
                          <tr key={sale.id} className="hover:bg-zinc-900 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="text-[10px] font-bold text-zinc-100 block">{new Date(sale.date).toLocaleDateString('pt-BR')}</span>
                              <span className="text-[8px] font-black text-zinc-600 uppercase">{new Date(sale.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter truncate max-w-[200px]">
                                {sale.items.length} {sale.items.length === 1 ? 'Produto' : 'Produtos'}
                              </p>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                                sale.status === 'cancelado' ? 'bg-red-500/10 text-red-500' : 
                                sale.status === 'entregue' || !sale.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                              }`}>
                                {sale.status || 'Finalizado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <p className="text-[10px] font-black text-zinc-100">R$ {sale.total.toFixed(2)}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                 onClick={() => setViewingSale(sale)}
                                 className="p-2.5 bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-xl hover:text-blue-400 hover:border-blue-900/30 transition-all shadow-sm group-hover:scale-110"
                                 title="Ver Detalhes"
                               >
                                 <Tag size={14} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Cards */}
                  <div className="lg:hidden divide-y divide-zinc-800">
                    {sales.filter(s => s.customerId === selectedCustomer.id)
                      .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map(sale => (
                      <div key={sale.id} className="p-4 space-y-3 active:bg-zinc-900 transition-colors" onClick={() => setViewingSale(sale)}>
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-[10px] font-black text-zinc-100">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">#{sale.sequentialId || sale.id.substring(0,6)}</p>
                          </div>
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${
                            sale.status === 'cancelado' ? 'bg-red-500/10 text-red-500' : 
                            sale.status === 'entregue' || !sale.status ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {sale.status || 'Finalizado'}
                          </span>
                        </div>
                        <div className="flex justify-between items-end">
                          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">
                            {sale.items.length} {sale.items.length === 1 ? 'Produto' : 'Produtos'}
                          </p>
                          <p className="text-sm font-black text-white tracking-widest">R$ {sale.total.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {sales.filter(s => s.customerId === selectedCustomer.id).length === 0 && (
                    <div className="py-12 text-center opacity-30">
                      <div className="flex flex-col items-center gap-2">
                        <ShoppingBag size={32} className="text-zinc-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Nenhuma compra realizada</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-zinc-800 flex flex-wrap justify-between gap-4">
                <div className="flex items-center gap-4">
                  {canEdit && (
                    isDeleting ? (
                      <div className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-900/30">
                        <p className="text-[10px] font-black text-red-500 uppercase px-3">Confirmar exclusão?</p>
                        <button 
                          onClick={confirmDelete}
                          className="bg-red-500 text-white px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-red-600 transition-all"
                        >
                          Sim
                        </button>
                        <button 
                          onClick={() => setIsDeleting(false)}
                          className="bg-zinc-800 text-zinc-500 px-4 py-2 rounded-lg font-black text-[10px] uppercase hover:bg-zinc-700 transition-all"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setIsDeleting(true)}
                        className="px-6 py-4 rounded-xl border border-red-900/30 text-red-500 font-black text-[10px] uppercase tracking-widest hover:bg-red-500/10 transition-all flex items-center gap-2"
                      >
                        <Trash2 size={16} /> Excluir Cliente
                      </button>
                    )
                  )}
                </div>

                <div className="flex gap-4">
                  {canEdit && (
                    <button 
                      onClick={() => {
                        if (selectedCustomer) handleEdit(selectedCustomer);
                      }}
                      className="bg-zinc-800 text-zinc-400 px-6 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center gap-2"
                    >
                      <UserPlus size={16} /> Editar Dados
                    </button>
                  )}
                  <button className="bg-[#5d5dff] text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2">
                    <Zap size={16} /> Registrar Venda
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : showForm ? (
          <motion.div 
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden"
          >
            <CustomerForm 
              initialData={newCustomer}
              isEditing={!!editingId}
              gallery={gallery}
              setGallery={setGallery}
              onCancel={() => {
                setShowForm(false);
                setEditingId(null);
                setNewCustomer(INITIAL_CUSTOMER_STATE);
              }}
              onSubmit={addCustomer}
              showSuccess={showSuccess}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex overflow-x-auto no-scrollbar gap-1 py-3 border-b border-zinc-800 -mx-4 md:mx-0 px-4 md:px-0">
              <button 
                onClick={() => setActiveLetter(null)}
                className={`flex-shrink-0 w-10 h-10 md:w-8 md:h-8 rounded-xl md:rounded-lg text-[10px] font-black transition-all ${!activeLetter ? 'bg-[#5d5dff] text-white shadow-md shadow-blue-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
              >
                TUDO
              </button>
              {alphabet.map(l => (
                <button 
                  key={l}
                  onClick={() => setActiveLetter(activeLetter === l ? null : l)}
                  className={`flex-shrink-0 w-10 h-10 md:w-8 md:h-8 rounded-xl md:rounded-lg text-[10px] font-black transition-all ${activeLetter === l ? 'bg-[#5d5dff] text-white shadow-md shadow-blue-500/20' : 'text-zinc-500 hover:bg-zinc-800'}`}
                >
                  {l}
                </button>
              ))}
            </div>

            <div className="relative">
              <input 
                type="text"
                placeholder="NOME, TELEFONE OU CPF..."
                className="w-full p-5 md:p-6 bg-zinc-900 border border-zinc-800 rounded-2xl md:rounded-3xl outline-none focus:ring-2 focus:ring-blue-400 text-xs font-black uppercase tracking-widest transition-all pr-14 text-zinc-100 placeholder:text-zinc-700"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-700">
                <Search size={20} />
              </div>
            </div>

            <div className="space-y-4">
              {/* Desktop Table View */}
              <div className="hidden lg:block bg-zinc-900 rounded-[2rem] border border-zinc-800 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-black/20 border-b border-zinc-800 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Whatsapp / Telefone</th>
                        <th className="px-6 py-4">CPF / CNPJ</th>
                        <th className="px-6 py-4 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {filteredCustomers.map(c => (
                        <tr 
                          key={c.id} 
                          onClick={() => setSelectedCustomer(c)}
                          className="hover:bg-blue-500/5 transition-colors cursor-pointer group"
                        >
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-3">
                              {c.image ? (
                                <img 
                                  src={c.image} 
                                  className="w-8 h-8 rounded-lg object-cover shrink-0 border border-zinc-800 shadow-sm"
                                  alt={c.name}
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-[10px] uppercase shrink-0 border border-zinc-800">
                                  {c.name.substring(0, 2)}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <h4 className="font-black text-zinc-100 uppercase tracking-tighter text-xs leading-none mb-1 group-hover:text-blue-400 transition-colors">{c.name}</h4>
                                  {goldCustomerIds.has(c.id) && (
                                    <Star size={10} className="text-amber-500 fill-amber-500" />
                                  )}
                                </div>
                                <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest">{c.displayId || 'NEW'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <div className="flex items-center gap-2">
                              <span className="bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest">WhatsApp</span>
                              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{c.whatsapp || c.phone || '---'}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{c.taxId || '---'}</p>
                          </td>
                          <td className="px-6 py-3 text-right">
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedCustomer(c);
                              }}
                              className="bg-zinc-800 text-zinc-500 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-[#5d5dff] hover:text-white transition-all border border-zinc-700"
                            >
                              Ver Perfil
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden grid grid-cols-1 gap-3">
                {filteredCustomers.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => setSelectedCustomer(c)}
                    className="bg-zinc-900 p-4 rounded-2xl border border-zinc-800 flex items-center justify-between group active:scale-[0.98] transition-all"
                  >
                    <div className="flex items-center gap-4">
                      {c.image ? (
                        <img 
                          src={c.image} 
                          className="w-12 h-12 rounded-xl object-cover shrink-0 border border-zinc-800"
                          alt={c.name}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-black text-xs uppercase shrink-0 border border-zinc-800">
                          {c.name.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-zinc-100 uppercase tracking-tight text-sm leading-none">{c.name}</h4>
                          {goldCustomerIds.has(c.id) && (
                            <Star size={10} className="text-amber-500 fill-amber-500" />
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{c.displayId || 'NEW'}</span>
                          <span className="w-1 h-1 rounded-full bg-zinc-800" />
                          <span className="text-[9px] font-bold text-zinc-500 uppercase">{c.whatsapp || c.phone || '---'}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-zinc-700 group-hover:text-blue-400 transition-colors" />
                  </div>
                ))}
              </div>

              {filteredCustomers.length === 0 && (
                <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-20 text-center">
                  <UserPlus size={40} className="mx-auto text-zinc-800 mb-4" />
                  <p className="text-xs font-black text-zinc-700 uppercase tracking-widest">Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {viewingSale && (
          <OrderDetailsModal 
            sale={viewingSale} 
            onClose={() => setViewingSale(null)} 
            company={company}
            couponConfig={couponConfig}
            imprimirCupom={imprimirCupom}
            products={products}
            customers={customers}
            paymentIcons={paymentIcons}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function OrderDetailsModal({ 
  sale, 
  onClose, 
  company, 
  couponConfig, 
  imprimirCupom, 
  products,
  customers,
  paymentIcons
}: { 
  sale: Sale, 
  onClose: () => void, 
  company: any, 
  couponConfig: CouponConfig, 
  imprimirCupom: (sale: Sale | string) => Promise<boolean>,
  products: Product[],
  customers: Customer[],
  paymentIcons: Record<string, string>
}) {
  const customer = customers.find(c => c.id === sale.customerId);

  const getStatusLabel = (status: Sale['status']) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_separacao': return 'Em Separação';
      case 'separado': return 'Separado';
      case 'falta_confirmada': return 'Falta Confirmada';
      case 'embalado': return 'Embalado';
      case 'enviado': return 'Enviado';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'pendente': return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
      case 'em_separacao': return 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50';
      case 'separado': return 'bg-blue-950/30 text-blue-400 border-blue-900/50';
      case 'falta_confirmada': return 'bg-amber-950/30 text-amber-400 border-amber-900/50';
      case 'embalado': return 'bg-purple-950/30 text-purple-400 border-purple-900/50';
      case 'enviado': return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50';
      case 'entregue': return 'bg-zinc-800 text-zinc-100 border-transparent';
      case 'cancelado': return 'bg-red-950/30 text-red-400 border-red-900/50';
      default: return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
    }
  };

  const originalTotal = (sale.originalItems || sale.items).reduce((acc, i) => acc + (i.price * i.quantity), 0);
  const diffTotal = originalTotal - sale.total;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-zinc-900 w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden relative border border-zinc-800 flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-zinc-800 shrink-0">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-xl font-black text-zinc-100 uppercase tracking-widest flex items-center gap-2">
                <ShoppingBag className="text-[#5d5dff]" size={24} />
                Pedido #{sale.sequentialId || sale.id.substring(0,8)}
              </h4>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                {new Date(sale.date).toLocaleString('pt-BR')}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border ${getStatusColor(sale.status)}`}>
                {getStatusLabel(sale.status)}
              </span>
              <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full text-zinc-500 transition-all">
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto space-y-8 no-scrollbar">
          {/* Section: Dados Gerais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <User size={12} /> Cliente
              </h5>
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <p className="text-sm font-black text-zinc-100 uppercase">{customer?.name || 'Cliente de Balcão'}</p>
                {customer?.whatsapp && <p className="text-[10px] text-zinc-500 font-bold mt-1">{customer.whatsapp}</p>}
                {sale.notes && (
                  <div className="mt-3 pt-3 border-t border-zinc-900">
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-tighter mb-1">Observações:</p>
                    <p className="text-[10px] text-zinc-400 italic font-medium">{sale.notes}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                <Info size={12} /> Origem da Venda
              </h5>
              <div className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800">
                <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Vendedor (PDV):</p>
                <p className="text-xs font-black text-zinc-100 uppercase">{sale.soldByUserName || 'Automático'}</p>
                <p className="text-[9px] text-zinc-600 font-bold mt-2 uppercase">Canal:</p>
                <p className="text-xs font-black text-[#5d5dff] uppercase">Venda Presencial / Balcão</p>
              </div>
            </div>
          </div>

          {/* Section: Fluxo do Pedido */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Linha do Tempo / Fluxo
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Venda Realizada */}
              <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-1">
                <p className="text-[8px] font-black text-zinc-600 uppercase">1. Venda</p>
                <p className="text-[9px] font-black text-zinc-300 uppercase truncate">{sale.soldByUserName || 'Sistema'}</p>
                <p className="text-[8px] text-emerald-500 font-bold">{new Date(sale.date).toLocaleTimeString('pt-BR')}</p>
              </div>

              {/* Início de Separação */}
              {sale.startedSeparationByUserName && (
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase">2. Iniciou Sep.</p>
                  <p className="text-[9px] font-black text-indigo-400 uppercase truncate">{sale.startedSeparationByUserName}</p>
                  {sale.startedSeparationAt && (
                    <p className="text-[8px] text-zinc-500 font-bold">{new Date(sale.startedSeparationAt).toLocaleTimeString('pt-BR')}</p>
                  )}
                </div>
              )}

              {/* Finalização de Separação / Conferência */}
              {sale.separatedByUserName && (
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase">3. Finalizou Sep.</p>
                  <p className="text-[9px] font-black text-blue-400 uppercase truncate">{sale.separatedByUserName}</p>
                  {sale.separatedByAt && (
                    <p className="text-[8px] text-zinc-500 font-bold uppercase">{new Date(sale.separatedByAt).toLocaleTimeString('pt-BR')}</p>
                  )}
                  {sale.status === 'falta_confirmada' && (
                    <div className="mt-1">
                      <div className="text-[7px] bg-amber-500/10 text-amber-500 px-1 py-0.5 rounded font-black uppercase text-center">Falta Confirmada</div>
                      {sale.missingConfirmedByUserName && sale.missingConfirmedByUserName !== sale.separatedByUserName && (
                        <p className="text-[6px] text-zinc-600 font-bold uppercase text-center mt-0.5">Por: {sale.missingConfirmedByUserName}</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Embalagem */}
              {sale.packedByUserName && (
                <div className="bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/50 space-y-1">
                  <p className="text-[8px] font-black text-zinc-600 uppercase">4. Embalou</p>
                  <p className="text-[9px] font-black text-purple-400 uppercase truncate">{sale.packedByUserName}</p>
                  <p className="text-[8px] text-zinc-500 font-bold uppercase">Status: {getStatusLabel(sale.status)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Section: Itens */}
          <div className="space-y-4">
            <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              <Package size={12} /> Itens do Pedido
            </h5>
            <div className="bg-zinc-950 rounded-2xl border border-zinc-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 border-b border-zinc-800 text-[8px] font-black text-zinc-600 uppercase tracking-tighter">
                    <th className="px-4 py-3">Produto</th>
                    <th className="px-4 py-3 text-center">Pedida</th>
                    <th className="px-4 py-3 text-center">Enviada</th>
                    <th className="px-4 py-3 text-center">Falta</th>
                    <th className="px-4 py-3 text-right">Preço</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {/* All items from original requested list */}
                  {(sale.originalItems || sale.items).map((oi, idx) => {
                    const si = sale.items.find(i => i.productId === oi.productId);
                    const p = products.find(prod => prod.id === oi.productId);
                    const requestedQty = oi.quantity;
                    const sentQty = si ? si.quantity : 0;
                    const missingQty = Math.max(0, requestedQty - sentQty);
                    
                    return (
                      <tr key={idx} className="text-zinc-400 group hover:bg-zinc-900/50 transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black text-zinc-200 uppercase truncate max-w-[150px]">{products.find(p => p.id === oi.productId)?.name || 'Produto Removido'}</p>
                        </td>
                        <td className="px-4 py-3 text-center font-black text-zinc-500 text-[10px]">{requestedQty}</td>
                        <td className="px-4 py-3 text-center font-black text-zinc-300 text-[10px]">{sentQty}</td>
                        <td className="px-4 py-3 text-center">
                          {missingQty > 0 ? (
                            <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-1.5 py-0.5 rounded">{missingQty}</span>
                          ) : (
                            <span className="text-[8px] text-zinc-800 font-bold">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right text-[10px] font-bold">R$ {oi.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-[10px] font-black text-zinc-100 italic">R$ {(sentQty * oi.price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                  {/* Extra items included manually during separation (if any) */}
                  {sale.items.filter(i => ! (sale.originalItems || []).some(oi => oi.productId === i.productId)).map((extraItem, idx) => {
                    return (
                      <tr key={`extra-${idx}`} className="bg-emerald-500/5 text-emerald-400 italic">
                        <td className="px-4 py-3">
                          <p className="text-[10px] font-black uppercase truncate max-w-[150px]">{products.find(p => p.id === extraItem.productId)?.name || 'Prod. Extra'}</p>
                          <span className="text-[7px] font-black bg-emerald-500/20 text-emerald-500 px-1 rounded uppercase">Inclusão Manual</span>
                        </td>
                        <td className="px-4 py-3 text-center font-black text-[10px]">0</td>
                        <td className="px-4 py-3 text-center font-black text-[10px]">{extraItem.quantity}</td>
                        <td className="px-4 py-3 text-center text-[8px] font-bold">-</td>
                        <td className="px-4 py-3 text-right text-[10px] font-bold">R$ {extraItem.price.toFixed(2)}</td>
                        <td className="px-4 py-3 text-right text-[10px] font-black">R$ {(extraItem.quantity * extraItem.price).toFixed(2)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section: Financeiro */}
          <div className="bg-zinc-950 p-6 rounded-[2rem] border border-zinc-800 flex flex-col md:flex-row justify-between gap-6">
              <div className="space-y-4">
                <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard size={12} /> Pagamento
                </h5>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-zinc-100 uppercase">
                    <span>{paymentIcons?.[sale.paymentMethod || ''] || '📦'}</span>
                    <span>{sale.paymentMethod || 'Não informado'}</span>
                  </div>
                  {sale.payments && sale.payments.length > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {sale.payments.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[9px] bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800">
                          <div className="flex items-center gap-1">
                            <span>{paymentIcons?.[p.method || ''] || '📦'}</span>
                            <span className="text-zinc-500 font-bold">{p.method}</span>
                          </div>
                          <span className="text-zinc-300 font-black">R$ {p.amount.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

            <div className="flex flex-col items-end gap-2 shrink-0 md:min-w-[200px]">
              <div className="flex justify-between w-full text-[10px] font-bold text-zinc-500 uppercase tracking-tighter">
                <span>Total Bruto (Original):</span>
                <span>R$ {originalTotal.toFixed(2)}</span>
              </div>
              {diffTotal > 0 && (
                <div className="flex justify-between w-full text-[10px] font-bold text-amber-500 uppercase tracking-tighter">
                  <span>Desconto por Faltas:</span>
                  <span>- R$ {diffTotal.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between w-full items-center pt-2 mt-2 border-t border-dashed border-zinc-800">
                <span className="text-xs font-black text-zinc-100 uppercase tracking-widest leading-none">Total à Receber:</span>
                <span className="text-2xl font-black text-[#5d5dff] italic">R$ {sale.total.toFixed(2)}</span>
              </div>
            </div>

            {sale.returns && sale.returns.length > 0 && (
              <div className="mt-8 space-y-4">
                <h5 className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2">
                  <RotateCcw size={12} /> Devoluções Realizadas
                </h5>
                <div className="space-y-3">
                  {sale.returns.map(ret => (
                    <div key={ret.id} className="bg-red-500/5 border border-red-500/10 p-4 rounded-2xl space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-[10px] font-black text-red-400 uppercase">Data: {new Date(ret.date).toLocaleString()}</p>
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Responsável: {ret.userName}</p>
                        </div>
                        <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Realizada</span>
                      </div>
                      <div className="space-y-1">
                        {ret.items.map(ri => {
                          const p = products.find(prod => prod.id === ri.productId);
                          return (
                            <p key={ri.productId} className="text-[10px] font-bold text-zinc-300">
                              • {ri.quantity}x {p?.name || 'Item'}
                            </p>
                          );
                        })}
                      </div>
                      {ret.reason && (
                        <p className="text-[9px] text-zinc-500 italic mt-2 border-t border-red-500/10 pt-2">
                          "{ret.reason}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-8 bg-zinc-950 border-t border-zinc-800 shrink-0 flex gap-4">
          <button 
            onClick={() => imprimirCupom(sale)}
            className="flex-1 bg-[#5d5dff] text-white p-4 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2"
          >
            <Printer size={18} /> Imprimir Comprovante
          </button>
          <button 
            onClick={onClose}
            className="px-8 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-zinc-700 hover:text-white transition-all flex items-center justify-center"
          >
            Fechar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ReceiptModal({ 
  sale, 
  products, 
  onClose, 
  customers,
  company,
  couponConfig,
  onConfirm,
  isFinalized = true,
  imprimirCupom,
  imprimirPedidoPDV,
  onGoToSeparation,
  paymentIcons
}: { 
  sale: Sale, 
  products: Product[], 
  onClose: () => void, 
  customers: Customer[],
  company: CompanyInfo,
  couponConfig: CouponConfig,
  onConfirm?: () => void,
  isFinalized?: boolean,
  imprimirCupom: (saleOrHtml: Sale | string) => Promise<boolean>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  onGoToSeparation?: () => void,
  paymentIcons: Record<string, string>
}) {
  const customer = customers.find(c => c.id === sale.customerId);

  const handlePrint = async (type: 'pdf' | 'print') => {
    if (type === 'print' && isFinalized) {
       return await imprimirPedidoPDV(sale);
    }

    const isPDF = type === 'pdf' || (type === 'print' && couponConfig.outputType === 'pdf');

    if (isPDF) {
      const pageWidth = couponConfig.format === '58mm' ? 58 : 
                        couponConfig.format === '80mm' ? 80 : 
                        couponConfig.format === 'custom' ? (couponConfig.customWidth || 80) : 80;
      
      const doc = new jsPDF({
        unit: 'mm',
        format: couponConfig.format === '58mm' ? [58, 200] : 
                couponConfig.format === '80mm' ? [80, 297] : 
                couponConfig.format === 'custom' ? [couponConfig.customWidth || 80, couponConfig.customHeight || 297] : 
                couponConfig.format
      });

      let y = 10;
      const centerX = pageWidth / 2;

      if (company.logo && couponConfig.showLogo) {
        try {
          doc.addImage(company.logo, 'PNG', centerX - 6, y, 12, 12);
          y += 14;
        } catch (e) {
          console.error("Error adding logo to PDF", e);
        }
      }

      doc.setFontSize(12);
      const displayNameSource = String(company.tradeName || company.name || 'EMPRESA');
      doc.text(displayNameSource, centerX, y, { align: 'center' });
      y += 6;

      if (couponConfig.showCompanyId) {
        doc.setFontSize(8);
        let idStr = String(`CPF/CNPJ: ${company.idNumber || '---'}`);
        if (company.stateRegistration) {
          idStr += ` | IE: ${company.stateRegistration}`;
        }
        doc.text(String(idStr), centerX, y, { align: 'center' });
        y += 4;
      }

      if (couponConfig.showCompanyAddress) {
        const addrLine1 = String(`${company.address.logradouro || ''}, ${company.address.numero || ''}`);
        const addrLine2 = String(`${company.address.bairro || ''}`);
        const addrLine3 = String(`${company.address.cidade || ''}/${company.address.estado || ''}`);
        
        doc.setFontSize(7);
        doc.text(addrLine1, centerX, y, { align: 'center' });
        y += 4;
        if (addrLine2) {
          doc.text(addrLine2, centerX, y, { align: 'center' });
          y += 4;
        }
        doc.text(addrLine3, centerX, y, { align: 'center' });
        y += 6;
      }

      doc.setLineDashPattern([1, 1], 0);
      doc.line(5, y, pageWidth - 5, y);
      y += 6;

      doc.setFontSize(9);
      doc.text('ITEM', 5, y);
      doc.text('TOTAL', Number(pageWidth - 5), y, { align: 'right' });
      y += 5;

      sale.items.forEach(item => {
        const p = products.find(prod => prod.id === item.productId);
        const originalPrice = p?.price || item.price;
        const discountPerUnit = originalPrice - item.price;

        doc.setFontSize(8);
        const itemText = String(`${item.quantity}x ${p?.name || 'Item'}`);
        doc.text(itemText, 5, y);
        doc.text(String(`R$ ${(item.price * item.quantity).toFixed(2)}`), Number(pageWidth - 5), y, { align: 'right' });
        y += 4;
        
        if (couponConfig.showPrice || (couponConfig.showDiscount && discountPerUnit > 0)) {
          doc.setFontSize(6);
          let extraInfo = '';
          if (couponConfig.showPrice) extraInfo += `Unit: R$ ${Number(item.price).toFixed(2)}`;
          if (couponConfig.showDiscount && discountPerUnit > 0) {
            extraInfo += ` (Economia: R$ ${Number((discountPerUnit * item.quantity)).toFixed(2)})`;
          }
          if (extraInfo) {
            doc.text(String(extraInfo), 7, y);
            y += 4;
          }
        }
      });

      y += 2;
      doc.line(5, y, pageWidth - 5, y);
      y += 6;

      if (couponConfig.showFinalTotal) {
        doc.setFontSize(10);
        doc.text('TOTAL GERAL', 5, y);
        doc.text(String(`R$ ${Number(sale.total).toFixed(2)}`), Number(pageWidth - 5), y, { align: 'right' });
        y += 6;
      }

      if (couponConfig.showPaymentMethod) {
        doc.setFontSize(8);
        doc.text('PAGAMENTO:', 5, y);
        y += 4;
        if (sale.payments && sale.payments.length > 0) {
          sale.payments.forEach(p => {
            doc.text(String(`${p.method}:`), 5, y);
            doc.text(String(`R$ ${Number(p.amount).toFixed(2)}`), Number(pageWidth - 5), y, { align: 'right' });
            y += 4;
          });
        } else {
          doc.text(String(`${sale.paymentMethod || 'Dinheiro'}:`), 5, y);
          doc.text(String(`R$ ${Number(sale.total).toFixed(2)}`), Number(pageWidth - 5), y, { align: 'right' });
          y += 4;
        }
      }
      
      if (couponConfig.showChange && (sale.change || 0) > 0) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('TROCO:', 5, y);
        doc.text(String(`R$ ${Number(sale.change || 0).toFixed(2)}`), Number(pageWidth - 5), y, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        y += 6;
      }

      y += 4;

      if (couponConfig.showCustomer && customer) {
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('CLIENTE:', 5, y);
        doc.setFont('helvetica', 'normal');
        y += 4;

        if (couponConfig.showCustomerData) {
          doc.text(String(`NOME: ${customer.name}`), 5, y);
          y += 4;
          if (customer.whatsapp || customer.phone) {
            doc.text(String(`WHATSAPP: ${customer.whatsapp || customer.phone}`), 5, y);
            y += 4;
          }
          if (customer.taxId) {
            doc.text(String(`DOC: ${customer.taxId}`), 5, y);
            y += 4;
          }
          if (customer.address) {
            doc.setFontSize(7);
            let addrLine = String(`END: ${customer.address.street || ''}`);
            if (customer.address.number) addrLine += `, ${customer.address.number}`;
            doc.text(addrLine, 5, y);
            y += 3.5;
            if (customer.address.neighborhood) {
              doc.text(String(`BAIRRO: ${customer.address.neighborhood}`), 5, y);
              y += 3.5;
            }
            if (customer.address.city) {
              doc.text(String(`CIDADE: ${customer.address.city} - ${customer.address.state || ''}`), 5, y);
              y += 3.5;
            }
            if (customer.address.cep) {
              doc.text(String(`CEP: ${customer.address.cep}`), 5, y);
              y += 3.5;
            }
            if (customer.address.complement) {
              doc.text(String(`COMPL: ${customer.address.complement}`), 5, y);
              y += 3.5;
            }
            y += 2;
          }
        }
      }

      if (couponConfig.showOrderQrCode) {
        try {
          const qrContent = String(sale.sequentialId || sale.id);
          const qrDataUrl = await QRCode.toDataURL(qrContent);
          doc.addImage(qrDataUrl, 'PNG', Number(centerX - 10), y, 20, 20);
          y += 22;
          doc.setFontSize(6);
          doc.setFont('helvetica', 'bold');
          doc.text('REFERÊNCIA DO PEDIDO', centerX, y, { align: 'center' });
          y += 3;
          doc.setFont('helvetica', 'normal');
          doc.text(String(`PEDIDO: #${sale.sequentialId}`), centerX, y, { align: 'center' });
          y += 3;
          doc.text(String(new Date(sale.date).toLocaleString('pt-BR')), centerX, y, { align: 'center' });
          y += 6;
        } catch (err) {
          console.error("Error generating QR code for PDF", err);
        }
      }

      y += 4;
      doc.setFontSize(8);
      doc.text(String(couponConfig.defaultMessage || ''), centerX, y, { align: 'center' });
      y += 4;

      if (sale.soldByUserName) {
        doc.setFontSize(7);
        doc.text(String(`VENDIDO POR: ${sale.soldByUserName}`), centerX, y, { align: 'center' });
        y += 3;
      }
      
      y += 10;
      
      if (type === 'print' && couponConfig.printMode === 'auto') {
        const base64PDF = doc.output('datauristring').split(',')[1];
        const handled = await imprimirCupom(base64PDF);
        if (handled) return;
      }

      doc.save(`cupom-${sale.id.substring(0, 8)}.pdf`);
    } else {
      await imprimirCupom(sale);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} 
        animate={{ scale: 1, y: 0 }} 
        className="bg-white p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden border-4 border-black"
      >
        <div className={`absolute top-0 left-0 w-full h-3 border-b-2 border-black ${isFinalized ? 'bg-emerald-500' : 'bg-blue-600'}`} />
        
        {!onConfirm || isFinalized ? (
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-black hover:scale-110 transition-transform"
          >
            <X size={20} />
          </button>
        ) : null}

        <div className="text-center space-y-2">
          {company.logo && (
            <img src={company.logo} className="w-16 h-16 object-contain mx-auto mb-2 opacity-100 invert" />
          )}
          <h4 className="text-lg font-black text-black uppercase tracking-widest">
            {isFinalized ? 'Cupom de Venda' : 'Confirmar Venda'}
          </h4>
          <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest mt-1">
            {company.tradeName || company.name}
          </p>
          <div className={`inline-block px-3 py-1 rounded-full border-2 border-black text-[9px] font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] ${isFinalized ? 'bg-emerald-500 text-white' : 'bg-[#FFDE2E] text-black'}`}>
            {isFinalized ? `PEDIDO CRIADO COM SUCESSO` : 'REVISE OS ITENS ABAIXO'}
          </div>
        </div>

        <div className="bg-zinc-50 rounded-2xl p-5 border-2 border-black shadow-[inner_2px_2px_0px_0px_rgba(0,0,0,0.1)] max-h-64 overflow-y-auto font-mono text-[10px] space-y-2 text-black">
           <p className="text-center font-black uppercase text-xs mb-1">{company.tradeName || company.name}</p>
           <p className="text-center text-[8px] opacity-60 font-bold uppercase">
             CPF/CNPJ: {company.idNumber || '---'}
             {company.stateRegistration && ` | IE: ${company.stateRegistration}`}
           </p>
           <p className="text-center text-[8px] opacity-60 font-bold uppercase">{company.address.logradouro}, {company.address.numero}</p>
           
           <div className="border-t-2 border-black border-dashed my-3"></div>
           
           {sale.items.map((item, idx) => {
             const p = products.find(prod => prod.id === item.productId);
             const originalPrice = p?.price || item.price;
             const discount = originalPrice - item.price;
             return (
               <div key={idx} className="space-y-0.5">
                 <div className="flex justify-between font-black uppercase">
                   <span className="truncate pr-4">{item.quantity}x {p?.name || 'ITEM'}</span>
                   <span className="shrink-0">R$ {(item.price * item.quantity).toFixed(2)}</span>
                 </div>
                 {couponConfig.showDiscount && discount > 0 && (
                   <div className="flex justify-between text-[8px] text-red-600 font-black italic">
                     <span>DESCONTO ATACADO</span>
                     <span>- R$ {(discount * item.quantity).toFixed(2)}</span>
                   </div>
                 )}
               </div>
             );
           })}
           
           <div className="border-t-2 border-black border-dashed my-3"></div>
           
           <div className="flex justify-between font-black text-sm pt-1">
             <span>TOTAL GERAL</span>
             <span>R$ {sale.total.toFixed(2)}</span>
           </div>

           <div className="space-y-1 mt-3 pt-3 border-t border-black/10">
             <p className="font-black text-[9px] uppercase border-b-2 border-black/10 pb-1 mb-2">Forma de Pagamento</p>
             {sale.payments && sale.payments.length > 0 ? (
               sale.payments.map((p, i) => (
                 <div key={i} className="flex justify-between text-[9px] uppercase font-black">
                   <div className="flex items-center gap-1">
                     <span>{paymentIcons?.[p.method || ''] || '📦'}</span>
                     <span>{p.method}</span>
                   </div>
                   <span>R$ {p.amount.toFixed(2)}</span>
                 </div>
               ))
             ) : (
               <div className="flex justify-between text-[9px] uppercase font-black">
                 <div className="flex items-center gap-1">
                   <span>{paymentIcons?.[sale.paymentMethod || ''] || '📦'}</span>
                   <span>{sale.paymentMethod}</span>
                 </div>
                 <span>R$ {sale.total.toFixed(2)}</span>
               </div>
             )}
           </div>

           {(sale.change || 0) > 0 && (
             <div className="flex justify-between text-[10px] uppercase text-emerald-500 font-black mt-2 pt-1 border-t border-zinc-800">
               <span>Troco</span>
               <span>R$ {(sale.change || 0).toFixed(2)}</span>
             </div>
           )}

           {customer && couponConfig.showCustomer && (
             <div className="mt-4 pt-2 border-t border-gray-100 italic space-y-0.5 text-[9px]">
               <p className="font-black uppercase">Destinatário:</p>
               <p>{customer.name}</p>
               {customer.whatsapp && <p>Whats: {customer.whatsapp}</p>}
               {customer.address && (
                 <>
                   <p>{customer.address.street}, {customer.address.number}</p>
                   <p>{customer.address.neighborhood} - {customer.address.city}/{customer.address.state}</p>
                   <p>CEP: {customer.address.cep}</p>
                 </>
               )}
             </div>
           )}

           <div className="text-center pt-4 opacity-50 uppercase text-[8px]">
             {couponConfig.defaultMessage}
           </div>
        </div>

        <div className="flex flex-col gap-3">
          {!isFinalized && onConfirm ? (
            <button 
              onClick={onConfirm}
              className="w-full p-4 rounded-2xl bg-amber-500 text-white font-black text-xs uppercase shadow-lg shadow-amber-900/20 hover:bg-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <Check size={20} /> Confirmar e Finalizar
            </button>
          ) : (
            <div className="flex gap-2">
               <button 
                 onClick={() => handlePrint('print')}
                 className="flex-1 p-4 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
               >
                 <Printer size={16} /> {isFinalized ? 'Imprimir Pedido' : 'Imprimir'}
               </button>
               <button 
                 onClick={() => handlePrint('pdf')}
                 className="flex-1 p-4 rounded-2xl bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase hover:bg-zinc-700 transition-all flex items-center justify-center gap-2"
               >
                 <Download size={16} /> PDF
               </button>
            </div>
          )}
          
          {isFinalized && onGoToSeparation && (
            <button 
              onClick={onGoToSeparation}
              className="w-full p-4 rounded-2xl bg-indigo-500/10 text-indigo-400 font-black text-[10px] uppercase transition-all hover:bg-indigo-500/20 flex items-center justify-center gap-2"
            >
              <Clock size={16} /> Ir para Separação
            </button>
          )}

          {isFinalized && (
            <button 
              onClick={onClose}
              className="w-full p-4 rounded-2xl bg-emerald-500 text-white font-black text-[10px] uppercase transition-all hover:bg-emerald-600 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <ShoppingBag size={16} /> Nova Venda / Voltar ao PDV
            </button>
          )}

          {(!onConfirm || isFinalized) && (
            <button 
              onClick={onClose}
              className="w-full p-4 rounded-2xl bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase transition-all hover:bg-zinc-700"
            >
              Fechar
            </button>
          )}

          {onConfirm && !isFinalized && (
            <button 
              onClick={onClose}
              className="w-full p-4 rounded-2xl border border-zinc-800 text-zinc-500 font-black text-[10px] uppercase transition-all hover:bg-zinc-800"
            >
              Cancelar
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SalesHistoryView({ 
  sales, 
  products, 
  onCancel, 
  customers,
  company,
  couponConfig,
  imprimirCupom,
  imprimirPedidoPDV,
  canEdit,
  currentUser,
  paymentIcons
}: { 
  sales: Sale[], 
  products: Product[], 
  onCancel?: (id: string) => void, 
  customers: Customer[],
  company: CompanyInfo,
  couponConfig: CouponConfig,
  imprimirCupom: (sale: Sale | string, customTitle?: string) => Promise<any>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  canEdit?: boolean,
  currentUser: SystemUser | null,
  paymentIcons: Record<string, string>
}) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [statusFilter, setStatusFilter] = useState<'todos' | Sale['status']>('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSales = useMemo(() => {
    let list = [...sales];

    const isAdmin = currentUser?.id === 'admin' || (currentUser && currentUser.roleId === 'role-gerente');
    if (!isAdmin) {
      list = list.filter(s => s.soldByUserId === currentUser?.id);
    }
    
    // Status Filter
    if (statusFilter !== 'todos') {
      list = list.filter(s => (s.status || 'pendente') === statusFilter);
    }

    // Search Term Filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      list = list.filter(s => {
        const customer = customers.find(c => c.id === s.customerId);
        return (
          s.sequentialId?.toLowerCase().includes(lowerSearch) ||
          customer?.name.toLowerCase().includes(lowerSearch) ||
          s.items.some(item => {
            const p = products.find(prod => prod.id === item.productId);
            return p?.name.toLowerCase().includes(lowerSearch) || p?.sku?.toLowerCase().includes(lowerSearch);
          })
        );
      });
    }

    return list.sort((a, b) => b.date - a.date);
  }, [sales, statusFilter, searchTerm, customers, products]);

  const getStatusLabel = (status: Sale['status']) => {
    switch (status) {
      case 'pendente': return 'Pendente';
      case 'em_separacao': return 'Em Separação';
      case 'separado': return 'Separado';
      case 'falta_confirmada': return 'Falta Confirmada';
      case 'embalado': return 'Embalado';
      case 'enviado': return 'Enviado';
      case 'entregue': return 'Entregue';
      case 'cancelado': return 'Cancelado';
      default: return 'Pendente';
    }
  };

  const getStatusColor = (status: Sale['status']) => {
    switch (status) {
      case 'pendente': return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
      case 'em_separacao': return 'bg-indigo-950/30 text-indigo-400 border-indigo-900/50';
      case 'separado': return 'bg-blue-950/30 text-blue-400 border-blue-900/50';
      case 'falta_confirmada': return 'bg-amber-950/30 text-amber-400 border-amber-900/50';
      case 'embalado': return 'bg-purple-950/30 text-purple-400 border-purple-900/50';
      case 'enviado': return 'bg-emerald-950/30 text-emerald-400 border-emerald-900/50';
      case 'entregue': return 'bg-zinc-800 text-zinc-100 border-transparent';
      case 'cancelado': return 'bg-red-950/30 text-red-400 border-red-900/50';
      default: return 'bg-orange-950/30 text-orange-400 border-orange-900/50';
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {selectedSale && (
          <OrderDetailsModal 
            sale={selectedSale} 
            products={products} 
            customers={customers}
            company={company}
            couponConfig={couponConfig}
            onClose={() => setSelectedSale(null)} 
            imprimirCupom={imprimirCupom}
            paymentIcons={paymentIcons}
          />
        )}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar w-full md:w-auto">
          {[
            { id: 'todos', label: 'Todas' },
            { id: 'pendente', label: 'Pendentes' },
            { id: 'em_separacao', label: 'Em Separação' },
            { id: 'separado', label: 'Separado' },
            { id: 'falta_confirmada', label: 'Falta Conf.' },
            { id: 'embalado', label: 'Embalado' },
            { id: 'enviado', label: 'Enviado' },
            { id: 'entregue', label: 'Entregue' },
            { id: 'cancelado', label: 'Canceladas' }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-4 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all whitespace-nowrap border ${
                statusFilter === f.id 
                  ? 'bg-zinc-100 text-zinc-900 border-transparent shadow-md' 
                  : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:border-zinc-700'
              }`}
            >
              {f.label}
              <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[8px] ${statusFilter === f.id ? 'bg-zinc-900/20' : 'bg-zinc-800'}`}>
                {f.id === 'todos' ? sales.length : sales.filter(s => (s.status || 'pendente') === f.id).length}
              </span>
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
          <input 
            type="text"
            placeholder="Buscar pedido ou cliente..."
            className="w-full pl-10 pr-4 py-2.5 bg-zinc-900 rounded-xl border border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-400 font-bold text-xs shadow-sm text-zinc-100 placeholder:text-zinc-700"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-3xl border border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-black/20 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Pedido / Data</th>
                <th className="px-6 py-4">Cliente</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Itens</th>
                <th className="px-6 py-4">Pagamento</th>
                <th className="px-6 py-4 text-right">Total</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const customer = customers.find(c => c.id === sale.customerId);
                  return (
                    <tr key={sale.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-[10px] font-black text-indigo-400 mb-0.5">#{sale.sequentialId || sale.id.substring(0, 8)}</p>
                        <p className="text-[9px] font-medium text-zinc-500">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-black text-zinc-100 uppercase">{customer?.name || 'Cliente de Balcão'}</p>
                        {customer?.whatsapp && <p className="text-[9px] text-zinc-500 font-medium">{customer.whatsapp}</p>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-lg border ${getStatusColor(sale.status)}`}>
                            {getStatusLabel(sale.status)}
                          </span>
                          {sale.originalItems && sale.originalItems.some(oi => {
                            const current = sale.items.find(i => i.productId === oi.productId);
                            return !current || current.quantity < oi.quantity;
                          }) && (
                            <span className="text-[7px] font-black uppercase px-1.5 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-900/40">
                              Item(s) Faltando
                            </span>
                          )}
                        </div>
                        {(sale.status === 'falta_confirmada' || (sale.originalItems && sale.originalItems.some(oi => !sale.items.find(i => i.productId === oi.productId && i.quantity === oi.quantity)))) && sale.separatedByUserName && (
                          <div className="mt-2 space-y-0.5">
                            <p className="text-[8px] text-zinc-500 font-black uppercase tracking-tighter">Conferido por:</p>
                            <p className="text-[9px] text-[#5d5dff] font-black uppercase">{sale.separatedByUserName}</p>
                            {sale.separatedByAt && (
                              <p className="text-[7px] text-zinc-600 font-bold uppercase">
                                {new Date(sale.separatedByAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                              </p>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {sale.items.map((item, idx) => {
                            const p = products.find(prod => prod.id === item.productId);
                            const originalItem = sale.originalItems?.find(oi => oi.productId === item.productId);
                            const originalQty = originalItem ? originalItem.quantity : item.quantity;
                            const hasMissing = originalQty > item.quantity;

                            return (
                              <div key={idx} className="flex flex-col">
                                <p className="text-[10px] font-medium text-zinc-400 line-clamp-1">
                                  {item.quantity}x {p?.name || 'Produto Removido'}
                                </p>
                                {hasMissing && (
                                  <p className="text-[8px] font-black text-amber-500 uppercase tracking-tighter bg-amber-500/10 px-1 rounded inline-block w-fit">
                                    Vendido: {originalQty} | Enviado: {item.quantity} | Falta: {originalQty - item.quantity}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                          {/* Itens que faltaram totalmente */}
                          {sale.originalItems && sale.originalItems.filter(oi => !sale.items.some(i => i.productId === oi.productId)).map((oi, idx) => {
                            const p = products.find(prod => prod.id === oi.productId);
                            return (
                              <div key={`missing-${idx}`} className="flex flex-col opacity-60">
                                <p className="text-[10px] font-medium text-zinc-500 line-through truncate">
                                  0x {p?.name || 'Produto Removido'}
                                </p>
                                <p className="text-[8px] font-black text-red-500 uppercase tracking-tighter bg-red-500/10 px-1 rounded inline-block w-fit">
                                  FALTA TOTAL (Vendido: {oi.quantity})
                                </p>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[8px] font-black uppercase px-2 py-1 rounded-lg bg-blue-950/30 text-blue-400 border border-blue-900/50 flex items-center gap-1 w-fit">
                          <span>{paymentIcons?.[sale.paymentMethod] || '📦'}</span>
                          <span>{sale.paymentMethod}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex flex-col items-end">
                          <p className="text-xs font-black text-zinc-100">R$ {sale.total.toFixed(2)}</p>
                          {sale.originalItems && (
                            (() => {
                              const originalTotal = sale.originalItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
                              if (Math.abs(originalTotal - sale.total) > 0.01) {
                                return (
                                  <p className="text-[8px] font-bold text-zinc-500 line-through">
                                    Original: R$ {originalTotal.toFixed(2)}
                                  </p>
                                );
                              }
                              return null;
                            })()
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => setSelectedSale(sale)}
                            className="p-2 text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                          >
                            <Eye size={14} /> Abrir pedido
                          </button>
                          {canEdit && onCancel && (sale.status === 'pendente' || sale.status === 'em_separacao') && (
                            <button 
                              onClick={() => onCancel(sale.id)}
                              className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <History size={40} className="text-zinc-800" />
                      <p className="text-sm font-black text-zinc-600 uppercase tracking-widest">Nenhum pedido encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function POSView({ 
  sales,
  products, 
  setSales, 
  setProducts, 
  paymentMethods, 
  paymentIcons,
  addActivity,
  cashierSession,
  addSaleToCashier,
  customers,
  setCustomers,
  deliveryChannels,
  setDeliveryChannels,
  deliveryMethods,
  company,
  couponConfig,
  setView,
  imprimirCupom,
  imprimirPedidoPDV,
  calculateProductCost,
  createRevenueForSale,
  goldCustomerIds,
  currentUser,
  canEdit,
  gallery,
  setGallery
}: { 
  products: Product[], 
  sales: Sale[],
  setSales: any, 
  setProducts: any, 
  paymentMethods: string[], 
  paymentIcons: Record<string, string>,
  addActivity: (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => void,
  cashierSession: CashierSession,
  addSaleToCashier: (sale: Sale) => void,
  customers: Customer[],
  setCustomers: any,
  deliveryChannels: DeliveryChannel[],
  setDeliveryChannels: any,
  deliveryMethods: DeliveryMethod[],
  company: CompanyInfo,
  couponConfig: CouponConfig,
  setView: (v: View) => void,
  imprimirCupom: (saleOrHtml: Sale | string) => Promise<boolean>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  calculateProductCost: (productId: string) => number,
  createRevenueForSale: (sale: Sale) => void,
  goldCustomerIds: Set<string>,
  currentUser: SystemUser | null,
  canEdit: boolean,
  gallery: GalleryItem[],
  setGallery: any
}) {
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0] || 'DINHEIRO');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(() => {
    return deliveryChannels.find(c => c.name.toUpperCase() === 'PDV')?.id || deliveryChannels[0]?.id || null;
  });
  const [selectedPayments, setSelectedPayments] = useState<PaymentEntry[]>([]);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showChannelModal, setShowChannelModal] = useState(false);
  const [editingChannel, setEditingChannel] = useState<DeliveryChannel | null>(null);
  const [newChannelName, setNewChannelName] = useState('');
  
  const handleSaveChannel = () => {
    if (!canEdit) return;
    if (!newChannelName.trim()) return;
    
    if (editingChannel) {
      // Update
      const updated = deliveryChannels.map(c => 
        c.id === editingChannel.id ? { ...c, name: newChannelName.trim() } : c
      );
      setDeliveryChannels(updated);
      addActivity('ajustes', 'Canal Editado', `Canal de venda ${newChannelName} atualizado.`);
    } else {
      // Create
      const newcomer: DeliveryChannel = {
        id: crypto.randomUUID(),
        name: newChannelName.trim()
      };
      setDeliveryChannels([...deliveryChannels, newcomer]);
      addActivity('ajustes', 'Canal Criado', `Novo canal de venda ${newChannelName} cadastrado.`);
    }
    
    setNewChannelName('');
    setEditingChannel(null);
  };

  const handleDeleteChannel = (id: string, name: string) => {
    if (!canEdit) return;
    if (id === 'pdv' || name.toUpperCase() === 'PDV') {
      return alert('O canal padrão PDV não pode ser excluído.');
    }
    if (confirm(`Deseja realmente excluir o canal "${name}"?`)) {
      setDeliveryChannels(deliveryChannels.filter(c => c.id !== id));
      addActivity('ajustes', 'Canal Excluído', `Canal de venda ${name} removido.`);
    }
  };
  
  // States for confirmation flow
  const [checkoutPreview, setCheckoutPreview] = useState<Sale | null>(null);
  const [isFinalized, setIsFinalized] = useState(false);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.whatsapp && c.whatsapp.includes(customerSearch)) || (c.taxId && c.taxId.includes(customerSearch)));
  }, [customers, customerSearch]);

  // Registration fields for unified shortcut (REMOVED)
  
  // Search input ref to focus back
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    const lowerTerm = searchTerm.toLowerCase();
    const normalizedTerm = searchTerm.replace(/^0+/, '');

    return products.filter(p => {
      const nameMatch = p.name.toLowerCase().includes(lowerTerm);
      const sku = (p.sku || '').toLowerCase();
      const barcode = (p.barcode || '').toLowerCase();
      
      const skuMatch = sku === lowerTerm || (sku && sku.replace(/^0+/, '') === normalizedTerm);
      const barcodeMatch = barcode === lowerTerm || (barcode && barcode.replace(/^0+/, '') === normalizedTerm);
      const idMatch = p.id === searchTerm || p.id.replace(/^0+/, '') === normalizedTerm;

      return nameMatch || skuMatch || barcodeMatch || idMatch;
    });
  }, [products, searchTerm]);

  const addToCart = (p: Product) => {
    const existing = cart.find(item => item.product.id === p.id);
    if (existing) {
      setCart(cart.map(item => item.product.id === p.id ? { ...item, quantity: item.quantity + 1 } : item));
    } else {
      setCart([...cart, { product: p, quantity: 1 }]);
    }
    setSearchTerm('');
    searchInputRef.current?.focus();
  };

  const handleSearchKeyPress = (e: any) => {
    if (e.key === 'Enter') {
      if (filteredProducts.length === 1) {
        addToCart(filteredProducts[0]);
      } else if (filteredProducts.length > 1) {
        // Try to match exactly by SKU, Barcode or ID if multiple, prioritizing exact string match
        const term = searchTerm.trim();
        const normalizedTerm = term.replace(/^0+/, '');

        const exactMatch = filteredProducts.find(p => 
          p.sku === term || 
          p.barcode === term || 
          p.id === term
        ) || filteredProducts.find(p => 
          (p.sku && p.sku.replace(/^0+/, '') === normalizedTerm) || 
          (p.barcode && p.barcode.replace(/^0+/, '') === normalizedTerm) ||
          p.id.replace(/^0+/, '') === normalizedTerm
        );

        if (exactMatch) addToCart(exactMatch);
      }
    }
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty <= 0) return item;
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const calculateItemPrice = (item: { product: Product, quantity: number }) => {
    if (item.product.wholesalePrice && item.product.wholesaleMinQty && item.quantity >= item.product.wholesaleMinQty) {
      return item.product.wholesalePrice;
    }
    return item.product.price;
  };

  const total = cart.reduce((acc, item) => acc + calculateItemPrice(item) * item.quantity, 0);

  const totalPaid = selectedPayments.reduce((acc, p) => acc + p.amount, 0);
  const remainingValue = Math.max(0, total - totalPaid);
  const trocoCalculated = Math.max(0, totalPaid - total);

  const addPayment = () => {
    if (paymentAmount <= 0) return;

    if (paymentMethod === 'DINHEIRO') {
      const existingIdx = selectedPayments.findIndex(p => p.method === 'DINHEIRO');
      if (existingIdx !== -1) {
        setSelectedPayments(prev => {
          const next = [...prev];
          next[existingIdx] = {
            ...next[existingIdx],
            amount: next[existingIdx].amount + paymentAmount,
            date: Date.now()
          };
          return next;
        });
        setPaymentAmount(0);
        return;
      }
    }

    const newPayment: PaymentEntry = {
      method: paymentMethod,
      amount: paymentAmount,
      date: Date.now()
    };
    setSelectedPayments(prev => [...prev, newPayment]);
    setPaymentAmount(0);
  };

  const removePayment = (index: number) => {
    setSelectedPayments(prev => prev.filter((_, i) => i !== index));
  };

  const handleCheckout = () => {
    if (cart.length === 0) return;
    
    // Auto-add remaining if no payments registered yet but user tries to finish
    let finalPayments = [...selectedPayments];
    if (finalPayments.length === 0) {
      finalPayments = [{
        method: paymentMethod,
        amount: total,
        date: Date.now()
      }];
    }

    const totalPaidFinal = finalPayments.reduce((acc, p) => acc + p.amount, 0);
    const finalChange = Math.max(0, totalPaidFinal - total);
    
    // Find highest sequential ID to increment
    const maxSeq = sales.reduce((max, s) => {
      const seqNum = parseInt(s.sequentialId || '0');
      return seqNum > max ? seqNum : max;
    }, 0);
    const nextSeq = (maxSeq + 1).toString().padStart(5, '0');

    const sale: Sale = {
      id: crypto.randomUUID(),
      sequentialId: nextSeq,
      date: Date.now(),
      total,
      totalCost: cart.reduce((acc, i) => acc + (calculateProductCost(i.product.id) * i.quantity), 0),
      totalProfit: 0, // Calculated below
      paymentMethod: finalPayments.length > 1 ? 'Múltiplos' : finalPayments[0].method,
      payments: finalPayments,
      receivedAmount: totalPaidFinal,
      change: finalChange,
      soldByUserId: currentUser?.id,
      soldByUserName: currentUser?.name,
      items: cart.map(i => {
        const cost = calculateProductCost(i.product.id);
        const price = calculateItemPrice(i);
        const profit = price - cost;
        return { 
          productId: i.product.id, 
          quantity: i.quantity, 
          price,
          cost,
          profit
        };
      }),
      customerId: selectedCustomerId || undefined,
      deliveryChannelId: selectedChannelId || deliveryChannels.find(c => c.name.toUpperCase() === 'PDV')?.id || deliveryChannels[0]?.id,
      cashierSessionId: cashierSession.id,
      status: 'pendente',
      updatedAt: Date.now()
    };
    
    sale.totalProfit = sale.total - sale.totalCost;
    
    setCheckoutPreview(sale);
    setIsFinalized(false);
  };

  const confirmSale = async () => {
    if (!checkoutPreview) return;
    if (!cashierSession.isOpen) {
      alert('⚠️ O CAIXA ESTÁ FECHADO. Abra o caixa no menu CAIXA para realizar vendas.');
      return;
    }
    
    const subtotal = cart.reduce((acc, i) => acc + (i.product.price * i.quantity), 0);
    const total = checkoutPreview.total;
    const discount = subtotal - total;

    // Save sale
    setSales((prev: Sale[]) => [...prev, checkoutPreview]);
    
    addSaleToCashier(checkoutPreview);
    createRevenueForSale(checkoutPreview);

    // Deduct stock (Allowing negative)
    setProducts((prev: Product[]) => prev.map(p => {
      const item = checkoutPreview.items.find(i => i.productId === p.id);
      if (item) return { ...p, stock: p.stock - item.quantity };
      return p;
    }));
    
    let msg = `Venda de R$ ${checkoutPreview.total.toFixed(2)} via ${checkoutPreview.paymentMethod}`;
    if (checkoutPreview.deliveryMethodId) msg += ` (Entrega: ${deliveryMethods.find(m => m.id === checkoutPreview.deliveryMethodId)?.name})`;
    addActivity('sale', 'Venda Realizada', msg);

    if (discount > 0.01) {
      addActivity('sale', 'Aplicação de Desconto', `Desconto de R$ ${discount.toFixed(2)} aplicado na venda #${checkoutPreview.sequentialId}.`);
    }
    
    setIsFinalized(true);
    
    // Auto print if configured
    if (couponConfig.printMode === 'auto') {
      imprimirPedidoPDV(checkoutPreview);
    }

    setCart([]);
    setSelectedCustomerId(null);
    setSelectedPayments([]);
    setPaymentAmount(0);
  };

  const closeCheckout = () => {
    setCheckoutPreview(null);
    setIsFinalized(false);
  };

  if (!cashierSession.isOpen) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 bg-white rounded-3xl border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
        <div className="w-24 h-24 bg-amber-100 text-amber-600 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <Lock size={40} />
        </div>
        <div>
          <h3 className="text-2xl font-black text-black uppercase tracking-widest">Caixa Fechado</h3>
          <p className="text-xs text-black opacity-70 font-bold mt-2 mb-8 uppercase tracking-tight">Você precisa abrir o caixa antes de realizar vendas.</p>
          <button 
            onClick={() => setView('cashier')}
            className="bg-[#5d5dff] text-white border-4 border-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-y-0.5 active:translate-x-0.5 flex items-center gap-3 mx-auto"
          >
            <Unlock size={20} /> Ir Abrir Caixa
          </button>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="flex flex-col lg:flex-row gap-6 md:gap-8 animate-in fade-in duration-500 pb-24 lg:pb-0 w-full max-w-full overflow-x-hidden">
      {/* Left Column: Selection */}
      <div className="flex-1 space-y-6 w-full max-w-full">
        {/* Customer bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 w-full">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 h-full">
            <button 
              onClick={() => setShowCustomerModal(true)}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all h-full ${selectedCustomerId ? 'border-black bg-blue-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${selectedCustomerId ? 'bg-white text-blue-600' : 'bg-black text-white'}`}>
                <UserPlus size={18} />
              </div>
              <div className="text-left overflow-hidden flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none ${selectedCustomerId ? 'opacity-70' : 'opacity-40'}`}>Cliente</p>
                  {selectedCustomerId && goldCustomerIds.has(selectedCustomerId) && (
                    <span className="bg-amber-400 text-black border border-black text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase tracking-tighter flex items-center gap-0.5">
                      <Star size={7} fill="currentColor" /> OURO
                    </span>
                  )}
                </div>
                <p className="text-xs font-black truncate uppercase">{selectedCustomer ? selectedCustomer.name : 'Selecionar Cliente'}</p>
              </div>
              {selectedCustomerId && (
                <X 
                  size={16} 
                  className="ml-auto text-white hover:bg-black/20 rounded p-0.5" 
                  onClick={(e) => { e.stopPropagation(); setSelectedCustomerId(null); }} 
                />
              )}
            </button>

            <button 
              onClick={() => setShowChannelModal(true)}
              className={`p-4 rounded-2xl border-2 flex items-center gap-3 transition-all h-full ${selectedChannelId ? 'border-black bg-emerald-500 text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]' : 'border-black bg-white text-black hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${selectedChannelId ? 'bg-white text-emerald-600' : 'bg-black text-white'}`}>
                <Link size={18} />
              </div>
              <div className="text-left overflow-hidden flex-1">
                <p className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest leading-none mb-1 ${selectedChannelId ? 'opacity-70' : 'opacity-40'}`}>Canal de Venda</p>
                <p className="text-xs font-black truncate uppercase">
                  {deliveryChannels.find(c => c.id === selectedChannelId)?.name || 'PDV'}
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Product Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black" size={20} />
          <input 
            ref={searchInputRef}
            placeholder="BUSCAR PRODUTO (SKU / NOME / BARRAS)..." 
            className="w-full pl-12 pr-4 py-5 bg-white rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] font-black text-sm md:text-base text-black placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all focus:translate-y-[-2px] focus:translate-x-[-2px] focus:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] uppercase"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            autoFocus
          />
          {searchTerm && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black z-[70] max-h-72 overflow-y-auto">
              {filteredProducts.map(p => (
                <button key={p.id} onClick={() => addToCart(p)} className="w-full p-4 text-left hover:bg-zinc-50 flex justify-between border-b-2 border-black last:border-0 items-center group transition-colors">
                  <div className="min-w-0 pr-4">
                    <p className="font-black text-sm text-black uppercase truncate group-hover:text-[#5d5dff]">{p.name}</p>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Estoque: {p.stock}</p>
                  </div>
                  <span className="text-black font-black shrink-0 bg-[#FFDE2E] px-3 py-1 rounded-lg border-2 border-black">R$ {p.price.toFixed(2)}</span>
                </button>
              ))}
              {filteredProducts.length === 0 && (
                <div className="p-8 text-center text-black font-black uppercase tracking-widest opacity-40 italic text-xs">Produto não encontrado</div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">Forma de Pagamento</label>
            <div className="flex flex-wrap gap-2">
              {paymentMethods.map(method => (
                <button 
                  key={method}
                  onClick={() => {
                    setPaymentMethod(method);
                    if (paymentAmount === 0) setPaymentAmount(remainingValue);
                  }}
                  className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2 border-2 border-black ${paymentMethod === method ? 'bg-black text-white shadow-[2px_2px_0px_0px_rgba(93,93,255,1)]' : 'bg-white text-black hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}
                >
                  <span className="text-base">{paymentIcons[method] || (method === 'DINHEIRO' ? '💵' : method === 'PIX' ? '📲' : method.includes('CARTÃO') ? '💳' : '📦')}</span>
                  {method}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Valor a Registrar (R$)</label>
                {remainingValue > 0 && (
                  <span className="text-[10px] font-black text-red-600 uppercase">Falta R$ {remainingValue.toFixed(2)}</span>
                )}
              </div>
              <div className="flex gap-2">
                <input 
                  type="number"
                  placeholder="0,00"
                  className="flex-1 p-4 bg-zinc-50 rounded-2xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] font-black text-lg text-black placeholder:text-zinc-400 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  value={paymentAmount || ''}
                  onChange={e => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  onKeyDown={e => e.key === 'Enter' && addPayment()}
                />
                <button 
                  onClick={addPayment}
                  className="bg-[#FFDE2E] text-black p-4 rounded-2xl hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all border-2 border-black active:translate-y-0 active:translate-x-0 active:shadow-none"
                  title="Registrar Pagamento"
                >
                  <Plus size={24} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Column: Cart */}
      <div className="w-full lg:w-96 shrink-0 bg-white rounded-3xl p-6 border-4 border-black flex flex-col h-auto min-h-[300px] lg:h-[650px] shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-[#FFDE2E] border-b-2 border-black"></div>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-black">
            <ShoppingBag className="text-black" size={18} />
            <h4 className="font-black text-xs uppercase tracking-widest">Pedido</h4>
          </div>
          <span className="px-2 py-1 bg-[#FFDE2E] rounded-lg text-[9px] font-black text-black border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            {cart.length} ITENS
          </span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-1 no-scrollbar max-h-[400px] lg:max-h-none">
          {cart.length === 0 ? (
            <div className="h-full min-h-[150px] flex flex-col items-center justify-center text-black/20">
              <ShoppingBag size={48} className="mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em]">Carrinho Vazio</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.product.id} className="flex justify-between items-start group bg-zinc-50 p-4 rounded-2xl border-2 border-black transition-all hover:bg-zinc-100 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
                <div className="min-w-0 flex-1 pr-4">
                  <p className="font-black text-xs uppercase truncate text-black mb-1">{item.product.name}</p>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase">{item.quantity}x R$ {item.product.price.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <div className="flex items-center gap-3 bg-white border-2 border-black rounded-xl p-1">
                    <button 
                      onClick={() => updateQuantity(item.product.id, -1)}
                      className="w-8 h-8 flex items-center justify-center bg-zinc-100 border border-black rounded-lg text-black hover:bg-red-100 transition-all active:scale-90"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="text-xs font-black w-6 text-center text-black">{item.quantity}</span>
                    <button 
                      onClick={() => updateQuantity(item.product.id, 1)}
                      className="w-8 h-8 flex items-center justify-center bg-zinc-100 border border-black rounded-lg text-black hover:bg-blue-100 transition-all active:scale-90"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-sm font-black text-black">R$ {(calculateItemPrice(item) * item.quantity).toFixed(2)}</span>
                    {calculateItemPrice(item) < item.product.price && (
                      <span className="text-[8px] font-black uppercase text-white bg-black px-2 py-0.5 rounded-full border border-black">Atacado</span>
                    )}
                  </div>
                  <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="p-2 text-zinc-300 hover:text-red-600 transition-colors">
                     <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-6 border-t-4 border-black space-y-6">
          {selectedCustomer && (
            <div className="flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-xl border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
               <Check size={12} className="shrink-0" />
               <span className="text-[10px] font-black uppercase tracking-widest truncate">Cliente: {selectedCustomer.name}</span>
            </div>
          )}
          
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Subtotal</span>
              <span className="text-sm font-bold text-black opacity-60">R$ {cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0).toFixed(2)}</span>
            </div>
            {cart.some(i => calculateItemPrice(i) < i.product.price) && (
              <div className="flex justify-between items-center text-red-600">
                <span className="text-[10px] font-black uppercase tracking-widest">Desconto Atacado</span>
                <span className="text-sm font-bold italic">- R$ {(cart.reduce((acc, i) => acc + i.product.price * i.quantity, 0) - total).toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-black pt-2">
              <span className="text-xs font-black uppercase tracking-widest">Total Geral</span>
              <span className="text-3xl font-black tracking-tighter">R$ {total.toFixed(2)}</span>
            </div>

            {/* List of payments */}
            {selectedPayments.length > 0 && (
              <div className="mt-4 pt-4 border-t-2 border-black border-dashed space-y-2">
                <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">Pagamentos Registrados</p>
                {selectedPayments.map((p, idx) => {
                  const sameMethodPayments = selectedPayments.filter(sp => sp.method === p.method);
                  const isMultiple = sameMethodPayments.length > 1 && p.method !== 'DINHEIRO';
                  const methodIndex = isMultiple ? sameMethodPayments.findIndex(sp => sp.date === p.date) + 1 : null;
                  
                  return (
                    <div key={idx} className="flex justify-between items-center group">
                      <div className="flex items-center gap-2">
                        <button onClick={() => removePayment(idx)} className="text-red-500 opacity-60 hover:opacity-100 transition-opacity">
                          <X size={12} />
                        </button>
                        <span className="text-[14px] shrink-0">{paymentIcons[p.method] || '📦'}</span>
                        <span className="text-xs font-black text-black">
                          {p.method} {methodIndex && `(${methodIndex})`}
                        </span>
                      </div>
                      <span className="text-xs font-black text-black">R$ {p.amount.toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="pt-4 space-y-2">
              {remainingValue > 0 && (
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-xs font-black uppercase tracking-widest">Falta</span>
                  <span className="text-xl font-black italic">R$ {remainingValue.toFixed(2)}</span>
                </div>
              )}
              {trocoCalculated > 0 && (
                <div className="flex justify-between items-center text-emerald-600">
                  <span className="text-xs font-black uppercase tracking-widest">Troco</span>
                  <span className="text-xl font-black italic">R$ {trocoCalculated.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => setCart([])}
              className="p-4 bg-white text-black rounded-2xl hover:bg-red-50 transition-all border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-y-0.5 active:translate-x-0.5"
            >
              <Trash2 size={24} />
            </button>
            <button 
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="flex-1 bg-[#5d5dff] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] hover:translate-x-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-30 disabled:translate-y-0 disabled:translate-x-0 disabled:shadow-none active:translate-y-0.5 active:translate-x-0.5"
            >
              Finalizar Venda
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & Post-Sale Modal */}
      <AnimatePresence>
        {checkoutPreview && (
          <ReceiptModal 
            sale={checkoutPreview}
            products={products}
            customers={customers}
            company={company}
            couponConfig={couponConfig}
            onClose={closeCheckout}
            onConfirm={confirmSale}
            isFinalized={isFinalized}
            imprimirCupom={imprimirCupom}
            imprimirPedidoPDV={imprimirPedidoPDV}
            onGoToSeparation={() => {
              closeCheckout();
              setView('separation');
            }}
            paymentIcons={paymentIcons}
          />
        )}
      </AnimatePresence>

      {/* Customer Modal */}
      <AnimatePresence>
        {showCustomerModal && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
               animate={{ scale: 1, y: 0 }} 
              className={`bg-white p-8 rounded-3xl w-full space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative border-4 border-black transition-all duration-300 ${isRegistering ? 'max-w-4xl' : 'max-w-lg'}`}
            >
              <button 
                onClick={() => setShowCustomerModal(false)}
                className="absolute top-4 right-4 text-black hover:text-red-600 transition-all hover:scale-110"
              >
                <X size={24} />
              </button>

              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-100 text-blue-600 border-4 border-black rounded-full flex items-center justify-center mx-auto mb-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <UserPlus size={32} />
                </div>
                <h4 className="text-xl font-black text-black uppercase tracking-widest">Vincular Cliente</h4>
                <p className="text-[10px] text-black opacity-60 font-black uppercase tracking-tight">Busque ou crie um novo cliente para esta venda.</p>
              </div>

              <div className="space-y-4">
                <div className="flex bg-zinc-50 p-1 rounded-2xl border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <button onClick={() => setIsRegistering(false)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${!isRegistering ? 'bg-black text-white' : 'text-black opacity-40 hover:opacity-100'}`}>Pesquisar</button>
                  <button onClick={() => setIsRegistering(true)} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${isRegistering ? 'bg-black text-white' : 'text-black opacity-40 hover:opacity-100'}`}>Novo Cliente</button>
                </div>

                {!isRegistering ? (
                  <>
                    <div className="relative">
                      <Search className="absolute left-4 top-4 text-black" size={20} />
                      <input 
                        placeholder="NOME, TELEFONE OU CPF..." 
                        className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border-4 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] font-black text-sm text-black placeholder:text-zinc-400 uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                        value={customerSearch}
                        onChange={e => setCustomerSearch(e.target.value)}
                      />
                    </div>
                    <div className="max-h-60 overflow-y-auto divide-y-2 divide-black border-4 border-black rounded-2xl bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      {filteredCustomers.length > 0 ? (
                        filteredCustomers.map(c => (
                          <button 
                            key={c.id} 
                            onClick={() => {
                              setSelectedCustomerId(c.id);
                              setShowCustomerModal(false);
                            }}
                            className="w-full p-4 text-left hover:bg-yellow-50 flex justify-between items-center group transition-colors"
                          >
                             <div className="min-w-0">
                               <p className="font-black text-black uppercase">{c.name}</p>
                               <p className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest">{c.whatsapp || 'SEM CONTATO'}</p>
                             </div>
                             <Check size={16} className="text-emerald-600 opacity-0 group-hover:opacity-100" />
                          </button>
                        ))
                      ) : (
                        <div className="p-8 text-center text-black opacity-20 italic text-[10px] font-black uppercase tracking-widest">
                          {customerSearch ? 'Cliente não encontrado' : 'Digite para pesquisar'}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="animate-in fade-in slide-in-from-bottom-2">
                    <CustomerForm 
                      initialData={{
                        name: '', email: '', whatsapp: '', dob: '', taxId: '', image: '',
                        address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '', complement: '' }
                      }}
                      gallery={gallery}
                      setGallery={setGallery}
                      onCancel={() => setIsRegistering(false)}
                      onSubmit={(customerData) => {
                        const uuid = crypto.randomUUID();
                        const newCust: Customer = {
                          id: uuid,
                          displayId: `PDV-${Math.floor(1000 + Math.random() * 9000)}`,
                          ...customerData,
                          debt: 0
                        };
                        setCustomers((prev: Customer[]) => [...prev, newCust]);
                        addActivity('customer', 'Atalho PDV', `Novo cliente ${customerData.name} cadastrado via PDV.`);
                        setSelectedCustomerId(uuid);
                        setShowCustomerModal(false);
                        setIsRegistering(false);
                      }}
                    />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Canais de Venda Modal */}
        {showChannelModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-[#FFDE2E] border-4 border-black p-8 rounded-[3rem] max-w-lg w-full space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] relative">
              <button 
                onClick={() => {
                  setShowChannelModal(false);
                  setEditingChannel(null);
                  setNewChannelName('');
                }} 
                className="absolute top-6 right-6 text-black hover:scale-110 transition-transform"
              >
                <X size={20} />
              </button>
              
              <div className="space-y-2">
                <h4 className="text-xl font-black text-black uppercase tracking-widest flex items-center gap-3">
                  <Link size={20} className="text-blue-600" /> Canais de Venda
                </h4>
                <p className="text-[10px] text-black opacity-60 font-black uppercase">Gerenciamento de origens de venda</p>
              </div>

              <div className="space-y-4">
                {canEdit && (
                  <div className="bg-white p-6 rounded-3xl border-4 border-black space-y-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <label className="text-[10px] font-black text-black opacity-40 uppercase tracking-widest ml-1">
                      {editingChannel ? 'Editar Canal' : 'Novo Canal'}
                    </label>
                    <div className="flex gap-2">
                      <input 
                        placeholder="EX: WHATSAPP, INSTAGRAM..." 
                        className="flex-1 p-4 bg-zinc-50 rounded-xl border-2 border-black outline-none focus:ring-4 focus:ring-[#FFDE2E] text-sm font-black uppercase transition-all text-black placeholder:text-zinc-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                        value={newChannelName}
                        onChange={e => setNewChannelName(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleSaveChannel()}
                      />
                      <button 
                        onClick={handleSaveChannel}
                        className="bg-black text-white p-4 rounded-xl hover:translate-y-[-2px] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)] transition-all active:translate-y-0 shadow-sm"
                      >
                        {editingChannel ? <Save size={20} /> : <Plus size={20} />}
                      </button>
                      {editingChannel && (
                        <button 
                          onClick={() => {
                            setEditingChannel(null);
                            setNewChannelName('');
                          }}
                          className="bg-white text-black p-4 rounded-xl border-2 border-black hover:bg-zinc-50 transition-all font-black"
                        >
                          <X size={20} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                  {deliveryChannels.map(c => (
                    <div key={c.id} className={`flex items-center justify-between p-4 border-2 rounded-2xl group transition-all ${selectedChannelId === c.id ? 'bg-black text-white border-black shadow-[4px_4px_0px_0px_rgba(255,255,255,0.2)]' : 'bg-white border-black hover:bg-zinc-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]'}`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border border-black/20 ${c.id === 'pdv' ? 'bg-emerald-500 text-white' : 'bg-zinc-100 text-black'}`}>
                           {c.name.substring(0, 2).toUpperCase()}
                        </div>
                        <p className="text-xs font-black uppercase tracking-tight">{c.name}</p>
                        {c.id === 'pdv' && (
                          <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-sm uppercase border ${selectedChannelId === c.id ? 'bg-white text-black border-white' : 'bg-black text-white border-black'}`}>Padrão</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {selectedChannelId !== c.id ? (
                          <button 
                            onClick={() => {
                              setSelectedChannelId(c.id);
                              setShowChannelModal(false);
                            }}
                            className="bg-black text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]"
                          >
                            Selecionar
                          </button>
                        ) : (
                          <div className="bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 border border-white/20">
                            <Check size={10} /> Selecionado
                          </div>
                        )}
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          {canEdit && (
                            <>
                              <button 
                                onClick={() => {
                                  setEditingChannel(c);
                                  setNewChannelName(c.name);
                                }}
                                className="p-2 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
                              >
                                <Pencil size={14} />
                              </button>
                              {(c.id !== 'pdv' && c.name.toUpperCase() !== 'PDV') && (
                                <button 
                                  onClick={() => handleDeleteChannel(c.id, c.name)}
                                  className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DeliveryView({ 
  sales, 
  deliveryChannels, 
  deliveryMethods,
  setDeliveryMethods,
  products, 
  customers,
  company,
  couponConfig,
  addActivity,
  setSales,
  imprimirCupom,
  imprimirPedidoPDV,
  canEdit,
  currentUser,
  paymentIcons
}: { 
  sales: Sale[], 
  deliveryChannels: DeliveryChannel[], 
  deliveryMethods: DeliveryMethod[],
  setDeliveryMethods: any,
  products: Product[],
  customers: Customer[],
  company: CompanyInfo,
  couponConfig: CouponConfig,
  addActivity: any,
  setSales: any,
  imprimirCupom: (saleOrHtml: Sale | string, customTitle?: string) => Promise<any>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  canEdit: boolean,
  currentUser: any | null,
  paymentIcons: Record<string, string>
}) {
  const [activeTab, setActiveTab] = useState<'pending' | 'shipping' | 'delivered'>('pending');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showMethodsModal, setShowMethodsModal] = useState(false);
  const [newMethodName, setNewMethodName] = useState('');

  const deliverySales = useMemo(() => {
    return sales
      .filter(s => {
        if (activeTab === 'pending') return ['pendente', 'em_separacao', 'separado', 'embalado'].includes(s.status || '');
        if (activeTab === 'shipping') return ['enviado', 'em_transporte'].includes(s.status || '');
        if (activeTab === 'delivered') return s.status === 'entregue';
        return false;
      })
      .sort((a, b) => b.date - a.date);
  }, [sales, activeTab]);

  const getDeliveryMethodName = (sale: Sale) => {
    if (sale.deliveryMethod) return sale.deliveryMethod;
    if (!sale.deliveryMethodId) return 'Não Definido';
    return deliveryMethods.find(m => m.id === sale.deliveryMethodId)?.name || 'Outros';
  };

  const handleAddMethod = (e: FormEvent) => {
    e.preventDefault();
    if (!newMethodName.trim()) return;
    const newMethod: DeliveryMethod = {
      id: crypto.randomUUID(),
      name: newMethodName.trim(),
      isActive: true,
      updatedAt: Date.now()
    };
    setDeliveryMethods([...deliveryMethods, newMethod]);
    setNewMethodName('');
  };

  const toggleMethodStatus = (id: string) => {
    const updatedAt = Date.now();
    const updated = deliveryMethods.map(m => m.id === id ? { ...m, isActive: !m.isActive, updatedAt } : m);
    setDeliveryMethods(updated);
  };

  const deleteMethod = (id: string, name: string) => {
    if (name.toUpperCase() === 'EM MÃOS') {
      return alert('O tipo de entrega padrão "Em mãos" não pode ser excluído.');
    }
    if (confirm(`Deseja excluir permanentemente o tipo "${name}"?`)) {
      setDeliveryMethods(deliveryMethods.filter(m => m.id !== id));
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex bg-zinc-950 p-1.5 rounded-[2rem] w-fit shadow-inner border border-zinc-800">
          {[
            { id: 'pending', label: 'Aguardando envio', color: 'text-amber-400', icon: <Package size={16} /> },
            { id: 'shipping', label: 'Em Transporte', color: 'text-blue-400', icon: <Truck size={16} /> },
            { id: 'delivered', label: 'Entregues', color: 'text-emerald-400', icon: <CheckCircle size={16} /> }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 md:px-8 py-3 md:py-4 rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 md:gap-3 ${activeTab === tab.id ? 'bg-zinc-800 shadow-xl ' + tab.color : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              {tab.icon}
              {tab.label}
              <span className={`ml-1 md:ml-2 px-2 py-0.5 rounded-full text-[8px] md:text-[9px] ${activeTab === tab.id ? 'bg-zinc-900 border border-zinc-700' : 'bg-zinc-950 text-zinc-700'}`}>
                {sales.filter(s => {
                  if (tab.id === 'pending') return ['pendente', 'em_separacao', 'separado', 'embalado'].includes(s.status || '');
                  if (tab.id === 'shipping') return ['enviado', 'em_transporte'].includes(s.status || '');
                  if (tab.id === 'delivered') return s.status === 'entregue';
                  return false;
                }).length}
              </span>
            </button>
          ))}
        </div>

        {canEdit && (
          <button 
            onClick={() => setShowMethodsModal(true)}
            className="flex items-center gap-3 px-6 py-4 bg-zinc-800 text-zinc-400 rounded-2xl border border-zinc-700 hover:bg-zinc-700 transition-all font-black text-[10px] uppercase tracking-widest active:scale-95 group"
          >
            <div className="p-2 bg-zinc-900 rounded-xl group-hover:bg-zinc-950 transition-colors">
              <Truck size={14} className="text-emerald-500" />
            </div>
            Tipos de Entrega
          </button>
        )}
      </div>

      <AnimatePresence>
        {showMethodsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 w-full max-w-lg rounded-[3rem] border border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <Truck size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-white uppercase tracking-widest leading-none">Gerenciar Entregas</h3>
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">Configure seus meios de envio</p>
                  </div>
                </div>
                <button onClick={() => setShowMethodsModal(false)} className="p-3 bg-zinc-800 text-zinc-500 rounded-xl hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                <form onSubmit={handleAddMethod} className="flex gap-2">
                  <div className="flex-1">
                    <Input 
                      label="Nome do Tipo" 
                      placeholder="EX: MOTOBOY PRÓPRIO" 
                      value={newMethodName} 
                      onChange={setNewMethodName} 
                    />
                  </div>
                  <button 
                    type="submit"
                    className="self-end p-4 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                  >
                    <Plus size={24} />
                  </button>
                </form>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Tipos Cadastrados</h4>
                  {deliveryMethods.length > 0 ? (
                    deliveryMethods.map(method => (
                      <div key={method.id} className="flex items-center justify-between p-4 bg-zinc-950 rounded-2xl border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                        <div className="flex items-center gap-3">
                           <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method.isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-800 text-zinc-600'}`}>
                             <Truck size={14} />
                           </div>
                           <span className={`text-xs font-black uppercase tracking-tight ${method.isActive ? 'text-zinc-100' : 'text-zinc-600'}`}>
                             {method.name}
                           </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {canEdit && (
                            <button 
                              onClick={() => toggleMethodStatus(method.id)}
                              className={`p-2 rounded-xl transition-all ${method.isActive ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-zinc-800 text-zinc-500 hover:bg-zinc-700'}`}
                              title={method.isActive ? 'Desativar' : 'Ativar'}
                            >
                              {method.isActive ? <Unlock size={14} /> : <Lock size={14} />}
                            </button>
                          )}
                          {canEdit && (
                            <button 
                              onClick={() => deleteMethod(method.id, method.name)}
                              className="p-2 text-zinc-600 hover:text-red-500 transition-colors"
                              title="Remover permanentemente"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-zinc-800 rounded-3xl">
                      <Truck size={32} className="mx-auto text-zinc-800 mb-4 opacity-50" />
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhum tipo cadastrado</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-8 bg-zinc-950/50 border-t border-zinc-800 flex justify-end">
                <button 
                  onClick={() => setShowMethodsModal(false)}
                  className="px-8 py-4 bg-zinc-800 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
                >
                  Concluir
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliverySales.length > 0 ? (
          deliverySales.map((sale) => {
            const customer = customers.find(c => c.id === sale.customerId);
            return (
              <div key={sale.id} className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 p-8 shadow-sm hover:shadow-xl hover:shadow-black/50 transition-all group flex flex-col h-full relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:opacity-10 transition-opacity text-zinc-500">
                   <Truck size={120} />
                </div>
                
                <div className="flex justify-between items-start mb-6">
                   <div>
                     <div className="flex items-center gap-2 mb-1">
                       <QrCode size={12} className="text-blue-400" />
                       <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest leading-none">#{sale.sequentialId || '00000'}</p>
                     </div>
                     <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">{new Date(sale.date).toLocaleDateString()} {new Date(sale.date).toLocaleTimeString().slice(0, 5)}</p>
                   </div>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setSelectedSale(sale)}
                       className="p-3 bg-zinc-800 text-zinc-500 rounded-2xl hover:bg-blue-500/10 hover:text-blue-400 transition-all border border-zinc-700"
                     >
                       <Receipt size={18} />
                     </button>
                   </div>
                </div>

                <div className="space-y-6 flex-1">
                   <div>
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 leading-none">Destinatário</p>
                      <h4 className="text-sm font-black text-zinc-100 uppercase">{customer?.name || 'Cliente de Balcão'}</h4>
                      <p className="text-xs font-bold text-zinc-500 mt-1">{customer?.phone || customer?.whatsapp || 'Sem Telefone'}</p>
                   </div>

                   <div className="p-5 bg-black/20 rounded-3xl border border-zinc-800 space-y-4">
                      <div className="flex items-start gap-3">
                         <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                            <MapPin size={16} />
                         </div>
                         <div className="min-w-0">
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 leading-none">Endereço</p>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase leading-relaxed line-clamp-3">
                               {customer?.address ? (
                                 `${customer.address.street}, ${customer.address.number}${customer.address.complement ? ` - ${customer.address.complement}` : ''}\n${customer.address.neighborhood}, ${customer.address.city}/${customer.address.state}\nCEP: ${customer.address.cep}`
                               ) : 'Endereço não cadastrado'}
                            </p>
                         </div>
                      </div>

                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-500 shrink-0">
                            <Truck size={16} />
                         </div>
                         <div>
                            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 leading-none">Tipo de Entrega</p>
                            <span className="text-[10px] font-black text-emerald-400 uppercase">
                               {getDeliveryMethodName(sale)}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>

                 <div className="pt-6 border-t border-zinc-800 mt-6">
                    {activeTab === 'pending' && (
                      <div className="flex items-center justify-center gap-2 text-zinc-500 bg-zinc-800/50 p-4 rounded-2xl border border-zinc-700/30">
                         <Package size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Aguardando Despacho</span>
                      </div>
                    )}
                    {activeTab === 'shipping' && (
                      <div className="flex items-center justify-center gap-2 text-blue-400 bg-blue-500/10 p-4 rounded-2xl border border-blue-900/30">
                         <Truck size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Pedido em Trânsito</span>
                      </div>
                    )}
                    {activeTab === 'delivered' && (
                      <div className="flex items-center justify-center gap-2 text-emerald-400 bg-emerald-500/10 p-4 rounded-2xl border border-emerald-900/30">
                         <CheckCircle size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest">Pedido Entregue</span>
                      </div>
                    )}
                 </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center">
             <div className="w-20 h-20 bg-zinc-900 text-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                {activeTab === 'pending' ? <Package size={32} /> : activeTab === 'shipping' ? <Truck size={32} /> : <CheckCircle size={32} />}
             </div>
             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Nenhum pedido nesta etapa</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedSale && (
          <ReceiptModal 
            sale={selectedSale} 
            products={products} 
            customers={customers}
            company={company}
            couponConfig={couponConfig}
            onClose={() => setSelectedSale(null)} 
            isFinalized={true}
            imprimirCupom={imprimirCupom}
            imprimirPedidoPDV={imprimirPedidoPDV}
            paymentIcons={paymentIcons}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
function CashierView({ 
  cashierSession,
  setCashierSession,
  sales,
  closedSessions,
  setClosedSessions,
  addActivity,
  users,
  couponConfig,
  imprimirCupom,
  canEdit,
  currentUser
}: { 
  cashierSession: CashierSession,
  setCashierSession: any,
  sales: Sale[],
  closedSessions: CashierSession[],
  setClosedSessions: any,
  addActivity: (type: Activity['type'], action: string, details: string, extra?: Partial<Activity>) => void,
  users: SystemUser[],
  couponConfig: CouponConfig,
  imprimirCupom: (sale: Sale | string) => Promise<boolean>,
  canEdit: boolean,
  currentUser: SystemUser | null
}) {
  const [openingBalanceInput, setOpeningBalanceInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [reportData, setReportData] = useState<CashierSession | null>(null);

  const handleOpenCashier = () => {
    const val = parseFloat(openingBalanceInput);
    if (isNaN(val)) return alert('Informe um valor válido.');
    
    const session: CashierSession = {
      id: crypto.randomUUID(),
      isOpen: true,
      openedAt: new Date().toLocaleString('pt-BR'),
      openingBalance: val,
      userId: currentUser?.id,
      userName: currentUser?.name,
      totalSales: 0,
      totalCanceled: 0,
      salesCount: 0,
      canceledCount: 0,
      salesByMethod: {},
      updatedAt: Date.now()
    };
    setCashierSession(session);
    addActivity('system', 'Caixa Aberto', `Saldo inicial: R$ ${val.toFixed(2)}.`);
  };

  const handlePrintReport = async () => {
    if (!reportData) return;
    
    const reportHtml = `
      <html>
        <head>
          <title>Fechamento de Caixa</title>
          <style>
            body { font-family: monospace; width: ${couponConfig.format === '58mm' ? '58mm' : '80mm'}; margin: 0; padding: 5mm; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 5px; margin-bottom: 10px; }
            .item { display: flex; justify-content: space-between; margin-bottom: 2px; }
            .total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h3>FECHAMENTO DE CAIXA</h3>
            <p>${reportData.closedAt}</p>
          </div>
          <div class="item"><span>INICIAL</span><span>R$ ${reportData.openingBalance.toFixed(2)}</span></div>
          <div class="item"><span>ENTRADAS</span><span>R$ ${reportData.totalSales.toFixed(2)}</span></div>
          ${Object.entries(reportData.salesByMethod).map(([method, amount]) => `
            <div class="item" style="padding-left: 10px; font-size: 10px;">
              <span>- ${method}</span><span>R$ ${(Number(amount) || 0).toFixed(2)}</span>
            </div>
          `).join('')}
          <div class="item"><span>REFORÇOS</span><span>R$ ${(reportData.reforsos || 0).toFixed(2)}</span></div>
          <div class="item"><span>SANGRIAS</span><span>R$ ${(reportData.sangrias || 0).toFixed(2)}</span></div>
          <div class="item"><span>SAIDAS/CANCEL</span><span>R$ ${reportData.totalCanceled.toFixed(2)}</span></div>
          <div class="total">
            <div class="item"><span>RESUMO FINAL</span><span>R$ ${((reportData.closingBalance ?? 0)).toFixed(2)}</span></div>
          </div>
        </body>
      </html>
    `;

    if (couponConfig.printMode === 'auto') {
      const handled = await imprimirCupom(reportHtml);
      if (handled) return;
    }
    
    window.print();
  };

  const handleCloseCashier = () => {
    const isMasterPassword = passwordInput === '1234';
    const user = users.find(u => u.password === passwordInput || (isMasterPassword && u.roleId === 'admin'));
    
    if (!isMasterPassword && !user) return alert('Senha inválida!');

    const userName = user?.name || 'Administrador';

    // Recalculate totals based on actual sales linked to this session
    const sessionSales = sales.filter(s => s.cashierSessionId === cashierSession.id && s.status !== 'cancelado');
    const totalSalesCalculated = sessionSales.reduce((acc, s) => acc + s.total, 0);
    const salesCountCalculated = sessionSales.length;
    
    // Group sales by method
    const salesByMethodCalculated = sessionSales.reduce((acc, s) => {
      acc[s.paymentMethod] = (acc[s.paymentMethod] || 0) + s.total;
      return acc;
    }, {} as Record<string, number>);

    const canceledSales = sales.filter(s => s.cashierSessionId === cashierSession.id && s.status === 'cancelado');
    const totalCanceledCalculated = canceledSales.reduce((acc, s) => acc + s.total, 0);
    const canceledCountCalculated = canceledSales.length;

    const closedSession: CashierSession = {
      ...cashierSession,
      isOpen: false,
      userId: user?.id,
      userName: userName,
      closedAt: new Date().toLocaleString('pt-BR'),
      totalSales: totalSalesCalculated,
      salesCount: salesCountCalculated,
      salesByMethod: salesByMethodCalculated,
      totalCanceled: totalCanceledCalculated,
      canceledCount: canceledCountCalculated,
      closingBalance: cashierSession.openingBalance + totalSalesCalculated - (cashierSession.sangrias || 0) + (cashierSession.reforsos || 0),
      updatedAt: Date.now()
    };
    
    setReportData(closedSession);
    setClosedSessions((prev: CashierSession[]) => [...prev, closedSession]);
    setCashierSession({
      id: '', isOpen: false, openedAt: '', openingBalance: 0, totalSales: 0, totalCanceled: 0, salesCount: 0, canceledCount: 0, salesByMethod: {}, reforsos: 0, sangrias: 0, estornos: 0, descontos: 0, acrescimos: 0, taxaEntrega: 0
    });
    // This resets the current session, in DB we also need to mark as closed or just leave the closedSession as the synced one.
    // Usually we sync the finished session.

    addActivity('system', 'Caixa Fechado', `Fechado por ${userName}. Saldo final: R$ ${closedSession.closingBalance?.toFixed(2)}.`);
    setShowCloseConfirm(false);
    setPasswordInput('');
  };

  if (reportData) {
    return (
      <div className="max-w-md mx-auto bg-zinc-950 p-8 rounded-3xl border border-zinc-800 shadow-xl space-y-6 animate-in fade-in zoom-in-95 duration-500 font-mono text-zinc-100">
        <div className="text-center space-y-1 relative">
          <button onClick={() => setReportData(null)} className="absolute -top-4 -right-4 bg-zinc-900 text-zinc-500 p-2 rounded-full hover:text-red-500 shadow-sm border border-zinc-800"><X size={16} /></button>
          <h3 className="text-lg font-black uppercase tracking-widest border-b border-zinc-800 pb-2 mb-4">Fechamento do Caixa</h3>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-1 text-[9px] border-b border-zinc-800 pb-4">
            <div className="flex justify-between"><span>ABERTURA:</span><span className="font-bold">{reportData.openedAt}</span></div>
            <div className="flex justify-between"><span>FECHAMENTO:</span><span className="font-bold">{reportData.closedAt}</span></div>
            <div className="flex justify-between"><span>ID SESSÃO:</span><span className="font-bold">#{reportData.id.substring(0, 8).toUpperCase()}</span></div>
          </div>

          <div className="space-y-2 pt-2 text-[10px]">
            <div className="flex justify-between font-bold"><span>(+) SALDO INICIAL</span><span>R$ {reportData.openingBalance.toFixed(2)}</span></div>
            
            <div className="border-t border-zinc-900 my-2"></div>
            
            <div className="flex justify-between font-bold text-emerald-400"><span>(+) TOTAL ENTRADAS</span><span>R$ {reportData.totalSales.toFixed(2)}</span></div>
            
            {/* Payment methods detail - grouping for clearer report */}
            <div className="pl-4 space-y-1">
              {Object.entries(reportData.salesByMethod).map(([method, amount]) => (
                <div key={method} className="flex justify-between text-[9px] text-zinc-500 uppercase italic">
                  <span>- {method}</span>
                  <span>R$ {(Number(amount) || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
            
            {reportData.reforsos ? (
              <div className="flex justify-between"><span>(+) REFORÇOS</span><span>R$ {reportData.reforsos.toFixed(2)}</span></div>
            ) : null}

            <div className="border-t border-zinc-900 my-2"></div>

            <div className="flex justify-between text-red-500"><span>(-) SANGRIAS</span><span>R$ {(reportData.sangrias || 0).toFixed(2)}</span></div>
            <div className="flex justify-between text-red-500"><span>(-) ESTORNOS/CANCEL</span><span>R$ {(reportData.totalCanceled || 0).toFixed(2)}</span></div>
          </div>

          <div className="flex justify-between pt-6 border-t border-zinc-700 font-black text-lg text-blue-400 bg-zinc-900/50 p-2 rounded-xl">
            <span>RESUMO FINAL</span>
            <span>R$ {reportData.closingBalance?.toFixed(2)}</span>
          </div>

          <div className="pt-4 text-center border-t border-dashed border-zinc-800">
             <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{reportData.salesCount} Vendas Processadas</p>
          </div>
        </div>

        <div className="text-center">
          <p className="text-[8px] font-black uppercase text-zinc-700 tracking-widest mb-2 italic">Formato: {couponConfig.format}</p>
        </div>

        <div className="flex gap-4 pt-4 no-print">
          <button onClick={handlePrintReport} className="flex-1 bg-zinc-900 text-zinc-100 p-4 rounded-2xl font-black text-[10px] uppercase border border-zinc-800 flex items-center justify-center gap-2 shadow-sm hover:bg-zinc-800"><Printer size={16} /> Imprimir</button>
          <button onClick={() => setReportData(null)} className="flex-1 bg-blue-600 text-white p-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20">Sair</button>
        </div>
      </div>
    );
  }

  if (!cashierSession.isOpen) {
    return (
      <div className="max-w-md mx-auto bg-zinc-900 p-10 rounded-3xl border border-zinc-800 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto text-blue-400"><Unlock size={32} /></div>
          <div><h3 className="text-xl font-black text-zinc-100 uppercase tracking-widest">Abrir Caixa</h3><p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Sessão Financeira</p></div>
        </div>
        <div className="space-y-6">
          <div className="relative">
            <Input 
              label="Valor Inicial em Caixa" 
              value={openingBalanceInput} 
              onChange={setOpeningBalanceInput} 
              placeholder="0,00"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canEdit) handleOpenCashier();
              }}
            />
          </div>
          {canEdit ? (
            <button onClick={handleOpenCashier} className="w-full bg-[#5d5dff] text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"><Zap size={16} fill="white" /> Iniciar Sessão</button>
          ) : (
            <div className="w-full bg-zinc-800 text-zinc-500 p-5 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center border border-zinc-700">Acesso Restrito para Abertura</div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-sm space-y-6">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Status da Sessão</p>
             <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /><span className="text-lg font-black text-zinc-100 uppercase tracking-tighter">Caixa Aberto</span></div>
          </div>
          <Lock size={24} className="text-green-500" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 border-y border-zinc-800 py-6 text-center">
          <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Aberto em</p><p className="text-xs font-black text-zinc-100">{cashierSession.openedAt}</p></div>
          <div><p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saldo Inicial</p><p className="text-xs font-black text-zinc-100">R$ {cashierSession.openingBalance.toFixed(2)}</p></div>
        </div>

        <div className="space-y-4">
           <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Vendas Acumuladas</span><span className="text-lg font-black text-emerald-500 tracking-tighter">R$ {cashierSession.totalSales.toFixed(2)}</span></div>
           <div className="flex justify-between items-center"><span className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Cancelamentos</span><span className="text-lg font-black text-red-500 tracking-tighter">- R$ {cashierSession.totalCanceled.toFixed(2)}</span></div>
        </div>

        {canEdit && (
          <button onClick={() => setShowCloseConfirm(true)} className="w-full bg-red-500/10 text-red-500 p-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-red-900/30 hover:bg-red-500/20 transition-all flex items-center justify-center gap-2">
            <Lock size={16} /> Encerrar Sessão
          </button>
        )}
      </div>

      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 p-8 rounded-3xl max-w-sm w-full space-y-6 shadow-2xl border border-zinc-800">
              <div className="text-center"><Trash2 size={48} className="text-red-500 mx-auto mb-4" /><h4 className="text-lg font-black text-zinc-100 uppercase tracking-widest">Fechar Caixa</h4><p className="text-xs text-zinc-500 font-bold mt-2">Insira sua senha para confirmar o fechamento.</p></div>
              <div className="space-y-4"><Input label="Senha" value={passwordInput} onChange={setPasswordInput} type="password" placeholder="****" /><div className="flex gap-3"><button onClick={() => setShowCloseConfirm(false)} className="flex-1 p-4 rounded-2xl bg-zinc-800 text-zinc-500 font-black text-[10px] uppercase">Cancelar</button><button onClick={handleCloseCashier} className="flex-1 p-4 rounded-2xl bg-red-600 text-white font-black text-[10px] uppercase shadow-lg shadow-red-500/20">CONFIRMAR</button></div></div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CashierHistoryView({ 
  closedSessions, 
  imprimirCupom, 
  couponConfig,
  canEdit
}: { 
  closedSessions: CashierSession[], 
  imprimirCupom: (s: string) => Promise<boolean>, 
  couponConfig: CouponConfig,
  canEdit: boolean
}) {
  const [selectedSession, setSelectedSession] = useState<CashierSession | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredSessions = useMemo(() => {
    return closedSessions
      .filter(s => 
        s.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.closedAt?.includes(searchTerm)
      )
      .sort((a, b) => {
        // Simple date comparison for pt-BR string "DD/MM/YYYY, HH:MM:SS"
        const parseDate = (d?: string) => {
          if (!d) return 0;
          try {
            const [datePart, timePart] = d.split(', ');
            const [day, month, year] = datePart.split('/');
            return new Date(`${year}-${month}-${day}T${timePart}`).getTime();
          } catch { return 0; }
        };
        return parseDate(b.closedAt) - parseDate(a.closedAt);
      });
  }, [closedSessions, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-zinc-100 uppercase tracking-widest">Histórico de Caixas</h2>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tight">Visualize o registro de todos os fechamentos realizados</p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="BUSCAR POR USUÁRIO OU DATA..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-zinc-950 border border-zinc-800 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 text-[10px] font-black uppercase tracking-widest transition-all text-zinc-100 placeholder:text-zinc-700"
          />
        </div>
      </div>

      <div className="bg-zinc-900 rounded-[2.5rem] border border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-950/50 border-b border-zinc-800 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <th className="px-8 py-5">Sessão / Data</th>
                <th className="px-8 py-5">Usuário</th>
                <th className="px-8 py-5 text-right">Saldo Final</th>
                <th className="px-8 py-5 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Calculator size={20} />
                       </div>
                       <div>
                         <p className="text-[10px] font-black text-zinc-100 uppercase">#{session.id.substring(0, 8)}</p>
                         <p className="text-[9px] font-bold text-zinc-500 uppercase">{session.closedAt}</p>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-950 px-3 py-1.5 rounded-full inline-flex items-center gap-2 border border-zinc-800">
                      <User size={12} className="text-zinc-600" />
                      {session.userName || 'ADMINISTRADOR'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <p className="text-sm font-black text-zinc-100 tracking-tighter">R$ {session.closingBalance?.toFixed(2)}</p>
                    <p className="text-[9px] font-bold text-emerald-500 uppercase">Vendas: R$ {session.totalSales.toFixed(2)}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex justify-center gap-2">
                       <button 
                         onClick={() => setSelectedSession(session)}
                         className="p-3 bg-zinc-950 border border-zinc-800 text-zinc-500 rounded-xl hover:bg-zinc-800 hover:text-amber-400 transition-all shadow-sm group-hover:border-zinc-700 flex items-center gap-2"
                         title="Ver Relatório"
                       >
                         <Receipt size={18} />
                         <span className="text-[10px] font-black uppercase tracking-widest px-1">Ver</span>
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredSessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-4 opacity-20">
                      <History size={64} className="text-zinc-400" />
                      <p className="text-sm font-black text-zinc-400 uppercase tracking-[0.2em]">Nenhuma sessão concluída</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedSession && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-zinc-900 w-full max-w-lg rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-zinc-800"
            >
              <div className="p-8 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/50">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-900/40">
                      <Receipt size={24} />
                   </div>
                   <div>
                     <h3 className="text-sm font-black text-zinc-100 uppercase tracking-widest">Relatório de Fechamento</h3>
                     <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-tight">Sessão #{selectedSession.id.substring(0, 8)}</p>
                   </div>
                </div>
                <button 
                  onClick={() => setSelectedSession(null)}
                  className="p-3 hover:bg-zinc-800 rounded-2xl transition-all text-zinc-500 hover:text-zinc-100 shadow-sm"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 bg-zinc-950/30 no-scrollbar">
                 <div className="bg-zinc-900 p-8 rounded-[2rem] border border-zinc-800 shadow-sm space-y-6 text-zinc-100 font-mono">
                    <div className="text-center space-y-2 border-b border-dashed border-zinc-800 pb-6 mb-6">
                       <h4 className="text-lg font-black uppercase text-zinc-100">Resumo da Movimentação</h4>
                       <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Operador: {selectedSession.userName || 'ADMINISTRADOR'}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-1 text-[9px] border-b border-zinc-800 pb-4">
                        <div className="flex justify-between"><span>ABERTURA:</span><span className="font-bold">{selectedSession.openedAt}</span></div>
                        <div className="flex justify-between"><span>FECHAMENTO:</span><span className="font-bold">{selectedSession.closedAt}</span></div>
                        <div className="flex justify-between"><span>SESSÃO ID:</span><span className="font-bold uppercase">#{selectedSession.id.substring(0, 8)}</span></div>
                      </div>

                      <div className="space-y-2 pt-2 text-[10px]">
                        <div className="flex justify-between font-bold"><span>(+) SALDO INICIAL</span><span>R$ {selectedSession.openingBalance.toFixed(2)}</span></div>
                        
                        <div className="border-t border-zinc-800 my-2"></div>
                        
                        <div className="flex justify-between font-bold text-emerald-400"><span>(+) TOTAL ENTRADAS</span><span>R$ {selectedSession.totalSales.toFixed(2)}</span></div>
                        
                        <div className="pl-4 space-y-1">
                          {Object.entries(selectedSession.salesByMethod || {}).map(([method, amount]) => (
                            <div key={method} className="flex justify-between text-[9px] text-zinc-500 uppercase italic">
                              <span>- {method}</span>
                              <span>R$ {(Number(amount) || 0).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                        
                        {selectedSession.reforsos ? (
                          <div className="flex justify-between"><span>(+) REFORÇOS</span><span>R$ {selectedSession.reforsos.toFixed(2)}</span></div>
                        ) : null}

                        <div className="border-t border-zinc-800 my-2"></div>

                        <div className="flex justify-between text-red-500"><span>(-) SANGRIAS</span><span>R$ {(selectedSession.sangrias || 0).toFixed(2)}</span></div>
                        <div className="flex justify-between text-red-500"><span>(-) ESTORNOS/CANCEL</span><span>R$ {(selectedSession.totalCanceled || 0).toFixed(2)}</span></div>
                      </div>

                      <div className="flex justify-between pt-6 border-t border-zinc-700 font-black text-lg text-blue-400 bg-zinc-950/50 p-2 rounded-xl">
                        <span>RESUMO FINAL</span>
                        <span>R$ {selectedSession.closingBalance?.toFixed(2)}</span>
                      </div>

                      <div className="pt-4 text-center border-t border-dashed border-zinc-800">
                         <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">{selectedSession.salesCount} Vendas Processadas</p>
                      </div>
                    </div>
                 </div>
              </div>

              <div className="p-6 bg-zinc-950/50 border-t border-zinc-800 flex gap-4">
                 <button onClick={() => setSelectedSession(null)} className="flex-1 py-4 rounded-2xl bg-zinc-800 text-zinc-100 font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all">Sair</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SeparadorScanner({ onScan, onClose, id = "reader-separador" }: { onScan: (text: string) => void, onClose: () => void, id?: string }) {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScanTime = useRef<number>(0);

  const handleScan = (text: string) => {
    const now = Date.now();
    if (now - lastScanTime.current < 2000) return; // Cooldown of 2s
    lastScanTime.current = now;
    
    playScanFeedback();
    onScan(text);
  };

  const startCamera = async () => {
    try {
      setPermissionError(null);
      setIsCameraActive(true);
      
      // Wait for the div to be rendered
      setTimeout(async () => {
        try {
          if (!scannerRef.current) {
            scannerRef.current = new Html5Qrcode(id);
          }
          
          await scannerRef.current.start(
            { facingMode: "environment" },
            { fps: 15, qrbox: { width: 250, height: 250 } },
            handleScan,
            () => {}
          );
        } catch (innerErr: any) {
          setIsCameraActive(false);
          const errStr = innerErr.toString();
          if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
            setPermissionError("Permissão de câmera necessária para escanear o pedido. Verifique as configurações do seu navegador.");
          } else {
            console.error("Camera error:", innerErr);
            setPermissionError("Não foi possível acessar a câmera. Verifique se ela está sendo usada por outro app ou tente recarregar a página.");
          }
        }
      }, 100);
    } catch (err: any) {
      console.error("Camera error:", err);
      setIsCameraActive(false);
    }
  };

  const scanFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError(null);
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(id);
      }
      const result = await scannerRef.current.scanFile(file, true);
      handleScan(result);
    } catch (err) {
      console.error("File scan error:", err);
      setFileError("QR Code inválido ou não reconhecido");
      setTimeout(() => setFileError(null), 3000);
    }
  };

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  return (
    <div className="w-full flex flex-col items-center">
      {/* Hidden/Active scanner container */}
      <div 
        className={`${isCameraActive ? 'relative w-full aspect-square bg-black rounded-[2.5rem] overflow-hidden shadow-2xl mb-4' : 'hidden'}`}
      >
        <div id={id} className="w-full h-full" />
        
        {/* Target area overlay */}
        <div className="absolute inset-0 z-10 pointer-events-none flex flex-col items-center justify-center">
          {/* Scrim with focus hole */}
          <div className="absolute inset-0 bg-black/40 shadow-[inset_0_0_0_1000px_rgba(0,0,0,0.5)]" />
          
          {/* Focus lines */}
          <div className="relative w-[250px] max-w-[70%] aspect-square border-2 border-white/20 rounded-3xl">
             {/* Corners */}
             <div className="absolute -top-1 -left-1 w-10 h-10 border-t-4 border-l-4 border-sky-400 rounded-tl-2xl" />
             <div className="absolute -top-1 -right-1 w-10 h-10 border-t-4 border-r-4 border-sky-400 rounded-tr-2xl" />
             <div className="absolute -bottom-1 -left-1 w-10 h-10 border-b-4 border-l-4 border-sky-400 rounded-bl-2xl" />
             <div className="absolute -bottom-1 -right-1 w-10 h-10 border-b-4 border-r-4 border-sky-400 rounded-br-2xl" />
             
             {/* Scanning line animation */}
             <motion.div 
               animate={{ top: ['10%', '90%'] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
               className="absolute left-2 right-2 h-1 bg-sky-400/50 shadow-[0_0_20px_rgba(56,189,248,0.8)] rounded-full"
             />
          </div>

          <div className="mt-8 px-6 py-3 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
            <p className="text-white/90 font-black text-[10px] uppercase tracking-[0.2em] text-center">
              Aponte a câmera para o QR Code
            </p>
          </div>
        </div>

        <button 
          onClick={() => {
            if (scannerRef.current?.isScanning) {
              scannerRef.current.stop().then(() => setIsCameraActive(false)).catch(() => setIsCameraActive(false));
            } else {
              setIsCameraActive(false);
            }
          }}
          className="absolute top-6 right-6 z-20 p-3 bg-black/50 text-white rounded-2xl backdrop-blur-md border border-white/10 hover:bg-black/70 transition-all shadow-xl active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {!isCameraActive && (
        <div className="flex flex-col items-center justify-center space-y-6 pt-2 pb-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center w-full mb-2">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-sky-50 rounded-2xl flex items-center justify-center text-sky-500 border border-sky-100/50">
                  <QrCode size={24} />
                </div>
                <div className="text-left">
                  <h4 className="text-sm font-black text-zinc-900 uppercase tracking-tighter">Escanear QR Code</h4>
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Aponte a câmera ou suba uma foto</p>
                </div>
             </div>
             <button onClick={onClose} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                <X size={24} />
             </button>
          </div>

          <div className="flex flex-col w-full gap-3">
            <button 
              onClick={startCamera}
              className="w-full flex items-center justify-center gap-2 bg-[#1A1A1A] text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" /> Abrir Câmera
            </button>
            
            <label className="w-full flex items-center justify-center gap-2 bg-white text-[#1A1A1A] py-5 rounded-2xl font-black text-xs uppercase tracking-widest border border-[#E5E1D8] cursor-pointer hover:bg-zinc-50 transition-all shadow-sm active:scale-[0.98]">
              <ImageIcon size={18} /> Selecionar Imagem
              <input type="file" accept="image/*" className="hidden" onChange={scanFile} />
            </label>
          </div>

          {permissionError && (
            <div className="flex items-center gap-2 text-red-500 bg-red-50 px-4 py-3 rounded-xl border border-red-100 animate-in fade-in zoom-in duration-300 w-full">
               <AlertCircle size={14} className="shrink-0" />
               <p className="text-[9px] font-black uppercase tracking-tight leading-tight">{permissionError}</p>
            </div>
          )}

          {fileError && (
            <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-4 py-3 rounded-xl border border-amber-100 animate-in fade-in zoom-in duration-300 w-full">
               <AlertTriangle size={14} className="shrink-0" />
               <p className="text-[9px] font-black uppercase tracking-tight leading-tight">{fileError}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ConsultarPedidoView({ 
  sales, 
  products, 
  customers, 
  company, 
  couponConfig, 
  imprimirCupom,
  currentUser,
  paymentIcons
}: { 
  sales: Sale[], 
  products: Product[], 
  customers: Customer[], 
  company: CompanyInfo, 
  couponConfig: CouponConfig, 
  imprimirCupom: (sale: Sale) => Promise<any>,
  currentUser: any | null,
  paymentIcons: Record<string, string>
}) {
  const [orderId, setOrderId] = useState('');
  const [foundSale, setFoundSale] = useState<Sale | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const handleSearch = (id?: string) => {
    const searchId = id || orderId;
    if (!searchId) return;
    const sale = sales.find(s => s.id === searchId || s.sequentialId === searchId);
    if (sale) {
      setFoundSale(sale);
      setOrderId('');
    } else {
      alert('Pedido não encontrado!');
      setFoundSale(null);
    }
  };

  const onScanSuccess = (decodedText: string) => {
    handleSearch(decodedText);
    setShowScanner(false);
  };

  const customer = customers.find(c => c.id === foundSale?.customerId);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center py-10 max-w-2xl mx-auto w-full">
      <div className="w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-sky-500/10 text-sky-500 rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
            <Search size={32} />
          </div>
          <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">Consultar Pedido</h3>
          <p className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-[0.2em]">Busque por número ou QR Code</p>
        </div>

        <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1A1]" size={18} />
              <input 
                type="text" 
                placeholder="NÚMERO DO PEDIDO"
                value={orderId}
                onChange={e => setOrderId(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-5 bg-[#FDFCF9] rounded-2xl border border-[#E5E1D8] outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm font-black uppercase tracking-widest placeholder:text-zinc-300"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 h-full">
              <button 
                onClick={() => handleSearch()}
                className="bg-[#1A1A1A] text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
              >
                Consultar
              </button>
              <button 
                onClick={() => setShowScanner(true)}
                className="bg-white text-[#1A1A1A] p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-[#E5E1D8] hover:bg-[#F5F2ED] transition-all flex items-center justify-center gap-2"
              >
                <QrCode size={18} /> LER QR
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {foundSale && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }} 
              animate={{ opacity: 1, y: 0 }} 
              className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-2xl w-full space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 blur-3xl -mr-24 -mt-24" />
              
              <div className="flex justify-between items-start relative z-10">
                <div>
                  <span className="text-[10px] font-black bg-[#FDFCF9] text-[#A1A1A1] border border-[#E5E1D8] px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">PEDIDO #{foundSale.sequentialId}</span>
                  <h4 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">{customer?.name || 'Cliente Casual'}</h4>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${foundSale.status === 'entregue' ? 'bg-emerald-500' : foundSale.status === 'cancelado' ? 'bg-red-500' : 'bg-amber-500'}`} />
                    <p className="text-[10px] text-[#A1A1A1] font-black uppercase tracking-widest">Status: {foundSale.status?.replace('_', ' ')}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => imprimirCupom(foundSale)}
                    className="bg-[#5d5dff] text-white p-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-600 transition-all flex items-center gap-2"
                  >
                    <Printer size={16} /> Imprimir Cupom
                  </button>
                  <button onClick={() => setFoundSale(null)} className="p-4 bg-[#FDFCF9] text-[#A1A1A1] rounded-2xl border border-[#E5E1D8] hover:text-red-500">
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-4">
                  <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] border-l-2 border-sky-500 pl-3">Itens do Pedido</h5>
                  <div className="bg-[#FDFCF9] rounded-3xl border border-[#E5E1D8]/50 overflow-hidden">
                    {foundSale.items.map((item, idx) => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={idx} className="p-4 border-b border-[#E5E1D8]/30 last:border-0 flex justify-between items-center bg-white/50">
                          <div>
                            <p className="text-xs font-bold text-[#1A1A1A] uppercase">{product?.name || 'Produto'}</p>
                            <p className="text-[10px] text-[#A1A1A1] font-medium">UN: R$ {item.price.toFixed(2)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-black text-[#1A1A1A]">X {item.quantity}</p>
                            <p className="text-xs font-black text-[#5d5dff]">R$ {(item.price * item.quantity).toFixed(2)}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div className="p-5 bg-[#1A1A1A] text-white flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest">Valor Total</span>
                      <span className="text-xl font-black">R$ {foundSale.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] border-l-2 border-[#5d5dff] pl-3">Informações da Venda</h5>
                    <div className="bg-[#FDFCF9] p-5 rounded-3xl border border-[#E5E1D8]/50 space-y-4">
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Vendedor</span>
                        <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{foundSale.soldByUserName || '---'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Pagamento</span>
                        <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{foundSale.paymentMethod}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase">Data/Hora</span>
                        <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{new Date(foundSale.date).toLocaleString('pt-BR')}</span>
                      </div>
                      {foundSale.startedSeparationAt && (
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Início Separação</span>
                          <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{new Date(foundSale.startedSeparationAt).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {foundSale.separatedByAt && (
                        <div className="flex justify-between">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase">Fim Separação</span>
                          <span className="text-[10px] font-black text-[#1A1A1A] uppercase">{new Date(foundSale.separatedByAt).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {customer && (
                    <div className="space-y-3">
                      <h5 className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.3em] border-l-2 border-emerald-500 pl-3">Dados de Entrega</h5>
                      <div className="bg-[#FDFCF9] p-5 rounded-3xl border border-[#E5E1D8]/50">
                        <p className="text-[10px] font-black text-[#1A1A1A] uppercase mb-1">{customer.name}</p>
                        <p className="text-[10px] text-zinc-500 font-bold uppercase">{customer.whatsapp}</p>
                        {customer.address && (
                          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-2 leading-relaxed">
                            {customer.address.street}, {customer.address.number}<br />
                            {customer.address.neighborhood} - {customer.address.city}/{customer.address.state}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* QR Scanner Modal */}
        <AnimatePresence>
          {showScanner && (
            <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white p-6 md:p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl space-y-6"
               >
                  <SeparadorScanner id="reader-search" onScan={onScanSuccess} onClose={() => setShowScanner(false)} />
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SeparationView({ 
  sales, 
  setSales, 
  products, 
  setProducts, 
  addActivity,
  customers,
  deliveryChannels,
  deliveryMethods,
  revenues,
  setRevenues,
  currentUser,
  imprimirCupom,
  imprimirPedidoPDV,
  setIsScanning,
  canEdit
}: { 
  sales: Sale[], 
  setSales: any, 
  products: Product[], 
  setProducts: any, 
  addActivity: any,
  customers: Customer[],
  deliveryChannels: DeliveryChannel[],
  deliveryMethods: DeliveryMethod[],
  revenues: Revenue[],
  setRevenues: any,
  currentUser: SystemUser | null,
  imprimirCupom: (sale: Sale, customTitle?: string) => Promise<any>,
  imprimirPedidoPDV: (sale: Sale) => Promise<boolean>,
  setIsScanning: (val: boolean) => void,
  canEdit: boolean
}) {
  const [activeTab, setActiveTab] = useState<'pendente' | 'em_separacao' | 'separado' | 'embalado' | 'enviado' | 'entregue'>('pendente');
  const [scanningSaleId, setScanningSaleId] = useState<string | null>(null);
  const [startingSaleId, setStartingSaleId] = useState<string | null>(null);
  const [finishingSaleId, setFinishingSaleId] = useState<string | null>(null);
  const [cancelingSaleId, setCancelingSaleId] = useState<string | null>(null);
  const [scannedItems, setScannedItems] = useState<{ productId: string, quantity: number }[]>([]);
  const [scanInput, setScanInput] = useState('');
  const [manualQty, setManualQty] = useState('1');
  const [scanError, setScanError] = useState<string | null>(null);
  const scanInputRef = useRef<HTMLInputElement>(null);
  
  const [editingSaleId, setEditingSaleId] = useState<string | null>(null);
  const [shippingModalSaleId, setShippingModalSaleId] = useState<string | null>(null);
  
  const isSeparador = currentUser?.roleId === 'role-separador';
  const [showScanner, setShowScanner] = useState(false);
  const [foundSaleId, setFoundSaleId] = useState<string | null>(null);
  
  const [shippingInfo, setShippingInfo] = useState({ trackingCode: '', deliveryChannelId: '', deliveryMethodId: '' });

  const prevChannelId = useRef(shippingInfo.deliveryChannelId);

  useEffect(() => {
    if (prevChannelId.current !== shippingInfo.deliveryChannelId) {
       const channel = deliveryChannels.find(c => c.id === shippingInfo.deliveryChannelId);
       if (channel?.name.toUpperCase() === 'PDV') {
          const handsMethod = deliveryMethods.find(m => m.name.toUpperCase() === 'EM MÃOS');
          setShippingInfo(prev => ({ ...prev, deliveryMethodId: handsMethod?.id || prev.deliveryMethodId }));
       }
       prevChannelId.current = shippingInfo.deliveryChannelId;
    }
  }, [shippingInfo.deliveryChannelId, deliveryChannels, deliveryMethods]);

  const isPdvChannel = useMemo(() => {
    const channel = deliveryChannels.find(c => c.id === shippingInfo.deliveryChannelId);
    return channel?.name.toUpperCase() === 'PDV';
  }, [shippingInfo.deliveryChannelId, deliveryChannels]);
  const [lastScannedProduct, setLastScannedProduct] = useState<Product | null>(null);
  const [orderSearch, setOrderSearch] = useState('');
  
  const formatLocation = (p?: Product) => {
    if (!p) return null;
    const parts = [];
    if (p.locationRow) parts.push(p.locationRow);
    if (p.locationShelf) parts.push(p.locationShelf);
    if (p.locationDrawer) parts.push(p.locationDrawer);
    return parts.length > 0 ? parts.join('-') : null;
  };

  const handleOrderSearch = (e: FormEvent) => {
    e.preventDefault();
    const cleanSearch = orderSearch.trim();
    if (!cleanSearch) return;

    // Search by sequentialId (padded or not) or ID
    const sale = sales.find(s => 
      s.sequentialId === cleanSearch || 
      (s.sequentialId && parseInt(s.sequentialId) === parseInt(cleanSearch)) ||
      s.id.startsWith(cleanSearch)
    );

    if (sale) {
      if (sale.status === 'cancelado') {
        alert('Este pedido foi cancelado!');
      } else {
        if (isSeparador) {
          setFoundSaleId(sale.id);
          setOrderSearch('');
        } else {
          startSeparation(sale.id);
          setOrderSearch('');
        }
      }
    } else {
      alert('Pedido não encontrado!');
    }
  };

  const handleQRScanSuccess = (decodedText: string) => {
    // Assuming the QR contains the Order ID
    const sale = sales.find(s => s.id === decodedText || s.sequentialId === decodedText);
    if (sale) {
      setFoundSaleId(sale.id);
      setShowScanner(false);
    } else {
      alert('Pedido não encontrado no QR Code! Texto lido: ' + decodedText);
      setShowScanner(false);
    }
  };

  useEffect(() => {
    setIsScanning(!!scanningSaleId);
    return () => setIsScanning(false);
  }, [scanningSaleId, setIsScanning]);

  useEffect(() => {
    if (lastScannedProduct) {
      const timer = setTimeout(() => {
        setLastScannedProduct(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [lastScannedProduct]);

  useEffect(() => {
    if (scanningSaleId && !scanError) {
      const timer = setTimeout(() => {
        scanInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [scanningSaleId, scanError]);

  const filteredSales = sales.filter(s => {
    const sStatus = s.status || 'pendente';
    if (activeTab === 'separado') return sStatus === 'separado' || sStatus === 'falta_confirmada';
    return sStatus === activeTab;
  });

  // Status flow mapping
  const nextStatusMap: Record<string, Sale['status']> = {
    'pendente': 'em_separacao',
    'em_separacao': 'separado',
    'separado': 'embalado',
    'embalado': 'enviado',
    'enviado': 'entregue'
  };

  const handleStatusUpdate = (saleId: string, nextStatus: Sale['status'], extra?: Partial<Sale>) => {
    const saleToUpdate = sales.find(s => s.id === saleId);
    if (!saleToUpdate) return;

    // Logic for confirming revenue and sync amount if changed when finishing conference
    if (nextStatus === 'separado' || nextStatus === 'falta_confirmada') {
      setRevenues((prev: Revenue[]) => prev.map(r => {
        if (r.saleId === saleId) {
          const updatedR = { ...r, status: 'confirmado' as const, amount: saleToUpdate.total, updatedAt: Date.now() };
          return updatedR;
        }
        return r;
      }));
    }

    setSales((prev: Sale[]) => prev.map(s => s.id === saleId ? { 
      ...s, 
      status: nextStatus, 
      ...( (nextStatus === 'separado' || nextStatus === 'falta_confirmada') ? { 
          separatedByUserId: currentUser?.id, 
          separatedByUserName: currentUser?.name, 
          separatedByAt: new Date().toISOString(),
          separationTimestamp: new Date().toISOString() 
        } : {}),
      ...(nextStatus === 'embalado' ? { 
          packedByUserId: currentUser?.id, 
          packedByUserName: currentUser?.name,
          packedAt: new Date().toISOString()
        } : {}),
      ...(nextStatus === 'enviado' ? {
          shippedByUserId: currentUser?.id,
          shippedByUserName: currentUser?.name,
          shippedAt: new Date().toISOString()
        } : {}),
      ...extra,
      ...(extra?.deliveryMethodId ? { deliveryMethod: deliveryMethods.find(m => m.id === extra.deliveryMethodId)?.name } : {})
    } : s));

    // Sync Queue
    addActivity('sale', 'Pedido Atualizado', `Venda ${saleToUpdate.sequentialId} movida para ${nextStatus} por ${currentUser?.name || 'Sistema'}.`);
  };

  const startSeparation = (saleId: string) => {
    const userAction = currentUser;
    setSales((prev: Sale[]) => prev.map(s => s.id === saleId ? { 
      ...s, 
      status: 'em_separacao',
      startedSeparationByUserId: userAction?.id,
      startedSeparationByUserName: userAction?.name,
      startedSeparationAt: new Date().toISOString(),
      originalItems: s.originalItems || s.items
    } : s));

    const sale = sales.find(s => s.id === saleId);
    if (sale) {
      addActivity('sale', 'Início de Separação', `Separação da Venda ${sale.sequentialId} iniciada por ${userAction?.name || 'Sistema'}.`);
    }

    setScanningSaleId(saleId);
    setScannedItems([]);
    setActiveTab('em_separacao');
  };

  const handleCancelOrder = (saleId: string) => {
    if (!confirm('Deseja realmente cancelar este pedido?')) return;
    
    setSales((prev: Sale[]) => prev.map(s => s.id === saleId ? { ...s, status: 'cancelado' as const } : s));
    
    // Sync Queue
    setRevenues((prev: Revenue[]) => prev.map(r => {
      if (r.saleId === saleId) {
        const updatedR = { ...r, status: 'cancelado' as const, updatedAt: Date.now() };
        return updatedR;
      }
      return r;
    }));
    addActivity('sale', 'Pedido Cancelado', `Venda ${saleId.substring(0, 8)} cancelada.`);
    setScanningSaleId(null);
  };

  const finishSeparation = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);
    if (!sale) return;

    let hasMissing = false;
    let hasExtra = false;

    sale.items.forEach(item => {
      const scanned = scannedItems.find(si => si.productId === item.productId)?.quantity || 0;
      if (scanned < item.quantity) hasMissing = true;
      if (scanned > item.quantity) hasExtra = true;
    });

    if (hasExtra) {
      alert('Você adicionou itens a mais. Não é permitido finalizar com quantidades excedentes nesta etapa. Por favor, ajuste as quantidades ou finalize o pedido na aba "Separado" caso precise de edições manuais.');
      return;
    }

    const performFinalization = () => {
      const saleToFinalize = sales.find(s => s.id === (saleId || scanningSaleId));
      if (!saleToFinalize) return;

      // Create final items based on what was scanned
      const finalItems = saleToFinalize.items.map(item => {
        const scanned = scannedItems.find(si => si.productId === item.productId)?.quantity || 0;
        return { ...item, quantity: scanned };
      }).filter(item => item.quantity > 0);

      const newTotal = finalItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const newTotalCost = finalItems.reduce((acc, item) => acc + (item.cost * item.quantity), 0);
      const newTotalProfit = newTotal - newTotalCost;
      
      let hasAnyMissing = false;
      saleToFinalize.items.forEach(item => {
        const scanned = scannedItems.find(si => si.productId === item.productId)?.quantity || 0;
        if (scanned < item.quantity) hasAnyMissing = true;
      });

      // 1. Update Stock based on DIFFERENCE between sold and scanned
      setProducts((prev: Product[]) => prev.map(p => {
        const originalItem = saleToFinalize.items.find(i => i.productId === p.id);
        const separatedItem = finalItems.find(i => i.productId === p.id);
        
        const originalQty = originalItem?.quantity || 0;
        const separatedQty = separatedItem?.quantity || 0;
        
        if (originalQty !== separatedQty) {
          // Se separamos MENOS do que o vendido, devolvemos a diferença ao estoque
          // Se separamos MAIS (não permitido por UI, mas bom prever), subtraímos a diferença
          const diff = separatedQty - originalQty;
          return { ...p, stock: p.stock - diff };
        }
        return p;
      }));

      // 2. Update Sale Status and Items
      const finalStatus = hasAnyMissing ? 'falta_confirmada' : 'separado';
      
      setSales((prev: Sale[]) => prev.map(s => {
        if (s.id === saleToFinalize.id) {
          // Ajustar pagamentos proporcionalmente ao novo total
          const adjustmentFactor = s.total > 0 ? newTotal / s.total : 1;
          const adjustedPayments = s.payments?.map(p => ({
            ...p,
            amount: Number((p.amount * adjustmentFactor).toFixed(2))
          }));

          // Garantir que a soma dos pagamentos batam exatamente com o novo total (ajuste de arredondamento)
          if (adjustedPayments && adjustedPayments.length > 0) {
            const currentPaymentsSum = adjustedPayments.reduce((acc, p) => acc + p.amount, 0);
            const diff = Number((newTotal - currentPaymentsSum).toFixed(2));
            if (diff !== 0) {
              adjustedPayments[adjustedPayments.length - 1].amount = Number((adjustedPayments[adjustedPayments.length - 1].amount + diff).toFixed(2));
            }
          }

          return { 
            ...s, 
            status: finalStatus, 
            items: finalItems,
            originalItems: s.originalItems || s.items,
            total: newTotal,
            totalCost: newTotalCost,
            totalProfit: newTotalProfit,
            payments: adjustedPayments,
            receivedAmount: s.receivedAmount ? Number((s.receivedAmount * adjustmentFactor).toFixed(2)) : newTotal,
            change: s.change ? Number((s.change * adjustmentFactor).toFixed(2)) : 0,
            separatedByUserId: currentUser?.id,
            separatedByUserName: currentUser?.name,
            separatedByAt: new Date().toISOString(),
            missingConfirmedByUserId: hasAnyMissing ? currentUser?.id : s.missingConfirmedByUserId,
            missingConfirmedByUserName: hasAnyMissing ? currentUser?.name : s.missingConfirmedByUserName,
            notes: hasAnyMissing ? `${s.notes || ''} [Pedido ajustado na separação: Itens faltantes registrados por ${currentUser?.name}]`.trim() : s.notes
          };
        }
        return s;
      }));

      // 3. Sync Revenue with adjusted total
      setRevenues((prev: Revenue[]) => prev.map(r => {
        if (r.saleId === saleToFinalize.id) {
          const updatedR = { ...r, status: 'confirmado' as const, amount: newTotal, updatedAt: Date.now() };
          return updatedR;
        }
        return r;
      }));

      const orderedQty = saleToFinalize.items.reduce((acc, i) => acc + i.quantity, 0);
      const sentQty = finalItems.reduce((acc, i) => acc + i.quantity, 0);
      const missingQty = orderedQty - sentQty;

      addActivity(
        'sale', 
        hasAnyMissing ? 'Pedido Separado (Falta Confirmada)' : 'Pedido Separado', 
        `Venda ${saleToFinalize.sequentialId} finalizada por ${currentUser?.name}. Enviado: ${sentQty}/${orderedQty} itens. ${hasAnyMissing ? `Faltando: ${missingQty}` : 'Sucesso.'}`
      );
      setScanningSaleId(null);
      setScannedItems([]);
      setFinishingSaleId(null);
      setFoundSaleId(null);
      setActiveTab(hasAnyMissing ? 'separado' : 'separado');
    };

    const hasMissingInSale = sale.items.some(item => {
      const scanned = scannedItems.find(si => si.productId === item.productId)?.quantity || 0;
      return scanned < item.quantity;
    });

    performFinalization();
  };

  const handleScan = (e?: FormEvent) => {
    e?.preventDefault();
    if (!scanningSaleId || !scanInput.trim()) return;

    const sale = sales.find(s => s.id === scanningSaleId);
    if (!sale) return;

    const query = scanInput.trim();
    const normalizedQuery = query.replace(/^0+/, '');

    // Search in products by barcode or SKU
    const product = products.find(p => {
      const b = (p.barcode || '').trim();
      const s = (p.sku || '').trim();
      const id = p.id;
      
      return b === query || s === query || id === query ||
             (b && b.replace(/^0+/, '') === normalizedQuery) ||
             (s && s.replace(/^0+/, '') === normalizedQuery) ||
             (id && id.replace(/^0+/, '') === normalizedQuery);
    });
    
    if (!product) {
      setScanError('Produto não encontrado no catálogo!');
      setScanInput('');
      return;
    }

    const itemInSale = sale.items.find(i => i.productId === product.id);
    if (!itemInSale) {
      setScanError(`Produto "${product.name}" não pertence a este pedido!`);
      setScanInput('');
      return;
    }

    const qtyToAdd = parseInt(manualQty) || 1;
    const currentlyScanned = scannedItems.find(si => si.productId === product.id)?.quantity || 0;

    if (currentlyScanned + qtyToAdd > itemInSale.quantity) {
      setScanError('Não é permitido adicionar mais itens que o solicitado. Para adicionar, utilize a edição do pedido após a separação');
      setScanInput('');
      setManualQty('1');
      return;
    }
    
    setLastScannedProduct(product);
    setScannedItems(prev => {
      const existing = prev.find(i => i.productId === product.id);
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qtyToAdd } : i);
      }
      return [...prev, { productId: product.id, quantity: qtyToAdd }];
    });

    setScanInput('');
    setManualQty('1');
  };

  const isScanningFull = () => {
    if (!scanningSaleId) return false;
    const sale = sales.find(s => s.id === scanningSaleId);
    if (!sale) return false;
    return sale.items.every(item => {
      const scanned = scannedItems.find(s => s.productId === item.productId);
      return scanned && scanned.quantity === item.quantity;
    });
  };

  const getConferenceProgress = () => {
    if (!scanningSaleId) return { current: 0, total: 0 };
    const sale = sales.find(s => s.id === scanningSaleId);
    if (!sale) return { current: 0, total: 0 };
    const totalItems = sale.items.reduce((acc, i) => acc + i.quantity, 0);
    const currentScanned = scannedItems.reduce((acc, i) => acc + i.quantity, 0);
    return { current: currentScanned, total: totalItems };
  };

  if (scanningSaleId) {
    const sale = sales.find(s => s.id === scanningSaleId);
    return (
      <div className="fixed inset-0 z-[120] bg-zinc-950 overflow-y-auto p-4 md:p-8 animate-in fade-in slide-in-from-right-4 pb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between max-w-7xl mx-auto mb-6 md:mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div>
              <h3 className="text-lg md:text-2xl font-black text-zinc-100 uppercase tracking-widest">Conferência</h3>
              <p className="text-[10px] md:text-xs text-zinc-500 font-bold uppercase tracking-widest flex flex-wrap items-center gap-2">
                <span className="text-indigo-400">PEDIDO #{sale?.sequentialId}</span>
                <span className="hidden md:inline">•</span>
                <span>Op: {currentUser?.name}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
             <div className="px-5 py-3 bg-zinc-900 rounded-2xl border border-zinc-800 text-right w-full md:w-auto">
                <p className="text-[9px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Progresso</p>
                <div className="flex items-center gap-3">
                   <div className="flex-1 md:w-32 h-2 bg-black rounded-full overflow-hidden shrink-0">
                      <div 
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.4)] transition-all duration-500"
                        style={{ width: `${getConferenceProgress().total > 0 ? (getConferenceProgress().current / getConferenceProgress().total) * 100 : 0}%` }}
                      />
                   </div>
                   <span className="text-xs md:text-sm font-black text-emerald-400 min-w-[40px]">
                      {Math.round((getConferenceProgress().current / (getConferenceProgress().total || 1)) * 100)}%
                   </span>
                </div>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
           {/* Scan Area */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-6">
                <div className="flex gap-3 md:gap-4 flex-col sm:flex-row">
                  <div className="w-full sm:w-24">
                    <Input label="QTD" value={manualQty} onChange={setManualQty} placeholder="1" type="number" />
                  </div>
                  <form onSubmit={handleScan} className="flex-1 w-full">
                    <Input 
                      ref={scanInputRef}
                      label="BIPAR OU DIGITAR CÓDIGO" 
                      autoFocus 
                      placeholder="CÓDIGO DE BARRAS / SKU / ID" 
                      value={scanInput} 
                      onChange={setScanInput} 
                    />
                  </form>
                </div>

                {lastScannedProduct && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-4 md:p-6 bg-emerald-500/10 rounded-2xl md:rounded-3xl border border-emerald-500/20 flex items-center gap-4 md:gap-6">
                    <div className="w-16 h-16 md:w-20 md:h-20 bg-zinc-950 rounded-2xl flex items-center justify-center border border-emerald-500/20 overflow-hidden shadow-inner shrink-0">
                      {lastScannedProduct.imageUrl ? <img src={lastScannedProduct.imageUrl} className="w-full h-full object-cover" /> : <Package size={24} className="text-emerald-400" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] md:text-xs font-black text-emerald-400 uppercase tracking-widest mb-1 truncate">Identificado</p>
                      <p className="text-sm md:text-xl font-black text-zinc-100 uppercase truncate">{lastScannedProduct.name}</p>
                      <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 mt-0.5 truncate uppercase tracking-widest">Cod: {lastScannedProduct.barcode || lastScannedProduct.sku}</p>
                    </div>
                    <div className="bg-emerald-500 text-white w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-lg md:text-xl font-black shadow-lg shadow-emerald-500/20 shrink-0">
                      +1
                    </div>
                  </motion.div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between px-1">
                    <h4 className="text-[10px] md:text-sm font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                      <Boxes size={14} /> Itens do Pedido
                    </h4>
                    <span className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase bg-zinc-950 px-2 py-1 rounded-full">
                      {sale?.items.length} Tipos
                    </span>
                  </div>

                  <div className="space-y-3 max-h-[500px] md:max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                    {sale?.items
                      .map(item => {
                        const product = products.find(p => p.id === item.productId);
                        const scanned = scannedItems.find(si => si.productId === item.productId)?.quantity || 0;
                        const isDone = scanned === item.quantity;
                        const isOver = scanned > item.quantity;
                        const isUnder = scanned < item.quantity && scanned > 0;

                        return { ...item, product, scanned, isDone, isOver, isUnder };
                      })
                      .sort((a, b) => (a.isDone === b.isDone ? 0 : a.isDone ? 1 : -1))
                      .map(item => (
                        <div 
                          key={item.productId} 
                          className={`p-4 md:p-5 rounded-2xl md:rounded-[2rem] border transition-all duration-300 ${
                            item.isDone 
                              ? 'bg-zinc-950/50 border-zinc-800 opacity-60' 
                              : item.isOver
                                ? 'bg-orange-500/5 border-orange-500/20 shadow-lg shadow-orange-500/5'
                                : 'bg-zinc-800/40 border-zinc-700/50 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center gap-4 md:gap-6">
                            <div className="w-12 h-12 md:w-16 md:h-16 rounded-xl md:rounded-2xl flex items-center justify-center border border-zinc-800 overflow-hidden shrink-0 shadow-inner bg-zinc-950">
                              {item.product?.imageUrl ? (
                                <img src={item.product.imageUrl} className="w-full h-full object-cover" />
                              ) : (
                                <Package size={20} className="text-zinc-800" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs md:text-sm font-black text-zinc-100 uppercase truncate mb-0.5">{item.product?.name}</p>
                              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5">
                                <p className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest truncate">{item.product?.sku || item.product?.barcode || 'SEM CÓDIGO'}</p>
                                {formatLocation(item.product) && (
                                  <p className="text-[8px] md:text-[10px] font-black text-[#5d5dff] uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={10} className="shrink-0" />
                                    Loc: {formatLocation(item.product)}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                               <div className="flex items-baseline justify-end gap-1.5">
                                  <span className={`text-lg md:text-2xl font-black ${item.isDone ? 'text-emerald-400' : item.isOver ? 'text-orange-400' : 'text-zinc-100'}`}>
                                    {item.scanned}
                                  </span>
                                  <span className="text-[10px] md:text-xs font-bold text-zinc-600">/ {item.quantity}</span>
                               </div>
                               {item.isDone && <span className="text-[7px] md:text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] block leading-none mt-1">OK</span>}
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
           </div>

           {/* Sidebar Controls */}
           <div className="space-y-6">
              <div className="bg-zinc-900 p-6 md:p-8 rounded-3xl md:rounded-[2.5rem] border border-zinc-800 shadow-xl space-y-6 md:space-y-8 lg:sticky lg:top-24">
                <div className="space-y-2 text-center">
                  <div className="w-12 h-12 md:w-16 md:h-16 bg-indigo-500/10 text-indigo-400 rounded-2xl md:rounded-3xl flex items-center justify-center mx-auto ring-1 ring-indigo-500/20">
                    <CheckCircle2 size={32} />
                  </div>
                  <h4 className="text-sm md:text-lg font-black text-zinc-100 uppercase tracking-widest">Finalizar</h4>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-1 gap-3 md:gap-4">
                  <div className="flex flex-col md:flex-row justify-between items-center p-3 md:p-4 bg-black/20 rounded-xl md:rounded-2xl border border-zinc-800 gap-1">
                    <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Escaneado</span>
                    <span className="text-sm md:text-lg font-black text-zinc-100">{getConferenceProgress().current} Itens</span>
                  </div>
                  <div className="flex flex-col md:flex-row justify-between items-center p-3 md:p-4 bg-black/20 rounded-xl md:rounded-2xl border border-zinc-800 gap-1">
                    <span className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pedido</span>
                    <span className="text-sm md:text-lg font-black text-zinc-100">{getConferenceProgress().total} Itens</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {finishingSaleId === scanningSaleId ? (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 md:p-6 bg-emerald-500/10 rounded-2xl md:rounded-3xl border border-emerald-500/30 text-center space-y-4">
                       <p className="text-[10px] md:text-sm font-black text-emerald-400 uppercase tracking-widest leading-relaxed">
                         {getConferenceProgress().current < getConferenceProgress().total 
                           ? 'Pedido com itens faltantes. Confirmar mesmo assim?' 
                           : 'Deseja finalizar a separação?'}
                       </p>
                       <div className="grid grid-cols-2 gap-2 md:gap-3">
                         <button 
                           onClick={() => finishSeparation(scanningSaleId!)}
                           className="py-3 md:py-4 bg-emerald-600 text-white rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-500/20"
                         >
                           Sim
                         </button>
                         <button 
                           onClick={() => setFinishingSaleId(null)}
                           className="py-3 md:py-4 bg-zinc-800 text-zinc-400 rounded-xl md:rounded-2xl font-black text-[10px] md:text-xs uppercase tracking-widest border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all"
                         >
                           Não
                         </button>
                       </div>
                    </motion.div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <button 
                        onClick={() => setFinishingSaleId(scanningSaleId)}
                        disabled={getConferenceProgress().current === 0}
                        className={`w-full py-5 md:py-6 rounded-2xl font-black text-xs md:text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
                          getConferenceProgress().current > 0 
                            ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-900/40 active:scale-95' 
                            : 'bg-zinc-800 text-zinc-700 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <Check size={18} /> Finalizar
                      </button>
                      
                      <button 
                        onClick={() => {
                          setScanningSaleId(null);
                          setScannedItems([]);
                          setFinishingSaleId(null);
                          setActiveTab('em_separacao');
                        }}
                        className="w-full py-4 bg-zinc-800/50 text-zinc-500 hover:text-red-400 hover:bg-red-400/5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                         <X size={14} /> Cancelar Conferência
                      </button>
                    </div>
                  )}
                </div>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (isSeparador && !scanningSaleId) {
    const sale = sales.find(s => s.id === foundSaleId);
    const customer = customers.find(c => c?.id === sale?.customerId);
    
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 flex flex-col items-center py-10 md:py-20 max-w-xl mx-auto w-full">
        <div className="w-full space-y-8">
           <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-[#5d5dff]/10 text-[#5d5dff] rounded-[2rem] flex items-center justify-center mx-auto mb-4 border border-[#5d5dff]/20">
                <ScanLine size={32} />
              </div>
              <h3 className="text-2xl font-black text-[#1A1A1A] uppercase tracking-tighter">Terminal de Separação</h3>
              <p className="text-[10px] font-bold text-[#A1A1A1] uppercase tracking-[0.2em]">Fluxo Simplificado e Direto</p>
           </div>

           {/* Central Search */}
           <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-[0_20px_50px_rgba(0,0,0,0.05)] w-full space-y-6">
              <form onSubmit={handleOrderSearch} className="space-y-4">
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A1A1A1]" size={18} />
                    <input 
                      type="text" 
                      placeholder="NÚMERO DO PEDIDO"
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-5 bg-[#FDFCF9] rounded-2xl border border-[#E5E1D8] outline-none focus:ring-2 focus:ring-[#1A1A1A] text-sm font-black uppercase tracking-widest placeholder:text-zinc-300"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <button 
                     type="submit"
                     className="bg-[#1A1A1A] text-white p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                   >
                     Buscar
                   </button>
                   <button 
                     type="button"
                     onClick={() => setShowScanner(true)}
                     className="bg-white text-[#1A1A1A] p-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] border border-[#E5E1D8] hover:bg-[#F5F2ED] transition-all flex items-center justify-center gap-2"
                   >
                     <QrCode size={18} /> QR Code
                   </button>
                 </div>
              </form>
           </div>

           {/* Found Sale Details */}
           <AnimatePresence>
             {sale && (
               <motion.div 
                 initial={{ opacity: 0, y: 20 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 className="bg-white p-8 rounded-[2.5rem] border border-[#E5E1D8] shadow-2xl w-full space-y-6 relative overflow-hidden"
               >
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#5d5dff]/5 blur-3xl -mr-16 -mt-16" />
                 
                 <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black bg-[#FDFCF9] text-[#A1A1A1] border border-[#E5E1D8] px-4 py-1.5 rounded-full uppercase tracking-widest mb-3 inline-block">PEDIDO #{sale.sequentialId}</span>
                      <h4 className="text-xl font-black text-[#1A1A1A] uppercase">{customer?.name || 'Cliente Casual'}</h4>
                      <p className="text-[10px] text-[#A1A1A1] font-bold uppercase mt-1">Status: {sale.status}</p>
                    </div>
                    <button onClick={() => setFoundSaleId(null)} className="p-2 text-[#A1A1A1] hover:text-red-500 transition-colors">
                      <X size={20} />
                    </button>
                 </div>

                 <div className="space-y-3 bg-[#FDFCF9] p-6 rounded-2xl border border-[#E5E1D8]/50">
                    <p className="text-[9px] font-black text-[#A1A1A1] uppercase tracking-[0.2em] mb-2 border-l-2 border-[#5d5dff] pl-2">ITENS PARA SEPARAÇÃO</p>
                    {sale.items.map(item => {
                      const product = products.find(p => p.id === item.productId);
                      return (
                        <div key={item.productId} className="flex justify-between items-center py-2 border-b border-[#E5E1D8]/30 last:border-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-[#E5E1D8] overflow-hidden">
                              {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={12} className="text-[#A1A1A1]" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-xs font-bold text-[#1A1A1A] uppercase">{product?.name || 'Produto'}</span>
                              {formatLocation(product) && (
                                <span className="text-[8px] font-black text-[#5d5dff] uppercase tracking-widest flex items-center gap-1">
                                  <MapPin size={8} /> Loc: {formatLocation(product)}
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-xs font-black text-[#1A1A1A]">X {item.quantity}</span>
                        </div>
                      );
                    })}
                 </div>

                 {sale.status === 'pendente' ? (
                   <button 
                     onClick={() => startSeparation(sale.id)}
                     className="w-full bg-[#1A1A1A] text-white p-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all text-center flex items-center justify-center gap-3"
                   >
                     <Play size={18} /> Iniciar Separação
                   </button>
                 ) : sale.status === 'em_separacao' ? (
                   <button 
                     onClick={() => setScanningSaleId(sale.id)}
                     className="w-full bg-[#5d5dff] text-white p-6 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-xl hover:bg-blue-700 transition-all text-center flex items-center justify-center gap-3"
                   >
                     <ScanLine size={18} /> Continuar Conferência
                   </button>
                 ) : (
                   <div className="w-full bg-[#FDFCF9] text-[#A1A1A1] p-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-center border border-dashed border-[#E5E1D8]">
                     Este pedido já está {sale.status?.toUpperCase()}.
                   </div>
                 )}
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* QR Scanner Modal */}
        <AnimatePresence>
          {showScanner && (
            <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col items-center justify-center p-4 backdrop-blur-lg">
               <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0.95 }}
                 className="bg-white p-6 md:p-10 rounded-[3.5rem] w-full max-w-lg shadow-2xl space-y-6"
               >
                  <SeparadorScanner onScan={(text) => handleQRScanSuccess(text)} onClose={() => setShowScanner(false)} />
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-full aria-hidden flex items-center justify-center">
            <Boxes size={20} />
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Fluxo de Separação</h3>
            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Gestão de Logística Interna</p>
          </div>
        </div>
      </div>

      {/* Buscar Pedido */}
      <div className="bg-zinc-900 p-4 md:p-6 rounded-3xl border border-zinc-800 shadow-sm">
        <form onSubmit={handleOrderSearch} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Digite ou bipe o nº do pedido..."
              value={orderSearch}
              onChange={e => setOrderSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-black/20 rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-400 text-sm font-bold uppercase transition-all text-zinc-100 placeholder:text-zinc-700"
            />
          </div>
          <button 
            type="submit"
            className="w-full md:w-auto px-8 py-4 bg-[#5d5dff] text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
          >
            <QrCode size={14} /> Buscar Pedido
          </button>
        </form>
      </div>

      {/* Status Tabs */}
      <div className="flex overflow-x-auto no-scrollbar gap-2 bg-zinc-900/50 p-2 rounded-2xl md:rounded-[2rem] border border-zinc-800/50">
        {[
          { id: 'pendente', label: 'Pendentes', icon: Clock, color: 'text-orange-400' },
          { id: 'em_separacao', label: 'Separando', icon: ScanLine, color: 'text-indigo-400' },
          { id: 'separado', label: 'Separado', icon: Handshake, color: 'text-blue-400' },
          { id: 'embalado', label: 'Embalado', icon: Package, color: 'text-purple-400' },
          { id: 'enviado', label: 'Enviado', icon: Send, color: 'text-emerald-400' },
          { id: 'entregue', label: 'Entregue', icon: CheckCircle2, color: 'text-zinc-500' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex flex-1 min-w-[90px] md:min-w-0 md:flex-row items-center justify-center gap-1 md:gap-2 px-2 py-3 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border shrink-0 ${
              activeTab === t.id 
                ? 'bg-zinc-800 border-zinc-700 shadow-sm ' + t.color 
                : 'bg-transparent border-transparent text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <t.icon size={14} className={activeTab === t.id ? t.color : 'text-zinc-700 md:block hidden'} />
            <span className="truncate">{t.label}</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${activeTab === t.id ? 'bg-zinc-700 text-zinc-100' : 'bg-zinc-900 text-zinc-700'}`}>
              {sales.filter(s => {
                const sStat = s.status || 'pendente';
                if (t.id === 'separado') return sStat === 'separado' || sStat === 'falta_confirmada';
                return sStat === t.id;
              }).length}
            </span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSales.length > 0 ? filteredSales.map(sale => {
          const customer = customers.find(c => c.id === sale.customerId);
          return (
            <div key={sale.id} className="bg-zinc-900 p-4 md:p-6 rounded-3xl border border-zinc-800 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-black bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full uppercase tracking-widest">PEDIDO #{sale.sequentialId}</span>
                    {sale.deliveryChannelId && (
                      <span className="text-[9px] font-black bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded-md uppercase tracking-wider">
                         {deliveryChannels.find(dc => dc.id === sale.deliveryChannelId)?.name}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-black text-zinc-100 uppercase">{customer?.name || 'Cliente Casual'}</p>
                  <p className="text-[10px] text-zinc-500 font-bold">{new Date(sale.date).toLocaleString('pt-BR')}</p>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  {activeTab === 'pendente' && canEdit && (
                    <div className="flex gap-2 w-full md:w-auto">
                      {startingSaleId === sale.id ? (
                        <>
                          <button 
                            onClick={() => {
                              startSeparation(sale.id);
                              setStartingSaleId(null);
                            }}
                            className="flex-1 md:flex-none bg-emerald-600 text-white px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all"
                          >
                            Confirmar
                          </button>
                          <button 
                            onClick={() => setStartingSaleId(null)}
                            className="flex-1 md:flex-none bg-zinc-800 text-zinc-400 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => setStartingSaleId(sale.id)}
                          className="w-full md:w-auto bg-indigo-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-900/20 flex items-center justify-center gap-2"
                        >
                          <Play size={14} /> Iniciar
                        </button>
                      )}
                    </div>
                  )}
                  {activeTab === 'em_separacao' && canEdit && (
                    <div className="flex gap-2 w-full md:w-auto">
                      <button 
                        onClick={() => setScanningSaleId(sale.id)}
                        className="w-full md:w-auto bg-indigo-500/10 text-indigo-400 px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-500/10"
                      >
                        <ScanLine size={14} /> Bipar Itens
                      </button>
                    </div>
                  )}
                  {activeTab === 'separado' && (
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                       {canEdit && (
                         <button 
                          onClick={() => setEditingSaleId(sale.id)}
                          className="flex-1 md:flex-none bg-indigo-500/10 text-indigo-400 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500/20 transition-all flex items-center justify-center gap-2 border border-indigo-500/10"
                        >
                          <Edit size={14} /> Editar
                        </button>
                       )}
                      <button 
                        onClick={() => imprimirCupom(sale, 'CUPOM DE SEPARAÇÃO')}
                        className="flex-1 md:flex-none bg-zinc-800 text-zinc-300 px-4 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-zinc-700 transition-all flex items-center justify-center gap-2 border border-zinc-700"
                      >
                        <Printer size={14} /> Imprimir
                      </button>
                      {canEdit && (
                        <button 
                          onClick={() => handleStatusUpdate(sale.id, 'embalado')}
                          className="w-full md:w-auto bg-purple-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
                        >
                          <Package size={14} /> Embalado
                        </button>
                      )}
                    </div>
                  )}
                  {activeTab === 'embalado' && canEdit && (
                    <button 
                      onClick={() => {
                        setShippingModalSaleId(sale.id);
                        setShippingInfo({ 
                          trackingCode: sale.trackingCode || '', 
                          deliveryChannelId: sale.deliveryChannelId || '', 
                          deliveryMethodId: sale.deliveryMethodId || '' 
                        });
                      }}
                      className="w-full md:w-auto bg-emerald-600 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                    >
                      <Send size={14} /> Despachar
                    </button>
                  )}
                  {activeTab === 'enviado' && canEdit && (
                    <button 
                      onClick={() => handleStatusUpdate(sale.id, 'entregue')}
                      className="w-full md:w-auto bg-gray-800 text-white px-5 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={14} /> Entregue
                    </button>
                  )}
                  <div className="flex items-center">
                    {canEdit && (
                      cancelingSaleId === sale.id ? (
                        <div className="flex items-center gap-2 bg-red-500/10 p-1.5 rounded-xl border border-red-500/20">
                          <span className="text-[8px] font-black text-red-500 uppercase tracking-widest px-2">Deseja excluir?</span>
                          <button 
                            onClick={() => {
                              setSales((prev: Sale[]) => prev.filter(s => s.id !== sale.id));
                              setRevenues((prev: Revenue[]) => prev.filter(r => r.saleId !== sale.id));
                              addActivity('sale', 'Pedido Excluído', `Venda ${sale.sequentialId} removida do sistema.`);
                              setCancelingSaleId(null);
                            }}
                            className="bg-red-600 text-white px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-red-700 transition-all"
                          >
                            Sim
                          </button>
                          <button 
                            onClick={() => setCancelingSaleId(null)}
                            className="bg-zinc-800 text-zinc-400 px-3 py-1.5 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-zinc-700 transition-all"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => setCancelingSaleId(sale.id)}
                          className="p-3 text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Items Summary */}
              <div className="bg-zinc-900 rounded-2xl p-4 space-y-3">
                {activeTab === 'separado' && customer && (
                  <div className="mb-4 pb-4 border-b border-zinc-800">
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2 border-l-2 border-blue-500 pl-2">Dados do Cliente</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <p className="text-zinc-600 font-bold uppercase text-[9px]">Nome</p>
                        <p className="text-zinc-100 font-black">{customer.name}</p>
                      </div>
                      {customer.whatsapp && (
                        <div>
                          <p className="text-zinc-600 font-bold uppercase text-[9px]">WhatsApp</p>
                          <p className="text-zinc-100 font-black">{customer.whatsapp}</p>
                        </div>
                      )}
                      {customer.address && (
                        <div className="md:col-span-2">
                          <p className="text-zinc-600 font-bold uppercase text-[9px]">Endereço</p>
                          <p className="text-zinc-100 font-black">{customer.address.street}, {customer.address.number} - {customer.address.neighborhood}</p>
                          <p className="text-zinc-400 font-bold">{customer.address.city}/{customer.address.state}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {sale.items.map(item => {
                  const product = products.find(p => p.id === item.productId);
                  return (
                    <div key={item.productId} className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center border border-zinc-700 overflow-hidden">
                          {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package size={12} className="text-gray-300" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-700">{product?.name || 'Produto Excluído'}</span>
                          {formatLocation(product) && (
                            <span className="text-[8px] font-black text-[#5d5dff] uppercase tracking-widest flex items-center gap-1">
                              <MapPin size={8} /> Loc: {formatLocation(product)}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-gray-900">QTD: {item.quantity}</span>
                    </div>
                  );
                })}
              </div>

      {/* Error Modal for Scan */}
      <AnimatePresence>
        {scanError && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }} 
              animate={{ scale: 1, y: 0 }} 
              className="bg-zinc-900 p-8 rounded-[3rem] max-w-sm w-full space-y-6 shadow-2xl relative border border-red-500/20 text-center"
            >
              <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-2">
                <X size={32} />
              </div>
              <h4 className="text-lg font-black text-zinc-100 uppercase tracking-widest">Erro na Conferência</h4>
              <p className="text-sm text-zinc-400 font-bold leading-relaxed">{scanError}</p>
              
              <button 
                onClick={() => {
                  setScanError(null);
                  setTimeout(() => scanInputRef.current?.focus(), 100);
                }}
                className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-900/20 active:scale-95"
              >
                Tentar Novamente
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {(sale.soldByUserName || sale.separatedByUserName || sale.packedByUserName) && (
                <div className="flex flex-wrap gap-4 pt-2 border-t border-zinc-800">
                  {sale.soldByUserName && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <User size={12} className="text-zinc-700" />
                      Vendido por: <span className="text-zinc-300">{sale.soldByUserName}</span>
                    </div>
                  )}
                  {sale.startedSeparationByUserName && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <ScanLine size={12} className="text-zinc-700" />
                      Iniciado por: <span className="text-zinc-300">{sale.startedSeparationByUserName}</span>
                    </div>
                  )}
                  {sale.separatedByUserName && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <Boxes size={12} className="text-zinc-700" />
                      Separado por: <span className="text-zinc-300">{sale.separatedByUserName}</span>
                    </div>
                  )}
                  {sale.packedByUserName && (
                    <div className="flex items-center gap-1.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                      <Package size={12} className="text-zinc-700" />
                      Embalado por: <span className="text-zinc-300">{sale.packedByUserName}</span>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'enviado' && sale.trackingCode && (
                <div className="pt-2 flex items-center gap-4 text-[10px] font-bold text-indigo-400">
                   <div className="flex items-center gap-1"><Truck size={12} /> {sale.deliveryMethod}</div>
                   <div className="flex items-center gap-1"><Barcode size={12} /> {sale.trackingCode}</div>
                </div>
              )}
            </div>
          );
        }) : (
          <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-500 space-y-4 bg-zinc-900/50 rounded-3xl border-2 border-dashed border-zinc-800">
            <Boxes size={48} className="opacity-10" />
            <p className="text-sm font-black uppercase tracking-widest italic opacity-40">Nenhum pedido nesta etapa</p>
          </div>
        )}
      </div>
      {/* Shipping Info Modal */}
      <AnimatePresence>
        {shippingModalSaleId && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 p-8 rounded-[3rem] max-w-sm w-full space-y-6 shadow-2xl relative border border-zinc-800">
              <button onClick={() => setShippingModalSaleId(null)} className="absolute top-6 right-6 text-zinc-600 hover:text-red-500 transition-colors"><X size={20} /></button>
              
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-2"><Send size={28} /></div>
                <h4 className="text-lg font-black text-zinc-100 uppercase tracking-widest">Informações de Envio</h4>
                <p className="text-xs text-zinc-500 font-bold uppercase tracking-tight">Vincule o rastreio e canal ao pedido</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Canal de Venda</label>
                  <select 
                    value={shippingInfo.deliveryChannelId}
                    onChange={e => setShippingInfo(prev => ({ ...prev, deliveryChannelId: e.target.value }))}
                    className="w-full p-4 bg-zinc-950 rounded-2xl border border-zinc-800 outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-100 font-bold text-xs appearance-none"
                  >
                    <option value="" className="bg-zinc-900">Nenhum</option>
                    {deliveryChannels.map(d => <option key={d.id} value={d.id} className="bg-zinc-900">{d.name}</option>)}
                  </select>
                </div>

                 <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-4">Tipo de Entrega</label>
                  <div className="relative group">
                    <select 
                      disabled={isPdvChannel}
                      value={shippingInfo.deliveryMethodId} 
                      onChange={e => setShippingInfo(prev => ({ ...prev, deliveryMethodId: e.target.value }))}
                      className={`w-full p-4 bg-zinc-950 rounded-2xl border outline-none focus:ring-2 focus:ring-emerald-500 text-zinc-100 font-bold text-xs appearance-none uppercase transition-all ${
                        isPdvChannel ? 'opacity-50 cursor-not-allowed border-zinc-800' :
                        deliveryMethods.filter(m => m.isActive).length === 0 ? 'border-amber-500/50 text-amber-500' : 'border-zinc-800 focus:border-emerald-500'
                      }`}
                    >
                      <option value="" className="bg-zinc-900">
                        {deliveryMethods.filter(m => m.isActive).length === 0 
                          ? 'NENHUM TIPO CADASTRADO' 
                          : 'Selecione o Tipo de Entrega'}
                      </option>
                      {deliveryMethods.filter(m => m.isActive).map(m => (
                        <option key={m.id} value={m.id} className="bg-zinc-900">{m.name}</option>
                      ))}
                    </select>
                    {isPdvChannel && (
                       <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mt-1.5 ml-4 flex items-center gap-1.5">
                         <CheckCircle size={10} /> Canal PDV: "Em mãos" obrigatório
                       </p>
                    )}
                    {!isPdvChannel && deliveryMethods.filter(m => m.isActive).length === 0 && (
                      <p className="text-[8px] font-black text-amber-500 uppercase tracking-widest mt-1.5 ml-4 flex items-center gap-1.5 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                        Cadastre tipos no menu Entrega
                      </p>
                    )}
                  </div>
                </div>
                
                <Input 
                  label="Código de Rastreio" 
                  value={shippingInfo.trackingCode} 
                  onChange={(v) => setShippingInfo(prev => ({ ...prev, trackingCode: v }))} 
                  placeholder="Ex: BR123456789"
                />
                
                <button 
                  onClick={() => {
                    handleStatusUpdate(shippingModalSaleId, 'enviado', shippingInfo);
                    setShippingModalSaleId(null);
                  }}
                  className="w-full bg-emerald-600 text-white p-5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-700 transition-all font-sans"
                >
                  Confirmar Envio
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Sale Modal */}
      <AnimatePresence>
        {editingSaleId && (
          <SeparationEditModal 
            sale={sales.find(s => s.id === editingSaleId)!}
            onClose={() => setEditingSaleId(null)}
            products={products}
            customers={customers}
            onUpdate={(updatedSale) => {
              setSales((prev: Sale[]) => prev.map(s => s.id === updatedSale.id ? updatedSale : s));
              
              // Sync Revenue
              setRevenues((prev: Revenue[]) => prev.map(r => 
                r.saleId === updatedSale.id ? { ...r, amount: updatedSale.total } : r
              ));

              addActivity('sale', 'Pedido Editado', `Venda ${updatedSale.sequentialId} editada na etapa de Separado.`);
              setEditingSaleId(null);
            }}
            setProducts={setProducts}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function SeparationEditModal({ 
  sale, 
  onClose, 
  products, 
  customers, 
  onUpdate,
  setProducts
}: { 
  sale: Sale, 
  onClose: () => void, 
  products: Product[], 
  customers: Customer[], 
  onUpdate: (sale: Sale) => void,
  setProducts: any
}) {
  const [localItems, setLocalItems] = useState(sale.items);
  const [searchQuery, setSearchQuery] = useState('');
  const customer = customers.find(c => c.id === sale.customerId);

  const filteredSearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const low = searchQuery.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(low) || 
      p.sku?.toLowerCase().includes(low) || 
      p.barcode?.toLowerCase().includes(low)
    ).slice(0, 5);
  }, [searchQuery, products]);

  const calculateTotals = (items: SaleItem[]) => {
    const newTotal = items.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const newTotalCost = items.reduce((acc, i) => acc + (i.cost * i.quantity), 0);
    const newTotalProfit = newTotal - newTotalCost;
    return { total: newTotal, totalCost: newTotalCost, totalProfit: newTotalProfit };
  };

  const handleUpdateQty = (productId: string, newQty: number) => {
    if (newQty < 0) return;
    
    const item = localItems.find(i => i.productId === productId);
    if (!item) return;

    if (newQty === 0) {
      setLocalItems(prev => prev.filter(i => i.productId !== productId));
      return;
    }

    const product = products.find(p => p.id === productId);
    const originalItem = sale.items.find(i => i.productId === productId);
    const originalQty = originalItem?.quantity || 0;
    const diffRequested = newQty - originalQty;

    setLocalItems(prev => prev.map(i => {
      if (i.productId === productId) {
        return { ...i, quantity: newQty, profit: (i.price - (i.cost || 0)) * newQty };
      }
      return i;
    }));
  };

  const handleAddItem = (product: Product) => {
    const existing = localItems.find(i => i.productId === product.id);
    if (existing) {
      handleUpdateQty(product.id, existing.quantity + 1);
      return;
    }

    const newItem: SaleItem = {
      productId: product.id,
      quantity: 1,
      price: product.price,
      cost: product.costPrice || 0,
      profit: product.price - (product.costPrice || 0)
    };

    setLocalItems([...localItems, newItem]);
    setSearchQuery('');
  };

  const handleRemoveItem = (productId: string) => {
    setLocalItems(prev => prev.filter(i => i.productId !== productId));
  };

  const handleSaveEdition = () => {
    const { total, totalCost, totalProfit } = calculateTotals(localItems);
    
    // Apply stock changes
    setProducts((prev: Product[]) => prev.map(p => {
      const originalItem = sale.items.find(i => i.productId === p.id);
      const newItem = localItems.find(i => i.productId === p.id);
      const originalQty = originalItem?.quantity || 0;
      const newQty = newItem?.quantity || 0;
      const diff = newQty - originalQty;
      
      if (diff !== 0) {
        const updatedProduct = { ...p, stock: p.stock - diff };
        return updatedProduct;
      }
      return p;
    }));

    // Ajustar pagamentos proporcionalmente
    const adjustmentFactor = sale.total > 0 ? total / sale.total : 1;
    const adjustedPayments = sale.payments?.map(p => ({
      ...p,
      amount: Number((p.amount * adjustmentFactor).toFixed(2))
    }));

    // Garantir que a soma dos pagamentos batam exatamente com o novo total (ajuste de arredondamento)
    if (adjustedPayments && adjustedPayments.length > 0) {
      const currentPaymentsSum = adjustedPayments.reduce((acc, p) => acc + p.amount, 0);
      const diff = Number((total - currentPaymentsSum).toFixed(2));
      if (diff !== 0) {
        adjustedPayments[adjustedPayments.length - 1].amount = Number((adjustedPayments[adjustedPayments.length - 1].amount + diff).toFixed(2));
      }
    }

    const updatedSale = {
      ...sale,
      items: localItems,
      total,
      totalCost,
      totalProfit,
      payments: adjustedPayments,
      receivedAmount: sale.receivedAmount ? Number((sale.receivedAmount * adjustmentFactor).toFixed(2)) : total,
      change: sale.change ? Number((sale.change * adjustmentFactor).toFixed(2)) : 0,
      notes: `${sale.notes || ''} [Edição de pedido em Separado]`.trim()
    };

    onUpdate(updatedSale);
    onClose();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
      <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-zinc-900 p-8 rounded-[3rem] max-w-2xl w-full shadow-2xl space-y-6 relative overflow-hidden flex flex-col max-h-[90vh] border border-zinc-800">
        <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
        <button onClick={onClose} className="absolute top-8 right-8 text-zinc-500 hover:text-red-500 transition-colors"><X size={24} /></button>
        
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-indigo-500/10 text-indigo-400 rounded-3xl flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <Edit size={32} />
          </div>
          <div>
            <h4 className="text-2xl font-black text-zinc-100 uppercase tracking-widest leading-none">Edição Controlada</h4>
            <div className="flex items-center gap-3 mt-2">
               <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">PEDIDO #{sale.sequentialId}</span>
               <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cliente: {customer?.name || 'Venda Avulsa'}</span>
            </div>
          </div>
        </div>

        {/* Search Bar to Add Products */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
          <input 
            type="text" 
            placeholder="Adicionar novos produtos ao pedido..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-black/20 rounded-[1.5rem] border border-zinc-800 outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-xs uppercase text-zinc-100 placeholder:text-zinc-700"
          />
          <AnimatePresence>
            {filteredSearch.length > 0 && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="absolute z-10 w-full mt-2 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden p-2">
                {filteredSearch.map(p => (
                  <button 
                    key={p.id} 
                    onClick={() => handleAddItem(p)}
                    className="w-full p-3 flex items-center gap-4 hover:bg-zinc-800 transition-all rounded-xl text-left"
                  >
                    <div className="w-10 h-10 rounded-lg bg-zinc-950 border border-zinc-800 flex items-center justify-center overflow-hidden shrink-0">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <Package size={16} className="text-zinc-700" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-black text-zinc-200 uppercase truncate">{p.name}</p>
                      <p className="text-[8px] font-bold text-zinc-600 uppercase">Estoque: {p.stock} | R$ {p.price.toFixed(2)}</p>
                    </div>
                    <Plus size={14} className="text-emerald-500" />
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
          <div className="grid grid-cols-1 gap-3">
            {localItems.map((item) => {
              const product = products.find(p => p.id === item.productId);
              return (
                <div key={item.productId} className="p-5 bg-zinc-950/50 rounded-3xl border border-zinc-800 flex items-center gap-6 group hover:border-zinc-700 transition-colors">
                  <div className="w-16 h-16 rounded-2xl border border-zinc-800 shrink-0 overflow-hidden bg-zinc-900 flex items-center justify-center shadow-inner">
                    {product?.imageUrl ? <img src={product.imageUrl} className="w-full h-full object-cover" /> : <Package className="text-zinc-700" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-zinc-100 uppercase text-xs truncate">{product?.name || 'Produto'}</p>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase mt-1 tracking-widest italic">SKU: {product?.sku || product?.barcode || 'N/A'}</p>
                    <p className="text-[11px] font-black text-indigo-400 mt-2">R$ {item.price.toFixed(2)} / un</p>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="flex items-center bg-zinc-950 rounded-2xl border border-zinc-800 p-1 shadow-inner">
                      <button 
                        onClick={() => handleUpdateQty(item.productId, item.quantity - 1)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-red-400 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="w-12 text-center font-black text-zinc-100 text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => handleUpdateQty(item.productId, item.quantity + 1)}
                        className="w-10 h-10 flex items-center justify-center text-zinc-500 hover:text-emerald-400 transition-colors"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.productId)}
                      className="text-[8px] font-black text-zinc-700 uppercase tracking-widest hover:text-red-500 transition-colors"
                    >
                      Remover Item
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
           <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1 italic opacity-60">Novo Subtotal do Pedido</p>
              <p className="text-2xl font-black text-zinc-100">R$ {localItems.reduce((acc, i) => acc + (i.price * i.quantity), 0).toFixed(2)}</p>
           </div>
           <button 
             onClick={handleSaveEdition}
             className="px-10 py-5 bg-zinc-800 text-zinc-400 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all border border-zinc-700 hover:border-emerald-500 shadow-xl"
           >
             Atualizar Pedido
           </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ResultsView({ 
  sales, 
  products, 
  customers, 
  cashierSession,
  canEdit,
  currentUser
}: { 
  sales: Sale[], 
  products: Product[], 
  customers: Customer[], 
  cashierSession: any,
  canEdit: boolean,
  currentUser: SystemUser | null
}) {
  const [tab, setTab] = useState<'billing' | 'cashier' | 'bestsellers' | 'customers'>('billing');
  const now = new Date();
  const [filterYear, setFilterYear] = useState(now.getFullYear().toString());
  const [filterMonth, setFilterMonth] = useState((now.getMonth() + 1).toString().padStart(2, '0'));
  const [filterDay, setFilterDay] = useState(now.getDate().toString().padStart(2, '0'));

  const filteredSalesData = useMemo(() => {
    let list = [...sales];
    
    const isAdmin = currentUser?.id === 'admin' || (currentUser && currentUser.roleId === 'role-gerente');
    if (!isAdmin) {
      list = list.filter(s => s.soldByUserId === currentUser?.id);
    }

    return list.filter(s => {
      const d = new Date(s.date);
      const y = d.getFullYear().toString() === filterYear;
      const m = (d.getMonth() + 1).toString().padStart(2, '0') === filterMonth;
      const dayMatch = filterDay ? d.getDate().toString().padStart(2, '0') === filterDay : true;
      return y && m && dayMatch;
    });
  }, [sales, filterYear, filterMonth, filterDay, currentUser]);

  const billingData = useMemo(() => {
    const data: any[] = [];
    const daysInMonth = new Date(parseInt(filterYear), parseInt(filterMonth), 0).getDate();
    
    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = i.toString().padStart(2, '0');
        const daySales = filteredSalesData.filter(s => new Date(s.date).getDate() === i);
        const total = daySales.reduce((acc, s) => acc + s.total, 0);
        data.push({ name: dayStr, total });
    }
    return data;
  }, [filteredSalesData, filterYear, filterMonth]);

  const bestSellersData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredSalesData.forEach(s => {
        s.items.forEach(item => {
            counts[item.productId] = (counts[item.productId] || 0) + item.quantity;
        });
    });
    return Object.entries(counts)
        .map(([id, qty]) => {
            const p = products.find(prod => prod.id === id);
            return { name: p?.name || 'Inexistente', value: qty };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  }, [filteredSalesData, products]);

  const customerProfitData = useMemo(() => {
    const profits: Record<string, number> = {};
    filteredSalesData.forEach(s => {
        if (s.customerId) {
            profits[s.customerId] = (profits[s.customerId] || 0) + s.total;
        }
    });
    return Object.entries(profits)
        .map(([id, profit]) => {
            const c = customers.find(cust => cust.id === id);
            return { name: c?.name || 'Venda Avulsa', value: profit };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);
  }, [filteredSalesData, customers]);

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex flex-col items-center gap-4">
        <div className="text-center">
          <h3 className="text-xl font-black text-zinc-100 uppercase tracking-tighter">Resultados do Negócio</h3>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest italic">Análise de Performance</p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900 p-2 rounded-2xl border border-zinc-800 shadow-sm mx-auto">
           <select value={filterYear ?? new Date().getFullYear().toString()} onChange={e => setFilterYear(e.target.value)} className="p-2 text-[10px] font-black uppercase outline-none bg-transparent text-zinc-100">
              {[2024, 2025, 2026].map(y => <option key={y} value={y} className="bg-zinc-900">{y}</option>)}
           </select>
           <select value={filterMonth ?? (new Date().getMonth() + 1).toString().padStart(2, '0')} onChange={e => setFilterMonth(e.target.value)} className="p-2 text-[10px] font-black uppercase outline-none bg-transparent text-zinc-100">
              {['01','02','03','04','05','06','07','08','09','10','11','12'].map(m => (
                  <option key={m} value={m} className="bg-zinc-900">{m}</option>
              ))}
           </select>
           <div className="w-12">
             <input 
              type="text" 
              value={filterDay} 
              onChange={e => setFilterDay(e.target.value)} 
              placeholder="Dia" 
              className="w-full p-2 text-[10px] font-black uppercase outline-none text-center bg-transparent text-zinc-100"
             />
           </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 pb-2">
        {( [
          { id: 'billing', label: 'Faturamento', icon: TrendingUp },
          { id: 'cashier', label: 'Caixa', icon: Calculator },
          { id: 'bestsellers', label: 'Mais Vendidos', icon: Package },
          { id: 'customers', label: 'Clientes', icon: Users }
        ] as const).map(t => (
          <button 
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all whitespace-nowrap ${tab === t.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'bg-zinc-900 text-zinc-500 border border-zinc-800 hover:border-zinc-700'}`}
          >
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Vendas Totais</p>
            <p className="text-2xl font-black text-zinc-100 tracking-tighter">R$ {filteredSalesData.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Qtd Vendas</p>
            <p className="text-2xl font-black text-zinc-400 tracking-tighter">{filteredSalesData.length}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Ticket Médio</p>
            <p className="text-2xl font-black text-blue-400 tracking-tighter">R$ {filteredSalesData.length > 0 ? (filteredSalesData.reduce((acc, s) => acc + s.total, 0) / filteredSalesData.length).toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : '0,00'}</p>
        </div>
        <div className="bg-zinc-900 p-6 rounded-3xl border border-zinc-800 shadow-sm">
            <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1">Itens Vendidos</p>
            <p className="text-2xl font-black text-orange-400 tracking-tighter">{filteredSalesData.reduce((acc, s) => acc + s.items.reduce((a, i) => a + i.quantity, 0), 0)}</p>
        </div>
      </div>

      <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 shadow-sm min-h-[400px]">
        {tab === 'billing' && (
           <div className="h-[350px] w-full">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest">Evolução de Faturamento Diário</h4>
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={billingData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                    <XAxis dataKey="name" fontSize={10} fontStyle="italic" stroke="#71717a" />
                    <YAxis fontSize={10} fontStyle="italic" stroke="#71717a" />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', color: '#f4f4f5', fontSize: '10px' }} />
                    <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                 </BarChart>
              </ResponsiveContainer>
           </div>
        )}

        {tab === 'bestsellers' && (
           <div className="h-[350px] w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div>
                <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest">Top 10 Produtos (Volume)</h4>
                <div className="space-y-4">
                  {bestSellersData.length > 0 ? bestSellersData.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                       <span className="text-[10px] font-bold text-zinc-400 uppercase truncate w-32">{item.name}</span>
                       <div className="flex-1 mx-4 h-2 bg-zinc-950 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${bestSellersData[0]?.value ? (item.value / bestSellersData[0].value) * 100 : 0}%` }}></div>
                       </div>
                       <span className="text-[10px] font-black text-zinc-100">{item.value} unid</span>
                    </div>
                  )) : (
                    <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-600 space-y-2">
                       <Package size={32} className="opacity-20" />
                       <p className="italic text-[10px] uppercase font-black tracking-widest">Sem vendas registradas</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={bestSellersData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                    >
                      {bestSellersData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '1rem', color: '#f4f4f5' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
           </div>
        )}

        {tab === 'customers' && (
           <div className="h-[350px] w-full flex flex-col">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest">Ranking de Clientes (Mais Rentáveis)</h4>
              <div className="grid grid-cols-1 gap-4">
                 {customerProfitData.length > 0 ? customerProfitData.map((item, idx) => (
                   <div key={idx} className="flex items-center gap-4 bg-zinc-950 p-4 rounded-2xl border border-zinc-800/50">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${idx < 3 ? 'bg-amber-500/10 text-amber-500' : 'bg-zinc-800 text-zinc-500'}`}>
                         {idx + 1}
                      </div>
                      <div className="flex-1">
                         <p className="text-[10px] font-black uppercase text-zinc-100">{item.name}</p>
                         <p className="text-[8px] font-bold text-zinc-500 uppercase italic">Participação na Receita</p>
                      </div>
                      <p className="text-[12px] font-black text-blue-400">R$ {item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                   </div>
                 )) : (
                   <div className="py-20 text-center flex flex-col items-center justify-center text-zinc-600 space-y-2">
                       <Users size={32} className="opacity-20" />
                       <p className="italic text-[10px] uppercase font-black tracking-widest">Nenhum dado de cliente disponível</p>
                    </div>
                 )}
              </div>
           </div>
        )}

        {tab === 'cashier' && (
           <div className="h-[350px] w-full flex flex-col">
              <h4 className="text-[10px] font-black uppercase text-zinc-500 mb-6 tracking-widest">Resumo de Movimentação de Caixa</h4>
              <div className="flex-1 flex flex-col items-center justify-center text-zinc-600 italic text-[10px] space-y-4">
                 <Calculator size={48} className="opacity-20" />
                 <p className="text-center max-w-[200px] uppercase font-black tracking-widest opacity-40">Fluxo de caixa consolidado para {filterMonth}/{filterYear}.</p>
                 <div className="w-full max-w-xs space-y-2 mt-4">
                    <div className="flex justify-between bg-blue-500/10 text-blue-400 p-3 rounded-xl font-black border border-blue-500/20">
                       <span>ENTRADAS</span>
                       <span>R$ {filteredSalesData.reduce((acc, s) => acc + s.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between bg-red-500/10 text-red-400 p-3 rounded-xl font-black border border-red-500/20">
                       <span>SAÍDAS / CANC.</span>
                       <span>R$ 0,00</span>
                    </div>
                 </div>
              </div>
           </div>
        )}
     </div>
  </div>
);
}

