import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronRight, Gift, Crown } from 'lucide-react';

interface EidiPromoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

const EidiPromoPopup: React.FC<EidiPromoPopupProps> = ({ isOpen, onClose }) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    if (!isOpen) return;
    
    const calculateTimeLeft = () => {
      const eidDate = new Date(2026, 4, 24);
      const now = new Date();
      const difference = eidDate.getTime() - now.getTime();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };
    
    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light Backdrop - less intrusive */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999]"
          />
          
          {/* Compact Popup - Mobile First Design */}
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ 
              type: "spring", 
              damping: 25, 
              stiffness: 350,
              duration: 0.4
            }}
            className="fixed bottom-0 left-0 right-0 z-[10000] md:top-1/2 md:left-1/2 md:bottom-auto md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-sm mx-auto"
          >
            <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl mx-3 md:mx-0 overflow-hidden">
              {/* Gold Accent Bar */}
              <div className="h-1 bg-gradient-to-r from-brand-gold to-yellow-500" />
              
              {/* Header with Close */}
              <div className="flex justify-between items-center px-4 pt-4 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-brand-gold/10 flex items-center justify-center">
                    <Gift size={16} className="text-brand-gold" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">Eidi Special</span>
                </div>
                <button
                  onClick={onClose}
                  className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition"
                >
                  <X size={14} className="text-gray-500" />
                </button>
              </div>
              
              {/* Content */}
              <div className="px-4 pb-4">
                {/* Title */}
                <h2 className="text-xl font-bold text-gray-800 mb-0.5">
                  Win <span className="text-brand-gold">₹25,000</span> Eidi
                </h2>
                <p className="text-[11px] text-gray-500 mb-3">5 lucky winners • Cash Prize</p>
                
                {/* Compact Countdown */}
                <div className="flex items-center justify-between bg-gray-50 rounded-xl p-2.5 mb-3">
                  <span className="text-[10px] font-bold text-gray-600">Time Left</span>
                  <div className="flex gap-2">
                    {[
                      { label: 'D', value: timeLeft.days },
                      { label: 'H', value: timeLeft.hours },
                      { label: 'M', value: timeLeft.minutes },
                      { label: 'S', value: timeLeft.seconds }
                    ].map((item) => (
                      <div key={item.label} className="text-center">
                        <div className="bg-white rounded-lg px-2 py-1 shadow-sm min-w-[35px]">
                          <span className="text-sm font-bold text-gray-800">{String(item.value).padStart(2, '0')}</span>
                        </div>
                        <span className="text-[8px] text-gray-400 block">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Quick Perks */}
                <div className="flex flex-wrap gap-2 mb-3">
                  <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1">
                    <Crown size={10} className="text-brand-gold" />
                    <span className="text-[9px] text-gray-600">5 Winners</span>
                  </div>
                  <div className="flex items-center gap-1 bg-gray-50 rounded-full px-2.5 py-1">
                    <span className="text-[9px] text-gray-600">JazzCash/Easypaisa</span>
                  </div>
                </div>
                
                {/* CTA Button - Compact */}
                <a
                  href="/eidi-giveaway"
                  className="w-full bg-brand-gold text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-yellow-600 transition-all"
                >
                  Claim Your Eidi <ChevronRight size={14} />
                </a>
                
                {/* Terms - Minimal */}
                <p className="text-[8px] text-gray-400 text-center mt-2.5">
                  No purchase necessary • Live draw on 1st Eid
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EidiPromoPopup;