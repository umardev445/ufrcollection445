import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { offerService, Offer } from '../../services/offerService';
import { productService, Product } from '../../services/productService';
import { Plus, Trash2, Edit2, Check, X, Search, Tag, Calendar, Image as ImageIcon, Percent } from 'lucide-react';
import toast from 'react-hot-toast';
import { cn } from '../../utils/cn';

const OfferManagement = () => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOffer, setEditingOffer] = useState<Partial<Offer> | null>(null);
  const [productSearch, setProductSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'products'>('details');

  const categories = [
    'Bridal Wear',
    'Luxury Pret',
    'Formal Wear',
    'Unstitched',
    'Accessories',
    'Menswear'
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      console.log("Maison: Starting data synchronization...");
      const [oData, pData] = await Promise.all([
        offerService.getAllOffers().catch(err => {
          console.error("Maison: Offer sync failed", err);
          return [] as Offer[];
        }),
        productService.getAllProducts().catch(err => {
          console.error("Maison: Product sync failed", err);
          return [] as Product[];
        })
      ]);
      setOffers(oData);
      setProducts(pData);
      console.log(`Maison: Sync complete. Offers: ${oData.length}, Products: ${pData.length}`);
    } catch (error) {
      console.error("Failed to fetch data", error);
      toast.error("Failed to load maison data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOffer = async () => {
    if (!editingOffer || !editingOffer.name || !editingOffer.type) {
      toast.error('Name and Type are required');
      return;
    }

    const data = {
      name: editingOffer.name,
      description: editingOffer.description || '',
      type: editingOffer.type,
      value: Number(editingOffer.value) || 0,
      offerLabel: editingOffer.offerLabel || '',
      startDate: editingOffer.startDate || '',
      endDate: editingOffer.endDate || '',
      status: editingOffer.status || 'active',
      productIds: editingOffer.productIds || [],
      categories: editingOffer.categories || [],
      bannerImage: editingOffer.bannerImage || ''
    };

    let success;
    if (editingOffer.id) {
      success = await offerService.updateOffer(editingOffer.id, data);
    } else {
      success = await offerService.addOffer(data as any);
    }

    if (success) {
      toast.success('Maison Offer synchronized successfully');
      setEditingOffer(null);
      fetchData();
    }
  };

  const deleteOffer = async (id: string) => {
    if (window.confirm('Dissolve this offer from the boutique archive?')) {
      const success = await offerService.deleteOffer(id);
      if (success) {
        toast.success('Offer dissolved');
        fetchData();
      }
    }
  };

  const toggleProduct = (productId: string) => {
    if (!editingOffer) return;
    const currentIds = editingOffer.productIds || [];
    const newIds = currentIds.includes(productId)
      ? currentIds.filter(id => id !== productId)
      : [...currentIds, productId];
    setEditingOffer({ ...editingOffer, productIds: newIds });
  };

  const toggleCategory = (category: string) => {
    if (!editingOffer) return;
    const currentCats = editingOffer.categories || [];
    const newCats = currentCats.includes(category)
      ? currentCats.filter(c => c !== category)
      : [...currentCats, category];
    setEditingOffer({ ...editingOffer, categories: newCats });
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.category.toLowerCase().includes(productSearch.toLowerCase())
  );

  if (loading) return <AdminLayout title="Offer Manager"><div className="animate-pulse flex items-center justify-center h-64 font-serif uppercase tracking-widest text-brand-grey text-xs">Architecting Promotions...</div></AdminLayout>;

  return (
    <AdminLayout title="Promotions & Client Offers">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Offer List */}
        <div className="lg:col-span-1 space-y-6">
           <div className="flex justify-between items-center">
              <h3 className="font-serif text-xl font-bold">Active Incentives</h3>
              <button 
                onClick={() => {
                  setEditingOffer({ 
                    name: '', 
                    type: 'percentage', 
                    value: 0,
                    offerLabel: '',
                    status: 'active', 
                    productIds: [],
                    categories: [],
                    startDate: '',
                    endDate: ''
                  });
                  setActiveTab('details');
                }}
                className="p-2 border border-brand-gold text-brand-gold rounded-full hover:bg-brand-gold hover:text-white transition-all shadow-lg shadow-brand-gold/10"
              >
                 <Plus size={18} />
              </button>
           </div>
           
           <div className="space-y-4">
              {offers.length > 0 ? offers.map(o => (
                <div 
                  key={o.id} 
                  className={cn(
                    "bg-white p-5 rounded-2xl border transition-all cursor-pointer luxury-shadow-sm group",
                    editingOffer?.id === o.id ? "border-brand-gold ring-1 ring-brand-gold bg-brand-gold/5" : "border-brand-beige hover:border-brand-gold/50"
                  )}
                  onClick={() => {
                    setEditingOffer(o);
                    setActiveTab('details');
                  } }
                >
                   <div className="flex gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-cream border border-brand-beige flex items-center justify-center shrink-0 group-hover:bg-brand-gold group-hover:text-white transition-colors duration-500">
                         <Tag size={20} />
                      </div>
                      <div className="flex-grow overflow-hidden">
                         <div className="flex justify-between items-start">
                            <h4 className="font-serif font-bold truncate group-hover:text-brand-gold transition-colors">{o.name}</h4>
                            <span className={cn(
                              "text-[7px] uppercase font-black px-2 py-0.5 rounded-full",
                              o.status === 'active' ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                            )}>
                              {o.status}
                            </span>
                         </div>
                         <p className="text-[9px] uppercase tracking-widest text-brand-grey mb-3">{o.type.replace('_', ' ')} • {o.offerLabel}</p>
                         <div className="flex gap-4 items-center">
                            <button onClick={(e) => { e.stopPropagation(); deleteOffer(o.id); }} className="text-red-400 hover:text-red-600 transition-colors"><Trash2 size={14} /></button>
                            <span className="text-[8px] text-brand-grey font-medium flex items-center gap-1 ml-auto">
                               <Calendar size={10} /> {o.startDate ? new Date(o.startDate).toLocaleDateString() : 'Always'}
                            </span>
                         </div>
                      </div>
                   </div>
                </div>
              )) : (
                <div className="py-20 text-center border-2 border-dashed border-brand-beige rounded-2xl">
                   <Tag size={32} className="mx-auto mb-4 opacity-10" />
                   <p className="text-xs text-brand-grey font-light">No boutique offers found</p>
                </div>
              )}
           </div>
        </div>

        {/* Editor */}
        <div className="lg:col-span-2">
           {editingOffer ? (
             <div className="bg-white rounded-2xl border border-brand-beige luxury-shadow overflow-hidden flex flex-col h-full min-h-[600px]">
                <div className="p-6 border-b border-brand-beige flex justify-between items-center bg-brand-cream/30 sticky top-0 z-10">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-brand-gold/10 flex items-center justify-center text-brand-gold">
                         <Tag size={20} />
                      </div>
                      <div>
                        <h3 className="font-serif text-xl">{editingOffer.id ? 'Refine Offer Protocol' : 'Initial Offer Configuration'}</h3>
                        <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-brand-grey">Synchronizing with Maison Catalog</p>
                      </div>
                   </div>
                   <div className="flex gap-3">
                      <button onClick={() => setEditingOffer(null)} className="p-2.5 rounded-full border border-brand-beige text-brand-grey hover:text-brand-black transition-colors"><X size={20}/></button>
                      <button onClick={handleSaveOffer} className="bg-brand-black text-white px-8 py-2.5 rounded-full text-[10px] uppercase font-bold tracking-widest hover:bg-brand-gold transition-all shadow-lg shadow-brand-black/20 flex items-center gap-2"><Check size={16}/> Save Settings</button>
                   </div>
                </div>

                <div className="flex border-b border-brand-beige bg-white">
                   <button 
                    onClick={() => setActiveTab('details')}
                    className={cn(
                      "px-8 py-4 text-[10px] uppercase font-bold tracking-widest transition-all border-b-2",
                      activeTab === 'details' ? "border-brand-gold text-brand-gold bg-brand-gold/5" : "border-transparent text-brand-grey hover:text-brand-black"
                    )}
                   >
                    1. Identity & Rules
                   </button>
                   <button 
                    onClick={() => setActiveTab('products')}
                    className={cn(
                      "px-8 py-4 text-[10px] uppercase font-bold tracking-widest transition-all border-b-2",
                      activeTab === 'products' ? "border-brand-gold text-brand-gold bg-brand-gold/5" : "border-transparent text-brand-grey hover:text-brand-black"
                    )}
                   >
                    2. Product Targeting
                   </button>
                </div>
                
                <div className="p-8 space-y-8 flex-grow overflow-y-auto max-h-[calc(100vh-350px)]">
                   {activeTab === 'details' ? (
                     <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Incentive Title</label>
                              <input 
                                type="text" 
                                value={editingOffer.name || ''} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, name: e.target.value })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                placeholder="Ex: Eid-ul-Adha Grand Finale"
                                required
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Offer Ribbon Label</label>
                              <input 
                                type="text" 
                                value={editingOffer.offerLabel || ''} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, offerLabel: e.target.value })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                placeholder="Ex: 50% OFF, EID SALE, BOGO"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Offer Category</label>
                              <select 
                                value={editingOffer.type || 'percentage'} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, type: e.target.value as any })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              >
                                 <option value="percentage">Percentage Discount</option>
                                 <option value="fixed">Fixed Amount Off</option>
                                 <option value="bogo">Buy One Get One (BOGO)</option>
                                 <option value="free_shipping">Complimentary Courier</option>
                                 <option value="seasonal">Seasonal Masterwork</option>
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Discount Value / Magnitude</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  value={editingOffer.value || 0} 
                                  onChange={(e) => setEditingOffer({ ...editingOffer, value: Number(e.target.value) })}
                                  className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                  placeholder="0"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-grey">
                                   <Percent size={14} />
                                </div>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Initiation Date</label>
                              <input 
                                type="date" 
                                value={editingOffer.startDate ? new Date(editingOffer.startDate).toISOString().split('T')[0] : ''} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, startDate: e.target.value })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Termination Date</label>
                              <input 
                                type="date" 
                                value={editingOffer.endDate ? new Date(editingOffer.endDate).toISOString().split('T')[0] : ''} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, endDate: e.target.value })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                              />
                           </div>
                           <div className="space-y-2 lg:col-span-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Maison Announcement Banner URL</label>
                              <input 
                                type="text" 
                                value={editingOffer.bannerImage || ''} 
                                onChange={(e) => setEditingOffer({ ...editingOffer, bannerImage: e.target.value })}
                                className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-brand-gold transition-all"
                                placeholder="https:// luxury-cdn.com/offer-banner.jpg"
                              />
                           </div>
                        </div>

                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Promotional Narrative</label>
                           <textarea 
                             value={editingOffer.description || ''} 
                             onChange={(e) => setEditingOffer({ ...editingOffer, description: e.target.value })}
                             className="w-full bg-brand-cream/50 border border-brand-beige rounded-xl px-4 py-4 text-sm min-h-[120px] focus:outline-none focus:border-brand-gold transition-all"
                             placeholder="Articulate the exclusivity of this offer to your distinguished clientele..."
                           />
                        </div>

                        <div className="space-y-4 pt-4 border-t border-brand-beige">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Offer Visibility Protocol</label>
                           <div className="flex gap-4">
                              <button 
                                onClick={() => setEditingOffer({ ...editingOffer, status: 'active' })}
                                className={cn(
                                  "flex-grow py-4 rounded-xl border text-[10px] uppercase font-black tracking-widest transition-all",
                                  editingOffer.status === 'active' ? "bg-brand-black text-white border-brand-black" : "bg-white text-brand-grey border-brand-beige"
                                )}
                              >
                                Active
                              </button>
                              <button 
                                onClick={() => setEditingOffer({ ...editingOffer, status: 'inactive' })}
                                className={cn(
                                  "flex-grow py-4 rounded-xl border text-[10px] uppercase font-black tracking-widest transition-all",
                                  editingOffer.status === 'inactive' ? "bg-red-500 text-white border-red-500" : "bg-white text-brand-grey border-brand-beige"
                                )}
                              >
                                Inactive / Draft
                              </button>
                           </div>
                        </div>
                     </div>
                   ) : (
                     <div className="space-y-10 animate-in fade-in duration-500">
                        <section className="space-y-4">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Global Collection Targeting</label>
                           <p className="text-[10px] text-brand-grey italic">Apply this offer to every masterpiece within these collections.</p>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                              {categories.map(cat => (
                                <button
                                  key={cat}
                                  onClick={() => toggleCategory(cat)}
                                  className={cn(
                                    "px-4 py-3 rounded-xl border text-[10px] uppercase font-bold tracking-wider transition-all text-left flex items-center justify-between",
                                    editingOffer.categories?.includes(cat) ? "bg-brand-gold text-brand-black border-brand-gold" : "bg-white text-brand-grey border-brand-beige hover:border-brand-gold"
                                  )}
                                >
                                   {cat}
                                   {editingOffer.categories?.includes(cat) && <Check size={12} />}
                                </button>
                              ))}
                           </div>
                        </section>

                        <section className="space-y-4">
                           <div className="flex justify-between items-center bg-brand-cream/50 p-4 rounded-2xl border border-brand-beige">
                              <div className="flex items-center gap-3">
                                <Search size={14} className="text-brand-grey" />
                                <input 
                                  type="text" 
                                  placeholder="IDENTIFY SPECIFIC ARTPIECES..." 
                                  value={productSearch}
                                  onChange={(e) => setProductSearch(e.target.value)}
                                  className="bg-transparent text-[10px] uppercase font-bold tracking-widest focus:outline-none w-48"
                                />
                              </div>
                              <span className="text-[10px] uppercase font-black tracking-widest text-brand-gold">
                                 {editingOffer.productIds?.length} Selected
                              </span>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1 pr-3 luxury-scrollbar">
                              {filteredProducts.map(product => (
                                <div 
                                  key={product.id} 
                                  onClick={() => toggleProduct(product.id)}
                                  className={cn(
                                    "flex items-center gap-4 p-4 rounded-2xl border cursor-pointer transition-all Luxury-hover",
                                    editingOffer.productIds?.includes(product.id) ? "bg-brand-gold/5 border-brand-gold" : "bg-white border-brand-beige"
                                  )}
                                >
                                   <div className="w-12 h-16 rounded-lg overflow-hidden bg-brand-cream shrink-0 grayscale hover:grayscale-0 transition-all duration-700">
                                      <img src={product.images[0] || undefined} className="w-full h-full object-cover" />
                                   </div>
                                   <div className="flex-grow min-w-0">
                                      <p className="text-[10px] font-black uppercase tracking-tight truncate">{product.name}</p>
                                      <p className="text-[8px] uppercase tracking-[0.2em] text-brand-gold font-bold">{product.category}</p>
                                   </div>
                                   <div className={cn(
                                      "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                      editingOffer.productIds?.includes(product.id) ? "bg-brand-gold border-brand-gold text-white" : "border-brand-beige"
                                   )}>
                                      {editingOffer.productIds?.includes(product.id) && <Check size={12} />}
                                   </div>
                                </div>
                              ))}
                           </div>
                        </section>
                     </div>
                   )}
                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center p-20 text-center bg-white rounded-3xl border-2 border-dashed border-brand-beige text-brand-grey luxury-shadow-sm min-h-[600px]">
                <div className="w-24 h-24 rounded-full bg-brand-cream flex items-center justify-center mb-8 animate-pulse">
                   <Tag size={40} className="text-brand-gold opacity-40" />
                </div>
                <h3 className="font-serif text-2xl mb-3 text-brand-black">Maison Incentive Architect</h3>
                <p className="text-sm max-w-sm font-serif italic text-brand-grey mb-12">Orchestrate exclusivity. Select an offer from the library or design a new incentive protocol for your boutique catalog.</p>
                <button 
                  onClick={() => {
                    setEditingOffer({ 
                      name: '', 
                      type: 'percentage', 
                      value: 0,
                      offerLabel: '',
                      status: 'active', 
                      productIds: [],
                      categories: [],
                      startDate: '',
                      endDate: ''
                    });
                    setActiveTab('details');
                  }}
                  className="bg-brand-black text-white px-10 py-4 rounded-full text-[10px] uppercase font-bold tracking-[0.2em] hover:bg-brand-gold transition-all shadow-xl shadow-brand-black/20"
                >
                   Initiate New Offer
                </button>
             </div>
           )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OfferManagement;
