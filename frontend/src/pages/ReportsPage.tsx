import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuthStore } from '../store/authStore';
import { reportsApi } from '../api/client';

interface DailyReport {
  date: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  net_profit: number;
  cost_breakdown: CostItem[];
  costs: {
    salaries: number;
    daily_expenses: number;
    pro_rated_monthly_expenses: number;
    total_costs: number;
  };
}

interface MonthlyReport {
  month: string;
  total_revenue: number;
  total_cogs: number;
  gross_profit: number;
  net_profit: number;
  costs: {
    salaries: number;
    monthly_expenses: number;
    total_costs: number;
  };
  daily_reports: { date: string; revenue: number; profit: number }[];
}

interface CostItem {
  category: string;
  amount: number;
}

export default function ReportsPage() {
  const { selectedCafeId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly'>('daily');
  
  // For daily report - use date picker
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // For monthly report - use month picker (YYYY-MM format)
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`
  );

  // Parse month for API
  const [year, month] = selectedMonth.split('-').map(Number);

  const { data: dailyReport, isLoading: dailyLoading, error: dailyError } = useQuery<DailyReport>({
    queryKey: ['report', 'daily', selectedCafeId, selectedDate],
    queryFn: () => reportsApi.getDailyReport(selectedCafeId!, selectedDate),
    enabled: !!selectedCafeId && activeTab === 'daily',
  });

  const { data: monthlyReport, isLoading: monthlyLoading, error: monthlyError } = useQuery<MonthlyReport>({
    queryKey: ['report', 'monthly', selectedCafeId, month, year],
    queryFn: () => reportsApi.getMonthlyReport(selectedCafeId!, month, year),
    enabled: !!selectedCafeId && activeTab === 'monthly',
  });

  const isLoading = activeTab === 'daily' ? dailyLoading : monthlyLoading;
  const error = activeTab === 'daily' ? dailyError : monthlyError;

  if (!selectedCafeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-6xl mb-4">☕</div>
          <p className="text-sm text-gray-500">يرجى اختيار مقهى للبدء</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-sm text-gray-500">جاري التحميل...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm font-medium text-red-600 mb-1">حدث خطأ في تحميل البيانات</p>
          <p className="text-xs text-gray-500">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">التقارير</h1>
        <p className="text-xs text-gray-500 mt-1">تقارير مفصلة للإيرادات والمصروفات</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border border-gray-100 rounded-lg p-1 shadow-sm">
        <button
          onClick={() => setActiveTab('daily')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'daily'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          تقرير يومي
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'monthly'
              ? 'bg-gray-900 text-white'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          تقرير شهري
        </button>
      </div>

      {/* Daily Report */}
      {activeTab === 'daily' && (
        <div className="space-y-6">
          {/* Date Selector */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-2">اختر التاريخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {!dailyReport ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-sm text-gray-500">لا توجد بيانات لهذا اليوم</p>
            </div>
          ) : (
            <>
              {/* Main Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">الإيرادات</span>
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {Number(dailyReport.total_revenue).toFixed(2)} DH
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">التكاليف</span>
                    <span className="text-lg">💸</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {Number(dailyReport.costs.total_costs).toFixed(2)} DH
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">الربح الصافي</span>
                    <span className="text-lg">📈</span>
                  </div>
                  <div className={`text-2xl font-bold ${Number(dailyReport.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(dailyReport.net_profit).toFixed(2)} DH
                  </div>
                </div>
              </div>

              {/* Profit Margin */}
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900">هامش الربح</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Number(dailyReport.total_revenue) > 0
                      ? `${((Number(dailyReport.net_profit) / Number(dailyReport.total_revenue)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Number(dailyReport.total_revenue) > 0 ? Math.min(Math.max((Number(dailyReport.net_profit) / Number(dailyReport.total_revenue)) * 100, 0), 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">تفاصيل التكاليف</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-600">الرواتب</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(dailyReport.costs.salaries).toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-600">المصروفات اليومية</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(dailyReport.costs.daily_expenses).toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-600">المصروفات الشهرية (مقسمة)</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(dailyReport.costs.pro_rated_monthly_expenses).toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 pt-3">
                    <span className="text-sm font-semibold text-gray-900">إجمالي التكاليف</span>
                    <span className="text-sm font-bold text-red-600">
                      {Number(dailyReport.costs.total_costs).toFixed(2)} DH
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Monthly Report */}
      {activeTab === 'monthly' && (
        <div className="space-y-6">
          {/* Month Selector */}
          <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
            <label className="block text-xs font-medium text-gray-700 mb-2">اختر الشهر</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full md:w-auto px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>

          {!monthlyReport ? (
            <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
              <div className="text-4xl mb-3">📊</div>
              <p className="text-sm text-gray-500">لا توجد بيانات لهذا الشهر</p>
            </div>
          ) : (
            <>
              {/* Main Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">إجمالي الإيرادات</span>
                    <span className="text-lg">💰</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {Number(monthlyReport.total_revenue).toFixed(2)} DH
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">إجمالي المصروفات</span>
                    <span className="text-lg">💸</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {Number(monthlyReport.costs.total_costs).toFixed(2)} DH
                  </div>
                </div>

                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">الربح الصافي</span>
                    <span className="text-lg">📈</span>
                  </div>
                  <div className={`text-2xl font-bold ${Number(monthlyReport.net_profit) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {Number(monthlyReport.net_profit).toFixed(2)} DH
                  </div>
                </div>
              </div>

              {/* Revenue & Profit Chart */}
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm h-80 md:h-96 flex flex-col">
                <h3 className="text-sm font-semibold text-gray-900 mb-4">تحليل الإيرادات والأرباح اليومية</h3>
                <div className="flex-1 min-h-0 w-full overflow-x-auto pb-2">
                  <div className="min-w-[600px] h-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={monthlyReport.daily_reports}
                        margin={{
                          top: 5,
                          right: 10,
                          left: 0,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="date" 
                          tickFormatter={(date) => new Date(date).getDate().toString()}
                          tick={{ fontSize: 12 }}
                          interval={0}
                        />
                        <YAxis tick={{ fontSize: 12 }} width={40} />
                        <Tooltip 
                          formatter={(value: number) => [`${Number(value).toFixed(2)} DH`, '']}
                          labelFormatter={(label) => new Date(label).toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long' })}
                        />
                        <Legend wrapperStyle={{ paddingTop: '10px' }} />
                        <Bar dataKey="revenue" name="الإيرادات" fill="#10B981" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="profit" name="الربح الصافي" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Profit Margin */}
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-900">هامش الربح</span>
                  <span className="text-sm font-bold text-gray-900">
                    {Number(monthlyReport.total_revenue) > 0
                      ? `${((Number(monthlyReport.net_profit) / Number(monthlyReport.total_revenue)) * 100).toFixed(1)}%`
                      : '0%'}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${Number(monthlyReport.total_revenue) > 0 ? Math.min(Math.max((Number(monthlyReport.net_profit) / Number(monthlyReport.total_revenue)) * 100, 0), 100) : 0}%`,
                    }}
                  />
                </div>
              </div>

              {/* Cost Breakdown */}
              <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">تفاصيل التكاليف</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-600">الرواتب</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(monthlyReport.costs.salaries).toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-50">
                    <span className="text-xs text-gray-600">المصروفات الشهرية</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Number(monthlyReport.costs.monthly_expenses).toFixed(2)} DH
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 pt-3">
                    <span className="text-sm font-semibold text-gray-900">إجمالي التكاليف</span>
                    <span className="text-sm font-bold text-red-600">
                      {Number(monthlyReport.costs.total_costs).toFixed(2)} DH
                    </span>
                  </div>
                </div>
              </div>

              {/* Daily Breakdown (optional - show if data exists) */}
              {monthlyReport.daily_reports && monthlyReport.daily_reports.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">الأداء اليومي</h3>
                  <div className="space-y-1 max-h-64 overflow-y-auto">
                    {monthlyReport.daily_reports.map((day) => (
                      <div key={day.date} className="flex items-center justify-between py-2 border-b border-gray-50 text-xs">
                        <span className="text-gray-600">{new Date(day.date).toLocaleDateString('ar-SA')}</span>
                        <div className="flex gap-4">
                          <span className="text-gray-900">{Number(day.revenue).toFixed(2)} DH</span>
                          <span className={Number(day.profit) >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {Number(day.profit).toFixed(2)} DH
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
