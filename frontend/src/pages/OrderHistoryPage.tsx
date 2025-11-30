import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { ordersApi } from '../api/client';

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

export default function OrderHistoryPage() {
  const { selectedCafeId } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['orders', selectedCafeId, selectedDate],
    queryFn: () => ordersApi.getOrders(selectedCafeId!, selectedDate),
    enabled: !!selectedCafeId,
  });

  // Calculate stats
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, order) => sum + Number(order.total_revenue), 0);
  const totalCost = orders.reduce((sum, order) => sum + Number(order.total_cost), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100) : 0;

  // Group by hour
  const ordersByHour = orders.reduce((acc, order) => {
    const hour = new Date(order.timestamp).getHours();
    acc[hour] = (acc[hour] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Top selling items
  const itemSales = orders.reduce((acc, order) => {
    order.items.forEach(item => {
      if (!acc[item.menu_item_name]) {
        acc[item.menu_item_name] = { quantity: 0, revenue: 0 };
      }
      acc[item.menu_item_name].quantity += item.quantity;
      acc[item.menu_item_name].revenue += Number(item.price_at_sale) * item.quantity;
    });
    return acc;
  }, {} as Record<string, { quantity: number; revenue: number }>);

  const topItems = Object.entries(itemSales)
    .sort((a, b) => b[1].quantity - a[1].quantity)
    .slice(0, 5);

  // Staff performance
  const staffPerformance = orders.reduce((acc, order) => {
    if (!acc[order.staff_name]) {
      acc[order.staff_name] = { orders: 0, revenue: 0 };
    }
    acc[order.staff_name].orders += 1;
    acc[order.staff_name].revenue += Number(order.total_revenue);
    return acc;
  }, {} as Record<string, { orders: number; revenue: number }>);

  const topStaff = Object.entries(staffPerformance)
    .sort((a, b) => b[1].revenue - a[1].revenue);

  if (isLoading) {
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
          <h1 className="text-3xl font-bold text-gray-800 mb-1">📊 تاريخ الطلبات</h1>
          <p className="text-gray-500 text-sm">تحليل ومراجعة المبيعات</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          max={new Date().toISOString().split('T')[0]}
          className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">عدد الطلبات</p>
              <p className="text-3xl font-bold text-gray-800">{totalOrders}</p>
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <span className="text-3xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">إجمالي المبيعات</p>
              <p className="text-3xl font-bold text-green-600">{totalRevenue.toFixed(2)} <span className="text-sm">DH</span></p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">الربح الصافي</p>
              <p className="text-3xl font-bold text-blue-600">{totalProfit.toFixed(2)} <span className="text-sm">DH</span></p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <span className="text-3xl">📈</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">هامش الربح</p>
              <p className="text-3xl font-bold text-purple-600">{profitMargin.toFixed(1)}<span className="text-lg">%</span></p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3">
              <span className="text-3xl">📊</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Orders List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-800 mb-4">قائمة الطلبات ({totalOrders})</h3>
            {orders.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📦</div>
                <p className="text-xl font-bold text-gray-400 mb-2">لا توجد طلبات</p>
                <p className="text-gray-400 text-sm">لا توجد طلبات في هذا التاريخ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.map(order => {
                  const profit = Number(order.total_revenue) - Number(order.total_cost);
                  const margin = Number(order.total_revenue) > 0 
                    ? ((profit / Number(order.total_revenue)) * 100) 
                    : 0;

                  return (
                    <button
                      key={order.id}
                      onClick={() => setSelectedOrder(order)}
                      className="w-full text-right border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">
                            {new Date(order.timestamp).toLocaleTimeString('ar-MA')}
                          </p>
                          <p className="font-semibold text-sm text-gray-800">
                            👤 {order.staff_name}
                          </p>
                        </div>
                        <div className="text-left">
                          <p className="text-lg font-bold text-green-600">
                            {Number(order.total_revenue).toFixed(2)} DH
                          </p>
                          <p className="text-xs text-gray-500">
                            ربح: {profit.toFixed(2)} DH ({margin.toFixed(1)}%)
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {order.items.map((item, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                            {item.menu_item_name} ×{item.quantity}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Analytics Sidebar */}
        <div className="space-y-4">
          {/* Top Selling Items */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>🏆</span>
              <span>الأكثر مبيعاً</span>
            </h3>
            {topItems.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {topItems.map(([name, data], idx) => (
                  <div key={name} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                      idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                      idx === 1 ? 'bg-gray-100 text-gray-700' :
                      idx === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{name}</p>
                      <p className="text-xs text-gray-500">{data.quantity} قطعة</p>
                    </div>
                    <p className="font-bold text-sm text-green-600">{data.revenue.toFixed(0)} DH</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Staff Performance */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>👥</span>
              <span>أداء الموظفين</span>
            </h3>
            {topStaff.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-3">
                {topStaff.map(([name, data]) => (
                  <div key={name} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex justify-between items-center mb-1">
                      <p className="font-medium text-sm text-gray-800">{name}</p>
                      <p className="font-bold text-sm text-green-600">{data.revenue.toFixed(0)} DH</p>
                    </div>
                    <p className="text-xs text-gray-500">{data.orders} طلب</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Hourly Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <span>⏰</span>
              <span>التوزيع الزمني</span>
            </h3>
            {Object.keys(ordersByHour).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {Object.entries(ordersByHour)
                  .sort(([a], [b]) => Number(a) - Number(b))
                  .map(([hour, count]) => (
                    <div key={hour} className="flex items-center gap-2">
                      <p className="text-xs font-medium text-gray-600 w-16">{hour}:00</p>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full flex items-center justify-end px-2"
                          style={{ width: `${(count / Math.max(...Object.values(ordersByHour))) * 100}%` }}
                        >
                          <span className="text-white text-xs font-bold">{count}</span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">تفاصيل الطلب</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            {/* Order Info */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">التاريخ والوقت</p>
                  <p className="font-semibold text-sm text-gray-800">
                    {new Date(selectedOrder.timestamp).toLocaleString('ar-MA')}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">الموظف</p>
                  <p className="font-semibold text-sm text-gray-800">{selectedOrder.staff_name}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <h4 className="font-bold text-gray-800 mb-3">الأصناف</h4>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
                    <div className="flex-1">
                      <p className="font-medium text-sm text-gray-800">{item.menu_item_name}</p>
                      <p className="text-xs text-gray-500">
                        {item.quantity} × {Number(item.price_at_sale).toFixed(2)} DH
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-gray-800">
                        {(Number(item.price_at_sale) * item.quantity).toFixed(2)} DH
                      </p>
                      <p className="text-xs text-gray-500">
                        تكلفة: {(Number(item.cost_at_sale) * item.quantity).toFixed(2)} DH
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals */}
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">المبيعات:</span>
                <span className="font-semibold text-gray-800">{Number(selectedOrder.total_revenue).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">التكلفة:</span>
                <span className="font-semibold text-red-600">{Number(selectedOrder.total_cost).toFixed(2)} DH</span>
              </div>
              <div className="flex justify-between text-lg border-t pt-2">
                <span className="font-bold text-gray-800">الربح:</span>
                <span className="font-bold text-green-600">
                  {(Number(selectedOrder.total_revenue) - Number(selectedOrder.total_cost)).toFixed(2)} DH
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
