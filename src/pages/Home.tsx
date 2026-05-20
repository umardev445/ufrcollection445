import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'motion/react';
import { ChevronLeft, ChevronRight, ArrowRight, Instagram, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories, heroSlides as defaultHeroSlides } from '../constants/demoData';
import ProductCard from '../components/ProductCard';
import { cn } from '../utils/cn';
import { productService, Product } from '../services/productService';
import { homepageService, HomepageConfig } from '../services/homepageService';
import SEO from '../components/SEO';
import { ProductCardSkeleton } from '../components/Skeletons';

import { luckyDrawService, LuckyDrawConfig } from '../services/luckyDrawService';
import { Trophy, Ticket, Clock, Star } from 'lucide-react';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [promoConfig, setPromoConfig] = useState<LuckyDrawConfig | null>(null);
  
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  useEffect(() => {
    const fetchHomeData = async () => {
      setLoading(true);
      try {
        const [latest, all, homeConfig, luckyPromo] = await Promise.all([
          productService.getLatestProducts(8),
          productService.getAllProducts(),
          homepageService.getConfig(),
          luckyDrawService.getPromotionConfig()
        ]);
        
        setNewArrivals(latest);
        setBestSellers(all.filter(p => p.isBestSeller).slice(0, 8));
        setConfig(homeConfig);
        setPromoConfig(luckyPromo);
      } catch (err) {
        console.error("Failed to fetch home data", err);
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
    }, 5000); // 5 seconds autoplay
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
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black/75 z-10" />
                <motion.div
                  className="w-full h-full"
                  initial={{ scale: 1.1 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 10, ease: "linear" }}
                >
                  <motion.img
                    style={{ y }}
                    src={slide.image || undefined}
                    alt={slide.title}
                    className="w-full h-full object-cover"
                  />
                </motion.div>
                
                <div className="absolute inset-0 z-20 flex items-center justify-center text-center px-6 mt-16 md:mt-0">
                  <motion.div 
                    style={{ opacity }}
                    className="max-w-5xl"
                  >
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
                        className="text-brand-gold font-bold uppercase text-[10px] md:text-sm"
                      >
                        {slide.subtitle}
                      </motion.p>
                      <h1 className="text-white text-4xl md:text-8xl lg:text-9xl font-serif leading-[1.1] tracking-tight">
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
                          className="group relative inline-flex items-center justify-center overflow-hidden bg-white text-brand-black px-10 md:px-16 py-4 md:py-6 rounded-full text-[10px] md:text-xs uppercase tracking-[0.2em] font-black luxury-shadow hover:text-white transition-colors duration-500"
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
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3">
          {activeSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="group relative p-2"
            >
              <div className={cn(
                "h-1.5 transition-all duration-500 rounded-full",
                index === currentSlide ? "w-8 bg-brand-gold" : "w-1.5 bg-white/40 hover:bg-white/70"
              )} />
            </button>
          ))}
        </div>

        {/* Side Controls */}
        <button 
          onClick={prevSlide}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-30 w-10 md:w-14 h-10 md:h-14 rounded-full border border-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white hover:text-brand-black transition-all"
        >
          <ChevronLeft size={24} />
        </button>
        <button 
          onClick={nextSlide}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-30 w-10 md:w-14 h-10 md:h-14 rounded-full border border-white/20 text-white flex items-center justify-center backdrop-blur-sm hover:bg-white hover:text-brand-black transition-all"
        >
          <ChevronRight size={24} />
        </button>
      </section>

      {/* Lucky Draw Promotion Banner */}
      {promoConfig?.status === 'active' && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="bg-brand-gold text-brand-black py-4 overflow-hidden relative"
        >
           <div className="flex whitespace-nowrap animate-marquee">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-8 mx-8">
                   <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                      <Trophy size={16} /> WIN iPHONE 17 & HONDA 70
                   </p>
                   <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                   <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                      <Ticket size={16} /> USE JAZZCASH ADVANCE FOR TOKEN
                   </p>
                   <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                   <p className="text-[10px] md:text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3">
                      <Star size={16} /> NEXT DRAW COMMENCING SOON
                   </p>
                   <span className="w-1.5 h-1.5 bg-brand-black rounded-full" />
                </div>
              ))}
           </div>
        </motion.div>
      )}

      {/* SHOP BY CATEGORY */}
      <section className="py-12 px-4 md:py-32 md:px-8 bg-white">
        <div className="container mx-auto">
          <div className="text-center mb-10 md:mb-24 space-y-4">
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]"
            >
              Exquisite Selection
            </motion.p>
            <h2 className="text-2xl md:text-6xl font-serif uppercase tracking-tight">SHOP BY CATEGORY</h2>
            <div className="w-24 h-1 bg-brand-gold mx-auto mt-6" />
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-10">
            {categories.map((cat, i) => (
              <motion.div
                key={cat.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group"
              >
                <Link to={`/shop?category=${cat.name}`} className="block text-center">
                  <div className="aspect-[4/5] overflow-hidden rounded-[2.5rem] mb-6 relative luxury-shadow-sm group-hover:luxury-shadow-lg transition-all duration-500 bg-brand-cream">
                    <img
                      src={cat.image || undefined}
                      alt={cat.name}
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=400&h=500&fit=crop";
                      }}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/10 transition-all duration-500" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                      <div className="bg-white/90 backdrop-blur-sm text-brand-black w-10 h-10 rounded-full flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                        <ArrowRight size={18} />
                      </div>
                    </div>
                  </div>
                  <h3 className="font-serif text-xl tracking-wide group-hover:text-brand-gold transition-colors duration-300">{cat.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-brand-grey mt-2 font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300">View Collection</p>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Dynamic Sections (from config) */}
      {config?.sections?.sort((a,b) => a.order - b.order).map((section) => {
        if (!section.enabled) return null;
        if (section.type === 'categories') return null; // We handled categories manually above as per request

        switch (section.type) {
          case 'new-arrivals':
            return (
              <section key={section.id} className="py-12 px-4 md:py-32 md:px-8 bg-brand-cream relative overflow-hidden">
                <div className="container mx-auto relative z-10">
                  <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-20 gap-8">
                    <div className="max-w-xl space-y-4">
                      <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">{section.subheading || 'The Latest Obsessions'}</p>
                      <h2 className="text-3xl md:text-6xl font-serif">{section.heading}</h2>
                    </div>
                    <Link to="/shop" className="group flex items-center gap-4 text-xs uppercase tracking-[0.3em] font-black border-b-2 border-brand-black pb-2 hover:text-brand-gold hover:border-brand-gold transition-all duration-500">
                      Explore Full Boutique <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-12">
                    {loading ? (
                      Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                    ) : newArrivals.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
                <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[20vw] font-serif text-black/[0.02] whitespace-nowrap pointer-events-none select-none">
                  NEW SEASON
                </div>
              </section>
            );

          case 'best-sellers':
            return (
              <section key={section.id} className="py-12 px-4 md:py-32 md:px-8 bg-white">
                <div className="container mx-auto">
                  <div className="text-center mb-10 md:mb-24 space-y-4">
                    <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">Iconic Favorites</p>
                    <h2 className="text-3xl md:text-6xl font-serif">{section.heading}</h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-12">
                    {loading ? (
                      Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
                    ) : bestSellers.map((product) => (
                      <ProductCard key={product.id} product={product} />
                    ))}
                  </div>
                </div>
              </section>
            );

          case 'story':
            return (
              <section key={section.id} className="py-40 bg-[#141414] text-white">
                <div className="container mx-auto px-4">
                  <div className="flex flex-col lg:flex-row items-center gap-24">
                    <div className="lg:w-1/2 relative group">
                       <motion.div
                         initial={{ opacity: 0, scale: 0.9 }}
                         whileInView={{ opacity: 1, scale: 1 }}
                         viewport={{ once: true }}
                         className="relative z-10"
                       >
                         <img
                           src="https://images.unsplash.com/photo-1594235412407-5903f444f357?q=80&w=1200"
                           alt="Maison Craftsmanship"
                           className="rounded-2xl luxury-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-1000"
                         />
                       </motion.div>
                       <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-gold/10 rounded-full blur-3xl" />
                    </div>
                    <div className="lg:w-1/2 space-y-10">
                       <p className="text-brand-gold font-bold uppercase tracking-[0.5em] text-[10px]">The Maison Philosophy</p>
                       <h2 className="text-4xl md:text-7xl font-serif leading-[1.1]">{section.heading}</h2>
                       <div className="space-y-6 text-white/70 font-light leading-relaxed text-lg italic">
                          <p>UFR Collection was born from a passion for preserving traditional craftsmanship while embracing contemporary luxury. Every piece in our collection is a labor of love, hand-embroidered by masters of the craft and tailored to perfection.</p>
                       </div>
                       <div className="pt-8">
                         <Link to="/about" className="group relative inline-flex items-center gap-4 bg-brand-gold text-brand-black px-12 py-5 rounded-full text-[10px] uppercase tracking-[0.3em] font-black hover:bg-white transition-all duration-500">
                           Discover Our Legacy
                           <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                         </Link>
                       </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* Default Fallback Content if no config sections */}
      {(!config || config.sections.length === 0) && !loading && (
        <>
          {/* Default New Arrivals fallback */}
          <section className="py-12 px-4 md:py-32 md:px-8 bg-brand-cream relative overflow-hidden">
            <div className="container mx-auto relative z-10">
              <div className="flex flex-col md:flex-row justify-between items-end mb-10 md:mb-20 gap-8">
                <div className="max-w-xl space-y-4">
                  <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">Timeless Classics</p>
                  <h2 className="text-3xl md:text-6xl font-serif uppercase tracking-tighter">NEW ARRIVALS</h2>
                </div>
                <Link to="/shop" className="group flex items-center gap-4 text-xs uppercase tracking-[0.3em] font-black border-b-2 border-brand-black pb-2 hover:text-brand-gold hover:border-brand-gold transition-all duration-500">
                  Explore Full Boutique <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </Link>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-12">
                {newArrivals.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          </section>

          {/* Default Story fallback */}
          <section className="py-12 px-4 md:py-40 md:px-8 bg-[#141414] text-white">
            <div className="container mx-auto">
              <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                <div className="lg:w-1/2 relative group">
                   <img
                     src="https://images.unsplash.com/photo-1594235412407-5903f444f357?q=80&w=1200"
                     alt="Maison"
                     className="rounded-2xl luxury-shadow-lg grayscale group-hover:grayscale-0 transition-all duration-1000"
                   />
                </div>
                <div className="lg:w-1/2 space-y-6 md:space-y-10">
                   <p className="text-brand-gold font-bold uppercase tracking-[0.5em] text-[10px]">The Maison Philosophy</p>
                   <h2 className="text-2xl md:text-7xl font-serif leading-[1.1]">WHERE TRADITION MEETS LUXURY</h2>
                   <p className="text-white/70 font-light leading-relaxed text-sm md:text-lg italic">
                     UFR Collection. Crafting legacies since 2010.
                   </p>
                   <Link to="/about" className="group relative inline-flex items-center gap-4 bg-brand-gold text-brand-black px-12 py-5 rounded-full text-[10px] uppercase tracking-[0.3em] font-black hover:bg-white transition-all duration-500">
                     Explore Our Story
                     <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                   </Link>
                </div>
              </div>
            </div>
          </section>
        </>
      )}

      {/* Recent Lucky Draw Winners */}
      {promoConfig?.winners && promoConfig.winners.length > 0 && promoConfig.announced && (
        <section className="py-12 px-4 md:py-32 md:px-8 bg-brand-black text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 p-24 opacity-[0.03] pointer-events-none">
              <Trophy size={400} />
           </div>
           <div className="container mx-auto relative z-10">
              <div className="text-center mb-10 md:mb-16 space-y-4">
                 <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">Grand Archive Results</p>
                 <h2 className="text-2xl md:text-5xl font-serif">RECENT LUCKY DRAW WINNERS</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
                 {promoConfig.winners.slice(0, 10).map((winner, idx) => (
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, scale: 0.95 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "p-4 md:p-8 rounded-2xl border transition-all text-center space-y-4",
                        idx === 0 ? "bg-brand-gold/10 border-brand-gold md:col-span-1 lg:col-span-1" : "bg-white/5 border-white/10"
                      )}
                    >
                       <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto text-brand-gold">
                          <Trophy size={20} />
                       </div>
                       <div className="space-y-1">
                          <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-brand-gold">
                            {idx === 0 ? "1st Winner" : idx === 1 ? "2nd Winner" : idx === 2 ? "3rd Winner" : `${idx + 1}th Winner`}
                          </p>
                          <p className="text-lg md:text-xl font-serif text-white">{winner.tokenNumber}</p>
                          <p className="text-[9px] md:text-[10px] text-white/50 uppercase tracking-[0.2em]">{winner.prize}</p>
                       </div>
                    </motion.div>
                 ))}
              </div>
           </div>
        </section>
      )}

      {/* Instagram Feed Section */}
      {config?.sections?.find(s => (s.id === 'instagram' || s.type === 'instagram') && s.enabled) && (
        <section className="py-12 px-4 md:py-32 md:px-8 bg-white">
          <div className="container mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 md:mb-16 gap-6">
              <div className="text-center md:text-left space-y-4">
                 <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">Follow Our Journey</p>
                 <h2 className="text-2xl md:text-5xl font-serif">@UFRCOLLECTION</h2>
              </div>
              <a 
                href="https://instagram.com/ufrcollection" 
                target="_blank" 
                rel="noopener noreferrer"
                className="px-8 py-4 md:px-10 md:py-5 border border-brand-black rounded-full text-[10px] uppercase font-black tracking-widest hover:bg-brand-black hover:text-white transition-all flex items-center gap-3"
              >
                <Instagram size={16} />
                Visit Digital Archive
              </a>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="group relative aspect-square overflow-hidden bg-brand-cream cursor-pointer"
                >
                  <img 
                    src={`https://images.unsplash.com/photo-${1580000000000 + (i * 1000)}?q=80&w=800&h=800&fit=crop`}
                    alt="Instagram Archive"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-brand-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Eye className="text-white" size={24} />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
