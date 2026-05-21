import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, auth } from '../services/firebase';
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, addDoc } from 'firebase/firestore';
import { formatPrice, cn } from '../utils/cn';
import { useNavigate, Link } from 'react-router-dom';
import { User, Package, Heart, LogOut, ChevronRight, MapPin, Calendar, LayoutDashboard, Ticket, Clock, Trophy, CheckCircle, XCircle, AlertCircle, Edit2, Save, X } from 'lucide-react';
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
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(user?.displayName || '');
  const [editPhone, setEditPhone] = useState('');
  
  // Fetch user phone from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user?.uid) return;
      const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', user.uid)));
      if (!userDoc.empty) {
        const userData = userDoc.docs[0].data();
        setEditPhone(userData.phoneNumber || '');
      }
    };
    fetchUserData();
  }, [user]);

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
        toast.error('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time listener for tokens
    if (user?.uid) {
      const unsubscribe = onSnapshot(
        query(collection(db, 'lucky_draw_tokens'), where('userId', '==', user.uid)),
        (snapshot) => {
          const updatedTokens = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LuckyDrawToken));
          setTokens(updatedTokens);
        }
      );
      return () => unsubscribe();
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!config?.drawDate) return;

    const timer = setInterval(() => {
      const distance = config.drawDate!.toDate().getTime() - new Date().getTime();
      if (distance < 0) {
        setTimeLeft('DRAW COMPLETED');
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

 const handleUpdateProfile = async () => {
  try {
    // Update phone in Firestore
    if (editPhone && user?.uid) {
      const userQuery = query(collection(db, 'users'), where('uid', '==', user.uid));
      const userSnapshot = await getDocs(userQuery);
      if (!userSnapshot.empty) {
        await updateDoc(doc(db, 'users', userSnapshot.docs[0].id), { phoneNumber: editPhone });
        toast.success('Phone number updated successfully');
      } else {
        // If user document doesn't exist, create one
        await addDoc(collection(db, 'users'), {
          uid: user.uid,
          email: user.email,
          phoneNumber: editPhone,
          createdAt: new Date()
        });
        toast.success('Profile updated successfully');
      }
    }
    
    if (editName !== user?.displayName && user) {
      toast('⚠️ Name update requires re-authentication', { duration: 3000 });
    }
    
    setIsEditing(false);
  } catch (error) {
    console.error('Error updating profile:', error);
    toast.error('Failed to update profile');
  }
};

  const getOrderStatusBadge = (status: string) => {
    const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
      pending: { color: 'bg-yellow-50 text-yellow-600 border-yellow-200', icon: <Clock size={10} />, label: 'Pending' },
      confirmed: { color: 'bg-blue-50 text-blue-600 border-blue-200', icon: <CheckCircle size={10} />, label: 'Confirmed' },
      processing: { color: 'bg-purple-50 text-purple-600 border-purple-200', icon: <AlertCircle size={10} />, label: 'Processing' },
      shipped: { color: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: <Package size={10} />, label: 'Shipped' },
      delivered: { color: 'bg-green-50 text-green-600 border-green-200', icon: <CheckCircle size={10} />, label: 'Delivered' },
      cancelled: { color: 'bg-red-50 text-red-600 border-red-200', icon: <XCircle size={10} />, label: 'Cancelled' },
    };
    return statusConfig[status] || statusConfig.pending;
  };

  const getTokenStatusBadge = (status: string) => {
    switch(status) {
      case TokenStatus.ACTIVE:
        return { color: 'bg-green-50 text-green-600 border-green-200', label: 'ACTIVE' };
      case TokenStatus.PENDING:
        return { color: 'bg-yellow-50 text-yellow-600 border-yellow-200', label: 'PENDING VERIFICATION' };
      case TokenStatus.WINNER:
        return { color: 'bg-brand-gold/20 text-brand-gold border-brand-gold', label: 'WINNER 🏆' };
      case TokenStatus.EXPIRED:
        return { color: 'bg-gray-50 text-gray-500 border-gray-200', label: 'EXPIRED' };
      default:
        return { color: 'bg-gray-50 text-gray-500 border-gray-200', label: status };
    }
  };

  if (!user) return null;

  return (
    <div className="bg-brand-cream min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar - Mobile Optimized */}
          <aside className="lg:w-1/3 xl:w-1/4">
             <div className="bg-white rounded-2xl p-6 shadow-sm border border-brand-beige sticky top-24 space-y-6">
                {/* Profile Avatar */}
                <div className="text-center space-y-3">
                   <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto">
                      {user.photoURL ? (
                        <img src={user.photoURL} alt={user.displayName || 'User'} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        <User size={32} className="text-brand-gold" />
                      )}
                   </div>
                   <div>
                      {isEditing ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full text-center border border-brand-beige rounded-lg py-1 px-2 text-sm focus:outline-none focus:border-brand-gold"
                            placeholder="Your name"
                          />
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full text-center border border-brand-beige rounded-lg py-1 px-2 text-sm focus:outline-none focus:border-brand-gold"
                            placeholder="Phone number"
                          />
                          <div className="flex gap-2 justify-center pt-2">
                            <button onClick={handleUpdateProfile} className="p-1.5 bg-brand-gold text-black rounded-lg">
                              <Save size={14} />
                            </button>
                            <button onClick={() => setIsEditing(false)} className="p-1.5 bg-gray-200 rounded-lg">
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h2 className="font-serif text-xl md:text-2xl">{user.displayName || 'UFR Member'}</h2>
                          <p className="text-[10px] md:text-xs text-brand-grey mt-1">{user.email}</p>
                          {editPhone && <p className="text-[10px] text-brand-grey">{editPhone}</p>}
                          <button 
                            onClick={() => setIsEditing(true)}
                            className="text-[9px] text-brand-gold hover:underline mt-2 flex items-center gap-1 mx-auto"
                          >
                            <Edit2 size={10} /> Edit Profile
                          </button>
                        </div>
                      )}
                   </div>
                   {isAdmin && (
                     <Link to="/admin" className="inline-flex items-center gap-2 bg-brand-gold/10 text-brand-gold px-3 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-wider border border-brand-gold/20">
                       <LayoutDashboard size={12} />
                       Admin Panel
                     </Link>
                   )}
                </div>

                {/* Navigation Menu */}
                <nav className="flex flex-col gap-1">
                   <button className="flex items-center gap-3 p-3 rounded-xl bg-brand-cream text-brand-gold font-bold text-[10px] uppercase tracking-wider transition-all">
                      <User size={16} />
                      My Profile
                   </button>
                   <button 
                    onClick={() => {
                        const el = document.getElementById('lucky-draw-section');
                        el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex items-center gap-3 p-3 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-[10px] uppercase tracking-wider font-bold"
                   >
                       <Ticket size={16} />
                       Lucky Draw Tokens ({tokens.length})
                   </button>
                   <Link to="/track-order" className="flex items-center gap-3 p-3 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-[10px] uppercase tracking-wider font-bold">
                      <Package size={16} />
                      Track Orders
                   </Link>
                   <Link to="/wishlist" className="flex items-center gap-3 p-3 rounded-xl text-brand-grey hover:bg-brand-cream hover:text-brand-gold transition-all text-[10px] uppercase tracking-wider font-bold">
                      <Heart size={16} />
                      Wishlist
                   </Link>
                   <button onClick={handleLogout} className="flex items-center gap-3 p-3 rounded-xl text-red-500 hover:bg-red-50 transition-all text-[10px] uppercase tracking-wider font-bold">
                      <LogOut size={16} />
                      Logout
                   </button>
                </nav>
             </div>
          </aside>

          {/* Main Content */}
          <div className="lg:w-2/3 xl:w-3/4 space-y-8">
             
             {/* Lucky Draw Section */}
             <div id="lucky-draw-section" className="bg-gradient-to-br from-brand-black to-[#2a2a2a] text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Trophy size={100} />
                </div>
                
                <div className="relative z-10 space-y-6">
                   <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <h3 className="font-serif text-2xl md:text-3xl text-brand-gold">Lucky Draw Tokens</h3>
                        <p className="text-white/50 text-xs">Advance payment entries for exclusive prizes</p>
                      </div>
                      {config?.drawDate && timeLeft !== 'DRAW COMPLETED' && (
                        <div className="bg-white/10 px-4 py-2 rounded-full border border-white/20">
                           <p className="text-[8px] uppercase tracking-wider text-brand-gold mb-0.5">Next Draw</p>
                           <p className="text-sm font-mono font-bold flex items-center gap-1">
                              <Clock size={12} className="text-brand-gold" />
                              {timeLeft}
                           </p>
                        </div>
                      )}
                   </div>

                   {loading ? (
                     <div className="py-8 text-center text-white/40">Loading your entries...</div>
                   ) : tokens.length > 0 ? (
                     <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
                        {tokens.map((token) => {
                          const statusStyle = getTokenStatusBadge(token.status);
                          return (
                            <motion.div 
                              key={token.id}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              className={cn(
                                "p-4 rounded-xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3",
                                token.status === TokenStatus.WINNER 
                                  ? "bg-brand-gold/20 border-brand-gold shadow-[0_0_15px_rgba(212,175,55,0.2)]" 
                                  : token.status === TokenStatus.PENDING
                                  ? "bg-yellow-500/10 border-yellow-500/30"
                                  : "bg-white/5 border-white/10"
                              )}
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Ticket size={14} className={token.status === TokenStatus.WINNER ? "text-brand-gold" : "text-white/40"} />
                                  <p className="text-base font-mono font-bold tracking-wider">{token.tokenNumber}</p>
                                </div>
                                <p className="text-[9px] text-white/40">Order: {token.orderId}</p>
                                {token.status === TokenStatus.PENDING && (
                                  <p className="text-[8px] text-yellow-400 flex items-center gap-1">
                                    <AlertCircle size={8} /> Awaiting payment verification
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <span className={cn(
                                  "text-[8px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border",
                                  statusStyle.color
                                )}>
                                  {statusStyle.label}
                                </span>
                                {token.prize && (
                                  <p className="text-[10px] text-brand-gold font-bold mt-1 flex items-center gap-1">
                                    <Trophy size={10} /> {token.prize}
                                  </p>
                                )}
                              </div>
                            </motion.div>
                          );
                        })}
                     </div>
                   ) : (
                     <div className="py-8 border border-dashed border-white/10 rounded-xl text-center space-y-3">
                        <Ticket size={32} className="mx-auto text-white/20" />
                        <p className="text-white/40 text-xs">No tokens yet</p>
                        <Link to="/shop" className="inline-block text-brand-gold text-[9px] uppercase tracking-wider font-bold border-b border-brand-gold/30 pb-0.5 hover:border-brand-gold transition-all">
                          Pay via JazzCash/EasyPaisa to earn tokens
                        </Link>
                     </div>
                   )}

                   {/* Prize Information */}
                   {config && (
                     <div className="border-t border-white/10 pt-4 mt-2">
                       <p className="text-[8px] text-white/40 uppercase tracking-wider mb-2 flex items-center gap-1">
                         <Trophy size={10} /> GRAND PRIZES
                       </p>
                       <div className="flex flex-wrap gap-3 text-[9px]">
                         <span className="text-brand-gold">🏆 iPhone 17</span>
                         <span className="text-white/30">•</span>
                         <span className="text-brand-gold">🚗 Honda 70</span>
                         <span className="text-white/30">•</span>
                         <span className="text-brand-gold">💰 Rs. 50,000 Cash</span>
                         <span className="text-white/30">•</span>
                         <span className="text-white/60">7 x Rs. 10,000</span>
                       </div>
                     </div>
                   )}
                </div>
             </div>

             {/* Order History Section */}
             <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-beige">
                <h3 className="font-serif text-2xl md:text-3xl mb-6 pb-4 border-b border-brand-beige flex items-center justify-between">
                  <span>Order History</span>
                  <span className="text-xs text-brand-grey font-sans">{orders.length} orders</span>
                </h3>
                
                {loading ? (
                  <div className="text-center py-12 animate-pulse text-brand-grey">Loading your orders...</div>
                ) : orders.length > 0 ? (
                  <div className="space-y-4">
                    {orders.map((order, idx) => {
                      const statusBadge = getOrderStatusBadge(order.status);
                      return (
                        <motion.div
                          key={order.id || idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-4 md:p-5 border border-brand-beige rounded-xl hover:shadow-md transition-all"
                        >
                          <div className="flex flex-col md:flex-row justify-between gap-4">
                            {/* Order Info */}
                            <div className="flex gap-4">
                              <div className="w-12 h-12 bg-brand-cream rounded-lg flex items-center justify-center shrink-0">
                                <Package size={20} className="text-brand-grey" />
                              </div>
                              <div>
                                <p className="text-[10px] font-bold uppercase tracking-wider text-brand-grey">Order ID</p>
                                <p className="text-sm font-mono font-medium">{order.orderId || order.id?.slice(0, 8)}</p>
                                <p className="text-[10px] text-brand-grey mt-1">
                                  {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Just now'}
                                </p>
                              </div>
                            </div>
                            
                            {/* Status & Amount */}
                            <div className="flex flex-wrap items-center gap-4">
                              <div className={cn(
                                "flex items-center gap-1.5 px-2 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider",
                                statusBadge.color
                              )}>
                                {statusBadge.icon}
                                {statusBadge.label}
                              </div>
                              <div className="text-right">
                                <p className="font-serif text-xl font-bold">{formatPrice(order.total)}</p>
                                <p className="text-[9px] uppercase text-brand-grey">{order.paymentMethod}</p>
                              </div>
                              <Link 
                                to={`/track-order?orderId=${order.orderId || order.id}`} 
                                className="p-2 bg-brand-cream rounded-full hover:bg-brand-gold hover:text-white transition-all"
                              >
                                <ChevronRight size={16} />
                              </Link>
                            </div>
                          </div>
                          
                          {/* Items Preview */}
                          <div className="mt-3 pt-3 border-t border-brand-beige/50">
                            <p className="text-[9px] text-brand-grey">
                              {order.items?.length || 0} item(s): {order.items?.map((i: any) => i.name).join(', ')?.slice(0, 60)}...
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-16 space-y-4">
                    <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto">
                       <Package size={24} className="text-brand-grey" />
                    </div>
                    <p className="text-brand-grey text-sm">No orders placed yet</p>
                    <Link to="/shop" className="inline-block bg-brand-black text-white px-6 py-2 rounded-full text-[10px] uppercase tracking-wider font-bold hover:bg-brand-gold hover:text-black transition">
                      Start Shopping
                    </Link>
                  </div>
                )}
             </div>

             {/* Account Stats Cards */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-5 border border-brand-beige">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-brand-cream rounded-full">
                        <MapPin size={16} className="text-brand-gold" />
                     </div>
                     <h4 className="font-serif text-base">Saved Addresses</h4>
                   </div>
                   <p className="text-xs text-brand-grey">
                     {editPhone ? `${editPhone} • ${user.email}` : 'Add your details in profile'}
                   </p>
                   <button 
                     onClick={() => setIsEditing(true)}
                     className="text-[9px] text-brand-gold hover:underline mt-2"
                   >
                     + Update Information
                   </button>
                </div>
                
                <div className="bg-white rounded-xl p-5 border border-brand-beige">
                   <div className="flex items-center gap-3 mb-3">
                     <div className="p-2 bg-brand-cream rounded-full">
                        <Calendar size={16} className="text-brand-gold" />
                     </div>
                     <h4 className="font-serif text-base">Member Since</h4>
                   </div>
                   <p className="text-xs text-brand-grey">
                     {user.metadata.creationTime 
                       ? new Date(user.metadata.creationTime).toLocaleDateString('en-PK', { year: 'numeric', month: 'long', day: 'numeric' })
                       : 'Recently Joined'}
                   </p>
                   <p className="text-[9px] text-brand-gold mt-1">✓ Verified Member</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;