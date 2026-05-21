// @ts-nocheck
import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, cn } from '../utils/cn';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { emailService } from '../services/emailService';
import { luckyDrawService, TokenStatus } from '../services/luckyDrawService';

// Define proper type for payment method
type PaymentMethodType = 'cod' | 'jazzcash' | 'easypaisa';

const Checkout = () => {
  const { cart, subtotal, deliveryCharges, total, paymentMethod, setPaymentMethod, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: 'Karachi',
    province: 'Sindh',
    notes: '',
    trxId: ''
  });

  const cities = ['Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan', 'Peshawar', 'Quetta', 'Sialkot', 'Gujranwala'];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: '' });
    }
  };

  const isAdvancePayment = (method: string): boolean => {
    return method === 'jazzcash' || method === 'easypaisa';
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (formData.phone.length < 10) newErrors.phone = 'Valid phone number required';
    if (!formData.address.trim()) newErrors.address = 'Address is required';
    
    if (isAdvancePayment(paymentMethod) && !formData.trxId.trim()) {
      newErrors.trxId = 'Transaction ID is required for advance payment';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill all required fields');
      return;
    }
    
    if (cart.length === 0) {
      toast.error('Your cart is empty');
      navigate('/shop');
      return;
    }
    
    setLoading(true);

    try {
      const orderId = `UFR-${Math.floor(Math.random() * 90000) + 10000}`;
      setOrderRef(orderId);
      
      const orderData = {
        userId: user?.uid || 'guest',
        customer: formData,
        items: cart.map((item: any) => ({
          id: item.id,
          name: item.name,
          price: item.salePrice || item.price,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          image: item.image
        })),
        subtotal,
        deliveryCharges,
        total,
        paymentMethod,
        paymentStatus: isAdvancePayment(paymentMethod) ? 'pending_verification' : 'pending',
        trxId: formData.trxId || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        orderId: orderId
      };

      await addDoc(collection(db, 'orders'), orderData);
      
      let activeToken = null;
      if (isAdvancePayment(paymentMethod) && user?.uid) {
        activeToken = await luckyDrawService.generateToken(user.uid, orderId, TokenStatus.PENDING);
        if (activeToken) {
          setGeneratedToken(activeToken);
          toast.success('🎫 Lucky Draw Token Generated!');
        }
      }

      try {
        await emailService.sendOrderConfirmation({ ...orderData, luckyDrawToken: activeToken });
        await emailService.sendAdminOrderAlert(orderData);
      } catch (emailErr) {
        console.log('Email notification skipped (service not configured)');
      }
      
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
      
    } catch (error) {
      console.error('Order placement error:', error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle payment method change safely
  const handleSetPaymentMethod = (method: string) => {
    setPaymentMethod(method as any);
  };

  // Redirect if cart is empty
  if (cart.length === 0 && !orderComplete) {
    return (
      <div className="container mx-auto px-4 py-32 text-center min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle size={40} className="text-brand-gold" />
        </div>
        <h1 className="text-2xl md:text-3xl font-serif mb-3">Your Cart is Empty</h1>
        <p className="text-brand-grey mb-8">Add some beautiful pieces to your cart before checkout.</p>
        <button
          onClick={() => navigate('/shop')}
          className="bg-brand-black text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-gold transition-all"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-8 min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
           <CheckCircle2 size={48} className="text-green-600" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-serif">Order Confirmed! 🎉</h1>
          <p className="text-brand-grey font-light max-w-md mx-auto">
            Thank you for shopping with UFR Collection. Your order is being processed.
          </p>
          <div className="pt-4 space-y-3">
            <p className="font-bold text-brand-black uppercase tracking-[0.2em] text-sm">
              Order Reference: <span className="text-brand-gold">{orderRef}</span>
            </p>
            {generatedToken && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-gold/10 border border-brand-gold p-6 rounded-2xl space-y-3 mt-8 max-w-md mx-auto"
              >
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">🎁 Lucky Draw Token Generated!</p>
                <p className="text-2xl font-serif font-bold text-brand-black tracking-wider">{generatedToken}</p>
                <p className="text-[10px] text-brand-grey font-medium">
                  Token Status: <span className="text-brand-gold font-bold">Active</span>
                </p>
                <p className="text-[9px] text-brand-grey mt-2">
                  Your token is automatically entered into the next lucky draw. 
                  Winners will be announced on our website and contacted via WhatsApp.
                </p>
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 pt-6">
          <button
            onClick={() => navigate('/shop')}
            className="bg-brand-black text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-gold transition-all"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate(`/track-order?orderId=${orderRef}`)}
            className="border border-brand-black text-brand-black px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-black hover:text-white transition-all"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen py-12 md:py-20">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-8 md:mb-12">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center text-xs font-bold">1</div>
            <span className="ml-2 text-xs md:text-sm font-medium">Cart</span>
          </div>
          <div className="w-12 md:w-16 h-px bg-brand-gold" />
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-brand-gold text-black flex items-center justify-center text-xs font-bold">2</div>
            <span className="ml-2 text-xs md:text-sm font-medium">Information</span>
          </div>
          <div className="w-12 md:w-16 h-px bg-brand-beige" />
          <div className="flex items-center opacity-50">
            <div className="w-8 h-8 rounded-full bg-brand-beige text-brand-grey flex items-center justify-center text-xs font-bold">3</div>
            <span className="ml-2 text-xs md:text-sm text-brand-grey">Payment</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column - Forms */}
          <div className="lg:w-2/3 space-y-8">
            {/* Customer Information */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-beige">
              <h2 className="text-xl md:text-2xl font-serif mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-gold text-black text-xs flex items-center justify-center">1</span>
                Customer Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    name="firstName" 
                    value={formData.firstName} 
                    onChange={handleInputChange} 
                    className={cn(
                      "w-full bg-brand-cream/30 border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold transition-colors",
                      errors.firstName ? "border-red-500" : "border-brand-beige"
                    )} 
                  />
                  {errors.firstName && <p className="text-red-500 text-[10px]">{errors.firstName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    name="lastName" 
                    value={formData.lastName} 
                    onChange={handleInputChange} 
                    className={cn(
                      "w-full bg-brand-cream/30 border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold",
                      errors.lastName ? "border-red-500" : "border-brand-beige"
                    )} 
                  />
                  {errors.lastName && <p className="text-red-500 text-[10px]">{errors.lastName}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="email" 
                    name="email" 
                    value={formData.email} 
                    onChange={handleInputChange} 
                    className={cn(
                      "w-full bg-brand-cream/30 border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold",
                      errors.email ? "border-red-500" : "border-brand-beige"
                    )} 
                  />
                  {errors.email && <p className="text-red-500 text-[10px]">{errors.email}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    type="tel" 
                    placeholder="03XX XXXXXXX" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className={cn(
                      "w-full bg-brand-cream/30 border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold",
                      errors.phone ? "border-red-500" : "border-brand-beige"
                    )} 
                  />
                  {errors.phone && <p className="text-red-500 text-[10px]">{errors.phone}</p>}
                </div>
              </div>
            </div>

            {/* Delivery Address */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-beige">
              <h2 className="text-xl md:text-2xl font-serif mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-gold text-black text-xs flex items-center justify-center">2</span>
                Delivery Address
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                    Street Address <span className="text-red-500">*</span>
                  </label>
                  <input 
                    required 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    className={cn(
                      "w-full bg-brand-cream/30 border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold",
                      errors.address ? "border-red-500" : "border-brand-beige"
                    )} 
                  />
                  {errors.address && <p className="text-red-500 text-[10px]">{errors.address}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">City *</label>
                  <select 
                    required 
                    name="city" 
                    value={formData.city} 
                    onChange={handleInputChange} 
                    className="w-full bg-brand-cream/30 border border-brand-beige rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold appearance-none"
                  >
                    {cities.map(city => <option key={city} value={city}>{city}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Province *</label>
                  <select 
                    required 
                    name="province" 
                    value={formData.province} 
                    onChange={handleInputChange} 
                    className="w-full bg-brand-cream/30 border border-brand-beige rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold appearance-none"
                  >
                    <option value="Sindh">Sindh</option>
                    <option value="Punjab">Punjab</option>
                    <option value="KPK">Khyber Pakhtunkhwa</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="ICT">Islamabad Capital Territory</option>
                  </select>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Order Notes (Optional)</label>
                  <textarea 
                    name="notes" 
                    value={formData.notes} 
                    onChange={handleInputChange} 
                    rows={3} 
                    className="w-full bg-brand-cream/30 border border-brand-beige rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold resize-none" 
                    placeholder="Any special instructions for delivery?"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-brand-beige">
              <h2 className="text-xl md:text-2xl font-serif mb-6 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-brand-gold text-black text-xs flex items-center justify-center">3</span>
                Payment Method
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <button
                  type="button"
                  onClick={() => handleSetPaymentMethod('cod')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center",
                    paymentMethod === 'cod' ? "bg-brand-gold/10 border-brand-gold shadow-md" : "bg-white border-brand-beige hover:border-brand-gold"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'cod' ? "border-brand-gold" : "border-brand-beige")}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">Cash on Delivery</p>
                    <p className="text-[10px] text-brand-grey mt-1">Pay when you receive</p>
                    <p className="text-[10px] text-red-500 mt-2">+Rs. 180 delivery</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetPaymentMethod('jazzcash')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center",
                    paymentMethod === 'jazzcash' ? "bg-brand-gold/10 border-brand-gold shadow-md" : "bg-white border-brand-beige hover:border-brand-gold"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'jazzcash' ? "border-brand-gold" : "border-brand-beige")}>
                    {paymentMethod === 'jazzcash' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">JazzCash</p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">✓ FREE Delivery</p>
                    <p className="text-[10px] text-brand-gold font-bold">✓ Lucky Draw Token</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => handleSetPaymentMethod('easypaisa')}
                  className={cn(
                    "flex flex-col items-center gap-3 p-5 rounded-xl border-2 transition-all text-center",
                    paymentMethod === 'easypaisa' ? "bg-brand-gold/10 border-brand-gold shadow-md" : "bg-white border-brand-beige hover:border-brand-gold"
                  )}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'easypaisa' ? "border-brand-gold" : "border-brand-beige")}>
                    {paymentMethod === 'easypaisa' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-widest">EasyPaisa</p>
                    <p className="text-[10px] text-green-600 font-bold mt-1">✓ FREE Delivery</p>
                    <p className="text-[10px] text-brand-gold font-bold">✓ Lucky Draw Token</p>
                  </div>
                </button>
              </div>

              {/* Advance Payment Details */}
              {isAdvancePayment(paymentMethod) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-brand-cream/50 p-6 rounded-xl border border-brand-gold space-y-5"
                >
                  <div className="space-y-3">
                    <h3 className="font-serif text-lg flex items-center gap-2">
                      <CreditCard size={18} className="text-brand-gold" />
                      Advance Payment Instructions
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 bg-white rounded-lg border border-brand-beige">
                        <p className="text-[10px] uppercase font-bold text-brand-grey mb-1">JazzCash Account</p>
                        <p className="font-mono text-lg font-bold">0300 1234567</p>
                        <p className="text-[8px] text-brand-grey mt-1">Account: UFR COLLECTION</p>
                      </div>
                      <div className="p-4 bg-white rounded-lg border border-brand-beige">
                        <p className="text-[10px] uppercase font-bold text-brand-grey mb-1">EasyPaisa Account</p>
                        <p className="font-mono text-lg font-bold">0345 1234567</p>
                        <p className="text-[8px] text-brand-grey mt-1">Account: UFR COLLECTION</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-brand-grey leading-relaxed bg-white p-3 rounded-lg">
                      💡 Transfer the total amount to the account above. Enter your Transaction ID below. 
                      Your Lucky Draw Token will be activated after payment verification.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">
                      Transaction ID (TrxID) <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      name="trxId" 
                      value={formData.trxId} 
                      onChange={handleInputChange} 
                      placeholder="Enter transaction ID from your payment app"
                      className={cn(
                        "w-full bg-white border rounded-xl py-3 px-4 focus:outline-none focus:border-brand-gold",
                        errors.trxId ? "border-red-500" : "border-brand-beige"
                      )} 
                    />
                    {errors.trxId && <p className="text-red-500 text-[10px]">{errors.trxId}</p>}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:w-1/3">
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-md border border-brand-beige sticky top-24">
              <h3 className="font-serif text-xl md:text-2xl border-b border-brand-beige pb-4 mb-5">Order Summary</h3>

              {/* Cart Items */}
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2 mb-5">
                {cart.map((item: any, idx: number) => (
                  <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-3">
                    <div className="w-14 h-18 rounded-lg overflow-hidden bg-brand-cream shrink-0">
                      <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-xs font-serif font-bold line-clamp-1">{item.name}</p>
                      <p className="text-[9px] text-brand-grey">
                        {item.quantity} x {item.size} • {item.color}
                      </p>
                      <p className="text-[10px] font-bold mt-1">{formatPrice((item.salePrice || item.price) * item.quantity)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="space-y-3 pt-4 border-t border-brand-beige">
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey">Subtotal</span>
                  <span className="font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-brand-grey flex items-center gap-1">
                    <Truck size={12} /> Delivery
                  </span>
                  <span className={cn("font-medium", deliveryCharges === 0 ? "text-green-600" : "")}>
                    {deliveryCharges === 0 ? "FREE" : formatPrice(deliveryCharges)}
                  </span>
                </div>
                {deliveryCharges > 0 && (
                  <div className="bg-brand-cream p-3 rounded-lg">
                    <p className="text-[9px] text-brand-grey">
                      💡 Add 3+ items or pay via JazzCash/EasyPaisa for FREE delivery!
                    </p>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-4 border-t border-brand-beige">
                  <span className="font-serif text-lg font-semibold">Total</span>
                  <span className="text-2xl font-serif font-bold text-brand-gold">{formatPrice(total)}</span>
                </div>
              </div>

              {/* Place Order Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-black text-white py-4 mt-6 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-brand-gold hover:text-black transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </div>
                ) : (
                  <>Place Order Now <ChevronRight size={16} /></>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 mt-4 text-[9px] text-brand-grey uppercase tracking-widest">
                <ShieldCheck size={12} className="text-green-600" />
                Secure Checkout
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;