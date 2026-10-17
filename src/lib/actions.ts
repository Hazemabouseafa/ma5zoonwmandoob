'use server';

import { revalidatePath } from 'next/cache';
import { dbStore, calculateExpiry } from './store';
import { signToken, setAuthCookie, clearAuthCookie, getCurrentUser } from './auth';
import { AdvanceStatus } from '@/types';

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

    const newRep = await dbStore.createUser({
      name: name.trim(),
      username: username.trim(),
      password: password.trim(),
      role: 'rep',
      isActive: true,
      phone: phone.trim(),
      assignedRoute: assignedRoute.trim(),
    });

    revalidatePath('/admin/reps');
    revalidatePath('/admin');
    return { success: true, message: 'تم إضافة المندوب بنجاح', user: newRep };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء إضافة المندوب' };
  }
}

export async function toggleRepStatusAction(repId: string, currentStatus: boolean) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const updatedUser = await dbStore.updateUser(repId, { isActive: !currentStatus });
    revalidatePath('/admin/reps');
    return { success: true, user: updatedUser };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تعديل حالة الحساب' };
  }
}

export async function resetRepPasswordAction(repId: string, newPass: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    if (!newPass || newPass.trim().length < 3) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 3 أحرف أو أرقام' };
    }

    const updatedUser = await dbStore.updateUser(repId, { password: newPass.trim() });
    revalidatePath('/admin/reps');
    revalidatePath('/admin');
    return {
      success: true,
      message: `تم تحديث كلمة المرور للمندوب (${updatedUser.name}) بنجاح`,
      user: updatedUser,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تحديث كلمة المرور' };
  }
}

export async function updateAdminPasswordAction(oldPass: string, newPass: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بتغيير كلمة مرور المدير' };
    }

    if (!oldPass) {
      return { success: false, error: 'يرجى إدخال كلمة المرور الحالية' };
    }

    if (!newPass || newPass.trim().length < 3) {
      return { success: false, error: 'كلمة المرور الجديدة يجب أن تكون 3 أحرف أو أرقام على الأقل' };
    }

    const fullUser = await dbStore.getUserById(user.id);
    if (!fullUser) {
      return { success: false, error: 'تعذر العثور على حساب المدير' };
    }

    if (fullUser.password !== oldPass) {
      return { success: false, error: 'كلمة المرور الحالية غير صحيحة' };
    }

    await dbStore.updateUser(user.id, { password: newPass.trim() });
    return { success: true, message: 'تم تغيير كلمة مرور المدير العام بنجاح!' };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء تغيير كلمة المرور' };
  }
}

// ----------------------------------------------------
// ADMIN: Inventory & Batches (FIFO)
// ----------------------------------------------------
export async function createBatchAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const productId = ((formData.get('productId') as string) || '').trim();
    const batchNumber = ((formData.get('batchNumber') as string) || '').trim();
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const productionDate = (formData.get('productionDate') as string) || new Date().toISOString();

    if (!productId) {
      return { success: false, error: 'يرجى اختيار الصنف أو المنتج أولاً' };
    }

    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, error: 'يرجى إدخال كمية واردة صحيحة أكبر من الصفر' };
    }

    const newBatch = await dbStore.createBatch({
      productId,
      batchNumber: batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
      quantity,
      productionDate,
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    return { success: true, message: `تم تسجيل التشغيلة (${newBatch.batchNumber}) بنجاح بنظام FIFO`, batch: newBatch };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء تسجيل التشغيلة' };
  }
}

export async function createProductAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const name = ((formData.get('name') as string) || '').trim();
    const category = ((formData.get('category') as string) || 'ألبان').trim();
    const shelfLifeDays = parseInt(formData.get('shelfLifeDays') as string, 10) || (category.includes('لبن') || category === 'dairy' ? 1 : 7);
    const price = parseFloat(formData.get('price') as string);
    const cost = parseFloat(formData.get('cost') as string);
    const unit = ((formData.get('unit') as string) || 'كرتونة').trim();

    if (!name) {
      return { success: false, error: 'يرجى إدخال اسم الصنف أو المنتج' };
    }

    if (isNaN(price) || price < 0 || isNaN(cost) || cost < 0) {
      return { success: false, error: 'يرجى التحقق من صحة أسعار البيع والتكلفة' };
    }

    const newProduct = await dbStore.createProduct({
      name,
      category,
      shelfLifeDays,
      price,
      cost,
      unit,
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');
    return { success: true, message: `تم إضافة الصنف "${newProduct.name}" بنجاح`, product: newProduct };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء إضافة الصنف' };
  }
}

export async function createProductAndBatchAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const productName = ((formData.get('name') as string) || '').trim();
    const category = ((formData.get('category') as string) || '').trim();
    const shelfLifeDays = parseInt(formData.get('shelfLifeDays') as string, 10) || 1;
    const price = parseFloat(formData.get('price') as string) || 0;
    const cost = parseFloat(formData.get('cost') as string) || 0;
    const unit = ((formData.get('unit') as string) || 'كرتونة').trim();

    const batchNumber = ((formData.get('batchNumber') as string) || '').trim();
    const quantity = parseInt(formData.get('quantity') as string, 10);
    const productionDate = (formData.get('productionDate') as string) || new Date().toISOString();

    if (!productName) {
      return { success: false, error: 'يرجى كتابة اسم الصنف أو المنتج الوارد' };
    }

    if (!category) {
      return { success: false, error: 'يرجى اختيار أو تحديد تصنيف للمنتج' };
    }

    if (isNaN(quantity) || quantity <= 0) {
      return { success: false, error: 'يرجى إدخال كمية واردة صحيحة أكبر من الصفر' };
    }

    // 1. Create product
    const newProduct = await dbStore.createProduct({
      name: productName,
      category,
      shelfLifeDays,
      price,
      cost,
      unit,
    });

    // 2. Create batch linked to this product
    const newBatch = await dbStore.createBatch({
      productId: newProduct.id,
      batchNumber: batchNumber || `BAT-${Date.now().toString().slice(-6)}`,
      quantity,
      productionDate,
    });

    revalidatePath('/admin/inventory');
    revalidatePath('/admin');

    return {
      success: true,
      message: `تم تعريف الصنف "${newProduct.name}" وتسجيل تشغيلته (${newBatch.batchNumber}) بنجاح!`,
      product: newProduct,
      batch: newBatch,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'حدث خطأ أثناء حفظ الصنف والتشغيلة' };
  }
}

export async function createCategoryAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإضافة تصنيفات' };
    }

    const name = (formData.get('name') as string)?.trim();
    const defaultShelfLifeDays = parseInt(formData.get('defaultShelfLifeDays') as string, 10) || 1;

    if (!name) {
      return { success: false, error: 'يرجى إدخال اسم التصنيف' };
    }

    const newCategory = await dbStore.createCategory(name, defaultShelfLifeDays);
    revalidatePath('/admin/inventory');
    return { success: true, category: newCategory, message: `تمت إضافة التصنيف "${name}" بنجاح` };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل إضافة التصنيف' };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بحذف التصنيفات' };
    }

    if (!categoryId) {
      return { success: false, error: 'معرّف التصنيف غير محدد' };
    }

    await dbStore.deleteCategory(categoryId);
    revalidatePath('/admin/inventory');
    return { success: true, message: 'تم حذف التصنيف بنجاح' };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل حذف التصنيف' };
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

// ----------------------------------------------------
// REP & ADMIN: Cash Advances (سلف المناديب)
// ----------------------------------------------------
export async function createAdvanceRequestAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: 'يرجى تسجيل الدخول أولاً' };
    }

    const amount = parseFloat(formData.get('amount') as string);
    const reason = ((formData.get('reason') as string) || '').trim();

    if (isNaN(amount) || amount <= 0) {
      return { success: false, error: 'يرجى إدخال مبلغ سلفة صحيح أكبر من الصفر' };
    }

    if (!reason) {
      return { success: false, error: 'يرجى كتابة سبب طلب السلفة' };
    }

    const advance = await dbStore.createAdvanceRequest({
      repId: user.id,
      amount,
      reason,
    });

    revalidatePath('/rep/advances');
    revalidatePath('/rep');
    revalidatePath('/admin/advances');
    revalidatePath('/admin');

    return {
      success: true,
      message: 'تم إرسال طلب السلفة إلى الإدارة بنجاح، بانتظار المراجعة والاعتماد',
      advance,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل إرسال طلب السلفة' };
  }
}

export async function updateAdvanceStatusAction(
  id: string,
  status: AdvanceStatus,
  managerNotes?: string
) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'admin') {
      return { success: false, error: 'غير مصرح لك بإجراء هذه العملية' };
    }

    const updated = await dbStore.updateAdvanceStatus(id, status, managerNotes);

    revalidatePath('/admin/advances');
    revalidatePath('/admin');
    revalidatePath('/rep/advances');
    revalidatePath('/rep');

    const statusText = status === 'approved' ? 'الموافقة على السلفة' : status === 'rejected' ? 'رفض السلفة' : 'تحديث الطلب';
    return {
      success: true,
      message: `تم ${statusText} بنجاح`,
      advance: updated,
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'فشل تحديث حالة السلفة' };
  }
}
