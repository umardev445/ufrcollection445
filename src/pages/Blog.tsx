import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Clock, ChevronRight, Search, ArrowRight, Heart, Eye, TrendingUp, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    title: "10 Styling Tips for Summer Lawn Collections",
    excerpt: "Discover how to stay perfectly chic in the scorching heat with our latest premium lawn essentials. From color combinations to accessory pairing, master the art of summer styling.",
    image: "https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?w=800&h=600&fit=crop",
    date: "May 12, 2026",
    category: "Styling Guides",
    readTime: "5 min read",
    views: 1240,
    featured: true
  },
  {
    id: 2,
    title: "The Ultimate Guide to Pakistani Bridal Fashion 2026",
    excerpt: "Trends that are shaping the wedding season. From heritage zari to modern minimalist silhouettes, explore the complete guide for the contemporary bride.",
    image: "https://images.pexels.com/photos/1183266/pexels-photo-1183266.jpeg?w=800&h=600&fit=crop",
    date: "April 28, 2026",
    category: "Trends",
    readTime: "12 min read",
    views: 3420,
    featured: true
  },
  {
    id: 3,
    title: "Behind the Scenes: Crafting the Regal Collection",
    excerpt: "A look into our atelier where master artisans spend hundreds of hours on a single formal ensemble. Witness the journey from sketch to masterpiece.",
    image: "https://images.pexels.com/photos/1281803/pexels-photo-1281803.jpeg?w=800&h=600&fit=crop",
    date: "April 15, 2026",
    category: "Craftsmanship",
    readTime: "8 min read",
    views: 890,
    featured: false
  },
  {
    id: 4,
    title: "5 Must-Have Pieces for Your Luxury Pret Collection",
    excerpt: "Invest in timeless pieces that elevate your wardrobe. From classic kurtas to contemporary capes, these essentials define modern luxury.",
    image: "https://images.pexels.com/photos/1020877/pexels-photo-1020877.jpeg?w=800&h=600&fit=crop",
    date: "April 5, 2026",
    category: "Fashion Tips",
    readTime: "6 min read",
    views: 2100,
    featured: false
  },
  {
    id: 5,
    title: "The Art of Embroidery: Preserving Pakistani Heritage",
    excerpt: "Explore the rich history of traditional embroidery techniques that make Pakistani fashion unique in the global landscape.",
    image: "https://images.pexels.com/photos/1381555/pexels-photo-1381555.jpeg?w=800&h=600&fit=crop",
    date: "March 22, 2026",
    category: "Craftsmanship",
    readTime: "10 min read",
    views: 1560,
    featured: false
  },
  {
    id: 6,
    title: "Fusion Fashion: Blending Eastern and Western Silhouettes",
    excerpt: "How modern designers are creating unique pieces that celebrate both Eastern and Western aesthetics.",
    image: "https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?w=800&h=600&fit=crop",
    date: "March 10, 2026",
    category: "Trends",
    readTime: "7 min read",
    views: 980,
    featured: false
  }
];

const categories = [
  { name: 'Styling Guides', count: 8 },
  { name: 'Trends', count: 12 },
  { name: 'Craftsmanship', count: 6 },
  { name: 'Inside the Atelier', count: 4 },
  { name: 'Fashion Tips', count: 10 },
  { name: 'Bridal', count: 5 }
];

const Blog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [email, setEmail] = useState('');

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPosts = blogPosts.filter(p => p.featured);
  const regularPosts = filteredPosts.filter(p => !p.featured);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      alert(`Thank you for subscribing! ${email}`);
      setEmail('');
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* SEO */}
      <SEO 
        title="Blog | UFR Collection - Fashion Insights & Style Guide"
        description="Discover the latest fashion trends, styling tips, and behind-the-scenes stories from UFR Collection. Your ultimate guide to Pakistani luxury fashion."
      />

      {/* Header */}
      <div className="bg-gradient-to-b from-brand-cream to-white py-16 md:py-24 border-b border-brand-beige">
        <div className="container mx-auto px-4 text-center max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-4">Fashion Edit</p>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-serif mb-6">The UFR Journal</h1>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto mb-6" />
            <p className="text-brand-grey text-xs md:text-sm uppercase tracking-wider max-w-2xl mx-auto">
              Elegance, Trends & Craftsmanship — Your daily dose of fashion inspiration
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-20 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
          
          {/* Main Content - Blog List */}
          <div className="lg:w-2/3 space-y-12">
            
            {/* Featured Posts Section */}
            {selectedCategory === 'All' && searchTerm === '' && featuredPosts.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-2 mb-6">
                  <Sparkles size={18} className="text-brand-gold" />
                  <h2 className="text-sm font-bold uppercase tracking-wider">Featured Stories</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {featuredPosts.map((post) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      className="group cursor-pointer bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                    >
                      <div className="aspect-[4/3] overflow-hidden bg-brand-cream">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-3 text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-brand-grey">
                          <span className="text-brand-gold">{post.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {post.date}</span>
                          <span className="flex items-center gap-1"><Eye size={10} /> {post.views}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif group-hover:text-brand-gold transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-brand-grey text-sm line-clamp-2">{post.excerpt}</p>
                        <Link 
                          to={`/blog/${post.id}`} 
                          className="inline-flex items-center gap-2 text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-brand-gold hover:gap-3 transition-all"
                        >
                          Read More <ArrowRight size={12} />
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}

            {/* All Posts Grid */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-sm font-bold uppercase tracking-wider">Latest Articles</h2>
                <p className="text-[10px] text-brand-grey">{filteredPosts.length} articles</p>
              </div>
              
              {filteredPosts.length > 0 ? (
                <div className="space-y-8">
                  {regularPosts.map((post, i) => (
                    <motion.article
                      key={post.id}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.1 }}
                      className="group flex flex-col md:flex-row gap-6 pb-8 border-b border-gray-100 last:border-0 hover:bg-brand-cream/10 p-4 rounded-2xl transition-all"
                    >
                      <div className="md:w-1/3 aspect-[4/3] overflow-hidden rounded-xl bg-brand-cream">
                        <img
                          src={post.image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                      <div className="md:w-2/3 space-y-3">
                        <div className="flex flex-wrap items-center gap-3 text-[9px] uppercase font-bold tracking-wider text-brand-grey">
                          <span className="text-brand-gold">{post.category}</span>
                          <span className="flex items-center gap-1"><Calendar size={10} /> {post.date}</span>
                          <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                        </div>
                        <h3 className="text-xl md:text-2xl font-serif group-hover:text-brand-gold transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-brand-grey text-sm line-clamp-2">{post.excerpt}</p>
                        <Link 
                          to={`/blog/${post.id}`} 
                          className="inline-flex items-center gap-2 text-[9px] uppercase font-bold tracking-wider text-brand-black hover:text-brand-gold transition-all group"
                        >
                          Read Full Article <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    </motion.article>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <p className="text-brand-grey">No articles found matching your criteria.</p>
                  <button 
                    onClick={() => { setSearchTerm(''); setSelectedCategory('All'); }}
                    className="mt-4 text-brand-gold text-sm underline"
                  >
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="lg:w-1/3 space-y-10">
            
            {/* Search Box */}
            <div className="bg-brand-cream/50 p-6 rounded-2xl border border-brand-beige">
              <h3 className="font-serif text-xl mb-4 flex items-center gap-2">
                <Search size={16} className="text-brand-gold" />
                Search Journal
              </h3>
              <div className="relative">
                <input 
                  className="w-full bg-white border border-brand-beige rounded-full py-3 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-gold" 
                  placeholder="Search articles..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-5">
              <h3 className="font-serif text-xl">Categories</h3>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => setSelectedCategory('All')}
                  className={`text-[10px] uppercase font-bold tracking-wider flex justify-between items-center py-2 border-b border-gray-100 hover:border-brand-gold transition-all ${selectedCategory === 'All' ? 'text-brand-gold' : 'text-brand-grey'}`}
                >
                  All Articles
                  <span className="text-[9px] text-brand-grey">{blogPosts.length}</span>
                </button>
                {categories.map(cat => (
                  <button 
                    key={cat.name}
                    onClick={() => setSelectedCategory(cat.name)}
                    className={`text-[10px] uppercase font-bold tracking-wider flex justify-between items-center py-2 border-b border-gray-100 hover:border-brand-gold transition-all ${selectedCategory === cat.name ? 'text-brand-gold' : 'text-brand-grey'}`}
                  >
                    {cat.name}
                    <span className="text-[9px] text-brand-grey">({cat.count})</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Trending Posts */}
            <div className="space-y-5">
              <h3 className="font-serif text-xl flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-gold" />
                Trending Now
              </h3>
              <div className="space-y-4">
                {blogPosts.sort((a,b) => b.views - a.views).slice(0, 4).map((post) => (
                  <Link key={post.id} to={`/blog/${post.id}`} className="flex gap-3 group">
                    <div className="w-16 h-16 rounded-lg overflow-hidden bg-brand-cream shrink-0">
                      <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="flex-grow">
                      <p className="text-[9px] text-brand-gold uppercase tracking-wider">{post.category}</p>
                      <h4 className="text-xs font-serif font-medium line-clamp-2 group-hover:text-brand-gold transition-colors">{post.title}</h4>
                      <p className="text-[9px] text-brand-grey mt-1 flex items-center gap-1"><Eye size={8} /> {post.views}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="bg-gradient-to-br from-brand-black to-brand-black/90 text-white p-6 md:p-8 rounded-2xl space-y-5">
              <div className="text-center">
                <h3 className="font-serif text-2xl mb-2">Join The Circle</h3>
                <div className="w-12 h-0.5 bg-brand-gold mx-auto mb-3" />
                <p className="text-xs text-white/60 font-light">
                  Get the latest fashion edits and exclusive offers directly in your inbox.
                </p>
              </div>
              <form onSubmit={handleSubscribe} className="space-y-3">
                <input 
                  type="email"
                  required
                  className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-5 text-xs focus:outline-none focus:border-brand-gold text-white placeholder:text-white/40"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button 
                  type="submit"
                  className="w-full bg-brand-gold text-brand-black py-3 rounded-full text-[10px] uppercase font-bold tracking-wider hover:bg-white transition-all"
                >
                  Subscribe Now
                </button>
              </form>
              <p className="text-[8px] text-white/40 text-center">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

// SEO Component
const SEO = ({ title, description }: { title: string; description: string }) => {
  React.useEffect(() => {
    document.title = title;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) {
      meta.setAttribute('content', description);
    } else {
      const newMeta = document.createElement('meta');
      newMeta.name = 'description';
      newMeta.content = description;
      document.head.appendChild(newMeta);
    }
  }, [title, description]);
  
  return null;
};

export default Blog;