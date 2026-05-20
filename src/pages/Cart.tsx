import React from 'react';
import { Link } from 'react-router-dom';
import { Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice, cn } from '../utils/cn';
import { motion } from 'motion/react';

const Cart = () => {
  const { cart, removeFromCart, updateQuantity, subtotal, deliveryCharges, total, totalQuantity } = useCart();

  if (cart.length === 0) {
    return (
      <div className="container mx-auto px-4 py-32 text-center space-y-8 min-h-[70vh] flex flex-col items-center justify-center">
        <div className="w-24 h-24 bg-brand-beige rounded-full flex items-center justify-center mx-auto mb-4">
           <ShoppingBag size={40} className="text-brand-grey opacity-50" />
        </div>
        <div className="space-y-4">
          <h1 className="text-4xl font-serif">Your bag is empty.</h1>
          <p className="text-brand-grey font-light">Looking for inspiration? Explore our latest luxury arrivals.</p>
        </div>
        <Link
          to="/shop"
          className="inline-block bg-brand-black text-white px-12 py-4 rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-gold transition-all"
        >
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px] mb-4">Your Selection</p>
          <h1 className="text-4xl md:text-5xl font-serif">Shopping Cart</h1>
          <p className="text-brand-grey text-xs mt-4 uppercase tracking-widest">{totalQuantity} Items in bag</p>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Cart Items */}
          <div className="lg:w-2/3 space-y-8">
            <div className="hidden md:grid grid-cols-4 pb-6 border-b border-brand-beige text-[10px] uppercase tracking-widest font-bold text-brand-grey">
               <div className="col-span-2">Product</div>
               <div className="text-center">Quantity</div>
               <div className="text-right">Total</div>
            </div>
            {cart.map((item, i) => (
              <motion.div
                key={`${item.id}-${item.size}-${item.color}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="grid grid-cols-1 md:grid-cols-4 items-center gap-6 pb-8 border-b border-brand-beige"
              >
                <div className="col-span-1 md:col-span-2 flex gap-6">
                  <div className="w-24 aspect-[3/4] rounded-luxury overflow-hidden bg-brand-beige shrink-0">
                    <img src={item.image || undefined} alt={item.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col justify-center gap-1">
                    <h3 className="font-serif text-lg tracking-wide">{item.name}</h3>
                    <p className="text-[10px] uppercase font-bold text-brand-grey">Size: {item.size}</p>
                    <p className="text-[10px] uppercase font-bold text-brand-grey">Color: {item.color}</p>
                    <button
                      onClick={() => removeFromCart(item.id, item.size, item.color)}
                      className="text-[10px] uppercase font-bold text-red-500 mt-2 flex items-center gap-1 hover:text-red-700 transition-colors"
                    >
                      <Trash2 size={12} />
                      Remove
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="h-10 flex items-center border border-brand-beige rounded-full px-4 gap-6 bg-brand-cream">
                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)} className="text-sm font-bold">-</button>
                    <span className="w-6 text-center text-xs font-bold">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity + 1)} className="text-sm font-bold">+</button>
                  </div>
                </div>

                <div className="text-right">
                   <p className="font-serif font-bold text-lg">{formatPrice((item.salePrice || item.price) * item.quantity)}</p>
                   <p className="text-[10px] text-brand-grey">{formatPrice(item.salePrice || item.price)} / unit</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Summary */}
          <div className="lg:w-1/3">
             <div className="bg-brand-cream p-10 rounded-luxury-lg luxury-shadow space-y-8 sticky top-32">
                <h2 className="font-serif text-2xl border-b border-brand-beige pb-4">Order Summary</h2>

                <div className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-grey font-light">Bag Subtotal</span>
                    <span className="font-bold">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-grey font-light">Estimated Delivery</span>
                    <span className={cn("font-bold", deliveryCharges === 0 ? "text-green-600" : "")}>
                      {deliveryCharges === 0 ? "FREE" : formatPrice(deliveryCharges)}
                    </span>
                  </div>
                  {deliveryCharges > 0 && (
                    <p className="text-[9px] uppercase tracking-widest text-brand-gold font-bold">
                       Add {3 - totalQuantity} more items for free delivery!
                    </p>
                  )}
                </div>

                <div className="pt-6 border-t border-brand-beige flex justify-between items-baseline">
                   <span className="text-lg font-serif">Total Amount</span>
                   <span className="text-3xl font-serif font-bold text-brand-gold tracking-tight">{formatPrice(total)}</span>
                </div>

                <div className="space-y-4">
                   <Link
                     to="/checkout"
                     className="w-full bg-brand-black text-white py-5 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-gold transition-all duration-300 shadow-xl"
                   >
                     Checkout Now
                     <ArrowRight size={18} />
                   </Link>
                   <Link to="/shop" className="block text-center text-[10px] uppercase font-bold tracking-widest text-brand-grey hover:text-brand-black transition-colors">
                     Continue Shopping
                   </Link>
                </div>

                {/* Info */}
                <div className="bg-white/50 p-4 rounded-lg border border-brand-beige space-y-3">
                   <p className="text-[10px] font-bold uppercase tracking-widest">Delivery Policies</p>
                   <ul className="text-[10px] text-brand-grey space-y-1 list-disc pl-3 font-light">
                      <li>Cash on Delivery: Rs. 180</li>
                      <li>FREE Delivery on 3+ items</li>
                      <li>FREE Delivery for JazzCash advance payments</li>
                   </ul>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
