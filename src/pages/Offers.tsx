import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { productService, Product } from '../services/productService';
import { offerService, Offer } from '../services/offerService';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { Filter, Search, Tag, Clock, ArrowRight, Sparkles, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { cn } from '../utils/cn';
import { ProductCardSkeleton } from '../components/Skeletons';

const Offers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('highest-discount');
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, mins: number, secs: number } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, currentOffers] = await Promise.all([
          productService.getAllProducts(),
          offerService.getActiveOffers()
        ]);

        setActiveOffers(currentOffers);

        // Find products that have a discount > 0 OR are part of an active offer
        const offerProductIds = new Set(currentOffers.flatMap(o => o.productIds || []));
        const offerCategories = new Set(currentOffers.flatMap(o => o.categories || []));

        const discountedProducts = allProducts.filter(p => {
          const hasSalePrice = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
          const hasDirectDiscount = p.discount && p.discount > 0;
          const isInOffer = offerProductIds.has(p.id);
          const isInCategoryOffer = Array.from(offerCategories).some(cat => p.category === cat);
          return hasSalePrice || hasDirectDiscount || isInOffer || isInCategoryOffer;
        });

        // Enrich products with their strongest offer badge
        const enrichedProducts = discountedProducts.map(p => {
          const relevantOffers = currentOffers.filter(o => 
            (o.productIds || []).includes(p.id) || 
            (o.categories || []).includes(p.category)
          );
          
          let strongestOfferLabel = '';
          if (relevantOffers.length > 0) {
            // Priority given to labeled offers
            const sortedByValue = [...relevantOffers].sort((a, b) => (b.value || 0) - (a.value || 0));
            strongestOfferLabel = sortedByValue[0].offerLabel;
          } else if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) {
            const discountPct = Math.round((1 - p.salePrice / p.price) * 100);
            strongestOfferLabel = `${discountPct}% OFF`;
          } else if (p.discount) {
            strongestOfferLabel = `${p.discount}% OFF`;
          }

          return { ...p, offerLabel: strongestOfferLabel || p.offerLabel };
        });

        setProducts(enrichedProducts);
      } catch (err) {
        console.error("Failed to fetch boutique offers", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Simple countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      const target = new Date();
      target.setHours(23, 59, 59); // Assume offers refresh daily for demo
      const now = new Date();
      const diff = target.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60)
        });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const sortedProducts = [...products].sort((a, b) => {
    if (sortBy === 'highest-discount') {
      return (b.discount || 0) - (a.discount || 0);
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime();
    }
    return 0;
  });

  const filteredProducts = sortedProducts.filter(p => {
    if (filterType === 'all') return true;
    // Map offer types to friendly categories
    if (filterType === 'percentage') return p.offerLabel?.includes('%');
    if (filterType === 'bogo') return p.offerLabel?.toLowerCase().includes('bogo');
    if (filterType === 'shipping') return p.offerLabel?.toLowerCase().includes('shipping');
    return true;
  });

  return (
    <div className="min-h-screen pb-20">
      <SEO title="Luxury Offers & Incentives" description="Curated selections from our archive at exceptional value." />

      {/* Hero Banner */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-brand-black">
          <motion.div 
            initial={{ scale: 1.1, opacity: 0.5 }}
            animate={{ scale: 1, opacity: 0.3 }}
            transition={{ duration: 10, repeat: Infinity, repeatType: 'reverse' }}
            className="w-full h-full"
          >
            <img 
              src="https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2071&auto=format&fit=crop" 
              alt="Maison Offers" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/50" />
        </div>

        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <span className="text-[10px] uppercase tracking-[0.4em] font-black text-brand-gold border-b border-brand-gold pb-2 inline-block">Maison Archives</span>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-white leading-none">HOT OFFERS <br/><span className="italic">& DEALS</span></h1>
            <p className="text-white/60 text-xs uppercase tracking-[0.2em] max-w-lg mx-auto font-light leading-loose">
              Exquisite masterworks from our previous archives, now attainable for the discerning enthusiast. Once dissolved, they shall not return.
            </p>
            
            {timeLeft && (
              <div className="flex justify-center gap-4 mt-12">
                 {[
                   { label: 'Hrs', val: timeLeft.hours.toString().padStart(2, '0') },
                   { label: 'Min', val: timeLeft.mins.toString().padStart(2, '0') },
                   { label: 'Sec', val: timeLeft.secs.toString().padStart(2, '0') }
                 ].map(t => (
                   <div key={t.label} className="w-16 h-16 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md flex flex-col items-center justify-center">
                      <span className="text-xl font-bold text-white tabular-nums">{t.val}</span>
                      <span className="text-[8px] uppercase tracking-widest text-white/50">{t.label}</span>
                   </div>
                 ))}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md border-y border-brand-beige luxury-shadow-sm">
         <div className="container mx-auto px-6 py-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-8">
               <div className="flex items-center gap-2 text-brand-gold">
                  <Sparkles size={16} />
                  <span className="text-[10px] uppercase font-black tracking-widest">{products.length} CURATED DEALS</span>
               </div>
               
               <div className="hidden lg:flex items-center gap-2 overflow-x-auto luxury-scrollbar">
                  {[
                    { id: 'all', label: 'All Incentives' },
                    { id: 'percentage', label: 'Direct % Off' },
                    { id: 'bogo', label: 'BOGO Rewards' },
                    { id: 'shipping', label: 'Free Shipping' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setFilterType(tab.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-widest transition-all",
                        filterType === tab.id ? "bg-brand-black text-white" : "text-brand-grey hover:bg-brand-cream"
                      )}
                    >
                      {tab.label}
                    </button>
                  ))}
               </div>
            </div>

            <div className="flex items-center gap-6 w-full md:w-auto">
               <div className="relative flex-grow md:flex-grow-0">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-brand-cream border border-brand-beige rounded-full py-3 pl-6 pr-12 text-[10px] uppercase font-bold tracking-widest focus:outline-none focus:border-brand-gold w-full md:w-64"
                  >
                     <option value="highest-discount">Sort: Highest Discount</option>
                     <option value="newest">Sort: Newly Archived</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-brand-grey pointer-events-none" />
               </div>
               <button className="p-3 bg-brand-black text-white rounded-full lg:hidden">
                  <SlidersHorizontal size={18} />
               </button>
            </div>
         </div>
      </div>

      {/* Product Grid */}
      <div className="container mx-auto px-4 mt-12">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-8">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-x-6 md:gap-y-12">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  key={product.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="py-40 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-8">
               <Tag size={32} className="text-brand-gold opacity-30" />
            </div>
            <h2 className="text-3xl font-serif text-brand-black">No active offers at the moment</h2>
            <p className="text-brand-grey text-xs uppercase tracking-widest font-light max-w-xs mx-auto">Our masterworks are currently at standard valuation. Please return soon for our next seasonal archives.</p>
            <button 
              onClick={() => { setFilterType('all'); }}
              className="text-[10px] uppercase font-bold tracking-[0.3em] text-brand-gold border-b border-brand-gold pb-2 pt-8"
            >
              Reset All Filters
            </button>
          </div>
        )}
      </div>

      {/* Bottom Banner */}
      <section className="container mx-auto px-6 mt-32">
         <div className="bg-brand-black text-white rounded-[2rem] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-gold/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-gold/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2" />
            
            <motion.div 
               whileInView={{ opacity: 1, y: 0 }}
               initial={{ opacity: 0, y: 20 }}
               className="relative z-10 space-y-8"
            >
               <div className="w-16 h-1 bg-brand-gold mx-auto" />
               <h2 className="text-4xl md:text-6xl font-serif leading-tight">THE SIGNATURE<br/>PRIVILEGE</h2>
               <p className="text-white/60 text-xs uppercase tracking-[0.3em] font-light max-w-xl mx-auto leading-relaxed">
                  Subscribers to the Maison receive advanced notification of all archive dissolutions and exclusive early access to private offerings.
               </p>
               <div className="pt-8">
                  <button className="bg-brand-gold text-brand-black px-12 py-5 rounded-full text-[10px] uppercase font-bold tracking-[0.4em] hover:scale-105 transition-transform shadow-2xl shadow-brand-gold/20">
                     Join The Inner Circle
                  </button>
               </div>
            </motion.div>
         </div>
      </section>
    </div>
  );
};

export default Offers;
