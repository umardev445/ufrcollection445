import React from 'react';
import { Mail, Phone, MapPin, MessageCircle, Clock, ChevronDown, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils/cn';

const faq = [
  { q: "What is your standard delivery time?", a: "For orders within Pakistan, delivery usually takes 3-5 business days. International orders can take 10-15 business days." },
  { q: "Do you offer customization in sizes?", a: "Yes, we offer bespoke tailoring for our Bridal and Luxury Pret collections. Please contact our WhatsApp support for customization requests." },
  { q: "How can I exchange my order?", a: "We offer a 7-day easy exchange policy for unused items with tags. Please initiate the request through our contact form or WhatsApp." },
  { q: "Do you offer Cash on Delivery?", a: "Yes, we offer COD nationwide in Pakistan with a standard fee of Rs. 180." }
];

const Contact = () => {
  const [activeFaq, setActiveFaq] = React.useState<number | null>(null);

  return (
    <div className="bg-white">
      {/* Search Header */}
      <div className="bg-brand-cream py-24 border-b border-brand-beige">
        <div className="container mx-auto px-4 text-center">
          <p className="text-brand-gold font-medium uppercase tracking-[0.3em] text-[10px] mb-4">Support & Concierge</p>
          <h1 className="text-4xl md:text-6xl font-serif mb-6">How Can We Assist?</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-24">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-24">
            {/* Contact Info */}
            <div className="space-y-12">
               <div className="space-y-4 text-left">
                  <h2 className="text-3xl md:text-4xl font-serif text-left">Get In Touch</h2>
                  <p className="text-brand-grey font-light leading-relaxed">Our fashion consultants are available to assist you with styling advice, size queries, and order updates.</p>
               </div>

               <div className="space-y-8">
                  <div className="flex gap-6 items-center">
                     <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold shrink-0">
                        <Phone size={20} />
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-grey">Call Us</p>
                        <p className="font-serif text-lg text-left">+92 300 1234567</p>
                     </div>
                  </div>
                  <div className="flex gap-6 items-center">
                     <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold shrink-0">
                        <Mail size={20} />
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-grey">Email Support</p>
                        <p className="font-serif text-lg text-left">concierge@ufrcollection.com</p>
                     </div>
                  </div>
                  <div className="flex gap-6 items-center">
                     <div className="w-12 h-12 bg-brand-cream rounded-full flex items-center justify-center text-brand-gold shrink-0">
                        <MapPin size={20} />
                     </div>
                     <div className="text-left">
                        <p className="text-[10px] uppercase tracking-widest font-bold text-brand-grey">Visit Boutique</p>
                        <p className="font-serif text-lg text-left">Plot 12-C, Lane 4, Zamzama Blvd, DHA Phase 5, Karachi</p>
                     </div>
                  </div>
               </div>

               {/* FAQ */}
               <div className="pt-12 border-t border-brand-beige">
                  <h3 className="font-serif text-2xl mb-8 text-left">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                     {faq.map((item, i) => (
                       <div key={i} className="border border-brand-beige rounded-xl overflow-hidden">
                          <button
                            onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                            className="w-full flex items-center justify-between p-5 text-left bg-brand-cream/30 hover:bg-brand-cream transition-colors"
                          >
                             <span className="text-sm font-bold uppercase tracking-widest">{item.q}</span>
                             <ChevronDown className={cn("transition-transform", activeFaq === i ? "rotate-180" : "")} size={18} />
                          </button>
                          <AnimatePresence>
                             {activeFaq === i && (
                               <motion.div
                                 initial={{ height: 0 }}
                                 animate={{ height: 'auto' }}
                                 exit={{ height: 0 }}
                                 className="overflow-hidden"
                               >
                                  <div className="p-5 text-sm font-light text-brand-grey bg-white border-t border-brand-beige">
                                     {item.a}
                                  </div>
                               </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* Form */}
            <div className="bg-brand-cream p-10 md:p-16 rounded-luxury-lg luxury-shadow">
               <h3 className="font-serif text-3xl mb-8">Send a Message</h3>
               <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Your Name</label>
                        <input className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Phone Number</label>
                        <input className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Email Address</label>
                     <input className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Message</label>
                     <textarea rows={5} className="w-full bg-white border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" />
                  </div>
                  <button className="w-full bg-brand-black text-white py-5 rounded-full text-xs uppercase font-bold tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-xl">
                     Send Message
                     <Send size={18} />
                  </button>
               </form>

               <div className="mt-12 pt-12 border-t border-brand-beige flex flex-col items-center gap-6">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-brand-grey">Prefer Instant Chat?</p>
                  <a
                    href="https://wa.me/923001234567"
                    target="_blank"
                    className="flex items-center gap-3 bg-[#25D366] text-white px-8 py-3 rounded-full text-sm font-bold shadow-lg hover:scale-105 transition-all"
                  >
                    <MessageCircle size={20} />
                    WhatsApp Support
                  </a>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Contact;
