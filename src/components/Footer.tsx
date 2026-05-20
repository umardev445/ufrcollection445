import React from 'react';
import { Instagram, Facebook, Twitter, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-brand-black text-white pt-20 pb-10">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <Link to="/" className="text-3xl font-serif font-bold tracking-tighter inline-block">
              U<span className="text-brand-gold italic">F</span>R
              <span className="text-[10px] uppercase tracking-[0.3em] font-light block mt-1 text-white/50">
                Collection
              </span>
            </Link>
            <p className="text-sm text-white/60 leading-relaxed font-light">
              Experience the pinnacle of Pakistani fashion. Our collections blend traditional craftsmanship with modern luxury, designed for the contemporary woman.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold transition-colors">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold transition-colors">
                <Facebook size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center hover:bg-brand-gold transition-colors">
                <Twitter size={18} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-8 tracking-wide">Quick Links</h4>
            <ul className="space-y-4 text-sm text-white/60 font-light">
              <li><Link to="/shop" className="hover:text-brand-gold transition-colors">Latest Arrivals</Link></li>
              <li><Link to="/shop?category=formal" className="hover:text-brand-gold transition-colors">Formal Wear</Link></li>
              <li><Link to="/shop?category=bridal" className="hover:text-brand-gold transition-colors">Bridal Collection</Link></li>
              <li><Link to="/about" className="hover:text-brand-gold transition-colors">Our Story</Link></li>
              <li><Link to="/blog" className="hover:text-brand-gold transition-colors">Fashion Edit</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-8 tracking-wide">Customer Care</h4>
            <ul className="space-y-4 text-sm text-white/60 font-light">
              <li><Link to="/track-order" className="hover:text-brand-gold transition-colors">Track Your Order</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">Shipping Policy</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">Size Guide</Link></li>
              <li><Link to="/contact" className="hover:text-brand-gold transition-colors">FAQs</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-serif text-lg mb-8 tracking-wide">Newsletter</h4>
            <p className="text-sm text-white/60 font-light mb-6">Join our elite circle for exclusive access to new launches & special events.</p>
            <form className="relative">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-white/5 border border-white/10 rounded-lg py-3 px-4 text-sm focus:outline-none focus:border-brand-gold transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-2 bottom-2 bg-brand-gold px-4 rounded-md text-[10px] uppercase tracking-widest font-bold text-brand-black"
              >
                Join
              </button>
            </form>
          </div>
        </div>

        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-light">
            © 2026 UFR Collection. All Rights Reserved.
          </p>
          <div className="flex gap-4 items-center grayscale opacity-50 grayscale hover:opacity-100 transition-opacity">
            <span className="text-[10px] uppercase tracking-widest mr-2">Secure Payments</span>
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-[8px] font-bold">VISA</div>
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-[8px] font-bold">MC</div>
            <div className="w-12 h-8 bg-white/5 rounded flex items-center justify-center text-[8px] font-bold px-1 text-center leading-[1]">JAZZ CASH</div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
