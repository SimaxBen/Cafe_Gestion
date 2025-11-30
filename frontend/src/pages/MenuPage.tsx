import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '../store/authStore';
import { menuApi, stockApi, categoriesApi, uploadApi } from '../api/client';

interface MenuItem {
  id: string;
  name: string;
  sale_price: number;
  category_id?: string;
  image_url?: string;
}

interface MenuCategory {
  id: string;
  name: string;
  name_ar?: string;
  icon: string;
  color_from: string;
  color_to: string;
  bg_light: string;
  border_color: string;
  display_order: number;
}

interface Recipe {
  id: string;
  stock_item_id: string;
  stock_item_name: string;
  quantity_used: number;
  unit_of_measure: string;
}

interface StockItem {
  id: string;
  name: string;
  unit_of_measure: string;
  current_quantity: number;
  cost_per_unit: number;
}

export default function MenuPage() {
  const { selectedCafeId } = useAuthStore();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MenuCategory | null>(null);
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newItem, setNewItem] = useState({
    name: '',
    sale_price: 0,
    category_id: '',
    image_url: '',
  });

  const [editItem, setEditItem] = useState({
    name: '',
    category_id: '',
    image_url: '',
  });

  const [newCategory, setNewCategory] = useState({
    name: '',
    name_ar: '',
    icon: '🍽️',
    color_from: 'blue-400',
    color_to: 'blue-600',
    bg_light: 'blue-50',
    border_color: 'blue-300',
    display_order: 0,
  });

  const [recipeItems, setRecipeItems] = useState<{ stock_item_id: string; quantity_used: number }[]>([]);

  const { data: menuItems = [], isLoading: menuLoading } = useQuery<MenuItem[]>({
    queryKey: ['menu', selectedCafeId],
    queryFn: () => menuApi.getMenu(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<MenuCategory[]>({
    queryKey: ['categories', selectedCafeId],
    queryFn: () => categoriesApi.getCategories(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: stockItems = [] } = useQuery<StockItem[]>({
    queryKey: ['stock', selectedCafeId],
    queryFn: () => stockApi.getStock(selectedCafeId!),
    enabled: !!selectedCafeId,
  });

  const { data: recipes = [], refetch: refetchRecipes } = useQuery<Recipe[]>({
    queryKey: ['recipes', selectedMenuItem?.id],
    queryFn: () => menuApi.getRecipe(selectedCafeId!, selectedMenuItem!.id),
    enabled: !!selectedCafeId && !!selectedMenuItem,
  });

  const handleFileUpload = async (file: File, isEdit: boolean = false) => {
    try {
      const toastId = toast.loading('جاري رفع الصورة...');
      
      // If editing and there's an existing image, delete it first
      if (isEdit && editItem.image_url) {
        try {
          await uploadApi.deleteFile(editItem.image_url);
        } catch (e) {
          console.warn('Failed to delete old image:', e);
        }
      }
      
      const response = await uploadApi.uploadFile(file);
      
      if (isEdit) {
        setEditItem(prev => ({ ...prev, image_url: response.url }));
      } else {
        setNewItem(prev => ({ ...prev, image_url: response.url }));
      }
      
      toast.dismiss(toastId);
      toast.success('✅ تم رفع الصورة بنجاح');
    } catch (error) {
      toast.dismiss();
      toast.error('❌ فشل رفع الصورة');
      console.error(error);
    }
  };

  const createMenuMutation = useMutation({
    mutationFn: () => menuApi.createMenuItem(selectedCafeId!, newItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', selectedCafeId] });
      setNewItem({ name: '', sale_price: 0, category_id: '', image_url: '' });
      setShowAddModal(false);
      toast.success('✅ تم إضافة الصنف بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: () => menuApi.updateMenuItem(selectedCafeId!, selectedMenuItem!.id, editItem),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', selectedCafeId] });
      setShowEditModal(false);
      toast.success('✅ تم تحديث الصنف بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updatePriceMutation = useMutation({
    mutationFn: ({ itemId, price }: { itemId: string; price: number }) =>
      menuApi.updatePrice(selectedCafeId!, itemId, price),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', selectedCafeId] });
      toast.success('✅ تم تحديث السعر بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const addRecipeIngredientMutation = useMutation({
    mutationFn: (data: { stock_item_id: string; quantity_used: number }) =>
      menuApi.addRecipeIngredient(selectedCafeId!, selectedMenuItem!.id, data),
    onSuccess: () => {
      refetchRecipes();
      toast.success('✅ تم إضافة المكون!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteRecipeIngredientMutation = useMutation({
    mutationFn: (recipeId: string) =>
      menuApi.deleteRecipeIngredient(selectedCafeId!, selectedMenuItem!.id, recipeId),
    onSuccess: () => {
      refetchRecipes();
      toast.success('✅ تم حذف المكون!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (itemId: string) => {
      // Find the item to get its image URL
      const item = menuItems.find(i => i.id === itemId);
      if (item?.image_url) {
        try {
          await uploadApi.deleteFile(item.image_url);
        } catch (e) {
          console.warn('Failed to delete image:', e);
        }
      }
      return menuApi.deleteMenuItem(selectedCafeId!, itemId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menu', selectedCafeId] });
      toast.success('✅ تم حذف الصنف!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: () => categoriesApi.createCategory(selectedCafeId!, newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCafeId] });
      setNewCategory({
        name: '',
        name_ar: '',
        icon: '🍽️',
        color_from: 'blue-400',
        color_to: 'blue-600',
        bg_light: 'blue-50',
        border_color: 'blue-300',
        display_order: 0,
      });
      setShowCategoryModal(false);
      setEditingCategory(null);
      toast.success('✅ تم إضافة المجموعة بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: () => categoriesApi.updateCategory(selectedCafeId!, editingCategory!.id, newCategory),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCafeId] });
      setNewCategory({
        name: '',
        name_ar: '',
        icon: '🍽️',
        color_from: 'blue-400',
        color_to: 'blue-600',
        bg_light: 'blue-50',
        border_color: 'blue-300',
        display_order: 0,
      });
      setShowCategoryModal(false);
      setEditingCategory(null);
      toast.success('✅ تم تحديث المجموعة بنجاح!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (categoryId: string) => categoriesApi.deleteCategory(selectedCafeId!, categoryId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', selectedCafeId] });
      queryClient.invalidateQueries({ queryKey: ['menu', selectedCafeId] });
      toast.success('✅ تم حذف المجموعة!');
    },
    onError: (error: any) => {
      toast.error(`❌ فشل: ${error.response?.data?.detail || error.message}`);
    },
  });

  const calculateCost = (itemId: string) => {
    if (selectedMenuItem?.id !== itemId) return 0;
    if (!recipes.length) return 0;
    
    return recipes.reduce((total, recipe) => {
      const stock = stockItems.find(s => s.id === recipe.stock_item_id);
      return total + (stock ? Number(stock.cost_per_unit) * Number(recipe.quantity_used) : 0);
    }, 0);
  };

  if (menuLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500"></div>
      </div>
    );
  }

  // Filter menu items
  const filteredItems = menuItems
    .filter(item => selectedCategory === 'all' || item.category_id === selectedCategory)
    .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Group by category
  const groupedItems = categories.reduce((acc, cat) => {
    acc[cat.id] = filteredItems.filter(item => item.category_id === cat.id);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const totalItems = menuItems.length;
  const avgPrice = menuItems.length > 0 
    ? menuItems.reduce((sum, item) => sum + Number(item.sale_price), 0) / menuItems.length 
    : 0;

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-1">🍽️ قائمة الطعام</h1>
          <p className="text-gray-500 text-sm">إدارة الأصناف والمجموعات والوصفات</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => {
              setEditingCategory(null);
              setNewCategory({
                name: '',
                name_ar: '',
                icon: '🍽️',
                color_from: 'blue-400',
                color_to: 'blue-600',
                bg_light: 'blue-50',
                border_color: 'blue-300',
                display_order: categories.length,
              });
              setShowCategoryModal(true);
            }}
            className="flex items-center gap-2 bg-white border-2 border-purple-200 hover:border-purple-300 text-purple-600 px-5 py-3 rounded-lg font-semibold shadow-sm hover:shadow-md transition-all duration-200"
          >
            <span className="text-xl">📂</span>
            <span>المجموعات</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
          >
            <span className="text-xl">+</span>
            <span>إضافة صنف</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">إجمالي الأصناف</p>
              <p className="text-3xl font-bold text-gray-800">{totalItems}</p>
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <span className="text-3xl">🍽️</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">متوسط السعر</p>
              <p className="text-3xl font-bold text-gray-800">{avgPrice.toFixed(2)} <span className="text-lg text-gray-500">DH</span></p>
            </div>
            <div className="bg-green-50 rounded-lg p-3">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-xs font-medium mb-1">المجموعات</p>
              <p className="text-3xl font-bold text-gray-800">{categories.length}</p>
            </div>
            <div className="bg-orange-50 rounded-lg p-3">
              <span className="text-3xl">📂</span>
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
              placeholder="البحث عن صنف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2 mt-4 flex-wrap">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === 'all'
                ? 'bg-gray-800 text-white shadow-sm'
                : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            الكل ({totalItems})
          </button>
          {categories.map(cat => {
            const count = menuItems.filter(item => item.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                <span className="mr-1">{cat.icon}</span>
                {cat.name_ar || cat.name} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Menu Items by Category */}
      {filteredItems.length > 0 ? (
        <div className="space-y-8">
          {categories.map(category => {
            const items = groupedItems[category.id];
            if (!items || items.length === 0) return null;

            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-3 bg-white border-l-4 border-blue-500 px-5 py-3 rounded-lg shadow-sm">
                  <span className="text-2xl">{category.icon}</span>
                  <h2 className="text-xl font-bold text-gray-800">{category.name_ar || category.name}</h2>
                  <span className="bg-gray-100 px-3 py-1 rounded-full text-xs font-semibold text-gray-600">
                    {items.length}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {items.map((item) => {
                    const cost = calculateCost(item.id);
                    const profit = Number(item.sale_price) - cost;
                    const margin = cost > 0 ? ((profit / Number(item.sale_price)) * 100) : 0;

                    return (
                      <div
                        key={item.id}
                        className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                      >
                        {/* Card Header */}
                        <div className="bg-white border-b border-gray-100">
                          {item.image_url ? (
                            <div className="h-48 w-full overflow-hidden relative group">
                              <img 
                                src={item.image_url?.startsWith('http') ? item.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${item.image_url}`} 
                                alt={item.name}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                                <span className="text-xl">{category.icon}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gradient-to-br from-gray-50 to-white p-5">
                              <div className="flex items-start justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-800 flex-1">{item.name}</h3>
                                <span className="text-2xl">{category.icon}</span>
                              </div>
                            </div>
                          )}
                          
                          <div className="p-4">
                            {item.image_url && (
                              <h3 className="text-lg font-semibold text-gray-800 mb-2">{item.name}</h3>
                            )}
                            <div className="flex items-baseline gap-1">
                              <p className="text-2xl font-bold text-blue-600">{Number(item.sale_price).toFixed(2)}</p>
                              <p className="text-sm text-gray-500 font-medium">DH</p>
                            </div>
                          </div>
                        </div>

                        {/* Card Body */}
                        <div className="p-4 space-y-3">
                          {/* Cost & Profit (if recipe loaded) */}
                          {selectedMenuItem?.id === item.id && cost > 0 && (
                            <div className="space-y-2 bg-gray-50 rounded-lg p-3 border border-gray-100">
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">التكلفة</span>
                                <span className="font-semibold text-red-600">{cost.toFixed(2)} DH</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">الربح</span>
                                <span className="font-semibold text-green-600">{profit.toFixed(2)} DH</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-gray-600 font-medium">هامش الربح</span>
                                <span className="font-semibold text-blue-600">{margin.toFixed(1)}%</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    margin >= 50 ? 'bg-green-500' : margin >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(margin, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          )}

                          {/* Recipe Info */}
                          <div className="flex items-center justify-between text-xs text-gray-600 bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                            <span>المكونات</span>
                            <span className="font-semibold text-gray-700">
                              {selectedMenuItem?.id === item.id ? recipes.length : '—'} مكون
                            </span>
                          </div>
                        </div>

                        {/* Card Actions */}
                        <div className="p-3 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                          <button
                            onClick={() => {
                              setSelectedMenuItem(item);
                              setShowRecipeModal(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-purple-500 hover:bg-purple-600 text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                          >
                            <span>📝</span>
                            <span>الوصفة</span>
                          </button>
                          <button
                            onClick={() => {
                              setSelectedMenuItem(item);
                              setEditItem({ 
                                name: item.name, 
                                category_id: item.category_id || '',
                                image_url: item.image_url || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="flex items-center justify-center gap-1 bg-blue-500 hover:bg-blue-600 text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                          >
                            <span>✏️</span>
                            <span>تعديل</span>
                          </button>
                          <button
                            onClick={() => {
                              const newPrice = prompt('السعر الجديد:', item.sale_price.toString());
                              if (newPrice && !isNaN(Number(newPrice)) && Number(newPrice) > 0) {
                                updatePriceMutation.mutate({ itemId: item.id, price: Number(newPrice) });
                              }
                            }}
                            className="flex items-center justify-center gap-1 bg-green-500 hover:bg-green-600 text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                          >
                            <span>💲</span>
                            <span>السعر</span>
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`هل أنت متأكد من حذف "${item.name}"؟`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="flex items-center justify-center gap-1 bg-red-500 hover:bg-red-600 text-white py-1.5 px-2 rounded-lg text-xs font-semibold shadow-sm hover:shadow transition-all"
                          >
                            <span>🗑️</span>
                            <span>حذف</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="text-6xl mb-4">🍽️</div>
          <p className="text-xl font-semibold text-gray-600 mb-2">لا توجد أصناف</p>
          <p className="text-sm text-gray-400">
            {searchQuery ? 'لم يتم العثور على نتائج للبحث' : 'ابدأ بإضافة أصناف جديدة للقائمة'}
          </p>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">
                {editingCategory ? '✏️ تعديل المجموعة' : '📂 إدارة المجموعات'}
              </h3>
              <button
                onClick={() => {
                  setShowCategoryModal(false);
                  setEditingCategory(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            {/* Existing Categories List */}
            {!editingCategory && categories.length > 0 && (
              <div className="mb-6">
                <h4 className="text-lg font-semibold mb-3 text-gray-700">المجموعات الحالية</h4>
                <div className="space-y-2">
                  {categories.map(cat => (
                    <div key={cat.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all">
                      <span className="text-2xl">{cat.icon}</span>
                      <div className="flex-1">
                        <p className="font-semibold text-gray-800 text-sm">{cat.name}</p>
                        {cat.name_ar && <p className="text-xs text-gray-500">{cat.name_ar}</p>}
                      </div>
                      <button
                        onClick={() => {
                          setEditingCategory(cat);
                          setNewCategory({
                            name: cat.name,
                            name_ar: cat.name_ar || '',
                            icon: cat.icon,
                            color_from: cat.color_from,
                            color_to: cat.color_to,
                            bg_light: cat.bg_light,
                            border_color: cat.border_color,
                            display_order: cat.display_order,
                          });
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف مجموعة "${cat.name}"؟`)) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add/Edit Category Form */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold mb-4 text-gray-700">
                {editingCategory ? 'تعديل المجموعة' : 'إضافة مجموعة جديدة'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الاسم (English) *</label>
                  <input
                    type="text"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    placeholder="Hot Drinks"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الاسم (العربية)</label>
                  <input
                    type="text"
                    value={newCategory.name_ar}
                    onChange={(e) => setNewCategory({ ...newCategory, name_ar: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    placeholder="مشروبات ساخنة"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الأيقونة (Emoji)</label>
                  <input
                    type="text"
                    value={newCategory.icon}
                    onChange={(e) => setNewCategory({ ...newCategory, icon: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-2xl text-center transition-all"
                    placeholder="☕"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">الترتيب</label>
                  <input
                    type="number"
                    value={newCategory.display_order}
                    onChange={(e) => setNewCategory({ ...newCategory, display_order: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">اللون من (Tailwind)</label>
                  <input
                    type="text"
                    value={newCategory.color_from}
                    onChange={(e) => setNewCategory({ ...newCategory, color_from: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    placeholder="orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">اللون إلى (Tailwind)</label>
                  <input
                    type="text"
                    value={newCategory.color_to}
                    onChange={(e) => setNewCategory({ ...newCategory, color_to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    placeholder="red-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-5">
                {editingCategory && (
                  <button
                    onClick={() => {
                      setEditingCategory(null);
                      setNewCategory({
                        name: '',
                        name_ar: '',
                        icon: '🍽️',
                        color_from: 'blue-400',
                        color_to: 'blue-600',
                        bg_light: 'blue-50',
                        border_color: 'blue-300',
                        display_order: categories.length,
                      });
                    }}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button
                  onClick={() => {
                    if (editingCategory) {
                      updateCategoryMutation.mutate();
                    } else {
                      createCategoryMutation.mutate();
                    }
                  }}
                  disabled={!newCategory.name}
                  className="flex-1 px-5 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
                >
                  {editingCategory ? '✅ حفظ التعديلات' : '✅ إضافة المجموعة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Menu Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">➕ إضافة صنف جديد</h3>
              <button
                onClick={() => setShowAddModal(false)}
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
                    placeholder="مثال: قهوة تركية، عصير برتقال..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المجموعة *</label>
                  <select
                    value={newItem.category_id}
                    onChange={(e) => setNewItem({ ...newItem, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  >
                    <option value="">اختر المجموعة</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name_ar || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">السعر *</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newItem.sale_price}
                      onChange={(e) => setNewItem({ ...newItem, sale_price: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                      min="0"
                      step="0.5"
                      placeholder="0.00"
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">DH</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الصنف</label>
                  <div className="flex items-center gap-4">
                    {newItem.image_url && (
                      <img 
                        src={newItem.image_url.startsWith('http') ? newItem.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${newItem.image_url}`} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], false);
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8 pt-4 border-t border-gray-100">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all"
              >
                إلغاء
              </button>
              <button
                onClick={() => createMenuMutation.mutate()}
                disabled={!newItem.name || newItem.sale_price <= 0}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ إضافة الصنف
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-4xl w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">✏️ تعديل - {selectedMenuItem.name}</h3>
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
                    value={editItem.name}
                    onChange={(e) => setEditItem({ ...editItem, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">المجموعة *</label>
                  <select
                    value={editItem.category_id}
                    onChange={(e) => setEditItem({ ...editItem, category_id: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                  >
                    <option value="">بدون مجموعة</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name_ar || cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">صورة الصنف</label>
                  <div className="flex items-center gap-4">
                    {editItem.image_url && (
                      <img 
                        src={editItem.image_url.startsWith('http') ? editItem.image_url : `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${editItem.image_url}`} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                      />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleFileUpload(e.target.files[0], true);
                        }
                      }}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-full file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-xs text-gray-600 mb-1 font-medium">💡 ملاحظة</p>
                  <p className="text-xs text-gray-700">
                    لتغيير السعر، استخدم زر "السعر" في بطاقة الصنف. هذا يحافظ على تاريخ الأسعار.
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
                onClick={() => updateMenuMutation.mutate()}
                disabled={!editItem.name}
                className="flex-1 px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
              >
                ✅ حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Modal */}
      {showRecipeModal && selectedMenuItem && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">📝 وصفة: {selectedMenuItem.name}</h3>
              <button
                onClick={() => {
                  setShowRecipeModal(false);
                  setRecipeItems([]);
                  setSelectedMenuItem(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-all"
              >
                ×
              </button>
            </div>

            {/* Current Recipe */}
            <div className="mb-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-700">المكونات الحالية</h4>
              {recipes.length > 0 ? (
                <div className="space-y-2">
                  {recipes.map((recipe) => {
                    const stock = stockItems.find(s => s.id === recipe.stock_item_id);
                    const itemCost = stock ? Number(stock.cost_per_unit) * Number(recipe.quantity_used) : 0;
                    
                    return (
                      <div key={recipe.id} className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm">{recipe.stock_item_name}</p>
                          <p className="text-xs text-gray-600">
                            الكمية: {recipe.quantity_used} {recipe.unit_of_measure}
                            {stock && ` • التكلفة: ${itemCost.toFixed(2)} DH`}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            if (confirm('حذف هذا المكون؟')) {
                              deleteRecipeIngredientMutation.mutate(recipe.id);
                            }
                          }}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-8 text-center border border-gray-200">
                  <p className="text-gray-400 text-sm">لا توجد مكونات في الوصفة</p>
                </div>
              )}
            </div>

            {/* Add Ingredients */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-semibold mb-3 text-gray-700">إضافة مكونات جديدة</h4>
              
              {stockItems.length === 0 ? (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                  <p className="text-sm text-yellow-800 font-medium">⚠️ لا توجد عناصر في المخزون</p>
                  <p className="text-xs text-yellow-700 mt-1">قم بإضافة عناصر للمخزون أولاً من صفحة المخزون</p>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => setRecipeItems([...recipeItems, { stock_item_id: '', quantity_used: 0 }])}
                    className="w-full bg-blue-50 hover:bg-blue-100 py-3 rounded-lg text-sm font-medium text-blue-600 transition-all border border-dashed border-blue-300"
                  >
                    + إضافة مكون
                  </button>

                  <div className="space-y-2 mt-3">
                {recipeItems.map((item, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={item.stock_item_id}
                      onChange={(e) => {
                        const updated = [...recipeItems];
                        updated[idx].stock_item_id = e.target.value;
                        setRecipeItems(updated);
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                    >
                      <option value="">اختر المكون</option>
                      {stockItems.map(stock => (
                        <option key={stock.id} value={stock.id}>
                          {stock.name} ({stock.unit_of_measure})
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={item.quantity_used}
                      onChange={(e) => {
                        const updated = [...recipeItems];
                        updated[idx].quantity_used = Number(e.target.value);
                        setRecipeItems(updated);
                      }}
                      className="w-28 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 text-sm transition-all"
                      placeholder="الكمية"
                      min="0"
                      step="0.01"
                    />
                    <button
                      onClick={() => setRecipeItems(recipeItems.filter((_, i) => i !== idx))}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 rounded-lg text-sm font-medium transition-all"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>

              {recipeItems.length > 0 && (
                <button
                  onClick={() => {
                    // Add each ingredient separately
                    recipeItems.forEach(item => {
                      if (item.stock_item_id && item.quantity_used > 0) {
                        addRecipeIngredientMutation.mutate(item);
                      }
                    });
                    setRecipeItems([]);
                  }}
                  disabled={recipeItems.some(i => !i.stock_item_id || i.quantity_used <= 0)}
                  className="w-full mt-3 px-4 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow transition-all"
                >
                  ✅ حفظ المكونات الجديدة
                </button>
              )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
