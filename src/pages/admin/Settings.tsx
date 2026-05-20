import React, { useState } from 'react';
import { AdminLayout } from './Dashboard';
import { formatPrice, cn } from '../../utils/cn';
import { Save, Globe, Bell, Lock, CreditCard, Mail, Sliders, Palette } from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('General');

  const tabs = [
    { name: 'General', icon: Globe },
    { name: 'Appearance', icon: Palette },
    { name: 'Notifications', icon: Bell },
    { name: 'Security', icon: Lock },
    { name: 'Payments', icon: CreditCard },
  ];

  return (
    <AdminLayout title="Maison Parameters">
       <div className="flex flex-col md:flex-row gap-12 text-left">
          {/* Navigation */}
          <aside className="w-full md:w-64 space-y-2">
             {tabs.map((tab) => (
               <button
                 key={tab.name}
                 onClick={() => setActiveTab(tab.name)}
                 className={cn(
                   "w-full flex items-center gap-4 px-6 py-4 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all",
                   activeTab === tab.name 
                     ? "bg-brand-black text-white luxury-shadow" 
                     : "text-brand-grey hover:bg-white hover:text-brand-black"
                 )}
               >
                  <tab.icon size={16} />
                  {tab.name}
               </button>
             ))}
          </aside>

          {/* Content */}
          <div className="flex-grow bg-white rounded-2xl luxury-shadow border border-brand-beige p-8 md:p-12">
             <div className="flex justify-between items-center mb-10 border-b border-brand-beige pb-6">
                <h2 className="text-2xl font-serif">{activeTab} Settings</h2>
                <button 
                  onClick={() => toast.success('Maison preferences saved')}
                  className="bg-brand-gold text-brand-black px-8 py-3 rounded-full text-[10px] uppercase font-bold tracking-widest flex items-center gap-2 hover:scale-105 transition-all shadow-lg"
                >
                   <Save size={16} /> Save Changes
                </button>
             </div>

             <div className="max-w-2xl space-y-8">
                {activeTab === 'General' && (
                  <>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Boutique Name</label>
                       <input className="w-full bg-brand-cream border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" defaultValue="UFR Couture Maison" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Support Email</label>
                       <input className="w-full bg-brand-cream border border-brand-beige rounded-lg py-3 px-4 focus:outline-none focus:border-brand-gold" defaultValue="maison@ufr-couture.com" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">Currency Display</label>
                       <select className="w-full bg-brand-cream border border-brand-beige rounded-lg py-3 px-4 focus:outline-none font-bold">
                          <option>PKR (Rs)</option>
                          <option>USD ($)</option>
                          <option>GBP (£)</option>
                       </select>
                    </div>
                  </>
                )}

                {activeTab === 'Appearance' && (
                  <div className="space-y-8">
                     <p className="text-xs text-brand-grey leading-relaxed">Customize the visual identity of your boutique storefront. Changes will be applied globally.</p>
                     <div className="grid grid-cols-2 gap-6">
                        <div className="aspect-square bg-brand-black rounded-lg border-2 border-brand-gold flex items-center justify-center p-4">
                           <span className="text-white text-[8px] uppercase tracking-widest font-bold">Luxury Dark (Active)</span>
                        </div>
                        <div className="aspect-square bg-white rounded-lg border border-brand-beige flex items-center justify-center p-4">
                           <span className="text-brand-black text-[8px] uppercase tracking-widest font-bold">Royal Cream</span>
                        </div>
                     </div>
                  </div>
                )}

                {activeTab === 'Notifications' && (
                  <div className="space-y-6">
                     {[
                       'Nofity on new luxury order',
                       'Low stock threshold alerts',
                       'Customer registration summary',
                       'Payment failure warnings'
                     ].map((item, i) => (
                       <label key={i} className="flex items-center justify-between p-4 bg-brand-cream rounded-xl cursor-pointer hover:bg-brand-beige/20 transition-all">
                          <span className="text-[10px] uppercase font-bold tracking-widest text-brand-grey">{item}</span>
                          <input type="checkbox" defaultChecked className="w-5 h-5 accent-brand-gold" />
                       </label>
                     ))}
                  </div>
                )}

                {activeTab === 'Security' && (
                  <div className="space-y-6">
                     <div className="p-6 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-4">
                        <Lock className="text-amber-600 shrink-0" size={20} />
                        <div>
                           <p className="text-xs font-bold text-amber-900 mb-1">Two-Factor Authentication</p>
                           <p className="text-[10px] text-amber-700 leading-relaxed">Enhance your maison's security by requiring a secondary verification code from your device.</p>
                           <button className="mt-4 text-[10px] uppercase font-bold text-amber-900 hover:underline">Configure Now</button>
                        </div>
                     </div>
                  </div>
                )}
             </div>
          </div>
       </div>
    </AdminLayout>
  );
};

export default Settings;
