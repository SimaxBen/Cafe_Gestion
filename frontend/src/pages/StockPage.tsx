import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { stockApi } from '../api/client';

interface StockItem {
  id: string;
  name: string;
  unit_of_measure: string;
  current_quantity: number;
  cost_per_unit: number;
  low_stock_threshold: number;
}

export default function StockPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [showRestockModal, setShowRestockModal] = useState(false);
  const [showWasteModal, setShowWasteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showGlobalHistoryModal, setShowGlobalHistoryModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'low' | 'ok'>('all');
  const [newItem, setNewItem] = useState({
    name: '',
    unit_of_measure: 'kg',
    current_quantity: 0,
    cost_per_unit: 0,
    low_stock_threshold: 0,
  });
  const [restockData, setRestockData] = useState({
    quantity: 0,
    cost_per_unit: 0,
    notes: '',
  });
  const [wasteData, setWasteData] = useState({
    quantity: 0,
    reason: '',
  });
  const [editData, setEditData] = useState({
    name: '',
    unit_of_measure: '',
    low_stock_threshold: 0,
  });

  const { data: stockItems = [], isLoading } = useQuery<StockItem[]>({
    queryKey: ['stock', selectedCafeId],
    queryFn: () => stockApi.getStock(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: historyItems = [] } = useQuery({
    queryKey: ['stockHistory', selectedCafeId, selectedItem?.id],
    queryFn: () => stockApi.getStockHistory(selectedCafeId!, selectedItem!.id),
    enabled: !!selectedCafeId && !!selectedItem && showHistoryModal,
  });

  const { data: allStockHistory = [] } = useQuery({
    queryKey: ['allStockHistory', selectedCafeId],
    queryFn: () => stockApi.getAllStockHistory(selectedCafeId!),
    enabled: !!selectedCafeId && showGlobalHistoryModal,
  });

  // Show notification when stock is low
  useEffect(() => {
    if (stockItems.length > 0) {
      const lowStockItems = stockItems.filter(item => Number(item.current_quantity) <= Number(item.low_stock_threshold));
      if (lowStockItems.length > 0) {
        toast.warning(
          `⚠️ ${lowStockItems.length} صنف تحت الحد الأدنى`,
          {
            description: lowStockItems.map(item => `${item.name}: ${item.current_quantity} ${item.unit_of_measure}`).join(' • '),
            duration: 10000,
          }
        );
      }
    }
  }, [stockItems]);

  const createMutation = useMutation({
    mutationFn: () => stockApi.createStockItem(selectedCafeId!, newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setNewItem({ name: '', unit_of_measure: 'kg', current_quantity: 0, cost_per_unit: 0, low_stock_threshold: 0 });
      setShowModal(false);
      toast.success('✅ تم إضافة الصنف بنجاح!');
    },
  });

  const restockMutation = useMutation({
    mutationFn: () => stockApi.restock(selectedCafeId!, selectedItem!.id, restockData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setShowRestockModal(false);
      setRestockData({ quantity: 0, cost_per_unit: 0, notes: '' });
      toast.success('✅ تم تحديث المخزون بنجاح!');
    },
  });

  const wasteMutation = useMutation({
    mutationFn: () => stockApi.recordWaste(selectedCafeId!, selectedItem!.id, wasteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setShowWasteModal(false);
      setWasteData({ quantity: 0, reason: '' });
      toast.success('✅ تم تسجيل الهدر بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: () => stockApi.updateStockItem(selectedCafeId!, selectedItem!.id, editData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setShowEditModal(false);
      toast.success('✅ تم تحديث البيانات بنجاح!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (itemId: string) => stockApi.deleteItem(selectedCafeId!, itemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      toast.success('✅ تم حذف الصنف بنجاح!');
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast.error(`❌ فشل الحذف: ${error.response?.data?.detail || error.message}`);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Recalculate on every render to ensure real-time updates
  const lowStockItems = stockItems.filter(item => Number(item.current_quantity) <= Number(item.low_stock_threshold));
  const totalValue = stockItems.reduce((sum, item) => sum + (Number(item.current_quantity) * Number(item.cost_per_unit)), 0);

  // Filter and search
  const filteredItems = stockItems
    .filter(item => {
      if (filterStatus === 'low') return Number(item.current_quantity) <= Number(item.low_stock_threshold);
      if (filterStatus === 'ok') return Number(item.current_quantity) > Number(item.low_stock_threshold);
      return true;
    })
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const getStockStatus = (item: StockItem) => {
    const percentage = (Number(item.current_quantity) / Number(item.low_stock_threshold)) * 100;
    if (percentage <= 100) return { color: 'red', label: 'حرج', icon: '🚨' };
    if (percentage <= 150) return { color: 'yellow', label: 'منخفض', icon: '⚠️' };
    return { color: 'green', label: 'جيد', icon: '✅' };
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">📦 إدارة المخزون</h1>
          <p className="text-gray-500 text-sm">إدارة شاملة لمخزون المقهى</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowGlobalHistoryModal(true)}
            className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
          >
            <span className="text-xl">📜</span>
            <span className="hidden sm:inline">سجل الحركات</span>
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <span className="text-xl">+</span>
            <span>إضافة صنف جديد</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">إجمالي الأصناف</p>
              <p className="text-3xl font-bold text-gray-800">{stockItems.length}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-3xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">أصناف منخفضة</p>
              <p className="text-3xl font-bold text-gray-800">{lowStockItems.length}</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <span className="text-3xl">⚠️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">القيمة الإجمالية</p>
              <p className="text-3xl font-bold text-gray-800">{totalValue.toFixed(2)} <span className="text-lg text-gray-500">DH</span></p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">متوسط التكلفة</p>
              <p className="text-3xl font-bold text-gray-800">
                {stockItems.length > 0 ? (totalValue / stockItems.length).toFixed(2) : '0.00'} <span className="text-lg text-gray-500">DH</span>
              </p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="🔍 البحث عن صنف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2.5 pr-10 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filterStatus === 'all'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              الكل ({stockItems.length})
            </button>
            <button
              onClick={() => setFilterStatus('low')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filterStatus === 'low'
                  ? 'bg-red-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              منخفض ({lowStockItems.length})
            </button>
            <button
              onClick={() => setFilterStatus('ok')}
              className={`px-4 py-2.5 rounded-lg font-semibold text-sm transition-all ${
                filterStatus === 'ok'
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              جيد ({stockItems.length - lowStockItems.length})
            </button>
          </div>
        </div>
      </div>

      {/* Stock Items Grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map((item) => {
            const status = getStockStatus(item);
            const percentage = (item.current_quantity / item.low_stock_threshold) * 100;
            
            return (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all overflow-hidden"
              >
                {/* Header */}
                <div className={`p-4 ${
                  status.color === 'red' ? 'bg-gradient-to-l from-white to-red-50' :
                  status.color === 'yellow' ? 'bg-gradient-to-l from-white to-yellow-50' :
                  'bg-gradient-to-l from-white to-green-50'
                } border-r-4 ${
                  status.color === 'red' ? 'border-red-400' :
                  status.color === 'yellow' ? 'border-yellow-400' :
                  'border-green-400'
                }`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-800">{item.name}</h3>
                      <p className="text-xs text-gray-500">{item.unit_of_measure}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-lg text-xs font-bold ${
                      status.color === 'red' ? 'bg-red-100 text-red-700' :
                      status.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {status.icon} {status.label}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        status.color === 'red' ? 'bg-red-500' :
                        status.color === 'yellow' ? 'bg-yellow-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 text-center">{percentage.toFixed(0)}%</p>
                </div>

                {/* Body */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-xs font-medium">الكمية الحالية</span>
                    <span className="text-xl font-bold text-gray-800">
                      {item.current_quantity} <span className="text-sm text-gray-500">{item.unit_of_measure}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-blue-600 text-xs font-medium">التكلفة</span>
                    <span className="text-lg font-bold text-blue-600">
                      {Number(item.cost_per_unit).toFixed(2)} DH
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-purple-600 text-xs font-medium">القيمة الإجمالية</span>
                    <span className="text-lg font-bold text-purple-600">
                      {(item.current_quantity * Number(item.cost_per_unit)).toFixed(2)} DH
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
                    <span>الحد الأدنى</span>
                    <span className="font-semibold">{item.low_stock_threshold} {item.unit_of_measure}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-5 gap-1">
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setRestockData({ quantity: 0, cost_per_unit: Number(item.cost_per_unit), notes: '' });
                      setShowRestockModal(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white py-1.5 px-1 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    title="إضافة مخزون"
                  >
                    <span>➕</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setWasteData({ quantity: 0, reason: '' });
                      setShowWasteModal(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-orange-500 hover:bg-orange-600 text-white py-1.5 px-1 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    title="تسجيل هدر"
                  >
                    <span>⚠️</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setShowHistoryModal(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 text-white py-1.5 px-1 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    title="سجل الحركات"
                  >
                    <span>📜</span>
                  </button>
                  <button
                    onClick={() => {
                      setSelectedItem(item);
                      setEditData({
                        name: item.name,
                        unit_of_measure: item.unit_of_measure,
                        low_stock_threshold: item.low_stock_threshold,
                      });
                      setShowEditModal(true);
                    }}
                    className="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-1 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    title="تعديل"
                  >
                    <span>✏️</span>
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) {
                        deleteMutation.mutate(item.id);
                      }
                    }}
                    className="flex items-center justify-center bg-red-500 hover:bg-red-600 text-white py-1.5 px-1 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                    title="حذف"
                  >
                    <span>🗑️</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">📦</div>
          <p className="text-xl font-bold text-gray-400 mb-2">لا توجد أصناف</p>
          <p className="text-gray-400 text-sm">
            {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'ابدأ بإضافة أصناف جديدة للمخزون'}
          </p>
        </div>
      )}

      {/* Add Item Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">➕ إضافة صنف جديد</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الصنف *</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    placeholder="مثال: سكر، قهوة، حليب..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوحدة *</label>
                  <select
                    value={newItem.unit_of_measure}
                    onChange={(e) => setNewItem({ ...newItem, unit_of_measure: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  >
                    <option value="kg">كيلوغرام (kg)</option>
                    <option value="liter">لتر (liter)</option>
                    <option value="piece">قطعة (piece)</option>
                    <option value="box">صندوق (box)</option>
                    <option value="bag">كيس (bag)</option>
                    <option value="gram">جرام (gram)</option>
                    <option value="ml">مليلتر (ml)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية الأولية *</label>
                  <input
                    type="number"
                    value={newItem.current_quantity}
                    onChange={(e) => setNewItem({ ...newItem, current_quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التكلفة لكل وحدة *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">DH</span>
                    <input
                      type="number"
                      value={newItem.cost_per_unit}
                      onChange={(e) => setNewItem({ ...newItem, cost_per_unit: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الحد الأدنى *</label>
                  <input
                    type="number"
                    value={newItem.low_stock_threshold}
                    onChange={(e) => setNewItem({ ...newItem, low_stock_threshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>

                {newItem.current_quantity > 0 && newItem.cost_per_unit > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                    <p className="text-xs text-gray-600 mb-1">القيمة الإجمالية للكمية الأولية:</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {(newItem.current_quantity * newItem.cost_per_unit).toFixed(2)} DH
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!newItem.name || newItem.cost_per_unit <= 0}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ إضافة الصنف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {showRestockModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">➕ إضافة كمية - {selectedItem.name}</h3>
              <button
                onClick={() => setShowRestockModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">الكمية الحالية</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedItem.current_quantity} <span className="text-lg text-gray-500">{selectedItem.unit_of_measure}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية المضافة *</label>
                  <input
                    type="number"
                    value={restockData.quantity}
                    onChange={(e) => setRestockData({ ...restockData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 text-lg transition-all"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">التكلفة لكل وحدة *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">DH</span>
                    <input
                      type="number"
                      value={restockData.cost_per_unit}
                      onChange={(e) => setRestockData({ ...restockData, cost_per_unit: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 text-lg transition-all"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">التكلفة الحالية: {Number(selectedItem.cost_per_unit).toFixed(2)} DH</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ملاحظات (اختياري)</label>
                  <textarea
                    value={restockData.notes}
                    onChange={(e) => setRestockData({ ...restockData, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400 text-sm transition-all h-24 resize-none"
                    placeholder="سبب الإضافة، رقم الفاتورة، إلخ..."
                  />
                </div>

                {restockData.quantity > 0 && (
                  <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      <div>
                        <p className="text-xs text-gray-600 mb-1">الكمية الجديدة</p>
                        <p className="text-xl font-bold text-green-600">
                          {selectedItem.current_quantity + restockData.quantity} {selectedItem.unit_of_measure}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 mb-1">تكلفة الإضافة</p>
                        <p className="text-xl font-bold text-green-600">
                          {(restockData.quantity * restockData.cost_per_unit).toFixed(2)} DH
                        </p>
                      </div>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(
                            ((selectedItem.current_quantity + restockData.quantity) / selectedItem.low_stock_threshold) * 100,
                            100
                          )}%`
                        }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  setShowRestockModal(false);
                  setRestockData({ quantity: 0, cost_per_unit: 0, notes: '' });
                }}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => restockMutation.mutate()}
                disabled={restockData.quantity <= 0 || restockData.cost_per_unit <= 0}
                className="flex-1 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ تأكيد الإضافة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waste Modal */}
      {showWasteModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">🗑️ تسجيل هدر - {selectedItem.name}</h3>
              <button
                onClick={() => setShowWasteModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-xs text-gray-500 mb-1">الكمية الحالية</p>
                  <p className="text-3xl font-bold text-gray-800">
                    {selectedItem.current_quantity} <span className="text-lg text-gray-500">{selectedItem.unit_of_measure}</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية المهدرة *</label>
                  <input
                    type="number"
                    value={wasteData.quantity}
                    onChange={(e) => setWasteData({ ...wasteData, quantity: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 text-lg transition-all"
                    min="0"
                    step="0.01"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">السبب (اختياري)</label>
                  <textarea
                    value={wasteData.reason}
                    onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 text-sm transition-all h-32 resize-none"
                    placeholder="سبب الهدر، ملاحظات إضافية..."
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowWasteModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => wasteMutation.mutate()}
                disabled={wasteData.quantity <= 0}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ تسجيل الهدر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">✏️ تعديل - {selectedItem.name}</h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">اسم الصنف *</label>
                  <input
                    type="text"
                    value={editData.name}
                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-lg transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الوحدة *</label>
                  <select
                    value={editData.unit_of_measure}
                    onChange={(e) => setEditData({ ...editData, unit_of_measure: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-lg transition-all"
                  >
                    <option value="kg">كيلوغرام (kg)</option>
                    <option value="liter">لتر (liter)</option>
                    <option value="piece">قطعة (piece)</option>
                    <option value="box">صندوق (box)</option>
                    <option value="bag">كيس (bag)</option>
                    <option value="gram">جرام (gram)</option>
                    <option value="ml">مليلتر (ml)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">الحد الأدنى *</label>
                  <input
                    type="number"
                    value={editData.low_stock_threshold}
                    onChange={(e) => setEditData({ ...editData, low_stock_threshold: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-lg transition-all"
                    min="0"
                    step="0.01"
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1">💡 ملاحظة</p>
                  <p className="text-xs text-gray-700">
                    لتغيير التكلفة، استخدم زر "إضافة" لإضافة كمية جديدة بالتكلفة الجديدة. هذا يحافظ على تاريخ التكاليف.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowEditModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => updateMutation.mutate()}
                disabled={!editData.name}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📜 سجل الحركات - {selectedItem.name}</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {historyItems.length > 0 ? (
                <div className="relative border-r-2 border-gray-200 mr-4 space-y-6">
                  {historyItems.map((item: any) => (
                    <div key={item.id} className="relative pr-8">
                      <div className={`absolute -right-2.5 top-1 w-5 h-5 rounded-full border-4 border-white ${
                        item.transaction_type === 'restock' || item.transaction_type === 'initial' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      
                      <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold mb-2 ${
                              item.transaction_type === 'restock' ? 'bg-green-100 text-green-700' :
                              item.transaction_type === 'initial' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.transaction_type === 'restock' ? 'إضافة مخزون' :
                               item.transaction_type === 'initial' ? 'رصيد افتتاحي' :
                               item.transaction_type}
                            </span>
                            <p className="text-xs text-gray-500">
                              {new Date(item.created_at).toLocaleDateString('ar-MA', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                          <span className={`text-lg font-bold ${
                            Number(item.quantity_change) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(item.quantity_change) > 0 ? '+' : ''}{Number(item.quantity_change)} {selectedItem.unit_of_measure}
                          </span>
                        </div>
                        {item.notes && (
                          <p className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-100">
                            📝 {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  لا يوجد سجل حركات لهذا الصنف
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Global History Modal */}
      {showGlobalHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📜 سجل حركات المخزون</h3>
              <button
                onClick={() => setShowGlobalHistoryModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              {allStockHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-right min-w-[600px]">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
                      <tr>
                        <th className="px-4 py-3 rounded-tr-lg">التاريخ</th>
                        <th className="px-4 py-3">الصنف</th>
                        <th className="px-4 py-3">النوع</th>
                        <th className="px-4 py-3">الكمية</th>
                        <th className="px-4 py-3 rounded-tl-lg">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {allStockHistory.map((item: any) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {new Date(item.created_at).toLocaleDateString('ar-MA', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                          <td className="px-4 py-3 font-bold text-gray-800">{item.stock_item_name}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-bold ${
                              item.transaction_type === 'restock' ? 'bg-green-100 text-green-700' :
                              item.transaction_type === 'initial' ? 'bg-blue-100 text-blue-700' :
                              item.transaction_type === 'waste' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {item.transaction_type === 'restock' ? 'إضافة' :
                               item.transaction_type === 'initial' ? 'افتتاحي' :
                               item.transaction_type === 'waste' ? 'هدر' :
                               item.transaction_type}
                            </span>
                          </td>
                          <td className={`px-4 py-3 font-bold ${
                            Number(item.quantity_change) > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {Number(item.quantity_change) > 0 ? '+' : ''}{Number(item.quantity_change)}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  لا يوجد سجل حركات
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
