import React from 'react';
import { motion } from 'motion/react';
import { Award, Heart, Globe, Sparkles, ShieldCheck, Users, Trophy, Clock, Star, Quote, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const About = () => {
  const stats = [
    { number: '150+', label: 'Artisans Employed', icon: Users },
    { number: '25k+', label: 'Happy Clients', icon: Star },
    { number: '7+', label: 'Years of Excellence', icon: Clock },
    { number: '50+', label: 'Awards Won', icon: Trophy }
  ];

  const values = [
    { icon: Award, title: 'Quality First', desc: 'We source only the finest fabrics—from breathable Lawn to luxurious Silks and Chiffons.' },
    { icon: Sparkles, title: 'Artisan Crafted', desc: 'Our embroidery is true hand-work, preserving the dying arts of Zardozi and Resham.' },
    { icon: Heart, title: 'Client Centric', desc: 'Your satisfaction is our obsession. We provide personalized tailoring and services.' },
    { icon: ShieldCheck, title: 'Authenticity', desc: 'Every piece comes with a certificate of authenticity and quality guarantee.' },
    { icon: Globe, title: 'Global Reach', desc: 'Serving luxury fashion lovers across Pakistan and worldwide.' },
    { icon: Sparkles, title: 'Innovation', desc: 'Blending traditional craftsmanship with contemporary designs.' }
  ];

  return (
    <div className="bg-white">
      <SEO 
        title="About Us | UFR Collection - Luxury Pakistani Fashion Brand"
        description="Discover the story behind UFR Collection. Learn about our mission, values, and commitment to preserving Pakistani craftsmanship through luxury fashion."
      />

      {/* Hero Section */}
      <section className="relative min-h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
           src="https://images.pexels.com/photos/1468379/pexels-photo-1468379.jpeg?w=1600&h=900&fit=crop"
            className="w-full h-full object-cover"
            alt="UFR Collection luxury fashion background"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/60 to-black/70" />
        </div>
        <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px] md:text-xs mb-4">A Legacy of Style</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif mb-6">Our Heritage</h1>
            <div className="w-20 h-0.5 bg-brand-gold mx-auto mb-6" />
            <p className="text-white/80 text-sm md:text-base max-w-2xl mx-auto font-light">
              Where tradition meets contemporary luxury, we craft timeless pieces that celebrate the essence of Pakistani women.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16 md:py-24 container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2 space-y-6"
          >
            <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px]">Since 2018</p>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-serif leading-tight">Crafting Dreams into Reality</h2>
            <div className="w-16 h-0.5 bg-brand-gold" />
            <p className="text-brand-grey font-light leading-relaxed text-base md:text-lg">
              UFR Collection is more than a fashion house; it's a celebration of Pakistani craftsmanship. 
              What started as a small boutique in Karachi has evolved into a global symbol of Eastern luxury and grace.
            </p>
            <p className="text-brand-grey font-light leading-relaxed text-sm md:text-base">
              Our mission is to empower women through fashion that speaks of heritage, quality, and timeless elegance. 
              Every stitch in our garments tells a story of dedication, passed down through generations of master artisans.
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-6 pt-6">
              {stats.map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                  className="text-center md:text-left"
                >
                  <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <stat.icon size={20} className="text-brand-gold" />
                    <p className="text-2xl md:text-3xl font-serif font-bold text-brand-black">{stat.number}</p>
                  </div>
                  <p className="text-[9px] md:text-[10px] uppercase tracking-wider text-brand-grey font-bold">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:w-1/2"
          >
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200"
                alt="UFR Collection craftsmanship"
                className="rounded-2xl shadow-2xl relative z-10 w-full object-cover"
              />
              <div className="absolute -top-5 -left-5 md:-top-8 md:-left-8 w-full h-full border-2 border-brand-gold/30 rounded-2xl -z-10" />
              <div className="absolute -bottom-5 -right-5 md:-bottom-8 md:-right-8 w-32 h-32 md:w-48 md:h-48 bg-brand-gold/5 rounded-full blur-3xl -z-10" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-16 md:py-24 bg-brand-cream border-y border-brand-beige">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center mb-12 md:mb-16">
            <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px] mb-3">Our Core</p>
            <h2 className="text-3xl md:text-5xl font-serif mb-4">The UFR Philosophy</h2>
            <div className="w-16 h-0.5 bg-brand-gold mx-auto" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {values.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-white rounded-2xl p-6 md:p-8 shadow-md hover:shadow-xl transition-all duration-300 group"
              >
                <div className="w-14 h-14 bg-brand-cream rounded-full flex items-center justify-center mb-5 group-hover:bg-brand-gold transition-colors duration-300">
                  <item.icon size={24} className="text-brand-gold group-hover:text-white transition-colors duration-300" />
                </div>
                <h3 className="text-xl md:text-2xl font-serif mb-3">{item.title}</h3>
                <p className="text-brand-grey text-sm leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Meet the Founder Section */}
      <section className="py-16 md:py-24 container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row items-center gap-12 md:gap-16">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="md:w-1/3"
          >
            <div className="relative">
              <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-2xl">
                <img
                  src="https://i.ibb.co/nsYwbCBh/Whats-App-Image-2025-12-19-at-11-01-29-PM.jpg"
                  alt="Umar Farooq - Founder of UFR Collection"
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-brand-gold/10 rounded-full blur-2xl -z-10" />
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="md:w-2/3 space-y-6"
          >
            <div className="space-y-3">
              <p className="text-brand-gold font-bold uppercase tracking-[0.3em] text-[9px] md:text-[10px]">The Visionary</p>
              <div className="flex items-start gap-3">
                <Quote size={32} className="text-brand-gold/30 shrink-0" />
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-serif leading-relaxed italic">
                  "Fashion is not just about clothes; it's about the confidence a woman feels when she wears a piece that reflects her true essence."
                </h2>
              </div>
            </div>
            <div className="pt-4">
              <p className="font-bold uppercase tracking-wider text-sm">Umar Farooq</p>
              <p className="text-brand-grey text-[9px] md:text-[10px] uppercase tracking-wider mt-1">Founder & Creative Director</p>
              <Link 
                to="/contact" 
                className="inline-flex items-center gap-2 mt-6 text-brand-gold text-[10px] uppercase tracking-wider font-bold hover:gap-3 transition-all"
              >
                Connect with Us <ChevronRight size={12} />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?q=80&w=1600"
            className="w-full h-full object-cover"
            alt="Luxury fashion"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-brand-black/90 to-brand-black/70" />
        </div>
        <div className="relative z-10 container mx-auto px-4 text-center max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-serif text-white">Experience Luxury</h2>
            <p className="text-white/70 text-sm md:text-base max-w-xl mx-auto">
              Explore our exquisite collection and become part of the UFR family. 
              Each piece is crafted with love and attention to detail.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link 
                to="/shop" 
                className="bg-brand-gold text-black px-8 py-3 rounded-full text-[10px] md:text-xs uppercase font-bold tracking-wider hover:bg-white transition-all inline-block"
              >
                Shop Now
              </Link>
              <Link 
                to="/contact" 
                className="border border-white text-white px-8 py-3 rounded-full text-[10px] md:text-xs uppercase font-bold tracking-wider hover:bg-white hover:text-black transition-all inline-block"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// SEO Component (if not already imported)
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

export default About;