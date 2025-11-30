import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useQuery } from '@tanstack/react-query';
import { cafeApi } from '../api/client';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user, selectedCafeId, setSelectedCafe, logout } = useAuthStore();
  const navigate = useNavigate();

  const { data: cafes } = useQuery({
    queryKey: ['cafes'],
    queryFn: cafeApi.getCafes,
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 bg-white shadow-sm border-b border-gray-100 z-50">
        <div className="px-6 py-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
              >
                <span className="text-xl">☰</span>
              </button>
              <h1 className="text-2xl font-bold text-gray-800">☕ مدير المقهى</h1>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Cafe Selector - Only for non-admin users - Desktop Only */}
              <div className="hidden lg:block">
                {!user?.is_admin && cafes && cafes.length > 0 && (
                  <select
                    value={selectedCafeId || ''}
                    onChange={(e) => setSelectedCafe(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
                  >
                    <option value="">اختر المقهى</option>
                    {cafes.map((cafe: any) => (
                      <option key={cafe.id} value={cafe.id}>
                        {cafe.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* User Info & Logout - Desktop Only */}
              <div className="hidden lg:flex items-center gap-3">
                <span className="text-gray-600 text-sm font-medium">{user?.email}</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600 shadow-sm hover:shadow transition-all"
                >
                  تسجيل الخروج
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex pt-[57px]">
        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}

        {/* Fixed Sidebar */}
        <nav className={`fixed top-[57px] right-0 w-64 bg-white shadow-sm border-l border-gray-100 h-[calc(100vh-57px)] overflow-y-auto z-40 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } lg:translate-x-0`}>
          {/* Mobile User Info & Cafe Selector */}
          <div className="p-4 border-b border-gray-100 lg:hidden bg-gray-50">
            <div className="mb-4">
              <p className="text-sm font-bold text-gray-800 truncate">{user?.email}</p>
              <p className="text-xs text-gray-500">المستخدم الحالي</p>
            </div>
            
            {!user?.is_admin && cafes && cafes.length > 0 && (
              <div className="mb-2">
                <label className="block text-xs text-gray-500 mb-1">المقهى</label>
                <select
                  value={selectedCafeId || ''}
                  onChange={(e) => setSelectedCafe(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                >
                  <option value="">اختر المقهى</option>
                  {cafes.map((cafe: any) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <ul className="p-4 space-y-1">
            <NavLink to="/" onClick={() => setIsSidebarOpen(false)}>📊 لوحة التحكم</NavLink>
            {user?.is_admin && (
              <NavLink to="/admin" onClick={() => setIsSidebarOpen(false)}>🛡️ الإدارة</NavLink>
            )}
            <NavLink to="/stock" onClick={() => setIsSidebarOpen(false)}>📦 المخزون</NavLink>
            <NavLink to="/menu" onClick={() => setIsSidebarOpen(false)}>🍽️ القائمة</NavLink>
            <NavLink to="/staff" onClick={() => setIsSidebarOpen(false)}>👥 الموظفون</NavLink>
            <NavLink to="/pos" onClick={() => setIsSidebarOpen(false)}>🛒 نقطة البيع</NavLink>
            <NavLink to="/order-history" onClick={() => setIsSidebarOpen(false)}>📊 تاريخ الطلبات</NavLink>
            <NavLink to="/expenses" onClick={() => setIsSidebarOpen(false)}>💸 المصروفات</NavLink>
            <NavLink to="/waste" onClick={() => setIsSidebarOpen(false)}>🗑️ الهدر</NavLink>
            <NavLink to="/reports" onClick={() => setIsSidebarOpen(false)}>📈 التقارير</NavLink>

            {/* Mobile Logout */}
            <li className="lg:hidden mt-4 pt-4 border-t border-gray-100">
              <button
                onClick={() => {
                  handleLogout();
                  setIsSidebarOpen(false);
                }}
                className="w-full text-right px-4 py-2.5 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm transition-all flex items-center gap-2"
              >
                <span>🚪</span>
                <span>تسجيل الخروج</span>
              </button>
            </li>
          </ul>
        </nav>

        {/* Main Content */}
        <main className="mr-0 lg:mr-64 flex-1 p-4 md:p-6 w-full transition-all duration-300">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function NavLink({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <li>
      <Link
        to={to}
        onClick={onClick}
        className="block px-4 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 font-medium text-sm transition-all"
      >
        {children}
      </Link>
    </li>
  );
}
