import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, cn } from '../utils/cn';
import { motion } from 'motion/react';
import { ShieldCheck, Truck, CreditCard, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { db } from '../services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { emailService } from '../services/emailService';
import { luckyDrawService, TokenStatus } from '../services/luckyDrawService';

const Checkout = () => {
  const { cart, subtotal, deliveryCharges, total, paymentMethod, setPaymentMethod, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<string | null>(null);
  const [orderRef, setOrderRef] = useState<string>('');
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderId = `UFR-${Math.floor(Math.random() * 90000) + 10000}`;
      setOrderRef(orderId);
      
      const orderData = {
        userId: user?.uid || 'guest',
        customer: formData,
        items: cart,
        subtotal,
        deliveryCharges,
        total,
        paymentMethod,
        paymentStatus: (paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') ? 'pending_verification' : 'pending',
        trxId: formData.trxId || null,
        status: 'pending',
        createdAt: serverTimestamp(),
        orderId: orderId
      };

      try {
        await addDoc(collection(db, 'orders'), orderData);
        
        let activeToken = null;
        // Generate Lucky Draw Token if Advance Payment
        if ((paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && user?.uid) {
          activeToken = await luckyDrawService.generateToken(user.uid, orderId, TokenStatus.PENDING);
          if (activeToken) {
            setGeneratedToken(activeToken);
          }
        }

        // Send notifications
        emailService.sendOrderConfirmation({ ...orderData, luckyDrawToken: activeToken });
        emailService.sendAdminOrderAlert(orderData);
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'orders');
      }
      setOrderComplete(true);
      clearCart();
      toast.success('Order placed successfully!');
    } catch (error) {
      console.error(error);
      toast.error('Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-8 min-h-[70vh] flex flex-col items-center justify-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
        >
           <CheckCircle2 size={40} className="text-green-600" />
        </motion.div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif">Order Confirmed!</h1>
          <p className="text-brand-grey font-light">Thank you for shopping with UFR Collection. Your order is being processed.</p>
          <div className="pt-4 space-y-2">
            <p className="font-bold text-brand-black uppercase tracking-[0.2em]">Order Reference: {orderRef}</p>
            {generatedToken && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-gold/10 border border-brand-gold p-6 rounded-xl space-y-2 mt-6 max-w-md mx-auto"
              >
                <p className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Lucky Draw Selection</p>
                <p className="text-2xl font-serif font-bold text-brand-black">{generatedToken}</p>
                <p className="text-[10px] text-brand-grey font-medium uppercase tracking-wider italic">
                   Token state: <span className="text-brand-gold font-bold">Awaiting Verification</span>
                </p>
                <p className="text-[8px] text-brand-grey mt-2">Our archive team will verify your TrxID. Stay poised for the draw.</p>
              </motion.div>
            )}
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/shop')}
            className="bg-brand-black text-white px-10 py-4 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-gold transition-all"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => navigate('/track-order')}
            className="border border-brand-black text-brand-black px-10 py-4 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-black hover:text-white transition-all"
          >
            Track Order
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-cream min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4">
        <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-16">
          {/* Checkout Form */}
          <div className="lg:w-2/3 space-y-12">
            <div className="space-y-8">
               <h2 className="text-3xl font-serif">Customer Information</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">First Name *</label>
                    <input required name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Last Name *</label>
                    <input required name="lastName" value={formData.lastName} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Email Address *</label>
                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Phone Number *</label>
                    <input required type="tel" placeholder="+92 XXX XXXXXXX" name="phone" value={formData.phone} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
               </div>
            </div>

            <div className="space-y-8">
               <h2 className="text-3xl font-serif">Delivery Address</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Street Address *</label>
                    <input required name="address" value={formData.address} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">City *</label>
                    <select required name="city" value={formData.city} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold appearance-none">
                       {cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Province *</label>
                    <select required name="province" value={formData.province} onChange={handleInputChange} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold appearance-none">
                       <option value="Sindh">Sindh</option>
                       <option value="Punjab">Punjab</option>
                       <option value="KPK">Khyber Pakhtunkhwa</option>
                       <option value="Balochistan">Balochistan</option>
                       <option value="ICT">Islamabad Capital Territory</option>
                    </select>
                 </div>
                 <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Order Notes (Optional)</label>
                    <textarea name="notes" value={formData.notes} onChange={handleInputChange} rows={3} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                 </div>
               </div>
            </div>

            <div className="space-y-8">
               <h2 className="text-3xl font-serif">Payment Method</h2>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                 <button
                   type="button"
                   onClick={() => setPaymentMethod('cod')}
                   className={cn(
                     "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all text-center",
                     paymentMethod === 'cod' ? "bg-white border-brand-gold shadow-lg" : "bg-white/50 border-brand-beige hover:border-brand-gold"
                   )}
                 >
                   <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'cod' ? "border-brand-gold" : "border-brand-beige")}>
                      {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm font-bold uppercase tracking-widest">Cash on Delivery</p>
                      <p className="text-[10px] text-brand-grey font-light mt-1">Pay when you receive</p>
                   </div>
                 </button>

                 <button
                   type="button"
                   onClick={() => setPaymentMethod('jazzcash')}
                   className={cn(
                     "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all text-center",
                     paymentMethod === 'jazzcash' ? "bg-white border-brand-gold shadow-lg" : "bg-white/50 border-brand-beige hover:border-brand-gold"
                   )}
                 >
                   <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'jazzcash' ? "border-brand-gold" : "border-brand-beige")}>
                      {paymentMethod === 'jazzcash' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm font-bold uppercase tracking-widest">JazzCash</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1">FREE DELIVERY + TOKEN</p>
                   </div>
                 </button>

                 <button
                   type="button"
                   onClick={() => setPaymentMethod('easypaisa')}
                   className={cn(
                     "flex flex-col items-center gap-4 p-6 rounded-xl border-2 transition-all text-center",
                     paymentMethod === 'easypaisa' ? "bg-white border-brand-gold shadow-lg" : "bg-white/50 border-brand-beige hover:border-brand-gold"
                   )}
                 >
                   <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", paymentMethod === 'easypaisa' ? "border-brand-gold" : "border-brand-beige")}>
                      {paymentMethod === 'easypaisa' && <div className="w-2.5 h-2.5 bg-brand-gold rounded-full" />}
                   </div>
                   <div className="flex-grow">
                      <p className="text-sm font-bold uppercase tracking-widest">EasyPaisa</p>
                      <p className="text-[10px] text-green-600 font-bold mt-1">FREE DELIVERY + TOKEN</p>
                   </div>
                 </button>
               </div>

               {/* Advance Payment Details */}
               {(paymentMethod === 'jazzcash' || paymentMethod === 'easypaisa') && (
                 <motion.div 
                   initial={{ opacity: 0, height: 0 }}
                   animate={{ opacity: 1, height: 'auto' }}
                   className="bg-white p-8 rounded-xl border border-brand-gold space-y-6"
                 >
                    <div className="space-y-4">
                       <h3 className="text-lg font-serif">Advance Payment Instructions</h3>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="p-4 bg-brand-cream rounded-lg border border-brand-beige">
                             <p className="text-[10px] uppercase font-bold text-brand-grey mb-1">JazzCash Number</p>
                             <p className="font-mono text-lg font-bold">0300-1234567</p>
                             <p className="text-[8px] text-brand-grey">Account Name: UFR COLLECTION</p>
                          </div>
                          <div className="p-4 bg-brand-cream rounded-lg border border-brand-beige">
                             <p className="text-[10px] uppercase font-bold text-brand-grey mb-1">EasyPaisa Number</p>
                             <p className="font-mono text-lg font-bold">0345-1234567</p>
                             <p className="text-[8px] text-brand-grey">Account Name: UFR COLLECTION</p>
                          </div>
                       </div>
                       <p className="text-[10px] text-brand-grey leading-relaxed">
                          Please transfer the total amount to the respective account above. Once transferred, enter your Transaction ID (TrxID) below for verification. Your Lucky Draw Token will be activated once payment is verified.
                       </p>
                    </div>

                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-brand-gold">Transaction ID (TrxID) *</label>
                       <input 
                        required 
                        name="trxId" 
                        value={formData.trxId} 
                        onChange={handleInputChange} 
                        placeholder="Enter unique transaction code"
                        className="w-full bg-brand-cream border border-brand-gold rounded-lg py-3 px-4 focus:outline-none" 
                       />
                    </div>
                 </motion.div>
               )}
            </div>
          </div>

          {/* Sidebar Summary */}
          <div className="lg:w-1/3">
             <div className="bg-white p-10 rounded-luxury-lg luxury-shadow space-y-8 sticky top-32 border border-brand-beige">
                <h3 className="font-serif text-2xl border-b border-brand-beige pb-4">Order Summary</h3>

                <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-brand-beige">
                  {cart.map(item => (
                    <div key={`${item.id}-${item.size}`} className="flex gap-4">
                       <div className="w-16 aspect-[3/4] rounded-lg overflow-hidden bg-brand-beige shrink-0">
                         <img src={item.image || undefined} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-grow flex flex-col justify-center">
                          <p className="text-xs font-serif font-bold">{item.name}</p>
                          <p className="text-[10px] text-brand-grey">{item.quantity} x {item.size} • {item.color}</p>
                          <p className="text-[10px] font-bold mt-1">{formatPrice((item.salePrice || item.price) * item.quantity)}</p>
                       </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 pt-6 border-t border-brand-beige">
                   <div className="flex justify-between text-sm">
                      <span className="text-brand-grey font-light">Subtotal</span>
                      <span className="font-bold">{formatPrice(subtotal)}</span>
                   </div>
                   <div className="flex justify-between text-sm">
                      <span className="text-brand-grey font-light">Delivery</span>
                      <span className={cn("font-bold", deliveryCharges === 0 ? "text-green-600" : "")}>
                        {deliveryCharges === 0 ? "FREE" : formatPrice(deliveryCharges)}
                      </span>
                   </div>
                   <div className="flex justify-between items-baseline pt-4 border-t border-brand-beige">
                      <span className="font-serif text-lg">Total</span>
                      <span className="text-2xl font-serif font-bold text-brand-gold">{formatPrice(total)}</span>
                   </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand-black text-white py-5 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-gold transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? "Processing..." : "Place Order Now"}
                  <ChevronRight size={18} />
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-brand-grey uppercase tracking-widest font-bold">
                   <ShieldCheck size={14} className="text-green-600" />
                   Secure Checkout Verified
                </div>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Checkout;
