import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { db, auth } from '../../services/firebase';
import { collection, getDocs, query, orderBy, limit, where, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestore';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  Plus,
  ArrowUpRight,
  TrendingUp,
  CreditCard,
  LogOut,
  ChevronRight,
  Search,
  Bell,
  User,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Tag,
  Trophy
} from 'lucide-react';
import { formatPrice, cn } from '../../utils/cn';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminLayout: React.FC<{ children: React.ReactNode, title: string }> = ({ children, title }) => {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      navigate('/login');
    }
  }, [user, isAdmin, loading]);

  if (loading || !user || !isAdmin) return <div className="flex h-screen items-center justify-center font-serif text-2xl uppercase tracking-widest animate-pulse">Authenticating Admin...</div>;

  const sidebarLinks = [
    { name: 'Overview', icon: LayoutDashboard, path: '/admin' },
    { name: 'Homepage', icon: Activity, path: '/admin/homepage' },
    { name: 'Offers', icon: Tag, path: '/admin/offers' },
    { name: 'Products', icon: Package, path: '/admin/products' },
    { name: 'Orders', icon: ShoppingCart, path: '/admin/orders' },
    { name: 'Customers', icon: Users, path: '/admin/customers' },
    { name: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { name: 'Lucky Draw', icon: Trophy, path: '/admin/lucky-draw' },
    { name: 'Settings', icon: Settings, path: '/admin/settings' },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // General search logic or redirect to relevant page
      if (searchQuery.startsWith('UFR-')) {
        navigate(`/order-tracking?id=${searchQuery}`);
      } else {
        navigate(`/admin/products?q=${searchQuery}`);
      }
    }
  };

  return (
    <div className="flex h-screen bg-[#F8F9FA]">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-black text-white shrink-0 flex flex-col pt-8">
        <div className="px-8 mb-12">
          <Link to="/" className="text-2xl font-serif font-bold tracking-tighter text-white">
            U<span className="text-brand-gold italic">F</span>R <span className="text-[8px] uppercase tracking-widest block font-light opacity-50 font-sans tracking-[0.2em]">Couture Maison</span>
          </Link>
        </div>

        <nav className="flex-grow px-4 space-y-2">
           {sidebarLinks.map((link) => (
             <NavLink
               key={link.name}
               to={link.path}
               end
               className={({ isActive }) => cn(
                 "flex items-center gap-4 px-4 py-3 rounded-lg text-xs uppercase tracking-widest font-bold transition-all",
                 isActive ? "bg-brand-gold text-brand-black" : "text-white/60 hover:text-white hover:bg-white/5"
               )}
             >
               <link.icon size={18} />
               {link.name}
             </NavLink>
           ))}
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
           <Link to="/profile" className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-all mb-4">
              <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-brand-black">
                 <User size={16} />
              </div>
              <div className="overflow-hidden">
                 <p className="text-[10px] font-bold uppercase tracking-widest truncate">{user.displayName || 'Admin'}</p>
                 <p className="text-[8px] text-white/40 truncate">{user.email}</p>
              </div>
           </Link>
           <button onClick={() => auth.signOut()} className="w-full flex items-center gap-4 px-4 py-3 text-red-400 hover:text-red-300 transition-all text-[10px] uppercase font-bold tracking-widest">
              <LogOut size={16} />
              Sign Out
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <header className="bg-white border-b border-brand-beige px-8 py-6 flex justify-between items-center sticky top-0 z-10">
           <h1 className="text-2xl font-serif">{title}</h1>
           <div className="flex items-center gap-6">
              <form onSubmit={handleSearch} className="relative">
                 <input 
                  className="bg-brand-cream border border-brand-beige rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none w-64 focus:border-brand-gold transition-all" 
                  placeholder="Order ID, Product Name..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                 <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
              </form>
              <button className="relative p-2 text-brand-grey hover:text-brand-gold transition-colors">
                <Bell size={20} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
              </button>
           </div>
        </header>

        <div className="p-8">
           {children}
        </div>
      </main>
    </div>
  );
};

const Dashboard = () => {
  const [stats, setStats] = useState({ orders: 0, products: 0, customers: 0, revenue: 0 });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for orders
    const qOrders = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      
      const totalRevenue = orders.reduce((acc, o) => acc + (o.total || 0), 0);
      
      setStats(prev => ({
        ...prev,
        orders: orders.length,
        revenue: totalRevenue
      }));

      setRecentOrders(orders.slice(0, 5));

      // Real chart data from orders
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return {
          name: days[d.getDay()],
          revenue: 0,
          date: d.toISOString().split('T')[0]
        };
      }).reverse();

      orders.forEach(order => {
        const orderDate = order.createdAt?.toDate()?.toISOString().split('T')[0];
        const dayMatch = last7Days.find(d => d.date === orderDate);
        if (dayMatch) {
          dayMatch.revenue += order.total;
        }
      });
      setSalesData(last7Days);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'orders');
      setLoading(false);
    });

    // Fetch products once (or could be real-time too)
    const fetchProducts = async () => {
      const productsSnap = await getDocs(collection(db, 'products'));
      setStats(prev => ({ ...prev, products: productsSnap.size }));
      const lowStock = productsSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() as any }))
        .filter(p => p.stock < 10)
        .slice(0, 5);
      setLowStockProducts(lowStock);
    };

    // Fetch users once
    const fetchUsers = async () => {
      const usersSnap = await getDocs(collection(db, 'users'));
      setStats(prev => ({ ...prev, customers: usersSnap.size }));
    };

    fetchProducts();
    fetchUsers();

    return () => unsubscribeOrders();
  }, []);

  if (loading) return <div className="h-full flex items-center justify-center font-serif uppercase tracking-widest text-brand-grey animate-pulse">Calculating Maison Stats...</div>;

  return (
    <AdminLayout title="Boutique Intelligence">
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Total Revenue', value: formatPrice(stats.revenue), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Active Orders', value: stats.orders, icon: ShoppingCart, color: 'text-brand-gold', bg: 'bg-brand-gold/10' },
            { label: 'Masterpieces', value: stats.products, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Fashion Clients', value: stats.customers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50' }
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-xl border border-brand-beige luxury-shadow flex items-center gap-6"
            >
               <div className={cn("w-12 h-12 rounded-lg flex items-center justify-center", stat.bg, stat.color)}>
                  <stat.icon size={24} />
               </div>
               <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">{stat.label}</p>
                  <p className="text-2xl font-serif font-bold">{stat.value}</p>
               </div>
            </motion.div>
          ))}
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Sales Analytics Chart */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-brand-beige luxury-shadow p-8">
             <div className="flex justify-between items-center mb-8">
                <h3 className="font-serif text-xl">Revenue Trajectory</h3>
                <div className="flex gap-2">
                   <span className="px-3 py-1 bg-brand-gold/10 text-brand-gold text-[8px] uppercase font-bold rounded-full">Weekly View</span>
                </div>
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <BarChart data={salesData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF', fontWeight: 'bold' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9CA3AF' }} tickFormatter={(val) => `Rs ${val / 1000}k`} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} barSize={40} />
                   </BarChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
             <div className="bg-brand-black text-white p-8 rounded-xl luxury-shadow flex flex-col justify-between h-full relative overflow-hidden">
                <div className="relative z-10">
                   <h3 className="font-serif text-2xl mb-2">Boutique Growth</h3>
                   <p className="text-xs text-white/60 mb-8">Expand your luxury collection today.</p>
                   <Link to="/admin/products" className="inline-flex items-center gap-2 bg-brand-gold text-brand-black px-6 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-transform">
                      <Plus size={16} /> New Artpiece
                   </Link>
                </div>
                <Users className="absolute -bottom-4 -right-4 w-32 h-32 text-white/5" />
             </div>
             
             <div className="bg-white p-8 rounded-xl border border-brand-beige luxury-shadow">
                <h3 className="font-serif text-xl mb-6">Maison Pulse</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Average Order Value', value: formatPrice(stats.revenue / (stats.orders || 1)) },
                    { label: 'Catalog Health', value: 'High' },
                    { label: 'Pending Shipments', value: stats.orders }
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between items-center py-3 border-b border-brand-beige last:border-0 text-left">
                       <span className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">{item.label}</span>
                       <span className="text-xs font-bold">{item.value}</span>
                    </div>
                  ))}
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Orders Table */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-brand-beige luxury-shadow overflow-hidden">
             <div className="p-6 border-b border-brand-beige flex justify-between items-center">
                <h3 className="font-serif text-xl">Recent Couture Orders</h3>
                <Link to="/admin/orders" className="text-[10px] uppercase font-bold tracking-widest text-brand-gold hover:underline">Full Archive</Link>
             </div>
             <div className="overflow-x-auto text-left">
                <table className="w-full">
                   <thead>
                      <tr className="bg-brand-cream border-b border-brand-beige">
                         <th className="px-6 py-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-grey">Reference</th>
                         <th className="px-6 py-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-grey">Customer</th>
                         <th className="px-6 py-4 text-left text-[10px] uppercase font-bold tracking-widest text-brand-grey">Status</th>
                         <th className="px-6 py-4 text-right text-[10px] uppercase font-bold tracking-widest text-brand-grey">Amount</th>
                      </tr>
                   </thead>
                   <tbody>
                      {recentOrders.length > 0 ? recentOrders.map((order) => (
                        <tr key={order.id} className="border-b border-brand-beige hover:bg-brand-cream/30 transition-colors">
                           <td className="px-6 py-4 text-xs font-bold">{order.orderId}</td>
                           <td className="px-6 py-4 text-xs">{order.customer.firstName} {order.customer.lastName}</td>
                           <td className="px-6 py-4">
                              <span className={cn(
                                "text-[8px] uppercase font-bold px-2 py-0.5 rounded-full border",
                                order.status === 'pending' ? "bg-amber-50 text-amber-600 border-amber-200" : 
                                order.status === 'processing' ? "bg-purple-50 text-purple-600 border-purple-200" :
                                "bg-green-50 text-green-600 border-green-200"
                              )}>
                                 {order.status}
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right text-xs font-bold">{formatPrice(order.total)}</td>
                        </tr>
                      )) : (
                        <tr><td colSpan={4} className="px-6 py-12 text-center text-xs text-brand-grey font-light">No maison orders yet</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>

          {/* Real Inventory Alerts */}
          <div className="bg-white rounded-xl border border-brand-beige luxury-shadow p-6 space-y-6">
             <h3 className="font-serif text-xl flex items-center justify-between">
                Inventory Watch
                <AlertTriangle size={18} className="text-red-500" />
             </h3>
             <div className="space-y-4">
                {lowStockProducts.length > 0 ? lowStockProducts.map(p => (
                  <div key={p.id} className="p-4 bg-red-50/50 border border-red-100 rounded-lg flex items-center gap-4">
                     <div className="w-10 h-10 rounded border border-red-200 shrink-0 overflow-hidden">
                        <img src={p.images[0]} className="w-full h-full object-cover" />
                     </div>
                     <div className="flex-grow">
                        <p className="text-xs font-bold">{p.name}</p>
                        <p className={cn(
                          "text-[10px] font-bold uppercase",
                          p.stock === 0 ? "text-red-600" : "text-amber-600"
                        )}>
                          {p.stock === 0 ? 'Out of Stock' : `${p.stock} Articles Remaining`}
                        </p>
                     </div>
                     <Link to="/admin/products" className="p-2 hover:text-brand-gold transition-colors"><ChevronRight size={14} /></Link>
                  </div>
                )) : (
                  <div className="p-8 text-center text-xs text-brand-grey space-y-2">
                     <CheckCircle2 size={32} className="mx-auto text-green-500 opacity-50" />
                     <p>All collections are adequately stocked.</p>
                  </div>
                )}
             </div>
          </div>
       </div>
    </AdminLayout>
  );
};

export default Dashboard;
export { AdminLayout };
