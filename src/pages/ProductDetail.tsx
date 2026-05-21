import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, Share2, ShieldCheck, Truck, RefreshCcw, Bell, MessageCircle, Facebook, Twitter, Link2, Minus, Plus, Check, Info } from 'lucide-react';
import { productService, Product, Review } from '../services/productService';
import { notificationService } from '../services/notificationService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { formatPrice, cn } from '../utils/cn';
import ProductCard from '../components/ProductCard';
import SEO from '../components/SEO';
import { ProductDetailSkeleton } from '../components/Skeletons';
import { motion, AnimatePresence } from 'motion/react';
import toast from 'react-hot-toast';
import LoginRequiredModal from '../components/LoginRequiredModal';

const ProductDetail = () => {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('description');
  
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [isSubmittingNotify, setIsSubmittingNotify] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await productService.getProductById(id);
        if (data) {
          setProduct(data);
          setSelectedSize(data.sizes?.[0] || '');
          setSelectedColor(data.colors?.[0] || '');
          
          const related = await productService.getProductsByCategory(data.category, data.id);
          setRelatedProducts(related);

          const productReviews = await productService.getProductReviews(id);
          setReviews(productReviews);
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details');
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) {
      toast.error('Please sign in to submit a review');
      setIsLoginModalOpen(true);
      setLoginModalMessage('Please login to submit a review');
      return;
    }
    if (comment.length < 5) {
      toast.error('Review must be at least 5 characters');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        rating,
        comment,
      };

      const newReview = await productService.addProductReview(id, reviewData);
      setReviews([newReview as Review, ...reviews]);
      setComment('');
      setRating(5);
      toast.success('Review submitted successfully!');
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review. Please try again.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }
    if (!user) {
      setLoginModalMessage('Please login to add items to your bag');
      setIsLoginModalOpen(true);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    toast.success('Added to bag!');
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    if (!user) {
      setLoginModalMessage('Please login to proceed to checkout');
      setIsLoginModalOpen(true);
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      salePrice: product.salePrice,
      image: product.images[0],
      size: selectedSize,
      color: selectedColor,
      quantity,
    });
    navigate('/checkout');
  };

  const handleNotifyMe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail) return;
    setIsSubmittingNotify(true);
    try {
      const result = await notificationService.requestNotification(notifyEmail, product!.id, product!.name);
      if (result.success) {
        toast.success(result.alreadyExists ? "You're already on the list!" : "We'll notify you when restocked!");
        setIsNotifyModalOpen(false);
        setNotifyEmail('');
      } else {
        toast.error("Failed to request notification");
      }
    } catch (error) {
      toast.error("Something went wrong");
    } finally {
      setIsSubmittingNotify(false);
    }
  };

  const shareUrl = window.location.href;
  const shareMessage = `Check out ${product?.name} from UFR Collection`;

  const shareActions = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`, '_blank') },
    { name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') },
    { name: 'Twitter', icon: Twitter, color: 'bg-[#1DA1F2]', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
    { name: 'Copy Link', icon: Link2, color: 'bg-brand-grey', action: () => { navigator.clipboard.writeText(shareUrl); toast.success('Link copied!'); } }
  ];

  if (loading) return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <ProductDetailSkeleton />
    </div>
  );
  
  if (!product) return (
    <div className="text-center py-20 md:py-40">
      <h2 className="text-2xl md:text-3xl font-serif mb-4">Product Not Found</h2>
      <p className="text-brand-grey mb-8">The product you're looking for doesn't exist.</p>
      <Link to="/shop" className="bg-brand-black text-white px-8 py-3 rounded-full text-xs uppercase font-bold tracking-wider inline-block">Back to Shop</Link>
    </div>
  );

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length 
    : 0;

  // Rating distribution for Markaz-style display
  const ratingDistribution = [5,4,3,2,1].map(star => ({
    star,
    count: reviews.filter(r => r.rating === star).length,
    percentage: reviews.length > 0 ? (reviews.filter(r => r.rating === star).length / reviews.length) * 100 : 0
  }));

  return (
    <div className="bg-white min-h-screen pb-16 md:pb-24">
      <SEO 
        title={product.name} 
        description={product.description?.substring(0, 160)} 
        image={product.images?.[0]} 
        type="product" 
      />
      
      <div className="container mx-auto px-4 py-6 md:py-12 max-w-7xl">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1 md:gap-2 text-[9px] md:text-[10px] uppercase tracking-wider text-brand-grey mb-6 md:mb-12 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-brand-gold">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-brand-gold">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-brand-gold truncate max-w-[100px]">{product.category}</Link>
          <span>/</span>
          <span className="text-brand-black font-bold truncate max-w-[150px]">{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 mb-12 md:mb-20">
          
          {/* Image Gallery */}
          <div>
            <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-brand-cream relative mb-4">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                src={product.images?.[selectedImage] || product.images?.[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="absolute top-4 right-4 p-2 md:p-3 bg-white/90 backdrop-blur rounded-full shadow-md hover:bg-brand-gold hover:text-white transition-colors"
              >
                <Share2 size={16} className="md:w-5 md:h-5" />
              </button>
              
              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.stock <= 0 ? (
                  <span className="bg-red-600 text-white text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase">Sold Out</span>
                ) : product.stock <= 5 ? (
                  <span className="bg-orange-500 text-white text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase">Low Stock</span>
                ) : (
                  <span className="bg-green-600 text-white text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase">In Stock</span>
                )}
                {product.isNew && (
                  <span className="bg-brand-gold text-black text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase">New Arrival</span>
                )}
                {product.isBestSeller && (
                  <span className="bg-brand-black text-white text-[9px] md:text-[10px] px-3 py-1 rounded-full font-bold uppercase">Best Seller</span>
                )}
              </div>
            </div>
            
            {/* Thumbnails */}
            <div className="flex gap-2 md:gap-3 overflow-x-auto pb-2">
              {product.images?.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "w-16 md:w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 shrink-0 transition-all",
                    selectedImage === i ? "border-brand-gold shadow-md" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`${product.name} view ${i + 1}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-5 md:space-y-8">
            {/* Category & Title */}
            <div>
              <p className="text-brand-gold text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-2">{product.category}</p>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-serif leading-tight">{product.name}</h1>
              <p className="text-[10px] text-brand-grey mt-2">SKU: {product.sku || product.id?.slice(0, 8) || 'UFR-001'}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((star) => (
                  <Star key={star} size={14} className={cn("md:w-4 md:h-4", star <= Math.round(averageRating) ? "text-brand-gold fill-brand-gold" : "text-gray-300")} />
                ))}
              </div>
              <span className="text-[10px] md:text-xs text-brand-grey">({reviews.length} reviews)</span>
              <span className="text-[10px] text-brand-grey">|</span>
              <span className="text-[10px] text-green-600">{product.stock} in stock</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3">
              {product.salePrice ? (
                <>
                  <span className="text-2xl md:text-3xl font-serif font-bold text-brand-gold">{formatPrice(product.salePrice)}</span>
                  <span className="text-sm md:text-base text-brand-grey line-through">{formatPrice(product.price)}</span>
                  <span className="text-[9px] md:text-[10px] bg-brand-gold/10 text-brand-gold px-2 py-1 rounded-full font-bold">
                    Save {Math.round((1 - product.salePrice / product.price) * 100)}%
                  </span>
                </>
              ) : (
                <span className="text-2xl md:text-3xl font-serif font-bold">{formatPrice(product.price)}</span>
              )}
            </div>

            {/* Low Stock Warning */}
            {product.stock > 0 && product.stock <= 5 && (
              <p className="text-red-500 text-xs font-medium">⚠️ Only {product.stock} left in stock - order soon!</p>
            )}

            {/* Size Type (e.g., Unstitched) */}
            {product.sizeType && (
              <div className="border-t border-gray-100 pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Size</h3>
                </div>
                <p className="text-base md:text-lg font-semibold text-brand-black">{product.sizeType}</p>
              </div>
            )}

            {/* Regular Size Selection */}
            {!product.sizeType && product.sizes && product.sizes.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider">Select Size</h3>
                  <button className="text-[9px] md:text-[10px] text-brand-gold hover:underline">Size Guide</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-10 h-10 md:w-12 md:h-12 rounded-xl text-xs md:text-sm font-medium transition-all border",
                        selectedSize === size 
                          ? "bg-brand-black text-white border-brand-black" 
                          : "bg-white text-brand-black border-gray-200 hover:border-brand-gold"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color Selection */}
            {product.colors && product.colors.length > 0 && (
              <div>
                <h3 className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-3">Select Color</h3>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-4 md:px-5 py-2 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-medium uppercase transition-all border",
                        selectedColor === color 
                          ? "bg-brand-gold text-black border-brand-gold" 
                          : "bg-white text-brand-grey border-gray-200 hover:border-brand-gold"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity & Buttons */}
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-gray-200 rounded-xl">
                  <button 
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-brand-cream rounded-l-xl transition"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-sm font-medium">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(q => q + 1)}
                    className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-brand-cream rounded-r-xl transition"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(
                    "w-8 h-8 md:w-10 md:h-10 rounded-xl border flex items-center justify-center transition",
                    isInWishlist(product.id) ? "bg-brand-gold border-brand-gold text-white" : "bg-white border-gray-200 hover:border-brand-gold"
                  )}
                >
                  <Heart size={16} className="md:w-4 md:h-4" fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                </button>
              </div>

              {product.stock > 0 ? (
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 bg-brand-cream border border-gray-200 text-brand-black py-3 md:py-4 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider hover:bg-brand-beige transition"
                  >
                    Add to Bag
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="flex-1 bg-brand-black text-white py-3 md:py-4 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition"
                  >
                    Buy Now
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsNotifyModalOpen(true)}
                  className="w-full bg-brand-cream border border-gray-200 text-brand-gold py-3 md:py-4 rounded-xl text-[11px] md:text-xs font-bold uppercase tracking-wider hover:bg-brand-beige transition flex items-center justify-center gap-2"
                >
                  <Bell size={14} /> Notify When Available
                </button>
              )}
            </div>

            {/* Shipping Info */}
            <div className="grid grid-cols-3 gap-2 pt-4 border-t border-gray-100">
              <div className="text-center">
                <ShieldCheck size={16} className="mx-auto mb-1 text-brand-gold" />
                <p className="text-[8px] md:text-[9px] text-brand-grey">Authentic</p>
              </div>
              <div className="text-center">
                <Truck size={16} className="mx-auto mb-1 text-brand-gold" />
                <p className="text-[8px] md:text-[9px] text-brand-grey">Free Delivery*</p>
              </div>
              <div className="text-center">
                <RefreshCcw size={16} className="mx-auto mb-1 text-brand-gold" />
                <p className="text-[8px] md:text-[9px] text-brand-grey">7 Days Return</p>
              </div>
            </div>

            {/* Delivery Info Box */}
            <div className="bg-brand-cream rounded-xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <Truck size={14} className="text-brand-gold" />
                <span className="font-medium">3-5 day delivery</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <ShieldCheck size={14} className="text-brand-gold" />
                <span className="font-medium">Cash on delivery available</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <RefreshCcw size={14} className="text-brand-gold" />
                <span className="font-medium">7-day returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section - Markaz Style */}
        <div className="border-t border-gray-200 pt-8 md:pt-12">
          <div className="flex gap-2 md:gap-8 overflow-x-auto pb-4 mb-6 md:mb-8 border-b border-gray-200">
            {[
              { id: 'overview', label: 'Product Overview' },
              { id: 'reviews', label: `Ratings & Reviews (${reviews.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 md:px-0 py-2 text-[11px] md:text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all",
                  activeTab === tab.id 
                    ? "text-brand-gold border-b-2 border-brand-gold" 
                    : "text-brand-grey hover:text-brand-black"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-[300px]">
            {/* Product Overview Tab - Markaz Style */}
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Product Highlights as Key-Value pairs */}
                {product.highlights && product.highlights.length > 0 && (
                  <div>
                    <h3 className="text-lg md:text-xl font-serif mb-4">Product Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {product.highlights.map((highlight, idx) => {
                        // Split the highlight into label and value
                        const colonIndex = highlight.indexOf(':');
                        let label = highlight;
                        let value = '';
                        if (colonIndex > 0) {
                          label = highlight.substring(0, colonIndex).trim();
                          value = highlight.substring(colonIndex + 1).trim();
                        }
                        return (
                          <div key={idx} className="flex text-sm border-b border-gray-100 py-2">
                            <span className="font-semibold w-2/5 text-brand-black">{label}</span>
                            <span className="w-3/5 text-brand-grey">{value || highlight}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Full Description */}
                {product.description && (
                  <div>
                    <h3 className="text-lg md:text-xl font-serif mb-3">Description</h3>
                    <p className="text-brand-grey leading-relaxed text-sm md:text-base">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Fabric & Care */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {product.fabric && (
                    <div>
                      <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">Fabric</h4>
                      <p className="text-sm text-brand-grey">{product.fabric}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2">Care Instructions</h4>
                    <p className="text-sm text-brand-grey">Dry clean recommended for best results</p>
                  </div>
                </div>
              </div>
            )}

            {/* Ratings & Reviews Tab - Markaz Style */}
            {activeTab === 'reviews' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
                {/* Left Column - Rating Summary */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg md:text-xl font-serif mb-4">Ratings & reviews</h3>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="text-4xl md:text-5xl font-serif font-bold text-brand-black">
                        {averageRating.toFixed(1)}
                      </div>
                      <div>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map((star) => (
                            <Star key={star} size={18} className={star <= Math.round(averageRating) ? "text-brand-gold fill-brand-gold" : "text-gray-300"} />
                          ))}
                        </div>
                        <p className="text-xs text-brand-grey mt-1">Based on {reviews.length} ratings</p>
                      </div>
                    </div>

                    {/* Rating Distribution Bars - Markaz Style */}
                    <div className="space-y-2">
                      {ratingDistribution.map((item) => (
                        <div key={item.star} className="flex items-center gap-2 text-sm">
                          <span className="w-8 text-brand-grey">{item.star} ★</span>
                          <div className="flex-grow h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-brand-gold rounded-full" 
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                          <span className="w-12 text-xs text-brand-grey">{item.percentage.toFixed(0)}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Write Review Form */}
                  <div className="bg-brand-cream/30 p-4 md:p-6 rounded-2xl">
                    <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Write a Review</h4>
                    {user ? (
                      <form onSubmit={handleReviewSubmit} className="space-y-4">
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">Your Rating</label>
                          <div className="flex gap-1">
                            {[1,2,3,4,5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setRating(star)}
                                className="focus:outline-none transition-transform hover:scale-110"
                              >
                                <Star size={22} className={star <= rating ? "text-brand-gold fill-brand-gold" : "text-gray-300"} />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase tracking-wider mb-2">Your Review</label>
                          <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            rows={4}
                            className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-gold"
                            placeholder="Share your experience with this product..."
                            required
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={isSubmittingReview}
                          className="w-full bg-brand-black text-white py-3 rounded-xl text-[11px] font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition disabled:opacity-50"
                        >
                          {isSubmittingReview ? 'Submitting...' : 'Submit Review'}
                        </button>
                      </form>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-brand-grey mb-4">Login to write a review</p>
                        <button
                          onClick={() => navigate('/login')}
                          className="text-brand-gold text-sm font-medium hover:underline"
                        >
                          Sign In
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column - Reviews List */}
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider mb-4">Customer Reviews</h4>
                  {reviews.length === 0 ? (
                    <div className="text-center py-12 bg-brand-cream/20 rounded-2xl">
                      <Star size={32} className="mx-auto mb-3 text-gray-300" />
                      <p className="text-brand-grey text-sm">No reviews yet. Be the first to review!</p>
                    </div>
                  ) : (
                    <div className="space-y-5 max-h-[500px] overflow-y-auto pr-2">
                      {reviews.map((review, idx) => (
                        <div key={review.id || idx} className="border-b border-gray-100 pb-5">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-medium text-sm text-brand-black">{review.userName}</p>
                              <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5].map((star) => (
                                  <Star key={star} size={12} className={star <= review.rating ? "text-brand-gold fill-brand-gold" : "text-gray-300"} />
                                ))}
                              </div>
                            </div>
                            <span className="text-[9px] text-brand-grey">
                              {review.createdAt?.toDate?.().toLocaleDateString() || 'Just now'}
                            </span>
                          </div>
                          <p className="text-sm text-brand-grey mt-2 leading-relaxed">{review.comment}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-12 md:mt-20 pt-8 md:pt-12 border-t border-gray-200">
            <h2 className="text-xl md:text-2xl font-serif mb-6 md:mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
              {relatedProducts.slice(0, 4).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-6 max-w-sm w-full"
            >
              <h3 className="text-lg font-serif mb-4 text-center">Share this product</h3>
              <div className="grid grid-cols-4 gap-3">
                {shareActions.map((s) => (
                  <button
                    key={s.name}
                    onClick={() => { s.action(); setIsShareModalOpen(false); }}
                    className={cn("p-3 rounded-full text-white", s.color)}
                  >
                    <s.icon size={20} className="mx-auto" />
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setIsShareModalOpen(false)}
                className="w-full mt-4 text-xs text-brand-grey hover:text-brand-black"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notify Modal */}
      <AnimatePresence>
        {isNotifyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute inset-0 bg-black/50"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl p-6 max-w-md w-full"
            >
              <h3 className="text-lg font-serif mb-2">Notify Me When Available</h3>
              <p className="text-sm text-brand-grey mb-4">Enter your email and we'll notify you when this product is back in stock.</p>
              <form onSubmit={handleNotifyMe} className="space-y-4">
                <input
                  type="email"
                  required
                  placeholder="Your email address"
                  value={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:border-brand-gold"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNotify}
                  className="w-full bg-brand-black text-white py-3 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-brand-gold hover:text-black transition disabled:opacity-50"
                >
                  {isSubmittingNotify ? 'Submitting...' : 'Notify Me'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Login Required Modal */}
      <LoginRequiredModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        message={loginModalMessage}
      />
    </div>
  );
};

export default ProductDetail;