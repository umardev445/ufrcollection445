import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, X, Star, Filter, Grid3x3, List, TrendingUp, DollarSign, Clock, Sparkles } from 'lucide-react';
import { categories } from '../constants/demoData';
import { productService, Product } from '../services/productService';
import { offerService } from '../services/offerService';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { ProductCardSkeleton } from '../components/Skeletons';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

const Shop = () => {
  const [searchParams] = useSearchParams();
  const urlCategory = searchParams.get('category');
  const urlSort = searchParams.get('sort');

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [sortBy, setSortBy] = useState(urlSort === 'price-low' ? 'price-low' : urlSort === 'price-high' ? 'price-high' : 'newest');
  const [showFilters, setShowFilters] = useState(false);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedFabrics, setSelectedFabrics] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const fabrics = ['Lawn', 'Chiffon', 'Silk', 'Velvet', 'Organza', 'Cotton'];
  const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

  useEffect(() => {
    const fetchProductsAndOffers = async () => {
      setLoading(true);
      try {
        const [data, currentOffers] = await Promise.all([
          productService.getAllProducts(),
          offerService.getActiveOffers()
        ]);

        const enrichedProducts = data.map(p => {
          const relevantOffers = currentOffers.filter(o => 
            (o.productIds || []).includes(p.id) || 
            (o.categories || []).includes(p.category)
          );
          
          let strongestOfferLabel = '';
          if (relevantOffers.length > 0) {
            const sortedByValue = [...relevantOffers].sort((a, b) => (b.value || 0) - (a.value || 0));
            strongestOfferLabel = sortedByValue[0].offerLabel;
          }

          // Calculate discount from salePrice
          const discountPercent = p.salePrice && p.salePrice < p.price 
            ? Math.round((1 - p.salePrice / p.price) * 100) 
            : 0;

          return { 
            ...p, 
            offerLabel: strongestOfferLabel || (discountPercent > 0 ? `${discountPercent}% OFF` : undefined),
            discount: discountPercent
          };
        });

        setProducts(enrichedProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProductsAndOffers();
  }, []);

  useEffect(() => {
    if (urlCategory) {
      setSelectedCategory(urlCategory);
    }
  }, [urlCategory]);

  const toggleFabric = (fabric: string) => {
    setSelectedFabrics(prev => 
      prev.includes(fabric) ? prev.filter(f => f !== fabric) : [...prev, fabric]
    );
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev => 
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const clearAllFilters = () => {
    setSearch('');
    setSelectedCategory(null);
    setSelectedFabrics([]);
    setSelectedSizes([]);
    setPriceRange([0, 100000]);
    setSortBy('newest');
  };

  const hasActiveFilters = search || selectedCategory || selectedFabrics.length > 0 || selectedSizes.length > 0 || priceRange[0] > 0 || priceRange[1] < 100000;

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      const matchesFabric = selectedFabrics.length === 0 || (p.fabric && selectedFabrics.includes(p.fabric));
      const productPrice = p.salePrice || p.price;
      const matchesPrice = productPrice >= priceRange[0] && productPrice <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesFabric && matchesPrice;
    });

    if (sortBy === 'price-low') result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    if (sortBy === 'price-high') result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    if (sortBy === 'newest') result.sort((a, b) => (b.createdAt?.toDate?.()?.getTime() || 0) - (a.createdAt?.toDate?.()?.getTime() || 0));
    
    return result;
  }, [products, search, selectedCategory, sortBy, selectedFabrics, selectedSizes, priceRange]);

  const sortOptions = [
    { value: 'newest', label: 'Newest Arrivals', icon: <Clock size={12} /> },
    { value: 'price-low', label: 'Price: Low to High', icon: <DollarSign size={12} /> },
    { value: 'price-high', label: 'Price: High to Low', icon: <DollarSign size={12} /> }
  ];

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title={`${selectedCategory || 'Shop'} | Luxury Collection | UFR Collection`}
        description="Explore our exquisite collection of Pakistani luxury fashion. Browse through luxury pret, bridal wear, and seasonal arrivals."
      />
      
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-brand-cream to-white pt-16 md:pt-24 pb-12 md:pb-16 border-b border-brand-beige">
        <div className="container mx-auto px-4 text-center max-w-7xl">
          <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-3 md:mb-4">Discover Luxury</p>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-4 md:mb-6">
            {selectedCategory ? selectedCategory : 'Our Collections'}
          </h1>
          <p className="text-brand-grey text-xs md:text-sm max-w-2xl mx-auto">
            {selectedCategory 
              ? `Explore our exquisite ${selectedCategory.toLowerCase()} collection, crafted with passion and precision.`
              : 'Discover the epitome of luxury with our carefully curated collections.'}
          </p>
          <nav className="flex items-center justify-center gap-2 text-[9px] md:text-[10px] uppercase tracking-wider text-brand-grey mt-6 md:mt-8">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span>/</span>
            <span className="text-brand-black font-bold">Shop</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-brand-gold">{selectedCategory}</span>
              </>
            )}
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-3 w-full md:w-auto">
             <button
               onClick={() => setShowFilters(!showFilters)}
               className="flex items-center gap-2 px-4 md:px-5 py-2.5 border border-brand-beige rounded-full text-[9px] md:text-[10px] uppercase tracking-wider font-bold hover:bg-brand-black hover:text-white transition-all"
             >
               <Filter size={14} />
               Filters
               {hasActiveFilters && (
                 <span className="w-4 h-4 bg-brand-gold text-black rounded-full text-[8px] flex items-center justify-center">
                   {selectedFabrics.length + selectedSizes.length + (selectedCategory ? 1 : 0) + (search ? 1 : 0)}
                 </span>
               )}
             </button>
             
             <div className="relative flex-grow md:w-72">
               <input
                 type="text"
                 placeholder="Search products..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-9 pr-4 py-2.5 bg-brand-cream/50 border border-brand-beige rounded-full text-sm focus:outline-none focus:border-brand-gold transition-colors"
               />
               <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
               {search && (
                 <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                   <X size={12} className="text-brand-grey hover:text-red-500" />
                 </button>
               )}
             </div>
          </div>

          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            {/* View Toggle - Mobile */}
            <div className="flex items-center gap-2 md:hidden">
              <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-lg", viewMode === 'grid' ? "bg-brand-gold text-black" : "bg-brand-cream")}>
                <Grid3x3 size={16} />
              </button>
              <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-lg", viewMode === 'list' ? "bg-brand-gold text-black" : "bg-brand-cream")}>
                <List size={16} />
              </button>
            </div>
            
            <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-brand-grey font-medium">
              {filteredProducts.length} {filteredProducts.length === 1 ? 'Product' : 'Products'}
            </p>
            
            <div className="relative">
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="appearance-none bg-transparent pl-3 md:pl-4 pr-7 md:pr-8 py-2 text-[9px] md:text-[10px] uppercase tracking-wider font-bold border-b border-brand-black focus:outline-none cursor-pointer"
               >
                 {sortOptions.map(opt => (
                   <option key={opt.value} value={opt.value}>{opt.label}</option>
                 ))}
               </select>
               <ChevronDown size={12} className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap items-center gap-2 mb-6 pb-4 border-b border-brand-beige">
            <span className="text-[8px] md:text-[9px] text-brand-grey uppercase tracking-wider">Active Filters:</span>
            {selectedCategory && (
              <span className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                {selectedCategory}
                <button onClick={() => setSelectedCategory(null)}><X size={10} /></button>
              </span>
            )}
            {selectedFabrics.map(f => (
              <span key={f} className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                {f}
                <button onClick={() => toggleFabric(f)}><X size={10} /></button>
              </span>
            ))}
            {(priceRange[0] > 0 || priceRange[1] < 100000) && (
              <span className="bg-brand-cream px-2 py-1 rounded-full text-[9px] flex items-center gap-1">
                Rs. {priceRange[0]} - Rs. {priceRange[1]}
                <button onClick={() => setPriceRange([0, 100000])}><X size={10} /></button>
              </span>
            )}
            <button onClick={clearAllFilters} className="text-[9px] text-brand-gold hover:underline ml-2">
              Clear All
            </button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Filters - Desktop */}
          <aside className={cn(
            "lg:w-72 shrink-0 space-y-8",
            showFilters ? "block" : "hidden lg:block"
          )}>
            {/* Categories */}
            <div>
              <h3 className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold mb-4 pb-2 border-b border-brand-beige">Categories</h3>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={cn(
                    "text-left text-xs transition-colors hover:text-brand-gold py-1",
                    !selectedCategory ? "text-brand-gold font-bold" : "text-brand-grey"
                  )}
                >
                  All Collections
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={cn(
                      "text-left text-xs transition-colors hover:text-brand-gold py-1",
                      selectedCategory === cat.name ? "text-brand-gold font-bold" : "text-brand-grey"
                    )}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Fabric Filter */}
            <div>
              <h3 className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold mb-4 pb-2 border-b border-brand-beige">Fabric</h3>
              <div className="flex flex-wrap gap-2">
                {fabrics.map(f => (
                  <button
                    key={f}
                    onClick={() => toggleFabric(f)}
                    className={cn(
                      "text-[9px] px-3 py-1.5 rounded-full border transition-all",
                      selectedFabrics.includes(f) 
                        ? "bg-brand-gold text-black border-brand-gold" 
                        : "border-brand-beige hover:border-brand-gold"
                    )}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>

            {/* Size Filter */}
            <div>
              <h3 className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold mb-4 pb-2 border-b border-brand-beige">Size</h3>
              <div className="flex flex-wrap gap-2">
                {sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => toggleSize(s)}
                    className={cn(
                      "w-10 h-10 rounded-full text-xs font-medium border transition-all",
                      selectedSizes.includes(s) 
                        ? "bg-brand-black text-white border-brand-black" 
                        : "border-brand-beige hover:border-brand-gold"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Range */}
            <div>
              <h3 className="text-[10px] md:text-[11px] uppercase tracking-wider font-bold mb-4 pb-2 border-b border-brand-beige">Price Range (PKR)</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="text-[8px] text-brand-grey">Min</label>
                    <input
                      type="number"
                      value={priceRange[0]}
                      onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                      className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[8px] text-brand-grey">Max</label>
                    <input
                      type="number"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                      className="w-full border border-brand-beige rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>
                <div className="flex justify-between text-[8px] text-brand-grey">
                  <span>Rs. 0</span>
                  <span>Rs. 50,000</span>
                  <span>Rs. 100,000+</span>
                </div>
              </div>
            </div>
          </aside>

          {/* Mobile Filters Overlay */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 lg:hidden"
              >
                <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
                <motion.aside
                  initial={{ x: -300 }}
                  animate={{ x: 0 }}
                  exit={{ x: -300 }}
                  className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-serif">Filters</h2>
                    <button onClick={() => setShowFilters(false)} className="p-2"><X size={20} /></button>
                  </div>
                  {/* Same filter content as desktop */}
                  <div className="space-y-8">
                    <div>
                      <h3 className="text-[10px] uppercase tracking-wider font-bold mb-3">Categories</h3>
                      <div className="flex flex-col gap-2">
                        <button onClick={() => { setSelectedCategory(null); setShowFilters(false); }} className="text-left text-sm">All Collections</button>
                        {categories.map(cat => (
                          <button key={cat.name} onClick={() => { setSelectedCategory(cat.name); setShowFilters(false); }} className="text-left text-sm">{cat.name}</button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-[10px] uppercase tracking-wider font-bold mb-3">Fabric</h3>
                      <div className="flex flex-wrap gap-2">
                        {fabrics.map(f => (
                          <button key={f} onClick={() => { toggleFabric(f); setShowFilters(false); }} className={cn("px-3 py-1 rounded-full border text-xs", selectedFabrics.includes(f) && "bg-brand-gold")}>{f}</button>
                        ))}
                      </div>
                    </div>
                    <button onClick={clearAllFilters} className="w-full py-3 bg-brand-cream rounded-full text-xs font-bold">Clear All Filters</button>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className={cn(
                "grid gap-4 md:gap-6",
                viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3" : "grid-cols-1"
              )}>
                {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className={cn(
                "grid gap-4 md:gap-6",
                viewMode === 'grid' ? "grid-cols-2 md:grid-cols-3 lg:grid-cols-3" : "grid-cols-1"
              )}>
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 md:py-32 space-y-4">
                <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto">
                  <Search size={24} className="text-brand-grey" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif">No products found</h3>
                <p className="text-brand-grey text-sm max-w-md mx-auto">
                  We couldn't find any products matching your selection. Try adjusting your filters or search term.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="inline-block mt-4 text-brand-gold text-[10px] uppercase tracking-wider font-bold border-b border-brand-gold pb-0.5 hover:border-brand-black transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Shop;