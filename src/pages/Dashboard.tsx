import { Package, AlertTriangle, Grid3x3, DollarSign, TrendingUp, Database, BarChart } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency } from "@/lib/formatters";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";

const Dashboard = () => {
  // Fetch statistics from API
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const response = await api.get("/statistics");
      return response.data.data;
    },
  });

  // Fetch recent data from data_stok
  const { data: recentData, isLoading: recentLoading } = useQuery({
    queryKey: ["dashboard-recent"],
    queryFn: async () => {
      const response = await api.get("/data-stok?limit=5");
      return response.data.data || [];
    },
  });

  // Calculate stats from API data
  const totalItems = statsData?.total_records || 0;
  const trainingItems = statsData?.training_records || 0;
  const testingItems = statsData?.testing_records || 0;
  const unsplitItems = statsData?.unsplit_records || 0;
  const modelRuns = statsData?.model_runs || 0;

  // Mock low stock calculation (we'll need to add this to API later)
  const lowStockCount = 2; // This should come from API

  // Mock categories count (we'll need to add this to API later)
  const categoriesCount = 8; // This should come from API

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
    kode: item.kode_barang || item.id,
    nama: item.nama_barang || item.jenis_barang,
    kategori: item.kategori,
    stok: item.stok_sekarang || item.stok,
    status: item.status_barang || item.status_stok || "Cukup",
  })) || [];

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Memuat dashboard...</p>
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
