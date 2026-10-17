export type Role = 'admin' | 'rep';

export type ProductCategory = string;

export interface Category {
  id: string;
  name: string;
  defaultShelfLifeDays: number;
  createdAt: string;
}

export type BatchStatus = 'active' | 'expiring_soon' | 'expired' | 'depleted';

export type PaymentType = 'cash' | 'credit';

export type ReturnReason = 'expired' | 'damaged';

export type SettlementStatus = 'balanced' | 'discrepancy';

export interface User {
  id: string;
  name: string;
  username: string;
  password: string; // bcrypt hash or plain for seeded quick login
  role: Role;
  isActive: boolean;
  phone?: string;
  assignedRoute?: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  shelfLifeDays: number; // Dairy: 1, Juice: 7-10, or custom
  price: number;
  cost: number;
  unit: string;
  createdAt: string;
}

export interface InventoryBatch {
  id: string;
  productId: string;
  batchNumber: string;
  initialQuantity: number;
  quantity: number; // Current remaining in main warehouse
  productionDate: string; // ISO string
  expiryDate: string; // ISO string
  status: BatchStatus;
  createdAt: string;
}

export interface RepInventory {
  id: string;
  repId: string;
  productId: string;
  batchId: string;
  quantity: number; // Current units inside rep vehicle
  updatedAt: string;
}

export interface Client {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  creditBalance: number;
  createdAt: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  batchId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  repId: string;
  clientId: string;
  subtotal: number;
  discount: number;
  totalAmount: number; // Net total after discount
  paidAmount: number;
  paymentType: PaymentType;
  notes?: string;
  createdAt: string;
  items: InvoiceItem[];
}

export interface ReturnItem {
  id: string;
  repId: string;
  invoiceId?: string;
  productId: string;
  batchId?: string;
  quantity: number;
  reason: ReturnReason;
  notes?: string;
  createdAt: string;
}

export interface Collection {
  id: string;
  repId: string;
  clientId: string;
  amount: number;
  notes?: string;
  createdAt: string;
}

export interface Settlement {
  id: string;
  repId: string;
  date: string;
  expectedCash: number;
  actualCash: number;
  cashDifference: number;
  stockDiscrepancies?: string;
  status: SettlementStatus;
  notes?: string;
  createdAt: string;
}

// Session User type for JWT & client auth
export interface SessionUser {
  id: string;
  name: string;
  username: string;
  role: Role;
  assignedRoute?: string;
}
