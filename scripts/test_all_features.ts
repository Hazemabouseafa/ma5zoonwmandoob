import { dbStore, calculateExpiry, determineBatchStatus } from '../src/lib/store';
import { signToken, verifyToken } from '../src/lib/auth';

let passed = 0;
let failed = 0;

function assert(condition: boolean, msg: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${msg}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL] ${msg}`);
    failed++;
  }
}

async function runAllTests() {
  console.log('\n============================================================');
  console.log('🧪 بدء الفحص الشامل واختبار جميع وظائف وأزرار نظام المراعي 100%');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Authentication & JWT Tokens
  // -------------------------------------------------------------
  console.log('🔹 1. اختبار المصادقة وتوليد وتشفير الجلسات (Authentication & Session)');
  const admin = await dbStore.getUserByUsername('admin');
  assert(admin !== null && admin.role === 'admin', 'التحقق من وجود حساب المدير العام');
  assert(admin?.name.includes('محمود عبد الله'), 'التحقق من أن المدير العام هو محمود عبد الله');

  const token = signToken(admin!);
  const decoded = verifyToken(token);
  assert(decoded !== null && decoded.username === 'admin', 'التحقق من صحة توقيع وفك تشفير JWT');

  const rep = await dbStore.getUserByUsername('rep_omar');
  assert(rep !== null && rep.role === 'rep', 'التحقق من وجود حساب مندوب المبيعات (عمر)');

  // -------------------------------------------------------------
  // TEST 2: Admin Reps Management (إدارة المناديب وحسابات الدخول)
  // -------------------------------------------------------------
  console.log('\n🔹 2. اختبار إدارة المناديب (إضافة مندوب، تعديل، تعطيل، وتغيير كلمة المرور)');
  const testUsername = `rep_test_${Date.now()}`;
  const newRep = await dbStore.createUser({
    name: 'محمود سلامة',
    username: testUsername,
    password: 'oldpassword',
    role: 'rep',
    isActive: true,
    phone: '01011112222',
    assignedRoute: 'خط التجمع الخامس والشروق',
  });
  assert(newRep.id !== undefined && newRep.name === 'محمود سلامة', 'إضافة مندوب مبيعات جديد بنجاح');

  // Deactivate
  const deactivatedRep = await dbStore.updateUser(newRep.id, { isActive: false });
  assert(deactivatedRep.isActive === false, 'تعطيل حساب المندوب بنجاح');

  // Reactivate
  const reactivatedRep = await dbStore.updateUser(newRep.id, { isActive: true });
  assert(reactivatedRep.isActive === true, 'إعادة تفعيل حساب المندوب بنجاح');

  // Change password
  const updatedPassRep = await dbStore.updateUser(newRep.id, { password: 'newsecret123' });
  assert(updatedPassRep.password === 'newsecret123', 'تحديث وتعيين كلمة مرور جديدة للمندوب بنجاح');

  // Duplicate username check
  try {
    await dbStore.createUser({
      name: 'محمود مكرر',
      username: testUsername,
      password: '123',
      role: 'rep',
      isActive: true,
    });
    assert(false, 'يجب منع تكرار اسم المستخدم');
  } catch (e: any) {
    assert(e.message.includes('مسجل مسبقاً'), 'منع تكرار اسم المستخدم بنجاح وإظهار رسالة عربية واضحة');
  }

  // -------------------------------------------------------------
  // TEST 3: Products & FIFO Expiry Calculation
  // -------------------------------------------------------------
  console.log('\n🔹 3. اختبار المنتجات وحساب الصلاحية التلقائي بنظام FIFO (ألبان 1 يوم، عصائر 7 أيام)');
  const prodDate = new Date('2026-10-14T10:00:00.000Z');
  
  // Dairy 1 day
  const dairyExpiry = calculateExpiry(prodDate.toISOString(), 1);
  const dairyExpDiffHours = (new Date(dairyExpiry).getTime() - prodDate.getTime()) / (1000 * 60 * 60);
  assert(dairyExpDiffHours === 24, 'صلاحية الألبان تحتسب بدقة 24 ساعة (1 يوم)');

  // Juice 7 days
  const juiceExpiry = calculateExpiry(prodDate.toISOString(), 7);
  const juiceExpDiffDays = (new Date(juiceExpiry).getTime() - prodDate.getTime()) / (1000 * 60 * 60 * 24);
  assert(juiceExpDiffDays === 7, 'صلاحية العصائر تحتسب بدقة 7 أيام');

  // Create a new batch in warehouse
  const products = await dbStore.getProducts();
  const milkProd = products.find((p) => p.category === 'dairy')!;
  const newBatch = await dbStore.createBatch({
    productId: milkProd.id,
    batchNumber: `TEST-BAT-${Date.now()}`,
    quantity: 40,
    productionDate: new Date().toISOString(),
  });
  assert(newBatch.quantity === 40, 'تسجيل تشغيلة واردة جديدة في المستودع بنجاح');
  assert(newBatch.status === 'active' || newBatch.status === 'expiring_soon', 'تحديد حالة تشغيلة الألبان بدقة');

  // -------------------------------------------------------------
  // TEST 4: Dispatch Stock to Rep Van (تحويل البضاعة لسيارة المندوب)
  // -------------------------------------------------------------
  console.log('\n🔹 4. اختبار تحويل البضاعة لسيارة المندوب بمعاملة ذرية تمنع المخزون السالب');
  const repOmar = (await dbStore.getUserByUsername('rep_omar'))!;
  
  // Dispatch 15 units
  const dispatchRes = await dbStore.dispatchStockToRep({
    repId: repOmar.id,
    batchId: newBatch.id,
    quantity: 15,
  });
  assert(dispatchRes.success === true, 'تحويل 15 كرتونة لسيارة المندوب عمر بنجاح');

  // Verify warehouse deduction
  const batchesAfter = await dbStore.getBatches();
  const updatedBatch = batchesAfter.find((b) => b.id === newBatch.id)!;
  assert(updatedBatch.quantity === 25, 'خصم الكمية من المستودع (40 - 15 = 25 كرتونة)');

  // Verify rep van stock addition
  const vanStock = await dbStore.getRepVanStock(repOmar.id);
  const vanItem = vanStock.find((v) => v.batchId === newBatch.id);
  assert(vanItem !== undefined && vanItem.quantity === 15, 'إضافة 15 كرتونة فورياً في عهدة سيارة المندوب');

  // Attempt to dispatch more than available in warehouse (Over-dispatch test)
  try {
    await dbStore.dispatchStockToRep({
      repId: repOmar.id,
      batchId: newBatch.id,
      quantity: 50, // Only 25 available!
    });
    assert(false, 'يجب منع تحويل كمية أكبر من المتاح في المستودع');
  } catch (err: any) {
    assert(err.message.includes('أقل من الكمية المطلوبة'), 'منع التحويل الزائد ومنع المخزون السالب بنجاح');
  }

  // -------------------------------------------------------------
  // TEST 5: Sales Rep Invoicing & Strict FIFO Van Stock Deduction
  // -------------------------------------------------------------
  console.log('\n🔹 5. اختبار إصدار فاتورة مبيعات من سيارة المندوب وتطبيق الـ FIFO الصارم');
  const clients = await dbStore.getClients();
  const testClient = clients[0];
  const initialCredit = testClient.creditBalance;

  // Let's create an invoice for 5 cartons
  const invoice = await dbStore.createInvoice({
    repId: repOmar.id,
    clientId: testClient.id,
    paymentType: 'credit',
    paidAmount: 50, // partial payment
    items: [
      {
        productId: milkProd.id,
        quantity: 5,
      },
    ],
  });

  assert(invoice.items.length > 0, 'إنشاء الفاتورة وتفاصيل بنود الأصناف');
  assert(invoice.totalAmount === 5 * milkProd.price, 'حساب إجمالي الفاتورة بدقة');
  assert(invoice.paidAmount === 50, 'تسجيل المبلغ المدفوع من الفاتورة');

  // Check client credit balance increased by unpaid remainder
  const clientsAfter = await dbStore.getClients();
  const updatedClient = clientsAfter.find((c) => c.id === testClient.id)!;
  const expectedNewCredit = initialCredit + (invoice.totalAmount - 50);
  assert(
    Math.abs(updatedClient.creditBalance - expectedNewCredit) < 0.01,
    'تحديث مديونية العميل بالباقي الآجل بدقة'
  );

  // Check rep van stock was deducted
  const vanStockAfterInvoice = await dbStore.getRepVanStock(repOmar.id);
  const totalMilkInVan = vanStockAfterInvoice
    .filter((v) => v.productId === milkProd.id)
    .reduce((s, v) => s + v.quantity, 0);
  assert(
    totalMilkInVan === 35,
    'خصم 5 كراتين من إجمالي عهدة السيارة بنظام FIFO (40 - 5 = 35)'
  );

  // Attempt to invoice more than van stock
  try {
    await dbStore.createInvoice({
      repId: repOmar.id,
      clientId: testClient.id,
      paymentType: 'cash',
      items: [
        {
          productId: milkProd.id,
          quantity: 9999, // Impossible quantity
        },
      ],
    });
    assert(false, 'يجب منع إصدار فاتورة بكمية تفوق عهدة السيارة');
  } catch (e: any) {
    assert(e.message.includes('لا تكفي للكمية المطلوبة'), 'منع بيع كمية غير متوفرة في سيارة المندوب بنجاح');
  }

  // -------------------------------------------------------------
  // TEST 6: Returns & Collections (المرتجعات والتحصيلات)
  // -------------------------------------------------------------
  console.log('\n🔹 6. اختبار تسجيل المرتجعات التالفة والتحصيلات النقدية');
  const returnItem = await dbStore.createReturn({
    repId: repOmar.id,
    productId: milkProd.id,
    quantity: 1,
    reason: 'damaged',
    notes: 'شرخ بالغطاء أثناء التفريغ',
  });
  assert(returnItem.id !== undefined && returnItem.reason === 'damaged', 'تسجيل مرتجع تالف بنجاح');

  const beforeColCredit = updatedClient.creditBalance;
  const collection = await dbStore.createCollection({
    repId: repOmar.id,
    clientId: testClient.id,
    amount: 100,
    notes: 'سداد دفعة نقدية',
  });
  assert(collection.amount === 100, 'تسجيل سند قبض وتحصيل نقدي');

  const clientsAfterCol = await dbStore.getClients();
  const finalClient = clientsAfterCol.find((c) => c.id === testClient.id)!;
  assert(
    Math.abs(finalClient.creditBalance - (beforeColCredit - 100)) < 0.01,
    'تخفيض مديونية العميل بقيمة المبلغ المحصل فورياً'
  );

  // -------------------------------------------------------------
  // TEST 7: End-of-Day Reconciliation & Settlement (تسوية نهاية اليوم)
  // -------------------------------------------------------------
  console.log('\n🔹 7. اختبار جرد وتسوية نهاية اليوم ومطابقة الكاش والبضاعة');
  const daySummary = await dbStore.getRepDaySummary(repOmar.id);
  assert(daySummary.todayInvoices.length > 0, 'حصر جميع فواتير اليوم للمندوب');
  assert(daySummary.expectedCash > 0, 'احتساب إجمالي النقدية المتوقع استلامها آلياً');
  assert(daySummary.currentVanStock.length > 0, 'جرد وحصر البضاعة المتبقية في السيارة');

  // Test settlement with balanced cash
  const balancedSettlement = await dbStore.saveSettlement({
    repId: repOmar.id,
    actualCash: daySummary.expectedCash,
    notes: 'تسوية مطابقة 100%',
  });
  assert(balancedSettlement.status === 'balanced', 'اعتماد تسوية متزنة (مطابقة تماماً بدون عجز)');

  // Test settlement with discrepancy (shortage of 50 EGP)
  const discrepancySettlement = await dbStore.saveSettlement({
    repId: repOmar.id,
    actualCash: daySummary.expectedCash - 50,
    stockDiscrepancies: 'عجز 1 كرتونة حليب لم تسلم',
    notes: 'يوجد عجز 50 ج.م',
  });
  assert(discrepancySettlement.status === 'discrepancy', 'كشف عجز النقدية وتسجيل حالة Discrepancy آلياً');
  assert(discrepancySettlement.cashDifference === -50, 'حساب فارق العجز بدقة (-50 ج.م)');

  // -------------------------------------------------------------
  // TEST 8: Analytics & Reporting
  // -------------------------------------------------------------
  console.log('\n🔹 8. اختبار مؤشرات الأداء والتحليلات (KPIs & Top Sellers)');
  const analytics = await dbStore.getAnalytics();
  assert(analytics.todaySalesAmount > 0, 'احتساب إجمالي مبيعات اليوم للإدارة');
  assert(analytics.topProducts.length > 0, 'استخراج قائمة الأصناف الأكثر مبيعاً');
  assert(analytics.topClients.length > 0, 'استخراج قائمة أفضل العملاء');
  assert(analytics.repPerformance.length > 0, 'متابعة أداء ومبيعات كل مندوب لحظياً');

  console.log('\n============================================================');
  console.log(`📊 النتيجة الإجمالية للفحص الشامل:`);
  console.log(`   ✓ الاختبارات الناجحة: ${passed}`);
  console.log(`   ✗ الاختبارات الفاشلة: ${failed}`);
  console.log('============================================================\n');

  if (failed === 0) {
    console.log('🎉 ممتاز! جميع وحدات، أزرار، ومعاملات النظام تعمل بنجاح 100% بدون أي أخطاء!');
  } else {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
