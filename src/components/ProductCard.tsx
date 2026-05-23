import React from 'react';
import { Link } from 'react-router-dom';
import {
  Heart,
  ShoppingBag,
  Eye,
  Star
} from 'lucide-react';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, cn } from '../utils/cn';

// STEP 9: Lazy load modal
const LoginRequiredModal = React.lazy(() => import('./LoginRequiredModal'));

export interface Product {
  id: string;
  name: string;
  price: number;
  salePrice?: number | null;
  discount?: number;
  images: string[];
  category: string;
  rating: number;
  reviewsCount: number;
  featured?: boolean;
  isBestSeller?: boolean;
  isNew?: boolean;
  collectionIds?: string[];
  offerLabel?: string;
}

// STEP 10: Memoized component
const ProductCard = React.memo(({ product, onQuickView }: { product: Product, onQuickView?: (product: Product) => void }) => {
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [imageLoaded, setImageLoaded] = React.useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = React.useState(false);
  const isWishlisted = isInWishlist(product.id);

  // STEP 13: Dynamic toast import
  const showToast = async (message: string) => {
    const toast = (await import('react-hot-toast')).default;
    toast.success(message);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      setIsLoginModalOpen(true);
      return;
    }
    
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images[0],
      size: 'M',
      color: 'Default',
      quantity: 1,
    });
    showToast('Added to cart');
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product.id);
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onQuickView) onQuickView(product);
  };

  const discountPercentage = product.discount || (product.salePrice && product.salePrice > 0 && product.salePrice < product.price ? Math.round((1 - product.salePrice / product.price) * 100) : 0);

  return (
    // STEP 8: Removed whileHover, using CSS transitions instead
    <div
      className="group bg-brand-white rounded-[20px] p-3 shadow-luxury hover:shadow-luxury-hover border border-brand-beige/40 flex flex-col justify-between hover:-translate-y-2 transition-all duration-300"
    >
      <Link to={`/product/${product.id}`} className="block h-full">
        <div className="relative aspect-[3/4] overflow-hidden rounded-[14px] bg-brand-cream transition-all duration-500">
          {/* STEP 4 & 5: Pure CSS hover with no React state */}
          <img
            src={product.images[0] || 'https://images.unsplash.com/photo-1594235412407-5903f444f357?q=80&w=800'}
            alt={product.name}
            loading="lazy"
            decoding="async"
            sizes="(max-width: 768px) 50vw, 25vw"
            onLoad={() => setImageLoaded(true)}
            className={cn(
              "w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-[1.08]",
              imageLoaded ? "opacity-100 group-hover:opacity-0" : "opacity-0"
            )}
            onError={(e: any) => { e.target.src = 'https://images.unsplash.com/photo-1594235412407-5903f444f357?q=80&w=800'; }}
          />

          {/* STEP 5: Second image with pure CSS hover */}
          {product.images[1] && (
            <img
              src={product.images[1] || undefined}
              alt={`${product.name} - view 2`}
              loading="lazy"
              decoding="async"
              sizes="(max-width: 768px) 50vw, 25vw"
              className={cn(
                "absolute inset-0 w-full h-full object-cover transition-all duration-500 ease-out scale-100 group-hover:scale-[1.08]",
                "opacity-0 group-hover:opacity-100"
              )}
            />
          )}

          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
            {product.isNew && (
              <span className="bg-brand-cream text-brand-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold rounded-full shadow-sm">
                New
              </span>
            )}
            {product.isBestSeller && (
              <span className="bg-gradient-to-r from-brand-gold to-[#B8860B] text-white text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold rounded-full shadow-md">
                Best Seller
              </span>
            )}
            {product.offerLabel ? (
              <span className="bg-brand-gold text-brand-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold rounded-full shadow-md">
                {product.offerLabel}
              </span>
            ) : discountPercentage > 0 && (
              <span className="bg-brand-gold text-brand-black text-[9px] uppercase tracking-[0.2em] px-3 py-1.5 font-bold rounded-full shadow-md">
                {discountPercentage}% OFF
              </span>
            )}
          </div>

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            className={cn(
              "absolute top-4 right-4 p-2.5 rounded-full shadow-lg transition-all duration-300 z-20 transform group-hover:scale-100 scale-90",
              isWishlisted ? "bg-red-500 text-white" : "bg-white/80 backdrop-blur-sm text-brand-black hover:bg-white"
            )}
          >
            <Heart size={18} fill={isWishlisted ? "currentColor" : "none"} className={isWishlisted ? "animate-pulse" : ""} />
          </button>

          {/* Quick View Button */}
          <button
            onClick={handleQuickView}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white/90 backdrop-blur-md text-brand-black px-6 py-3 rounded-full flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-brand-gold hover:text-white transform scale-75 group-hover:scale-100 z-20 shadow-xl"
          >
            <Eye size={16} />
            <span className="text-[10px] uppercase font-bold tracking-widest">Quick View</span>
          </button>

          {/* Add to Cart Slide Up */}
          <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20">
            <button
              onClick={handleAddToCart}
              className="w-full bg-brand-black text-white text-[10px] uppercase tracking-[0.2em] py-4 rounded-xl font-bold hover:bg-brand-gold transition-all flex items-center justify-center gap-2 shadow-2xl"
            >
              <ShoppingBag size={14} />
              Add to Cart
            </button>
          </div>
          
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* STEP 9: Suspense for lazy loaded modal */}
        <React.Suspense fallback={null}>
          <LoginRequiredModal 
            isOpen={isLoginModalOpen} 
            onClose={() => setIsLoginModalOpen(false)} 
          />
        </React.Suspense>

        <div className="mt-4 space-y-1.5 text-center px-2">
          <p className="text-[9px] uppercase tracking-[0.3em] text-brand-gold font-bold">
            {product.category}
          </p>
          <h3 className="font-serif text-lg tracking-wide group-hover:text-brand-gold transition-colors line-clamp-1">
            {product.name}
          </h3>
          <div className="flex items-center justify-center gap-3">
            {product.salePrice ? (
              <>
                <span className="text-brand-black font-bold text-base">{formatPrice(product.salePrice)}</span>
                <span className="text-xs text-brand-grey line-through opacity-60">{formatPrice(product.price)}</span>
              </>
            ) : (
              <span className="font-bold text-brand-black text-base">{formatPrice(product.price)}</span>
            )}
          </div>
          <div className="flex items-center justify-center gap-1 opacity-80">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                size={10}
                className={cn(i < Math.floor(product.rating) ? "text-brand-gold fill-brand-gold" : "text-brand-beige fill-brand-beige")}
              />
            ))}
            <span className="text-[9px] text-brand-grey ml-1 tracking-tighter">
              ({Number(product.reviewsCount) || 0} reviews)
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
});

// STEP 10: Memoized export
export default React.memo(ProductCard);