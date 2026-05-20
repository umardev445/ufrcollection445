import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { db } from '../../services/firebase';
import { collection, getDocs, updateDoc, doc, orderBy, query, where } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestore';
import { formatPrice, cn } from '../../utils/cn';
import { Clock, Truck, CheckCircle2, XCircle, Search, Filter, Eye, Printer, Mail, X, Phone, ShieldCheck, ShieldAlert, CreditCard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import { luckyDrawService, TokenStatus } from '../../services/luckyDrawService';
import { emailService } from '../../services/emailService';

const OrderManagement = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const [emailSent, setEmailSent] = useState<string | null>(null);

  const handlePrintInvoice = () => {
    if (!selectedOrder) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print invoices');
      return;
    }

    const invoiceContent = document.getElementById('printable-invoice')?.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(el => el.outerHTML)
      .join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${selectedOrder.orderId}</title>
          ${styles}
          <style>
            @media print {
              .no-print { display: none !important; }
              body { background: white !important; padding: 20px !important; }
              .bg-brand-black { background-color: #1a1a1a !important; color: white !important; -webkit-print-color-adjust: exact; }
              .bg-brand-cream { background-color: #f7f4f0 !important; -webkit-print-color-adjust: exact; }
              .luxury-shadow { box-shadow: none !important; border: 1px solid #e5e7eb !important; }
              .print-m-0 { margin: 0 !important; }
              .print-p-0 { padding: 0 !important; }
            }
            body { padding: 40px; font-family: 'serif', sans-serif; color: #1a1a1a; }
          </style>
        </head>
        <body>
          <div class="max-w-4xl mx-auto">
            ${invoiceContent}
          </div>
          <script>
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleEmailDispatch = async () => {
    if (!selectedOrder) return;
    const loadingToast = toast.loading('Initiating secure dispatch protocol...');
    
    try {
      await updateDoc(doc(db, 'orders', selectedOrder.id), {
        dispatchedAt: new Date(),
        status: 'shipped',
        notificationSent: true
      });
      
      // Send Dispatch Email
      await emailService.sendStatusUpdate({ ...selectedOrder, status: 'shipped' });

      setEmailSent(selectedOrder.id);
      toast.dismiss(loadingToast);
      toast.success(`Maison Dispatch Notification transmitted to ${selectedOrder.customer.email}`, {
        duration: 5000,
        icon: '✉️'
      });
      
      fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, status: 'shipped', notificationSent: true });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      handleFirestoreError(err, OperationType.UPDATE, `orders/${selectedOrder.id}`);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const path = 'orders';
    try {
      const q = query(collection(db, path), orderBy('createdAt', 'desc'));
      const snap = await getDocs(q);
      setOrders(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, path);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'orders', id), { 
        status,
        updatedAt: new Date()
      });
      
      const orderToNotify = orders.find(o => o.id === id);
      if (orderToNotify) {
        emailService.sendStatusUpdate({ ...orderToNotify, status });
      }

      toast.success(`Order set to ${status}`);
      
      if (status === 'shipped') {
        handleEmailDispatch();
      }
      
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${id}`);
    }
  };

  const verifyPayment = async (orderId: string, docId: string) => {
    const loadingToast = toast.loading('Verifying transaction...');
    try {
      // 1. Update Order Payment Status
      await updateDoc(doc(db, 'orders', docId), {
        paymentStatus: 'verified',
        updatedAt: new Date()
      });

      // 2. Activate Lucky Draw Token
      const tokensRef = collection(db, 'lucky_draw_tokens');
      const q = query(tokensRef, where('orderId', '==', orderId));
      const snap = await getDocs(q);
      
      if (!snap.empty) {
        const tokenDoc = snap.docs[0];
        await updateDoc(doc(db, 'lucky_draw_tokens', tokenDoc.id), {
          status: TokenStatus.ACTIVE
        });
        toast.success('Payment verified & Lucky Token activated!');
      } else {
        toast.success('Payment verified');
      }

      toast.dismiss(loadingToast);
      fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: 'verified' });
      }
    } catch (err) {
      toast.dismiss(loadingToast);
      toast.error('Verification failed');
      console.error(err);
    }
  };

  const declinePayment = async (docId: string) => {
    try {
      await updateDoc(doc(db, 'orders', docId), {
        paymentStatus: 'failed',
        updatedAt: new Date()
      });
      toast.error('Payment verification declined');
      fetchOrders();
      if (selectedOrder) {
        setSelectedOrder({ ...selectedOrder, paymentStatus: 'failed' });
      }
    } catch (err) {
      toast.error('Operation failed');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200';
      case 'confirmed': return 'bg-blue-50 text-blue-600 border-blue-200';
      case 'processing': return 'bg-purple-50 text-purple-600 border-purple-200';
      case 'shipped': return 'bg-cyan-50 text-cyan-600 border-cyan-200';
      case 'delivered': return 'bg-green-50 text-green-600 border-green-200';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200';
      default: return 'bg-brand-beige text-brand-grey';
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const filteredOrders = orders.filter(o => {
    const searchStr = `${o.orderId} ${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase();
    const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <AdminLayout title="Fulfillment Center">
       <div className="flex flex-col md:flex-row gap-6 mb-10 text-left">
          <div className="relative flex-grow">
             <input 
              className="w-full bg-white border border-brand-beige rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none luxury-shadow focus:border-brand-gold transition-all" 
              placeholder="Search by Order ID or Client Name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
          </div>
          <div className="flex gap-4">
             <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-6 bg-white border border-brand-beige rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:bg-brand-cream shadow-md transition-all appearance-none outline-none focus:border-brand-gold"
             >
                <option value="All">All Statuses</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="processing">Processing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="cancelled">Cancelled</option>
             </select>
             <button className="px-6 bg-brand-black text-white rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:bg-brand-gold shadow-md transition-all">
                <Printer size={14} /> Print Manifest
             </button>
          </div>
       </div>

       <div className="bg-white rounded-xl luxury-shadow overflow-hidden border border-brand-beige">
          <table className="w-full border-collapse text-left">
             <thead>
                <tr className="bg-brand-cream border-b border-brand-beige">
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Order Reference</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Customer Details</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Date</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Status</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey text-right">Investment</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey text-center">Action</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-brand-beige">
                {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-brand-cream/30 transition-colors">
                     <td className="px-6 py-5 font-bold tracking-widest text-xs uppercase">{order.orderId}</td>
                     <td className="px-6 py-5">
                        <p className="text-xs font-serif font-bold">{order.customer.firstName} {order.customer.lastName}</p>
                        <p className="text-[8px] text-brand-grey uppercase tracking-widest">{order.customer.phone}</p>
                     </td>
                     <td className="px-6 py-5 text-[10px] font-bold text-left">{order.createdAt?.toDate()?.toLocaleDateString()}</td>
                     <td className="px-6 py-5">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={cn(
                            "appearance-none text-[8px] uppercase font-bold px-3 py-1.5 rounded-full border cursor-pointer outline-none transition-all",
                            getStatusColor(order.status)
                          )}
                        >
                           <option value="pending">Pending</option>
                           <option value="confirmed">Confirmed</option>
                           <option value="processing">Processing</option>
                           <option value="shipped">Shipped</option>
                           <option value="delivered">Delivered</option>
                           <option value="cancelled">Cancelled</option>
                        </select>
                     </td>
                     <td className="px-6 py-5 text-right font-serif font-bold text-xs">{formatPrice(order.total)}</td>
                     <td className="px-6 py-5 text-center">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-brand-grey hover:text-brand-gold hover:bg-brand-cream rounded-lg transition-all"
                        >
                           <Eye size={18} />
                        </button>
                     </td>
                  </tr>
                )) : (
                  <tr><td colSpan={6} className="px-6 py-40 text-center font-serif text-brand-grey opacity-50 italic">No boutique fulfillment requests yet</td></tr>
                )}
             </tbody>
          </table>
       </div>

       {/* Order Detail Modal */}
       <AnimatePresence>
          {selectedOrder && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedOrder(null)} className="absolute inset-0 bg-black/70 backdrop-blur-md" />
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 30 }}
                 className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-luxury-lg luxury-shadow relative z-10 overflow-hidden"
                 id="printable-invoice"
               >
                  <div className="bg-brand-black text-white p-8 md:p-12 flex justify-between items-center h-full no-print-bg">
                     <div className="space-y-1">
                        <p className="text-[10px] uppercase tracking-[0.4em] opacity-50">Invoice Reference</p>
                        <h2 className="text-4xl font-serif">{selectedOrder.orderId}</h2>
                     </div>
                     <button onClick={() => setSelectedOrder(null)} className="p-2 hover:rotate-90 transition-transform"><X size={32} /></button>
                  </div>

                  <div className="p-8 md:p-12 space-y-12">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-12 border-b border-brand-beige pb-10">
                        <div className="space-y-6">
                           <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Shipping Information</h4>
                           <div className="text-sm font-light text-brand-grey space-y-1">
                              <p className="font-bold text-brand-black text-lg font-serif">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</p>
                              <p>{selectedOrder.customer.address}</p>
                              <p>{selectedOrder.customer.city}, {selectedOrder.customer.province}</p>
                              <p className="mt-4 flex items-center gap-2"><Phone size={14} /> {selectedOrder.customer.phone}</p>
                              <p className="flex items-center gap-2"><Mail size={14} /> {selectedOrder.customer.email}</p>
                           </div>
                        </div>
                        <div className="space-y-6 md:text-right">
                           <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Order Intention</h4>
                           <div className="text-sm font-light text-brand-grey space-y-2">
                              <p><span className="font-bold uppercase text-[10px] tracking-widest">Placed:</span> {selectedOrder.createdAt?.toDate()?.toLocaleString()}</p>
                              <p><span className="font-bold uppercase text-[10px] tracking-widest">Payment:</span> {selectedOrder.paymentMethod.toUpperCase()}</p>
                              <p><span className="font-bold uppercase text-[10px] tracking-widest">Status:</span> {selectedOrder.status.toUpperCase()}</p>
                           </div>
                        </div>
                     </div>

                     {/* Payment Verification Section */}
                     {(selectedOrder.paymentMethod === 'jazzcash' || selectedOrder.paymentMethod === 'easypaisa') && (
                        <div className={cn(
                          "p-8 rounded-xl border flex flex-col md:flex-row justify-between items-center gap-6",
                          selectedOrder.paymentStatus === 'verified' ? "bg-green-50 border-green-200" : 
                          selectedOrder.paymentStatus === 'failed' ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"
                        )}>
                           <div className="space-y-2">
                              <h4 className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold text-brand-black">
                                 <CreditCard size={14} className="text-brand-gold" /> 
                                 Advance Payment Proof
                              </h4>
                              <p className="text-xl font-mono font-bold tracking-tight">TrxID: {selectedOrder.trxId || 'NOT PROVIDED'}</p>
                              <p className="text-[10px] text-brand-grey uppercase tracking-widest font-bold">
                                 Method: {selectedOrder.paymentMethod} • Status: {selectedOrder.paymentStatus?.replace('_', ' ').toUpperCase()}
                              </p>
                           </div>
                           
                           {selectedOrder.paymentStatus === 'pending_verification' && (
                             <div className="flex gap-3">
                                <button 
                                  onClick={() => verifyPayment(selectedOrder.orderId, selectedOrder.id)}
                                  className="px-6 py-3 bg-brand-black text-white rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-green-600 transition-all flex items-center gap-2"
                                >
                                   <ShieldCheck size={14} /> Verify Payment
                                </button>
                                <button 
                                  onClick={() => declinePayment(selectedOrder.id)}
                                  className="px-6 py-3 border border-brand-black text-brand-black rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-red-600 hover:text-white transition-all flex items-center gap-2"
                                >
                                   <ShieldAlert size={14} /> Decline
                                </button>
                             </div>
                           )}

                           {selectedOrder.paymentStatus === 'verified' && (
                             <div className="flex items-center gap-2 text-green-600 font-bold text-xs uppercase tracking-widest">
                                <CheckCircle2 size={18} /> Verified & Token Active
                             </div>
                           )}

                           {selectedOrder.paymentStatus === 'failed' && (
                             <div className="flex items-center gap-2 text-red-600 font-bold text-xs uppercase tracking-widest">
                                <XCircle size={18} /> Payment Failed
                             </div>
                           )}
                        </div>
                     )}

                     <div className="space-y-8">
                        <h4 className="text-[10px] uppercase tracking-widest font-bold text-brand-gold">Acquired Articles</h4>
                        <div className="space-y-4">
                           {selectedOrder.items.map((item: any, i: number) => (
                             <div key={i} className="flex gap-6 items-center border-b border-brand-beige pb-4">
                                <div className="w-16 h-20 overflow-hidden rounded-lg bg-brand-cream shrink-0">
                                   <img src={item.image || undefined} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-grow">
                                   <p className="font-serif text-lg">{item.name}</p>
                                   <p className="text-[10px] text-brand-grey font-bold uppercase tracking-widest">{item.size} • {item.color} • Qty: {item.quantity}</p>
                                </div>
                                <p className="font-serif font-bold">{formatPrice((item.salePrice || item.price) * item.quantity)}</p>
                             </div>
                           ))}
                        </div>

                        <div className="flex justify-end pt-6">
                           <div className="w-full md:w-64 space-y-4">
                              <div className="flex justify-between text-sm">
                                 <span className="text-brand-grey font-light">Subtotal</span>
                                 <span className="font-bold">{formatPrice(selectedOrder.subtotal)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                 <span className="text-brand-grey font-light">Delivery</span>
                                 <span className="font-bold">{formatPrice(selectedOrder.deliveryCharges)}</span>
                              </div>
                              <div className="flex justify-between items-baseline pt-4 border-t border-brand-black">
                                 <span className="font-serif text-xl">Investment</span>
                                 <span className="text-2xl font-serif font-bold text-brand-gold">{formatPrice(selectedOrder.total)}</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="bg-brand-cream p-8 rounded-xl space-y-4 no-print">
                        <h4 className="text-[10px] uppercase tracking-widest font-bold">Designer Interaction</h4>
                        <div className="flex gap-4">
                           <button 
                             onClick={handlePrintInvoice}
                             className="flex-grow bg-brand-black text-white py-4 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-brand-gold hover:text-white transition-all shadow-lg"
                           >
                              Print Commercial Invoice
                           </button>
                           <button 
                             onClick={handleEmailDispatch}
                             className={cn(
                               "flex-grow border py-4 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all h-full flex items-center justify-center gap-2",
                               emailSent === selectedOrder.id 
                                ? "bg-green-50 text-green-600 border-green-200" 
                                : "border-brand-black text-brand-black hover:bg-brand-black hover:text-white"
                             )}
                           >
                              {emailSent === selectedOrder.id ? (
                                <>
                                  <CheckCircle2 size={14} />
                                  Dispatch Email Transmitted
                                </>
                              ) : 'Email Dispatch Notification'}
                           </button>
                        </div>
                     </div>
                  </div>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
    </AdminLayout>
  );
};

export default OrderManagement;
