import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, BookOpen, Download, HelpCircle, UploadCloud, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../utils/formatters';

export default function StudentProfilePage() {
  const { user, refreshProfile } = useAuth();
  const [myResources, setMyResources] = useState([]);
  const [orders, setOrders] = useState([]);
  const [library, setLibrary] = useState([]);
  const [inquiries, setInquiries] = useState([]);

  const loadPage = useCallback(async () => {
    await refreshProfile();
    const [resourcesRes, ordersRes, libraryRes, inquiriesRes] = await Promise.all([
      api.get('/resources/my/list'),
      api.get('/orders/my-orders'),
      api.get('/orders/my-library'),
      api.get('/inquiries/my')
    ]);
    setMyResources(resourcesRes.data.resources || []);
    setOrders(ordersRes.data.orders || []);
    setLibrary(libraryRes.data.library || []);
    setInquiries(inquiriesRes.data.inquiries || []);
  }, [refreshProfile]);

  useEffect(() => {
    loadPage().catch(() => {});
  }, [loadPage]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <section className="rounded-[30px] bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 px-6 py-8 text-white shadow-soft sm:px-8 lg:px-10">
        <h1 className="text-3xl font-bold sm:text-4xl">{user?.name}</h1>
        <p className="mt-3 text-sm text-slate-200 sm:text-base">{user?.email}</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            ['Role', user?.role],
            ['Badge', user?.badge],
            ['Rating badge', user?.ratingBadge || 'Unranked'],
            ['Uploads', user?.uploadCount || 0]
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
              <p className="text-sm text-slate-300">{label}</p>
              <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <Link to="/upload" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
          <UploadCloud className="text-brand-700" size={22} />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Manage resources</h2>
          <p className="mt-2 text-sm text-slate-500">Upload new materials, edit existing listings, and remove old resources.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Open workspace <ArrowRight size={16} /></span>
        </Link>

        <Link to="/orders" className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft transition hover:-translate-y-1 hover:shadow-xl">
          <Wallet className="text-brand-700" size={22} />
          <h2 className="mt-4 text-2xl font-semibold text-slate-900">Orders and library</h2>
          <p className="mt-2 text-sm text-slate-500">Complete checkout, inspect order history, and open purchased files from one place.</p>
          <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-brand-700">Open order center <ArrowRight size={16} /></span>
        </Link>
      </section>

      <section className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <BookOpen className="text-brand-700" size={20} />
            <h2 className="text-2xl font-semibold text-slate-900">My resources</h2>
          </div>
          <div className="mt-6 space-y-4">
            {myResources.length ? myResources.slice(0, 5).map((resource) => (
              <div key={resource._id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{resource.title}</p>
                <p className="mt-1 text-sm text-slate-500">{resource.category} · Downloads: {resource.downloads || 0}</p>
              </div>
            )) : <p className="text-sm text-slate-500">You have not uploaded any resources yet.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Download className="text-brand-700" size={20} />
            <h2 className="text-2xl font-semibold text-slate-900">Library summary</h2>
          </div>
          <div className="mt-6 space-y-4">
            {library.length ? library.slice(0, 5).map((item, index) => (
              <div key={`${item.resourceId}-${index}`} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500">Purchased resource</p>
              </div>
            )) : <p className="text-sm text-slate-500">Your purchased resources will appear here.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <Wallet className="text-brand-700" size={20} />
            <h2 className="text-2xl font-semibold text-slate-900">Orders summary</h2>
          </div>
          <div className="mt-6 space-y-4">
            {orders.length ? orders.slice(0, 4).map((order) => (
              <div key={order._id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">Order #{order._id.slice(-6)}</p>
                <p className="mt-1 text-sm text-slate-500">{order.items.length} item(s) · {formatCurrency(order.totalPrice)}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No orders yet.</p>}
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex items-center gap-3">
            <HelpCircle className="text-brand-700" size={20} />
            <h2 className="text-2xl font-semibold text-slate-900">My inquiries</h2>
          </div>
          <div className="mt-6 space-y-4">
            {inquiries.length ? inquiries.slice(0, 4).map((item) => (
              <div key={item._id} className="rounded-2xl bg-slate-50 p-4">
                <p className="font-medium text-slate-900">{item.subject}</p>
                <p className="mt-1 text-sm text-slate-500">{item.status}</p>
              </div>
            )) : <p className="text-sm text-slate-500">No inquiries yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
