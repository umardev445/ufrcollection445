import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowUp, X, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={scrollToTop}
          className="fixed bottom-[100px] right-6 z-40 bg-brand-black text-white p-4 rounded-full luxury-shadow-lg hover:bg-brand-gold transition-all duration-300 md:bottom-[110px]"
          aria-label="Back to top"
        >
          <ArrowUp size={20} />
        </motion.button>
      )}
    </AnimatePresence>
  );
};

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('ufr-cookie-consent');
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 2000);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('ufr-cookie-consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('ufr-cookie-consent', 'declined');
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-6 right-6 z-[60] md:left-auto md:right-8 md:max-w-md"
        >
          <div className="bg-white rounded-[2rem] border border-brand-beige luxury-shadow-2xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cream/40 rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="flex gap-6 items-start relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-brand-cream border border-brand-beige flex items-center justify-center text-brand-gold shrink-0">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold">Enhancing Your Journey</h3>
                <p className="text-xs text-brand-grey leading-relaxed">
                  The House of Excellence uses cookies and local archiving to personalize your luxury experience and understand how our Maison is explored.
                </p>
                <div className="flex flex-wrap items-center gap-4 pt-4">
                  <button
                    onClick={acceptCookies}
                    className="bg-brand-black text-white px-8 py-3 rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-brand-gold transition-all luxury-shadow-sm"
                  >
                    Accept Gracefully
                  </button>
                  <button
                    onClick={declineCookies}
                    className="text-brand-grey border-b border-brand-beige pb-1 text-[10px] uppercase font-bold tracking-widest hover:text-brand-black hover:border-brand-black transition-all"
                  >
                    Minimal Experience
                  </button>
                </div>
                <p className="text-[9px] text-brand-beige">
                  By continuing, you agree to our <Link to="/privacy-policy" className="underline hover:text-brand-gold">Maison Protocols</Link>.
                </p>
              </div>
            </div>
            
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-4 right-4 text-brand-beige hover:text-brand-grey transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
