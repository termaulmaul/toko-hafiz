import { Package, AlertTriangle, Grid3x3, DollarSign, TrendingUp, Database, BarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const Dashboard = () => {
  // Fetch statistics from API
  const { data: statsData, isLoading: statsLoading, error: statsError } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/dashboard/stats");
      return response.data.data;
    },
  });

  // Fetch recent products from data-stok API
  const { data: recentData, isLoading: recentLoading, error: recentError } = useQuery({
    queryKey: ["dashboard-products"],
    queryFn: async () => {
      const response = await api.get("/data-stok?limit=5");
      return response.data.data || [];
    },
  });

  // Calculate stats from API data
  const totalItems = statsData?.total_data || 0;
  const trainingItems = statsData?.training_data || 0;
  const testingItems = statsData?.testing_data || 0;
  const unsplitItems = statsData?.unsplit_data || 0;
  const modelRuns = statsData?.model_runs || 0;
  const lowStockCount = statsData?.low_stock || 0;
  const categoriesCount = statsData?.categories || 0;

  // Mock total value (we'll need to add this to API later)
  const totalValue = 5390000;
  const previousMonthValue = 4990000;
  const percentageChange = ((totalValue - previousMonthValue) / previousMonthValue) * 100;

  const stats = [
    {
      title: "Total Data",
      value: totalItems.toString(),
      icon: Package,
      color: "blue" as const,
      change: `${trainingItems} latih, ${testingItems} uji`,
    },
    {
      title: "Stok Rendah",
      value: lowStockCount.toString(),
      icon: AlertTriangle,
      color: "danger" as const,
      change: "Perlu perhatian",
    },
    {
      title: "Kategori",
      value: categoriesCount.toString(),
      icon: Grid3x3,
      color: "warning" as const,
      change: "Aktif",
    },
    {
      title: "Model Runs",
      value: modelRuns.toString(),
      icon: BarChart,
      color: "success" as const,
      change: "C4.5 Algorithm",
    },
  ];



  // Format recent data for display
  const formattedRecentData = recentData?.slice(0, 5).map((item: any) => ({
    kode: item.id.toString(),
    nama: item.nama_barang,
    kategori: item.kategori,
    stok: item.stok_sekarang,
    status: item.stok_sekarang < item.stok_minimum ? "Rendah" :
            item.stok_sekarang > item.stok_maksimum ? "Berlebih" : "Cukup",
  })) || [];

  if (statsLoading || recentLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat dashboard...</p>
        </div>
      </div>
    );
  }

  if (statsError || recentError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <AlertTriangle size={48} className="mx-auto mb-2" />
            <p className="text-lg font-semibold">Gagal memuat data</p>
            <p className="text-sm text-muted-foreground">
              {statsError?.message || recentError?.message || "Terjadi kesalahan saat mengambil data"}
            </p>
          </div>
          <Button onClick={() => window.location.reload()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <p className="page-subtitle">Selamat datang di dashboard sistem prediksi stok barang</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <StatsCard
            key={index}
            label={stat.title}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            description={stat.change}
          />
        ))}
      </div>



      {/* Recent Data */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database size={24} className="text-primary" />
          Data Stok Terbaru
        </h2>
        {recentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kode</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Nama Barang</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Kategori</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Stok</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="table-hover">
                {formattedRecentData.length > 0 ? (
                  formattedRecentData.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border last:border-0">
                      <td className="py-3 px-4 font-mono text-sm">{item.kode}</td>
                      <td className="py-3 px-4 font-medium">{item.nama}</td>
                      <td className="py-3 px-4 text-sm text-muted-foreground">{item.kategori}</td>
                      <td className="py-3 px-4 font-semibold">{item.stok}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                            item.status === "Rendah"
                              ? "bg-danger/10 text-danger"
                              : item.status === "Berlebih"
                              ? "bg-success/10 text-success"
                              : "bg-warning/10 text-warning"
                          }`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      Belum ada data stok tersedia
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Dashboard;
