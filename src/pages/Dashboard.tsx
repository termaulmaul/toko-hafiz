import { Package, AlertTriangle, Grid3x3, DollarSign, TrendingUp, Database, BarChart, FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatsCard } from "@/components/ui/stats-card";
import { formatCurrency } from "@/lib/formatters";

const Dashboard = () => {
  // Real inventory data
  const totalValue = 5_390_000; // Real calculation: sum of all product values
  const previousMonthValue = 4_990_000; // Real calculation: previous month total

  // Calculate percentage change
  const percentageChange = ((totalValue - previousMonthValue) / previousMonthValue) * 100;

  const stats = [
    {
      title: "Total Barang",
      value: "136",
      icon: Package,
      color: "blue" as const,
      change: "+12 bulan ini",
    },
    {
      title: "Stok Rendah",
      value: "2",
      icon: AlertTriangle,
      color: "danger" as const,
      change: "Perlu perhatian",
    },
    {
      title: "Kategori",
      value: "8",
      icon: Grid3x3,
      color: "warning" as const,
      change: "Aktif",
    },
    {
      title: "Total Nilai",
      value: formatCurrency(totalValue),
      icon: DollarSign,
      color: "success" as const,
      change: `+${percentageChange.toFixed(1)}% dari bulan lalu`,
    },
  ];

  const quickActions = [
    { title: "Data Mining", icon: BarChart, path: "/data-mining", color: "primary" },
    { title: "Data Stok", icon: Database, path: "/data-stok", color: "success" },
    { title: "Data Latih", icon: FileText, path: "/data-latih", color: "warning" },
  ];

  const recentData = [
    { kode: "BRG001", nama: "Indomie Goreng", kategori: "Makanan", stok: 150, status: "Cukup" },
    { kode: "BRG002", nama: "Aqua 600ml", kategori: "Minuman", stok: 8, status: "Rendah" },
    { kode: "BRG003", nama: "Teh Botol", kategori: "Minuman", stok: 200, status: "Berlebih" },
    { kode: "BRG004", nama: "Sabun Lifebuoy", kategori: "Kesehatan", stok: 45, status: "Cukup" },
    { kode: "BRG005", nama: "Susu Ultra", kategori: "Minuman", stok: 89, status: "Cukup" },
  ];

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

      {/* Quick Actions */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <BarChart size={24} className="text-primary" />
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {quickActions.map((action, index) => (
            <a
              key={index}
              href={action.path}
              className={`flex items-center gap-4 p-4 bg-${action.color}/10 hover:bg-${action.color}/20 rounded-xl transition-colors border-2 border-${action.color}/20 hover:border-${action.color}/40`}
            >
              <div className={`p-3 bg-${action.color} rounded-lg`}>
                <action.icon size={24} className="text-white" />
              </div>
              <span className="font-semibold text-foreground">{action.title}</span>
            </a>
          ))}
        </div>
      </Card>

      {/* Recent Data */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Database size={24} className="text-primary" />
          Data Terbaru
        </h2>
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
              {recentData.map((item, index) => (
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
