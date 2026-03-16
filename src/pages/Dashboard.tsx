import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Package, ShoppingCart, Truck, AlertTriangle, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardApi } from "@/lib/api";
import { type OrderStatus } from "@/data/dummy-data";

const formatMMK = (amount: number): string => `${amount.toLocaleString()} ကျပ်`;

const statusColors: Record<OrderStatus, string> = {
  pending: "status-badge-pending",
  confirmed: "status-badge-confirmed",
  delivered: "status-badge-delivered",
  cancelled: "status-badge-cancelled",
  approved: "status-badge-confirmed",
  received: "status-badge-delivered",
};

const cardVariant = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.get()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return null;

  const kpis = [
    { labelEn: "Total Inventory Value", labelMm: "စုစုပေါင်းတန်ဖိုး", value: formatMMK(data.kpis.totalInventoryValue), icon: Package, change: "+12%", up: true, color: "text-primary" },
    { labelEn: "Pending Orders", labelMm: "ဆိုင်းငံ့မှာယူမှု", value: String(data.kpis.pendingOrders), icon: ShoppingCart, change: "+5", up: true, color: "text-info" },
    { labelEn: "Shipments In Transit", labelMm: "ပို့ဆောင်ဆဲ", value: String(data.kpis.shipmentsInTransit), icon: Truck, change: "-2", up: false, color: "text-accent" },
    { labelEn: "Low Stock Alerts", labelMm: "စတော့နည်းနေသည်", value: String(data.kpis.lowStockAlerts), icon: AlertTriangle, change: `${data.kpis.lowStockAlerts}`, up: true, color: "text-destructive", badge: true },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-xs sm:text-sm text-muted-foreground font-myanmar">ဒက်ရှ်ဘုတ် - လုပ်ငန်းခြုံငုံသုံးသပ်ချက်</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.labelEn} custom={i} initial="hidden" animate="visible" variants={cardVariant} className="card-elevated p-3 sm:p-5 relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div className="space-y-0.5 sm:space-y-1 min-w-0 flex-1">
                <p className="text-xs sm:text-sm text-muted-foreground truncate">{kpi.labelEn}</p>
                <p className="text-[10px] sm:text-xs font-myanmar text-muted-foreground truncate">{kpi.labelMm}</p>
              </div>
              <div className={`p-1.5 sm:p-2 rounded-md bg-muted ${kpi.color} relative flex-shrink-0 ml-1`}>
                <kpi.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {kpi.badge && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                    {kpi.value}
                  </span>
                )}
              </div>
            </div>
            <div className="mt-2 sm:mt-3">
              <p className="text-lg sm:text-2xl font-bold font-mono-data">{kpi.value}</p>
              <div className="flex items-center gap-1 mt-1">
                {kpi.up ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-destructive" />}
                <span className={`text-[10px] sm:text-xs font-medium ${kpi.up ? "text-success" : "text-destructive"}`}>{kpi.change}</span>
                <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">vs last month</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="card-elevated p-3 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base mb-1">Monthly Sales Trend</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">လစဉ်ရောင်းချမှုလမ်းကြောင်း</p>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={data.monthlySalesData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} width={40} />
              <Tooltip formatter={(value: number) => [formatMMK(value), "Sales"]} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ fill: "hsl(var(--accent))", r: 3, strokeWidth: 2, stroke: "hsl(var(--primary))" }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-elevated p-3 sm:p-5">
          <h3 className="font-semibold text-sm sm:text-base mb-1">Top 5 Products by Quantity</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">ထိပ်တန်းထုတ်ကုန် ၅ ခု</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis dataKey="name" type="category" width={70} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="quantity" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="card-elevated p-3 sm:p-5 lg:col-span-2">
          <h3 className="font-semibold text-sm sm:text-base mb-1">Recent Orders</h3>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">မကြာသေးမီ မှာယူမှုများ</p>
          <div className="overflow-x-auto -mx-3 sm:-mx-5 px-3 sm:px-5">
            <table className="w-full text-xs sm:text-sm min-w-[500px]">
              <thead>
                <tr className="border-b text-left">
                  <th className="pb-2 sm:pb-3 font-medium text-muted-foreground">Order ID</th>
                  <th className="pb-2 sm:pb-3 font-medium text-muted-foreground">Supplier</th>
                  <th className="pb-2 sm:pb-3 font-medium text-muted-foreground hidden sm:table-cell">Date</th>
                  <th className="pb-2 sm:pb-3 font-medium text-muted-foreground text-right">Amount</th>
                  <th className="pb-2 sm:pb-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {data.recentOrders.map((order: any) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="py-2 sm:py-3 font-mono-data text-[10px] sm:text-xs">{order.poNumber}</td>
                    <td className="py-2 sm:py-3 truncate max-w-[100px] sm:max-w-none">{order.supplier}</td>
                    <td className="py-2 sm:py-3 text-muted-foreground hidden sm:table-cell">{order.orderDate}</td>
                    <td className="py-2 sm:py-3 text-right font-mono-data">{formatMMK(order.totalAmount)}</td>
                    <td className="py-2 sm:py-3">
                      <span className={`inline-flex items-center px-1.5 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-medium ${statusColors[order.status as OrderStatus] || ''}`}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="card-elevated p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-destructive" />
            <h3 className="font-semibold text-sm sm:text-base">Low Stock Alerts</h3>
          </div>
          <p className="text-[10px] sm:text-xs text-muted-foreground font-myanmar mb-3 sm:mb-4">စတော့နည်းနေသောပစ္စည်းများ</p>
          <div className="space-y-2 sm:space-y-3">
            {data.lowStockItems.map((item: any) => (
              <div key={item.id} className="flex items-center justify-between p-2 sm:p-3 rounded-md bg-muted/50 border">
                <div className="min-w-0 flex-1 mr-2">
                  <p className="text-xs sm:text-sm font-medium truncate">{item.nameEn}</p>
                  <p className="text-[10px] sm:text-xs font-myanmar text-muted-foreground truncate">{item.nameMm}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`text-xs sm:text-sm font-mono-data font-bold ${item.stockStatus === 'critical' ? 'stock-critical' : 'stock-low'}`}>
                    {item.quantity} {item.unit}
                  </p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Min: {item.minStock}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
