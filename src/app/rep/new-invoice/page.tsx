import { getCurrentUser } from '@/lib/auth';
import { dbStore } from '@/lib/store';
import NewInvoiceClientView from '@/components/rep/NewInvoiceClientView';

export default async function RepNewInvoicePage() {
  const user = await getCurrentUser();
  const clients = await dbStore.getClients();
  const allProducts = await dbStore.getProducts();
  const rawVanStock = await dbStore.getRepVanStock(user!.id);

  // Group van stock by product for simplified POS selection
  const productStockMap = new Map<
    string,
    {
      productId: string;
      name: string;
      category: string;
      price: number;
      unit: string;
      totalAvailable: number;
      earliestHoursRemaining: number;
    }
  >();

  rawVanStock.forEach((item) => {
    const existing = productStockMap.get(item.productId);
    if (existing) {
      existing.totalAvailable += item.quantity;
      existing.earliestHoursRemaining = Math.min(
        existing.earliestHoursRemaining,
        item.hoursRemaining
      );
    } else {
      productStockMap.set(item.productId, {
        productId: item.productId,
        name: item.product.name,
        category: item.product.category,
        price: item.product.price,
        unit: item.product.unit,
        totalAvailable: item.quantity,
        earliestHoursRemaining: item.hoursRemaining,
      });
    }
  });

  const availableProducts = Array.from(productStockMap.values());

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-black text-slate-900">فاتورة بيع جديدة (Mobile POS)</h1>
        <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
          صرف FIFO آلي
        </span>
      </div>

      <NewInvoiceClientView
        clients={clients}
        availableProducts={availableProducts}
        allProducts={allProducts}
        repName={user!.name}
      />
    </div>
  );
}
