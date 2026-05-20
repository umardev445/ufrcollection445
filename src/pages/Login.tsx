import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, LogIn, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const message = location.state?.message;
  const from = location.state?.from?.pathname || '/profile';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast.success('Welcome back to UFR Collection!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password login is not enabled in Firebase Console. Please enable it or use Google Login.');
      } else if (error.code === 'auth/network-request-failed') {
        toast.error('Network error. If you are using a popup, try opening the app in a new tab.');
      } else {
        toast.error(error.message || 'Failed to login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Handle synchronizing profile to Firestore for Google Auth
      const userRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        const isAdminEmail = user.email?.toLowerCase() === 'umardev750@gmail.com';
        await setDoc(userRef, {
          uid: user.uid,
          name: user.displayName || 'UFR Client',
          email: user.email,
          phone: user.phoneNumber || '',
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });
      }

      toast.success('Welcome to UFR Collection!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error.code === 'auth/popup-blocked') {
        toast.error('Popup blocked. Please allow popups or open the app in a new tab.');
      } else if (error.code === 'auth/cancelled-popup-request') {
        // User closed the popup, no need for error toast
      } else {
        toast.error(error.message || 'Failed to login with Google');
      }
    }
  };

  return (
    <div className="bg-brand-cream min-h-[90vh] flex items-center justify-center py-20 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 md:p-12 rounded-luxury-lg luxury-shadow space-y-8"
      >
        <div className="text-center space-y-2">
           <h1 className="text-4xl font-serif">Welcome Back</h1>
           <p className="text-brand-grey text-xs uppercase tracking-widest font-light">Enter your credentials to access your account</p>
        </div>

        {message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-brand-gold/5 border border-brand-gold/20 rounded-xl flex items-center gap-3 text-brand-gold"
          >
            <AlertCircle size={18} />
            <p className="text-[10px] uppercase font-black tracking-widest">{message}</p>
          </motion.div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Email Address</label>
            <div className="relative">
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-brand-cream border border-brand-beige rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold"
                placeholder="name@example.com"
              />
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Password</label>
              <button type="button" className="text-[10px] uppercase font-bold tracking-widest text-brand-gold border-b border-brand-gold">Forgot?</button>
            </div>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-cream border border-brand-beige rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold"
                placeholder="••••••••"
              />
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-black text-white py-5 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-gold transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Sign In"}
            <LogIn size={18} />
          </button>
        </form>

        <div className="relative">
           <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-brand-beige" />
           <span className="relative bg-white px-4 text-[10px] uppercase font-bold tracking-widest text-brand-grey mx-auto block w-fit">Or continue with</span>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full border border-brand-beige bg-white text-brand-black py-4 rounded-full text-xs uppercase font-bold tracking-widest flex items-center justify-center gap-3 hover:bg-brand-beige transition-all"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-4 h-4" />
          Google Account
        </button>

        <p className="text-center text-xs text-brand-grey font-light">
          Don't have an account? <Link to="/signup" className="text-brand-gold font-bold uppercase tracking-widest ml-2 border-b border-brand-gold">Create One</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
