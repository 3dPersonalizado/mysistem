
import { db } from './db';

// Chaves para o LocalStorage
export const STORAGE_KEYS = {
  PRODUCTS: 'pdv_products',
  SALES: 'pdv_sales',
  CUSTOMERS: 'pdv_customers',
  CATEGORIES: 'pdv_categories',
  SUBCATEGORIES: 'pdv_subcategories',
  PAYMENT_METHODS: 'pdv_payment_methods',
  CUSTOM_PAYMENT_METHODS: 'pdv_custom_payment_methods',
  DELIVERY_CHANNELS: 'pdv_delivery_channels',
  DELIVERY_METHODS: 'pdv_delivery_methods',
  CLOSED_SESSIONS: 'pdv_closed_sessions',
  CASHIER_SESSION: 'pdv_cashier_session',
  OPEN_SESSIONS: 'pdv_open_sessions',
  COMPANY_INFO: 'pdv_company_info',
  COUPON_CONFIG: 'pdv_coupon_config',
  COUPON_PDV_CONFIG: 'pdv_coupon_pdv_config',
  GREETING_COUPON_CONFIG: 'pdv_greeting_coupon_config',
  LABEL_CONFIG: 'pdv_label_config',
  PRINTERS: 'pdv_printers',
  REGISTERED_PRINTERS: 'pdv_registered_printers',
  USERS: 'pdv_users',
  ROLES: 'pdv_roles',
  ACTIVITIES: 'pdv_activities',
  HIDDEN_PAYMENT_METHODS: 'pdv_hidden_payment_methods',
  SELECTED_PRINTER: 'pdv_selected_printer',
  SELECTED_LABEL_PRINTER: 'pdv_selected_label_printer',
  REVENUES: 'pdv_revenues',
  PURCHASES: 'pdv_purchases',
  EXPENSES: 'pdv_expenses',
  INVENTORIES: 'pdv_inventories',
  PRODUCT_RECIPES: 'pdv_product_recipes',
  RAW_MATERIALS: 'pdv_raw_materials_structured',
  LOCAL_BACKUPS: 'pdv_local_backups',
  LAST_AUTO_BACKUP: 'pdv_last_auto_backup_date',
  CATALOG_DESCRIPTIONS: 'pdv_catalog_descriptions',
  SHOPKEEPERS: 'pdv_shopkeepers',
  SHOPKEEPER_DELIVERIES: 'pdv_shopkeeper_deliveries',
  GALLERY: 'pdv_gallery',
  PAYMENT_ICONS: 'pdv_payment_icons'
};

export interface GalleryItem {
  id: string;
  type: 'greeting' | 'customer' | 'product';
  category: string;
  name: string;
  url: string;
  createdAt: number;
  metadata?: any;
}

export interface LocalBackup {
  id: string;
  date: string;
  data: any;
  size: number;
}

/**
 * Salva um objeto sob uma chave específica no armazenamento local.
 * Funciona tanto no navegador quanto no Electron.
 */
export function salvarDados(key: string, data: any): boolean {
  try {
    if (!key) throw new Error('Chave de armazenamento não fornecida.');
    console.log("SALVANDO DADOS");
    console.log(`[Persistência] SALVANDO DADOS - Chave: ${key}`);
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);

    // Espelhamento para IndexedDB (Async side-effect)
    try {
      if (key === STORAGE_KEYS.PRODUCTS) {
        db.products.clear().then(() => { if(Array.isArray(data)) db.products.bulkAdd(data.map((p: any) => ({ ...p, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.CUSTOMERS) {
        db.customers.clear().then(() => { if(Array.isArray(data)) db.customers.bulkAdd(data.map((c: any) => ({ ...c, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.SALES) {
        db.sales.clear().then(() => { if(Array.isArray(data)) db.sales.bulkAdd(data.map((s: any) => ({ ...s, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.CATEGORIES) {
        db.categories.clear().then(() => { if(Array.isArray(data)) db.categories.bulkAdd(data.map((c: any) => ({ ...c, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.SUBCATEGORIES) {
        db.subcategories.clear().then(() => { if(Array.isArray(data)) db.subcategories.bulkAdd(data.map((s: any) => ({ ...s, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.EXPENSES) {
        db.expenses.clear().then(() => { if(Array.isArray(data)) db.expenses.bulkAdd(data.map((e: any) => ({ ...e, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.REVENUES) {
        db.revenues.clear().then(() => { if(Array.isArray(data)) db.revenues.bulkAdd(data.map((r: any) => ({ ...r, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.PURCHASES) {
        db.purchases.clear().then(() => { if(Array.isArray(data)) db.purchases.bulkAdd(data.map((p: any) => ({ ...p, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.RAW_MATERIALS) {
        db.raw_materials.clear().then(() => { if(Array.isArray(data)) db.raw_materials.bulkAdd(data.map((r: any) => ({ ...r, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.PRODUCT_RECIPES) {
        db.product_recipes.clear().then(() => { if(Array.isArray(data)) db.product_recipes.bulkAdd(data.map((r: any) => ({ ...r, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.DELIVERY_METHODS) {
        db.delivery_methods.clear().then(() => { if(Array.isArray(data)) db.delivery_methods.bulkAdd(data.map((m: any) => ({ ...m, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.ROLES) {
        db.roles.clear().then(() => { if(Array.isArray(data)) db.roles.bulkAdd(data.map((r: any) => ({ ...r, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.USERS) {
        db.system_users.clear().then(() => { if(Array.isArray(data)) db.system_users.bulkAdd(data.map((u: any) => ({ ...u, updatedAt: Date.now() }))) });
      } else if (key === STORAGE_KEYS.CASHIER_SESSION) {
        db.cashier_sessions.clear().then(() => { if(data) db.cashier_sessions.put({ ...data, updatedAt: Date.now() }) });
      } else if (key === STORAGE_KEYS.OPEN_SESSIONS) {
        // Mirrored as individual entries in Dexie if possible, or just the whole object
        db.cashier_sessions.clear().then(() => { 
          if(data && typeof data === 'object') {
            const sessions = Object.values(data);
            db.cashier_sessions.bulkAdd(sessions.map((s: any) => ({ ...s, updatedAt: Date.now() })));
          }
        });
      }
    } catch (dbError) {
      console.warn('[OfflineDB] Erro ao espelhar para IndexedDB:', dbError);
    }

    return true;
  } catch (error) {
    console.error(`[Persistência] Erro ao salvar dados na chave "${key}":`, error);
    return false;
  }
}

/**
 * Carrega e faz o parse de um objeto do armazenamento local.
 * Retorna o valor padrão se não encontrar a chave ou houver erro.
 */
export function carregarDados<T>(key: string, defaultValue: T): T {
  try {
    console.log("CARREGANDO DADOS");
    console.log(`[Persistência] CARREGANDO DADOS - Chave: ${key}`);
    const serializedData = localStorage.getItem(key);
    if (serializedData === null) {
      return defaultValue;
    }
    const parsedData = JSON.parse(serializedData);
    
    // Pequena validação para garantir que o tipo retornado não é nulo/undefined 
    // se o defaultValue for um objeto/array
    if (typeof defaultValue === 'object' && defaultValue !== null && parsedData === null) {
      return defaultValue;
    }
    
    return parsedData as T;
  } catch (error) {
    console.error(`[Persistência] Erro ao carregar dados da chave "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Salva o backup em arquivo (Electron)
 */
export async function salvarBackupArquivo(data: any): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI && electronAPI.saveBackup) {
    console.log('[Backup] Salvando backup em arquivo...');
    await electronAPI.saveBackup(data);
  }
}

/**
 * Carrega o backup do arquivo (Electron)
 */
export async function carregarBackupArquivo(): Promise<any | null> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI && electronAPI.loadBackup) {
    console.log('[Backup] Carregando backup do arquivo...');
    return await electronAPI.loadBackup();
  }
  return null;
}

/**
 * Exporta o backup via diálogo (Electron) ou download (Browser)
 */
export async function exportarBackup(data: any): Promise<void> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI && electronAPI.exportBackup) {
    const result = await electronAPI.exportBackup(data);
    if (result && result.success) {
      alert('Backup exportado com sucesso!');
    } else if (result && result.error) {
      alert('Erro ao exportar backup: ' + result.error);
    }
  } else {
    // Browser fallback
    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');
      const fileName = `backup_${dateStr}_{timeStr}.json`.replace('{timeStr}', timeStr);
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      alert('Backup gerado e baixado com sucesso!');
    } catch (error) {
      console.error('[Backup] Erro ao exportar no navegador:', error);
      alert('Erro ao exportar backup.');
    }
  }
}

/**
 * Importa o backup via diálogo (Electron) ou input (Browser)
 */
export async function importarBackup(): Promise<any | null> {
  const electronAPI = (window as any).electronAPI;
  if (electronAPI && electronAPI.importBackup) {
    return await electronAPI.importBackup();
  } else {
    // Browser fallback
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json';
      
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) {
          resolve(null);
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const result = event.target?.result as string;
          if (!result || result.trim() === '') {
            alert('O arquivo de backup está vazio.');
            resolve(null);
            return;
          }
          try {
            const data = JSON.parse(result);
            resolve(data);
          } catch (err) {
            console.error('[Backup] Erro ao ler arquivo:', err);
            alert('Arquivo inválido ou corrompido (Erro no JSON).');
            resolve(null);
          }
        };
        reader.onerror = () => {
          alert('Erro ao ler o arquivo.');
          resolve(null);
        };
        reader.readAsText(file);
      };

      input.click();
    });
  }
}

/**
 * Limpa uma chave específica ou todo o armazenamento
 */
export function limparDados(key?: string): void {
  try {
    if (key) {
      localStorage.removeItem(key);
    } else {
      localStorage.clear();
    }
  } catch (error) {
    console.error('[Persistência] Erro ao limpar dados:', error);
  }
}
