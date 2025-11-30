import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { menuApi, wasteApi } from '../api/client';

interface MenuItem {
  id: string;
  name: string;
  image_url?: string;
}

interface WasteRecord {
  id: string;
  menu_item_name: string;
  quantity: number;
  total_cost: number;
  reason: string;
  created_at: string;
}

export default function WastePage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [wasteData, setWasteData] = useState({
    quantity: 1,
    reason: '',
  });

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu', selectedCafeId],
    queryFn: () => menuApi.getMenu(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: wasteHistory = [], isLoading: historyLoading } = useQuery<WasteRecord[]>({
    queryKey: ['wasteHistory', selectedCafeId],
    queryFn: () => wasteApi.getMenuWasteHistory(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const wasteMutation = useMutation({
    mutationFn: () => wasteApi.recordMenuWaste(selectedCafeId!, {
      menu_item_id: selectedItem!.id,
      quantity: wasteData.quantity,
      reason: wasteData.reason
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wasteHistory', selectedCafeId] });
      setShowModal(false);
      setWasteData({ quantity: 1, reason: '' });
      toast.success('✅ تم تسجيل الهدر بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const filteredItems = menuItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (menuLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">🗑️ تسجيل الهدر (المنتجات)</h1>
          <p className="text-gray-500 text-sm">تسجيل هدر المنتجات الجاهزة وخصم مكوناتها من المخزون</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 ابحث عن منتج..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 text-sm transition-all"
          />
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Menu Items Grid */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-800 mb-4">المنتجات</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div 
                key={item.id}
                onClick={() => {
                  setSelectedItem(item);
                  setShowModal(true);
                }}
                className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-red-300 cursor-pointer transition-all overflow-hidden group"
              >
                <div className="h-32 w-full overflow-hidden bg-gray-100 relative">
                  {item.image_url ? (
                    <img 
                      src={item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-4xl">☕</div>
                  )}
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold transform translate-y-4 group-hover:translate-y-0 transition-all">
                      تسجيل هدر
                    </span>
                  </div>
                </div>
                <div className="p-3 text-center">
                  <h3 className="font-bold text-gray-800">{item.name}</h3>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent History */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold text-gray-800 mb-4">سجل الهدر الحديث</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center text-gray-500">جاري التحميل...</div>
            ) : wasteHistory.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {wasteHistory.map((record) => (
                  <div key={record.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-gray-800">{record.menu_item_name}</h4>
                      <span className="text-xs text-gray-500">
                        {new Date(record.created_at).toLocaleDateString('ar-MA')}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded text-xs font-bold">
                        {record.quantity} قطعة
                      </span>
                      <span className="text-gray-600 font-medium">
                        التكلفة: {Number(record.total_cost).toFixed(2)} DH
                      </span>
                    </div>
                    {record.reason && (
                      <p className="text-xs text-gray-500 mt-2 bg-gray-50 p-2 rounded border border-gray-100">
                        📝 {record.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                لا يوجد سجل هدر
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Waste Modal */}
      {showModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800">🗑️ تسجيل هدر - {selectedItem.name}</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">الكمية المهدرة *</label>
                <input
                  type="number"
                  value={wasteData.quantity}
                  onChange={(e) => setWasteData({ ...wasteData, quantity: Number(e.target.value) })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 text-lg transition-all"
                  min="1"
                  step="1"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">السبب (اختياري)</label>
                <textarea
                  value={wasteData.reason}
                  onChange={(e) => setWasteData({ ...wasteData, reason: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-red-400 text-sm transition-all h-24 resize-none"
                  placeholder="سبب الهدر..."
                />
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
                onClick={() => wasteMutation.mutate()}
                disabled={wasteData.quantity <= 0}
                className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
