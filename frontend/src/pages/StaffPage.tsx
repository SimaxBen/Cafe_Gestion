import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { staffApi } from '../api/client';

interface Staff {
  id: string;
  name: string;
  role: string;
  current_salary: number;
  hire_date: string;
}

interface SalaryHistory {
  old_salary: number;
  new_salary: number;
  changed_at: string;
}

export default function StaffPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showSalaryModal, setShowSalaryModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [newStaff, setNewStaff] = useState({
    name: '',
    role: 'barista',
    email: '',
    phone: '',
    daily_salary: 0,
  });
  const [customRole, setCustomRole] = useState('');
  const [showCustomRole, setShowCustomRole] = useState(false);
  const [newSalary, setNewSalary] = useState(0);

  // Predefined roles
  const predefinedRoles = [
    { value: 'barista', label: 'باريستا', icon: '☕' },
    { value: 'server', label: 'نادل', icon: '👨‍🍳' },
    { value: 'cleaner', label: 'عامل نظافة', icon: '🧹' },
  ];

  const { data: staffList = [], isLoading } = useQuery<Staff[]>({
    queryKey: ['staff', selectedCafeId],
    queryFn: () => staffApi.getStaff(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: salaryHistory = [] } = useQuery<SalaryHistory[]>({
    queryKey: ['salary-history', selectedStaff?.id],
    queryFn: () => staffApi.getSalaryHistory(selectedCafeId!, selectedStaff!.id),
    enabled: !!selectedCafeId && !!selectedStaff && showHistoryModal,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const finalRole = showCustomRole && customRole.trim() ? customRole.trim() : newStaff.role;
      return staffApi.createStaff(selectedCafeId!, { ...newStaff, role: finalRole });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', selectedCafeId] });
      setNewStaff({ name: '', role: 'barista', email: '', phone: '', daily_salary: 0 });
      setShowModal(false);
      setShowCustomRole(false);
      setCustomRole('');
      toast.success('✅ تم إضافة الموظف بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateSalaryMutation = useMutation({
    mutationFn: () => staffApi.updateSalary(selectedCafeId!, selectedStaff!.id, newSalary),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', selectedCafeId] });
      setShowSalaryModal(false);
      toast.success('✅ تم تحديث الراتب!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (staffId: string) => staffApi.deleteStaff(selectedCafeId!, staffId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff', selectedCafeId] });
      toast.success('✅ تم حذف الموظف!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  const totalSalary = staffList.reduce((sum, staff) => sum + Number(staff.current_salary), 0);
  const avgSalary = staffList.length > 0 ? totalSalary / staffList.length : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">👥 إدارة الموظفين</h1>
          <p className="text-gray-500 text-sm">إدارة فريق العمل والرواتب</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
        >
          <span className="text-xl">+</span>
          <span>إضافة موظف</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">إجمالي الموظفين</p>
              <p className="text-3xl font-bold text-gray-800">{staffList.length}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">إجمالي الرواتب</p>
              <p className="text-3xl font-bold text-gray-800">{totalSalary.toFixed(2)} <span className="text-lg text-gray-500">DH</span></p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">متوسط الراتب</p>
              <p className="text-3xl font-bold text-gray-800">{avgSalary.toFixed(2)} <span className="text-lg text-gray-500">DH</span></p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {staffList.map((staff) => (
          <div
            key={staff.id}
            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-l from-white to-purple-50 border-r-4 border-purple-400">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-sm">
                  {staff.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{staff.name}</h3>
                  <p className="text-xs text-gray-600">{staff.role}</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-xs font-medium">الراتب الحالي</span>
                <span className="text-xl font-bold text-green-600">{Number(staff.current_salary).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">تاريخ التوظيف</span>
                <span className="font-medium text-gray-700">{new Date(staff.hire_date).toLocaleDateString('ar')}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  setSelectedStaff(staff);
                  setNewSalary(Number(staff.current_salary));
                  setShowSalaryModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white py-2 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <span>💰</span>
                <span>الراتب</span>
              </button>
              <button
                onClick={() => {
                  setSelectedStaff(staff);
                  setShowHistoryModal(true);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                <span>📈</span>
                <span>السجل</span>
              </button>
              <button
                onClick={() => {
                  if (confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                    deleteMutation.mutate(staff.id);
                  }
                }}
                className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-2 px-3 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
              >
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {staffList.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">👥</div>
          <p className="text-xl font-bold text-gray-400 mb-2">لا يوجد موظفين</p>
          <p className="text-gray-400 text-sm">ابدأ بإضافة موظفين جدد</p>
        </div>
      )}

      {/* Add Staff Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">➕ إضافة موظف جديد</h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowCustomRole(false);
                  setCustomRole('');
                  setNewStaff({ name: '', role: 'barista', email: '', phone: '', daily_salary: 0 });
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الاسم *</label>
                <input
                  type="text"
                  value={newStaff.name}
                  onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  placeholder="مثال: أحمد محمد"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">البريد الإلكتروني</label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  placeholder="example@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">رقم الهاتف</label>
                <input
                  type="tel"
                  value={newStaff.phone}
                  onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  placeholder="+212 6XX XXX XXX"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الدور الوظيفي *</label>
                {!showCustomRole ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {predefinedRoles.map((roleOption) => (
                        <button
                          key={roleOption.value}
                          type="button"
                          onClick={() => setNewStaff({ ...newStaff, role: roleOption.value })}
                          className={`p-3 rounded-lg border-2 text-center transition-all ${
                            newStaff.role === roleOption.value
                              ? 'border-blue-500 bg-blue-50 shadow-sm'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="text-2xl mb-1">{roleOption.icon}</div>
                          <div className="text-xs font-semibold text-gray-700">{roleOption.label}</div>
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCustomRole(true)}
                      className="w-full py-2 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-1"
                    >
                      <span>➕</span>
                      <span>إضافة دور مخصص</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customRole}
                      onChange={(e) => setCustomRole(e.target.value)}
                      className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                      placeholder="مثال: مدير المطبخ"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomRole(false);
                        setCustomRole('');
                        setNewStaff({ ...newStaff, role: 'barista' });
                      }}
                      className="w-full py-2 text-sm text-gray-600 hover:text-gray-700 font-medium"
                    >
                      ← الرجوع للأدوار المحددة
                    </button>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الراتب اليومي *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">DH</span>
                  <input
                    type="number"
                    value={newStaff.daily_salary}
                    onChange={(e) => setNewStaff({ ...newStaff, daily_salary: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setShowCustomRole(false);
                  setCustomRole('');
                  setNewStaff({ name: '', role: 'barista', email: '', phone: '', daily_salary: 0 });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => {
                  const finalRole = showCustomRole && customRole.trim() ? customRole.trim() : newStaff.role;
                  if (!newStaff.name.trim() || !finalRole || newStaff.daily_salary <= 0) {
                    toast.error('⚠️ الرجاء ملء الحقول المطلوبة');
                    return;
                  }
                  createMutation.mutate();
                }}
                disabled={createMutation.isPending}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                {createMutation.isPending ? '⏳ جاري الإضافة...' : '✅ إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Update Salary Modal */}
      {showSalaryModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">💰 تعديل الراتب - {selectedStaff.name}</h3>
              <button
                onClick={() => {
                  setShowSalaryModal(false);
                  setNewSalary(0);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                <label className="block text-xs text-gray-500 mb-1">الراتب الحالي</label>
                <div className="text-2xl font-bold text-gray-800">
                  {Number(selectedStaff.current_salary).toFixed(2)} DH
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الراتب الجديد *</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">DH</span>
                  <input
                    type="number"
                    value={newSalary}
                    onChange={(e) => setNewSalary(Number(e.target.value))}
                    className="w-full px-4 py-2.5 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 text-lg font-semibold transition-all"
                    min="0"
                    step="10"
                  />
                </div>
              </div>
              {newSalary !== Number(selectedStaff.current_salary) && newSalary > 0 && (
                <div className={`${newSalary > Number(selectedStaff.current_salary) ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} p-3 rounded-lg border`}>
                  <p className={`${newSalary > Number(selectedStaff.current_salary) ? 'text-green-700' : 'text-red-700'} text-sm font-medium`}>
                    {newSalary > Number(selectedStaff.current_salary) ? '📈 زيادة' : '📉 تخفيض'}: {Math.abs(newSalary - Number(selectedStaff.current_salary)).toFixed(2)} DH
                  </p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowSalaryModal(false);
                  setNewSalary(0);
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => updateSalaryMutation.mutate()}
                disabled={newSalary <= 0 || newSalary === Number(selectedStaff.current_salary)}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ تأكيد
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Salary History Modal */}
      {showHistoryModal && selectedStaff && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📈 سجل الرواتب - {selectedStaff.name}</h3>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedStaff(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-3">
              {salaryHistory.map((record, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">
                      {new Date(record.changed_at).toLocaleString('ar')}
                    </p>
                    <p className="font-semibold text-gray-800">
                      {Number(record.old_salary).toFixed(2)} DH → {Number(record.new_salary).toFixed(2)} DH
                    </p>
                  </div>
                  <div className={`flex items-center gap-2 ${Number(record.new_salary) > Number(record.old_salary) ? 'text-green-600' : 'text-red-600'}`}>
                    <span className="text-2xl">{Number(record.new_salary) > Number(record.old_salary) ? '📈' : '📉'}</span>
                    <span className="text-lg font-bold">
                      {Math.abs(Number(record.new_salary) - Number(record.old_salary)).toFixed(2)} DH
                    </span>
                  </div>
                </div>
              ))}
              {salaryHistory.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-5xl mb-3">📄</div>
                  <p className="text-gray-400 text-sm">لا يوجد سجل للرواتب</p>
                </div>
              )}
            </div>

            <div className="flex justify-end mt-6">
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setSelectedStaff(null);
                }}
                className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-all"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
