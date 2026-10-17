import fs from 'fs';
import path from 'path';
import {
  User,
  Product,
  InventoryBatch,
  RepInventory,
  Client,
  Invoice,
  InvoiceItem,
  ReturnItem,
  Collection,
  Settlement,
  BatchStatus,
} from '@/types';

interface DatabaseSchema {
  users: User[];
  products: Product[];
  batches: InventoryBatch[];
  repInventory: RepInventory[];
  clients: Client[];
  invoices: Invoice[];
  returns: ReturnItem[];
  collections: Collection[];
  settlements: Settlement[];
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'al_waseet_db.json');

// Helper to calculate expiry date based on shelf life
export function calculateExpiry(productionDateStr: string, shelfLifeDays: number): string {
  const prodDate = new Date(productionDateStr);
  const expDate = new Date(prodDate.getTime() + shelfLifeDays * 24 * 60 * 60 * 1000);
  return expDate.toISOString();
}

// Helper to determine status based on expiry date
export function determineBatchStatus(expiryDateStr: string, remainingQty: number): BatchStatus {
  if (remainingQty <= 0) return 'depleted';
  const now = new Date().getTime();
  const exp = new Date(expiryDateStr).getTime();
  const diffHours = (exp - now) / (1000 * 60 * 60);

  if (diffHours < 0) return 'expired';
  if (diffHours <= 48) return 'expiring_soon';
  return 'active';
}

function getInitialData(): DatabaseSchema {
  const users: User[] = [
    {
      id: 'usr_admin',
      name: 'محمود عبد الله (المدير العام)',
      username: 'admin',
      password: '123',
      role: 'admin',
      isActive: true,
      phone: '01000000001',
      assignedRoute: 'المركز الرئيسي - الإدارة العامة',
      createdAt: new Date().toISOString(),
    },
  ];

  return {
    users,
    products: [],
    batches: [],
    repInventory: [],
    clients: [],
    invoices: [],
    returns: [],
    collections: [],
    settlements: [],
  };
}

// In-Memory & File Store with Atomic Locking
class DatabaseStore {
  private data: DatabaseSchema;
  private isLoaded = false;
  private writeLock = Promise.resolve();
  private lastModified: number = Date.now();

  constructor() {
    this.data = getInitialData();
  }

  public getLastModified(): number {
    return this.lastModified;
  }

  public touch(): void {
    this.lastModified = Date.now();
  }

  private ensureDir() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  private load() {
    if (this.isLoaded) return;
    try {
      this.ensureDir();
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(raw);
        // Seamlessly migrate admin name if it had old name
        const adminUser = this.data.users?.find((u) => u.username === 'admin');
        if (adminUser && adminUser.name.includes('محمد')) {
          adminUser.name = 'محمود عبد الله (المدير العام)';
          this.persist();
        }
      } else {
        this.data = getInitialData();
        this.persist();
      }
      this.isLoaded = true;
    } catch (e) {
      console.error('Failed to load database file, using fallback seeded state:', e);
      this.data = getInitialData();
      this.isLoaded = true;
    }
  }

  private persist() {
    try {
      this.ensureDir();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write database file:', e);
    }
  }

  // Atomic transaction runner: ensures sequential execution preventing race conditions
  public async transaction<T>(fn: (db: DatabaseSchema) => Promise<T> | T): Promise<T> {
    this.load();
    let result: T;
    let thrownError: any = null;

    // Chain onto the lock, catching any previous error so future transactions proceed
    this.writeLock = this.writeLock
      .catch(() => {})
      .then(async () => {
        try {
          result = await fn(this.data);
          this.lastModified = Date.now();
          this.persist();
        } catch (err) {
          thrownError = err;
        }
      });

    await this.writeLock;
    if (thrownError) {
      throw thrownError;
    }
    return result!;
  }

  // -------------------------------------------------------------
  // USERS
  // -------------------------------------------------------------
  async getUsers(): Promise<User[]> {
    this.load();
    return this.data.users;
  }

  async getUserById(id: string): Promise<User | null> {
    this.load();
    return this.data.users.find((u) => u.id === id) || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    this.load();
    return this.data.users.find((u) => u.username.toLowerCase() === username.toLowerCase().trim()) || null;
  }

  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    return this.transaction((db) => {
      const existing = db.users.find((u) => u.username.toLowerCase() === user.username.toLowerCase().trim());
      if (existing) {
        throw new Error('اسم المستخدم مسجل مسبقاً، يرجى اختيار اسم مستخدم آخر');
      }

      const newUser: User = {
        ...user,
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        createdAt: new Date().toISOString(),
      };
      db.users.push(newUser);
      return newUser;
    });
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    return this.transaction((db) => {
      const idx = db.users.findIndex((u) => u.id === id);
      if (idx === -1) throw new Error('المستخدم غير موجود');
      const updated = { ...db.users[idx], ...updates };
      db.users[idx] = updated;
      return updated;
    });
  }

  // -------------------------------------------------------------
  // PRODUCTS & BATCHES (FIFO)
  // -------------------------------------------------------------
  async getProducts(): Promise<Product[]> {
    this.load();
    return this.data.products;
  }

  async createProduct(product: Omit<Product, 'id' | 'createdAt'>): Promise<Product> {
    return this.transaction((db) => {
      const newProd: Product = {
        ...product,
        id: `prd_${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      db.products.push(newProd);
      return newProd;
    });
  }

  async getBatches(): Promise<(InventoryBatch & { product: Product; hoursRemaining: number })[]> {
    this.load();
    const now = new Date().getTime();
    return this.data.batches.map((b) => {
      const prod = this.data.products.find((p) => p.id === b.productId)!;
      const expTime = new Date(b.expiryDate).getTime();
      const hoursRemaining = Math.round((expTime - now) / (1000 * 60 * 60));
      const status = determineBatchStatus(b.expiryDate, b.quantity);
      return {
        ...b,
        status,
        product: prod,
        hoursRemaining,
      };
    });
  }

  async createBatch(data: {
    productId: string;
    batchNumber: string;
    quantity: number;
    productionDate: string;
  }): Promise<InventoryBatch> {
    return this.transaction((db) => {
      const prod = db.products.find((p) => p.id === data.productId);
      if (!prod) throw new Error('المنتج المحدد غير موجود');

      const expiryDate = calculateExpiry(data.productionDate, prod.shelfLifeDays);
      const status = determineBatchStatus(expiryDate, data.quantity);

      const newBatch: InventoryBatch = {
        id: `bat_${Date.now()}`,
        productId: data.productId,
        batchNumber: data.batchNumber || `BATCH-${Date.now().toString().slice(-6)}`,
        initialQuantity: data.quantity,
        quantity: data.quantity,
        productionDate: data.productionDate,
        expiryDate,
        status,
        createdAt: new Date().toISOString(),
      };

      db.batches.push(newBatch);
      return newBatch;
    });
  }

  // -------------------------------------------------------------
  // VAN INVENTORY & DISPATCH (تحويل العهدة للسيارة)
  // -------------------------------------------------------------
  async getRepVanStock(repId: string): Promise<
    (RepInventory & {
      product: Product;
      batch: InventoryBatch;
      hoursRemaining: number;
    })[]
  > {
    this.load();
    const now = new Date().getTime();
    const items = this.data.repInventory.filter((r) => r.repId === repId && r.quantity > 0);

    return items
      .map((item) => {
        const product = this.data.products.find((p) => p.id === item.productId)!;
        const batch = this.data.batches.find((b) => b.id === item.batchId)!;
        const expTime = new Date(batch.expiryDate).getTime();
        const hoursRemaining = Math.round((expTime - now) / (1000 * 60 * 60));

        return {
          ...item,
          product,
          batch,
          hoursRemaining,
        };
      })
      .sort((a, b) => new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime());
  }

  // Atomic dispatch from warehouse to rep's van
  async dispatchStockToRep(data: {
    repId: string;
    batchId: string;
    quantity: number;
  }): Promise<{ success: boolean; message: string }> {
    return this.transaction((db) => {
      const batch = db.batches.find((b) => b.id === data.batchId);
      if (!batch) throw new Error('التشغيلة المحددة غير موجودة بالمستودع');
      if (batch.quantity < data.quantity) {
        throw new Error(
          `الكمية المتاحة في المستودع (${batch.quantity}) أقل من الكمية المطلوبة للتحويل (${data.quantity})`
        );
      }

      // Check rep
      const rep = db.users.find((u) => u.id === data.repId && u.role === 'rep');
      if (!rep) throw new Error('المندوب المحدد غير موجود');

      // Deduct from warehouse batch
      batch.quantity -= data.quantity;
      if (batch.quantity === 0) batch.status = 'depleted';

      // Add to rep's van stock
      let repItem = db.repInventory.find(
        (r) => r.repId === data.repId && r.batchId === data.batchId
      );

      if (repItem) {
        repItem.quantity += data.quantity;
        repItem.updatedAt = new Date().toISOString();
      } else {
        db.repInventory.push({
          id: `rep_inv_${Date.now()}`,
          repId: data.repId,
          productId: batch.productId,
          batchId: batch.id,
          quantity: data.quantity,
          updatedAt: new Date().toISOString(),
        });
      }

      return {
        success: true,
        message: `تم تحويل ${data.quantity} كرتونة إلى سيارة المندوب ${rep.name} بنجاح`,
      };
    });
  }

  // -------------------------------------------------------------
  // CLIENTS & OUTLETS (إدارة المنافذ والعملاء)
  // -------------------------------------------------------------
  async getClients(): Promise<Client[]> {
    this.load();
    return this.data.clients;
  }

  async getClientById(id: string): Promise<Client | null> {
    this.load();
    return this.data.clients.find((c) => c.id === id) || null;
  }

  async createClient(client: {
    name: string;
    phone?: string;
    address?: string;
    creditBalance?: number;
  }): Promise<Client> {
    return this.transaction((db) => {
      if (!client.name || !client.name.trim()) {
        throw new Error('اسم المنفذ / العميل إجباري ومطلوب');
      }
      const newClient: Client = {
        id: `clt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: client.name.trim(),
        phone: client.phone?.trim() || '',
        address: client.address?.trim() || '',
        creditBalance: client.creditBalance || 0,
        createdAt: new Date().toISOString(),
      };
      db.clients.unshift(newClient);
      return newClient;
    });
  }

  async updateClient(id: string, updates: Partial<Client>): Promise<Client> {
    return this.transaction((db) => {
      const idx = db.clients.findIndex((c) => c.id === id);
      if (idx === -1) throw new Error('المنفذ غير مسجل بالنظام');
      const updated = { ...db.clients[idx], ...updates };
      db.clients[idx] = updated;
      return updated;
    });
  }

  async deleteClient(id: string): Promise<boolean> {
    return this.transaction((db) => {
      const hasInvoices = db.invoices.some((i) => i.clientId === id);
      if (hasInvoices) {
        throw new Error('لا يمكن حذف هذا المنفذ لوجود فواتير مبيعات سابقة مسجلة باسمه');
      }
      db.clients = db.clients.filter((c) => c.id !== id);
      return true;
    });
  }

  // -------------------------------------------------------------
  // INVOICING (فاتورة مبيعات بنظام FIFO الفوري مع دعم الخصم)
  // -------------------------------------------------------------
  async createInvoice(data: {
    repId: string;
    clientId: string;
    paymentType: 'cash' | 'credit';
    paidAmount?: number;
    discount?: number;
    notes?: string;
    items: {
      productId: string;
      quantity: number;
    }[];
  }): Promise<Invoice> {
    return this.transaction((db) => {
      const rep = db.users.find((u) => u.id === data.repId);
      if (!rep) throw new Error('المندوب غير مسجل');

      const client = db.clients.find((c) => c.id === data.clientId);
      if (!client) throw new Error('العميل أو المنفذ المحدد غير موجود');

      if (!data.items || data.items.length === 0) {
        throw new Error('يجب إضافة منتج واحد على الأقل في الفاتورة');
      }

      const invoiceId = `inv_${Date.now()}`;
      const invoiceNumber = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      let subtotal = 0;
      const invoiceItems: InvoiceItem[] = [];

      // Process each requested product using FIFO from the rep's vehicle batches
      for (const reqItem of data.items) {
        const product = db.products.find((p) => p.id === reqItem.productId);
        if (!product) throw new Error(`المنتج ${reqItem.productId} غير معرف`);

        let neededQty = reqItem.quantity;
        if (neededQty <= 0) continue;

        // Find available batches for this product in rep's van, sorted by earliest expiry (FIFO!)
        const availableVanBatches = db.repInventory
          .filter((r) => r.repId === data.repId && r.productId === reqItem.productId && r.quantity > 0)
          .map((r) => {
            const batch = db.batches.find((b) => b.id === r.batchId)!;
            return {
              repInvItem: r,
              batch,
            };
          })
          .sort((a, b) => new Date(a.batch.expiryDate).getTime() - new Date(b.batch.expiryDate).getTime());

        const totalVanStock = availableVanBatches.reduce((sum, item) => sum + item.repInvItem.quantity, 0);

        if (totalVanStock < neededQty) {
          throw new Error(
            `الكمية المتاحة في سيارتك من "${product.name}" (${totalVanStock}) لا تكفي للكمية المطلوبة (${neededQty})`
          );
        }

        // Deduct from batches starting from earliest expiry (FIFO)
        for (const item of availableVanBatches) {
          if (neededQty <= 0) break;

          const deductQty = Math.min(item.repInvItem.quantity, neededQty);
          item.repInvItem.quantity -= deductQty;
          neededQty -= deductQty;

          const itemTotal = deductQty * product.price;
          subtotal += itemTotal;

          invoiceItems.push({
            id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            invoiceId,
            productId: product.id,
            batchId: item.batch.id,
            quantity: deductQty,
            unitPrice: product.price,
            totalPrice: itemTotal,
          });
        }
      }

      const discount = Math.max(0, data.discount || 0);
      const totalAmount = Math.max(0, subtotal - discount);

      const paid = data.paymentType === 'cash' ? totalAmount : (data.paidAmount ?? 0);
      const remainingUnpaid = Math.max(0, totalAmount - paid);

      // Update client credit balance
      if (remainingUnpaid > 0) {
        client.creditBalance += remainingUnpaid;
      }

      const invoice: Invoice = {
        id: invoiceId,
        invoiceNumber,
        repId: data.repId,
        clientId: data.clientId,
        subtotal,
        discount,
        totalAmount,
        paidAmount: paid,
        paymentType: data.paymentType,
        notes: data.notes || '',
        createdAt: new Date().toISOString(),
        items: invoiceItems,
      };

      db.invoices.unshift(invoice);
      return invoice;
    });
  }

  // -------------------------------------------------------------
  // RETURNS (المرتجعات)
  // -------------------------------------------------------------
  async createReturn(data: {
    repId: string;
    productId: string;
    quantity: number;
    reason: 'expired' | 'damaged';
    notes?: string;
    invoiceId?: string;
  }): Promise<ReturnItem> {
    return this.transaction((db) => {
      const rep = db.users.find((u) => u.id === data.repId);
      if (!rep) throw new Error('المندوب غير مسجل');

      const product = db.products.find((p) => p.id === data.productId);
      if (!product) throw new Error('المنتج المحدد غير موجود');

      const newReturn: ReturnItem = {
        id: `ret_${Date.now()}`,
        repId: data.repId,
        productId: data.productId,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes,
        invoiceId: data.invoiceId,
        createdAt: new Date().toISOString(),
      };

      db.returns.unshift(newReturn);
      return newReturn;
    });
  }

  // -------------------------------------------------------------
  // COLLECTIONS (التحصيلات النقدية)
  // -------------------------------------------------------------
  async createCollection(data: {
    repId: string;
    clientId: string;
    amount: number;
    notes?: string;
  }): Promise<Collection> {
    return this.transaction((db) => {
      const client = db.clients.find((c) => c.id === data.clientId);
      if (!client) throw new Error('العميل غير موجود');

      // Reduce client balance
      client.creditBalance = Math.max(0, client.creditBalance - data.amount);

      const col: Collection = {
        id: `col_${Date.now()}`,
        repId: data.repId,
        clientId: data.clientId,
        amount: data.amount,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      db.collections.unshift(col);
      return col;
    });
  }

  // -------------------------------------------------------------
  // INVOICES & REPORTS
  // -------------------------------------------------------------
  async getInvoices(filters?: { repId?: string; clientId?: string } | string): Promise<
    (Invoice & {
      client: Client;
      rep: User;
      itemsWithProducts: (InvoiceItem & { product: Product })[];
    })[]
  > {
    this.load();
    let list = this.data.invoices;
    const repId = typeof filters === 'string' ? filters : filters?.repId;
    const clientId = typeof filters === 'object' ? filters?.clientId : undefined;

    if (repId) {
      list = list.filter((i) => i.repId === repId);
    }
    if (clientId) {
      list = list.filter((i) => i.clientId === clientId);
    }

    return list.map((inv) => ({
      ...inv,
      client: this.data.clients.find((c) => c.id === inv.clientId) || {
        id: inv.clientId,
        name: 'عميل غير مسجل',
        creditBalance: 0,
        createdAt: '',
      },
      rep: this.data.users.find((u) => u.id === inv.repId) || {
        id: inv.repId,
        name: 'مندوب سابق',
        username: '',
        password: '',
        role: 'rep',
        isActive: false,
        createdAt: '',
      },
      itemsWithProducts: inv.items.map((it) => ({
        ...it,
        product: this.data.products.find((p) => p.id === it.productId) || {
          id: it.productId,
          name: 'صنف',
          category: 'dairy',
          shelfLifeDays: 1,
          price: it.unitPrice,
          cost: 0,
          unit: 'كرتونة',
          createdAt: '',
        },
      })),
    }));
  }

  async getCollections(repId?: string): Promise<
    (Collection & {
      client: Client;
      rep: User;
    })[]
  > {
    this.load();
    let list = this.data.collections;
    if (repId) {
      list = list.filter((c) => c.repId === repId);
    }
    return list.map((col) => ({
      ...col,
      client: this.data.clients.find((c) => c.id === col.clientId)!,
      rep: this.data.users.find((u) => u.id === col.repId)!,
    }));
  }

  async getReturns(repId?: string): Promise<
    (ReturnItem & {
      product: Product;
      rep: User;
    })[]
  > {
    this.load();
    let list = this.data.returns;
    if (repId) {
      list = list.filter((r) => r.repId === repId);
    }
    return list.map((ret) => ({
      ...ret,
      product: this.data.products.find((p) => p.id === ret.productId)!,
      rep: this.data.users.find((u) => u.id === ret.repId)!,
    }));
  }

  // -------------------------------------------------------------
  // END-OF-DAY RECONCILIATION & SETTLEMENTS (تسوية نهاية اليوم)
  // -------------------------------------------------------------
  async getRepDaySummary(repId: string, dateStr?: string): Promise<{
    rep: User;
    todayInvoices: Invoice[];
    todayCashFromSales: number;
    todayCreditSales: number;
    todayCollections: number;
    expectedCash: number;
    currentVanStock: {
      product: Product;
      quantity: number;
    }[];
    todayReturns: ReturnItem[];
  }> {
    this.load();
    const rep = this.data.users.find((u) => u.id === repId);
    if (!rep) throw new Error('المندوب غير مسجل');

    const targetDate = dateStr || new Date().toISOString().split('T')[0];

    // Filter invoices created on this date
    const todayInvoices = this.data.invoices.filter(
      (inv) => inv.repId === repId && inv.createdAt.startsWith(targetDate)
    );

    const todayCashFromSales = todayInvoices
      .filter((i) => i.paymentType === 'cash')
      .reduce((sum, i) => sum + i.paidAmount, 0);

    const todayCreditPartialCash = todayInvoices
      .filter((i) => i.paymentType === 'credit')
      .reduce((sum, i) => sum + (i.paidAmount || 0), 0);

    const todayCreditSales = todayInvoices
      .filter((i) => i.paymentType === 'credit')
      .reduce((sum, i) => sum + (i.totalAmount - i.paidAmount), 0);

    const todayCollections = this.data.collections
      .filter((col) => col.repId === repId && col.createdAt.startsWith(targetDate))
      .reduce((sum, col) => sum + col.amount, 0);

    // Expected total cash that rep must hand in
    const expectedCash = todayCashFromSales + todayCreditPartialCash + todayCollections;

    // Remaining stock in vehicle
    const vanStockItems = this.data.repInventory.filter((r) => r.repId === repId && r.quantity > 0);
    const stockMap = new Map<string, number>();
    vanStockItems.forEach((item) => {
      stockMap.set(item.productId, (stockMap.get(item.productId) || 0) + item.quantity);
    });

    const currentVanStock = Array.from(stockMap.entries()).map(([productId, quantity]) => ({
      product: this.data.products.find((p) => p.id === productId)!,
      quantity,
    }));

    const todayReturns = this.data.returns.filter(
      (ret) => ret.repId === repId && ret.createdAt.startsWith(targetDate)
    );

    return {
      rep,
      todayInvoices,
      todayCashFromSales: todayCashFromSales + todayCreditPartialCash,
      todayCreditSales,
      todayCollections,
      expectedCash,
      currentVanStock,
      todayReturns,
    };
  }

  async saveSettlement(data: {
    repId: string;
    actualCash: number;
    stockDiscrepancies?: string;
    notes?: string;
  }): Promise<Settlement> {
    return this.transaction((db) => {
      const targetDate = new Date().toISOString().split('T')[0];
      const todayInvoices = db.invoices.filter(
        (inv) => inv.repId === data.repId && inv.createdAt.startsWith(targetDate)
      );

      const cashFromInvoices = todayInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);

      const collections = db.collections
        .filter((c) => c.repId === data.repId && c.createdAt.startsWith(targetDate))
        .reduce((sum, c) => sum + c.amount, 0);

      const expectedCash = cashFromInvoices + collections;
      const cashDifference = data.actualCash - expectedCash;
      const status = Math.abs(cashDifference) < 0.01 && !data.stockDiscrepancies ? 'balanced' : 'discrepancy';

      const settlement: Settlement = {
        id: `set_${Date.now()}`,
        repId: data.repId,
        date: new Date().toISOString(),
        expectedCash,
        actualCash: data.actualCash,
        cashDifference,
        stockDiscrepancies: data.stockDiscrepancies,
        status,
        notes: data.notes,
        createdAt: new Date().toISOString(),
      };

      db.settlements.unshift(settlement);
      return settlement;
    });
  }

  async getSettlements(): Promise<(Settlement & { rep: User })[]> {
    this.load();
    return this.data.settlements.map((s) => ({
      ...s,
      rep: this.data.users.find((u) => u.id === s.repId) || {
        id: s.repId,
        name: 'مندوب',
        username: '',
        password: '',
        role: 'rep',
        isActive: false,
        createdAt: '',
      },
    }));
  }

  // -------------------------------------------------------------
  // ANALYTICS & DASHBOARD KPIS
  // -------------------------------------------------------------
  async getAnalytics() {
    this.load();
    const todayStr = new Date().toISOString().split('T')[0];

    const todayInvoices = this.data.invoices.filter((i) => i.createdAt.startsWith(todayStr));
    const todaySalesAmount = todayInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const todayCashCollected =
      todayInvoices.reduce((sum, i) => sum + i.paidAmount, 0) +
      this.data.collections
        .filter((c) => c.createdAt.startsWith(todayStr))
        .reduce((sum, c) => sum + c.amount, 0);

    const activeReps = this.data.users.filter((u) => u.role === 'rep' && u.isActive).length;

    // Critical Expiry Batches: Dairy expiring in <= 24h, Juices expiring in <= 48h
    const now = new Date().getTime();
    const criticalBatches = this.data.batches
      .filter((b) => b.quantity > 0)
      .map((b) => {
        const prod = this.data.products.find((p) => p.id === b.productId)!;
        const expTime = new Date(b.expiryDate).getTime();
        const hoursRemaining = Math.round((expTime - now) / (1000 * 60 * 60));
        return {
          ...b,
          product: prod,
          hoursRemaining,
        };
      })
      .filter((b) => {
        if (b.product.category === 'dairy' && b.hoursRemaining <= 24) return true;
        if (b.product.category === 'juice' && b.hoursRemaining <= 48) return true;
        return false;
      })
      .sort((a, b) => a.hoursRemaining - b.hoursRemaining);

    // Top Selling Products
    const productSalesMap = new Map<string, { product: Product; quantitySold: number; totalRevenue: number }>();
    this.data.invoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = this.data.products.find((p) => p.id === item.productId);
        if (!prod) return;
        const current = productSalesMap.get(prod.id) || {
          product: prod,
          quantitySold: 0,
          totalRevenue: 0,
        };
        current.quantitySold += item.quantity;
        current.totalRevenue += item.totalPrice;
        productSalesMap.set(prod.id, current);
      });
    });

    const topProducts = Array.from(productSalesMap.values()).sort((a, b) => b.quantitySold - a.quantitySold);

    // Top Clients by purchase volume
    const clientSalesMap = new Map<string, { client: Client; totalPurchases: number; invoiceCount: number }>();
    this.data.invoices.forEach((inv) => {
      const client = this.data.clients.find((c) => c.id === inv.clientId);
      if (!client) return;
      const current = clientSalesMap.get(client.id) || {
        client,
        totalPurchases: 0,
        invoiceCount: 0,
      };
      current.totalPurchases += inv.totalAmount;
      current.invoiceCount += 1;
      clientSalesMap.set(client.id, current);
    });

    const topClients = Array.from(clientSalesMap.values()).sort((a, b) => b.totalPurchases - a.totalPurchases);

    // Live Reps tracking
    const repPerformance = this.data.users
      .filter((u) => u.role === 'rep')
      .map((rep) => {
        const repTodayInvoices = this.data.invoices.filter(
          (i) => i.repId === rep.id && i.createdAt.startsWith(todayStr)
        );
        const repTodaySales = repTodayInvoices.reduce((s, i) => s + i.totalAmount, 0);
        const repTodayCash = repTodayInvoices.reduce((s, i) => s + i.paidAmount, 0);
        const repVanUnits = this.data.repInventory
          .filter((r) => r.repId === rep.id)
          .reduce((s, r) => s + r.quantity, 0);

        return {
          rep,
          todaySales: repTodaySales,
          todayCash: repTodayCash,
          vanUnitsRemaining: repVanUnits,
          invoicesCount: repTodayInvoices.length,
        };
      });

    return {
      todaySalesAmount,
      todayCashCollected,
      activeReps,
      criticalBatches,
      topProducts,
      topClients,
      repPerformance,
      totalInvoicesCount: this.data.invoices.length,
    };
  }
}

export const dbStore = new DatabaseStore();
