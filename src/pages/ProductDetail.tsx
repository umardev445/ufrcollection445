import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, Heart, Star, ChevronLeft, ChevronRight, Share2, ShieldCheck, Truck, RefreshCcw, Bell, Check, Facebook, Twitter, Link2, Mail as MailIcon, MessageCircle } from 'lucide-react';
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
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('Manifesto');
  
  // Review form state
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
      const data = await productService.getProductById(id);
      if (data) {
        setProduct(data);
        setSelectedSize(data.sizes[0] || '');
        setSelectedColor(data.colors[0] || '');
        
        const related = await productService.getProductsByCategory(data.category, data.id);
        setRelatedProducts(related);

        // Fetch reviews
        setReviewsLoading(true);
        const productReviews = await productService.getProductReviews(id);
        setReviews(productReviews);
        setReviewsLoading(false);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) {
      toast.error('Please sign in to leave an appraisal.');
      return;
    }
    if (comment.length < 5) {
      toast.error('Your appraisal must be at least 5 characters.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      const reviewData = {
        userId: user.uid,
        userName: user.displayName || user.email?.split('@')[0] || 'Anonymous Client',
        rating,
        comment,
      };

      const newReview = await productService.addProductReview(id, reviewData);
      setReviews([newReview as Review, ...reviews]);
      setComment('');
      setRating(5);
      toast.success('Your appraisal has been archived.');
    } catch (error) {
      toast.error('Failed to submit appraisal.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) return (
    <div className="container mx-auto px-4 py-32">
      <ProductDetailSkeleton />
    </div>
  );
  
  if (!product) return (
    <div className="text-center py-40 bg-brand-cream/30">
      <SEO title="Product Not Found" />
      <h2 className="text-3xl font-serif mb-6 text-brand-black">Authenticity Error</h2>
      <p className="text-brand-grey mb-12 italic">The item you are seeking does not exist in our Maison archives.</p>
      <Link to="/shop" className="bg-brand-black text-white px-10 py-4 rounded-full text-[10px] uppercase font-black tracking-widest">Explore Archives</Link>
    </div>
  );

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
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
    toast.success('Successfully added to collection!');
  };

  const handleBuyNow = () => {
    if (!product || product.stock <= 0) return;
    if (!user) {
      setLoginModalMessage('Please login to proceed with your acquisition');
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
    const result = await notificationService.requestNotification(notifyEmail, product.id, product.name);
    if (result.success) {
      toast.success(result.alreadyExists ? "You're already on the list!" : "Restock alert confirmed for your profile.");
      setIsNotifyModalOpen(false);
      setNotifyEmail('');
    } else {
      toast.error("Archive request failed.");
    }
    setIsSubmittingNotify(false);
  };

  const shareUrl = window.location.href;
  const shareMessage = `Check out this exquisite piece from UFR Collection: ${product.name}`;

  const shareActions = [
    { name: 'WhatsApp', icon: MessageCircle, color: 'bg-[#25D366]', action: () => window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage + ' ' + shareUrl)}`, '_blank') },
    { name: 'Facebook', icon: Facebook, color: 'bg-[#1877F2]', action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank') },
    { name: 'Twitter', icon: Twitter, color: 'bg-[#1DA1F2]', action: () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}&url=${encodeURIComponent(shareUrl)}`, '_blank') },
    { name: 'Copy Link', icon: Link2, color: 'bg-brand-grey', action: () => { navigator.clipboard.writeText(shareUrl); toast.success('Link archived to clipboard'); } }
  ];

  const productSchema = { 
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "image": product.images,
    "description": product.description,
    "brand": { "@type": "Brand", "name": "UFR Collection" },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "PKR",
      "price": product.salePrice || product.price,
      "availability": product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating,
      "reviewCount": product.reviewsCount
    }
  };

  return (
    <div className="bg-white">
      <SEO 
        title={product.name} 
        description={product.description.substring(0, 160)} 
        image={product.images[0]} 
        type="product" 
        schema={productSchema}
      />
      
      <div className="container mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-brand-grey mb-12 overflow-x-auto whitespace-nowrap pb-2">
          <Link to="/" className="hover:text-brand-gold">Maison</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-brand-gold">Collection</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-brand-gold">{product.category}</Link>
          <span>/</span>
          <span className="text-brand-black font-bold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-24">
          {/* Gallery */}
          <div className="space-y-6">
            <div className="aspect-[3/4] overflow-hidden rounded-luxury-lg bg-brand-cream relative group">
              <motion.img
                key={selectedImage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <button 
                onClick={() => setIsShareModalOpen(true)}
                className="absolute right-6 top-6 p-4 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white transition-all hover:text-brand-black shadow-lg luxury-shadow"
              >
                <Share2 size={18} />
              </button>
              
              {/* Product Badges */}
              <div className="absolute top-6 left-6 space-y-2">
                {product.stock <= 0 ? (
                  <span className="block text-[10px] bg-red-600 text-white px-4 py-1.5 rounded-sm font-black uppercase tracking-widest">Sold Out</span>
                ) : product.stock <= 5 ? (
                  <span className="block text-[10px] bg-orange-500 text-white px-4 py-1.5 rounded-sm font-black uppercase tracking-widest">Low Stock</span>
                ) : (
                  <span className="block text-[10px] bg-green-600 text-white px-4 py-1.5 rounded-sm font-black uppercase tracking-widest">In Stock</span>
                )}
                {product.isNew && <span className="block text-[10px] bg-brand-black text-white px-4 py-1.5 rounded-sm font-black uppercase tracking-widest">New Piece</span>}
              </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-none">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={cn(
                    "w-20 md:w-28 aspect-[3/4] rounded-luxury overflow-hidden border-2 shrink-0 transition-all",
                    selectedImage === i ? "border-brand-gold shadow-md scale-105" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <img src={img} alt={`${product.name} ${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="space-y-10">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">{product.category}</p>
              </div>
              <h1 className="text-4xl md:text-6xl font-serif leading-[1.1] mb-2">{product.name}</h1>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={cn(i < Math.floor(product.rating) ? "text-brand-gold fill-brand-gold" : "text-brand-beige fill-brand-beige")} />
                  ))}
                  <span className="ml-2 text-xs text-brand-grey font-medium">({product.reviewsCount} Archive Appraisals)</span>
                </div>
              </div>
              <div className="flex items-center gap-6 text-3xl">
                {product.salePrice ? (
                  <>
                    <span className="font-serif text-brand-gold font-bold">{formatPrice(product.salePrice)}</span>
                    <span className="text-xl text-brand-grey line-through font-light decoration-brand-beige">{formatPrice(product.price)}</span>
                    <span className="text-[10px] bg-brand-gold/10 text-brand-gold px-4 py-1 rounded-full font-black uppercase tracking-widest">Save {Math.round((1 - product.salePrice / product.price) * 100)}%</span>
                  </>
                ) : (
                  <span className="font-serif text-brand-black font-bold">{formatPrice(product.price)}</span>
                )}
              </div>
              {product.stock > 0 && product.stock <= 5 && (
                 <p className="text-red-600 text-xs font-bold font-serif italic">Hurry! Only {product.stock} pieces remaining in the Maison vault.</p>
              )}
            </div>

            <div className="space-y-8 pt-10 border-t border-brand-beige">
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-grey">Select Size</h3>
                  <button className="text-[10px] uppercase tracking-widest font-bold border-b border-brand-black hover:text-brand-gold transition-colors pb-0.5">Size Architecture</button>
                </div>
                <div className="flex flex-wrap gap-4">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      onClick={() => setSelectedSize(size)}
                      className={cn(
                        "w-14 h-14 flex items-center justify-center rounded-2xl text-xs font-bold transition-all border luxury-shadow-sm",
                        selectedSize === size ? "bg-brand-black text-white border-brand-black" : "bg-white text-brand-black border-brand-beige hover:border-brand-gold"
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[10px] uppercase tracking-[0.2em] font-black text-brand-grey mb-6">Color Archive</h3>
                <div className="flex flex-wrap gap-4">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={cn(
                        "px-8 py-4 rounded-xl text-[10px] uppercase font-bold transition-all border tracking-[0.2em] luxury-shadow-sm",
                        selectedColor === color ? "bg-brand-gold text-white border-brand-gold" : "bg-white text-brand-grey border-brand-beige hover:border-brand-gold"
                      )}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
                {product.stock > 0 ? (
                  <>
                    <div className="h-16 flex items-center border border-brand-beige rounded-2xl px-6 gap-8 bg-brand-cream luxury-shadow-sm shrink-0 w-full sm:w-auto justify-between">
                      <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="text-xl font-bold hover:text-brand-gold transition-colors">-</button>
                      <span className="w-8 text-center text-sm font-bold font-serif">{quantity}</span>
                      <button onClick={() => setQuantity(q => q + 1)} className="text-xl font-bold hover:text-brand-gold transition-colors">+</button>
                    </div>
                    <div className="flex flex-col gap-4 w-full">
                      <button
                        onClick={handleAddToCart}
                        className="h-16 bg-brand-cream border border-brand-beige text-brand-black text-[10px] uppercase tracking-[0.3em] font-black rounded-2xl hover:bg-brand-beige transition-all duration-500 flex items-center justify-center gap-4 w-full"
                      >
                        <ShoppingBag size={20} />
                        Acquire Piece
                      </button>
                      <button
                        onClick={handleBuyNow}
                        className="h-16 bg-brand-black text-white text-[10px] uppercase tracking-[0.3em] font-black rounded-2xl hover:bg-brand-gold transition-all duration-500 flex items-center justify-center gap-4 shadow-2xl luxury-shadow w-full"
                      >
                        Buy it Now
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => setIsNotifyModalOpen(true)}
                    className="flex-grow h-16 bg-brand-cream border border-brand-beige text-brand-gold text-[10px] uppercase tracking-[0.3em] font-black rounded-2xl hover:bg-brand-beige transition-all duration-500 flex items-center justify-center gap-4 w-full"
                  >
                    <Bell size={20} />
                    Notify Restock
                  </button>
                )}
                <button
                  onClick={() => toggleWishlist(product.id)}
                  className={cn(
                    "w-16 h-16 flex items-center justify-center rounded-2xl border transition-all shadow-lg shrink-0",
                    isInWishlist(product.id) ? "bg-brand-gold border-brand-gold text-white" : "bg-white border-brand-beige hover:border-brand-gold text-brand-black"
                  )}
                >
                  <Heart size={24} fill={isInWishlist(product.id) ? "currentColor" : "none"} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-12 text-center border-t border-brand-beige">
               <div className="space-y-3 group">
                 <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto group-hover:bg-brand-gold transition-all group-hover:text-white duration-500">
                    <ShieldCheck size={24} />
                 </div>
                 <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-grey leading-tight">Authenticity<br/>Certified</p>
               </div>
               <div className="space-y-3 group">
                 <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto group-hover:bg-brand-gold transition-all group-hover:text-white duration-500">
                    <Truck size={24} />
                 </div>
                 <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-grey leading-tight">Express<br/>Shipping</p>
               </div>
               <div className="space-y-3 group">
                 <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto group-hover:bg-brand-gold transition-all group-hover:text-white duration-500">
                    <RefreshCcw size={24} />
                 </div>
                 <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-brand-grey leading-tight">7-Day Maison<br/>Exchange</p>
               </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mb-32">
           <div className="flex items-center justify-center gap-12 border-b border-brand-beige mb-16 overflow-x-auto whitespace-nowrap scrollbar-none">
              {['Manifesto', 'Architecture', 'Appraisals'].map(tab => (
                <button 
                  key={tab} 
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "pb-6 text-[10px] uppercase tracking-[0.3em] font-black border-b-2 transition-all",
                    activeTab === tab ? "border-brand-gold text-brand-black" : "border-transparent text-brand-grey hover:text-brand-gold"
                  )}
                >
                  {tab === 'Appraisals' ? `Appraisals (${reviews.length})` : tab}
                </button>
              ))}
           </div>

           <AnimatePresence mode="wait">
             {activeTab === 'Manifesto' && (
               <motion.div
                 key="manifesto"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="max-w-4xl mx-auto text-center space-y-8"
               >
                  <p className="text-brand-grey font-serif text-xl italic leading-relaxed px-4">
                    "{product.description}"
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left pt-12 px-4">
                     <div className="space-y-6">
                        <h4 className="font-serif text-2xl border-b border-brand-beige pb-3 flex items-center gap-3">
                           <span className="w-2 h-2 bg-brand-gold rounded-full" /> Material Composition
                        </h4>
                        <ul className="text-sm text-brand-grey space-y-4 font-light tracking-wide">
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">01</span>
                              <span>Hand Embroidered Luxury Chiffon (0.85m)</span>
                           </li>
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">02</span>
                              <span>Maison Exclusive Plain Chiffon (0.85m)</span>
                           </li>
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">03</span>
                              <span>Artisanally Crafted Sleeves (0.65m)</span>
                           </li>
                        </ul>
                     </div>
                     <div className="space-y-6">
                        <h4 className="font-serif text-2xl border-b border-brand-beige pb-3 flex items-center gap-3">
                           <span className="w-2 h-2 bg-brand-gold rounded-full" /> Preservation Guide
                        </h4>
                        <ul className="text-sm text-brand-grey space-y-4 font-light tracking-wide">
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">•</span>
                              <span>Professional Dry Clean recommended to preserve heritage.</span>
                           </li>
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">•</span>
                              <span>Isolate deep pigments during initial preservation cycles.</span>
                           </li>
                           <li className="flex gap-4">
                              <span className="text-brand-gold font-bold">•</span>
                              <span>Store in supplied luxury dust-proof archival bags.</span>
                           </li>
                        </ul>
                     </div>
                  </div>
               </motion.div>
             )}

             {activeTab === 'Architecture' && (
               <motion.div
                 key="architecture"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="max-w-4xl mx-auto px-4"
               >
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-8 bg-brand-cream/50 rounded-2xl border border-brand-beige text-center space-y-4">
                       <h5 className="text-[10px] uppercase tracking-widest font-black text-brand-gold">Silhouette</h5>
                       <p className="text-sm text-brand-black font-medium uppercase font-serif italic">Classic Maison A-Line</p>
                    </div>
                    <div className="p-8 bg-brand-cream/50 rounded-2xl border border-brand-beige text-center space-y-4">
                       <h5 className="text-[10px] uppercase tracking-widest font-black text-brand-gold">Structure</h5>
                       <p className="text-sm text-brand-black font-medium uppercase font-serif italic">Reinforced Hemlines</p>
                    </div>
                    <div className="p-8 bg-brand-cream/50 rounded-2xl border border-brand-beige text-center space-y-4">
                       <h5 className="text-[10px] uppercase tracking-widest font-black text-brand-gold">Embellishment</h5>
                       <p className="text-sm text-brand-black font-medium uppercase font-serif italic">Artisan Threadwork</p>
                    </div>
                 </div>
               </motion.div>
             )}

             {activeTab === 'Appraisals' && (
               <motion.div
                 key="appraisals"
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -20 }}
                 className="max-w-4xl mx-auto px-4"
               >
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
                    {/* Summary & Form */}
                    <div className="lg:col-span-5 space-y-12">
                       <div className="space-y-4">
                          <h3 className="text-4xl font-serif">Maison Appraisals</h3>
                          <div className="flex items-center gap-4">
                             <div className="flex items-center">
                                {[...Array(5)].map((_, i) => (
                                  <Star key={i} size={18} className={cn(i < Math.floor(product.rating) ? "text-brand-gold fill-brand-gold" : "text-brand-beige fill-brand-beige")} />
                                ))}
                             </div>
                             <span className="text-lg font-serif italic">{product.rating.toFixed(1)} / 5.0</span>
                          </div>
                          <p className="text-xs text-brand-grey font-medium uppercase tracking-widest">Based on {reviews.length} archive entries</p>
                       </div>

                       {user ? (
                         <form onSubmit={handleReviewSubmit} className="space-y-6 pt-8 border-t border-brand-beige">
                            <h4 className="text-[10px] uppercase tracking-[0.3em] font-black">Submit Appraisal</h4>
                            <div className="space-y-4">
                               <label className="block text-[9px] uppercase tracking-widest font-bold text-brand-grey">Your Rating</label>
                               <div className="flex gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setRating(star)}
                                      className="transition-transform hover:scale-110"
                                    >
                                      <Star 
                                        size={24} 
                                        className={cn(star <= rating ? "text-brand-gold fill-brand-gold" : "text-brand-beige fill-brand-beige")} 
                                      />
                                    </button>
                                  ))}
                               </div>
                            </div>
                            <div className="space-y-4">
                               <label className="block text-[9px] uppercase tracking-widest font-bold text-brand-grey">Your Commentary</label>
                               <textarea
                                 required
                                 value={comment}
                                 onChange={(e) => setComment(e.target.value)}
                                 placeholder="Share your experience with this piece..."
                                 className="w-full bg-brand-cream/50 border border-brand-beige rounded-2xl p-6 text-sm focus:outline-none focus:border-brand-gold transition-colors min-h-[160px] resize-none font-serif italic"
                               />
                            </div>
                            <button
                              disabled={isSubmittingReview}
                              className="w-full h-14 bg-brand-black text-white text-[10px] uppercase font-black tracking-widest rounded-xl hover:bg-brand-gold transition-all shadow-xl luxury-shadow-sm disabled:opacity-50"
                            >
                              {isSubmittingReview ? 'Archiving...' : 'Submit Appraisal'}
                            </button>
                         </form>
                       ) : (
                         <div className="p-8 bg-brand-cream/30 rounded-2xl border border-dashed border-brand-beige text-center space-y-4">
                            <p className="text-xs text-brand-grey italic font-serif">Sign in to contribute your appraisal to the archives.</p>
                            <button 
                              onClick={() => navigate('/login')}
                              className="text-[10px] uppercase font-black tracking-widest border-b border-brand-black pb-1 hover:text-brand-gold transition-colors"
                            >
                              Maison Sign In
                            </button>
                         </div>
                       )}
                    </div>

                    {/* Review List */}
                    <div className="lg:col-span-7 space-y-10">
                       {reviewsLoading ? (
                         <div className="space-y-8 animate-pulse">
                            {[1, 2, 3].map(i => (
                              <div key={i} className="h-40 bg-brand-cream rounded-2xl" />
                            ))}
                         </div>
                       ) : reviews.length > 0 ? (
                         reviews.map((r) => (
                           <motion.div 
                             key={r.id} 
                             initial={{ opacity: 0, x: 20 }}
                             animate={{ opacity: 1, x: 0 }}
                             className="space-y-4 pb-8 border-b border-brand-beige last:border-0"
                           >
                              <div className="flex justify-between items-start">
                                 <div className="space-y-1">
                                    <h5 className="font-serif text-lg">{r.userName}</h5>
                                    <div className="flex gap-0.5">
                                       {[...Array(5)].map((_, i) => (
                                         <Star key={i} size={12} className={cn(i < r.rating ? "text-brand-gold fill-brand-gold" : "text-brand-beige fill-brand-beige")} />
                                       ))}
                                    </div>
                                 </div>
                                 <span className="text-[9px] uppercase tracking-widest text-brand-beige font-bold">
                                    {r.createdAt ? new Date(r.createdAt.seconds * 1000).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recent'}
                                 </span>
                              </div>
                              <p className="text-brand-grey text-sm italic font-serif leading-relaxed line-clamp-4">
                                 "{r.comment}"
                              </p>
                           </motion.div>
                         ))
                       ) : (
                         <div className="text-center py-24 px-8 border border-dashed border-brand-beige rounded-3xl">
                            <Star size={32} className="mx-auto mb-6 text-brand-beige" />
                            <h4 className="font-serif text-xl mb-2">No Appraisals Yet</h4>
                            <p className="text-xs text-brand-grey italic font-serif">Be the first to provide a testament for this exquisite piece.</p>
                         </div>
                       )}
                    </div>
                 </div>
               </motion.div>
             )}
           </AnimatePresence>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="pt-24 border-t border-brand-beige">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
              <div className="space-y-4">
                <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px]">Curated Selection</p>
                <h2 className="text-5xl font-serif">Complete The Ensemble</h2>
              </div>
              <Link to="/shop" className="text-[10px] uppercase font-black tracking-widest border-b border-brand-gold pb-1 hover:text-brand-gold transition-colors">View Entire Collection</Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {relatedProducts.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {isShareModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl p-10 max-w-sm w-full luxury-shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-cream rounded-full blur-3xl -mr-16 -mt-16" />
              <div className="relative space-y-8">
                <div className="text-center">
                  <h3 className="text-2xl font-serif mb-2">Share Acquisition</h3>
                  <p className="text-xs text-brand-grey italic">Present this piece to your intimate circle.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {shareActions.map((s) => (
                    <button
                      key={s.name}
                      onClick={() => { s.action(); setIsShareModalOpen(false); }}
                      className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-brand-cream/50 hover:bg-brand-cream transition-all border border-brand-beige"
                    >
                      <div className={cn("p-3 rounded-full text-white shadow-lg", s.color)}>
                        <s.icon size={20} />
                      </div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-brand-black">{s.name}</span>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setIsShareModalOpen(false)}
                  className="w-full text-xs font-bold text-brand-grey uppercase tracking-widest pt-4 hover:text-brand-black transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notify Modal */}
      <AnimatePresence>
        {isNotifyModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotifyModalOpen(false)}
              className="absolute inset-0 bg-brand-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl p-10 max-w-md w-full luxury-shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-cream rounded-full blur-3xl -mr-20 -mt-20" />
              <div className="relative space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-brand-cream rounded-2xl flex items-center justify-center mx-auto mb-6 text-brand-gold border border-brand-beige">
                    <Bell size={28} />
                  </div>
                  <h3 className="text-2xl font-serif mb-3">Restock Notification</h3>
                  <p className="text-xs text-brand-grey leading-relaxed italic">
                    This selection is currently out of the Maison vault. Enlist your profile for an exclusive restock appraisal.
                  </p>
                </div>
                
                <form onSubmit={handleNotifyMe} className="space-y-4">
                  <input
                    type="email"
                    required
                    placeholder="Enter your archive email..."
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="w-full bg-brand-cream border border-brand-beige rounded-2xl p-5 text-sm focus:outline-none focus:border-brand-gold"
                  />
                  <button
                    disabled={isSubmittingNotify}
                    className="w-full bg-brand-black text-white h-16 rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-brand-gold transition-all duration-500 shadow-xl"
                  >
                    {isSubmittingNotify ? 'Enlisting...' : 'Enlist My Profile'}
                  </button>
                </form>

                <p className="text-[10px] text-center text-brand-beige font-medium uppercase tracking-widest pt-2">
                  No commitment required. archive request only.
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <LoginRequiredModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        message={loginModalMessage}
      />
    </div>
  );
};

export default ProductDetail;
