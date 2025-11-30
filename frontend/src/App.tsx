import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { Toaster as HotToaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import StockPage from './pages/StockPage';
import MenuPage from './pages/MenuPage';
import StaffPage from './pages/StaffPage';
import POSPage from './pages/POSPage';
import OrderHistoryPage from './pages/OrderHistoryPage';
import ExpensesPage from './pages/ExpensesPage';
import ReportsPage from './pages/ReportsPage';
import WastePage from './pages/WastePage';
import Layout from './components/Layout';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuthStore();
  return token ? <>{children}</> : <Navigate to="/login" />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Toaster position="top-center" richColors closeButton />
      <HotToaster position="top-center" />
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="stock" element={<StockPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="staff" element={<StaffPage />} />
            <Route path="pos" element={<POSPage />} />
            <Route path="order-history" element={<OrderHistoryPage />} />
            <Route path="expenses" element={<ExpensesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="waste" element={<WastePage />} />
          </Route>
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
