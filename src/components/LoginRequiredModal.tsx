import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, X } from 'lucide-react';

interface LoginRequiredModalProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

const LoginRequiredModal: React.FC<LoginRequiredModalProps> = ({ 
  isOpen, 
  onClose, 
  message = "Please login to add items to your bag" 
}) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = () => {
    navigate('/login', { state: { from: location.pathname } });
    onClose();
  };

  const handleSignup = () => {
    navigate('/signup', { state: { from: location.pathname } });
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-brand-black/60 backdrop-blur-md"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative bg-white rounded-[2rem] p-10 max-w-sm w-full luxury-shadow-2xl overflow-hidden text-center"
          >
            {/* Decorative element */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cream rounded-full blur-3xl -mr-16 -mt-16" />
            
            <div className="relative space-y-8">
              <div className="w-20 h-20 bg-brand-cream rounded-3xl flex items-center justify-center mx-auto mb-6 text-brand-gold border border-brand-beige shadow-inner">
                <ShoppingBag size={32} strokeWidth={1.5} />
              </div>
              
              <div className="space-y-3">
                <h3 className="text-2xl font-serif text-brand-black">Maison Authentication</h3>
                <p className="text-xs text-brand-grey leading-relaxed italic px-4">
                  {message}
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleLogin}
                  className="w-full h-14 bg-brand-black text-white text-[10px] uppercase font-black tracking-[0.2em] rounded-xl hover:bg-brand-gold transition-all duration-500 shadow-xl"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignup}
                  className="w-full h-14 bg-white text-brand-black border border-brand-beige text-[10px] uppercase font-black tracking-[0.2em] rounded-xl hover:border-brand-gold hover:text-brand-gold transition-all duration-500"
                >
                  Create Account
                </button>
              </div>

              <button 
                onClick={onClose}
                className="text-[10px] text-brand-beige font-black uppercase tracking-widest hover:text-brand-black transition-colors"
              >
                Continue Browsing
              </button>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 text-brand-grey hover:text-brand-black transition-colors"
            >
              <X size={20} />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default LoginRequiredModal;
