import React, { useEffect, useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { productService, Product } from '../services/productService';
import ProductCard from '../components/ProductCard';
import { ShoppingBag, ArrowRight, Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';

const Wishlist = () => {
  const { wishlist } = useWishlist();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWishlistProducts = async () => {
      setLoading(true);
      if (wishlist.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Fetch all products and filter locally for simplicity since wishlist is usually small
      // In a larger app, we'd fetch specific IDs
      const allProducts = await productService.getAllProducts();
      const wishlistProducts = allProducts.filter(p => wishlist.includes(p.id));
      setProducts(wishlistProducts);
      setLoading(false);
    };

    fetchWishlistProducts();
  }, [wishlist]);

  return (
    <div className="bg-white min-h-screen py-24">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-6xl font-serif">Your Wishlist</h1>
            <p className="text-brand-grey font-light max-w-lg mx-auto italic">
              A curated collection of your most desired Maison UFR pieces.
            </p>
          </motion.div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-32 space-y-10 max-w-md mx-auto">
             <div className="w-24 h-24 bg-brand-cream rounded-full flex items-center justify-center mx-auto text-brand-gold/30">
                <Heart size={48} />
             </div>
             <div className="space-y-4">
                <h2 className="font-serif text-3xl">Your wishlist is empty</h2>
                <p className="text-brand-grey font-light">Explore our latest collections and save your favorite designs for later.</p>
             </div>
             <Link 
               to="/shop" 
               className="inline-flex items-center gap-3 bg-brand-black text-white px-12 py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:bg-brand-gold transition-all duration-500 luxury-shadow group"
             >
               Explore Collections
               <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
             </Link>
          </div>
        )}

        {products.length > 0 && (
          <div className="mt-24 border-t border-brand-beige pt-16 text-center">
            <Link to="/shop" className="text-xs uppercase font-bold tracking-widest text-brand-gold hover:underline">
              Continue Boutique Browsing
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
