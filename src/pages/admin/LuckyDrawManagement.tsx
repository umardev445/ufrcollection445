import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Users, 
  Ticket, 
  Calendar, 
  Play, 
  RefreshCw, 
  Download,
  CheckCircle2,
  AlertTriangle,
  Search,
  ArrowRight,
  UserCheck,
  Award,
  Trash2,
  Clock,
  Eye,
  CalendarDays,
  Coins,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  ChevronUp,
  X,
  Edit2,
  Check,
  Smartphone,
  Car,
  Gift,
  HelpCircle,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { luckyDrawService, LuckyDrawToken, LuckyDrawConfig, LuckyDrawWinner, TokenStatus } from '../../services/luckyDrawService';
import { formatPrice, cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { db, auth } from '../../services/firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  setDoc, 
  addDoc,
  Timestamp, 
  query, 
  where, 
  orderBy, 
  getDocs,
  deleteDoc,
  writeBatch
} from 'firebase/firestore';
import { AdminLayout } from './Dashboard';

const LuckyDrawManagement = () => {
  // Config & Token States
  const [config, setConfig] = useState<LuckyDrawConfig | null>(null);
  const [tokens, setTokens] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningDraw, setRunningDraw] = useState(false);

  // Filter & Search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'winner' | 'expired' | 'pending'>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Interactivity State (Manual Override Modal)
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);
  const [selectedWinnerIndex, setSelectedWinnerIndex] = useState<number | null>(null);
  const [overrideSearchTerm, setOverrideSearchTerm] = useState('');

  // Live real-time Firestore Subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubscribeConfig = onSnapshot(doc(db, 'lucky_draw_config/current'), (snapshot) => {
      if (snapshot.exists()) {
        setConfig(snapshot.data() as LuckyDrawConfig);
      } else {
        // Safe auto-creation in case doc doesn't exist
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

  // Join tokens with associated users and orders
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
      return tB - tA; // newer first
    });
  }, [tokens, users, orders]);

  // Dashboard calculations
  const totalTokensGenerated = tokens.length;
  const activePromoTokens = tokens.filter(t => t.status === 'active');
  const uniqueEligibleUsers = useMemo(() => {
    return new Set(activePromoTokens.map(t => t.userId)).size;
  }, [activePromoTokens]);

  const drawProgressStatus = config?.status === 'active' ? 'Active' : 'Completed';
  const drawAnnouncementState = config?.announced ? 'Announced on Live Site' : 'Draw Concluded (Unannounced)';

  // Filters & Searching
  const filteredTokens = useMemo(() => {
    return enhancedTokens.filter(t => {
      const targetQuery = `${t.tokenNumber} ${t.userName} ${t.userPhone} ${t.orderId}`.toLowerCase();
      const matchSearch = targetQuery.includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [enhancedTokens, searchTerm, statusFilter]);

  // Pagination Selectors
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredTokens.length / itemsPerPage) || 1;
  const paginatedTokens = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    return filteredTokens.slice(startIdx, startIdx + itemsPerPage);
  }, [filteredTokens, currentPage]);

  // 10 winners shuffle and selection algorithm
  const handleLaunchLuckyDraw = async () => {
    const activeCandidates = enhancedTokens.filter(t => t.status === 'active');

    if (activeCandidates.length === 0) {
      toast.error('No verified eligible active tokens are ready in the pool. Verify payments in Orders first.');
      return;
    }

    if (!window.confirm(`Are you sure you want to run the lucky draw? This will randomly select up to 10 winners according to official Maison algorithms and set remaining tokens to expired.`)) {
      return;
    }

    setRunningDraw(true);
    const loadingToast = toast.loading('Calculating randomized permutations in security cloud...');

    try {
      // Shuffle array
      const shuffled = [...activeCandidates].sort(() => 0.5 - Math.random());
      
      // Select winners while ensuring "One winner per person" rule
      const selectedWinners: any[] = [];
      const wonUsers = new Set<string>();

      for (const token of shuffled) {
        if (!wonUsers.has(token.userId)) {
          selectedWinners.push(token);
          wonUsers.add(token.userId);
        }
        if (selectedWinners.length >= 10) break;
      }

      const prizes = [
        { title: 'iPhone 17 (1st Prize Extraordinaire)', position: 1 },
        { title: 'Honda Civic + Cash (2nd Prize Grandeur)', position: 2 },
        { title: 'Rs. 100,000 Cash (3rd Prize Prestige)', position: 3 },
        ...Array(7).fill(null).map((_, i) => ({ title: 'Rs. 10,000 Cash (Maison Consolation)', position: 4 + i }))
      ];

      const winnersPayload: LuckyDrawWinner[] = [];
      const batch = writeBatch(db);

      selectedWinners.forEach((token, idx) => {
        const prizeDesc = prizes[idx]?.title || 'Rs. 10,000 Cash (Maison Consolation)';
        const pos = prizes[idx]?.position || (idx + 1);

        winnersPayload.push({
          userId: token.userId,
          userName: token.userName,
          userPhone: token.userPhone,
          tokenNumber: token.tokenNumber,
          prize: prizeDesc,
          position: pos
        });

        // Track and batch update winning tokens
        const tokenRef = doc(db, 'lucky_draw_tokens', token.id);
        batch.update(tokenRef, {
          status: 'winner',
          prize: prizeDesc
        });
      });

      // Update remaining active tokens to expired
      const remainingTokens = tokens.filter(t => t.status === 'active' && !selectedWinners.some(w => w.id === t.id));
      remainingTokens.forEach(t => {
        const tRef = doc(db, 'lucky_draw_tokens', t.id);
        batch.update(tRef, { status: 'expired' });
      });

      // Update lucky draw configuration
      const configRef = doc(db, 'lucky_draw_config/current');
      batch.update(configRef, {
        status: 'inactive',
        announced: false,
        winners: winnersPayload
      });

      await batch.commit();

      toast.dismiss(loadingToast);
      toast.success(`Lucky Draw success! Selected ${winnersPayload.length} exquisite winners.`);
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
    const loadToast = toast.loading('Populating e-commerce sandbox entries...');
    try {
      const demoContestants = [
        { name: 'Ayesha Alam', phone: '+92 301 4567891', order: 'UFR-ORD-90812', amount: 34500 },
        { name: 'Bilal Mustafa', phone: '+92 321 9876543', order: 'UFR-ORD-77541', amount: 56000 },
        { name: 'Zainab Siddiqui', phone: '+92 300 1122334', order: 'UFR-ORD-65231', amount: 18500 },
        { name: 'Hamza Malik', phone: '+92 333 4455667', order: 'UFR-ORD-22345', amount: 42000 },
        { name: 'Sana Qureshi', phone: '+92 345 6677889', order: 'UFR-ORD-88712', amount: 75000 },
        { name: 'Farhan Ali', phone: '+92 312 3344556', order: 'UFR-ORD-55421', amount: 125000 },
        { name: 'Amina Sheikh', phone: '+92 322 5566778', order: 'UFR-ORD-11982', amount: 29000 },
        { name: 'Umer Farooq', phone: '+92 302 9900112', order: 'UFR-ORD-33412', amount: 12000 },
        { name: 'Fatima Najeeb', phone: '+92 315 2244668', order: 'UFR-ORD-99124', amount: 68000 },
        { name: 'Kashif Jameel', phone: '+92 334 7788990', order: 'UFR-ORD-44123', amount: 48500 },
        { name: 'Khadija Rehman', phone: '+92 320 8899001', order: 'UFR-ORD-80911', amount: 92000 },
        { name: 'Saad Ghafoor', phone: '+92 311 5566993', order: 'UFR-ORD-51203', amount: 31500 },
        { name: 'Mariam Waqar', phone: '+92 303 4455221', order: 'UFR-ORD-70198', amount: 105000 },
        { name: 'Rohan Shah', phone: '+92 344 1122998', order: 'UFR-ORD-60299', amount: 23000 },
        { name: 'Aliya Butt', phone: '+92 324 7733221', order: 'UFR-ORD-30541', amount: 14500 }
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
      toast.success('Successfully provisioned 15 active promotion entries!');
    } catch (e: any) {
      console.error(e);
      toast.dismiss(loadToast);
      toast.error('Failed to generate test roster entries.');
    }
  };

  // Announce/Toggle Announcement of winners
  const toggleAnnounceWinners = async () => {
    if (!config?.winners || config.winners.length === 0) {
      toast.error('No winner files exist to publish. Run the lucky draw selection first.');
      return;
    }

    const nextState = !config.announced;
    const loadToast = toast.loading(nextState ? 'Broadcasting winners to homepage roster...' : 'Concealing results from public pages...');

    try {
      await updateDoc(doc(db, 'lucky_draw_config/current'), {
        announced: nextState
      });
      toast.dismiss(loadToast);
      toast.success(nextState ? 'Winners published live to customers!' : 'Winners removed from live site.');
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Failed to change announcement state.');
    }
  };

  // Reset promotion controls
  const handleResetDraw = async () => {
    if (!config?.winners || config.winners.length === 0) {
      // Just plain reset is fine
      if (!window.confirm('Reset current promotion configurations to pristine state?')) return;
    } else {
      if (!window.confirm('WARNING: Resetting will archive the current winner dossier, update and expire existing tokens, and open a brand-new pristine active promotion round. Confirm reset?')) return;
    }

    const loadingToast = toast.loading('Archiving current records & resetting promotion database...');
    try {
      const batch = writeBatch(db);

      // Move current config parameters into history archives
      if (config && config.winners && config.winners.length > 0) {
        const historyRef = collection(db, 'lucky_draw_history');
        await addDoc(historyRef, {
          drawDate: config.drawDate || Timestamp.now(),
          winners: config.winners,
          announced: config.announced || false,
          createdAt: Timestamp.now()
        });
      }

      // Convert all 'winner' tokens to safe archived 'expired' status
      const winnerTokens = tokens.filter(t => t.status === 'winner');
      winnerTokens.forEach(t => {
        const tRef = doc(db, 'lucky_draw_tokens', t.id);
        batch.update(tRef, { status: 'expired' });
      });

      // Reinstate fresh new config variables
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
      toast.success('Lucky Draw promotion reset and ready for next cycle!');
    } catch (error) {
      toast.dismiss(loadingToast);
      toast.error('Failed during administrative reset routine.');
    }
  };

  // Manual Winner Override Configuration
  const openManualOverride = (winnerIndex: number) => {
    setSelectedWinnerIndex(winnerIndex);
    setOverrideSearchTerm('');
    setIsOverrideModalOpen(true);
  };

  const eligibleOverrideTokens = useMemo(() => {
    if (selectedWinnerIndex === null) return [];
    // Only active status tokens that are not currently chosen as any winner
    const winnerNumbers = new Set(config?.winners?.map(w => w.tokenNumber) || []);
    return enhancedTokens.filter(t => 
      t.status === 'active' && 
      !winnerNumbers.has(t.tokenNumber) &&
      (t.tokenNumber?.toLowerCase().includes(overrideSearchTerm.toLowerCase()) || 
       t.userName?.toLowerCase().includes(overrideSearchTerm.toLowerCase()))
    );
  }, [enhancedTokens, config, selectedWinnerIndex, overrideSearchTerm]);

  const handleApplyOverride = async (replacementToken: any) => {
    if (selectedWinnerIndex === null || !config?.winners) return;
    
    const targetWinner = config.winners[selectedWinnerIndex];
    const prevWinnerToken = tokens.find(t => t.tokenNumber === targetWinner.tokenNumber);
    
    if (!window.confirm(`Confirm swapping winner position #${targetWinner.position} (${targetWinner.prize}) from:\n${targetWinner.userName} (${targetWinner.tokenNumber})\n\nTo:\n${replacementToken.userName} (${replacementToken.tokenNumber})?`)) {
      return;
    }

    const loadToast = toast.loading('Applying manual override to winner arrays...');
    try {
      const batch = writeBatch(db);

      // 1. Revert previous winner token back to active
      if (prevWinnerToken) {
        batch.update(doc(db, 'lucky_draw_tokens', prevWinnerToken.id), {
          status: 'active',
          prize: null
        });
      }

      // 2. Set new replacements token status to winner
      batch.update(doc(db, 'lucky_draw_tokens', replacementToken.id), {
        status: 'winner',
        prize: targetWinner.prize
      });

      // 3. Update winners array inside configuration
      const updatedWinners = [...config.winners];
      updatedWinners[selectedWinnerIndex] = {
        userId: replacementToken.userId,
        userName: replacementToken.userName,
        userPhone: replacementToken.userPhone,
        tokenNumber: replacementToken.tokenNumber,
        prize: targetWinner.prize,
        position: targetWinner.position
      };

      batch.update(doc(db, 'lucky_draw_config/current'), {
        winners: updatedWinners
      });

      await batch.commit();
      
      setIsOverrideModalOpen(false);
      toast.dismiss(loadToast);
      toast.success('Winner swapped successfully by executive override!');
    } catch (error) {
      toast.dismiss(loadToast);
      toast.error('Override transaction rejected by server.');
    }
  };

  // Export full token registry to raw CSV with UTF-8 support
  const handleExportCSV = () => {
    if (filteredTokens.length === 0) {
      toast.error('No tokens match filters to export.');
      return;
    }

    const headers = ['Token Number', 'Client Name', 'Client Phone', 'Client Email', 'Order Reference', 'Order Amount', 'Date Generated', 'Status', 'Prize Won'];
    const rows = filteredTokens.map(t => [
      `"${(t.tokenNumber || '').replace(/"/g, '""')}"`,
      `"${(t.userName || 'Anonymous').replace(/"/g, '""')}"`,
      `"${(t.userPhone || 'No Phone').replace(/"/g, '""')}"`,
      `"${(t.userEmail || '').replace(/"/g, '""')}"`,
      `"${(t.orderId || '').replace(/"/g, '""')}"`,
      t.orderAmount,
      `"${t.createdAt?.toDate?.()?.toLocaleDateString() || new Date(t.createdAt).toLocaleDateString()}"`,
      `"${(t.status || '').replace(/"/g, '""')}"`,
      `"${(t.prize || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "\uFEFF" // UTF-8 BOM
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `UFR_Maison_LuckyTokens_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Token catalog export complete!');
  };

  // Update configuration draw date from picker
  const handleUpdateDrawDate = async (dateStr: string) => {
    if (!dateStr) return;
    try {
      const selectedDate = new Date(dateStr);
      await updateDoc(doc(db, 'lucky_draw_config/current'), {
        drawDate: Timestamp.fromDate(selectedDate)
      });
      toast.success('Draw execution date rescheduled.');
    } catch (error) {
      toast.error('Failed to reschedule date parameters.');
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
      {/* Overview Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-10">
        {[
          { 
            label: 'Tokens Generated', 
            value: totalTokensGenerated, 
            caption: 'All recorded entries', 
            icon: Ticket, 
            color: 'text-brand-gold', 
            bg: 'bg-brand-cream' 
          },
          { 
            label: 'Eligible Active', 
            value: activePromoTokens.length, 
            caption: `${uniqueEligibleUsers} Unique Payees`, 
            icon: Users, 
            color: 'text-emerald-600', 
            bg: 'bg-emerald-50' 
          },
          { 
            label: 'Draw Status', 
            value: drawProgressStatus, 
            caption: drawAnnouncementState, 
            icon: ShieldCheck, 
            color: config?.status === 'active' ? 'text-blue-600' : 'text-purple-600', 
            bg: config?.status === 'active' ? 'bg-blue-50' : 'bg-purple-50' 
          },
          { 
            label: 'Target Draw Date', 
            value: config?.drawDate ? (config.drawDate.toDate ? config.drawDate.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Not set') : 'Not Set', 
            caption: 'Editable in configurations', 
            icon: Calendar, 
            color: 'text-amber-600', 
            bg: 'bg-amber-50' 
          },
          { 
            label: 'Premium Prizeries', 
            value: 'Rs. 10.05M', 
            caption: 'iPhone 17 & Civic + Cash', 
            icon: Trophy, 
            color: 'text-[#D4AF37]', 
            bg: 'bg-amber-50/40' 
          }
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white p-5 rounded-2xl luxury-shadow border border-brand-beige flex flex-col justify-between"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-[9px] uppercase tracking-widest font-black text-brand-grey">{stat.label}</p>
                <h3 className="text-xl font-serif font-black mt-1 text-brand-black">{stat.value}</h3>
              </div>
              <div className={cn("p-2.5 rounded-xl", stat.bg)}>
                <stat.icon size={18} className={stat.color} />
              </div>
            </div>
            <p className="text-[9px] uppercase font-bold tracking-wider text-brand-grey font-sans">{stat.caption}</p>
          </motion.div>
        ))}
      </div>

      {/* Control Actions Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        
        {/* Draw Executives and Actions */}
        <div className="bg-brand-black text-white p-8 rounded-[2rem] luxury-shadow flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 transform translate-x-12 -translate-y-12 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
            <Trophy size={280} />
          </div>
          
          <div className="space-y-5 relative z-10">
            <span className="bg-brand-gold/20 text-brand-gold text-[9px] uppercase font-bold tracking-widest px-3.5 py-1.5 rounded-full border border-brand-gold/30 inline-block">
              Secure Draw Execution
            </span>
            <h3 className="text-2xl font-serif font-bold text-white tracking-tight">Couture Promoters Control</h3>
            <p className="text-xs text-white/60 leading-relaxed font-sans">
              Deploy lucky draw permutations across all active, verified EasyPaisa/JazzCash advance payees. One winner per customer limit is strictly verified through the registry.
            </p>
          </div>

          <div className="space-y-3.5 mt-8 relative z-10">
            {config?.winners && config.winners.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={toggleAnnounceWinners}
                  className={cn(
                    "w-full py-4 px-4 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all shadow-md flex items-center justify-center gap-2",
                    config.announced 
                      ? "bg-amber-600/30 text-brand-gold border border-brand-gold/50 hover:bg-amber-600/50" 
                      : "bg-brand-gold text-brand-black hover:bg-white"
                  )}
                >
                  <Sparkles size={14} />
                  {config.announced ? 'Conceal Live' : 'Announce Live'}
                </button>
                <button 
                  onClick={handleResetDraw}
                  className="w-full bg-white/10 hover:bg-red-950 hover:text-red-400 py-4 px-4 rounded-xl text-[9px] uppercase font-bold tracking-widest transition-all border border-white/5 flex items-center justify-center gap-2"
                >
                  <RefreshCw size={14} /> Clear & Reset
                </button>
              </div>
            ) : (
              <button 
                onClick={handleLaunchLuckyDraw}
                disabled={runningDraw || activePromoTokens.length === 0}
                className="w-full bg-brand-gold text-brand-black py-4 rounded-xl text-[10px] uppercase font-black tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white transition-all disabled:opacity-40 shadow-xl"
              >
                {runningDraw ? <RefreshCw className="animate-spin" size={16} /> : <Play size={16} />}
                {runningDraw ? 'Selecting Winners...' : 'Run Lucky Draw Ceremony'}
              </button>
            )}

            {activePromoTokens.length === 0 && config?.status === 'active' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-red-400 text-[9px] uppercase tracking-widest font-bold bg-red-950/40 p-3 rounded-lg border border-red-920">
                  <AlertTriangle size={14} />
                  No active tokens in current pool
                </div>
                <button
                  onClick={handleGenerateDemoTokens}
                  className="w-full bg-[#1A1A1A] hover:bg-brand-gold text-white hover:text-brand-black py-3 rounded-xl text-[9px] uppercase font-bold tracking-widest flex items-center justify-center gap-2 transition-all border border-neutral-800 shadow-sm"
                >
                  <Ticket size={14} className="text-brand-gold group-hover:text-current" />
                  Seed 15 Test Contestants
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Configuration Parameter Settlings */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-beige luxury-shadow flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="font-serif text-xl border-b border-brand-cream pb-3 text-brand-black flex items-center gap-2">
              <Calendar className="text-brand-gold" size={20} /> Parameters Config
            </h3>
            
            <div className="space-y-4">
              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-black text-brand-grey tracking-widest block">Draw Status</label>
                <p className="text-xs text-brand-grey italic mb-2">Toggle enrollment activation state</p>
                <select 
                  value={config?.status || 'active'} 
                  onChange={async (e) => {
                    await updateDoc(doc(db, 'lucky_draw_config/current'), {
                      status: e.target.value as any
                    });
                    toast.success('Draw configuration state changed.');
                  }}
                  className="w-full bg-brand-cream border border-brand-beige p-3 rounded-xl text-xs font-bold text-brand-black focus:border-brand-gold focus:outline-none"
                >
                  <option value="active">Active (Sponsoring Entry Tokens)</option>
                  <option value="inactive">Inactive (Suspended/Locked)</option>
                </select>
              </div>

              <div className="space-y-1 text-left">
                <label className="text-[9px] uppercase font-black text-brand-grey tracking-widest block">Reschedule Draw Date</label>
                <p className="text-xs text-brand-grey italic mb-2">Select targeted draw ceremony date</p>
                <input 
                  type="date" 
                  value={config?.drawDate ? new Date(config.drawDate.seconds * 1000).toISOString().split('T')[0] : ''}
                  onChange={(e) => handleUpdateDrawDate(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-beige p-3 rounded-xl text-xs font-mono font-bold text-brand-black focus:border-brand-gold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="p-4 bg-brand-cream/40 rounded-xl border border-brand-beige/40 text-[9px] text-brand-grey text-left">
            <p className="font-bold uppercase tracking-wider mb-2">Promotion Guidelines:</p>
            <ul className="list-disc pl-3 space-y-1">
              <li>JazzCash and EasyPaisa generate tokens as "pending" at checkout.</li>
              <li>Verification in executive Order Roster switches tokens to "active".</li>
            </ul>
          </div>
        </div>

        {/* Premium Prizes Showcase */}
        <div className="bg-white p-8 rounded-[2rem] border border-brand-beige luxury-shadow flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-serif text-xl border-b border-brand-cream pb-3 text-brand-black flex items-center gap-2">
              <Award className="text-brand-gold" size={20} /> Prize Asset Portfolio
            </h3>
            
            <div className="space-y-3">
              {[
                { rank: '1st Rank', item: 'iPhone 17 Plus Premium', icon: Smartphone, color: 'text-rose-600', val: 'Rs. 380k' },
                { rank: '2nd Rank', item: 'Honda Civic sedan + Cash', icon: Car, color: 'text-indigo-600', val: 'Rs. 9.5M' },
                { rank: '3rd Rank', item: 'Rs. 100,000 Premium Cash', icon: Coins, color: 'text-emerald-600', val: 'Rs. 100k' },
                { rank: '4th-10th', item: 'Rs. 10,000 Cash Pool (7x)', icon: Gift, color: 'text-amber-500', val: 'Rs. 70k' }
              ].map((p, idx) => (
                <div key={idx} className="flex justify-between items-center py-2.5 border-b border-brand-cream/50 last:border-0 text-left">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-2 rounded-lg bg-brand-cream", p.color)}>
                      <p.icon size={15} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-brand-black">{p.item}</p>
                      <p className="text-[8px] uppercase tracking-widest text-brand-grey font-bold">{p.rank}</p>
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold text-brand-gold">{p.val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-right text-[10px] text-brand-grey font-bold tracking-widest uppercase mt-4">
            Grand Total Portfolio: ~ Rs. 10.05 Million
          </div>
        </div>
      </div>

      {/* Dynamic Winners Showcase (With replacement edit overrides) */}
      <AnimatePresence>
        {config?.winners && config.winners.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-[2rem] border border-brand-beige luxury-shadow overflow-hidden mb-10 text-left"
          >
            <div className="bg-brand-black p-6 pl-8 pr-8 text-white flex justify-between items-center">
              <div>
                <h3 className="text-base font-serif font-black flex items-center gap-2"><Trophy className="text-brand-gold" size={20} /> EXECUTED DRAW WINNERS DOSSIER</h3>
                <p className="text-[9px] uppercase tracking-widest font-bold text-white/50 mt-1">Concluded Results. Status: {config.announced ? 'Announced Live' : 'Offline Draft'}</p>
              </div>
              <button 
                onClick={toggleAnnounceWinners}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[9px] uppercase font-bold tracking-widest border transition-all",
                  config.announced 
                    ? "bg-emerald-950 text-emerald-400 border-emerald-900 hover:bg-emerald-900" 
                    : "bg-brand-gold text-brand-black border-transparent hover:bg-white"
                )}
              >
                {config.announced ? 'Conceal Live Results' : 'Announce Results Now'}
              </button>
            </div>
            
            <div className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {config.winners.map((winner, idx) => {
                  const medalBadge = idx === 0 ? 'bg-[#FFD700]/15 border-[#FFD700]/30 text-[#D4AF37]' :
                                     idx === 1 ? 'bg-[#C0C0C0]/20 border-[#C0C0C0]/30 text-slate-500' :
                                     idx === 2 ? 'bg-[#CD7F32]/10 border-[#CD7F32]/30 text-amber-600' :
                                     'bg-brand-cream border-brand-beige text-brand-grey';
                  return (
                    <div 
                      key={idx} 
                      className="bg-white p-5 rounded-2xl border border-brand-beige/70 luxury-shadow-sm flex flex-col justify-between group hover:border-brand-gold hover:shadow-md transition-all relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-2 transform translate-x-1 translate-y-[-4px] md:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openManualOverride(idx)}
                          className="bg-brand-cream hover:bg-brand-beige border border-brand-beige p-2 rounded-xl text-brand-black transition-all flex items-center gap-1.5"
                          title="Override/Swap Winner"
                        >
                          <Edit2 size={12} /> <span className="text-[8px] uppercase font-bold tracking-widest">Swap</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-4 mb-4">
                        <div className={cn("w-10 h-10 rounded-full border flex items-center justify-center font-bold text-sm", medalBadge)}>
                          {winner.position}
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-widest font-black text-brand-gold">{winner.prize}</p>
                          <p className="text-sm font-serif font-black text-brand-black">{winner.userName}</p>
                        </div>
                      </div>

                      <div className="bg-brand-cream/60 p-3 rounded-xl border border-brand-beige/40 flex justify-between items-center text-[10px] font-mono">
                        <span className="text-brand-grey">Token Number:</span>
                        <span className="font-bold text-brand-black">{winner.tokenNumber}</span>
                      </div>
                      <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-brand-grey mt-3">
                        <span>Phone: {winner.userPhone || 'No Phone'}</span>
                        <span>ID: {winner.userId.substring(0, 7)}...</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Token Registry Table & Filters */}
      <div className="bg-white rounded-3xl border border-brand-beige luxury-shadow overflow-hidden text-left mb-10">
        
        {/* Header bar and filters */}
        <div className="p-6 md:p-8 border-b border-brand-beige bg-white flex flex-col xl:flex-row justify-between xl:items-center gap-6">
          <div className="space-y-1">
            <h3 className="text-lg font-serif font-bold text-brand-black">Promotion Token Registry</h3>
            <p className="text-xs text-brand-grey">{filteredTokens.length} active matching records listed</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search token, user, order..."
                className="w-full bg-brand-cream border border-brand-beige rounded-full py-2.5 pl-10 pr-4 text-xs focus:outline-none focus:border-brand-gold transition-all"
              />
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey" size={14} />
            </div>

            {/* Status Filter tabs */}
            <div className="flex bg-brand-cream rounded-full p-1 border border-brand-beige overflow-x-auto">
              {(['all', 'active', 'winner', 'expired', 'pending'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-[9px] uppercase font-bold tracking-widest transition-all whitespace-nowrap",
                    statusFilter === s ? "bg-brand-gold text-white" : "hover:text-brand-black text-brand-grey"
                  )}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Export CSV Button */}
            <button 
              onClick={handleExportCSV}
              className="bg-brand-black hover:bg-brand-gold hover:text-brand-black text-white px-5 py-2.5 rounded-full text-[9px] uppercase font-bold tracking-widest flex items-center gap-2 transition-all luxury-shadow shrink-0 ml-auto xl:ml-0"
            >
              <Download size={13} /> Export CSV
            </button>
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto font-sans">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-cream border-b border-brand-beige">
                <th className="p-5 pl-8 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Token Number</th>
                <th className="p-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Customer Identity</th>
                <th className="p-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Order & Value</th>
                <th className="p-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Date Generated</th>
                <th className="p-5 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey">Status</th>
                <th className="p-5 pr-8 text-[10px] uppercase font-black tracking-[0.2em] text-brand-grey text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige">
              {paginatedTokens.length > 0 ? paginatedTokens.map((token) => (
                <tr key={token.id} className="hover:bg-brand-cream/15 transition-all">
                  <td className="p-5 pl-8 font-mono font-bold text-xs text-brand-gold">
                    {token.tokenNumber}
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-serif font-bold text-brand-black">{token.userName}</p>
                    <p className="text-[9px] text-brand-grey mt-0.5">{token.userPhone}</p>
                  </td>
                  <td className="p-5">
                    <p className="text-xs font-mono font-bold text-brand-black">{token.orderId}</p>
                    <p className="text-[9px] text-brand-grey mt-0.5 font-sans font-bold uppercase tracking-wide">Amt: {formatPrice(token.orderAmount)}</p>
                  </td>
                  <td className="p-5 text-[10px] text-brand-grey font-mono">
                    {token.createdAt?.toDate ? token.createdAt.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : (token.createdAt ? new Date(token.createdAt).toLocaleDateString() : 'Historical')}
                  </td>
                  <td className="p-5">
                    <span className={cn(
                      "text-[8px] uppercase font-black tracking-widest px-2.5 py-1.5 rounded-full border",
                      token.status === 'winner' ? "bg-amber-50 text-[#D4AF37] border-amber-200" :
                      token.status === 'active' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      token.status === 'pending' ? "bg-orange-50 text-orange-600 border-orange-100" :
                      "bg-gray-100 text-gray-500 border-gray-200"
                    )}>
                      {token.status}
                    </span>
                  </td>
                  <td className="p-5 pr-8 text-right">
                    <div className="flex justify-end gap-1">
                      {token.status === 'active' && !config?.winners?.length && (
                        <button 
                          onClick={async () => {
                            if (!window.confirm('Toggle status of this token to Winner?')) return;
                            await updateDoc(doc(db, 'lucky_draw_tokens', token.id), { status: 'winner' });
                            toast.success('Maison Token status upgraded.');
                          }}
                          className="px-3 py-1.5 bg-brand-cream hover:bg-brand-gold hover:text-white rounded-xl text-[9px] uppercase tracking-wider font-extrabold text-brand-black border border-brand-beige"
                        >
                          Mark Winner
                        </button>
                      )}
                      {token.status === 'winner' && (
                        <span className="text-brand-gold text-[9px] uppercase font-bold bg-brand-gold/10 px-2.5 py-1.5 rounded-xl border border-brand-gold/20">
                          {token.prize?.replace(/ \(.*\)/, '') || 'Winner'}
                        </span>
                      )}
                      {token.status === 'pending' && (
                        <button 
                          onClick={async () => {
                            if (!window.confirm('Manually activate this pending token? Use Order management for standard automatic flow.')) return;
                            await updateDoc(doc(db, 'lucky_draw_tokens', token.id), { status: 'active' });
                            toast.success('Token manually verified!');
                          }}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-[9px] uppercase tracking-wider font-extrabold text-emerald-700 border border-emerald-100"
                        >
                          Verify Payment
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="p-20 text-center text-brand-grey italic text-sm">
                    <Ticket className="mx-auto text-brand-beige mb-3 opacity-30" size={32} />
                     No lucky draw entries match the requested search or filter keys.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Scalable Table Pagination */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-brand-beige bg-brand-cream/10 flex justify-between items-center">
            <span className="text-[10px] font-mono text-brand-grey">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-xl bg-white border border-brand-beige hover:bg-brand-cream disabled:opacity-40 transition-all flex items-center justify-center"
              >
                <ChevronLeft size={16} />
              </button>
              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-xl bg-white border border-brand-beige hover:bg-brand-cream disabled:opacity-40 transition-all flex items-center justify-center"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Historical Records Timeline */}
      <div className="bg-white rounded-3xl border border-brand-beige luxury-shadow overflow-hidden text-left mb-8 p-8 max-w-7xl">
         <div className="border-b border-brand-cream pb-4 mb-6 flex justify-between items-center">
           <div>
             <h3 className="text-lg font-serif font-bold text-brand-black flex items-center gap-2"><Clock size={18} className="text-brand-gold" /> Concluded Ceremony Archives</h3>
             <p className="text-xs text-brand-grey">Archived winner sets from previous draw cycles</p>
           </div>
           <span className="text-[10px] uppercase font-bold bg-brand-cream text-brand-grey px-3 py-1.5 rounded-full border border-brand-beige tracking-wider">{history.length} archived cycles</span>
         </div>

         {history.length > 0 ? (
           <div className="space-y-6">
              {history.map((archiveCycle, cIdx) => (
                <div key={archiveCycle.id} className="p-6 bg-brand-cream/20 rounded-2xl border border-brand-beige/70 space-y-4">
                  <div className="flex justify-between items-center flex-wrap gap-2 pb-2.5 border-b border-brand-beige/50">
                    <p className="text-xs font-serif font-black text-brand-black flex items-center gap-1.5">
                      <CalendarDays size={14} className="text-brand-gold" /> Draw Date: {archiveCycle.drawDate?.toDate ? archiveCycle.drawDate.toDate().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Archive Record'}
                    </p>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-brand-grey">
                      Archived on: {archiveCycle.createdAt?.toDate ? archiveCycle.createdAt.toDate().toLocaleDateString() : 'N/A'}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-x-6 gap-y-3 pt-1 text-xs">
                     {archiveCycle.winners && archiveCycle.winners.map((win: any, wIndex: number) => (
                       <div key={wIndex} className="bg-white px-3.5 py-2 rounded-xl border border-brand-beige/50 min-w-[200px] flex justify-between items-center gap-4">
                          <div>
                            <p className="text-[8px] uppercase tracking-widest font-black text-brand-gold truncate">{win.prize?.replace(/ \(.*\)/, '') || 'Award'}</p>
                            <p className="font-serif font-bold text-brand-black text-[11px] truncate">{win.userName}</p>
                          </div>
                          <span className="font-mono font-bold text-[10px] text-brand-grey bg-brand-cream px-1.5 py-1 rounded border border-brand-beige">{win.tokenNumber}</span>
                       </div>
                     ))}
                  </div>
                </div>
              ))}
           </div>
         ) : (
           <div className="p-10 border border-brand-beige border-dashed rounded-2xl text-center text-brand-grey italic text-xs">
              No draw records currently archived in historical database.
           </div>
         )}
      </div>

      {/* Manual Winner Override Selection Modal */}
      <AnimatePresence>
        {isOverrideModalOpen && selectedWinnerIndex !== null && config?.winners && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOverrideModalOpen(false)}
              className="absolute inset-0 bg-brand-black/55 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-white rounded-3xl overflow-hidden luxury-shadow-2xl border border-brand-beige flex flex-col max-h-[80vh]"
            >
              {/* Header */}
              <div className="bg-brand-cream p-5 pl-6 pr-6 border-b border-brand-beige flex justify-between items-center text-left">
                <div>
                  <h4 className="text-sm font-serif font-black uppercase text-brand-black">Manual Swap Override</h4>
                  <p className="text-[9px] uppercase tracking-widest font-bold text-brand-grey mt-0.5">Position #{selectedWinnerIndex + 1}: {config.winners[selectedWinnerIndex].prize}</p>
                </div>
                <button 
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="p-1.5 bg-white border border-brand-beige hover:bg-brand-cream rounded-xl transition-all"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Subheader and Select Roster */}
              <div className="p-5 flex-grow overflow-y-auto space-y-4">
                <p className="text-xs text-brand-grey leading-relaxed text-left">
                  Selecting a replacement will revert the current winner <strong>{config.winners[selectedWinnerIndex].userName}</strong> back to "active" state and award the prize to the newly designated client token.
                </p>

                {/* Local override search input */}
                <div className="relative">
                  <input 
                    value={overrideSearchTerm}
                    onChange={(e) => setOverrideSearchTerm(e.target.value)}
                    placeholder="Search replacement token or user..."
                    className="w-full bg-brand-cream border border-brand-beige rounded-xl py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-gold transition-all"
                  />
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-grey" size={12} />
                </div>

                {/* Candidate list */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pt-1">
                  {eligibleOverrideTokens.length > 0 ? eligibleOverrideTokens.map((replacement) => (
                    <button
                      key={replacement.id}
                      onClick={() => handleApplyOverride(replacement)}
                      className="w-full text-left p-3.5 bg-brand-cream/40 hover:bg-brand-cream border border-brand-beige rounded-2xl flex justify-between items-center transition-all group"
                    >
                      <div>
                        <p className="text-[10px] font-mono font-bold text-brand-gold group-hover:underline">{replacement.tokenNumber}</p>
                        <p className="text-xs font-serif font-bold text-brand-black mt-0.5">{replacement.userName}</p>
                        <p className="text-[9px] text-brand-grey mt-0.5">Phone: {replacement.userPhone}</p>
                      </div>
                      <span className="p-1.5 bg-white border border-brand-beige rounded-lg text-[9px] font-black uppercase tracking-widest text-brand-grey hover:bg-brand-gold group-hover:text-white transition-all">
                        SELECT
                      </span>
                    </button>
                  )) : (
                    <p className="text-xs text-brand-grey italic text-center py-6">
                      No matching active eligible tokens available for selection in registry pool.
                    </p>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="bg-brand-cream/50 p-4 border-t border-brand-beige text-right">
                <button 
                  onClick={() => setIsOverrideModalOpen(false)}
                  className="px-5 py-2.5 bg-brand-black hover:bg-brand-gold hover:text-brand-black text-white rounded-xl text-[9px] uppercase font-bold tracking-wider transition-all"
                >
                  Cancel Swap Override
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default LuckyDrawManagement;
