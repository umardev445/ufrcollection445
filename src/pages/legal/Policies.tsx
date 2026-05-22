import React from 'react';
import SEO from '../../components/SEO';

const PolicyLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="bg-brand-cream/30 min-h-screen py-20">
    <SEO title={title} />
    <div className="container mx-auto px-4 max-w-4xl">
      <div className="bg-white rounded-[2.5rem] luxury-shadow p-10 md:p-16 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-cream/40 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="relative z-10">
          <p className="text-brand-gold font-bold uppercase tracking-[0.4em] text-[10px] mb-4 text-center">House Statutes</p>
          <h1 className="text-4xl md:text-5xl font-serif text-brand-black text-center mb-16">{title}</h1>
          <div className="prose prose-brand max-w-none prose-p:text-brand-grey prose-p:leading-relaxed prose-h3:font-serif prose-h3:text-2xl prose-h3:mt-10">
            {children}
          </div>
          <div className="mt-20 pt-10 border-t border-brand-beige flex flex-col md:flex-row justify-between items-center gap-6">
             <p className="text-[10px] text-brand-beige font-black uppercase tracking-widest">Last Updated: May 2026</p>
             <button onClick={() => window.print()} className="text-[10px] text-brand-grey font-black uppercase tracking-widest hover:text-brand-gold transition-colors">Archive Document (Print)</button>
          </div>
        </div>
      </div>
    </div>
  </div>
);

export const ReturnPolicy = () => (
  <PolicyLayout title="Return & Exchange Protocol">
    <h3>Exchange Privilege</h3>
    <p>
      At the House of UFR, we strive for absolute perfection. If a selection does not meet your expectations, we offer a 7-day exchange privilege from the date of delivery.
    </p>
    <h3>Eligibility Criteria</h3>
    <p>
      For a successful exchange archive, items must be in their original, pristine condition: unworn, unwashed, and with all luxury tags intact. Hand-embroidered pieces are inspected by our master artisans upon return.
    </p>
    <h3>The Return Process</h3>
    <p>
      1. Initiate a request via our Boutique Contact portal or WhatsApp.<br />
      2. Securely pack the items in their original archival packaging.<br />
      3. Items must be dispatched back to our central distribution vault in Karachi.
    </p>
    <h3>Non-Returnable Artifacts</h3>
    <p>
      Custom bridal commissions, sale artifacts, and limited-edition seasonal releases are considered final acquisitions and are not eligible for return or exchange.
    </p>
  </PolicyLayout>
);

export const ShippingPolicy = () => (
  <PolicyLayout title="Shipping & Logistics">
    <h3>Courier Selection</h3>
    <p>
      We utilize premium logistics partners (Leopards, TCS, and BlueEx) to ensure your pieces arrive in pristine condition.
    </p>
    <h3>Delivery Timelines</h3>
    <p>
      - Major Cities: 2-4 business days.<br />
      - Nationwide: 4-7 business days.<br />
      - International: 10-15 business days (custom duties may apply).
    </p>
    <h3>Logistics Investment</h3>
    <p>
      - PKR 180 standard nationwide shipping.<br />
      - Complimentary delivery for all JazzCash/Credit Card acquisitions or orders exceeding 3 artifacts.
    </p>
  </PolicyLayout>
);

export const PrivacyPolicy = () => (
  <PolicyLayout title="Privacy & Data Protection">
    <h3>The Archive Protocol</h3>
    <p>
      We collect personal identifiers such as your name, delivery coordinates, and contact details solely to facilitate your journey with the Maison.
    </p>
    <h3>Data Preservation</h3>
    <p>
      Your data is secured using industry-standard Firebase encryption. We never release our client registry to third-party entities for commercial exploitation.
    </p>
    <h3>Cookies & Archiving</h3>
    <p>
      Our digital boutique utilizes cookies to remember your preferences and curation history. You can adjust these settings within your browser protocols at any time.
    </p>
  </PolicyLayout>
);

export const TermsConditions = () => (
  <PolicyLayout title="Terms of Engagement">
    <h3>Boutique Operations</h3>
    <p>
      By exploring the UFR Collection digital boutique, you agree to respect our intellectual property and architectural design.
    </p>
    <h3>Acquisition Terms</h3>
    <p>
      All orders are subject to acceptance by our distribution vault. Prices are shown in PKR and are subject to market adjustments.
    </p>
    <h3>Client Responsibility</h3>
    <p>
      Clients are responsible for providing accurate delivery coordinates. The Maison is not liable for delayed arrivals due to incorrect archive information.
    </p>
  </PolicyLayout>
);
// At the bottom of the file, add default export
export default {
  ReturnPolicy,
  ShippingPolicy,
  PrivacyPolicy,
  TermsConditions
};