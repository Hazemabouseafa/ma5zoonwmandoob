'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Employee, PayrollPayment } from '@/types';
import {
  createEmployeeAction,
  updateEmployeeAction,
  deleteEmployeeAction,
  recordPayrollPaymentAction,
  deletePayrollPaymentAction,
} from '@/lib/actions';
import ConfirmDeleteModal from '@/components/admin/ConfirmDeleteModal';
import {
  Users,
  UserPlus,
  Search,
  DollarSign,
  Wallet,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  Briefcase,
  Edit,
  Trash2,
  Banknote,
  FileText,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';

interface Props {
  employees: Employee[];
  payrollPayments: (PayrollPayment & { employeeName: string; employeeRole: string })[];
}

export default function EmployeesClientView({
  employees: initialEmployees,
  payrollPayments: initialPayrollPayments,
}: Props) {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees || []);
  const [payrollPayments, setPayrollPayments] = useState(initialPayrollPayments || []);

  const [activeTab, setActiveTab] = useState<'employees' | 'payroll'>('employees');
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'employee' | 'payroll';
    id: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [payoutEmployee, setPayoutEmployee] = useState<Employee | null>(null);

  // Form states
  const [empName, setEmpName] = useState('');
  const [empPhone, setEmpPhone] = useState('');
  const [empRole, setEmpRole] = useState('');
  const [empSalary, setEmpSalary] = useState('');

  // Payroll Payout Form state
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutMonth, setPayoutMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [payoutDate, setPayoutDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payoutNotes, setPayoutNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync state with server props
  useEffect(() => {
    setEmployees(initialEmployees || []);
  }, [initialEmployees]);

  useEffect(() => {
    setPayrollPayments(initialPayrollPayments || []);
  }, [initialPayrollPayments]);

  // Derived statistics
  const totalEmployees = employees.length;
  const totalBasePayroll = employees.reduce((acc, e) => acc + (Number(e.baseSalary) || 0), 0);
  const totalPaidOut = payrollPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalBasePayroll / totalEmployees) : 0;

  // Filtered employees
  const filteredEmployees = employees.filter((e) => {
    const matchSearch =
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      (e.phone && e.phone.includes(search)) ||
      e.role.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === 'ALL' || e.role === filterRole;
    return matchSearch && matchRole;
  });

  // Filtered payroll history
  const filteredPayroll = payrollPayments.filter((p) => {
    const matchSearch =
      p.employeeName.toLowerCase().includes(search.toLowerCase()) ||
      p.month.includes(search) ||
      (p.notes && p.notes.toLowerCase().includes(search.toLowerCase()));
    return matchSearch;
  });

  // Unique roles for filter dropdown
  const uniqueRoles = Array.from(new Set(employees.map((e) => e.role))).filter(Boolean);

  const resetEmpForm = () => {
    setEmpName('');
    setEmpPhone('');
    setEmpRole('');
    setEmpSalary('');
    setEditingEmployee(null);
  };

  const openEditModal = (emp: Employee) => {
    setEditingEmployee(emp);
    setEmpName(emp.name);
    setEmpPhone(emp.phone || '');
    setEmpRole(emp.role);
    setEmpSalary(String(emp.baseSalary));
    setShowAddModal(true);
  };

  const openPayoutModal = (emp: Employee) => {
    setPayoutEmployee(emp);
    setPayoutAmount(String(emp.baseSalary));
    setPayoutNotes('صرف راتب شهري');
  };

  const handleSaveEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('name', empName);
    formData.append('phone', empPhone);
    formData.append('role', empRole);
    formData.append('baseSalary', empSalary);

    try {
      let res;
      if (editingEmployee) {
        formData.append('id', editingEmployee.id);
        res = await updateEmployeeAction(formData);
      } else {
        res = await createEmployeeAction(formData);
      }

      if (res.success) {
        setMsg({ type: 'success', text: res.message || 'تمت العملية بنجاح' });
        setShowAddModal(false);
        resetEmpForm();
        router.refresh();
      } else {
        setMsg({ type: 'error', text: res.error || 'حدث خطأ أثناء حفظ بيانات الموظف' });
      }
    } catch {
      setMsg({ type: 'error', text: 'فشل الاتصال بالخادم' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setMsg(null);

    try {
      if (deleteTarget.type === 'employee') {
        const res = await deleteEmployeeAction(deleteTarget.id);
        if (res.success) {
          setEmployees((prev) => prev.filter((e) => e.id !== deleteTarget.id));
          setMsg({ type: 'success', text: res.message || 'تم حذف الموظف بنجاح' });
        } else {
          setMsg({ type: 'error', text: res.error || 'تعذر حذف الموظف' });
        }
      } else {
        const res = await deletePayrollPaymentAction(deleteTarget.id);
        if (res.success) {
          setPayrollPayments((prev) => prev.filter((p) => p.id !== deleteTarget.id));
          setMsg({ type: 'success', text: res.message || 'تم حذف سند صرف الراتب بنجاح' });
        } else {
          setMsg({ type: 'error', text: res.error || 'تعذر حذف سند صرف الراتب' });
        }
      }
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('app:sync'));
      router.refresh();
    } catch {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء الحذف' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleRecordPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payoutEmployee) return;

    setLoading(true);
    setMsg(null);

    const formData = new FormData();
    formData.append('employeeId', payoutEmployee.id);
    formData.append('amount', payoutAmount);
    formData.append('month', payoutMonth);
    formData.append('paymentDate', payoutDate);
    formData.append('notes', payoutNotes);

    try {
      const res = await recordPayrollPaymentAction(formData);
      if (res.success) {
        setMsg({ type: 'success', text: res.message || 'تم تسجيل صرف الراتب/المستحقات بنجاح' });
        setPayoutEmployee(null);
        setPayoutAmount('');
        router.refresh();
      } else {
        setMsg({ type: 'error', text: res.error || 'فشل تسجيل صرف الراتب' });
      }
    } catch {
      setMsg({ type: 'error', text: 'حدث خطأ أثناء تسجيل الصرف' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Notifications */}
      {msg && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            msg.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {msg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            )}
            <span className="font-semibold text-sm">{msg.text}</span>
          </div>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الموظفين</p>
            <p className="text-2xl font-black text-slate-900 mt-1">{totalEmployees}</p>
            <span className="text-xs text-blue-600 font-semibold">عاملين ومسجلين</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">الرواتب الشهرية الأساسية</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalBasePayroll.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">ج.م</span>
            </p>
            <span className="text-xs text-emerald-600 font-semibold">التزام شهري دوري</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
            <Banknote className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">إجمالي الرواتب المصروفة</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {totalPaidOut.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">ج.م</span>
            </p>
            <span className="text-xs text-purple-600 font-semibold">{payrollPayments.length} حركة صرف مسجلة</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-400">متوسط الراتب الأساسي</p>
            <p className="text-2xl font-black text-slate-900 mt-1">
              {avgSalary.toLocaleString('ar-EG')} <span className="text-sm font-normal text-slate-500">ج.م</span>
            </p>
            <span className="text-xs text-amber-600 font-semibold">لكل موظف شهرياً</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {/* Navigation Tabs & Actions */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl overflow-x-auto scrollbar-none touch-pan-x w-full md:w-auto">
            <button
              onClick={() => setActiveTab('employees')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'employees'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>قائمة الموظفين ({employees.length})</span>
              </div>
            </button>
            <button
              onClick={() => setActiveTab('payroll')}
              className={`px-3.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeTab === 'payroll'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                <Banknote className="w-4 h-4" />
                <span>سجل صرف الرواتب والسلف ({payrollPayments.length})</span>
              </div>
            </button>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                resetEmpForm();
                setShowAddModal(true);
              }}
              className="w-full sm:w-auto justify-center px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>إضافة موظف جديد</span>
            </button>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={
                activeTab === 'employees'
                  ? 'بحث بالاسم، رقم الهاتف، أو المسمى الوظيفي...'
                  : 'بحث باسم الموظف أو الشهر أو الملاحظات...'
              }
              className="w-full pl-4 pr-10 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {activeTab === 'employees' && uniqueRoles.length > 0 && (
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700"
            >
              <option value="ALL">جميع الوظائف</option>
              {uniqueRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Tab 1: Employees List */}
        {activeTab === 'employees' && (
          <div className="overflow-x-auto touch-pan-x">
            {filteredEmployees.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">لا يوجد موظفون مسجلون حالياً</p>
                <p className="text-xs text-slate-400 mt-1">
                  قم بإضافة موظف جديد لتسجيل الراتب الأساسي ومتابعة الأجور
                </p>
              </div>
            ) : (
              <table className="w-full text-right border-collapse min-w-[650px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="py-3 px-4">اسم الموظف</th>
                    <th className="py-3 px-4">الوظيفة / الدور</th>
                    <th className="py-3 px-4">رقم الهاتف</th>
                    <th className="py-3 px-4">الراتب الأساسي الشهري</th>
                    <th className="py-3 px-4">تاريخ التسجيل</th>
                    <th className="py-3 px-4 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{emp.name}</div>
                        <div className="text-xs text-slate-400 font-mono">ID: {emp.id.slice(-6)}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          <Briefcase className="w-3 h-3" />
                          {emp.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                        {emp.phone ? (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{emp.phone}</span>
                          </div>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-black text-slate-900">
                        {emp.baseSalary.toLocaleString('ar-EG')}{' '}
                        <span className="text-xs font-normal text-slate-500">ج.م</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 text-xs">
                        {emp.createdAt ? new Date(emp.createdAt).toLocaleDateString('ar-EG') : '-'}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => openPayoutModal(emp)}
                            title="صرف راتب / سلفة"
                            className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-bold transition flex items-center gap-1"
                          >
                            <Banknote className="w-3.5 h-3.5" />
                            <span>صرف راتب</span>
                          </button>
                          <button
                            onClick={() => openEditModal(emp)}
                            title="تعديل بيانات"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              setDeleteTarget({
                                type: 'employee',
                                id: emp.id,
                                name: `الموظف: ${emp.name}`,
                              })
                            }
                            title="حذف الموظف"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab 2: Payroll History */}
        {activeTab === 'payroll' && (
          <div className="overflow-x-auto touch-pan-x">
            {filteredPayroll.length === 0 ? (
              <div className="text-center py-12 px-4">
                <Banknote className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-bold">لا يوجد سجل صرف رواتب حتى الآن</p>
                <p className="text-xs text-slate-400 mt-1">
                  عند صرف راتب أو سلفة لموظف، ستظهر الحركة هنا تلقائياً وتُخصم من أرباح الشركة
                </p>
              </div>
            ) : (
              <table className="w-full text-right border-collapse min-w-[680px]">
                <thead>
                  <tr className="bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-500">
                    <th className="py-3 px-4">تاريخ الصرف</th>
                    <th className="py-3 px-4">اسم الموظف</th>
                    <th className="py-3 px-4">الوظيفة</th>
                    <th className="py-3 px-4">عن شهر</th>
                    <th className="py-3 px-4">المبلغ المنصرف</th>
                    <th className="py-3 px-4">ملاحظات</th>
                    <th className="py-3 px-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {filteredPayroll.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3.5 px-4 text-slate-600 text-xs font-mono">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{p.paymentDate ? p.paymentDate.split('T')[0] : p.createdAt.split('T')[0]}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{p.employeeName}</span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500">
                        {p.employeeRole}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {p.month}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-black text-rose-600">
                        <span className="inline-flex items-center gap-1">
                          <ArrowDownLeft className="w-3.5 h-3.5" />
                          {p.amount.toLocaleString('ar-EG')} ج.م
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-xs truncate">
                        {p.notes || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              type: 'payroll',
                              id: p.id,
                              name: `سند صرف راتب للموظف: ${p.employeeName} (مبلغ: ${p.amount.toLocaleString('ar-EG')} ج.م عن شهر: ${p.month})`,
                            })
                          }
                          title="حذف سند الصرف"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL: Add / Edit Employee */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-lg text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>{editingEmployee ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}</span>
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetEmpForm();
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  اسم الموظف بالكامل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  placeholder="مثال: أحمد محمد علي"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الوظيفة / المسمى الوظيفي <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={empRole}
                  onChange={(e) => setEmpRole(e.target.value)}
                  placeholder="مثال: مندوب مبيعات، أمين مخزن، محاسب، سائق"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <div className="flex flex-wrap gap-1 mt-2">
                  {['مندوب مبيعات', 'أمين مخزن', 'سائق توزيع', 'محاسب', 'مدير تشغيل'].map((role) => (
                    <button
                      type="button"
                      key={role}
                      onClick={() => setEmpRole(role)}
                      className="px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px]"
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                <input
                  type="text"
                  value={empPhone}
                  onChange={(e) => setEmpPhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-left font-mono"
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الراتب الأساسي الشهري (ج.م) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="50"
                    min="0"
                    required
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    placeholder="0"
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-left"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ج.م
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetEmpForm();
                  }}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'جاري الحفظ...' : editingEmployee ? 'تحديث البيانات' : 'حفظ الموظف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Record Payroll Payout */}
      {payoutEmployee && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
              <h3 className="font-black text-lg text-emerald-950 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>صرف راتب / مستحقات للموظف</span>
              </h3>
              <button
                onClick={() => setPayoutEmployee(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPayout} className="p-5 space-y-4">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-xs text-slate-400">الموظف المستفيد:</div>
                <div className="font-bold text-slate-900 text-base">{payoutEmployee.name}</div>
                <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                  <span>الوظيفة: {payoutEmployee.role}</span>
                  <span>الراتب الأساسي: {payoutEmployee.baseSalary.toLocaleString('ar-EG')} ج.م</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  المبلغ المنصرف (ج.م) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="10"
                    min="1"
                    required
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left text-emerald-700"
                    dir="ltr"
                  />
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                    ج.م
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    عن شهر <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutMonth}
                    onChange={(e) => setPayoutMonth(e.target.value)}
                    placeholder="2026-10"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ الصرف</label>
                  <input
                    type="date"
                    required
                    value={payoutDate}
                    onChange={(e) => setPayoutDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات أو بيان الصرف</label>
                <textarea
                  rows={2}
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder="مثال: راتب الشهر كامل، سلفة نقدية مستردة، مكافأة تشجيعية..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayoutEmployee(null)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  {loading ? 'جاري التسجيل...' : 'تأكيد الصرف'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Universal Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={deleteTarget !== null}
        itemName={deleteTarget?.name}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          if (!isDeleting) setDeleteTarget(null);
        }}
      />
    </div>
  );
}
