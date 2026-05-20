import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, UserPlus, User, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { auth, db } from '../services/firebase';
import { createUserWithEmailAndPassword, updateProfile, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../utils/firestore';
import { emailService } from '../services/emailService';
import toast from 'react-hot-toast';
import { motion } from 'motion/react';

const Signup = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/profile';

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      // Create user profile in Firestore
      const isAdminEmail = email === 'umardev750@gmail.com';
      try {
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          name,
          email,
          phone,
          role: isAdminEmail ? 'admin' : 'user',
          createdAt: serverTimestamp(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }

      // Send welcome email
      emailService.sendWelcomeEmail({ email, name });

      toast.success('Account created successfully!');
      navigate(from, { replace: true });
    } catch (error: any) {
      console.error('Signup error:', error);
      if (error.code === 'auth/operation-not-allowed') {
        toast.error('Email/Password signup is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('The password is too weak. Please use at least 6 characters.');
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error('This email is already registered. Please sign in instead.');
      } else {
        toast.error(error.message || 'Failed to create account');
      }
    } finally {
      setLoading(false);
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
           <h1 className="text-4xl font-serif">Join the Elite</h1>
           <p className="text-brand-grey text-xs uppercase tracking-widest font-light">Create an account for personalized luxury experience</p>
        </div>

        {location.state?.message && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 bg-brand-gold/5 border border-brand-gold/20 rounded-xl flex items-center gap-3 text-brand-gold"
          >
            <AlertCircle size={18} />
            <p className="text-[10px] uppercase font-black tracking-widest">{location.state.message}</p>
          </motion.div>
        )}

        <form onSubmit={handleSignup} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Full Name</label>
            <div className="relative">
              <input
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-cream border border-brand-beige rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold"
                placeholder="Ex: Ayesha Khan"
              />
              <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
            </div>
          </div>

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
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Phone (Optional)</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-brand-cream border border-brand-beige rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold"
                placeholder="+92 300 1234567"
              />
              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Password</label>
            <div className="relative">
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-cream border border-brand-beige rounded-lg py-4 pl-12 pr-4 focus:outline-none focus:border-brand-gold"
                placeholder="Minimum 6 characters"
              />
              <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-black text-white py-5 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-gold transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Join Now"}
            <UserPlus size={18} />
          </button>
        </form>

        <p className="text-center text-xs text-brand-grey font-light">
          Already have an account? <Link to="/login" className="text-brand-gold font-bold uppercase tracking-widest ml-2 border-b border-brand-gold text-center">Sign In</Link>
        </p>
      </motion.div>
    </div>
  );
};

export default Signup;
