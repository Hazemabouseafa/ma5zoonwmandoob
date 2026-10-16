'use server';

import { revalidatePath } from 'next/cache';
import { dbStore, calculateExpiry } from './store';
import { signToken, setAuthCookie, clearAuthCookie, getCurrentUser } from './auth';

export async function loginAction(formData: FormData) {
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;

  if (!username || !password) {
    return { success: false, error: 'يرجى إدخال اسم المستخدم وكلمة المرور' };
  }

  const user = await dbStore.getUserByUsername(username);
  if (!user) {
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  if (!user.isActive) {
    return { success: false, error: 'هذا الحساب معطل حالياً من قِبل الإدارة' };
  }

  // Support direct password check for demo/seeded and fallback
  if (user.password !== password) {
    return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
  }

  const token = signToken(user);
  await setAuthCookie(token);

  return {
    success: true,
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      role: user.role,
    },
    redirectTo: user.role === 'admin' ? '/admin' : '/rep',
  };
}

export async function logoutAction() {
  await clearAuthCookie();
  return { success: true };
}

// ----------------------------------------------------
// ADMIN: Rep Management (إدارة المناديب)
// ----------------------------------------------------
export async function createRepAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const name = formData.get('name') as string;
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const phone = (formData.get('phone') as string) || '';
    const assignedRoute = (formData.get('assignedRoute') as string) || '';

    if (!name || !username || !password) {
      return { success: false, error: 'يرجى استكمال جميع الحقول المطلوبة' };
    }

    await dbStore.createUser({
      name,
      username,
      password,
      role: 'rep',
      isActive: true,
      phone,
      assignedRoute,
    });

    revalidatePath('/admin/reps');
    revalidatePath('/admin');
    return { success: true, message: 'تم إضافة المندوب بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء إضافة المندوب' };
  }
}

export async function toggleRepStatusAction(repId: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    await dbStore.updateUser(repId, { isActive: !currentStatus });
    revalidatePath('/admin/reps');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function resetRepPasswordAction(repId: string, newPass: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    if (!newPass || newPass.length < 3) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 3 أحرف' };
    }

    await dbStore.updateUser(repId, { password: newPass });
    revalidatePath('/admin/reps');
    return { success: true, message: 'تم تحديث كلمة المرور بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// ADMIN: Inventory & Batches (FIFO)
// ----------------------------------------------------
export async function createBatchAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    const productId = formData.get('productId') as string;
    const batchNumber = formData.get('batchNumber') as string;
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const productionDate = formData.get('productionDate') as string || new Date().toISOString();

    if (!productId || isNaN(quantity) || quantity <= 0) {
      return { success: false, error: 'بيانات التشغيلة غير صالحة' };
    }

    await dbStore.createBatch({
      productId,
      batchNumber,
      quantity,
      productionDate,
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    return { success: true, message: 'تم تسجيل التشغيلة الجديدة بنجاح بنظام FIFO' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createProductAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    const name = formData.get('name') as string;
    const category = formData.get('category') as 'dairy' | 'juice';
    const shelfLifeDays = parseInt(formData.get('shelfLifeDays') as string, 10) || (category === 'dairy' ? 1 : 7);
    const price = parseFloat(formData.get('price') as string);
    const cost = parseFloat(formData.get('cost') as string);
    const unit = (formData.get('unit') as string) || 'كرتونة';

    if (!name || isNaN(price) || isNaN(cost)) {
      return { success: false, error: 'يرجى التحقق من صحة البيانات والأسعار' };
    }

    await dbStore.createProduct({
      name,
      category,
      shelfLifeDays,
      price,
      cost,
      unit,
    });

    revalidatePath('/admin/inventory');
    return { success: true, message: 'تم إضافة المنتج الجديد بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// ADMIN: Dispatch to Rep Van (تحويل العهدة للسيارة)
// ----------------------------------------------------
export async function dispatchStockAction(repId: string, batchId: string, quantity: number) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    if (!repId || !batchId || quantity <= 0) {
      return { success: false, error: 'بيانات التحويل غير مكتملة' };
    }

    const result = await dbStore.dispatchStockToRep({
      repId,
      batchId,
      quantity,
    });

    revalidatePath('/admin/dispatch');
    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    revalidatePath('/rep');
    return { success: true, message: result.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// REP: Mobile POS - Create Invoice (إصدار فاتورة)
// ----------------------------------------------------
export async function createInvoiceAction(data: {
  clientId: string;
  paymentType: 'cash' | 'credit';
  paidAmount?: number;
  discount?: number;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
  }[];
}) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'انتهت الجلسة، يرجى تسجيل الدخول' };
    }

    const invoice = await dbStore.createInvoice({
      repId: user.id,
      clientId: data.clientId,
      paymentType: data.paymentType,
      paidAmount: data.paidAmount,
      discount: data.discount,
      notes: data.notes,
      items: data.items,
    });

    revalidatePath('/rep');
    revalidatePath('/rep/summary');
    revalidatePath('/admin');
    revalidatePath('/admin/invoices');
    revalidatePath('/admin/settlements');

    return { success: true, invoice };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// REP: Returns & Collections (المرتجعات والتحصيلات)
// ----------------------------------------------------
export async function createReturnAction(data: {
  productId: string;
  quantity: number;
  reason: 'expired' | 'damaged';
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'يرجى تسجيل الدخول' };

    await dbStore.createReturn({
      repId: user.id,
      productId: data.productId,
      quantity: data.quantity,
      reason: data.reason,
      notes: data.notes,
    });

    revalidatePath('/rep/returns');
    revalidatePath('/rep/summary');
    revalidatePath('/admin');
    return { success: true, message: 'تم تسجيل المرتجع بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createCollectionAction(data: {
  clientId: string;
  amount: number;
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user) return { success: false, error: 'يرجى تسجيل الدخول' };

    await dbStore.createCollection({
      repId: user.id,
      clientId: data.clientId,
      amount: data.amount,
      notes: data.notes,
    });

    revalidatePath('/rep/collections');
    revalidatePath('/rep/summary');
    revalidatePath('/admin');
    return { success: true, message: 'تم تسجيل التحصيل النقدي بنجاح وتحديث حساب العميل' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createClientAction(formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || '';
    const address = (formData.get('address') as string)?.trim() || '';
    const initialCredit = parseFloat(formData.get('creditBalance') as string) || 0;

    if (!name) return { success: false, error: 'اسم المنفذ أو السوبرماركت إجباري ومطلوب' };

    const client = await dbStore.createClient({
      name,
      phone,
      address,
      creditBalance: initialCredit,
    });

    revalidatePath('/admin/clients');
    revalidatePath('/admin');
    revalidatePath('/rep/new-invoice');
    return { success: true, client, message: 'تم إضافة المنفذ بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateClientAction(id: string, formData: FormData) {
  try {
    const name = (formData.get('name') as string)?.trim();
    const phone = (formData.get('phone') as string)?.trim() || '';
    const address = (formData.get('address') as string)?.trim() || '';

    if (!name) return { success: false, error: 'اسم المنفذ مطلوب' };

    await dbStore.updateClient(id, { name, phone, address });

    revalidatePath('/admin/clients');
    revalidatePath('/admin');
    revalidatePath('/rep/new-invoice');
    return { success: true, message: 'تم تحديث بيانات المنفذ بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteClientAction(id: string) {
  try {
    await dbStore.deleteClient(id);
    revalidatePath('/admin/clients');
    revalidatePath('/admin');
    revalidatePath('/rep/new-invoice');
    return { success: true, message: 'تم حذف المنفذ بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------
// ADMIN: End-of-Day Settlement (تسوية نهاية اليوم)
// ----------------------------------------------------
export async function saveSettlementAction(data: {
  repId: string;
  actualCash: number;
  stockDiscrepancies?: string;
  notes?: string;
}) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح' };
    }

    const settlement = await dbStore.saveSettlement(data);

    revalidatePath('/admin/settlements');
    revalidatePath('/admin');
    return { success: true, settlement };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
