import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { ordersApi, menuApi } from '../api/client';

interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
}

interface QuickSaleItem {
  menu_item_id: string;
  quantity: number;
}

export default function DailySalesPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [cart, setCart] = useState<Map<string, number>>(new Map());

  const { data: menuItems = [], isLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu', selectedCafeId],
    queryFn: () => menuApi.getMenu(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: todayOrders = [] } = useQuery({
    queryKey: ['orders', selectedCafeId, 'today'],
    queryFn: () => ordersApi.getOrders(selectedCafeId!),
    enabled: !!selectedCafeId,
    select: (data: any[]) => data.filter(order => {
      const orderDate = new Date(order.order_date).toDateString();
      const today = new Date().toDateString();
      return orderDate === today;
    }),
  });

  const createOrderMutation = useMutation({
    mutationFn: (items: QuickSaleItem[]) => ordersApi.createOrder(selectedCafeId!, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', selectedCafeId] });
      queryClient.invalidateQueries({ queryKey: ['stock', selectedCafeId] });
      setCart(new Map());
      alert('✅ تم تسجيل البيع!');
    },
  });

  const addToCart = (itemId: string) => {
    const newCart = new Map(cart);
    newCart.set(itemId, (newCart.get(itemId) || 0) + 1);
    setCart(newCart);
  };

  const removeFromCart = (itemId: string) => {
    const newCart = new Map(cart);
    const current = newCart.get(itemId) || 0;
    if (current > 1) {
      newCart.set(itemId, current - 1);
    } else {
      newCart.delete(itemId);
    }
    setCart(newCart);
  };

  const clearCart = () => setCart(new Map());

  const calculateTotal = () => {
    let total = 0;
    cart.forEach((quantity, itemId) => {
      const item = menuItems.find(m => m.id === itemId);
      if (item) total += item.price * quantity;
    });
    return total;
  };

  const handleCheckout = () => {
    if (cart.size === 0) return;
    const items: QuickSaleItem[] = [];
    cart.forEach((quantity, menu_item_id) => {
      items.push({ menu_item_id, quantity });
    });
    createOrderMutation.mutate(items);
  };

  const todayRevenue = todayOrders.reduce((sum: number, order: any) => sum + order.total_amount, 0);
  const cartTotal = calculateTotal();

  if (isLoading) return <div className="text-center py-12">Loading...</div>;

  const categories = [
    { value: 'hot_drinks', label: '☕ مشروبات ساخنة' },
    { value: 'cold_drinks', label: '🧊 مشروبات باردة' },
    { value: 'food', label: '🍰 مأكولات' },
    { value: 'desserts', label: '🍨 حلويات' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Items - Left Side */}
      <div className="lg:col-span-2 order-2 lg:order-1">
        <h1 className="text-3xl font-bold mb-6">تسجيل المبيعات</h1>

        {/* Today's Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-4 text-white">
            <p className="text-green-100 text-sm">مبيعات اليوم</p>
            <p className="text-3xl font-bold">${todayRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-4 text-white">
            <p className="text-blue-100 text-sm">عدد الطلبات</p>
            <p className="text-3xl font-bold">{todayOrders.length}</p>
          </div>
        </div>

        {/* Menu Categories */}
        {categories.map(cat => {
          const items = menuItems.filter(item => item.category === cat.value);
          if (items.length === 0) return null;

          return (
            <div key={cat.value} className="mb-6">
              <h2 className="text-xl font-bold mb-3">{cat.label}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => addToCart(item.id)}
                    className="bg-white hover:bg-blue-50 border-2 border-gray-200 hover:border-blue-500 rounded-lg p-4 text-left transition-all shadow-md hover:shadow-lg"
                  >
                    <p className="font-bold text-gray-900 mb-1">{item.name}</p>
                    <p className="text-xl font-bold text-green-600">${item.price}</p>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Cart - Right Side */}
      <div className="lg:col-span-1 order-1 lg:order-2">
        <div className="bg-white rounded-lg shadow-xl p-6 sticky top-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">السلة</h2>
            {cart.size > 0 && (
              <button
                onClick={clearCart}
                className="text-red-500 hover:text-red-700 text-sm font-medium"
              >
                🗑️ مسح الكل
              </button>
            )}
          </div>

          <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
            {Array.from(cart.entries()).map(([itemId, quantity]) => {
              const item = menuItems.find(m => m.id === itemId);
              if (!item) return null;
              const itemTotal = item.price * quantity;

              return (
                <div key={itemId} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{item.name}</p>
                    <p className="font-bold text-green-600">${itemTotal.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => removeFromCart(itemId)}
                      className="bg-red-500 hover:bg-red-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold"
                    >
                      -
                    </button>
                    <span className="text-xl font-bold min-w-[30px] text-center">{quantity}</span>
                    <button
                      onClick={() => addToCart(itemId)}
                      className="bg-green-500 hover:bg-green-600 text-white w-8 h-8 rounded flex items-center justify-center font-bold"
                    >
                      +
                    </button>
                    <span className="text-gray-600 ml-2">× ${item.price}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {cart.size === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-5xl mb-3">🛒</p>
              <p>السلة فارغة</p>
            </div>
          )}

          {cart.size > 0 && (
            <>
              <div className="border-t-2 border-gray-200 pt-4 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-medium">المجموع:</span>
                  <span className="text-3xl font-bold text-green-600">
                    ${cartTotal.toFixed(2)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 text-right">
                  {Array.from(cart.values()).reduce((a, b) => a + b, 0)} صنف
                </p>
              </div>

              <button
                onClick={handleCheckout}
                disabled={createOrderMutation.isPending}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white py-4 rounded-lg font-bold text-lg shadow-lg disabled:opacity-50"
              >
                {createOrderMutation.isPending ? 'جاري الحفظ...' : '✅ تسجيل البيع'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
