import React, { useEffect, useState } from 'react';
import { AdminLayout } from './Dashboard';
import { db } from '../../services/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, X, Image as ImageIcon, Search, Check, Upload, Info, PlusCircle, MinusCircle } from 'lucide-react';
import { formatPrice, cn } from '../../utils/cn';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'motion/react';

const ProductManagement = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [uploading, setUploading] = useState(false);

  const initialForm = {
    name: '',
    description: '',
    category: 'Formal',
    price: 0,
    salePrice: 0,
    discount: 0,
    images: ['', ''],
    sizes: 'S, M, L, XL',
    sizeType: '',
    reviewsCount: 0,
     rating: 0,
    colors: 'Beige, Black',
    fabric: 'Chiffon',
    highlights: ['', '', ''],
    stock: 10,
    featured: false,
    isNew: true,
    isBestSeller: false,
    sku: '',
    collectionIds: [] as string[]
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
      console.error(err);
      toast.error('Failed to fetch products');
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

  const handleImageChange = (index: number, value: string) => {
    const newImages = [...form.images];
    newImages[index] = value;
    setForm({ ...form, images: newImages });
  };

  const handleHighlightChange = (index: number, field: 'label' | 'value', value: string) => {
    const newHighlights = [...form.highlights];
    const current = newHighlights[index] as string;
    const [currentLabel, currentValue] = current.split(':').map(s => s.trim());
    
    if (field === 'label') {
      newHighlights[index] = `${value}: ${currentValue || ''}`;
    } else {
      newHighlights[index] = `${currentLabel || ''}: ${value}`;
    }
    setForm({ ...form, highlights: newHighlights });
  };

  const addHighlight = () => {
    setForm({ ...form, highlights: [...form.highlights, ''] });
  };

  const removeHighlight = (index: number) => {
    const newHighlights = form.highlights.filter((_, i) => i !== index);
    setForm({ ...form, highlights: newHighlights });
  };

  const uploadToImgBB = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    
    const response = await fetch('https://api.imgbb.com/1/upload?key=582a1808fbd68fbc9c78e6f4d8ba3bf2', {
      method: 'POST',
      body: formData
    });
    
    const data = await response.json();
    if (data.success) {
      return data.data.url;
    } else {
      throw new Error('Upload failed');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image too large. Max 5MB allowed.');
      return;
    }
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file.');
      return;
    }
    
    setUploading(true);
    const toastId = toast.loading('Uploading image...');
    
    try {
      const imageUrl = await uploadToImgBB(file);
      handleImageChange(index, imageUrl);
      toast.success('Image uploaded!', { id: toastId });
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Try using direct URL.', { id: toastId });
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const filteredImages = form.images.filter(img => img && img.trim() !== '');
    if (filteredImages.length === 0) {
      toast.error('Please add at least one image');
      return;
    }
    
    try {
      const productData = {
        name: form.name,
        description: form.description,
        category: form.category,
        price: form.price,
        salePrice: form.salePrice || null,
        images: filteredImages,
        sizes: typeof form.sizes === 'string' ? form.sizes.split(',').map(s => s.trim()).filter(s => s) : form.sizes,
        sizeType: form.sizeType,
        colors: typeof form.colors === 'string' ? form.colors.split(',').map(c => c.trim()).filter(c => c) : form.colors,
        fabric: form.fabric,
        highlights: form.highlights.filter(h => h && h.trim() !== '' && h.includes(':')),
        stock: form.stock,
        featured: form.featured,
        isNew: form.isNew,
        isBestSeller: form.isBestSeller,
        sku: form.sku || `UFR-${Date.now().toString().slice(-8)}`,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, 'products', currentId), productData);
        toast.success('Product updated!');
      } else {
        await addDoc(collection(db, 'products'), { ...productData, createdAt: serverTimestamp() });
        toast.success('Product added!');
      }

      setShowModal(false);
      setForm(initialForm);
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save product');
    }
  };

  const handleEdit = (p: any) => {
    setForm({
      ...initialForm,
      ...p,
      sizes: Array.isArray(p.sizes) ? p.sizes.join(', ') : (p.sizes || 'S, M, L, XL'),
      colors: Array.isArray(p.colors) ? p.colors.join(', ') : (p.colors || 'Beige, Black'),
      images: Array.isArray(p.images) && p.images.length ? p.images : ['', ''],
      highlights: Array.isArray(p.highlights) && p.highlights.length ? p.highlights : ['', '', ''],
      sizeType: p.sizeType || '',
      sku: p.sku || '',
      collectionIds: p.collectionIds || []
    });
    setCurrentId(p.id);
    setIsEditing(true);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this product?')) {
      await deleteDoc(doc(db, 'products', id));
      toast.success('Product deleted');
      fetchData();
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <AdminLayout title="Product Management">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-grow gap-4 w-full md:w-auto">
          <div className="relative flex-grow max-w-sm">
            <input 
              className="w-full bg-white border border-brand-beige rounded-full py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-brand-gold" 
              placeholder="Search products..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-grey" />
          </div>
          <select 
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-white border border-brand-beige rounded-full px-4 py-2 text-xs uppercase font-bold"
          >
            <option value="All">All Categories</option>
            {['Formal', 'Casual', 'Party Wear', 'Bridal', 'Luxury Pret', 'Eastern Wear'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { setForm(initialForm); setIsEditing(false); setShowModal(true); }}
          className="bg-brand-black text-white px-6 py-2 rounded-full text-xs uppercase font-bold flex items-center gap-2 hover:bg-brand-gold transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-brand-beige">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead className="bg-brand-cream">
              <tr>
                <th className="px-4 py-3 text-[10px] uppercase font-bold">Product</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold">Category</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold">Price</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold">Stock</th>
                <th className="px-4 py-3 text-[10px] uppercase font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige">
              {filteredProducts.length > 0 ? filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-brand-cream/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={p.images?.[0]} 
                        className="w-10 h-12 object-cover rounded bg-brand-beige" 
                        onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x500?text=No+Image'; }}
                      />
                      <span className="text-sm font-medium line-clamp-1">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{p.category}</td>
                  <td className="px-4 py-3 text-xs font-bold">
                    {p.salePrice ? formatPrice(p.salePrice) : formatPrice(p.price)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn("text-[10px] px-2 py-1 rounded-full", p.stock < 10 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600")}>
                      {p.stock} in stock
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => handleEdit(p)} className="p-1 hover:text-brand-gold"><Edit2 size={16} /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1 ml-2 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-brand-grey">No products found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6 sticky top-0 bg-white z-10 pb-4 border-b">
                <h2 className="text-2xl font-serif">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} /></button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Information Section */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={16} className="text-brand-gold" /> Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold">Product Name *</label>
                      <input required name="name" value={form.name} onChange={handleInputChange} className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">SKU (Optional)</label>
                      <input name="sku" value={form.sku} onChange={handleInputChange} placeholder="Auto-generated if empty" className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-[10px] uppercase font-bold">Description</label>
                      <textarea name="description" value={form.description} onChange={handleInputChange} rows={3} className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock Section */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Pricing & Stock</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold">Category *</label>
                      <select name="category" value={form.category} onChange={handleInputChange} className="w-full border rounded-xl p-3 mt-1">
                        {['Formal', 'Casual', 'Party Wear', 'Bridal', 'Luxury Pret', 'Eastern Wear'].map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Stock *</label>
                      <input type="number" name="stock" value={form.stock} onChange={handleInputChange} className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Price (PKR) *</label>
                      <input type="number" name="price" value={form.price} onChange={handleInputChange} className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Sale Price</label>
                      <input type="number" name="salePrice" value={form.salePrice} onChange={handleInputChange} className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                  </div>
                </div>

                {/* Size & Color Section */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Size & Color</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] uppercase font-bold">Size Type (e.g., Unstitched)</label>
                      <input name="sizeType" value={form.sizeType} onChange={handleInputChange} placeholder="Leave empty for standard sizes" className="w-full border rounded-xl p-3 mt-1" />
                      <p className="text-[8px] text-brand-grey mt-1">For unstitched or special size products</p>
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Standard Sizes</label>
                      <input name="sizes" value={form.sizes} onChange={handleInputChange} placeholder="S, M, L, XL" className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Colors</label>
                      <input name="colors" value={form.colors} onChange={handleInputChange} placeholder="Beige, Black, Gold" className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold">Fabric</label>
                      <input name="fabric" value={form.fabric} onChange={handleInputChange} placeholder="Lawn, Chiffon, Silk, Velvet" className="w-full border rounded-xl p-3 mt-1" />
                    </div>
                  </div>
                </div>

                {/* Product Highlights - Markaz Style (Key-Value Pairs) */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Info size={16} className="text-brand-gold" /> Product Overview (Highlights)
                  </h3>
                  <div className="space-y-3">
                    {form.highlights.map((highlight, i) => {
                      // Parse existing highlight
                      let label = '';
                      let value = '';
                      if (highlight && typeof highlight === 'string') {
                        const colonIndex = highlight.indexOf(':');
                        if (colonIndex > 0) {
                          label = highlight.substring(0, colonIndex).trim();
                          value = highlight.substring(colonIndex + 1).trim();
                        } else {
                          value = highlight;
                        }
                      }
                      return (
                        <div key={i} className="flex gap-3 items-center">
                          <input
                            type="text"
                            placeholder="Attribute (e.g., Shirt Fabric)"
                            value={label}
                            onChange={(e) => handleHighlightChange(i, 'label', e.target.value)}
                            className="flex-1 border rounded-xl p-2 text-sm focus:outline-none focus:border-brand-gold"
                          />
                          <span className="text-brand-gold font-bold">:</span>
                          <input
                            type="text"
                            placeholder="Value (e.g., Lawn)"
                            value={value}
                            onChange={(e) => handleHighlightChange(i, 'value', e.target.value)}
                            className="flex-1 border rounded-xl p-2 text-sm focus:outline-none focus:border-brand-gold"
                          />
                          <button
                            type="button"
                            onClick={() => removeHighlight(i)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition"
                          >
                            <MinusCircle size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="text-xs text-brand-gold hover:underline mt-3 flex items-center gap-1"
                  >
                    <PlusCircle size={14} /> Add Attribute
                  </button>
                  <p className="text-[9px] text-brand-grey mt-2">
                    Add product details like "Shirt Fabric: Lawn", "Pattern: Embroidered", "Number Of Pieces: 3"
                  </p>
                </div>

                {/* Product Images Section */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <label className="text-sm font-bold uppercase tracking-wider block mb-4 flex items-center gap-2">
                    <ImageIcon size={16} className="text-brand-gold" /> Product Images *
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative">
                        {img ? (
                          <div className="relative aspect-[3/4] bg-brand-cream rounded-xl overflow-hidden border border-brand-beige group">
                            <img 
                              src={img} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x500?text=Invalid+URL'; }}
                            />
                            <button 
                              type="button"
                              onClick={() => handleImageChange(i, '')} 
                              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div className="aspect-[3/4] border-2 border-dashed border-brand-beige rounded-xl flex flex-col items-center justify-center gap-2 p-4">
                            <ImageIcon size={24} className="text-brand-grey" />
                            <input 
                              type="text"
                              placeholder="Image URL"
                              value={img}
                              onChange={(e) => handleImageChange(i, e.target.value)}
                              className="w-full text-center text-[10px] border rounded-lg p-2 focus:outline-none focus:border-brand-gold"
                            />
                            <span className="text-[9px] text-brand-grey">OR</span>
                            <label className="cursor-pointer bg-brand-cream text-brand-black px-3 py-1.5 rounded-lg text-[9px] font-bold flex items-center gap-1 hover:bg-brand-gold transition">
                              <Upload size={12} />
                              Upload
                              <input 
                                type="file" 
                                className="hidden" 
                                accept="image/*"
                                onChange={(e) => handleFileUpload(e, i)}
                                disabled={uploading}
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                    {form.images.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setForm({...form, images: [...form.images, '']})}
                        className="aspect-[3/4] border-2 border-dashed border-brand-beige rounded-xl flex flex-col items-center justify-center gap-2 hover:border-brand-gold transition"
                      >
                        <Plus size={24} className="text-brand-grey" />
                        <span className="text-[9px] text-brand-grey">Add Image</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[9px] text-brand-grey mt-3">
                    💡 Tip: Paste direct image URL from Pexels, ImgBB, or click "Upload" to upload directly
                  </p>
                </div>

                {/* Badges Section */}
                <div className="bg-brand-cream/20 p-4 rounded-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Product Badges</h3>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="featured" checked={form.featured} onChange={handleInputChange} className="w-4 h-4 rounded" />
                      <span className="text-xs">⭐ Featured Product</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isBestSeller" checked={form.isBestSeller} onChange={handleInputChange} className="w-4 h-4 rounded" />
                      <span className="text-xs">🔥 Best Seller</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" name="isNew" checked={form.isNew} onChange={handleInputChange} className="w-4 h-4 rounded" />
                      <span className="text-xs">✨ New Arrival</span>
                    </label>
                  </div>
                </div>

                {/* Submit Button */}
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="w-full bg-brand-black text-white py-4 rounded-full text-xs uppercase font-bold hover:bg-brand-gold transition disabled:opacity-50 mt-4 sticky bottom-0"
                >
                  {uploading ? 'Uploading image...' : (isEditing ? 'Update Product' : 'Create Product')}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </AdminLayout>
  );
};

export default ProductManagement;