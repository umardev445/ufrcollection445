import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../../utils/firestore';
import { Plus, Edit2, Trash2, X, Upload, Image as ImageIcon, Search, Filter, Check } from 'lucide-react';
import { formatPrice, cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const ProductManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');

  const initialForm = {
    name: '',
    description: '',
    category: 'Formal',
    price: 0,
    salePrice: 0,
    discount: 0,
    images: ['', ''], // 2-5 images
    sizes: 'S, M, L, XL',
    colors: 'Beige, Black',
    fabric: 'Chiffon',
    stock: 10,
    featured: false,
    isNew: true,
    isBestSeller: false
  };

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const pSnap = await getDocs(collection(db, 'products'));
      setProducts(pSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const toggleCollection = (id: string) => {
    const current = form.collectionIds || [];
    const updated = current.includes(id) 
      ? current.filter(cid => cid !== id)
      : [...current, id];
    setForm({ ...form, collectionIds: updated });
  };

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...form.images];
    newImages[index] = value;
    setForm({ ...form, images: newImages });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500 * 1024) {
        toast.error('Image too large for Maison database. Please use a file under 500KB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        handleImageChange(index, base64String);
        toast.success('Image uploaded and converted');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const productData = {
        ...form,
        sizes: typeof form.sizes === 'string' ? form.sizes.split(',').map(s => s.trim()) : form.sizes,
        colors: typeof form.colors === 'string' ? form.colors.split(',').map(c => c.trim()) : form.colors,
        images: form.images.filter(img => img.trim() !== ''),
        rating: (form as any).rating || 5,
        reviewsCount: (form as any).reviewsCount || 0,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'products', currentId), productData);
        toast.success('Collection article updated!');
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
        toast.success('New article added to boutique!');
      }

      setShowModal(false);
      setForm(initialForm);
      fetchData();
    } catch (err) {
      toast.error('Failed to save article');
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      ...initialForm,
      ...p,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : p.sizes,
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : p.colors,
      images: Array.isArray(p.images) ? (p.images.length >= 2 ? p.images : [...p.images, '']) : ['', '']
    });
    setCurrentId(p.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Exterminate this luxury article from boutique?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Article removed');
      fetchData();
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout title="Boutique Inventory">
       <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6 text-left">
          <div className="flex flex-grow gap-4 w-full md:w-auto">
             <div className="relative flex-grow max-w-sm">
                <input 
                  className="w-full bg-white border border-brand-beige rounded-full py-3 pl-12 pr-6 text-sm focus:outline-none luxury-shadow focus:border-brand-gold transition-all" 
                  placeholder="ID or article name..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-grey" />
             </div>
             <select 
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-brand-beige rounded-full px-6 py-3 text-xs uppercase font-bold tracking-widest luxury-shadow focus:outline-none focus:border-brand-gold appearance-none"
             >
                <option value="All">All Tastes</option>
                {['Formal', 'Casual', 'Party Wear', 'Bridal', 'Luxury Pret', 'Eastern Wear'].map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
          <button
            onClick={() => { setForm(initialForm); setIsEditing(false); setShowModal(true); }}
            className="w-full md:w-auto bg-brand-black text-white px-8 py-3 rounded-full text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:bg-brand-gold transition-all shadow-xl whitespace-nowrap"
          >
            <Plus size={18} />
            Add New Article
          </button>
       </div>

       <div className="bg-white rounded-xl luxury-shadow overflow-hidden border border-brand-beige">
          <table className="w-full text-left">
             <thead>
                <tr className="bg-brand-cream border-b border-brand-beige">
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Product</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Category</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Price</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey">Stock</th>
                   <th className="px-6 py-5 text-[10px] uppercase font-bold tracking-widest text-brand-grey text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-brand-beige">
                {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                   <tr key={p.id} className="hover:bg-brand-cream/30 transition-colors">
                      <td className="px-6 py-4 text-left">
                         <div className="flex items-center gap-4">
                            <img src={p.images[0] || undefined} className="w-12 h-12 object-cover rounded-lg bg-brand-beige shrink-0" />
                            <div className="min-w-0">
                               <p className="text-sm font-serif font-bold truncate">{p.name}</p>
                               <div className="flex gap-2 mt-1">
                                  {p.isNew && <span className="text-[7px] bg-brand-gold text-white px-1.5 py-0.5 rounded uppercase font-black">New</span>}
                                  {p.isBestSeller && <span className="text-[7px] bg-brand-black text-white px-1.5 py-0.5 rounded uppercase font-black">Best</span>}
                               </div>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-brand-grey text-left uppercase">{p.category}</td>
                      <td className="px-6 py-4 text-xs font-bold text-left">
                         {p.salePrice ? (
                            <div className="flex flex-col">
                               <span className="text-brand-gold">{formatPrice(p.salePrice)}</span>
                               <span className="text-[9px] line-through opacity-50">{formatPrice(p.price)}</span>
                            </div>
                         ) : formatPrice(p.price)}
                      </td>
                      <td className="px-6 py-4">
                         <span className={cn(
                           "text-[8px] uppercase font-bold px-2 py-1 rounded-full",
                           p.stock < 10 ? "bg-red-50 text-red-600" : "bg-green-50 text-green-600"
                         )}>
                            {p.stock} In Stock
                         </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                         <div className="flex justify-end gap-2">
                            <button onClick={() => handleEdit(p)} className="p-2 text-brand-grey hover:text-brand-gold hover:bg-brand-cream rounded-lg transition-all"><Edit2 size={16} /></button>
                            <button onClick={() => handleDelete(p.id)} className="p-2 text-red-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={16} /></button>
                         </div>
                      </td>
                   </tr>
                )) : (
                  <tr><td colSpan={5} className="px-6 py-32 text-center text-brand-grey font-serif opacity-50 italic">Empty Boutique Catalog</td></tr>
                )}
             </tbody>
          </table>
       </div>

       {/* Add/Edit Modal */}
       <AnimatePresence>
          {showModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowModal(false)}
                 className="absolute inset-0 bg-black/60 backdrop-blur-sm"
               />
               <motion.div
                 initial={{ opacity: 0, scale: 0.9, y: 30 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.9, y: 30 }}
                 className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-luxury-lg luxury-shadow relative z-10 p-8 md:p-12"
               >
                  <div className="flex justify-between items-center mb-10 border-b border-brand-beige pb-6">
                     <h2 className="text-3xl font-serif">{isEditing ? 'Curate Article' : 'New Couture Piece'}</h2>
                     <button onClick={() => setShowModal(false)}><X size={24} /></button>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
                     <div className="space-y-8">
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Product Name</label>
                           <input required name="name" value={form.name || ''} onChange={handleInputChange} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none focus:border-brand-gold font-serif text-lg" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Description</label>
                           <textarea required name="description" value={form.description || ''} onChange={handleInputChange} rows={4} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none focus:border-brand-gold text-sm font-light italic" />
                        </div>
                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Retail Price (PKR)</label>
                              <input required type="number" name="price" value={form.price || 0} onChange={handleInputChange} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none text-brand-gold font-bold" />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Sale Price</label>
                              <input type="number" name="salePrice" value={form.salePrice || 0} onChange={handleInputChange} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none" />
                           </div>
                        </div>
                     </div>

                     <div className="space-y-8">
                        <div className="space-y-4">
                           <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Maison Imagery</label>
                           <div className="grid grid-cols-2 gap-4">
                              {form.images.map((img, i) => (
                                 <div key={i} className="relative aspect-[3/4] bg-brand-cream rounded-2xl overflow-hidden border border-brand-beige group">
                                    {img ? (
                                       <>
                                          <img src={img} className="w-full h-full object-cover" />
                                          <button onClick={() => handleImageChange(i, '')} className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                                       </>
                                    ) : (
                                       <div className="w-full h-full flex flex-col items-center justify-center text-brand-grey gap-2 text-[10px] uppercase tracking-widest font-bold text-center p-4">
                                          <ImageIcon size={24} className="opacity-30" />
                                          <input 
                                            placeholder="URL" 
                                            value={img || ''} 
                                            onChange={(e) => handleImageChange(i, e.target.value)} 
                                            className="w-full bg-transparent border-b border-brand-beige text-center focus:outline-none pb-1" 
                                          />
                                          <span className="opacity-30">or</span>
                                          <label className="cursor-pointer text-brand-gold hover:underline">Upload</label>
                                          <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, i)} />
                                       </div>
                                    )}
                                 </div>
                              ))}
                              <button type="button" onClick={() => setForm({...form, images: [...form.images, '']})} className="aspect-[3/4] border-2 border-dashed border-brand-beige rounded-2xl flex flex-col items-center justify-center text-brand-grey gap-2 hover:border-brand-gold hover:text-brand-gold transition-all">
                                 <Plus size={24} />
                                 <span className="text-[10px] uppercase font-bold tracking-widest">More View</span>
                              </button>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Category</label>
                              <select name="category" value={form.category || 'Formal'} onChange={handleInputChange} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none appearance-none font-bold uppercase tracking-widest text-xs">
                                 {['Formal', 'Casual', 'Party Wear', 'Bridal', 'Luxury Pret', 'Eastern Wear'].map(c => <option key={c} value={c}>{c}</option>)}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Stock Hub</label>
                              <input required type="number" name="stock" value={form.stock || 0} onChange={handleInputChange} className="w-full bg-brand-cream border border-brand-beige rounded-xl py-4 px-6 focus:outline-none" />
                           </div>
                        </div>

                        <div className="flex flex-wrap gap-8 pt-4">
                           {[
                              { name: 'featured', label: 'Featured Article' },
                              { name: 'isBestSeller', label: 'Best Seller' },
                              { name: 'isNew', label: 'New Arrival' }
                           ].map(badge => (
                              <label key={badge.name} className="flex items-center gap-3 cursor-pointer group">
                                 <div className="relative w-6 h-6">
                                    <input 
                                      type="checkbox" 
                                      name={badge.name} 
                                      checked={(form as any)[badge.name]} 
                                      onChange={handleInputChange} 
                                      className="peer hidden" 
                                    />
                                    <div className="w-6 h-6 rounded-md border border-brand-beige peer-checked:bg-brand-gold peer-checked:border-brand-gold transition-all" />
                                    <Check className="absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity" size={14} />
                                 </div>
                                 <span className="text-[10px] uppercase font-bold tracking-widest text-brand-grey group-hover:text-brand-black transition-colors">{badge.label}</span>
                              </label>
                           ))}
                        </div>
                     </div>

                     <div className="md:col-span-2 pt-12 border-t border-brand-beige mt-4">
                        <button type="submit" className="w-full bg-brand-black text-white py-6 rounded-full text-[11px] uppercase font-black tracking-[0.4em] hover:bg-brand-gold transition-all duration-500 shadow-2xl hover:scale-[1.02] active:scale-95">
                           {isEditing ? 'Finalize Masterpiece Archive' : 'Publish Exquisite Article'}
                        </button>
                     </div>
                  </form>
               </motion.div>
            </div>
          )}
       </AnimatePresence>
    </AdminLayout>
  );
};

export default ProductManagement;
