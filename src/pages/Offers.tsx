import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { db } from '../services/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { productService, Product } from '../services/productService';
import { offerService, Offer } from '../services/offerService';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { Filter, Search, Tag, Clock, ArrowRight, Sparkles, SlidersHorizontal, ChevronDown, Gift, Percent, Truck, Zap, X } from 'lucide-react';
import { cn } from '../utils/cn';
import { ProductCardSkeleton } from '../components/Skeletons';

const Offers = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOffers, setActiveOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('highest-discount');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ hours: number; mins: number; secs: number } | null>(null);

  // Categories for filtering
  const categories = ['all', 'Formal', 'Casual', 'Party Wear', 'Bridal', 'Luxury Pret', 'Eastern Wear'];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [allProducts, currentOffers] = await Promise.all([
          productService.getAllProducts(),
          offerService.getActiveOffers()
        ]);

        setActiveOffers(currentOffers);

        // ✅ SIRF WOHI PRODUCTS JIN PAR DISCOUNT/OFFER HO
        const offerProductIds = new Set(currentOffers.flatMap(o => o.productIds || []));
        const offerCategories = new Set(currentOffers.flatMap(o => o.categories || []));

        const discountedProducts = allProducts.filter(p => {
          const hasSalePrice = p.salePrice && p.salePrice > 0 && p.salePrice < p.price;
          const hasDirectDiscount = p.discount && p.discount > 0;
          const isInOffer = offerProductIds.has(p.id);
          const isInCategoryOffer = Array.from(offerCategories).some(cat => p.category === cat);
          return hasSalePrice || hasDirectDiscount || isInOffer || isInCategoryOffer;
        });

        // Enrich products with offer label
        const enrichedProducts = discountedProducts.map(p => {
          const relevantOffers = currentOffers.filter(o => 
            (o.productIds || []).includes(p.id) || 
            (o.categories || []).includes(p.category)
          );
          
          let strongestOfferLabel = '';
          let discountPercent = 0;
          
          if (relevantOffers.length > 0) {
            const sortedByValue = [...relevantOffers].sort((a, b) => (b.value || 0) - (a.value || 0));
            strongestOfferLabel = sortedByValue[0].offerLabel;
          } else if (p.salePrice && p.salePrice > 0 && p.salePrice < p.price) {
            discountPercent = Math.round((1 - p.salePrice / p.price) * 100);
            strongestOfferLabel = `${discountPercent}% OFF`;
          } else if (p.discount) {
            strongestOfferLabel = `${p.discount}% OFF`;
          }

          return { ...p, offerLabel: strongestOfferLabel || p.offerLabel, discount: discountPercent || p.discount };
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

  // Countdown timer for flash sale
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      const diff = endOfDay.getTime() - now.getTime();

      if (diff > 0) {
        setTimeLeft({
          hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
          mins: Math.floor((diff / 1000 / 60) % 60),
          secs: Math.floor((diff / 1000) % 60)
        });
      } else {
        setTimeLeft(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Filter and sort logic
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesOfferType = filterType === 'all' || 
      (filterType === 'percentage' && p.offerLabel?.includes('%')) ||
      (filterType === 'bogo' && p.offerLabel?.toLowerCase().includes('bogo')) ||
      (filterType === 'shipping' && p.offerLabel?.toLowerCase().includes('shipping'));
    
    return matchesSearch && matchesCategory && matchesOfferType;
  });

  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === 'highest-discount') {
      return (b.discount || 0) - (a.discount || 0);
    }
    if (sortBy === 'newest') {
      return new Date(b.createdAt?.toDate?.() || 0).getTime() - new Date(a.createdAt?.toDate?.() || 0).getTime();
    }
    if (sortBy === 'price-low') {
      return (a.salePrice || a.price) - (b.salePrice || b.price);
    }
    if (sortBy === 'price-high') {
      return (b.salePrice || b.price) - (a.salePrice || a.price);
    }
    return 0;
  });

  const filterOptions = [
    { id: 'all', label: 'All Offers', icon: Sparkles },
    { id: 'percentage', label: 'Percentage OFF', icon: Percent },
    { id: 'bogo', label: 'Buy One Get One', icon: Gift },
    { id: 'shipping', label: 'Free Shipping', icon: Truck }
  ];

  const sortOptions = [
    { value: 'highest-discount', label: 'Highest Discount' },
    { value: 'newest', label: 'Newest Arrivals' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' }
  ];

  return (
    <div className="min-h-screen bg-white">
      <SEO 
        title="Hot Offers & Deals | UFR Collection - Exclusive Discounts on Luxury Fashion"
        description="Shop the best deals on luxury Pakistani fashion. Limited time offers on formal wear, party dresses, and bridal collections. Save up to 50% off!"
      />

      {/* Hero Banner */}
      <section className="relative min-h-[50vh] md:h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-black to-brand-black/95">
          <motion.div 
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
            className="w-full h-full opacity-30"
          >
            <img 
              src="https://images.pexels.com/photos/1445209/pexels-photo-1445209.jpeg?w=1600&h=900&fit=crop" 
              alt="UFR Collection Offers" 
              className="w-full h-full object-cover"
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-transparent to-brand-black/50" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <span className="text-[9px] md:text-[10px] uppercase tracking-[0.3em] font-black text-brand-gold border-b border-brand-gold pb-2 inline-block">
              Limited Time Only
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif text-white leading-tight">
              HOT OFFERS
              <br />
              <span className="text-brand-gold italic">& DEALS</span>
            </h1>
            <p className="text-white/60 text-xs md:text-sm uppercase tracking-[0.2em] max-w-2xl mx-auto font-light">
              Exclusive discounts on our luxury collection. Shop now before they're gone!
            </p>
            
            {/* Countdown Timer */}
            {timeLeft && (
              <div className="flex justify-center gap-3 md:gap-4 mt-8">
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 md:px-6 md:py-3 border border-white/20">
                  <div className="text-xl md:text-3xl font-bold text-white tabular-nums">{timeLeft.hours.toString().padStart(2, '0')}</div>
                  <div className="text-[8px] md:text-[10px] uppercase text-white/50">Hours</div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white self-center">:</div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 md:px-6 md:py-3 border border-white/20">
                  <div className="text-xl md:text-3xl font-bold text-white tabular-nums">{timeLeft.mins.toString().padStart(2, '0')}</div>
                  <div className="text-[8px] md:text-[10px] uppercase text-white/50">Minutes</div>
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white self-center">:</div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl px-4 py-2 md:px-6 md:py-3 border border-white/20">
                  <div className="text-xl md:text-3xl font-bold text-white tabular-nums">{timeLeft.secs.toString().padStart(2, '0')}</div>
                  <div className="text-[8px] md:text-[10px] uppercase text-white/50">Seconds</div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Toolbar */}
      <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-brand-beige shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Filter Chips - Desktop */}
            <div className="hidden md:flex items-center gap-2 flex-wrap">
              {filterOptions.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setFilterType(opt.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-[9px] uppercase font-bold tracking-wider transition-all",
                    filterType === opt.id 
                      ? "bg-brand-black text-white" 
                      : "bg-brand-cream text-brand-grey hover:bg-brand-beige"
                  )}
                >
                  <opt.icon size={12} />
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Mobile Filter Button */}
            <button 
              onClick={() => setShowMobileFilters(true)}
              className="md:hidden flex items-center gap-2 bg-brand-cream px-4 py-2 rounded-full text-[10px] font-bold"
            >
              <SlidersHorizontal size={14} /> Filters
              {(filterType !== 'all' || selectedCategory !== 'all' || searchTerm) && (
                <span className="w-4 h-4 bg-brand-gold text-black rounded-full text-[8px] flex items-center justify-center">
                  {Number(filterType !== 'all') + Number(selectedCategory !== 'all') + (searchTerm ? 1 : 0)}
                </span>
              )}
            </button>

            {/* Search & Sort */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-grow md:w-64">
                <input 
                  className="w-full bg-brand-cream border border-brand-beige rounded-full py-2.5 pl-9 pr-4 text-xs focus:outline-none focus:border-brand-gold" 
                  placeholder="Search offers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
              </div>
              
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-brand-cream border border-brand-beige rounded-full py-2.5 px-4 pr-8 text-[10px] font-bold uppercase tracking-wider focus:outline-none focus:border-brand-gold appearance-none cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters Display */}
          {(filterType !== 'all' || selectedCategory !== 'all' || searchTerm) && (
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-brand-beige">
              <span className="text-[9px] text-brand-grey">Active filters:</span>
              {filterType !== 'all' && (
                <span className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                  {filterOptions.find(f => f.id === filterType)?.label}
                  <button onClick={() => setFilterType('all')}><X size={10} /></button>
                </span>
              )}
              {selectedCategory !== 'all' && (
                <span className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                  {selectedCategory}
                  <button onClick={() => setSelectedCategory('all')}><X size={10} /></button>
                </span>
              )}
              {searchTerm && (
                <span className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                  Search: {searchTerm}
                  <button onClick={() => setSearchTerm('')}><X size={10} /></button>
                </span>
              )}
              <button 
                onClick={() => { setFilterType('all'); setSelectedCategory('all'); setSearchTerm(''); }}
                className="text-[9px] text-brand-gold hover:underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filters Modal */}
      <AnimatePresence>
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center">
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="bg-white w-full max-h-[80vh] rounded-t-2xl overflow-hidden"
            >
              <div className="p-4 border-b border-brand-beige flex justify-between items-center">
                <h3 className="font-serif text-xl">Filters</h3>
                <button onClick={() => setShowMobileFilters(false)} className="p-2"><X size={20} /></button>
              </div>
              <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)] space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3">Offer Type</h4>
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map(opt => (
                      <button
                        key={opt.id}
                        onClick={() => { setFilterType(opt.id); setShowMobileFilters(false); }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold",
                          filterType === opt.id ? "bg-brand-black text-white" : "bg-brand-cream"
                        )}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider mb-3">Category</h4>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => { setSelectedCategory(cat); setShowMobileFilters(false); }}
                        className={cn(
                          "px-4 py-2 rounded-full text-[10px] font-bold capitalize",
                          selectedCategory === cat ? "bg-brand-black text-white" : "bg-brand-cream"
                        )}
                      >
                        {cat === 'all' ? 'All' : cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Product Grid */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(8)].map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        ) : sortedProducts.length > 0 ? (
          <>
            <div className="flex justify-between items-center mb-6">
              <p className="text-[10px] text-brand-grey uppercase tracking-wider">
                Showing {sortedProducts.length} {sortedProducts.length === 1 ? 'offer' : 'offers'}
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              <AnimatePresence mode="popLayout">
                {sortedProducts.map((product) => (
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
          </>
        ) : (
          <div className="py-20 md:py-32 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-brand-cream flex items-center justify-center mx-auto">
              <Tag size={32} className="text-brand-gold opacity-30" />
            </div>
            <h2 className="text-2xl md:text-3xl font-serif">No active offers at the moment</h2>
            <p className="text-brand-grey text-sm max-w-md mx-auto">
              Check back soon for exclusive deals and discounts on our luxury collection.
            </p>
            <Link 
              to="/shop"
              className="inline-block mt-4 text-brand-gold text-[10px] uppercase font-bold tracking-wider border-b border-brand-gold pb-1 hover:border-brand-black transition-colors"
            >
              Browse All Products
            </Link>
          </div>
        )}
      </div>

      {/* Bottom CTA Banner */}
      <section className="container mx-auto px-4 mb-12 max-w-7xl">
        <div className="bg-gradient-to-r from-brand-black to-brand-black/90 text-white rounded-2xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-gold/10 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-gold/5 rounded-full blur-[80px]" />
          
          <div className="relative z-10 text-center space-y-5">
            <Sparkles size={24} className="mx-auto text-brand-gold" />
            <h3 className="text-2xl md:text-3xl font-serif">Notified for Future Offers?</h3>
            <p className="text-white/60 text-sm max-w-md mx-auto">
              Subscribe to get exclusive access to our seasonal sales and flash deals.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
              <input 
                type="email"
                placeholder="Your email address"
                className="flex-1 bg-white/10 border border-white/20 rounded-full px-5 py-3 text-sm placeholder:text-white/40 focus:outline-none focus:border-brand-gold"
              />
              <button className="bg-brand-gold text-black px-6 py-3 rounded-full text-[10px] font-bold uppercase tracking-wider hover:bg-white transition">
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Offers;