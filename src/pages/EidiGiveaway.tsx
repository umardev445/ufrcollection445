// src/pages/EidiGiveaway.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Gift, Trophy, Users, Clock, CheckCircle, 
  ArrowRight, Star, Crown, Wallet, 
  Share2, MessageCircle, Copy, Check,
  MessageSquare, Send, Heart, Lock, Unlock,
  Eye, TrendingUp
} from 'lucide-react';
import { Link } from 'react-router-dom';

const EidiGiveaway = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: '',
  });
  
  const [comments, setComments] = useState([
    { id: 1, name: 'علی رضا', text: 'ماشاءاللہ! بہت اچھا اقدام ✨', time: '2 گھنٹے پہلے', likes: 12, liked: false },
    { id: 2, name: 'سارہ خان', text: 'اللہ کرے کوئی خوش قسمت جیتے 🎉', time: '5 گھنٹے پہلے', likes: 8, liked: false },
    { id: 3, name: 'فاطمہ ظفر', text: 'UFR کے کپڑے بہت اعلیٰ ہیں ❤️', time: '1 دن پہلے', likes: 24, liked: false },
  ]);
  
  const [newComment, setNewComment] = useState('');
  const [commentName, setCommentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareCount, setShareCount] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visitorCount, setVisitorCount] = useState(0);
  const [applicationCount, setApplicationCount] = useState(0);
  const [globalCount, setGlobalCount] = useState(0);  // ✅ ADD THIS
  const [timeLeft, setTimeLeft] = useState({
    days: 0, hours: 0, minutes: 0, seconds: 0
  });

  const SHARE_REQUIRED = 5;
  const shareLink = window.location.href;
  
  // Urdu Promotion Text for WhatsApp
  const urduPromoMessage = `🎉 *UFR COLLECTION - عیدی انعام 2026* 🎉
  
✨ *₹25,000 نقد عیدی جیتیں* ✨

🎁 *5 خوش قسمت افراد*
💰 *انعام:* ₹25,000 نقد
📱 *ٹرانسفر:* جاز کیش / ایزی پیسہ
📅 *تاریخ:* عید الفطر 2026

👇 *کیسے شامل ہوں:*
1️⃣ نیچے دیے گئے لنک پر کلک کریں
2️⃣ اپنا نام اور ای میل درج کریں
3️⃣ 5 دوستوں کو شیئر کریں
4️⃣ آپ کی درخواست جمع ہو جائے گی

🔗 *ابھی درخواست دیں:* ${shareLink}

⭐ *5000+ خوش گاہک*
🏆 *پاکستان کا لگژری برانڈ*

#UFRCollection #EidiGiveaway #عیدی_انعام`;

  // ✅ REAL-TIME GLOBAL COUNTER (CountAPI)
  useEffect(() => {
    fetch('https://api.countapi.xyz/hit/ufrcollection/eidi2026')
      .then(res => res.json())
      .then(data => {
        if (data && data.value) {
          setGlobalCount(data.value);
        }
      })
      .catch(() => {
        // Fallback counter
        const localCount = localStorage.getItem('globalCounter');
        const newCount = localCount ? parseInt(localCount) + 1 : 1247;
        setGlobalCount(newCount);
        localStorage.setItem('globalCounter', newCount.toString());
      });
  }, []);

  // Load counters from localStorage
  useEffect(() => {
    // Visitor counter - fixed (only once per session)
    const hasCounted = sessionStorage.getItem('visitorCounted');
    if (!hasCounted) {
      const storedVisitors = localStorage.getItem('eidiVisitors');
      const newVisitorCount = storedVisitors ? parseInt(storedVisitors) + 1 : 1;
      setVisitorCount(newVisitorCount);
      localStorage.setItem('eidiVisitors', newVisitorCount.toString());
      sessionStorage.setItem('visitorCounted', 'true');
    } else {
      const storedVisitors = localStorage.getItem('eidiVisitors');
      setVisitorCount(storedVisitors ? parseInt(storedVisitors) : 0);
    }
    
    // Load applications count
    const storedApps = localStorage.getItem('eidiApplications');
    if (storedApps) {
      setApplicationCount(parseInt(storedApps));
    } else {
      const existingEntries = localStorage.getItem('eidiEntries');
      const count = existingEntries ? JSON.parse(existingEntries).length : 0;
      setApplicationCount(count);
      localStorage.setItem('eidiApplications', count.toString());
    }
    
    // Load share progress
    const savedCount = localStorage.getItem('eidiShareCount');
    const savedUnlocked = localStorage.getItem('eidiUnlocked');
    const savedForm = localStorage.getItem('eidiFormData');
    const savedSubmitted = localStorage.getItem('eidiSubmitted');
    
    if (savedCount) setShareCount(parseInt(savedCount));
    if (savedUnlocked === 'true') setIsUnlocked(true);
    if (savedSubmitted === 'true') setShowSuccess(true);
    if (savedForm) {
      try {
        const saved = JSON.parse(savedForm);
        setFormData(saved);
      } catch(e) {}
    }
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem('eidiShareCount', shareCount.toString());
    localStorage.setItem('eidiUnlocked', isUnlocked.toString());
    if (formData.name) {
      localStorage.setItem('eidiFormData', JSON.stringify(formData));
    }
  }, [shareCount, isUnlocked, formData]);

  // Countdown timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const eidDate = new Date(2026, 4, 24);
      const difference = eidDate.getTime() - new Date().getTime();
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
  }, []);

  const handleShare = async () => {
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(urduPromoMessage)}`;
    window.open(whatsappUrl, '_blank');
    
    setTimeout(() => {
      if (!isUnlocked) {
        const newCount = shareCount + 1;
        setShareCount(newCount);
        
        if (newCount >= SHARE_REQUIRED) {
          setIsUnlocked(true);
          if (formData.name && formData.email) {
            submitApplication();
          }
        }
      }
    }, 2000);
  };

  const submitApplication = () => {
    const entries = JSON.parse(localStorage.getItem('eidiEntries') || '[]');
    entries.push({ 
      ...formData, 
      timestamp: new Date().toISOString(),
      shareCount: shareCount + 1
    });
    localStorage.setItem('eidiEntries', JSON.stringify(entries));
    
    const newCount = entries.length;
    setApplicationCount(newCount);
    localStorage.setItem('eidiApplications', newCount.toString());
    localStorage.setItem('eidiSubmitted', 'true');
    setShowSuccess(true);
    setLoading(false);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('براہ کرم اپنا نام اور ای میل درج کریں');
      return;
    }
    
    if (isUnlocked) {
      submitApplication();
    } else {
      handleShare();
    }
  };

  const handleAddComment = () => {
    if (!commentName.trim() || !newComment.trim()) {
      alert('براہ کرم اپنا نام اور تبصرہ درج کریں');
      return;
    }
    
    const newCommentObj = {
      id: comments.length + 1,
      name: commentName,
      text: newComment,
      time: 'ابھی ابھی',
      likes: 0,
      liked: false
    };
    
    setComments([newCommentObj, ...comments]);
    setNewComment('');
    setCommentName('');
  };

  const handleLikeComment = (id: number) => {
    setComments(comments.map(c => 
      c.id === id 
        ? { ...c, likes: c.liked ? c.likes - 1 : c.likes + 1, liked: !c.liked }
        : c
    ));
  };

  const progress = (shareCount / SHARE_REQUIRED) * 100;

  // Success Screen
  if (showSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center px-4">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl p-6 text-center max-w-sm w-full shadow-2xl"
        >
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle size={44} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">🎉 مبارک ہو!</h2>
          <p className="text-gray-600 mb-4">آپ کی درخواست کامیابی سے جمع ہوگئی</p>
          <div className="bg-green-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-green-800 text-right">✓ ₹25,000 عیدی کے لیے اندراج</p>
            <p className="text-sm text-green-800 text-right">✓ 5 خوش قسمت افراد</p>
            <p className="text-sm text-green-800 text-right">✓ انعام عید الفطر پر دیا جائے گا</p>
          </div>
          <Link to="/" className="bg-brand-gold text-white px-6 py-3 rounded-xl font-bold block text-center">
            ہوم پیج پر واپس جائیں
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-brand-black text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-yellow-500/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-4 py-6">
          <Link to="/" className="inline-flex items-center text-white/60 hover:text-brand-gold text-sm mb-4 transition-colors">
            ← واپس
          </Link>
          
          <div className="text-center max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-brand-gold/20 rounded-full px-4 py-1.5 mb-3">
              <Crown size={14} className="text-brand-gold" />
              <span className="text-brand-gold text-xs font-bold">عیدی انعام 2026</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-bold mb-2">
              <span className="text-brand-gold">₹25,000</span> عیدی جیتیں
            </h1>
            <p className="text-white/70 text-sm mb-4">5 خوش قسمت افراد • نقد انعام</p>
            
            {/* Countdown */}
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2">
              <Clock size={14} className="text-brand-gold" />
              <div className="flex gap-1 text-sm font-mono">
                <span>{String(timeLeft.days).padStart(2, '0')} دن</span>
                <span>:</span>
                <span>{String(timeLeft.hours).padStart(2, '0')} گھنٹے</span>
                <span>:</span>
                <span>{String(timeLeft.minutes).padStart(2, '0')} منٹ</span>
                <span>:</span>
                <span>{String(timeLeft.seconds).padStart(2, '0')} سیکنڈ</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-5 max-w-lg">
        
        {/* Stats Cards - Real-time Global Counter */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Real-time Visitor Counter */}
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Eye size={16} className="text-purple-600" />
              <span className="text-xs font-bold text-purple-600">کل زائرین</span>
              <span className="text-[8px] bg-purple-200 text-purple-700 px-1 rounded-full">لائیو</span>
            </div>
            <p className="text-2xl font-bold text-purple-700">{globalCount.toLocaleString()}</p>
          </div>
          
          {/* Application Counter */}
          <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-2xl p-3 text-center shadow-sm">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={16} className="text-green-600" />
              <span className="text-xs font-bold text-green-600">درخواست دہندگان</span>
            </div>
            <p className="text-2xl font-bold text-green-700">{applicationCount.toLocaleString()}</p>
          </div>
        </div>

        {/* Application Form Card */}
        <div className="bg-white rounded-2xl p-5 mb-5 shadow-md">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-right">درخواست فارم</h2>
          
          <form onSubmit={handleFormSubmit} className="space-y-3">
            <input
              type="text"
              placeholder="آپ کا نام *"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-gold focus:outline-none text-right"
              required
            />
            <input
              type="email"
              placeholder="ای میل ایڈریس *"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-gold focus:outline-none text-right"
              required
            />
            <input
              type="tel"
              placeholder="واٹس ایپ نمبر (اختیاری)"
              value={formData.whatsapp}
              onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-brand-gold focus:outline-none text-right"
            />
            
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-brand-gold to-yellow-500 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2"
            >
              <Gift size={18} /> درخواست جمع کریں
            </button>
          </form>
        </div>

        {/* Share Progress Card */}
        <div className={`rounded-2xl p-4 mb-5 shadow-md ${isUnlocked ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              {isUnlocked ? <Unlock size={18} className="text-green-600" /> : <Lock size={18} className="text-amber-600" />}
              <span className="font-bold text-gray-800">شیئرنگ پیش رفت</span>
            </div>
            <span className="text-sm font-bold text-brand-gold">{shareCount}/{SHARE_REQUIRED}</span>
          </div>
          
          {/* Progress Bar */}
          <div className="h-2.5 bg-gray-200 rounded-full mb-2 overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className={`h-full rounded-full ${isUnlocked ? 'bg-green-500' : 'bg-gradient-to-r from-brand-gold to-yellow-500'}`}
            />
          </div>
          
          <p className="text-xs text-gray-600 mb-3 text-right">
            {isUnlocked 
              ? '✓ درخواست کھل گئی! اوپر فارم جمع کریں'
              : `${SHARE_REQUIRED - shareCount} مزید دوستوں کو واٹس ایپ پر شیئر کریں`}
          </p>
          
          {/* WhatsApp Share Button */}
          {!isUnlocked && (
            <button
              onClick={handleShare}
              className="w-full bg-[#25D366] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-[#20b859] active:scale-98 transition-all"
            >
              <MessageCircle size={18} /> واٹس ایپ پر شیئر کریں
            </button>
          )}
        </div>

        {/* Prize Info */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Trophy size={20} className="text-brand-gold mx-auto mb-1" />
            <p className="text-xs text-gray-500">خوش قسمت افراد</p>
            <p className="font-bold text-brand-gold text-lg">5</p>
          </div>
          <div className="bg-white rounded-xl p-3 text-center shadow-sm">
            <Wallet size={20} className="text-brand-gold mx-auto mb-1" />
            <p className="text-xs text-gray-500">انعام کی رقم</p>
            <p className="font-bold text-brand-gold text-lg">₹25,000</p>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl p-4 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare size={16} className="text-brand-gold" />
            <h2 className="font-bold text-gray-800">تبصرے ({comments.length})</h2>
          </div>
          
          {/* Add Comment */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="آپ کا نام"
              value={commentName}
              onChange={(e) => setCommentName(e.target.value)}
              className="w-1/3 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-gold focus:outline-none text-right"
            />
            <input
              type="text"
              placeholder="تبصرہ لکھیں..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-brand-gold focus:outline-none text-right"
            />
            <button
              onClick={handleAddComment}
              className="bg-brand-gold text-white px-3 py-2 rounded-lg"
            >
              <Send size={14} />
            </button>
          </div>
          
          {/* Comments List */}
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {comments.map((comment) => (
              <div key={comment.id} className="border-b border-gray-100 pb-3">
                <div className="flex justify-between items-start">
                  <button
                    onClick={() => handleLikeComment(comment.id)}
                    className="flex items-center gap-1 text-xs"
                  >
                    <Heart size={12} className={comment.liked ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                    <span className={comment.liked ? 'text-red-500' : 'text-gray-500'}>{comment.likes}</span>
                  </button>
                  <div className="text-right">
                    <span className="font-bold text-sm text-gray-800">{comment.name}</span>
                    <span className="text-xs text-gray-400 mr-2">{comment.time}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1 text-right">{comment.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EidiGiveaway;