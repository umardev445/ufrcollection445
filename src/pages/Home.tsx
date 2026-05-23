// @ts-nocheck
import React, { useEffect, useState, useRef, useMemo } from 'react';
import EidiPromoPopup from '../components/EidiPromoPopup';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Trophy,
  Ticket,
  Star
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories, heroSlides as defaultHeroSlides } from '../constants/demoData';
import ProductCard from '../components/ProductCard';
import { cn } from '../utils/cn';
import { productService, Product } from '../services/productService';
import { homepageService, HomepageConfig } from '../services/homepageService';
import SEO from '../components/SEO';
import { ProductCardSkeleton } from '../components/Skeletons';
import { luckyDrawService, LuckyDrawConfig } from '../services/luckyDrawService';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [promoConfig, setPromoConfig] = useState<LuckyDrawConfig | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  // ✅ FIXED: Mobile detection using useState + useEffect
  const [isMobile, setIsMobile] = useState(false);
  const [showEidiPopup, setShowEidiPopup] = useState(false); // 👈 State pehle declare karo

  // ✅ FIXED: Popup trigger useEffect - AB STATE KE BAAD LIKHA
  useEffect(() => {
    const hasSeenPopup = sessionStorage.getItem('hasSeenEidiPopup');
    if (!hasSeenPopup && promoConfig?.status === 'active') {
      const timer = setTimeout(() => {
        setShowEidiPopup(true);
        sessionStorage.setItem('hasSeenEidiPopup', 'true');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [promoConfig]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // useMemo for sorting sections
  const sortedSections = useMemo(() => {
    return config?.sections?.sort((a, b) => a.order - b.order) || [];
  }, [config]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const [latest, bestSellerProducts, homeConfig, luckyPromo] = await Promise.all([
          productService.getLatestProducts(8),
          productService.getBestSellerProducts(8),
          homepageService.getConfig(),
          luckyDrawService.getPromotionConfig()
        ]);

        const fixedLatest = (latest || []).map(p => ({
          ...p,
          reviewsCount: Number(p.reviewsCount) || 0,
          rating: Number(p.rating) || 0
        }));

        const fixedBestSellers = (bestSellerProducts || []).map(p => ({
          ...p,
          reviewsCount: Number(p.reviewsCount) || 0,
          rating: Number(p.rating) || 0
        }));

        console.log("✅ Products fetched successfully!");
        console.log("📦 New Arrivals count:", fixedLatest.length);
        console.log("📦 Best Sellers count:", fixedBestSellers.length);

        setNewArrivals(fixedLatest);
        setBestSellers(fixedBestSellers);
        setConfig(homeConfig);
        setPromoConfig(luckyPromo);
      } catch (err) {
        console.error("❌ Failed to fetch home data:", err);
        setFetchError(err instanceof Error ? err.message : "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchHomeData();
  }, []);

  const activeSlides = config?.heroSlides?.length ? config.heroSlides : defaultHeroSlides;

  useEffect(() => {
    if (!activeSlides.length) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === (activeSlides.length - 1) ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [activeSlides]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === activeSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? activeSlides.length - 1 : prev - 1));
  };

  return (
    <div className="overflow-hidden bg-[#FDFCFB]">
      <SEO 
        title="UFR Collection | Luxury Pakistani Women's Fashion" 
        description="Discover the pinnacle of Pakistani luxury pret, formal wear, and bridal collections. Handcrafted elegance for the modern woman. Shop the UFR Collection."
      />
      
      {/* Cinematic Hero Slider - Your existing code remains same */}
      <section ref={heroRef} className="relative h-[90vh] md:h-screen bg-brand-black overflow-hidden">
        {/* ... existing hero slider code ... */}
      </section>

      {/* Lucky Draw Promotion Banner */}
      {promoConfig?.status === 'active' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-brand-gold text-brand-black py-3 md:py-4 overflow-hidden relative"
        >
           <div className="flex whitespace-nowrap animate-marquee">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-4 md:gap-8 mx-4 md:mx-8">
                   <p className="text-[9px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3">
                      <Trophy size={14} className="md:w-4 md:h-4" /> WIN iPHONE 17 & HONDA 70
                   </p>
                   <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-brand-black rounded-full" />
                   <p className="text-[9px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3">
                      <Ticket size={14} className="md:w-4 md:h-4" /> USE JAZZCASH/EASYPASA ADVANCE
                   </p>
                   <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-brand-black rounded-full" />
                   <p className="text-[9px] md:text-sm font-black uppercase tracking-[0.2em] md:tracking-[0.3em] flex items-center gap-2 md:gap-3">
                      <Star size={14} className="md:w-4 md:h-4" /> NEXT DRAW COMMENCING SOON
                   </p>
                   <span className="w-1 h-1 md:w-1.5 md:h-1.5 bg-brand-black rounded-full" />
                </div>
              ))}
           </div>
        </motion.div>
      )}

      {/* Rest of your existing code remains SAME */}
      {/* SHOP BY CATEGORY, Dynamic Sections, etc. */}

      {/* Eidi Promotion Popup - At the very end */}
      <EidiPromoPopup 
        isOpen={showEidiPopup} 
        onClose={() => setShowEidiPopup(false)} 
      />
    </div>
  );
};

export default Home;