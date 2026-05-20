import React, { useEffect, useState, useMemo } from 'react';
import { AdminLayout } from './Dashboard';
import { db } from '../../services/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc, where, getDocs, writeBatch, Timestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestore';
import { formatPrice, cn } from '../../utils/cn';
import { 
  Search, User, Users, Mail, Phone, Calendar, UserPlus, 
  MoreVertical, Edit2, ShieldCheck, Trash2, 
  Download, Filter, ArrowUpDown, MessageSquare, 
  ShoppingBag, CreditCard, ChevronRight, ChevronLeft, X,
  Ban, ShieldAlert, CheckCircle, Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { userService } from '../../services/userService';
import { orderService, Order } from '../../services/orderService';

interface CustomerSummary {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  status?: string;
  createdAt?: any;
  totalOrders: number;
  totalSpent: number;
  lastOrder?: Order;
  [key: string]: any;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Filters & Sorting state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [joinDateFilter, setJoinDateFilter] = useState<'all' | 'today' | 'week' | 'month' | 'year'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'joined' | 'orders' | 'spent'>('joined');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal details state
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<'profile' | 'orders'>('profile');

  // Reset pagination on filter or sort change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, joinDateFilter, sortBy, sortOrder]);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Build query for all users (allow lists for admin is enabled)
    const usersQuery = query(collection(db, 'users'));
    
    // Listen to orders - query simply to bypass complex Firestore compound indexing challenges
    const ordersQuery = query(collection(db, 'orders'));

    let usersList: any[] = [];
    let ordersList: Order[] = [];

    const combineData = (users: any[], ords: Order[]) => {
      const enhancedUsers = users.map(user => {
        const userOrders = ords.filter(o => o.userId === user.id);
        const totalSpent = userOrders.reduce((sum, o) => sum + (o.total || 0), 0);
        
        // Sort individual customer orders descending by date
        const sortedUserOrders = [...userOrders].sort((a, b) => {
          const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
          const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
          return tB - tA;
        });

        // Suppport name from displayName, name or fullName
        const mappedName = user.name || user.fullName || user.displayName || 'Anonymous Client';

        return {
          ...user,
          name: mappedName,
          totalOrders: userOrders.length,
          totalSpent,
          lastOrder: sortedUserOrders[0]
        };
      });
      setCustomers(enhancedUsers);
      setLoading(false);
    };

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      try {
        console.log("DEBUG: Fetched all users documents count: ", snapshot.docs.length);
        const rawUsers = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log(`DEBUG: User ID: ${doc.id}, data:`, data);
          return { id: doc.id, ...data };
        }) as any[];
        
        // Filter elements where role = "user" OR where role is empty/undefined, OR where style shows customer intent, and filter out hardcoded admin:
        usersList = rawUsers.filter(u => {
          const uEmail = u.email ? u.email.toLowerCase().trim() : '';
          const uRole = u.role ? u.role.toLowerCase().trim() : 'user';
          
          if (uEmail === 'umardev750@gmail.com') {
            return false; // Skip the master admin in customer list
          }
          
          // Show users, customers, or anyone without admin permission
          return uRole !== 'admin' && uRole !== 'deleted';
        });

        console.log("DEBUG: Screened customer profiles list: ", usersList);
        combineData(usersList, ordersList);
      } catch (err: any) {
        console.error("DEBUG: Process snap error: ", err);
      }
    }, (err) => {
      console.error("DEBUG FETCH ERROR - Failed to subscribe to user data collection 'users':", err);
      setError(`Unable to retrieve user registry: ${err.message || err}`);
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, 'users');
      } catch (e) {}
    });

    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      try {
        ordersList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order));
        console.log("DEBUG: Fetched total orders count: ", ordersList.length);
        setOrders(ordersList);
        combineData(usersList, ordersList);
      } catch (err) {
        console.error("DEBUG: Orders snap processing error: ", err);
      }
    }, (err) => {
      console.error("DEBUG FETCH ERROR - Failed to subscribe to order history:", err);
      setError(`Unable to retrieve transaction archive database: ${err.message || err}`);
      setLoading(false);
      try {
        handleFirestoreError(err, OperationType.LIST, 'orders');
      } catch (e) {}
    });

    return () => {
      unsubscribeUsers();
      unsubscribeOrders();
    };
  }, [retryTrigger]);

  const stats = useMemo(() => {
    const total = customers.length;
    const blocked = customers.filter(c => c.status === 'blocked').length;
    
    // Joined this calendar month
    const newThisMonth = customers.filter(c => {
      const cDate = c.createdAt || c.signupDate;
      if (!cDate) return false;
      const joinDate = cDate.toDate ? cDate.toDate() : new Date(cDate);
      const now = new Date();
      return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
    }).length;

    // Active: placed an order in the last 30 days
    const active = customers.filter(c => {
      if (!c.lastOrder) return false;
      const orderDate = c.lastOrder.createdAt?.toDate ? c.lastOrder.createdAt.toDate() : new Date(c.lastOrder.createdAt);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }).length;

    return { total, active, blocked, newThisMonth };
  }, [customers]);

  const filteredAndSortedCustomers = useMemo(() => {
    return customers
      .filter(c => {
        const nameToSearch = c.name || c.fullName || '';
        const emailToSearch = c.email || '';
        const phoneToSearch = c.phone || c.phoneNumber || '';
        
        const matchesSearch = `${nameToSearch} ${emailToSearch} ${phoneToSearch}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'all' || (statusFilter === 'blocked' ? c.status === 'blocked' : c.status !== 'blocked');
        
        let matchesJoinDate = true;
        const cDate = c.createdAt || c.signupDate;
        if (cDate) {
          const joinDate = cDate.toDate ? cDate.toDate() : new Date(cDate);
          const now = new Date();
          const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          
          const startOfWeek = new Date();
          startOfWeek.setDate(now.getDate() - now.getDay());
          startOfWeek.setHours(0, 0, 0, 0);

          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
          const startOfYear = new Date(now.getFullYear(), 0, 1);

          if (joinDateFilter === 'today') {
            matchesJoinDate = joinDate >= startOfToday;
          } else if (joinDateFilter === 'week') {
            matchesJoinDate = joinDate >= startOfWeek;
          } else if (joinDateFilter === 'month') {
            matchesJoinDate = joinDate >= startOfMonth;
          } else if (joinDateFilter === 'year') {
            matchesJoinDate = joinDate >= startOfYear;
          }
        } else if (joinDateFilter !== 'all') {
          matchesJoinDate = false;
        }

        return matchesSearch && matchesStatus && matchesJoinDate;
      })
      .sort((a, b) => {
        let comparison = 0;
        if (sortBy === 'name') {
          const nameA = a.name || a.fullName || '';
          const nameB = b.name || b.fullName || '';
          comparison = nameA.localeCompare(nameB);
        } else if (sortBy === 'joined') {
          const dateValA = a.createdAt || a.signupDate;
          const dateValB = b.createdAt || b.signupDate;
          const timeA = dateValA?.seconds ? dateValA.seconds * 1000 : (dateValA ? new Date(dateValA).getTime() : 0);
          const timeB = dateValB?.seconds ? dateValB.seconds * 1000 : (dateValB ? new Date(dateValB).getTime() : 0);
          comparison = timeA - timeB;
        } else if (sortBy === 'spent') {
          comparison = a.totalSpent - b.totalSpent;
        } else if (sortBy === 'orders') {
          comparison = a.totalOrders - b.totalOrders;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
  }, [customers, searchTerm, statusFilter, joinDateFilter, sortBy, sortOrder]);

  // Paginated selection
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedCustomers.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredAndSortedCustomers, currentPage, itemsPerPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredAndSortedCustomers.length / itemsPerPage);
  }, [filteredAndSortedCustomers, itemsPerPage]);

  const toggleBlock = async (customer: CustomerSummary) => {
    const isBlocked = customer.status === 'blocked';
    const actionText = isBlocked ? 'unblocking' : 'restricting';
    const loadingToast = toast.loading(`Initiating client status change...`);
    try {
      await userService.toggleUserBlock(customer.id, !isBlocked);
      toast.dismiss(loadingToast);
      toast.success(`Client successfully ${isBlocked ? 'unblocked' : 'blocked'}!`);
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("Failed to modify client enrollment status.");
    }
  };

  const deleteClient = async (id: string) => {
    if (!window.confirm("CRITICAL WARNING: Are you sure you want to permanently delete this client record? This removes user profile and credentials out from active rosters.")) return;
    const loadingToast = toast.loading(`Deleting client profile...`);
    try {
      await userService.deleteUser(id);
      toast.dismiss(loadingToast);
      toast.success("Client reference files permanently retired.");
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error("An unexpected error blocked deletion.");
    }
  };

  const openCustomerDetails = async (customer: CustomerSummary, defaultTab: 'profile' | 'orders' = 'profile') => {
    setSelectedCustomer(customer);
    setActiveModalTab(defaultTab);
    setIsModalOpen(true);
    setIsLoadingOrders(true);
    try {
      const ordersSnap = await orderService.getUserOrders(customer.id);
      setCustomerOrders(ordersSnap);
    } catch (err) {
      console.error("Failed to query customized user purchases:", err);
      toast.error("Unable to load full user acquisition records.");
    } finally {
      setIsLoadingOrders(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Phone', 'Role', 'Status', 'Joined Date', 'Total Orders', 'Total Spent'];
    const rows = filteredAndSortedCustomers.map(c => {
      const formattedDate = formatJoinDate(c.createdAt, c.signupDate);
      return [
        `"${(c.name || c.fullName || 'Anonymous Client').replace(/"/g, '""')}"`,
        `"${(c.email || 'N/A').replace(/"/g, '""')}"`,
        `"${(c.phone || c.phoneNumber || 'N/A').replace(/"/g, '""')}"`,
        `"${(c.role || 'user').replace(/"/g, '""')}"`,
        `"${(c.status || 'active').replace(/"/g, '""')}"`,
        `"${formattedDate}"`,
        c.totalOrders,
        c.totalSpent
      ];
    });

    const csvContent = "\uFEFF" // UTF-8 BOM
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UFR_Customers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Client CSV archive ready for download!");
  };

  const formatJoinDate = (createdAt: any, signupDate?: any) => {
    const val = createdAt || signupDate;
    if (!val) return 'Pre-Launch';
    if (val.toDate && typeof val.toDate === 'function') {
      return val.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
    }
    const date = new Date(val.seconds ? val.seconds * 1000 : val);
    if (isNaN(date.getTime())) return 'Pre-Launch';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const handleSeedMockCustomers = async () => {
    const loadingToast = toast.loading("Seeding e-commerce customer profiles...");
    try {
      const mockUsers = [
        { uid: "mock_user_1", email: "ayesha_alam@gmail.com", name: "Ayesha Alam", phone: "+92 301 4567891", role: "user", status: "active" },
        { uid: "mock_user_2", email: "bilal_mustafa@hotmail.com", name: "Bilal Mustafa", phone: "+92 321 9876543", role: "user", status: "active" },
        { uid: "mock_user_3", email: "zainab_siddiqui@gmail.com", name: "Zainab Siddiqui", phone: "+92 300 1122334", role: "user", status: "active" },
        { uid: "mock_user_4", email: "hamza_malik@yahoo.com", name: "Hamza Malik", phone: "+92 333 4455667", role: "user", status: "active" },
        { uid: "mock_user_5", email: "sana_qureshi@outlook.com", name: "Sana Qureshi", phone: "+92 345 6677889", role: "user", status: "active" },
        { uid: "mock_user_6", email: "farhan_ali@gmail.com", name: "Farhan Ali", phone: "+92 312 3344556", role: "user", status: "blocked" },
        { uid: "mock_user_7", email: "amina_sheikh@gmail.com", name: "Amina Sheikh", phone: "+92 322 5566778", role: "user", status: "active" }
      ];

      const mockOrders = [
        {
          orderId: "UFR-ORD-90812",
          userId: "mock_user_1",
          total: 34500,
          status: "delivered",
          paymentMethod: "easypaisa",
          paymentStatus: "verified",
          createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)),
          customer: { name: "Ayesha Alam", email: "ayesha_alam@gmail.com", phone: "+92 301 4567891", address: "Defense Phase VI, Karachi" },
          items: [{ name: "Maison Luxury Pret Suit", price: 34500, quantity: 1, size: "S" }]
        },
        {
          orderId: "UFR-ORD-77541",
          userId: "mock_user_2",
          total: 56000,
          status: "delivered",
          paymentMethod: "jazzcash",
          paymentStatus: "verified",
          createdAt: Timestamp.fromDate(new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)),
          customer: { name: "Bilal Mustafa", email: "bilal_mustafa@hotmail.com", phone: "+92 321 9876543", address: "Gulberg III, Lahore" },
          items: [{ name: "Maison Formal Bridal Sherwani", price: 56000, quantity: 1, size: "XL" }]
        },
        {
          orderId: "UFR-ORD-65231",
          userId: "mock_user_3",
          total: 18500,
          status: "processing",
          paymentMethod: "cod",
          paymentStatus: "pending",
          createdAt: Timestamp.fromMillis(Date.now() - 1 * 60 * 60 * 1000),
          customer: { name: "Zainab Siddiqui", email: "zainab_siddiqui@gmail.com", phone: "+92 300 1122334", address: "F-10 Sector, Islamabad" },
          items: [{ name: "Casual Eastern Kurta", price: 18500, quantity: 1, size: "M" }]
        }
      ];

      const batch = writeBatch(db);
      
      mockUsers.forEach(u => {
        const uRef = doc(db, 'users', u.uid);
        batch.set(uRef, {
          uid: u.uid,
          email: u.email,
          name: u.name,
          fullName: u.name,
          phone: u.phone,
          role: u.role,
          status: u.status,
          createdAt: Timestamp.now()
        });
      });

      mockOrders.forEach(o => {
        const oRef = doc(db, 'orders', o.orderId);
        batch.set(oRef, o);
      });

      await batch.commit();
      toast.dismiss(loadingToast);
      toast.success("Demonstration customer and orders successfully populated!");
    } catch (err: any) {
      console.error(err);
      toast.dismiss(loadingToast);
      toast.error(`Database seeding failed: ${err.message || err}`);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Maison Client Registry">
        <div className="space-y-8 animate-pulse">
          {/* Skeletons for stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-2xl border border-brand-beige h-24" />
            ))}
          </div>
          {/* Skeleton for table */}
          <div className="bg-white rounded-2xl border border-brand-beige p-6 h-[400px]" />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Maison Client Registry">
        <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl border border-brand-beige max-w-lg mx-auto p-8 text-center space-y-4">
          <ShieldAlert size={48} className="text-red-500" />
          <h3 className="text-xl font-serif font-bold text-brand-black">Access Archive Blocked</h3>
          <p className="text-sm text-brand-grey leading-relaxed">{error}</p>
          <button 
            onClick={() => {
              setLoading(true);
              setError(null);
              setRetryTrigger(prev => prev + 1);
            }}
            className="mt-4 px-8 py-3 bg-brand-black text-white rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-brand-gold transition-all"
          >
            Retry Verification
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Maison Client Registry">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-10">
        {[
          { label: 'Total Enrolled', value: stats.total, icon: User, color: 'text-brand-gold', bg: 'bg-brand-cream' },
          { label: 'Active (30-day purchases)', value: stats.active, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Enlisted This Month', value: stats.newThisMonth, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Restricted profiles', value: stats.blocked, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-2xl luxury-shadow border border-brand-beige"
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-grey mb-1">{stat.label}</p>
                <h3 className="text-3xl font-serif font-bold">{stat.value}</h3>
              </div>
              <div className={cn("p-3 rounded-xl", stat.bg)}>
                <stat.icon size={20} className={stat.color} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row justify-between items-stretch mb-8 gap-6">
        <div className="relative flex-grow max-w-xl w-full">
          <input 
            className="w-full bg-white border border-brand-beige rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none luxury-shadow focus:border-brand-gold transition-all" 
            placeholder="Search by client name, email or mobile..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
          {/* Status Select tab */}
          <div className="flex bg-white rounded-full p-1 border border-brand-beige luxury-shadow shrink-0">
            {['all', 'active', 'blocked'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s as any)}
                className={cn(
                  "px-5 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all",
                  statusFilter === s ? "bg-brand-gold text-white" : "hover:bg-brand-cream text-brand-grey"
                )}
              >
                {s}
              </button>
            ))}
          </div>

          {/* Join Date Custom Pill Dropdown */}
          <div className="flex bg-white rounded-full p-1.5 border border-brand-beige luxury-shadow shrink-0 items-center px-4">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-grey mr-2 flex items-center gap-1">
              <Calendar size={12} /> Joined:
            </span>
            <select
              value={joinDateFilter}
              onChange={(e) => setJoinDateFilter(e.target.value as any)}
              className="bg-transparent text-[10px] uppercase font-bold tracking-widest text-brand-black focus:outline-none cursor-pointer py-1"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="year">This Year</option>
            </select>
          </div>

          {/* Sort selection drop dropdown */}
          <div className="flex bg-white rounded-full p-1.5 border border-brand-beige luxury-shadow shrink-0 items-center px-4">
            <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-grey mr-2 flex items-center gap-1">
              <ArrowUpDown size={12} /> Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-[10px] uppercase font-bold tracking-widest text-brand-black focus:outline-none cursor-pointer py-1 mr-2"
            >
              <option value="joined">Join Date</option>
              <option value="name">Name</option>
              <option value="orders">Total Orders</option>
              <option value="spent">Total Spent</option>
            </select>
            <button 
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-brand-gold hover:bg-brand-cream rounded-full transition-all"
              title="Reverse Order"
            >
              <ArrowUpDown size={12} />
            </button>
          </div>

          {/* Export to csv button */}
          <button 
            onClick={exportToCSV}
            className="bg-white border border-brand-beige text-brand-black px-6 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-3 hover:bg-brand-cream transition-all luxury-shadow shrink-0"
          >
            <Download size={14} /> Export CSV
          </button>

          {/* Seed Mock Customer database button */}
          {customers.length === 0 && (
            <button 
              onClick={handleSeedMockCustomers}
              className="bg-brand-black hover:bg-brand-gold hover:text-brand-black text-white px-6 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-3 transition-all transition duration-300 luxury-shadow shrink-0"
            >
              <Users size={14} /> Seed Demo Clients
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl luxury-shadow overflow-hidden border border-brand-beige">
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-beige">
                <th className="px-6 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">
                  <span className="flex items-center gap-2">Client Identity</span>
                </th>
                <th className="px-6 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Contact Info</th>
                <th className="px-6 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">
                  <span className="flex items-center gap-2">Commercial Value</span>
                </th>
                <th className="px-6 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Status</th>
                <th className="px-6 py-6 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey text-right">Maison Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige">
              {paginatedCustomers.length > 0 ? paginatedCustomers.map((c) => (
                <tr key={c.id} className="hover:bg-brand-cream/20 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-brand-cream border border-brand-beige flex items-center justify-center text-brand-gold luxury-shadow-sm font-serif text-lg font-bold">
                        {c.name?.[0]?.toUpperCase() || c.fullName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <p className="text-sm font-serif font-bold group-hover:text-brand-gold transition-colors">{c.name || c.fullName || 'Anonymous Client'}</p>
                        <p className="text-[10px] text-brand-grey font-bold tracking-widest uppercase mt-0.5">
                          Since {formatJoinDate(c.createdAt, c.signupDate)}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-mono text-[11px] space-y-1">
                    <p className="flex items-center gap-2 text-brand-grey"><Mail size={14} className="text-brand-beige shrink-0" /> {c.email || 'No email'}</p>
                    <p className="flex items-center gap-2 text-brand-grey"><Phone size={14} className="text-brand-beige shrink-0" /> {c.phone || c.phoneNumber || 'No mobile'}</p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-1">
                      <p className="text-sm font-bold text-brand-gold">{formatPrice(c.totalSpent)}</p>
                      <button 
                        onClick={() => openCustomerDetails(c, 'orders')}
                        className="text-[10px] font-bold text-brand-grey uppercase tracking-widest hover:text-brand-gold transition-colors text-left"
                      >
                        {c.totalOrders === 1 ? '1 Collection piece' : `${c.totalOrders} Collection pieces`}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className={cn(
                      "text-[9px] uppercase font-black tracking-widest px-3 py-1.5 rounded-full border shadow-sm",
                      c.status === 'blocked' 
                        ? "bg-red-50 text-red-600 border-red-100" 
                        : "bg-green-50 text-green-600 border-green-100"
                    )}>
                      {c.status === 'blocked' ? 'Restricted' : 'Enrolled'}
                    </span>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex justify-end gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => openCustomerDetails(c, 'profile')}
                        className="p-3 text-brand-grey hover:text-brand-gold hover:bg-brand-cream rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="View Full Profile"
                      >
                        <User size={18} />
                      </button>
                      
                      <button 
                        onClick={() => openCustomerDetails(c, 'orders')}
                        className="p-3 text-brand-grey hover:text-brand-gold hover:bg-brand-cream rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="View Orders History"
                      >
                        <ShoppingBag size={18} />
                      </button>

                      <button 
                         onClick={() => toggleBlock(c)}
                         className={cn(
                           "p-3 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center",
                           c.status === 'blocked' ? "text-green-600 hover:bg-green-50" : "text-red-500 hover:bg-red-50"
                         )}
                         title={c.status === 'blocked' ? "Unrestrict Access" : "Restrict Access"}
                      >
                        <Ban size={18} />
                      </button>
                      
                      <button 
                        onClick={() => deleteClient(c.id)}
                        className="p-3 text-brand-grey hover:text-red-600 hover:bg-red-50 rounded-xl transition-all min-w-[40px] min-h-[40px] flex items-center justify-center"
                        title="Delete Record"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-40 text-center">
                    <div className="max-w-xs mx-auto space-y-4">
                      <User size={48} className="mx-auto text-brand-beige opacity-30" />
                      <p className="text-brand-grey font-serif italic text-sm">No clients match your filtration criteria in our archives.</p>
                      <button onClick={() => { setSearchTerm(''); setStatusFilter('all'); setJoinDateFilter('all'); }} className="text-brand-gold text-xs font-bold uppercase tracking-widest border-b border-brand-gold pb-1">Reset Filters</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 bg-white p-4 rounded-2xl border border-brand-beige gap-4 luxury-shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs text-brand-grey">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-brand-cream border border-brand-beige rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span className="text-xs text-brand-grey">per page</span>
          </div>
          
          <div className="flex items-center gap-1 font-mono text-xs">
            <span className="text-brand-grey">Page</span>
            <span className="font-bold text-brand-black">{currentPage}</span>
            <span className="text-brand-grey">of</span>
            <span className="font-bold text-brand-black">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-2.5 rounded-xl border border-brand-beige transition-all text-brand-grey hover:text-brand-black min-w-[40px] min-h-[40px] flex items-center justify-center",
                currentPage === 1 && "opacity-40 cursor-not-allowed"
              )}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2.5 rounded-xl border border-brand-beige transition-all text-brand-grey hover:text-brand-black min-w-[40px] min-h-[40px] flex items-center justify-center",
                currentPage === totalPages && "opacity-40 cursor-not-allowed"
              )}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Customer Detail Detail Modal */}
      <AnimatePresence>
        {isModalOpen && selectedCustomer && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-4xl bg-brand-cream rounded-[2rem] luxury-shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col h-[85vh] max-h-[720px]">
                {/* Header */}
                <div className="bg-white p-6 md:p-8 flex justify-between items-start border-b border-brand-beige relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cream/50 rounded-full blur-3xl -mr-32 -mt-32" />
                  <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 md:w-20 md:h-20 rounded-3xl bg-brand-cream border border-brand-beige flex items-center justify-center text-brand-gold font-serif text-3xl font-bold luxury-shadow-sm">
                      {selectedCustomer.name?.[0]?.toUpperCase() || selectedCustomer.fullName?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl font-serif font-bold mb-1 uppercase tracking-tight">{selectedCustomer.name || selectedCustomer.fullName || 'Anonymous Client'}</h2>
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-brand-grey">
                        <span className="flex items-center gap-1.5"><Mail size={12} className="text-brand-beige" /> {selectedCustomer.email || 'N/A'}</span>
                        <span className="flex items-center gap-1.5"><Phone size={12} className="text-brand-beige" /> {selectedCustomer.phone || selectedCustomer.phoneNumber || 'No phone'}</span>
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[8px]",
                          selectedCustomer.status === 'blocked' ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"
                        )}>
                          {selectedCustomer.status === 'blocked' ? 'Blocked' : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-3 bg-brand-cream hover:bg-brand-beige rounded-2xl transition-all relative z-10"
                    aria-label="Close"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Tab Switcher */}
                <div className="flex bg-white px-8 border-b border-brand-beige">
                  <button
                    onClick={() => setActiveModalTab('profile')}
                    className={cn(
                      "py-4 px-6 border-b-2 text-xs font-bold uppercase tracking-widest transition-all",
                      activeModalTab === 'profile' ? "border-brand-gold text-brand-black" : "border-transparent text-brand-grey hover:text-brand-black"
                    )}
                  >
                    Dossier profile
                  </button>
                  <button
                    onClick={() => setActiveModalTab('orders')}
                    className={cn(
                      "py-4 px-6 border-b-2 text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2",
                      activeModalTab === 'orders' ? "border-brand-gold text-brand-black" : "border-transparent text-brand-grey hover:text-brand-black"
                    )}
                  >
                    Acquisition logs ({customerOrders.length})
                  </button>
                </div>

                <div className="flex-grow overflow-y-auto p-6 md:p-8 bg-brand-cream/30">
                  {activeModalTab === 'profile' ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Left Column stats */}
                      <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-brand-beige luxury-shadow-sm space-y-6">
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-grey border-b border-brand-cream pb-3">Status Overview</h4>
                        <div className="space-y-4 font-sans">
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-brand-grey">Total Invested</span>
                              <span className="font-bold text-brand-gold font-mono">{formatPrice(selectedCustomer.totalSpent)}</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-brand-grey">Acquisitions Count</span>
                              <span className="font-serif font-bold text-sm text-brand-black">{selectedCustomer.totalOrders} pieces</span>
                           </div>
                           <div className="flex justify-between items-center text-xs">
                              <span className="text-brand-grey">Heritage Privilege</span>
                              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/5 px-2 py-1 rounded">Heritage Member</span>
                           </div>
                        </div>
                      </div>

                      {/* Right Column actions */}
                      <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-brand-beige luxury-shadow-sm">
                           <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-grey border-b border-brand-cream pb-3 mb-4">Direct Client Outreach</h4>
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <a 
                                href={`https://wa.me/${(selectedCustomer.phone || selectedCustomer.phoneNumber || '').replace(/[^0-9]/g, '')}`} 
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-3 w-full p-3 bg-green-50 text-green-700 rounded-xl text-xs font-bold hover:bg-green-100 transition-all border border-green-100"
                              >
                                 <MessageSquare size={16} /> WhatsApp Chat
                              </a>
                              <a 
                                href={`mailto:${selectedCustomer.email}`} 
                                className="flex items-center justify-center gap-3 w-full p-3 bg-brand-cream text-brand-black rounded-xl text-xs font-bold hover:bg-brand-beige transition-all border border-brand-beige"
                              >
                                 <Mail size={16} /> Send Email
                              </a>
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-2xl border border-brand-beige luxury-shadow-sm">
                           <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-grey border-b border-brand-cream pb-3 mb-4">Maison Privilege Controls</h4>
                           <div className="flex flex-wrap gap-3">
                              <button 
                                onClick={() => toggleBlock(selectedCustomer)}
                                className={cn(
                                  "px-5 py-2.5 rounded-full text-[9px] uppercase font-bold tracking-widest transition-all",
                                  selectedCustomer.status === 'blocked' ? "bg-green-600 text-white" : "bg-red-600 text-white"
                                )}
                              >
                                {selectedCustomer.status === 'blocked' ? 'Unblock Client' : 'Block Client'}
                              </button>
                              <button 
                                onClick={() => {
                                  deleteClient(selectedCustomer.id);
                                  setIsModalOpen(false);
                                }}
                                className="px-5 py-2.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 text-[9px] uppercase font-bold tracking-widest transition-all"
                              >
                                Delete Permanent
                              </button>
                           </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {isLoadingOrders ? (
                         <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-brand-beige gap-4">
                            <svg className="animate-spin text-brand-gold" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                            </svg>
                            <p className="text-xs font-serif italic text-brand-grey">Retrieving maison archive logs...</p>
                         </div>
                       ) : customerOrders.length > 0 ? (
                         <div className="space-y-4 font-sans">
                            {customerOrders.map(order => (
                              <div key={order.id} className="bg-white p-6 rounded-2xl border border-brand-beige luxury-shadow-sm hover:luxury-shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                                 <div>
                                    <p className="text-[10px] font-bold text-brand-gold uppercase tracking-widest mb-1">{order.orderId}</p>
                                    <p className="text-sm font-serif font-bold">{formatJoinDate(order.createdAt)}</p>
                                    <p className="text-xs text-brand-grey mt-2 italic">{order.items?.length || 0} items ordered</p>
                                 </div>
                                 <div className="text-left sm:text-right">
                                    <p className="text-base font-bold mb-1 font-mono">{formatPrice(order.total)}</p>
                                    <span className={cn(
                                      "text-[8px] uppercase font-black tracking-widest px-2 py-1 rounded-full border",
                                      order.status === 'delivered' ? "bg-green-50 text-green-600 border-green-100" : 
                                      order.status === 'cancelled' ? "bg-red-50 text-red-600 border-red-100" : "bg-orange-50 text-orange-600 border-orange-100"
                                    )}>
                                      {order.status}
                                    </span>
                                 </div>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="py-20 text-center bg-white rounded-3xl border border-brand-beige border-dashed">
                            <ShoppingBag className="mx-auto text-brand-beige mb-4 opacity-30" size={32} />
                            <p className="text-xs font-serif italic text-brand-grey">No acquisitions recorded in our archives yet.</p>
                         </div>
                       )}
                    </div>
                  )}
                </div>
                
                {/* Footer */}
                <div className="bg-white p-6 border-t border-brand-beige flex justify-between items-center z-10">
                  <span className="text-[10px] font-mono font-bold text-brand-grey uppercase tracking-widest">ID Reference: {selectedCustomer.id}</span>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="bg-brand-black text-white px-8 py-3 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-brand-gold transition-all"
                  >
                    Close Dossier
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default CustomerManagement;
