import React, { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Search, ShoppingBag, Heart, User, Menu, X, Landmark, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';
import { productService, Product } from '../services/productService';
import { formatPrice } from '../utils/cn';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuth();
  const { totalQuantity } = useCart();
  const { wishlist } = useWishlist();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const allProducts = await productService.getAllProducts();
        const query = searchQuery.toLowerCase();
        const results = allProducts.filter(p => 
          p.name.toLowerCase().includes(query) || 
          p.category.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
        setSearchResults(results.slice(0, 8));
      } catch (err) {
        console.error("Search failed", err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Shop', path: '/shop' },
    { name: 'Offers', path: '/offers' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
    { name: 'Blog', path: '/blog' },
  ];

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 w-full z-50 transition-all duration-500',
          scrolled ? 'bg-white/95 backdrop-blur-md py-3 luxury-shadow' : 'bg-transparent py-5'
        )}
      >
        <div className={cn(
          "container mx-auto px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between transition-all duration-300",
          isSearchOpen && "gap-4"
        )}>
          {/* Top Bar for Mobile / Main Bar for Desktop */}
          <div className="flex items-center justify-between w-full md:w-auto md:flex-1">
            {/* Left side: Menu toggle + Logo */}
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setIsOpen(true)} 
                className="lg:hidden w-11 h-11 flex items-center justify-center text-brand-black hover:text-brand-gold transition-colors"
                aria-label="Open menu"
                style={{ width: '44px', height: '44px' }}
              >
                <Menu size={24} />
              </button>
              
              <Link to="/" className="flex items-center gap-2" aria-label="UFR Collection Home">
                <span className="text-2xl font-serif font-bold tracking-tighter">
                  U<span className="text-brand-gold italic">F</span>R
                </span>
              </Link>
            </div>

            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <NavLink
                  key={link.name}
                  to={link.path}
                  className={({ isActive }) =>
                    cn(
                      'text-xs uppercase tracking-widest font-medium transition-colors hover:text-brand-gold',
                      isActive ? 'text-brand-gold' : 'text-brand-black'
                    )
                  }
                >
                  {link.name}
                </NavLink>
              ))}
            </nav>

            {/* Right side: Mobile-only Icons */}
            <div className="flex items-center gap-1 sm:gap-2 md:hidden">
              <button 
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="w-11 h-11 flex items-center justify-center hover:text-brand-gold transition-colors text-brand-black"
                aria-label="Search products"
                style={{ width: '44px', height: '44px' }}
              >
                <Search size={20} />
              </button>
              
              <Link 
                to="/profile" 
                className="w-11 h-11 flex items-center justify-center hover:text-brand-gold transition-colors text-brand-black"
                aria-label="My Account"
                style={{ width: '44px', height: '44px' }}
              >
                <User size={20} />
              </Link>
              
              <Link 
                to="/wishlist" 
                className="relative w-11 h-11 flex items-center justify-center hover:text-brand-gold transition-colors text-brand-black"
                aria-label="My Wishlist"
                style={{ width: '44px', height: '44px' }}
              >
                <Heart size={20} className={cn(wishlist.length > 0 && "text-brand-gold fill-brand-gold")} />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 bg-brand-gold text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              
              <Link 
                to="/cart" 
                className="relative w-11 h-11 flex items-center justify-center hover:text-brand-gold transition-colors text-brand-black"
                aria-label="Shopping Cart"
                style={{ width: '44px', height: '44px' }}
              >
                <ShoppingBag size={20} />
                {totalQuantity > 0 && (
                  <span className="absolute top-1 right-1 bg-brand-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {totalQuantity}
                  </span>
                )}
              </Link>
            </div>
          </div>

          {/* Logo for Desktop */}
          <div className="hidden md:flex justify-center flex-none">
            <Link to="/" className="flex items-center gap-2" aria-label="UFR Collection Home">
              <span className="text-2xl md:text-3xl font-serif font-bold tracking-tighter">
                U<span className="text-brand-gold italic">F</span>R
              </span>
              <span className="hidden md:inline-block text-[10px] uppercase tracking-[0.3em] font-light mt-1 text-brand-grey">
                Collection
              </span>
            </Link>
          </div>

          {/* Icons & Search Section - DESKTOP WITH ARIA LABELS */}
          <div className={cn(
            "flex items-center gap-3 md:gap-6 md:flex-1 md:justify-end",
            isSearchOpen && "w-full md:w-auto"
          )}>
            <div ref={searchRef} className="relative flex items-center w-full md:w-auto">
              <AnimatePresence>
                {isSearchOpen ? (
                  <motion.div
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: '100%', opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="relative w-full md:min-w-[300px]"
                  >
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search heritage pieces..."
                      aria-label="Search products"
                      className="w-full bg-brand-cream border border-brand-beige rounded-full py-2.5 md:py-2 pl-5 pr-10 text-sm md:text-xs focus:outline-none focus:border-brand-gold luxury-shadow-sm"
                    />
                    <button 
                      onClick={() => { setSearchQuery(''); setIsSearchOpen(false); }}
                      aria-label="Close search"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-grey hover:text-brand-gold p-1"
                    >
                      <X size={16} />
                    </button>
                    
                    {/* Search Results Dropdown */}
                    <AnimatePresence>
                      {(searchResults.length > 0 || isSearching || (searchQuery && !isSearching)) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute top-full mt-4 right-0 w-screen md:w-[400px] -mx-4 md:mx-0 bg-white md:rounded-2xl luxury-shadow-lg border-y md:border border-brand-beige overflow-hidden z-[60]"
                        >
                          <div className="p-4 max-h-[70vh] md:max-h-[400px] overflow-y-auto">
                            {isSearching ? (
                              <div className="flex items-center justify-center py-10 text-brand-gold italic text-xs gap-3">
                                <Loader2 size={16} className="animate-spin" /> Seeking masterworks...
                              </div>
                            ) : searchResults.length > 0 ? (
                              <div className="space-y-4">
                                {searchResults.map((product) => (
                                  <Link
                                    key={product.id}
                                    to={`/product/${product.id}`}
                                    onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }}
                                    className="flex gap-4 p-2 rounded-xl hover:bg-brand-cream/50 transition-colors group"
                                  >
                                    <div className="w-16 h-20 rounded-lg overflow-hidden bg-brand-beige shrink-0">
                                      <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                    </div>
                                    <div className="flex flex-col justify-center min-w-0">
                                      <p className="text-sm font-serif font-bold truncate">{product.name}</p>
                                      <p className="text-[10px] text-brand-gold uppercase tracking-widest font-bold mb-1">{product.category}</p>
                                      <p className="text-xs text-brand-black">{formatPrice(product.price)}</p>
                                    </div>
                                  </Link>
                                ))}
                                <Link 
                                  to={`/shop?search=${searchQuery}`}
                                  onClick={() => setIsSearchOpen(false)}
                                  className="flex items-center justify-center gap-2 py-3 text-[10px] uppercase tracking-widest font-bold text-center border-t border-brand-beige text-brand-gold hover:bg-brand-gold/5 transition-all"
                                >
                                  View all results <ArrowRight size={12} />
                                </Link>
                              </div>
                            ) : (
                              <div className="py-10 text-center">
                                <p className="text-brand-grey text-xs italic font-serif">No matches found for "{searchQuery}"</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ) : (
                  <button 
                    onClick={() => setIsSearchOpen(true)}
                    aria-label="Search products"
                    className="hidden md:flex p-2 hover:text-brand-gold transition-colors text-brand-black"
                  >
                    <Search size={20} />
                  </button>
                )}
              </AnimatePresence>
            </div>
            
            {/* ✅ DESKTOP ICONS WITH ARIA LABELS - FIXED */}
            <Link 
              to="/profile" 
              aria-label="My Account"
              className="hidden md:flex p-2 hover:text-brand-gold transition-colors text-brand-black"
            >
              <User size={20} />
            </Link>
            
            <Link 
              to="/wishlist" 
              aria-label="My Wishlist"
              className="hidden md:flex relative p-2 hover:text-brand-gold transition-colors text-brand-black"
            >
              <Heart size={20} />
              {wishlist.length > 0 && (
                <span className="absolute top-1 right-1 bg-brand-gold text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            
            <Link 
              to="/cart" 
              aria-label="Shopping Cart"
              className="hidden md:flex relative p-2 hover:text-brand-gold transition-colors text-brand-black"
            >
              <ShoppingBag size={20} />
              {totalQuantity > 0 && (
                <span className="absolute top-1 right-1 bg-brand-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                  {totalQuantity}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/50 z-[100] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 left-0 h-full w-[80%] max-w-sm bg-brand-cream z-[101] p-8"
            >
              <div className="flex justify-between items-center mb-12">
                <span className="text-2xl font-serif font-bold tracking-tighter">UFR</span>
                <button onClick={() => setIsOpen(false)} aria-label="Close menu">
                  <X size={24} />
                </button>
              </div>
              <div className="flex flex-col gap-6">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-serif tracking-wide hover:text-brand-gold transition-colors"
                  >
                    {link.name}
                  </Link>
                ))}
              </div>
              <div className="mt-20 pt-8 border-t border-brand-beige">
                <p className="text-[10px] uppercase tracking-widest text-brand-grey mb-4">Support</p>
                <div className="flex flex-col gap-3">
                  <a href="tel:+923001234567" className="text-sm">+92 449143446</a>
                  <a href="mailto:support@ufrcollection.com" className="text-sm">ufrcollection@gmail.com</a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;