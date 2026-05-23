import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';

// Loading Component
const PageLoader = () => (
  <div className="h-screen flex items-center justify-center bg-brand-cream">
    <div className="text-center">
      <div className="w-12 h-12 border-3 border-brand-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-brand-gold text-xs uppercase tracking-wider font-bold">Loading...</p>
    </div>
  </div>
);

// Lazy Load Pages - Performance Optimization
const Home = lazy(() => import('./pages/Home'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderTracking = lazy(() => import('./pages/OrderTracking'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Profile = lazy(() => import('./pages/Profile'));
const Wishlist = lazy(() => import('./pages/Wishlist'));
const Offers = lazy(() => import('./pages/Offers'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Blog = lazy(() => import('./pages/Blog'));
const NotFound = lazy(() => import('./pages/NotFound'));
const EidiGiveaway = lazy(() => import('./pages/EidiGiveaway')); // ✅ Moved here

// Admin Pages - Lazy Load
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard'));
const ProductManagement = lazy(() => import('./pages/admin/ProductManagement'));
const OrderManagement = lazy(() => import('./pages/admin/OrderManagement'));
const CustomerManagement = lazy(() => import('./pages/admin/CustomerManagement'));
const Analytics = lazy(() => import('./pages/admin/Analytics'));
const Settings = lazy(() => import('./pages/admin/Settings'));
const HomepageManager = lazy(() => import('./pages/admin/HomepageManager'));
const OfferManagement = lazy(() => import('./pages/admin/OfferManagement'));
const LuckyDrawManagement = lazy(() => import('./pages/admin/LuckyDrawManagement'));

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="shop" element={<Shop />} />
                    <Route path="product/:id" element={<ProductDetail />} />
                    <Route path="cart" element={<Cart />} />
                    <Route path="checkout" element={
                      <ProtectedRoute message="Please login to proceed to checkout">
                        <Checkout />
                      </ProtectedRoute>
                    } />
                    <Route path="track-order" element={<OrderTracking />} />
                    <Route path="login" element={<Login />} />
                    <Route path="signup" element={<Signup />} />
                    <Route path="profile" element={
                      <ProtectedRoute>
                        <Profile />
                      </ProtectedRoute>
                    } />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="offers" element={<Offers />} />
                    <Route path="about" element={<About />} />
                    <Route path="contact" element={<Contact />} />
                    <Route path="blog" element={<Blog />} />
                    <Route path="eidi-giveaway" element={<EidiGiveaway />} /> {/* ✅ Route added here */}
                    <Route path="*" element={<NotFound />} />
                  </Route>

                  {/* Admin Routes */}
                  <Route path="/admin" element={
                    <ProtectedRoute adminOnly>
                      <AdminDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/homepage" element={
                    <ProtectedRoute adminOnly>
                      <HomepageManager />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/offers" element={
                    <ProtectedRoute adminOnly>
                      <OfferManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/products" element={
                    <ProtectedRoute adminOnly>
                      <ProductManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/orders" element={
                    <ProtectedRoute adminOnly>
                      <OrderManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/customers" element={
                    <ProtectedRoute adminOnly>
                      <CustomerManagement />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/analytics" element={
                    <ProtectedRoute adminOnly>
                      <Analytics />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/settings" element={
                    <ProtectedRoute adminOnly>
                      <Settings />
                    </ProtectedRoute>
                  } />
                  <Route path="/admin/lucky-draw" element={
                    <ProtectedRoute adminOnly>
                      <LuckyDrawManagement />
                    </ProtectedRoute>
                  } />
                </Routes>
              </Suspense>
            </Router>
          </CartProvider>
        </WishlistProvider>
      </AuthProvider>
    </HelmetProvider>
  );
}