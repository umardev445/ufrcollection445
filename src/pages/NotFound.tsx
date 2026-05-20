import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, ShoppingBag, Search as SearchIcon, ArrowLeft } from 'lucide-react';
import SEO from '../components/SEO';

const NotFound = () => {
  const [countdown, setCountdown] = useState(15); // Increased to 15 for better UX
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown <= 0) {
      navigate('/');
    }
  }, [countdown, navigate]);

  return (
    <div className="min-h-[80vh] flex items-center justify-center bg-brand-cream/30 px-6 py-20">
      <SEO title="404 - Page Not Found" description="The archive you are looking for does not exist in our Maison." />
      
      <div className="max-w-2xl w-full text-center space-y-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-[12rem] md:text-[18rem] font-serif font-bold text-brand-gold/10 leading-none select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
            404
          </h1>
          <div className="relative z-10 space-y-6">
            <h2 className="text-4xl md:text-6xl font-serif text-brand-black tracking-tighter">LOST IN THE ARCHIVES</h2>
            <p className="text-brand-grey font-light italic text-lg max-w-md mx-auto">
              The piece you are looking for cannot be found in our current collection. It may have been moved or archived.
            </p>
          </div>
        </motion.div>

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-center gap-6 pt-10">
          <Link
            to="/"
            className="group flex items-center gap-3 bg-brand-black text-white px-10 py-5 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-brand-gold transition-all duration-500 luxury-shadow-lg"
          >
            <Home size={16} /> Return Home
          </Link>
          <Link
            to="/shop"
            className="group flex items-center gap-3 border border-brand-beige bg-white text-brand-black px-10 py-5 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-brand-cream transition-all duration-500"
          >
            <ShoppingBag size={16} /> Shop Boutique
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-[10px] uppercase tracking-[0.3em] text-brand-grey font-bold"
        >
          Redirecting to sanctuary in <span className="text-brand-gold font-black">{countdown}</span> seconds...
        </motion.div>

        <div className="pt-12 max-w-md mx-auto relative z-10">
          <div className="relative">
             <input 
              type="text" 
              placeholder="Search the Maison..." 
              className="w-full bg-white border border-brand-beige rounded-full py-4 pl-12 pr-6 text-sm focus:outline-none luxury-shadow-sm focus:border-brand-gold"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  navigate(`/shop?search=${(e.target as HTMLInputElement).value}`);
                }
              }}
            />
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
