import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import { expensesApi } from '../api/client';

interface MonthlyExpense {
  id: string;
  cafe_id: string;
  month: string; // Date string (first day of month)
  description: string;
  amount: number;
  created_at: string;
}

interface DailyExpense {
  id: string;
  cafe_id: string;
  date: string; // Date string
  description: string;
  amount: number;
  created_at: string;
}

export default function ExpensesPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('monthly');
  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState<MonthlyExpense | DailyExpense | null>(null);
  
  // For monthly expenses: filter by month (first day of month)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`
  );
  
  // For daily expenses: filter by specific date
  const [selectedDate, setSelectedDate] = useState(
    currentDate.toISOString().split('T')[0]
  );

  const [monthlyExpenseForm, setMonthlyExpenseForm] = useState({
    description: '',
    amount: 0,
    month: selectedMonth,
  });

  const [dailyExpenseForm, setDailyExpenseForm] = useState({
    description: '',
    amount: 0,
    date: selectedDate,
  });

  // Fetch monthly expenses
  const { data: monthlyExpenses = [], isLoading: monthlyLoading, refetch: refetchMonthly } = useQuery<MonthlyExpense[]>({
    queryKey: ['expenses', 'monthly', selectedCafeId, selectedMonth],
    queryFn: () => expensesApi.getMonthlyExpenses(selectedCafeId!, selectedMonth),
    enabled: !!selectedCafeId,
    staleTime: 0, // Always refetch
  });

  // Fetch daily expenses (with optional date filter)
  const { data: dailyExpenses = [], isLoading: dailyLoading, refetch: refetchDaily } = useQuery<DailyExpense[]>({
    queryKey: ['expenses', 'daily', selectedCafeId, selectedDate],
    queryFn: () => expensesApi.getDailyExpenses(selectedCafeId!, selectedDate),
    enabled: !!selectedCafeId,
    staleTime: 0, // Always refetch
  });

  // Monthly expense mutations
  const createMonthlyMutation = useMutation({
    mutationFn: (data: typeof monthlyExpenseForm) => 
      expensesApi.createMonthlyExpense(selectedCafeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchMonthly();
      setMonthlyExpenseForm({ description: '', amount: 0, month: selectedMonth });
      setShowModal(false);
      toast.success('✅ تمت إضافة المصروف الشهري بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في إضافة المصروف');
    },
  });

  const updateMonthlyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof monthlyExpenseForm> }) =>
      expensesApi.updateMonthlyExpense(selectedCafeId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchMonthly();
      setEditingExpense(null);
      setShowModal(false);
      toast.success('✅ تم تحديث المصروف بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في تحديث المصروف');
    },
  });

  const deleteMonthlyMutation = useMutation({
    mutationFn: (expenseId: string) => 
      expensesApi.deleteMonthlyExpense(selectedCafeId!, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchMonthly();
      toast.success('✅ تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في حذف المصروف');
    },
  });

  // Daily expense mutations
  const createDailyMutation = useMutation({
    mutationFn: (data: typeof dailyExpenseForm) => 
      expensesApi.createDailyExpense(selectedCafeId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchDaily();
      setDailyExpenseForm({ description: '', amount: 0, date: selectedDate });
      setShowModal(false);
      toast.success('✅ تمت إضافة المصروف اليومي بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في إضافة المصروف');
    },
  });

  const updateDailyMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<typeof dailyExpenseForm> }) =>
      expensesApi.updateDailyExpense(selectedCafeId!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchDaily();
      setEditingExpense(null);
      setShowModal(false);
      toast.success('✅ تم تحديث المصروف بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في تحديث المصروف');
    },
  });

  const deleteDailyMutation = useMutation({
    mutationFn: (expenseId: string) => 
      expensesApi.deleteDailyExpense(selectedCafeId!, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      refetchDaily();
      toast.success('✅ تم حذف المصروف بنجاح');
    },
    onError: () => {
      toast.error('❌ فشل في حذف المصروف');
    },
  });

  const handleAddExpense = () => {
    if (activeTab === 'monthly') {
      if (!monthlyExpenseForm.description || monthlyExpenseForm.amount <= 0) {
        toast.error('الرجاء ملء جميع الحقول');
        return;
      }
      createMonthlyMutation.mutate(monthlyExpenseForm);
    } else {
      if (!dailyExpenseForm.description || dailyExpenseForm.amount <= 0) {
        toast.error('الرجاء ملء جميع الحقول');
        return;
      }
      createDailyMutation.mutate(dailyExpenseForm);
    }
  };

  const handleUpdateExpense = () => {
    if (!editingExpense) return;
    
    if (activeTab === 'monthly') {
      if (!monthlyExpenseForm.description || monthlyExpenseForm.amount <= 0) {
        toast.error('الرجاء ملء جميع الحقول');
        return;
      }
      updateMonthlyMutation.mutate({ 
        id: editingExpense.id, 
        data: monthlyExpenseForm 
      });
    } else {
      if (!dailyExpenseForm.description || dailyExpenseForm.amount <= 0) {
        toast.error('الرجاء ملء جميع الحقول');
        return;
      }
      updateDailyMutation.mutate({ 
        id: editingExpense.id, 
        data: dailyExpenseForm 
      });
    }
  };

  const openAddModal = () => {
    setEditingExpense(null);
    if (activeTab === 'monthly') {
      setMonthlyExpenseForm({ description: '', amount: 0, month: selectedMonth });
    } else {
      setDailyExpenseForm({ description: '', amount: 0, date: selectedDate });
    }
    setShowModal(true);
  };

  const openEditModal = (expense: MonthlyExpense | DailyExpense) => {
    setEditingExpense(expense);
    if (activeTab === 'monthly') {
      const monthlyExp = expense as MonthlyExpense;
      setMonthlyExpenseForm({
        description: monthlyExp.description,
        amount: monthlyExp.amount,
        month: monthlyExp.month,
      });
    } else {
      const dailyExp = expense as DailyExpense;
      setDailyExpenseForm({
        description: dailyExp.description,
        amount: dailyExp.amount,
        date: dailyExp.date,
      });
    }
    setShowModal(true);
  };

  const handleDeleteExpense = (expenseId: string) => {
    if (confirm('هل أنت متأكد من حذف هذا المصروف؟')) {
      if (activeTab === 'monthly') {
        deleteMonthlyMutation.mutate(expenseId);
      } else {
        deleteDailyMutation.mutate(expenseId);
      }
    }
  };

  // Calculate totals - ensure proper number conversion with maximum safety
  const safeMonthlyExpenses = Array.isArray(monthlyExpenses) ? monthlyExpenses : [];
  const safeDailyExpenses = Array.isArray(dailyExpenses) ? dailyExpenses : [];
  
  const totalMonthly = safeMonthlyExpenses.reduce((sum, exp) => {
    if (!exp || typeof exp !== 'object') return sum;
    const amount = parseFloat(String(exp.amount || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const totalDaily = safeDailyExpenses.reduce((sum, exp) => {
    if (!exp || typeof exp !== 'object') return sum;
    const amount = parseFloat(String(exp.amount || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);
  
  const grandTotal = totalMonthly + totalDaily;

  const isLoading = activeTab === 'monthly' ? monthlyLoading : dailyLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">المصروفات</h1>
          <p className="text-xs text-gray-500 mt-1">إدارة المصروفات الشهرية واليومية</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
        >
          + إضافة مصروف {activeTab === 'monthly' ? 'شهري' : 'يومي'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'monthly'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          المصروفات الشهرية
        </button>
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          المصروفات اليومية
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">إجمالي المصروفات الشهرية</div>
          <div className="text-2xl font-bold text-gray-900">{totalMonthly.toFixed(2)} DH</div>
          <div className="text-xs text-gray-400 mt-1">{safeMonthlyExpenses.length} مصروف</div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">إجمالي المصروفات اليومية</div>
          <div className="text-2xl font-bold text-gray-900">{totalDaily.toFixed(2)} DH</div>
          <div className="text-xs text-gray-400 mt-1">{safeDailyExpenses.length} مصروف</div>
        </div>
        
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <div className="text-xs text-gray-500 mb-1">المجموع الإجمالي</div>
          <div className="text-2xl font-bold text-red-600">{grandTotal.toFixed(2)} DH</div>
          <div className="text-xs text-gray-400 mt-1">{safeMonthlyExpenses.length + safeDailyExpenses.length} مصروف</div>
        </div>
      </div>

      {/* Date/Month Filter */}
      {activeTab === 'monthly' ? (
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-700 mb-2">اختر الشهر</label>
          <input
            type="month"
            value={selectedMonth.substring(0, 7)}
            onChange={(e) => setSelectedMonth(`${e.target.value}-01`)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
          <label className="block text-xs font-medium text-gray-700 mb-2">اختر التاريخ</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      )}

      {/* Expenses List */}
      <div className="space-y-3">
        {activeTab === 'monthly' ? (
          safeMonthlyExpenses.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">لا توجد مصروفات شهرية لهذا الشهر</p>
            </div>
          ) : (
            safeMonthlyExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 w-full">
                    <h3 className="text-sm font-semibold text-gray-900">{expense.description}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      الشهر: {new Date(expense.month).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long' })}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{parseFloat(String(expense.amount || 0)).toFixed(2)} DH</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        ) : (
          safeDailyExpenses.length === 0 ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
              <p className="text-sm text-gray-500">لا توجد مصروفات يومية لهذا التاريخ</p>
            </div>
          ) : (
            safeDailyExpenses.map((expense) => (
              <div
                key={expense.id}
                className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-0">
                  <div className="flex-1 w-full">
                    <h3 className="text-sm font-semibold text-gray-900">{expense.description}</h3>
                    <p className="text-xs text-gray-500 mt-1">
                      التاريخ: {new Date(expense.date).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-600">{parseFloat(String(expense.amount || 0)).toFixed(2)} DH</div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(expense)}
                        className="px-3 py-1.5 text-xs bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="px-3 py-1.5 text-xs bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors"
                      >
                        حذف
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              {editingExpense ? 'تعديل المصروف' : `إضافة مصروف ${activeTab === 'monthly' ? 'شهري' : 'يومي'}`}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">الوصف *</label>
                <input
                  type="text"
                  value={activeTab === 'monthly' ? monthlyExpenseForm.description : dailyExpenseForm.description}
                  onChange={(e) => {
                    if (activeTab === 'monthly') {
                      setMonthlyExpenseForm({ ...monthlyExpenseForm, description: e.target.value });
                    } else {
                      setDailyExpenseForm({ ...dailyExpenseForm, description: e.target.value });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  placeholder="مثال: إيجار المقهى، فاتورة الكهرباء، صيانة..."
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">المبلغ (DH) *</label>
                <input
                  type="number"
                  value={activeTab === 'monthly' ? monthlyExpenseForm.amount : dailyExpenseForm.amount}
                  onChange={(e) => {
                    if (activeTab === 'monthly') {
                      setMonthlyExpenseForm({ ...monthlyExpenseForm, amount: Number(e.target.value) });
                    } else {
                      setDailyExpenseForm({ ...dailyExpenseForm, amount: Number(e.target.value) });
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                />
              </div>

              {activeTab === 'monthly' ? (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">الشهر *</label>
                  <input
                    type="month"
                    value={monthlyExpenseForm.month.substring(0, 7)}
                    onChange={(e) => setMonthlyExpenseForm({ ...monthlyExpenseForm, month: `${e.target.value}-01` })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-2">التاريخ *</label>
                  <input
                    type="date"
                    value={dailyExpenseForm.date}
                    onChange={(e) => setDailyExpenseForm({ ...dailyExpenseForm, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingExpense(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                إلغاء
              </button>
              <button
                onClick={editingExpense ? handleUpdateExpense : handleAddExpense}
                className="flex-1 px-4 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                {editingExpense ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
