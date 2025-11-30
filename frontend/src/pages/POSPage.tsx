import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { ordersApi, menuApi, staffApi } from '../api/client';
import { toast } from 'react-hot-toast';

interface Order {
  id: string;
  timestamp: string;
  staff_id: string;
  staff_name: string;
  total_revenue: number;
  total_cost: number;
  items: OrderItem[];
}

interface OrderItem {
  id: string;
  menu_item_id: string;
  menu_item_name: string;
  quantity: number;
  price_at_sale: number;
  cost_at_sale: number;
}

interface MenuItem {
  id: string;
  name: string;
  sale_price: number;
  category: string;
  image_url?: string;
}

interface Staff {
  id: string;
  name: string;
  role: string;
}

export default function POSPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [orderItems, setOrderItems] = useState<{ menu_item_id: string; quantity: number }[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Fetch orders for selected date
  const { data: orders = [], isLoading: ordersLoading } = useQuery<Order[]>({
    queryKey: ['orders', selectedCafeId, selectedDate],
    queryFn: () => ordersApi.getOrders(selectedCafeId!, selectedDate),
    enabled: !!selectedCafeId,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: menuItems = [] } = useQuery<MenuItem[]>({
    queryKey: ['menu', selectedCafeId],
    queryFn: () => menuApi.getMenu(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: staff = [] } = useQuery<Staff[]>({
    queryKey: ['staff', selectedCafeId],
    queryFn: () => staffApi.getStaff(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const createMutation = useMutation({
    mutationFn: () => ordersApi.createOrder(selectedCafeId!, { 
      staff_id: selectedStaff,
      items: orderItems 
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', selectedCafeId] });
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setOrderItems([]);
      toast.success('✅ تم إنشاء الطلب بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId: string) => ordersApi.deleteOrder(selectedCafeId!, orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', selectedCafeId] });
      toast.success('✅ تم حذف الطلب واسترجاع المخزون!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const menuItem = menuItems.find(m => m.id === item.menu_item_id);
      return total + (menuItem ? Number(menuItem.sale_price) * item.quantity : 0);
    }, 0);
  };

  const categories = ['all', ...Array.from(new Set(menuItems.map(item => item.category)))];
  const filteredMenuItems = activeCategory === 'all' 
    ? menuItems 
    : menuItems.filter(item => item.category === activeCategory);

  const dateRevenue = orders.reduce((sum, order) => sum + Number(order.total_revenue), 0);
  const dateCost = orders.reduce((sum, order) => sum + Number(order.total_cost), 0);
  const dateProfit = dateRevenue - dateCost;
  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const addMenuItem = (menuItem: MenuItem) => {
    const existingIndex = orderItems.findIndex(item => item.menu_item_id === menuItem.id);
    if (existingIndex >= 0) {
      const updated = [...orderItems];
      updated[existingIndex].quantity += 1;
      setOrderItems(updated);
    } else {
      setOrderItems([...orderItems, { menu_item_id: menuItem.id, quantity: 1 }]);
    }
    toast.success(`✅ ${menuItem.name} أضيف`);
  };

  if (ordersLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">🛒 نقطة البيع</h1>
          <p className="text-gray-500 text-sm">إدارة المبيعات</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
          />
          {isToday && (
            <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-xs font-semibold">
              اليوم
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-xs font-medium mb-1">عدد الطلبات</p>
          <p className="text-2xl font-bold text-gray-800">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-xs font-medium mb-1">المبيعات</p>
          <p className="text-2xl font-bold text-green-600">{dateRevenue.toFixed(2)} <span className="text-sm">DH</span></p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-xs font-medium mb-1">التكلفة</p>
          <p className="text-2xl font-bold text-red-600">{dateCost.toFixed(2)} <span className="text-sm">DH</span></p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <p className="text-gray-500 text-xs font-medium mb-1">الربح</p>
          <p className="text-2xl font-bold text-blue-600">{dateProfit.toFixed(2)} <span className="text-sm">DH</span></p>
        </div>
      </div>

      {/* Main Content: Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Menu Items */}
        <div className="lg:col-span-2 space-y-4 order-2 lg:order-1">
          {/* Category Filter */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? 'bg-blue-500 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'all' ? 'الكل' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {filteredMenuItems.map(item => (
              <button
                key={item.id}
                onClick={() => addMenuItem(item)}
                className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-300 transition-all overflow-hidden group text-right"
              >
                {item.image_url ? (
                  <div className="h-32 w-full overflow-hidden">
                    <img 
                      src={item.image_url.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} 
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                ) : (
                  <div className="h-32 w-full bg-gray-50 flex items-center justify-center text-4xl">
                    ☕
                  </div>
                )}
                <div className="p-4">
                  <h3 className="font-bold text-gray-800 text-sm mb-1">{item.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{item.category}</p>
                  <p className="text-lg font-bold text-green-600">{Number(item.sale_price).toFixed(2)} DH</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Current Order */}
        <div className="space-y-4 order-1 lg:order-2">
          {/* Staff Selection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">الموظف *</label>
            <select
              value={selectedStaff}
              onChange={(e) => setSelectedStaff(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
            >
              <option value="">اختر الموظف</option>
              {staff.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} - {s.role}
                </option>
              ))}
            </select>
          </div>

          {/* Order Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <h3 className="font-bold text-gray-800 mb-3">الطلب الحالي</h3>
            {orderItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8 text-sm">لا توجد أصناف</p>
            ) : (
              <div className="space-y-2 mb-4">
                {orderItems.map((item, idx) => {
                  const menuItem = menuItems.find(m => m.id === item.menu_item_id);
                  if (!menuItem) return null;
                  return (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      <button
                        onClick={() => setOrderItems(orderItems.filter((_, i) => i !== idx))}
                        className="text-red-500 hover:text-red-600 text-lg font-bold"
                      >
                        ×
                      </button>
                      <div className="flex-1">
                        <p className="font-medium text-sm text-gray-800">{menuItem.name}</p>
                        <p className="text-xs text-gray-500">{Number(menuItem.sale_price).toFixed(2)} DH</p>
                      </div>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const updated = [...orderItems];
                          updated[idx].quantity = Math.max(1, Number(e.target.value));
                          setOrderItems(updated);
                        }}
                        className="w-16 px-2 py-1 border border-gray-300 rounded text-center text-sm"
                        min="1"
                      />
                      <p className="font-bold text-green-600 text-sm w-20 text-left">
                        {(Number(menuItem.sale_price) * item.quantity).toFixed(2)} DH
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {orderItems.length > 0 && (
              <>
                <div className="border-t pt-3 mb-3">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-gray-800">الإجمالي:</span>
                    <span className="text-2xl font-bold text-green-600">{calculateTotal().toFixed(2)} DH</span>
                  </div>
                </div>
                <button
                  onClick={() => createMutation.mutate()}
                  disabled={!selectedStaff || orderItems.length === 0 || createMutation.isPending}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
                >
                  {createMutation.isPending ? '⏳ جاري الإنشاء...' : '✅ تأكيد الطلب'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-800 mb-4">الطلبات ({orders.length})</h3>
        {orders.length === 0 ? (
          <p className="text-gray-400 text-center py-8">لا توجد طلبات في هذا التاريخ</p>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <div key={order.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-xs text-gray-500">{new Date(order.timestamp).toLocaleTimeString('ar-MA')}</p>
                    <p className="font-semibold text-sm text-gray-700">الموظف: {order.staff_name}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-lg font-bold text-green-600">{Number(order.total_revenue).toFixed(2)} DH</p>
                    <p className="text-xs text-gray-500">ربح: {(Number(order.total_revenue) - Number(order.total_cost)).toFixed(2)} DH</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-xs text-gray-600">
                    {order.items.map(item => `${item.menu_item_name} (${item.quantity})`).join(', ')}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm('حذف الطلب سيرجع المخزون. هل أنت متأكد؟')) {
                        deleteMutation.mutate(order.id);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 text-sm font-semibold"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
