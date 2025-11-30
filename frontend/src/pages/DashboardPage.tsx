
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../store/authStore';
import { reportsApi } from '../api/client';

export default function DashboardPage() {
  const { selectedCafeId } = useAuthStore();
  const today = new Date().toISOString().split('T')[0];

  const { data: dailyReport, isLoading, error } = useQuery({
    queryKey: ['dailyReport', selectedCafeId, today],
    queryFn: () => reportsApi.getDailyReport(selectedCafeId!, today),
    enabled: !!selectedCafeId,
  });

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
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h1>
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="text-sm font-medium text-red-600 mb-1">حدث خطأ في تحميل البيانات</p>
          <p className="text-xs text-gray-500">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  if (!dailyReport) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h1>
        <div className="bg-white border border-gray-100 rounded-lg p-8 text-center shadow-sm">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-sm text-gray-500">لا توجد بيانات لهذا اليوم</p>
        </div>
      </div>
    );
  }

  const revenue = Number(dailyReport.total_revenue) || 0;
  const grossProfit = Number(dailyReport.gross_profit) || 0;
  const netProfit = Number(dailyReport.net_profit) || 0;
  const totalCosts = Number(dailyReport.costs.total_costs) || 0;
  const profitMargin = revenue > 0 ? ((netProfit / revenue) * 100) : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        <p className="text-xs text-gray-500 mt-1">نظرة عامة على أداء اليوم - {new Date().toLocaleDateString('ar-SA')}</p>
      </div>

      {/* Main Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-white border border-gray-100 rounded-lg p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-[10px] md:text-xs text-gray-500">الإيرادات</span>
            <span className="text-sm md:text-lg">💰</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-gray-900">{revenue.toFixed(2)} <span className="text-xs">DH</span></div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-[10px] md:text-xs text-gray-500">الربح الإجمالي</span>
            <span className="text-sm md:text-lg">📈</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-green-600">{grossProfit.toFixed(2)} <span className="text-xs">DH</span></div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-[10px] md:text-xs text-gray-500">التكاليف</span>
            <span className="text-sm md:text-lg">💸</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-red-600">{totalCosts.toFixed(2)} <span className="text-xs">DH</span></div>
        </div>

        <div className="bg-white border border-gray-100 rounded-lg p-3 md:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1 md:mb-2">
            <span className="text-[10px] md:text-xs text-gray-500">صافي الربح</span>
            <span className="text-sm md:text-lg">{netProfit >= 0 ? '✅' : '⚠️'}</span>
          </div>
          <div className={`text-lg md:text-2xl font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {netProfit.toFixed(2)} <span className="text-xs">DH</span>
          </div>
        </div>
      </div>

      {/* Profit Margin */}
      <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-900">هامش الربح</span>
          <span className="text-sm font-bold text-gray-900">{profitMargin.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2">
          <div
            className="bg-green-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${Math.min(profitMargin, 100)}%` }}
          />
        </div>
      </div>

      {/* Cost Breakdown */}
      <div className="bg-white border border-gray-100 rounded-lg p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">تفاصيل التكاليف</h2>
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
            <span className="text-sm font-bold text-red-600">{totalCosts.toFixed(2)} DH</span>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-100 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg">📊</span>
          <span className="text-sm font-semibold text-gray-900">ملخص الأداء</span>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed">
          {netProfit >= 0 
            ? `أداء جيد! صافي الربح اليوم ${netProfit.toFixed(2)} DH بهامش ربح ${profitMargin.toFixed(1)}%`
            : `تحتاج إلى تحسين! خسارة اليوم ${Math.abs(netProfit).toFixed(2)} DH. راجع التكاليف والمصروفات.`
          }
        </p>
      </div>
    </div>
  );
}
