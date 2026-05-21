import React, { useState } from 'react';
import { Search, Package, MapPin, Truck, CheckCircle2, SearchX, Clock, Calendar, Phone, Mail, DollarSign, CreditCard } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatPrice } from '../utils/cn';
import { Link } from 'react-router-dom';

const OrderTracking = () => {
  const [orderId, setOrderId] = useState('');
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    
    setLoading(true);
    setSearched(true);
    setOrder(null);
    
    try {
      const q = query(collection(db, 'orders'), where('orderId', '==', orderId.trim().toUpperCase()));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        setOrder({ id: doc.id, ...doc.data() });
      } else {
        setOrder(null);
      }
    } catch (error) {
      console.error('Error fetching order:', error);
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    { key: 'pending', label: 'Order Placed', icon: Clock, color: 'text-yellow-500' },
    { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2, color: 'text-blue-500' },
    { key: 'processing', label: 'Processing', icon: Package, color: 'text-purple-500' },
    { key: 'shipped', label: 'Shipped', icon: Truck, color: 'text-indigo-500' },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle2, color: 'text-green-500' }
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(s => s.key === order?.status);
    return index === -1 ? 0 : index;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
      processing: 'bg-purple-100 text-purple-700 border-purple-200',
      shipped: 'bg-indigo-100 text-indigo-700 border-indigo-200',
      delivered: 'bg-green-100 text-green-700 border-green-200',
      cancelled: 'bg-red-100 text-red-700 border-red-200'
    };
    return colors[status] || colors.pending;
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercent = (currentStepIndex / (steps.length - 1)) * 100;

  return (
    <div className="bg-brand-cream min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
          <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px]">Real-Time Updates</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif">Track Your Order</h1>
          <p className="text-brand-grey text-[10px] md:text-xs uppercase tracking-wider">Enter your order ID to track your shipment</p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="max-w-xl mx-auto relative mb-12 md:mb-20">
          <input
            required
            type="text"
            placeholder="Enter Order ID (e.g., UFR-12345)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full bg-white border border-brand-beige rounded-full py-4 md:py-5 pl-5 md:pl-8 pr-28 md:pr-36 text-sm focus:outline-none focus:border-brand-gold shadow-sm tracking-wider"
          />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-1.5 top-1.5 bottom-1.5 bg-brand-black text-white px-5 md:px-8 rounded-full text-[9px] md:text-[10px] uppercase tracking-wider font-bold hover:bg-brand-gold hover:text-black transition-all disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Search</span>
              </div>
            ) : (
              'Track Order'
            )}
          </button>
        </form>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-20 flex flex-col items-center gap-4"
            >
              <div className="w-10 h-10 md:w-12 md:h-12 border-3 border-brand-beige border-t-brand-gold rounded-full animate-spin" />
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-grey">Searching boutique archives...</p>
            </motion.div>
          ) : order ? (
            <motion.div
              key="order"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6 md:space-y-8"
            >
              {/* Order Header Card */}
              <div className="bg-white rounded-2xl p-5 md:p-8 shadow-sm border border-brand-beige">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 md:pb-6 border-b border-brand-beige">
                  <div>
                    <p className="text-[9px] md:text-[10px] text-brand-grey uppercase tracking-wider">Order ID</p>
                    <h2 className="text-xl md:text-2xl font-mono font-bold tracking-wider">{order.orderId}</h2>
                  </div>
                  <div className={cn(
                    "px-3 md:px-4 py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] font-bold uppercase tracking-wider border",
                    getStatusColor(order.status)
                  )}>
                    {order.status?.toUpperCase() || 'PENDING'}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 md:pt-6">
                  <div className="text-center">
                    <Calendar size={16} className="mx-auto mb-1 text-brand-gold" />
                    <p className="text-[8px] md:text-[9px] text-brand-grey">Order Date</p>
                    <p className="text-[10px] md:text-xs font-medium">
                      {order.createdAt?.toDate?.()?.toLocaleDateString() || 'Processing'}
                    </p>
                  </div>
                  <div className="text-center">
                    <Package size={16} className="mx-auto mb-1 text-brand-gold" />
                    <p className="text-[8px] md:text-[9px] text-brand-grey">Items</p>
                    <p className="text-[10px] md:text-xs font-medium">{order.items?.length || 0} products</p>
                  </div>
                  <div className="text-center">
                    <DollarSign size={16} className="mx-auto mb-1 text-brand-gold" />
                    <p className="text-[8px] md:text-[9px] text-brand-grey">Total Amount</p>
                    <p className="text-[10px] md:text-xs font-medium">{formatPrice(order.total)}</p>
                  </div>
                  <div className="text-center">
                    <CreditCard size={16} className="mx-auto mb-1 text-brand-gold" />
                    <p className="text-[8px] md:text-[9px] text-brand-grey">Payment</p>
                    <p className="text-[10px] md:text-xs font-medium uppercase">{order.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Timeline Progress */}
              <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-beige">
                <h3 className="text-sm md:text-base font-serif mb-6 md:mb-8">Order Progress</h3>
                
                {/* Progress Bar */}
                <div className="relative mb-8 md:mb-12">
                  <div className="h-1.5 bg-brand-beige rounded-full">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-brand-gold rounded-full"
                    />
                  </div>
                  
                  {/* Step Markers */}
                  <div className="flex justify-between mt-2">
                    {steps.map((step, index) => {
                      const Icon = step.icon;
                      const isActive = index <= currentStepIndex;
                      const isCurrent = index === currentStepIndex;
                      
                      return (
                        <div key={step.key} className="flex flex-col items-center -mt-2">
                          <div className={cn(
                            "w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 bg-white transition-all",
                            isActive ? "border-brand-gold" : "border-brand-beige",
                            isCurrent ? "shadow-md" : ""
                          )}>
                            <Icon size={14} className={cn(isActive ? "text-brand-gold" : "text-brand-grey")} />
                          </div>
                          <p className={cn(
                            "text-[7px] md:text-[8px] uppercase font-bold mt-1 text-center",
                            isActive ? "text-brand-black" : "text-brand-grey"
                          )}>
                            {step.label}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Current Status Message */}
                <div className="bg-brand-cream rounded-xl p-4 md:p-6 mt-4">
                  <p className="text-[10px] md:text-xs text-brand-gold font-bold uppercase tracking-wider mb-1">Current Status</p>
                  <p className="text-sm md:text-base text-brand-black font-medium">
                    {order.status === 'pending' && 'Your order has been received and is awaiting confirmation.'}
                    {order.status === 'confirmed' && 'Your order has been confirmed and will be processed soon.'}
                    {order.status === 'processing' && 'Your order is being carefully packed and prepared for shipment.'}
                    {order.status === 'shipped' && 'Your order has been dispatched and is on its way to you.'}
                    {order.status === 'delivered' && 'Your order has been delivered. Enjoy your luxury pieces!'}
                  </p>
                </div>
              </div>

              {/* Customer & Shipping Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                {/* Shipping Address */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-brand-beige">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin size={18} className="text-brand-gold" />
                    <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Shipping Address</h4>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium">{order.customer?.firstName} {order.customer?.lastName}</p>
                    <p className="text-brand-grey text-xs">{order.customer?.address}</p>
                    <p className="text-brand-grey text-xs">{order.customer?.city}, {order.customer?.province}</p>
                    <p className="text-brand-grey text-xs mt-2 flex items-center gap-1">
                      <Phone size={12} /> {order.customer?.phone}
                    </p>
                    <p className="text-brand-grey text-xs flex items-center gap-1">
                      <Mail size={12} /> {order.customer?.email}
                    </p>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-brand-beige">
                  <div className="flex items-center gap-2 mb-4">
                    <Package size={18} className="text-brand-gold" />
                    <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Order Summary</h4>
                  </div>
                  <div className="space-y-3">
                    {order.items?.slice(0, 3).map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-brand-grey">{item.quantity}x {item.name}</span>
                        <span className="font-medium">{formatPrice((item.salePrice || item.price) * item.quantity)}</span>
                      </div>
                    ))}
                    {order.items?.length > 3 && (
                      <p className="text-[10px] text-brand-grey">+ {order.items.length - 3} more items</p>
                    )}
                    <div className="border-t border-brand-beige pt-3 mt-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Total</span>
                        <span className="font-bold text-brand-gold">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Need Help? */}
              <div className="bg-brand-cream rounded-2xl p-5 md:p-6 text-center border border-brand-beige">
                <p className="text-xs text-brand-grey mb-3">Need assistance with your order?</p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <a 
                    href="https://wa.me/923001234567" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-gold hover:underline"
                  >
                    Contact WhatsApp Support
                  </a>
                  <span className="hidden sm:inline text-brand-beige">|</span>
                  <Link 
                    to="/contact" 
                    className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-wider text-brand-gold hover:underline"
                  >
                    Email Us
                  </Link>
                </div>
              </div>
            </motion.div>
          ) : searched ? (
            <motion.div
              key="not-found"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-center py-16 md:py-20 space-y-5 md:space-y-6"
            >
              <div className="w-16 h-16 md:w-20 md:h-20 bg-brand-beige rounded-full flex items-center justify-center mx-auto">
                <SearchX size={28} className="text-brand-grey" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl md:text-2xl font-serif">Order Not Found</h3>
                <p className="text-brand-grey text-xs md:text-sm max-w-sm mx-auto">
                  We couldn't locate an order with ID <span className="font-bold text-brand-black">{orderId}</span>
                </p>
                <p className="text-[10px] text-brand-grey mt-2">Please verify your order ID and try again.</p>
              </div>
              <button
                onClick={() => setOrderId('')}
                className="mt-4 text-brand-gold text-[10px] uppercase tracking-wider font-bold hover:underline"
              >
                Try Another ID
              </button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OrderTracking;