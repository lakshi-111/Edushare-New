import { ArrowRight, BookOpen, Download, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function LandingPage() {
  return (
    <main>
      <section className="bg-gradient-to-br from-brand-700 via-brand-600 to-brand-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8 lg:py-24 relative z-10">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white/15 backdrop-blur-sm px-4 py-2 text-sm font-medium">
              EduShare · Organized client/server MERN app
            </p>
            <h1 className="text-4xl font-bold leading-tight sm:text-5xl">
              Share, discover, and manage academic resources in one place.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-white">
              Browse notes, presentations, guides, and premium study materials. Upload your own resources, track engagement, and connect with other learners.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/home" className="inline-flex items-center gap-2 rounded-xl bg-white/90 backdrop-blur-sm px-5 py-3 font-semibold text-brand-700 hover:bg-brand-50">
                Browse resources
                <ArrowRight size={18} />
              </Link>
              <Link to="/signup" className="rounded-xl border border-white/30 backdrop-blur-sm px-5 py-3 font-semibold text-white hover:bg-white/10">
                Create account
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: BookOpen, label: 'Resource uploads', value: 'Notes, slides, guides' },
              { icon: Download, label: 'Purchases and library', value: 'Checkout and access' },
              { icon: Users, label: 'Student connections', value: 'Follow and collaborate' },
              { icon: ShieldCheck, label: 'Admin monitoring', value: 'Dashboard and moderation' }
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-white/10 backdrop-blur-sm p-6">
                <item.icon className="mb-4 text-white" size={24} />
                <p className="text-sm text-white/90">{item.label}</p>
                <p className="mt-2 text-xl font-semibold text-white">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-3">
          {[
            {
              title: 'Browse by category',
              text: 'Filter resources by category, faculty, academic year, or search term.'
            },
            {
              title: 'Work with real backend data',
              text: 'Forms, uploads, comments, ratings, inquiries, orders, and connections all use the API.'
            },
            {
              title: 'Ready-to-run structure',
              text: 'Clean client/server architecture, seed data, environment files, and startup scripts.'
            }
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
              <h2 className="text-xl font-semibold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
