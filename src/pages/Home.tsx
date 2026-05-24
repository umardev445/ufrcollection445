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

  const [isMobile, setIsMobile] = useState(false);
  const [showEidiPopup, setShowEidiPopup] = useState(false);

  // Popup trigger
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
      
      {/* Cinematic Hero Slider */}
      <section ref={heroRef} className="relative h-[90vh] md:h-screen bg-brand-black overflow-hidden">
        <AnimatePresence mode="wait">
          {activeSlides.map((slide, index) =>
            index === currentSlide ? (
              <motion.div
                key={slide.id || index}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2 }}
                className="absolute inset-0"
              >
                <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/80 to-black/85 z-10" />
                <motion.div
                  className="w-full h-full"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 4 }}
                >
                  <img
                    src={slide.image || undefined}
                    alt={slide.title}
                    style={isMobile ? {} : { y }}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "auto"}
                    width="1200"
                    height="800"
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6 mt-16 md:mt-0">
                  <motion.div style={{ opacity }} className="max-w-5xl">
                    <motion.div
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 1 }}
                      className="space-y-4 md:space-y-8"
                    >
                      <motion.p 
                        initial={{ opacity: 0, letterSpacing: "0.2em" }}
                        animate={{ opacity: 1, letterSpacing: "0.5em" }}
                        transition={{ delay: 0.6, duration: 1 }}
                        className="text-brand-gold font-bold uppercase text-[10px] md:text-sm tracking-[0.3em]"
                      >
                        {slide.subtitle}
                      </motion.p>
                      <h1 className="text-white text-4xl md:text-7xl lg:text-8xl font-serif leading-[1.2] tracking-tight">
                        {slide.title}
                      </h1>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="pt-4 md:pt-10"
                      >
                        <Link
                          to={slide.link}
                          className="group relative inline-flex items-center justify-center overflow-hidden bg-white text-brand-black px-8 md:px-12 py-3 md:py-4 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-black hover:text-white transition-colors duration-500"
                        >
                          <span className="relative z-10">{slide.cta}</span>
                          <div className="absolute inset-0 bg-brand-gold translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                        </Link>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            ) : null
          )}
        </AnimatePresence>

        {/* Dots Indicator */}
        <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 md:gap-3">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              className="group relative p-2 min-w-[44px] min-h-[44px] flex items-center justify-center"
            >
              <div className={cn(
                "h-1 md:h-1.5 transition-all duration-500 rounded-full",
                index === currentSlide ? "w-6 md:w-8 bg-brand-gold" : "w-1.5 md:w-1.5 bg-white/50 hover:bg-white/80"
              )} />
            </button>
          ))}
        </div>

        {/* Side Controls */}
        <button 
          onClick={prevSlide}
          aria-label="Previous slide"
          className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 z-30 min-w-[44px] min-h-[44px] w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white hover:text-brand-black transition-all"
        >
          <ChevronLeft size={20} className="md:w-6 md:h-6" />
        </button>
        <button 
          onClick={nextSlide}
          aria-label="Next slide"
          className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 z-30 min-w-[44px] min-h-[44px] w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/30 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white hover:text-brand-black transition-all"
        >
          <ChevronRight size={20} className="md:w-6 md:h-6" />
        </button>
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

      {/* SHOP BY CATEGORY */}
      <section className="py-12 px-4 md:py-24 md:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-brand-gold font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px]"
            >
              Exquisite Selection
            </motion.p>
            <h2 className="text-2xl md:text-5xl lg:text-6xl font-serif uppercase tracking-tight">SHOP BY CATEGORY</h2>
            <div className="w-16 md:w-24 h-0.5 bg-brand-gold mx-auto mt-4 md:mt-6" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6 lg:gap-8">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} className="block text-center">
                  <div className="aspect-square md:aspect-[4/5] overflow-hidden rounded-2xl md:rounded-[2rem] mb-3 md:mb-5 relative shadow-md hover:shadow-xl transition-all duration-500 bg-brand-cream">
                    <img
                      src={cat.image || "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&h=500&fit=crop"}
                      alt={cat.name}
                      loading="lazy"
                      decoding="async"
                      sizes="(max-width: 768px) 50vw, 20vw"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&h=500&fit=crop";
                      }}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/20 transition-all duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-white/90 backdrop-blur-sm text-brand-black w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center transform translate-y-3 group-hover:translate-y-0 transition-all duration-500">
                        <ArrowRight size={16} className="md:w-5 md:h-5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-serif text-base md:text-xl tracking-wide group-hover:text-brand-gold transition-colors duration-300">{cat.name}</h3>
                  <p className="text-[8px] md:text-[10px] uppercase tracking-[0.15em] md:tracking-[0.2em] text-gray-500 mt-1 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">View Collection</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Error Message */}
      {fetchError && (
        <div className="text-center py-12 px-4">
          <p className="text-red-500">⚠️ {fetchError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 bg-brand-gold text-black px-6 py-2 rounded-full text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* New Arrivals Section */}
      <section className="py-12 px-4 md:py-24 md:px-8 bg-brand-cream relative overflow-hidden">
        <div className="container mx-auto max-w-7xl relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end mb-10 md:mb-16 gap-6 md:gap-8">
            <div className="text-center md:text-left space-y-2 md:space-y-3">
              <p className="text-brand-gold font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px]">The Latest Obsessions</p>
              <h2 className="text-2xl md:text-5xl lg:text-6xl font-serif">NEW ARRIVALS</h2>
            </div>
            <Link to="/shop?sort=newest" className="group flex items-center gap-2 md:gap-3 text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] font-black border-b-2 border-brand-black pb-1 md:pb-2 hover:text-brand-gold hover:border-brand-gold transition-all duration-500">
              Explore Full Boutique <ArrowRight size={14} className="md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : newArrivals.length > 0 ? (
              newArrivals.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No new arrivals at the moment. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Best Sellers Section */}
      <section className="py-12 px-4 md:py-24 md:px-8 bg-white">
        <div className="container mx-auto max-w-7xl">
          <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
            <p className="text-brand-gold font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px]">Iconic Favorites</p>
            <h2 className="text-2xl md:text-5xl lg:text-6xl font-serif">BEST SELLERS</h2>
            <div className="w-16 md:w-24 h-0.5 bg-brand-gold mx-auto mt-4 md:mt-6" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {loading ? (
              Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
            ) : bestSellers.length > 0 ? (
              bestSellers.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-gray-500">No best sellers at the moment. Check back soon!</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-32 bg-[#141414] text-white">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
            <div className="lg:w-1/2 relative group">
               <motion.div
                 initial={{ opacity: 0, scale: 0.95 }}
                 whileInView={{ opacity: 1, scale: 1 }}
                 viewport={{ once: true }}
                 className="relative z-10"
               >
                 <img
                   src="https://images.unsplash.com/photo-1594235412407-5903f444f357?q=80&w=1200"
                   alt="Maison Craftsmanship"
                   className="rounded-2xl shadow-2xl grayscale group-hover:grayscale-0 transition-all duration-700"
                 />
               </motion.div>
               <div className="absolute -top-8 -left-8 md:-top-12 md:-left-12 w-32 h-32 md:w-48 md:h-48 bg-brand-gold/10 rounded-full blur-3xl" />
            </div>
            <div className="lg:w-1/2 space-y-6 md:space-y-8">
               <p className="text-brand-gold font-bold uppercase tracking-[0.3em] md:tracking-[0.5em] text-[9px] md:text-[10px]">The Maison Philosophy</p>
               <h2 className="text-3xl md:text-6xl lg:text-7xl font-serif leading-[1.2]">WHERE TRADITION MEETS LUXURY</h2>
               <div className="space-y-4 md:space-y-5 text-white/70 font-light leading-relaxed text-base md:text-lg">
                  <p>UFR Collection was born from a passion for preserving traditional craftsmanship while embracing contemporary luxury. Every piece in our collection is a labor of love, hand-embroidered by masters of the craft and tailored to perfection.</p>
                  <p>Our commitment to quality and authenticity ensures that every garment tells a story of elegance, heritage, and modern sophistication.</p>
               </div>
               <div className="pt-4 md:pt-6">
                 <Link to="/about" className="group relative inline-flex items-center gap-2 md:gap-3 bg-brand-gold text-brand-black px-8 md:px-10 py-3 md:py-4 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] md:tracking-[0.3em] font-black hover:bg-white transition-all duration-500">
                   Discover Our Legacy
                   <ArrowRight size={14} className="md:w-4 md:h-4 group-hover:translate-x-1 transition-transform" />
                 </Link>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Lucky Draw Winners */}
      {promoConfig?.winners && promoConfig.winners.length > 0 && promoConfig.announced && (
        <section className="py-12 px-4 md:py-24 md:px-8 bg-brand-black text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-16 md:p-24 opacity-[0.03] pointer-events-none">
              <Trophy size={300} className="md:w-[400px] md:h-[400px]" />
           </div>
           <div className="container mx-auto max-w-7xl relative z-10">
              <div className="text-center mb-10 md:mb-16 space-y-3 md:space-y-4">
                 <p className="text-brand-gold font-bold uppercase tracking-[0.3em] md:tracking-[0.4em] text-[9px] md:text-[10px]">Grand Archive Results</p>
                 <h2 className="text-2xl md:text-4xl lg:text-5xl font-serif">RECENT LUCKY DRAW WINNERS</h2>
                 <div className="w-16 md:w-24 h-0.5 bg-brand-gold mx-auto mt-4 md:mt-6" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                 {promoConfig.winners.slice(0, 10).map((winner, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: idx * 0.05 }}
                      className={cn(
                        "p-4 md:p-6 rounded-xl md:rounded-2xl border transition-all text-center space-y-3 md:space-y-4",
                        idx === 0 ? "bg-brand-gold/10 border-brand-gold" : "bg-white/5 border-white/10 hover:border-brand-gold/50"
                      )}
                    >
                       <div className={cn(
                         "w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center mx-auto",
                         idx === 0 ? "bg-brand-gold text-black" : "bg-white/10 text-brand-gold"
                       )}>
                          <Trophy size={18} className="md:w-5 md:h-5" />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider text-brand-gold">
                            {idx === 0 ? "GRAND PRIZE" : idx === 1 ? "FIRST RUNNER UP" : idx === 2 ? "SECOND RUNNER UP" : `${idx + 1}th WINNER`}
                          </p>
                          <p className="text-base md:text-xl font-serif text-white font-medium">{winner.tokenNumber}</p>
                          <p className="text-[8px] md:text-[9px] text-white/50 uppercase tracking-[0.15em] md:tracking-[0.2em]">{winner.prize}</p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* Eidi Promotion Popup */}
      <EidiPromoPopup 
        isOpen={showEidiPopup} 
        onClose={() => setShowEidiPopup(false)} 
      />
    </div>
  );
};

export default Home;