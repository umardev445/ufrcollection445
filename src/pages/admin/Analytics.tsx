import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { db } from '../../services/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { formatPrice } from '../../utils/cn';
import { TrendingUp, DollarSign, UserCheck, Percent } from 'lucide-react';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [stats, setStats] = useState({
    growth: '+12%',
    conversion: '2.4%',
    avgSale: 0,
    retention: '15%'
  });

  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => doc.data());

      // Performance Chart (Last 6 Months)
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return {
          name: months[d.getMonth()],
          revenue: 0,
          orders: 0,
          monthIndex: d.getMonth(),
          year: d.getFullYear()
        };
      }).reverse();

      orders.forEach(order => {
        const date = order.createdAt?.toDate();
        if (date) {
          const m = date.getMonth();
          const y = date.getFullYear();
          const match = monthlyData.find(d => d.monthIndex === m && d.year === y);
          if (match) {
            match.revenue += order.total || 0;
            match.orders += 1;
          }
        }
      });
      setPerformanceData(monthlyData);

      // Category Pie Chart
      const categories: Record<string, number> = {};
      orders.forEach(order => {
        order.items?.forEach((item: any) => {
          if (item.category) {
            categories[item.category] = (categories[item.category] || 0) + 1;
          }
        });
      });

      const totalItems = Object.values(categories).reduce((a, b) => a + b, 0);
      const pieData = Object.entries(categories).map(([name, value]) => ({
        name,
        value: totalItems > 0 ? Math.round((value / totalItems) * 100) : 0
      }));
      setCategoryData(pieData.length > 0 ? pieData : [{ name: 'No Data', value: 100 }]);

      // Stats
      const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      const avgSale = orders.length > 0 ? totalRevenue / orders.length : 0;
      
      setStats(prev => ({
        ...prev,
        avgSale
      }));
      
      setLoading(false);
    }, (err) => {
      console.error("Error fetching analytics:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const COLORS = ['#D4AF37', '#1A1A1A', '#525252', '#A3A3A3', '#E5E7EB'];

  if (loading) return <div className="h-full flex items-center justify-center font-serif uppercase tracking-widest text-brand-grey animate-pulse">Analyzing Maison Performance...</div>;

  return (
    <AdminLayout title="Performance Diagnostics">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Growth Rate', value: stats.growth, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Conversion', value: stats.conversion, icon: Percent, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Avg Sale', value: formatPrice(stats.avgSale), icon: DollarSign, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
            { label: 'Retention', value: stats.retention, icon: UserCheck, color: 'text-purple-600', bg: 'bg-purple-50' }
          ].map((stat) => (
            <div key={stat.label} className="bg-white p-6 rounded-xl border border-brand-beige luxury-shadow flex items-center gap-6">
               <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon size={24} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">{stat.label}</p>
                  <p className="text-2xl font-serif font-bold">{stat.value}</p>
               </div>
            </div>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="lg:col-span-2 bg-white rounded-xl border border-brand-beige luxury-shadow p-8">
             <h3 className="font-serif text-xl mb-8">Revenue Expansion Forecast</h3>
             <div className="h-96 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={performanceData}>
                      <defs>
                         <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                         </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9CA3AF'}} tickFormatter={(v) => `Rs ${v/1000}k`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#D4AF37" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                   </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="bg-white rounded-xl border border-brand-beige luxury-shadow p-8">
             <h3 className="font-serif text-xl mb-8">Maison Composition</h3>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                         {categoryData.map((entry, index) => (
                           <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                         ))}
                      </Pie>
                      <Tooltip />
                   </PieChart>
                </ResponsiveContainer>
             </div>
             <div className="space-y-3 mt-6">
                {categoryData.map((entry, index) => (
                  <div key={entry.name} className="flex justify-between items-center text-xs">
                     <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index] }}></div>
                        <span className="text-brand-grey font-bold uppercase tracking-widest">{entry.name}</span>
                     </div>
                     <span className="font-serif font-bold text-sm">{entry.value}%</span>
                  </div>
                ))}
             </div>
          </div>
       </div>
    </AdminLayout>
  );
};

export default Analytics;
