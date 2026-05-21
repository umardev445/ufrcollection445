import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, Users, Ticket, Calendar, Play, RefreshCw, Download,
  CheckCircle2, AlertTriangle, Search, ArrowRight, UserCheck, Award,
  Trash2, Clock, Eye, CalendarDays, Coins, ShieldCheck, Sparkles,
  ChevronDown, ChevronUp, X, Edit2, Smartphone, Car, Gift, HelpCircle,
  TrendingUp, ChevronLeft, ChevronRight, Bike
} from 'lucide-react';
import { luckyDrawService, LuckyDrawToken, LuckyDrawConfig, LuckyDrawWinner, TokenStatus } from '../../services/luckyDrawService';
import { formatPrice, cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { db, auth } from '../../services/firebase';
import { 
  collection, onSnapshot, doc, updateDoc, setDoc, addDoc,
  Timestamp, query, where, orderBy, getDocs, deleteDoc, writeBatch
} from 'firebase/firestore';
import { AdminLayout } from './Dashboard';

const LuckyDrawManagement = () => {
  const [config, setConfig] = useState<LuckyDrawConfig | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDraw, setRunningDraw] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'winner' | 'expired' | 'pending'>('all');
  
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null);
  const [overrideSearchTerm, setOverrideSearchTerm] = useState('');

  // ✅ UPDATED PRIZES
  const prizes = [
    { title: 'iPhone 17 (1st Prize)', position: 1, value: 'iPhone 17' },
    { title: 'Honda 70 Motorcycle (2nd Prize)', position: 2, value: 'Honda 70 Motorcycle' },
    { title: 'Rs. 50,000 Cash (3rd Prize)', position: 3, value: 'Rs. 50,000 Cash' },
    ...Array(7).fill(null).map((_, i) => ({ 
      title: 'Rs. 10,000 Cash (Consolation Prize)', 
      position: 4 + i, 
      value: 'Rs. 10,000 Cash' 
    }))
  ];

  useEffect(() => {
    setLoading(true);

    const unsubscribeConfig = onSnapshot(doc(db, 'lucky_draw_config/current'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as LuckyDrawConfig);
      } else {
        const defaultDoc: LuckyDrawConfig = {
          status: 'active',
          startDate: Timestamp.now(),
          drawDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
          winners: []
        };
        setDoc(doc(db, 'lucky_draw_config/current'), defaultDoc);
      }
    });

    const unsubscribeTokens = onSnapshot(collection(db, 'lucky_draw_tokens'), (snapshot) => {
      const tokenList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTokens(tokenList);
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'orders'), (snapshot) => {
      const orderList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(orderList);
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    const unsubscribeHistory = onSnapshot(
      query(collection(db, 'lucky_draw_history'), orderBy('createdAt', 'desc')), 
      (snapshot) => {
        const hList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setHistory(hList);
      }
    );

    return () => {
      unsubscribeConfig();
      unsubscribeTokens();
      unsubscribeUsers();
      unsubscribeOrders();
      unsubscribeHistory();
    };
  }, []);

  const enhancedTokens = useMemo(() => {
    return tokens.map(token => {
      const userMatch = users.find(u => u.id === token.userId);
      const orderMatch = orders.find(o => o.id === token.orderId);
      return {
        ...token,
        userName: userMatch?.name || userMatch?.fullName || 'Anonymous Client',
        userPhone: userMatch?.phone || userMatch?.phoneNumber || 'No mobile',
        userEmail: userMatch?.email || '',
        orderAmount: orderMatch?.total || 0,
        orderDate: orderMatch?.createdAt ? (orderMatch.createdAt?.toDate ? orderMatch.createdAt.toDate() : new Date(orderMatch.createdAt)) : null
      };
    }).sort((a,b) => {
      const tA = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });
  }, [tokens, users, orders]);

  const totalTokensGenerated = tokens.length;
  const activePromoTokens = tokens.filter(t => t.status === 'active');
  const uniqueEligibleUsers = useMemo(() => {
    return new Set(activePromoTokens.map(t => t.userId)).size;
  }, [activePromoTokens]);

  const drawProgressStatus = config?.status === 'active' ? 'Active' : 'Completed';
  const drawAnnouncementState = config?.announced ? 'Announced on Live Site' : 'Draw Concluded (Unannounced)';

  const filteredTokens = useMemo(() => {
    return enhancedTokens.filter(t => {
      const targetQuery = `${t.tokenNumber} ${t.userName} ${t.userPhone} ${t.orderId}`.toLowerCase();
      const matchSearch = targetQuery.includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enhancedTokens, searchTerm, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage) || 1;
  const paginatedTokens = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTokens.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTokens, currentPage]);

  // ✅ UPDATED DRAW LOGIC WITH NEW PRIZES
  const handleLaunchLuckyDraw = async () => {
    const activeCandidates = enhancedTokens.filter(t => t.status === 'active');

    if (activeCandidates.length === 0) {
      toast.error('No verified eligible active tokens are ready in the pool. Verify payments in Orders first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to run the lucky draw? This will randomly select winners according to official Maison algorithms.`)) {
      return;
    }

    setRunningDraw(true);
    const loadingToast = toast.loading('Calculating randomized permutations...');

    try {
      const shuffled = [...activeCandidates].sort(() => 0.5 - Math.random());
      
      const selectedWinners: any[] = [];
      const wonUsers = new Set<string>();

      for (const token of shuffled) {
        if (!wonUsers.has(token.userId)) {
          selectedWinners.push(token);
          wonUsers.add(token.userId);
        }
        if (selectedWinners.length >= 10) break;
      }

      const winnersPayload: LuckyDrawWinner[] = [];
      const batch = writeBatch(db);

      selectedWinners.forEach((token, idx) => {
        const prizeDesc = prizes[idx]?.title || 'Rs. 10,000 Cash';
        const pos = prizes[idx]?.position || (idx + 1);

        winnersPayload.push({
          userId: token.userId,
          userName: token.userName,
          userPhone: token.userPhone,
          tokenNumber: token.tokenNumber,
          prize: prizeDesc,
          position: pos
        });

        const tokenRef = doc(db, 'lucky_draw_tokens', token.id);
        batch.update(tokenRef, {
          status: 'winner',
          prize: prizeDesc
        });
      });

      const remainingTokens = tokens.filter(t => t.status === 'active' && !selectedWinners.some(w => w.id === t.id));
      remainingTokens.forEach(t => {
        const tRef = doc(db, 'lucky_draw_tokens', t.id);
        batch.update(tRef, { status: 'expired' });
      });

      const configRef = doc(db, 'lucky_draw_config/current');
      batch.update(configRef, {
        status: 'inactive',
        announced: false,
        winners: winnersPayload
      });

      await batch.commit();

      toast.dismiss(loadingToast);
      toast.success(`Lucky Draw success! Selected ${winnersPayload.length} winners.`);
    } catch (error: any) {
      console.error(error);
      toast.dismiss(loadingToast);
      toast.error('Draw fails: database operation exception');
    } finally {
      setRunningDraw(false);
    }
  };

  const handleGenerateDemoTokens = async () => {
    const adminUser = auth.currentUser;
    if (!adminUser) {
      toast.error('You must be logged in as an administrator.');
      return;
    }
    const loadToast = toast.loading('Populating demo entries...');
    try {
      const demoContestants = [
        { name: 'Ayesha Alam', phone: '+92 301 4567891', order: 'UFR-ORD-90812', amount: 34500 },
        { name: 'Bilal Mustafa', phone: '+92 321 9876543', order: 'UFR-ORD-77541', amount: 56000 },
        { name: 'Zainab Siddiqui', phone: '+92 300 1122334', order: 'UFR-ORD-65231', amount: 18500 },
        { name: 'Hamza Malik', phone: '+92 333 4455667', order: 'UFR-ORD-22345', amount: 42000 },
        { name: 'Sana Qureshi', phone: '+92 345 6677889', order: 'UFR-ORD-88712', amount: 75000 },
        { name: 'Farhan Ali', phone: '+92 312 3344556', order: 'UFR-ORD-55421', amount: 125000 },
        { name: 'Amina Sheikh', phone: '+92 322 5566778', order: 'UFR-ORD-11982', amount: 29000 }
      ];

      const batch = writeBatch(db);
      demoContestants.forEach(c => {
        const randNum = Math.floor(10000 + Math.random() * 90000).toString();
        const tokenNumber = `UFR-LD-${randNum}`;
        const tokenRef = doc(collection(db, 'lucky_draw_tokens'));
        batch.set(tokenRef, {
          userId: adminUser.uid,
          orderId: c.order,
          tokenNumber,
          status: 'active',
          createdAt: Timestamp.now(),
          userName: c.name,
          userPhone: c.phone,
          orderAmount: c.amount
        });
      });

      await batch.commit();
      toast.dismiss(loadToast);
      toast.success('Successfully provisioned demo entries!');
    } catch (e: any) {
      console.error(e);
      toast.dismiss(loadToast);
      toast.error('Failed to generate test entries.');
    }
  };

  const toggleAnnounceWinners = async () => {
    if (!config?.winners || config.winners.length === 0) {
      toast.error('No winner files exist. Run the lucky draw first.');
      return;
    }

    const nextState = !config.announced;
    const loadToast = toast.loading(nextState ? 'Broadcasting winners...' : 'Concealing results...');

    try {
      await updateDoc(doc(db, 'lucky_draw_config/current'), {
        announced: nextState
      });
      toast.dismiss(loadToast);
      toast.success(nextState ? 'Winners published live!' : 'Winners removed from live site.');
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Failed to change announcement state.');
    }
  };

  const handleResetDraw = async () => {
    if (!window.confirm('WARNING: Resetting will archive current winners and start a fresh promotion round. Confirm?')) return;

    const loadingToast = toast.loading('Archiving current records & resetting...');
    try {
      const batch = writeBatch(db);

      if (config && config.winners && config.winners.length > 0) {
        const historyRef = collection(db, 'lucky_draw_history');
        await addDoc(historyRef, {
          drawDate: config.drawDate || Timestamp.now(),
          winners: config.winners,
          announced: config.announced || false,
          createdAt: Timestamp.now()
        });
      }

      const winnerTokens = tokens.filter(t => t.status === 'winner');
      winnerTokens.forEach(t => {
        const tRef = doc(db, 'lucky_draw_tokens', t.id);
        batch.update(tRef, { status: 'expired' });
      });

      const cleanDoc: LuckyDrawConfig = {
        status: 'active',
        announced: false,
        startDate: Timestamp.now(),
        drawDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
        winners: []
      };

      batch.set(doc(db, 'lucky_draw_config/current'), cleanDoc);
      await batch.commit();

      toast.dismiss(loadingToast);
      toast.success('Promotion reset and ready for next cycle!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed during reset routine.');
    }
  };

  const handleExportCSV = () => {
    if (filteredTokens.length === 0) {
      toast.error('No tokens to export.');
      return;
    }

    const headers = ['Token Number', 'Client Name', 'Client Phone', 'Order Reference', 'Order Amount', 'Date Generated', 'Status', 'Prize Won'];
    const rows = filteredTokens.map(t => [
      `"${(t.tokenNumber || '').replace(/"/g, '""')}"`,
      `"${(t.userName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(t.userPhone || 'No Phone').replace(/"/g, '""')}"`,
      `"${(t.orderId || '').replace(/"/g, '""')}"`,
      t.orderAmount,
      `"${t.createdAt?.toDate?.()?.toLocaleDateString() || new Date(t.createdAt).toLocaleDateString()}"`,
      `"${(t.status || '').replace(/"/g, '""')}"`,
      `"${(t.prize || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UFR_LuckyTokens_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Export complete!');
  };

  const handleUpdateDrawDate = async (dateStr: string) => {
    if (!dateStr) return;
    try {
      const selectedDate = new Date(dateStr);
      await updateDoc(doc(db, 'lucky_draw_config/current'), {
        drawDate: Timestamp.fromDate(selectedDate)
      });
      toast.success('Draw date updated.');
    } catch (error) {
      toast.error('Failed to update date.');
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Lucky Draw Administration">
        <div className="space-y-8 animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white h-24 rounded-2xl border border-brand-beige" />
            ))}
          </div>
          <div className="bg-white h-[400px] rounded-2xl border border-brand-beige" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Lucky Draw Control Suite">
      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { label: 'Tokens Generated', value: totalTokensGenerated, caption: 'All recorded entries', icon: Ticket, color: 'text-brand-gold', bg: 'bg-brand-cream' },
          { label: 'Eligible Active', value: activePromoTokens.length, caption: `${uniqueEligibleUsers} Unique Payees`, icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Draw Status', value: drawProgressStatus, caption: drawAnnouncementState, icon: ShieldCheck, color: config?.status === 'active' ? 'text-blue-600' : 'text-purple-600', bg: config?.status === 'active' ? 'bg-blue-50' : 'bg-purple-50' },
          { label: 'Target Draw Date', value: config?.drawDate ? config.drawDate.toDate().toLocaleDateString() : 'Not Set', caption: 'Editable', icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Total Prize Pool', value: 'Rs. 1.3M+', caption: 'iPhone 17 + Honda 70 + Cash', icon: Trophy, color: 'text-[#D4AF37]', bg: 'bg-amber-50/40' }
        ].map((stat, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white p-5 rounded-2xl luxury-shadow border border-brand-beige">
            <div className="flex justify-between items-start mb-3">
              <div><p className="text-[9px] uppercase tracking-widest font-black text-brand-grey">{stat.label}</p><h3 className="text-xl font-serif font-black mt-1">{stat.value}</h3></div>
              <div className={cn("p-2.5 rounded-xl", stat.bg)}><stat.icon size={18} className={stat.color} /></div>
            </div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-brand-grey">{stat.caption}</p>
          </motion.div>
        ))}
      </div>

      {/* Control Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        <div className="bg-brand-black text-white p-8 rounded-[2rem] luxury-shadow relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 opacity-[0.03]"><Trophy size={280} /></div>
          <div className="space-y-5 relative z-10">
            <span className="bg-brand-gold/20 text-brand-gold text-[9px] uppercase font-bold tracking-widest px-3.5 py-1.5 rounded-full border border-brand-gold/30 inline-block">Secure Draw Execution</span>
            <h3 className="text-2xl font-serif font-bold">Lucky Draw Control</h3>
            <p className="text-xs text-white/60">Deploy lucky draw across all active, verified advance payees. One winner per customer limit.</p>
          </div>
          <div className="space-y-3.5 mt-8 relative z-10">
            {config?.winners && config.winners.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <button onClick={toggleAnnounceWinners} className={cn("w-full py-4 px-4 rounded-xl text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-2", config.announced ? "bg-amber-600/30 text-brand-gold border border-brand-gold/50" : "bg-brand-gold text-brand-black")}>
                  <Sparkles size={14} /> {config.announced ? 'Conceal Live' : 'Announce Live'}
                </button>
                <button onClick={handleResetDraw} className="w-full bg-white/10 hover:bg-red-950 hover:text-red-400 py-4 px-4 rounded-xl text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-2">
                  <RefreshCw size={14} /> Reset
                </button>
              </div>
            ) : (
              <button onClick={handleLaunchLuckyDraw} disabled={runningDraw || activePromoTokens.length === 0} className="w-full bg-brand-gold text-brand-black py-4 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-40">
                {runningDraw ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                {runningDraw ? 'Selecting Winners...' : 'Run Lucky Draw'}
              </button>
            )}
            {activePromoTokens.length === 0 && config?.status === 'active' && (
              <button onClick={handleGenerateDemoTokens} className="w-full bg-white/10 hover:bg-white hover:text-brand-black text-white py-3 rounded-xl text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all">
                <Ticket size={14} /> Seed Demo Contestants
              </button>
            )}
          </div>
        </div>

        {/* Prize List */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-beige luxury-shadow">
          <h3 className="font-serif text-xl border-b border-brand-cream pb-3 flex items-center gap-2"><Award className="text-brand-gold" size={20} /> Prize Portfolio</h3>
          <div className="space-y-3 mt-4">
            <div className="flex justify-between items-center py-2.5 border-b border-brand-cream"><span className="flex items-center gap-2"><Smartphone size={15} className="text-rose-600" /> 1st Prize</span><span className="font-bold text-brand-gold">iPhone 17</span></div>
            <div className="flex justify-between items-center py-2.5 border-b border-brand-cream"><span className="flex items-center gap-2"><Bike size={15} className="text-indigo-600" /> 2nd Prize</span><span className="font-bold text-brand-gold">Honda 70 Motorcycle</span></div>
            <div className="flex justify-between items-center py-2.5 border-b border-brand-cream"><span className="flex items-center gap-2"><Coins size={15} className="text-emerald-600" /> 3rd Prize</span><span className="font-bold text-brand-gold">Rs. 50,000 Cash</span></div>
            <div className="flex justify-between items-center py-2.5"><span className="flex items-center gap-2"><Gift size={15} className="text-amber-500" /> 4th-10th Prize</span><span className="font-bold text-brand-gold">Rs. 10,000 Each (7 Winners)</span></div>
          </div>
        </div>

        {/* Config Panel */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-beige luxury-shadow">
          <h3 className="font-serif text-xl border-b border-brand-cream pb-3 flex items-center gap-2"><Calendar className="text-brand-gold" size={20} /> Configuration</h3>
          <div className="space-y-4 mt-4">
            <div>
              <label className="text-[9px] uppercase font-black text-brand-grey">Draw Status</label>
              <select value={config?.status || 'active'} onChange={async (e) => { await updateDoc(doc(db, 'lucky_draw_config/current'), { status: e.target.value }); toast.success('Status updated.'); }} className="w-full bg-brand-cream border border-brand-beige p-3 rounded-xl text-xs font-bold mt-1">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="text-[9px] uppercase font-black text-brand-grey">Draw Date</label>
              <input type="date" value={config?.drawDate ? new Date(config.drawDate.seconds * 1000).toISOString().split('T')[0] : ''} onChange={(e) => handleUpdateDrawDate(e.target.value)} className="w-full bg-brand-cream border border-brand-beige p-3 rounded-xl text-xs mt-1" />
            </div>
          </div>
        </div>
      </div>

      {/* Winners Display */}
      <AnimatePresence>
        {config?.winners && config.winners.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-white rounded-[2rem] border border-brand-beige luxury-shadow overflow-hidden mb-10">
            <div className="bg-brand-black p-6 text-white flex justify-between items-center">
              <div><h3 className="text-base font-serif font-bold flex items-center gap-2"><Trophy className="text-brand-gold" size={20} /> WINNERS DOSSIER</h3><p className="text-[9px] uppercase tracking-widest text-white/50 mt-1">Status: {config.announced ? 'Announced Live' : 'Offline Draft'}</p></div>
              <button onClick={toggleAnnounceWinners} className={cn("px-5 py-2.5 rounded-full text-[9px] uppercase font-bold tracking-widest border", config.announced ? "bg-emerald-950 text-emerald-400 border-emerald-900" : "bg-brand-gold text-brand-black")}>
                {config.announced ? 'Conceal Results' : 'Announce Now'}
              </button>
            </div>
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.winners.map((winner, idx) => {
                  const medalBadge = idx === 0 ? 'bg-[#FFD700]/15 border-[#FFD700]/30 text-[#D4AF37]' : idx === 1 ? 'bg-[#C0C0C0]/20 border-[#C0C0C0]/30 text-slate-500' : idx === 2 ? 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-amber-600' : 'bg-brand-cream border-brand-beige';
                  return (
                    <div key={idx} className="bg-white p-5 rounded-2xl border border-brand-beige/70 hover:border-brand-gold transition-all relative">
                      <div className="flex items-center gap-4 mb-4">
                        <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm", medalBadge)}>{winner.position}</div>
                        <div><p className="text-[9px] uppercase tracking-widest font-black text-brand-gold">{winner.prize}</p><p className="text-sm font-serif font-black">{winner.userName}</p></div>
                      </div>
                      <div className="bg-brand-cream/60 p-3 rounded-xl border border-brand-beige/40 flex justify-between items-center text-[10px] font-mono">
                        <span className="text-brand-grey">Token:</span>
                        <span className="font-bold">{winner.tokenNumber}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Token Table */}
      <div className="bg-white rounded-3xl border border-brand-beige luxury-shadow overflow-hidden">
        <div className="p-6 border-b border-brand-beige flex flex-wrap justify-between items-center gap-4">
          <div><h3 className="text-lg font-serif font-bold">Token Registry</h3><p className="text-xs text-brand-grey">{filteredTokens.length} records</p></div>
          <div className="flex flex-wrap gap-3">
            <div className="relative w-64"><input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search..." className="w-full bg-brand-cream border border-brand-beige rounded-full py-2.5 pl-10 pr-4 text-xs" /><Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey" size={14} /></div>
            <div className="flex bg-brand-cream rounded-full p-1">
              {(['all', 'active', 'winner', 'expired', 'pending'] as const).map(s => (<button key={s} onClick={() => setStatusFilter(s)} className={cn("px-4 py-1.5 rounded-full text-[9px] uppercase font-bold", statusFilter === s ? "bg-brand-gold text-white" : "hover:text-brand-black text-brand-grey")}>{s}</button>))}
            </div>
            <button onClick={handleExportCSV} className="bg-brand-black text-white px-5 py-2.5 rounded-full text-[9px] uppercase font-bold flex items-center gap-2"><Download size={13} /> Export</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead><tr className="bg-brand-cream border-b border-brand-beige"><th className="p-5 pl-8 text-[10px] uppercase font-black">Token #</th><th className="p-5 text-[10px] uppercase font-black">Customer</th><th className="p-5 text-[10px] uppercase font-black">Order</th><th className="p-5 text-[10px] uppercase font-black">Date</th><th className="p-5 text-[10px] uppercase font-black">Status</th><th className="p-5 pr-8 text-right">Actions</th></tr></thead>
            <tbody className="divide-y divide-brand-beige">
              {paginatedTokens.map((token) => (
                <tr key={token.id} className="hover:bg-brand-cream/15">
                  <td className="p-5 pl-8 font-mono font-bold text-xs text-brand-gold">{token.tokenNumber}</td>
                  <td className="p-5"><p className="text-xs font-serif font-bold">{token.userName}</p><p className="text-[9px] text-brand-grey">{token.userPhone}</p></td>
                  <td className="p-5"><p className="text-xs font-mono font-bold">{token.orderId}</p><p className="text-[9px] text-brand-grey">{formatPrice(token.orderAmount)}</p></td>
                  <td className="p-5 text-[10px] text-brand-grey">{token.createdAt?.toDate ? token.createdAt.toDate().toLocaleDateString() : 'Historical'}</td>
                  <td className="p-5"><span className={cn("text-[8px] uppercase font-black px-2.5 py-1.5 rounded-full border", token.status === 'winner' ? "bg-amber-50 text-brand-gold border-amber-200" : token.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" : token.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-100" : "bg-gray-100 text-gray-500")}>{token.status}</span></td>
                  <td className="p-5 pr-8 text-right">
                    {token.status === 'pending' && (<button onClick={async () => { await updateDoc(doc(db, 'lucky_draw_tokens', token.id), { status: 'active' }); toast.success('Token verified!'); }} className="px-3 py-1.5 bg-emerald-50 rounded-xl text-[9px] uppercase font-bold text-emerald-700">Verify</button>)}
                    {token.status === 'winner' && <span className="text-brand-gold text-[9px] uppercase font-bold bg-brand-gold/10 px-2.5 py-1.5 rounded-xl">{token.prize?.split(' ').slice(0,2).join(' ')}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (<div className="p-5 border-t border-brand-beige flex justify-between items-center"><span className="text-[10px]">Page {currentPage} of {totalPages}</span><div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(p-1,1))} disabled={currentPage===1} className="p-2 rounded-xl bg-white border"><ChevronLeft size={16} /></button><button onClick={() => setCurrentPage(p => Math.min(p+1,totalPages))} disabled={currentPage===totalPages} className="p-2 rounded-xl bg-white border"><ChevronRight size={16} /></button></div></div>)}
      </div>
    </AdminLayout>
  );
};

export default LuckyDrawManagement;