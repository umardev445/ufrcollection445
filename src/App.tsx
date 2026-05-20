import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderTracking from './pages/OrderTracking';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Offers from './pages/Offers';
import OfferManagement from './pages/admin/OfferManagement';
import About from './pages/About';
import Contact from './pages/Contact';
import Blog from './pages/Blog';
import { ReturnPolicy, ShippingPolicy, PrivacyPolicy, TermsConditions } from './pages/legal/Policies';
import { Toaster } from 'react-hot-toast';
import { HelmetProvider } from 'react-helmet-async';
import ProtectedRoute from './components/ProtectedRoute';
import NotFound from './pages/NotFound';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import OrderManagement from './pages/admin/OrderManagement';
import CustomerManagement from './pages/admin/CustomerManagement';
import Analytics from './pages/admin/Analytics';
import Settings from './pages/admin/Settings';
import HomepageManager from './pages/admin/HomepageManager';
import LuckyDrawManagement from './pages/admin/LuckyDrawManagement';

export default function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <WishlistProvider>
          <CartProvider>
            <Router>
              <Toaster position="top-center" />
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
                  <Route path="return-policy" element={<ReturnPolicy />} />
                  <Route path="shipping-policy" element={<ShippingPolicy />} />
                  <Route path="privacy-policy" element={<PrivacyPolicy />} />
                  <Route path="terms-conditions" element={<TermsConditions />} />
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
          </Router>
        </CartProvider>
      </WishlistProvider>
    </AuthProvider>
  </HelmetProvider>
  );
}
