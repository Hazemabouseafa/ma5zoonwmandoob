import { dbStore } from '@/lib/store';
import EmployeesClientView from '@/components/admin/EmployeesClientView';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEmployeesPage() {
  const employees = await dbStore.getEmployees();
  const payrollPayments = await dbStore.getPayrollPayments();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">شؤون الموظفين والمرتبات</h1>
          <p className="text-sm text-slate-500">
            إدارة ملفات العاملين، تسجيل الرواتب الأساسية، وصرف الأجور والسلف وربطها التلقائي بمصروفات وأرباح الشركة
          </p>
        </div>
      </div>

      <EmployeesClientView
        employees={employees}
        payrollPayments={payrollPayments}
      />
    </div>
  );
}
