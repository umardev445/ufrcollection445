import React from 'react';
import { motion } from 'motion/react';
import { Award, Heart, Globe, Sparkles, ShieldCheck, Users } from 'lucide-react';

const About = () => {
  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="relative h-[60vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
           <img
             src="https://images.unsplash.com/photo-1591369822096-faf1d4dee7f2?q=80&w=1600"
             className="w-full h-full object-cover"
             alt="Luxury fashion background"
           />
           <div className="absolute inset-0 bg-black/40" />
        </div>
        <div className="relative z-10 text-center text-white space-y-4 px-4">
           <p className="text-brand-gold font-medium uppercase tracking-[0.4em] text-xs">A Legacy of Style</p>
           <h1 className="text-5xl md:text-8xl font-serif">Our Heritage</h1>
        </div>
      </section>

      {/* Story */}
      <section className="py-24 container mx-auto px-4">
         <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="lg:w-1/2 space-y-8">
               <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px]">Since 2018</p>
               <h2 className="text-4xl md:text-6xl font-serif leading-tight">Crafting Dreams into Reality</h2>
               <p className="text-brand-grey font-light leading-relaxed text-lg">
                 UFR Collection is more than a fashion house; it's a celebration of Pakistani craftsmanship. What started as a small boutique in Karachi has evolved into a global symbol of Eastern luxury and grace.
               </p>
               <p className="text-brand-grey font-light leading-relaxed">
                 Our mission is to empower women through fashion that speaks of heritage, quality, and timeless elegance. Every stitch in our garments tells a story of dedication, passed down through generations of master artisans.
               </p>

               <div className="grid grid-cols-2 gap-8 pt-8">
                  <div className="space-y-2">
                     <p className="text-3xl font-serif font-bold text-brand-black">150+</p>
                     <p className="text-[10px] uppercase tracking-widest text-brand-grey font-bold">Artisans Employed</p>
                  </div>
                  <div className="space-y-2">
                     <p className="text-3xl font-serif font-bold text-brand-black">25k+</p>
                     <p className="text-[10px] uppercase tracking-widest text-brand-grey font-bold">Happy Clients</p>
                  </div>
               </div>
            </div>
            <div className="lg:w-1/2">
               <div className="relative">
                  <img
                    src="https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=1200"
                    alt="Craftsmanship"
                    className="rounded-luxury-lg luxury-shadow relative z-10"
                  />
                  <div className="absolute -top-10 -left-10 w-full h-full border-2 border-brand-beige rounded-luxury-lg -z-10 translate-x-4 translate-y-4" />
               </div>
            </div>
         </div>
      </section>

      {/* Philosophy */}
      <section className="py-24 bg-brand-cream border-y border-brand-beige">
         <div className="container mx-auto px-4 text-center">
            <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px] mb-4">Our Core</p>
            <h2 className="text-4xl md:text-5xl font-serif mb-20 text-center">The UFR Philosophy</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
               {[
                 { icon: Award, title: 'Quality First', desc: 'We source only the finest fabrics—from breathable Lawn to luxurious Silks and Chiffons.' },
                 { icon: Sparkles, title: 'Artisan Crafted', desc: 'Our embroidery is true hand-work, preserving the dying arts of Zardozi and Resham.' },
                 { icon: Heart, title: 'Client Centric', desc: 'Your satisfaction is our obsession. We provide personalized tailoring and services.' }
               ].map((item, i) => (
                 <motion.div
                   key={item.title}
                   initial={{ opacity: 0, y: 20 }}
                   whileInView={{ opacity: 1, y: 0 }}
                   viewport={{ once: true }}
                   transition={{ delay: i * 0.2 }}
                   className="space-y-6"
                 >
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto luxury-shadow text-brand-gold">
                       <item.icon size={28} />
                    </div>
                    <h3 className="text-2xl font-serif text-center">{item.title}</h3>
                    <p className="text-brand-grey font-light text-sm leading-relaxed text-center">{item.desc}</p>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Meet the Founder */}
      <section className="py-32 container mx-auto px-4">
         <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-20">
            <div className="md:w-1/3 aspect-[3/4] bg-brand-beige rounded-luxury-lg overflow-hidden shrink-0">
               <img
                 src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=800"
                 alt="Founder"
                 className="w-full h-full object-cover grayscale"
               />
            </div>
            <div className="md:w-2/3 space-y-6 italic">
               <p className="text-brand-gold non-italic font-medium uppercase tracking-[0.3em] text-[10px] text-left">The Visionary</p>
               <h2 className="text-3xl md:text-4xl font-serif leading-relaxed text-left">
                 "Fashion is not just about clothes; it's about the confidence a woman feels when she wears a piece that reflects her true essence."
               </h2>
               <div className="pt-4 non-italic">
                  <p className="font-bold uppercase tracking-widest text-xs">Umar Farooq</p>
                  <p className="text-brand-grey text-[10px] uppercase tracking-widest mt-1">Founder & Creative Director</p>
               </div>
            </div>
         </div>
      </section>
    </div>
  );
};

export default About;
