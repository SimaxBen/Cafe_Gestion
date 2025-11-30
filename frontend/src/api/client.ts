import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Upload API
export const uploadApi = {
  uploadFile: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
  deleteFile: async (filename: string) => {
    const response = await api.delete('/upload/', { data: { filename } });
    return response.data;
  },
};

// Auth API
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (email: string, password: string, full_name?: string) => {
    const response = await api.post('/auth/register', { email, password, full_name });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Cafe API
export const cafeApi = {
  getCafes: async () => {
    const response = await api.get('/cafes');
    return response.data;
  },
  createCafe: async (data: { name: string; address?: string; currency_symbol?: string }) => {
    const response = await api.post('/cafes', data);
    return response.data;
  },
};

// Stock API
export const stockApi = {
  getStock: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/stock`);
    return response.data;
  },
  createStockItem: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/stock`, data);
    return response.data;
  },
  updateStockItem: async (cafeId: string, itemId: string, data: any) => {
    const response = await api.put(`/cafes/${cafeId}/stock/${itemId}`, data);
    return response.data;
  },
  updateCost: async (cafeId: string, itemId: string, cost: number) => {
    const response = await api.put(`/cafes/${cafeId}/stock/${itemId}/cost`, { cost_per_unit: cost });
    return response.data;
  },
  restock: async (cafeId: string, itemId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/stock/${itemId}/restock`, data);
    return response.data;
  },
  recordWaste: async (cafeId: string, itemId: string, data: { quantity: number; reason: string }) => {
    const response = await api.post(`/cafes/${cafeId}/stock/${itemId}/waste`, data);
    return response.data;
  },
  getStockHistory: async (cafeId: string, itemId: string) => {
    const response = await api.get(`/cafes/${cafeId}/stock/${itemId}/history`);
    return response.data;
  },
  getAllStockHistory: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/stock/history`);
    return response.data;
  },
  deleteItem: async (cafeId: string, itemId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/stock/${itemId}`);
    return response.data;
  },
};

// Menu API
export const menuApi = {
  getMenuItems: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/menu`);
    return response.data;
  },
  getMenu: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/menu`);
    return response.data;
  },
  createMenuItem: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/menu`, data);
    return response.data;
  },
  updateMenuItem: async (cafeId: string, itemId: string, data: any) => {
    const response = await api.put(`/cafes/${cafeId}/menu/${itemId}`, data);
    return response.data;
  },
  updatePrice: async (cafeId: string, itemId: string, price: number) => {
    const response = await api.put(`/cafes/${cafeId}/menu/${itemId}/price`, { sale_price: price });
    return response.data;
  },
  getRecipe: async (cafeId: string, itemId: string) => {
    const response = await api.get(`/cafes/${cafeId}/menu/${itemId}/recipe`);
    return response.data;
  },
  updateRecipe: async (cafeId: string, itemId: string, ingredients: any[]) => {
    const response = await api.put(`/cafes/${cafeId}/menu/${itemId}/recipe`, { ingredients });
    return response.data;
  },
  addRecipeIngredient: async (cafeId: string, itemId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/menu/${itemId}/recipe`, data);
    return response.data;
  },
  deleteRecipeIngredient: async (cafeId: string, itemId: string, recipeId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/menu/${itemId}/recipe/${recipeId}`);
    return response.data;
  },
  deleteItem: async (cafeId: string, itemId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/menu/${itemId}`);
    return response.data;
  },
  deleteMenuItem: async (cafeId: string, itemId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/menu/${itemId}`);
    return response.data;
  },
};

// Categories API
export const categoriesApi = {
  getCategories: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/categories`);
    return response.data;
  },
  createCategory: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/categories`, data);
    return response.data;
  },
  updateCategory: async (cafeId: string, categoryId: string, data: any) => {
    const response = await api.put(`/cafes/${cafeId}/categories/${categoryId}`, data);
    return response.data;
  },
  deleteCategory: async (cafeId: string, categoryId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/categories/${categoryId}`);
    return response.data;
  },
};

// Orders API
export const ordersApi = {
  getOrders: async (cafeId: string, date?: string) => {
    const response = await api.get(`/cafes/${cafeId}/orders`, { params: { date } });
    return response.data;
  },
  createOrder: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/orders`, data);
    return response.data;
  },
  deleteOrder: async (cafeId: string, orderId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/orders/${orderId}`);
    return response.data;
  },
};

// Staff API
export const staffApi = {
  getStaff: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/staff`);
    return response.data;
  },
  createStaff: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/staff`, data);
    return response.data;
  },
  updateSalary: async (cafeId: string, staffId: string, salary: number) => {
    const response = await api.put(`/cafes/${cafeId}/staff/${staffId}/salary`, { daily_salary: salary });
    return response.data;
  },
  getSalaryHistory: async (cafeId: string, staffId: string) => {
    const response = await api.get(`/cafes/${cafeId}/staff/${staffId}/salary-history`);
    return response.data;
  },
  deleteStaff: async (cafeId: string, staffId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/staff/${staffId}`);
    return response.data;
  },
};

// Expenses API
export const expensesApi = {
  getMonthlyExpenses: async (cafeId: string, month?: string) => {
    const response = await api.get(`/cafes/${cafeId}/expenses/monthly`, { params: { month } });
    return response.data;
  },
  createMonthlyExpense: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/expenses/monthly`, data);
    return response.data;
  },
  updateMonthlyExpense: async (cafeId: string, expenseId: string, data: any) => {
    const response = await api.put(`/cafes/${cafeId}/expenses/monthly/${expenseId}`, data);
    return response.data;
  },
  deleteMonthlyExpense: async (cafeId: string, expenseId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/expenses/monthly/${expenseId}`);
    return response.data;
  },
  getDailyExpenses: async (cafeId: string, date?: string) => {
    const response = await api.get(`/cafes/${cafeId}/expenses/daily`, { params: { date } });
    return response.data;
  },
  createDailyExpense: async (cafeId: string, data: any) => {
    const response = await api.post(`/cafes/${cafeId}/expenses/daily`, data);
    return response.data;
  },
  updateDailyExpense: async (cafeId: string, expenseId: string, data: any) => {
    const response = await api.put(`/cafes/${cafeId}/expenses/daily/${expenseId}`, data);
    return response.data;
  },
  deleteDailyExpense: async (cafeId: string, expenseId: string) => {
    const response = await api.delete(`/cafes/${cafeId}/expenses/daily/${expenseId}`);
    return response.data;
  },
};

// Reports API
export const reportsApi = {
  getDailyReport: async (cafeId: string, date: string) => {
    const response = await api.get(`/cafes/${cafeId}/reports/daily`, { params: { date } });
    return response.data;
  },
  getMonthlyReport: async (cafeId: string, month: number, year: number) => {
    // Backend expects date as first day of month in YYYY-MM-DD format
    const monthStr = month.toString().padStart(2, '0');
    const dateStr = `${year}-${monthStr}-01`;
    const response = await api.get(`/cafes/${cafeId}/reports/monthly`, { params: { month: dateStr } });
    return response.data;
  },
};

// Waste API
export const wasteApi = {
  recordMenuWaste: async (cafeId: string, data: { menu_item_id: string; quantity: number; reason?: string }) => {
    const response = await api.post(`/cafes/${cafeId}/waste/menu`, data);
    return response.data;
  },
  getMenuWasteHistory: async (cafeId: string) => {
    const response = await api.get(`/cafes/${cafeId}/waste/menu`);
    return response.data;
  },
};
