import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, SearchX, Clock, Calendar } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;
    setLoading(true);
    setSearched(true);
    const path = 'orders';
    try {
      const q = query(collection(db, path), where('orderId', '==', orderId.trim()));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        setOrder(querySnapshot.docs[0].data());
      } else {
        setOrder(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
    { key: 'processing', label: 'Processing', icon: Package },
    { key: 'shipped', label: 'Shipped', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
  ];

  const currentStepIndex = steps.findIndex(s => s.key === order?.status) || 0;

  return (
    <div className="bg-brand-cream min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16 space-y-4">
          <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px]">Real-Time Updates</p>
          <h1 className="text-4xl md:text-6xl font-serif">Track Your Journey</h1>
          <p className="text-brand-grey text-xs uppercase tracking-widest font-light">Enter your order ID found in your confirmation email</p>
        </div>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative mb-20">
           <input
             required
             type="text"
             placeholder="Enter Order ID (e.g. UFR-12345)"
             value={orderId}
             onChange={(e) => setOrderId(e.target.value)}
             className="w-full bg-white border border-brand-beige rounded-full py-6 pl-8 pr-32 text-sm focus:outline-none focus:border-brand-gold luxury-shadow tracking-widest font-bold"
           />
           <button
             type="submit"
             disabled={loading}
             className="absolute right-2 top-2 bottom-2 bg-brand-black text-white px-8 rounded-full text-[10px] uppercase tracking-widest font-bold hover:bg-brand-gold transition-all"
           >
             {loading ? "Searching..." : "Track Now"}
           </button>
        </form>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 flex flex-col items-center gap-4"
            >
              <div className="w-12 h-12 border-4 border-brand-beige border-t-brand-gold rounded-full animate-spin" />
              <p className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Accessing Boutique Database...</p>
            </motion.div>
          ) : order ? (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 md:p-12 rounded-luxury-lg luxury-shadow space-y-12"
            >
               <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-brand-beige pb-8">
                  <div className="space-y-1">
                     <p className="text-[10px] text-brand-grey uppercase tracking-widest">Tracking Status for</p>
                     <h2 className="text-2xl font-serif">{order.orderId}</h2>
                  </div>
                  <div className="text-right flex items-center gap-3">
                     <Calendar size={18} className="text-brand-gold" />
                     <div className="text-left md:text-right">
                        <p className="text-[10px] text-brand-grey uppercase font-bold tracking-widest">Order Placed</p>
                        <p className="text-xs font-bold">{order.createdAt?.toDate()?.toLocaleDateString()}</p>
                     </div>
                  </div>
               </div>

               {/* Visual Timeline */}
               <div className="relative pt-10 pb-6">
                  <div className="absolute top-10 left-0 w-full h-1 bg-brand-beige rounded-full">
                     <motion.div
                       initial={{ width: 0 }}
                       animate={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                       className="h-full bg-brand-gold rounded-full shadow-[0_0_10px_rgba(212,175,55,0.5)]"
                     />
                  </div>
                  <div className="flex justify-between relative">
                     {steps.map((step, index) => {
                       const Icon = step.icon;
                       const isActive = index <= currentStepIndex;
                       const isCurrent = index === currentStepIndex;

                       return (
                         <div key={step.key} className="flex flex-col items-center gap-4 relative">
                            <motion.div
                               animate={{
                                 scale: isCurrent ? 1.2 : 1,
                                 backgroundColor: isActive ? "#D4AF37" : "#F5F0E8"
                               }}
                               className={cn(
                                 "w-6 h-6 rounded-full border-4 border-white z-10 box-content",
                                 isActive ? "bg-brand-gold" : "bg-brand-beige"
                               )}
                            />
                            <div className="text-center space-y-1 w-20">
                               <Icon size={20} className={isActive ? "text-brand-gold mx-auto" : "text-brand-grey mx-auto opacity-30"} />
                               <p className={cn(
                                 "text-[8px] uppercase tracking-widest font-bold",
                                 isActive ? "text-brand-black" : "text-brand-grey opacity-50 font-light"
                               )}>
                                 {step.label}
                               </p>
                            </div>
                         </div>
                       );
                     })}
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-brand-beige">
                  <div className="space-y-4">
                     <h4 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                        <MapPin size={14} className="text-brand-gold" />
                        Shipping To
                     </h4>
                     <div className="text-sm font-light text-brand-grey">
                        <p className="font-bold text-brand-black">{order.customer.firstName} {order.customer.lastName}</p>
                        <p>{order.customer.address}</p>
                        <p>{order.customer.city}, {order.customer.province}</p>
                        <p className="mt-2 text-xs">{order.customer.phone}</p>
                     </div>
                  </div>
                  <div className="space-y-4">
                     <h4 className="text-[10px] uppercase tracking-widest font-bold flex items-center gap-2">
                        <Package size={14} className="text-brand-gold" />
                        Package Content
                     </h4>
                     <p className="text-sm font-light text-brand-grey">
                        {order.items.length} Premium Articles
                        {order.items.map((item: any) => (
                           <span key={item.id} className="block text-[10px] mt-1 italic">• {item.name} ({item.size})</span>
                        ))}
                     </p>
                  </div>
               </div>
            </motion.div>
          ) : searched ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20 space-y-6"
            >
              <div className="w-20 h-20 bg-brand-beige rounded-full flex items-center justify-center mx-auto opacity-30">
                 <SearchX size={32} />
              </div>
              <div className="space-y-2">
                 <h3 className="text-2xl font-serif">Order Not Found</h3>
                 <p className="text-brand-grey text-xs font-light">We couldn't locate an order with ID <span className="font-bold">{orderId}</span>. Please verify the ID and try again.</p>
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTracking;
