import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { formatPrice, cn } from '../utils/cn';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, LogOut, ChevronRight, MapPin, Calendar, LayoutDashboard, Ticket, Clock, Trophy } from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';
import { luckyDrawService, LuckyDrawToken, LuckyDrawConfig, TokenStatus } from '../services/luckyDrawService';

const Profile = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<any[]>([]);
  const [tokens, setTokens] = useState<LuckyDrawToken[]>([]);
  const [config, setConfig] = useState<LuckyDrawConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        const [ordersData, tokensData, configData] = await Promise.all([
          getDocs(query(collection(db, 'orders'), where('userId', '==', user.uid), orderBy('createdAt', 'desc'))),
          luckyDrawService.getUserTokens(user.uid),
          luckyDrawService.getPromotionConfig()
        ]);

        setOrders(ordersData.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTokens(tokensData);
        setConfig(configData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  useEffect(() => {
    if (!config?.drawDate) return;

    const timer = setInterval(() => {
      const distance = config.drawDate!.toDate().getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft('ENDED');
        clearInterval(timer);
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m`);
    }, 1000);

    return () => clearInterval(timer);
  }, [config]);

  const handleLogout = async () => {
    await auth.signOut();
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="bg-brand-cream min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar */}
          <aside className="lg:w-1/4">
             <div className="bg-white p-8 rounded-luxury-lg luxury-shadow space-y-8 sticky top-32">
                <div className="text-center space-y-4">
                   <div className="w-20 h-20 bg-brand-beige rounded-full flex items-center justify-center mx-auto text-brand-gold">
                      <User size={40} />
                   </div>
                   <div>
                      <h2 className="font-serif text-2xl">{user.displayName || 'UFR Member'}</h2>
                      <p className="text-xs text-brand-grey font-light">{user.email}</p>
                   </div>
                   {isAdmin && (
                     <Link to="/admin" className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border border-brand-gold/20">
                       <LayoutDashboard size={12} />
                       Admin Panel
                     </Link>
                   )}
                </div>

                <nav className="flex flex-col gap-2">
                   <button className="flex items-center gap-4 p-4 rounded-xl bg-brand-cream text-brand-gold font-bold text-xs uppercase tracking-widest transition-all">
                      <User size={18} />
                      Profile
                   </button>
                   <button 
                    onClick={() => {
                        const el = document.getElementById('lucky-draw-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-4 p-4 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-xs uppercase tracking-widest font-bold"
                   >
                       <Ticket size={18} />
                       Lucky Draw
                   </button>
                   <Link to="/track-order" className="flex items-center gap-4 p-4 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-xs uppercase tracking-widest font-bold">
                      <Package size={18} />
                      Track Order
                   </Link>
                   <Link to="/wishlist" className="flex items-center gap-4 p-4 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-xs uppercase tracking-widest font-bold">
                      <Heart size={18} />
                      Wishlist
                   </Link>
                   <button onClick={handleLogout} className="flex items-center gap-4 p-4 rounded-xl text-red-500 hover:bg-red-50 transition-all text-xs uppercase tracking-widest font-bold">
                      <LogOut size={18} />
                      Logout
                   </button>
                </nav>
             </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-3/4 space-y-8">
             {/* Lucky Draw Section */}
             <div id="lucky-draw-section" className="bg-brand-black text-white p-8 md:p-12 rounded-luxury-lg luxury-shadow relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <Trophy size={120} />
                </div>
                
                <div className="relative z-10 space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                      <div className="space-y-2">
                        <h3 className="font-serif text-3xl text-brand-gold">Lucky Draw Tokens</h3>
                        <p className="text-white/60 text-sm font-light">Exclusive entries from your advance payment acquisitions</p>
                      </div>
                      {config?.drawDate && (
                        <div className="bg-white/10 px-6 py-3 rounded-full border border-white/20 backdrop-blur-sm">
                           <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-gold mb-1">Next Draw Countdown</p>
                           <p className="text-xl font-mono font-bold flex items-center gap-2">
                              <Clock size={16} className="text-brand-gold" />
                              {timeLeft}
                           </p>
                        </div>
                      )}
                   </div>

                   {loading ? (
                     <div className="py-12 text-center text-white/40 italic">Verifying archive entries...</div>
                   ) : tokens.length > 0 ? (
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {tokens.map((token) => (
                          <motion.div 
                            key={token.id}
                            whileHover={{ scale: 1.02 }}
                            className={cn(
                              "p-6 rounded-xl border transition-all flex justify-between items-center",
                              token.status === TokenStatus.WINNER 
                                ? "bg-brand-gold/20 border-brand-gold shadow-[0_0_20px_rgba(212,175,55,0.3)]" 
                                : "bg-white/5 border-white/10 hover:border-white/30"
                            )}
                          >
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                   <Ticket size={14} className={token.status === TokenStatus.WINNER ? "text-brand-gold" : "text-white/40"} />
                                   <p className="text-lg font-mono font-bold tracking-wider">{token.tokenNumber}</p>
                                </div>
                                <p className="text-[10px] text-white/40 uppercase tracking-widest">Order: {token.orderId}</p>
                             </div>
                             <div className="text-right space-y-1">
                                <span className={cn(
                                  "text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full",
                                  token.status === TokenStatus.WINNER ? "bg-brand-gold text-brand-black" : "bg-white/10 text-white/60"
                                )}>
                                  {token.status}
                                </span>
                                {token.prize && (
                                  <p className="text-[10px] text-brand-gold font-bold italic">{token.prize}</p>
                                )}
                             </div>
                          </motion.div>
                        ))}
                     </div>
                   ) : (
                     <div className="py-12 border border-dashed border-white/10 rounded-xl text-center space-y-4">
                        <p className="text-white/40 text-sm italic">No entries yet. Use JazzCash / Advance Payment to secure your token.</p>
                        <Link to="/shop" className="inline-block text-brand-gold text-[10px] uppercase tracking-widest font-bold border-b border-brand-gold/30 pb-1 hover:border-brand-gold transition-all">Acquire New Artifacts</Link>
                     </div>
                   )}
                </div>
             </div>

             <div className="bg-white p-8 md:p-12 rounded-luxury-lg luxury-shadow">
                <h3 className="font-serif text-3xl mb-10 border-b border-brand-beige pb-6">Order History</h3>
                {loading ? (
                  <div className="text-center py-20 animate-pulse text-brand-grey text-center">Loading your history...</div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((order) => (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 border border-brand-beige rounded-xl hover:border-brand-gold transition-colors flex flex-col md:flex-row justify-between items-center gap-6"
                      >
                         <div className="flex gap-6 items-center w-full md:w-auto">
                            <div className="w-16 h-16 bg-brand-beige rounded-lg flex items-center justify-center shrink-0">
                               <Package size={24} className="text-brand-grey" />
                            </div>
                            <div>
                               <p className="text-xs font-bold uppercase tracking-widest">{order.orderId}</p>
                               <p className="text-[10px] text-brand-grey font-light">Placed on {order.createdAt?.toDate()?.toLocaleDateString()}</p>
                               <div className="mt-2 flex items-center gap-2">
                                  <span className={cn(
                                    "text-[8px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full border",
                                    order.status === 'delivered' ? "bg-green-50 text-green-600 border-green-200" : "bg-brand-beige text-brand-grey border-brand-beige"
                                  )}>
                                    {order.status}
                                  </span>
                                  <span className="text-[8px] text-brand-grey font-bold uppercase tracking-widest">• {order.items.length} Items</span>
                               </div>
                            </div>
                         </div>

                         <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                            <div className="text-right">
                               <p className="font-serif text-xl font-bold">{formatPrice(order.total)}</p>
                               <p className="text-[10px] uppercase font-bold text-brand-grey">{order.paymentMethod}</p>
                            </div>
                            <Link to="/track-order" className="p-3 bg-brand-cream rounded-full hover:bg-brand-gold hover:text-white transition-all">
                               <ChevronRight size={18} />
                            </Link>
                         </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-32 space-y-6">
                    <div className="w-20 h-20 bg-brand-beige rounded-full flex items-center justify-center mx-auto opacity-30">
                       <Package size={32} />
                    </div>
                    <div className="space-y-2">
                       <p className="text-brand-grey font-serif text-xl">You haven't placed any orders yet.</p>
                       <p className="text-xs text-brand-grey font-light italic">Start your luxury journey with us today.</p>
                    </div>
                    <Link to="/shop" className="inline-block bg-brand-black text-white px-10 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold transition-all">Shop Latest Collection</Link>
                  </div>
                )}
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-8 rounded-luxury-lg luxury-shadow space-y-6">
                   <h4 className="font-serif text-xl flex items-center gap-3">
                      <MapPin size={20} className="text-brand-gold" />
                      Default Address
                   </h4>
                   <div className="text-sm font-light text-brand-grey space-y-1">
                      <p className="font-bold text-brand-black">Primary Shipping</p>
                      <p>Currently using direct input at checkout.</p>
                      <p>Save addresses coming soon.</p>
                   </div>
                </div>
                <div className="bg-white p-8 rounded-luxury-lg luxury-shadow space-y-6">
                   <h4 className="font-serif text-xl flex items-center gap-3">
                      <Calendar size={20} className="text-brand-gold" />
                      Account Since
                   </h4>
                   <div className="text-sm font-light text-brand-grey space-y-1">
                      <p className="font-bold text-brand-black">Member Since</p>
                      <p>{user.metadata.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : 'Recently Joined'}</p>
                      <p>Verified Boutique Client</p>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
