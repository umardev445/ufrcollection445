import React from 'react';
import { motion } from 'motion/react';
import { Calendar, User, Clock, ChevronRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const blogPosts = [
  {
    id: 1,
    title: "10 Styling Tips for Summer Lawn Collections",
    excerpt: "Discover how to stay perfectly chic in the scorching heat with our latest premium lawn essentials...",
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800",
    date: "May 12, 2026",
    category: "Styling Guides",
    readTime: "5 min read"
  },
  {
    id: 2,
    title: "The Ultimate Guide to Pakistani Bridal Fashion 2026",
    excerpt: "Trends that are shaping the wedding season. From heritage zari to modern minimalist silhouettes...",
    image: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800",
    date: "April 28, 2026",
    category: "Trends",
    readTime: "12 min read"
  },
  {
    id: 3,
    title: "Behind the Scenes: Crafting the Regal collection",
    excerpt: "A look into our atelier where master artisans spend hundreds of hours on a single formal ensemble...",
    image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=800",
    date: "April 15, 2026",
    category: "Craftsmanship",
    readTime: "8 min read"
  }
];

const Blog = () => {
  return (
    <div className="bg-white min-h-screen">
       {/* Header */}
      <div className="bg-brand-cream py-24 border-b border-brand-beige">
        <div className="container mx-auto px-4 text-center">
          <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px] mb-4">Fashion Edit</p>
          <h1 className="text-4xl md:text-6xl font-serif mb-6">The UFR Journal</h1>
          <p className="text-brand-grey text-sm uppercase tracking-widest font-light">Elegance, Trends & Craftsmanship</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
         <div className="flex flex-col lg:flex-row gap-16">
            {/* Blog List */}
            <div className="lg:w-2/3 space-y-20">
               {blogPosts.map((post, i) => (
                 <motion.article
                   key={post.id}
                   initial={{ opacity: 0, y: 30 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   className="group cursor-pointer"
                 >
                    <div className="aspect-[21/9] overflow-hidden rounded-luxury-lg mb-8 bg-brand-beige">
                       <img
                         src={post.image}
                         alt={post.title}
                         className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:grayscale-0 group-hover:scale-105"
                       />
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-6 text-[10px] uppercase font-bold tracking-widest text-brand-grey">
                          <span className="text-brand-gold">{post.category}</span>
                          <span className="flex items-center gap-2"><Calendar size={12} /> {post.date}</span>
                          <span className="flex items-center gap-2"><Clock size={12} /> {post.readTime}</span>
                       </div>
                       <h2 className="text-3xl font-serif group-hover:text-brand-gold transition-colors">{post.title}</h2>
                       <p className="text-brand-grey font-light leading-relaxed max-w-2xl">{post.excerpt}</p>
                       <Link to={`/blog/${post.id}`} className="inline-flex items-center gap-2 text-[10px] uppercase font-bold tracking-[0.2em] border-b border-brand-black pb-1 hover:text-brand-gold hover:border-brand-gold transition-all">
                          Read The Full Edit <ChevronRight size={14} />
                       </Link>
                    </div>
                 </motion.article>
               ))}
            </div>

            {/* Sidebar */}
            <aside className="lg:w-1/3 space-y-12">
               <div className="bg-brand-cream p-8 rounded-luxury border border-brand-beige space-y-6">
                  <h3 className="font-serif text-2xl">Search Journal</h3>
                  <div className="relative">
                     <input className="w-full bg-white border border-brand-beige rounded-full py-3 px-10 text-xs focus:outline-none focus:border-brand-gold" placeholder="Search articles..." />
                     <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
                  </div>
               </div>

               <div className="space-y-6">
                  <h3 className="font-serif text-2xl">Categories</h3>
                  <div className="flex flex-col gap-4">
                     {['Styling Guides', 'Trends', 'Craftsmanship', 'Inside the Atelier'].map(cat => (
                       <button key={cat} className="text-xs uppercase font-bold tracking-widest text-left hover:text-brand-gold flex justify-between items-center group">
                          {cat}
                          <span className="text-[10px] text-brand-grey opacity-50 group-hover:opacity-100">(12)</span>
                       </button>
                     ))}
                  </div>
               </div>

               <div className="bg-brand-black text-white p-8 rounded-luxury space-y-6">
                  <h3 className="font-serif text-2xl text-center">Join The Circle</h3>
                  <p className="text-sm font-light text-center opacity-60">Get the latest fashion edits and exclusive offers directly in your inbox.</p>
                  <input className="w-full bg-white/10 border border-white/20 rounded-full py-3 px-6 text-xs focus:outline-none focus:border-brand-gold" placeholder="Email Address" />
                  <button className="w-full bg-brand-gold text-brand-black py-4 rounded-full text-xs uppercase font-bold tracking-widest hover:bg-white transition-all">Subscribe Now</button>
               </div>
            </aside>
         </div>
      </div>
    </div>
  );
};

export default Blog;
