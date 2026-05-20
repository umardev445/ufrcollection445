import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { homepageService, HomepageConfig, HeroSlide, HomeSection, HomeBanner } from '../../services/homepageService';
import { Plus, Trash2, MoveUp, MoveDown, Save, Eye, Layout, Image as ImageIcon, Type, Link as LinkIcon, ToggleLeft, ToggleRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/cn';

const HomepageManager = () => {
  const [config, setConfig] = useState<HomepageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'banners'>('hero');

  useEffect(() => {
    const fetchConfig = async () => {
      const data = await homepageService.getConfig();
      if (data) {
        setConfig(data);
      } else {
        // Initialize default config if none exists
        setConfig({
          heroSlides: [],
          sections: [
            { id: 'categories', type: 'categories', enabled: true, heading: 'Shop By Category', order: 1 },
            { id: 'new-arrivals', type: 'new-arrivals', enabled: true, heading: 'New Arrivals', order: 2 },
            { id: 'best-sellers', type: 'best-sellers', enabled: true, heading: 'Most Loved Items', order: 3 },
            { id: 'story', type: 'story', enabled: true, heading: 'Our Heritage', order: 4 },
            { id: 'instagram', type: 'instagram', enabled: false, heading: '@ufrcollection_official', order: 5 }
          ],
          banners: []
        });
      }
      setLoading(false);
    };
    fetchConfig();
  }, []);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    const success = await homepageService.updateConfig(config);
    if (success) {
      toast.success('Maison Homepage Configuration updated successfully');
    }
    setSaving(false);
  };

  const addHeroSlide = () => {
    if (!config) return;
    const newSlide: HeroSlide = {
      id: Date.now().toString(),
      image: '',
      title: 'New Collection Title',
      subtitle: 'Premium Pakistani Couture',
      cta: 'Shop Now',
      link: '/shop',
      order: config.heroSlides.length + 1
    };
    setConfig({ ...config, heroSlides: [...config.heroSlides, newSlide] });
  };

  const updateSlide = (index: number, data: Partial<HeroSlide>) => {
    if (!config) return;
    const newSlides = [...config.heroSlides];
    newSlides[index] = { ...newSlides[index], ...data };
    setConfig({ ...config, heroSlides: newSlides });
  };

  const deleteSlide = (index: number) => {
    if (!config) return;
    const newSlides = config.heroSlides.filter((_, i) => i !== index);
    setConfig({ ...config, heroSlides: newSlides });
  };

  const moveItem = (type: 'hero' | 'sections', index: number, direction: 'up' | 'down') => {
    if (!config) return;
    const items = type === 'hero' ? [...config.heroSlides] : [...config.sections];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= items.length) return;
    
    [items[index], items[newIndex]] = [items[newIndex], items[index]];
    
    // Update display orders
    items.forEach((item, i) => (item.order = i + 1));
    
    if (type === 'hero') {
      setConfig({ ...config, heroSlides: items as HeroSlide[] });
    } else {
      setConfig({ ...config, sections: items as HomeSection[] });
    }
  };

  const addBanner = () => {
    if (!config) return;
    const newBanner: HomeBanner = {
      id: Date.now().toString(),
      image: '',
      title: 'Promotional Offer',
      link: '/shop',
      order: (config.banners?.length || 0) + 1,
      enabled: true
    };
    setConfig({ ...config, banners: [...(config.banners || []), newBanner] });
  };

  const updateBanner = (index: number, data: Partial<HomeBanner>) => {
    if (!config) return;
    const newBanners = [...(config.banners || [])];
    newBanners[index] = { ...newBanners[index], ...data };
    setConfig({ ...config, banners: newBanners });
  };

  const deleteBanner = (index: number) => {
    if (!config) return;
    const newBanners = config.banners?.filter((_, i) => i !== index) || [];
    setConfig({ ...config, banners: newBanners });
  };

  if (loading) return <AdminLayout title="Homepage Manager"><div className="animate-pulse flex items-center justify-center h-64 font-serif uppercase tracking-widest text-brand-grey">Accessing Boutique Registry...</div></AdminLayout>;

  return (
    <AdminLayout title="Maison Homepage Designer">
      <div className="flex flex-col gap-8">
        <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-brand-beige luxury-shadow">
           <div className="flex gap-4">
              {(['hero', 'sections', 'banners'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "px-6 py-2 rounded-full text-[10px] uppercase font-bold tracking-widest transition-all",
                    activeTab === tab ? "bg-brand-black text-white" : "hover:bg-brand-cream text-brand-grey"
                  )}
                >
                  {tab === 'hero' ? 'Cinematic Hero' : tab === 'sections' ? 'Layout Sections' : 'Dynamic Banners'}
                </button>
              ))}
           </div>
           <button
             onClick={handleSave}
             disabled={saving}
             className="flex items-center gap-2 bg-brand-gold text-brand-black px-8 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest hover:scale-105 transition-all disabled:opacity-50"
           >
             <Save size={16} />
             {saving ? 'Transmitting...' : 'Save Configuration'}
           </button>
        </div>

        {activeTab === 'hero' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
               <h3 className="font-serif text-xl">Cinematic Sliders</h3>
               <button onClick={addHeroSlide} className="flex items-center gap-2 text-brand-gold text-[10px] uppercase font-bold tracking-widest border border-brand-gold px-4 py-2 rounded-full hover:bg-brand-gold hover:text-white transition-all">
                  <Plus size={14} /> Add Slide
               </button>
            </div>

            <div className="space-y-4">
              {config?.heroSlides.map((slide, index) => (
                <motion.div 
                  key={slide.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white p-6 rounded-xl border border-brand-beige luxury-shadow flex flex-col md:flex-row gap-8"
                >
                  <div className="w-full md:w-64 space-y-4">
                    <div className="aspect-[16/9] rounded-lg overflow-hidden bg-brand-cream relative group">
                       {slide.image ? (
                         <img src={slide.image} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-brand-grey gap-2 text-[10px] uppercase tracking-widest">
                            <ImageIcon size={24} /> No Image
                         </div>
                       )}
                    </div>
                    <div className="flex justify-between">
                       <div className="flex gap-2">
                          <button onClick={() => moveItem('hero', index, 'up')} className="p-2 hover:text-brand-gold transition-colors"><MoveUp size={16}/></button>
                          <button onClick={() => moveItem('hero', index, 'down')} className="p-2 hover:text-brand-gold transition-colors"><MoveDown size={16}/></button>
                       </div>
                       <button onClick={() => deleteSlide(index)} className="p-2 text-red-500 hover:text-red-700 transition-colors"><Trash2 size={16}/></button>
                    </div>
                  </div>

                  <div className="flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">Desktop Image URL</label>
                      <input 
                        type="text" 
                        value={slide.image} 
                        onChange={(e) => updateSlide(index, { image: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-brand-gold"
                        placeholder="https://image-url.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">Mobile Image URL (Optional)</label>
                      <input 
                        type="text" 
                        value={slide.mobileImage || ''} 
                        onChange={(e) => updateSlide(index, { mobileImage: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">Main Title</label>
                      <input 
                        type="text" 
                        value={slide.title} 
                        onChange={(e) => updateSlide(index, { title: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-sm font-serif focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">Subtitle / Tagline</label>
                      <input 
                        type="text" 
                        value={slide.subtitle} 
                        onChange={(e) => updateSlide(index, { subtitle: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">CTA Text</label>
                      <input 
                        type="text" 
                        value={slide.cta} 
                        onChange={(e) => updateSlide(index, { cta: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey block">Primary Link</label>
                      <input 
                        type="text" 
                        value={slide.link} 
                        onChange={(e) => updateSlide(index, { link: e.target.value })}
                        className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-brand-gold"
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'sections' && (
          <div className="space-y-6">
            <h3 className="font-serif text-xl">Display Sections</h3>
            <div className="space-y-2">
              {config?.sections.sort((a,b) => a.order - b.order).map((section, index) => (
                <div key={section.id} className="bg-white p-4 rounded-xl border border-brand-beige luxury-shadow flex items-center gap-6">
                   <div className="flex flex-col gap-1">
                      <button onClick={() => moveItem('sections', index, 'up')} className="p-1 hover:text-brand-gold transition-colors"><MoveUp size={12}/></button>
                      <button onClick={() => moveItem('sections', index, 'down')} className="p-1 hover:text-brand-gold transition-colors"><MoveDown size={12}/></button>
                   </div>
                   <div className="w-10 h-10 rounded-lg bg-brand-cream flex items-center justify-center text-brand-gold">
                      <Layout size={20} />
                   </div>
                   <div className="flex-grow">
                      <h4 className="text-[10px] uppercase font-bold tracking-widest text-brand-grey mb-1">Section Type: {section.type}</h4>
                      <input 
                        type="text" 
                        value={section.heading || ''} 
                        onChange={(e) => {
                          const newSec = [...config.sections];
                          newSec[index].heading = e.target.value;
                          setConfig({ ...config, sections: newSec });
                        }}
                        className="font-serif text-lg bg-transparent border-none focus:outline-none focus:ring-0 w-full"
                        placeholder="Section Heading"
                      />
                   </div>
                   <button 
                     onClick={() => {
                        const newSec = [...config.sections];
                        newSec[index].enabled = !newSec[index].enabled;
                        setConfig({ ...config, sections: newSec });
                     }}
                     className={cn(
                       "flex items-center gap-2 px-4 py-2 rounded-full text-[8px] uppercase font-bold tracking-[0.2em] transition-all",
                       section.enabled ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-400"
                     )}
                   >
                     {section.enabled ? <><ToggleRight size={14}/> Active</> : <><ToggleLeft size={14}/> Hidden</>}
                   </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Banners Manager */}
        {activeTab === 'banners' && (
           <div className="space-y-6">
             <div className="flex justify-between items-center">
                <h3 className="font-serif text-xl">Dynamic Promotional Banners</h3>
                <button onClick={addBanner} className="flex items-center gap-2 text-brand-gold text-[10px] uppercase font-bold tracking-widest border border-brand-gold px-4 py-2 rounded-full hover:bg-brand-gold hover:text-white transition-all">
                   <Plus size={14} /> Add Banner
                </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {(config?.banners || []).map((banner, index) => (
                  <motion.div 
                    key={banner.id}
                    className="bg-white p-6 rounded-xl border border-brand-beige luxury-shadow space-y-4"
                  >
                    <div className="aspect-[21/9] rounded-lg overflow-hidden bg-brand-cream relative">
                       {banner.image ? (
                         <img src={banner.image} className="w-full h-full object-cover" />
                       ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-brand-grey font-bold text-[8px] uppercase tracking-widest">
                            <ImageIcon size={20} className="mb-2" /> No Banner Selected
                         </div>
                       )}
                    </div>
                    <div className="space-y-3">
                       <input 
                         type="text" 
                         value={banner.title} 
                         onChange={(e) => updateBanner(index, { title: e.target.value })}
                         placeholder="Banner Title/Code"
                         className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-2 text-xs focus:outline-none"
                       />
                       <input 
                         type="text" 
                         value={banner.image} 
                         onChange={(e) => updateBanner(index, { image: e.target.value })}
                         placeholder="Image URL"
                         className="w-full bg-brand-cream border border-brand-beige rounded-lg px-4 py-2 text-[10px] focus:outline-none"
                       />
                       <div className="flex gap-2">
                          <input 
                            type="text" 
                            value={banner.link || ''} 
                            onChange={(e) => updateBanner(index, { link: e.target.value })}
                            placeholder="Destination Link"
                            className="flex-grow bg-brand-cream border border-brand-beige rounded-lg px-4 py-2 text-[10px] focus:outline-none"
                          />
                          <button onClick={() => deleteBanner(index)} className="p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                       </div>
                    </div>
                  </motion.div>
                ))}
             </div>
           </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default HomepageManager;
