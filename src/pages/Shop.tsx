import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
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

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(urlCategory);
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchProductsAndOffers = async () => {
      setLoading(true);
      try {
        const [data, currentOffers] = await Promise.all([
          productService.getAllProducts(),
          offerService.getActiveOffers()
        ]);

        // Enrich products with their strongest offer badge
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

          return { ...p, offerLabel: strongestOfferLabel || (p.discount && p.discount > 0 ? `${p.discount}% OFF` : undefined) };
        });

        setProducts(enrichedProducts);
      } catch (error) {
        console.error("Maison catalog sync failed", error);
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

  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    let result = products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                          p.category.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'price-low') result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price));
    if (sortBy === 'price-high') result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price));
    
    return result;
  }, [products, search, selectedCategory, sortBy]);

  return (
    <div className="bg-white min-h-screen">
      <SEO 
        title={`${selectedCategory || 'Shop'} | Luxury Collection | UFR Collection`}
        description="Explore our exquisite collection of Pakistani luxury fashion. Browse through luxury pret, bridal wear, and seasonal arrivals. Shop the House of UFR."
      />
      {/* Header */}
      <div className="bg-brand-cream py-16 md:py-24 border-b border-brand-beige">
        <div className="container mx-auto px-4 text-center">
          <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px] mb-4">Discover Luxury</p>
          <h1 className="text-4xl md:text-6xl font-serif mb-6">Explore Our Collections</h1>
          <nav className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-brand-grey">
            <Link to="/" className="hover:text-brand-gold transition-colors">Home</Link>
            <span>/</span>
            <span className="text-brand-black font-bold text-center">Shop</span>
          </nav>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-6 items-center justify-between mb-12">
          <div className="flex items-center gap-4 w-full md:w-auto">
             <button
               onClick={() => setShowFilters(!showFilters)}
               className="flex items-center gap-2 px-6 py-3 border border-brand-beige rounded-full text-xs uppercase tracking-widest font-bold hover:bg-brand-black hover:text-white transition-all"
             >
               <SlidersHorizontal size={14} />
               Filters
             </button>
             <div className="relative flex-grow md:w-64">
               <input
                 type="text"
                 placeholder="Search products..."
                 value={search}
                 onChange={(e) => setSearch(e.target.value)}
                 className="w-full pl-10 pr-4 py-3 bg-brand-cream border border-brand-beige rounded-full text-sm focus:outline-none focus:border-brand-gold"
               />
               <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
             </div>
          </div>

          <div className="flex items-center gap-6 w-full md:w-auto justify-between">
            <p className="text-xs uppercase tracking-widest text-brand-grey font-medium">
              Showing {filteredProducts.length} Results
            </p>
            <div className="relative group">
               <select
                 value={sortBy}
                 onChange={(e) => setSortBy(e.target.value)}
                 className="appearance-none bg-transparent pl-4 pr-10 py-2 text-xs uppercase tracking-widest font-bold border-b border-brand-black focus:outline-none cursor-pointer"
               >
                 <option value="newest text-center">Newest</option>
                 <option value="price-low text-center">Price: Low to High</option>
                 <option value="price-high text-center">Price: High to Low</option>
                 <option value="best-selling text-center">Best Selling</option>
               </select>
               <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-12">
          {/* Sidebar Filters (Desktop) / Drawer (Mobile Overlay) */}
          <AnimatePresence>
            {showFilters && (
              <motion.aside
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="lg:w-64 space-y-12 shrink-0 h-fit bg-white"
              >
                <div className="flex items-center justify-between lg:hidden mb-8">
                   <h2 className="text-2xl font-serif">Filters</h2>
                   <button onClick={() => setShowFilters(false)}><X /></button>
                </div>

                <div>
                  <h3 className="text-sm uppercase tracking-widest font-bold mb-6 border-b border-brand-beige pb-2">Categories</h3>
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={cn(
                        "text-left text-sm transition-colors hover:text-brand-gold",
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
                          "text-left text-sm transition-colors hover:text-brand-gold",
                          selectedCategory === cat.name ? "text-brand-gold font-bold" : "text-brand-grey"
                        )}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                   <h3 className="text-sm uppercase tracking-widest font-bold mb-6 border-b border-brand-beige pb-2">Price Range</h3>
                   <div className="space-y-4">
                      <div className="flex h-1 bg-brand-beige rounded-full relative">
                         <div className="absolute inset-x-0 h-full bg-brand-gold rounded-full" />
                      </div>
                      <div className="flex justify-between text-[10px] uppercase font-bold text-brand-grey">
                         <span>Rs. 0</span>
                         <span>Rs. 100,000+</span>
                      </div>
                   </div>
                </div>

                <div>
                   <h3 className="text-sm uppercase tracking-widest font-bold mb-6 border-b border-brand-beige pb-2">Fabric</h3>
                   <div className="flex flex-wrap gap-2">
                       {['Lawn', 'Chiffon', 'Silk', 'Velvet', 'Organza'].map(f => (
                         <button key={f} className="text-[10px] px-3 py-1 border border-brand-beige rounded-full hover:border-brand-gold transition-colors">
                            {f}
                         </button>
                       ))}
                   </div>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Product Grid */}
          <div className="flex-grow">
            {loading ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-x-6 md:gap-y-16">
                {Array(6).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-x-6 md:gap-y-16">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 space-y-4">
                 <p className="text-brand-grey font-serif text-2xl">We couldn't find any products matching your selection.</p>
                 <button
                   onClick={() => { setSearch(''); setSelectedCategory(null); }}
                   className="text-brand-gold font-bold uppercase tracking-widest text-xs border-b border-brand-gold"
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
