import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen, Code2, Briefcase, Zap, Beaker, Stethoscope } from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import ResourceCard from '../components/ResourceCard';
import { EDU_SHARE_FACULTIES } from '../utils/faculties';

const defaultFilters = {
  search: '',
  faculty: '',
  academicYear: '',
  semester: '',
  moduleCode: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const FACULTIES = ['', ...EDU_SHARE_FACULTIES];
const YEARS = ['', '2025/2026', '2024/2025', '2023/2024'];
const SEMESTERS = ['', 'Semester 1', 'Semester 2'];
const MODULES = ['', 'CS201', 'MATH101', 'CHEM201', 'CS301', 'PHYS202', 'BUS101'];

const CATEGORIES = [
  { label: 'All Resources', icon: BookOpen, count: 0 },
  { label: 'IT & Software', icon: Code2, count: 0 },
  { label: 'Business', icon: Briefcase, count: 0 },
  { label: 'Engineering', icon: Zap, count: 0 },
  { label: 'Science', icon: Beaker, count: 0 },
  { label: 'Medicine', icon: Stethoscope, count: 0 }
];

export default function HomePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...defaultFilters, search: searchParams.get('search') || '' }));
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setFilters((current) => ({ ...current, search: searchParams.get('search') || '' }));
  }, [searchParams]);

  useEffect(() => {
    async function loadResources() {
      setLoading(true);
      try {
        const { data } = await api.get('/resources', { params: { ...filters, limit: 24 } });
        setResources(data.resources || []);
      } finally {
        setLoading(false);
      }
    }

    loadResources().catch(() => setLoading(false));
  }, [filters]);

  const moduleOptions = useMemo(() => {
    const fromData = resources.map((resource) => resource.moduleCode).filter(Boolean);
    return Array.from(new Set([...MODULES, ...fromData]));
  }, [resources]);

  function updateFilter(key, value) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  return (
    <section>
      {/* Hero Section */}
      <div className="mb-12 rounded-[32px] px-6 py-12 text-center text-white sm:px-8 lg:px-12 lg:py-16 relative overflow-hidden" 
           style={{
             backgroundImage: 'url(https://t3.ftcdn.net/jpg/08/23/48/92/360_F_823489262_onPGneSlusimWkc7yWWUZIBb271JyVs7.jpg)',
             backgroundSize: 'cover',
             backgroundPosition: 'center',
             backgroundColor: 'rgba(99, 102, 241, 0.1)',
             backgroundBlend: 'overlay'
           }}>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl">Find & Share High-Quality Study Materials</h1>
          <p className="mt-4 text-base sm:text-lg opacity-90">Join thousands of students who learn, share knowledge, and earn from their academic contributions</p>
          
          <div className="mt-8 max-w-2xl mx-auto">
            <label className="flex h-12 items-center gap-3 rounded-xl bg-white/90 backdrop-blur-sm px-4 text-slate-900">
              <Search size={18} className="text-slate-400" />
              <input
                value={filters.search}
                onChange={(event) => updateFilter('search', event.target.value)}
                placeholder="Search by module, topic, or faculty..."
                className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
              />
            </label>
          </div>
        </div>
      </div>

      {/* Browse by Category */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Browse by Category</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {CATEGORIES.map((category) => {
            const Icon = category.icon;
            return (
              <button
                key={category.label}
                onClick={() => category.label !== 'All Resources' && updateFilter('faculty', category.label)}
                className="flex flex-col items-center justify-center rounded-[20px] border border-slate-200 bg-white p-6 shadow-soft transition hover:border-brand-500 hover:shadow-md"
              >
                <Icon size={28} className="text-brand-600 mb-3" />
                <p className="text-sm font-semibold text-slate-900 text-center">{category.label}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">All Resources</h2>
        
      <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex h-12 items-center gap-3 rounded-xl bg-slate-50 px-4">
          <Search size={16} className="text-slate-400" />
          <input
            value={filters.search}
            onChange={(event) => updateFilter('search', event.target.value)}
            placeholder="Search resources by title or description..."
            className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          />
        </label>

        <div className="mt-3 grid gap-3 lg:grid-cols-4">
          <select value={filters.faculty} onChange={(event) => updateFilter('faculty', event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500">
            {FACULTIES.map((item) => <option key={item || 'all-faculties'} value={item}>{item || 'All Faculties'}</option>)}
          </select>
          <select value={filters.academicYear} onChange={(event) => updateFilter('academicYear', event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500">
            {YEARS.map((item) => <option key={item || 'all-years'} value={item}>{item || 'All Years'}</option>)}
          </select>
          <select value={filters.semester} onChange={(event) => updateFilter('semester', event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500">
            {SEMESTERS.map((item) => <option key={item || 'all-semesters'} value={item}>{item || 'All Semesters'}</option>)}
          </select>
          <select value={filters.moduleCode} onChange={(event) => updateFilter('moduleCode', event.target.value)} className="h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm outline-none focus:border-brand-500">
            {moduleOptions.map((item) => <option key={item || 'all-modules'} value={item}>{item || 'All Modules'}</option>)}
          </select>
        </div>
      </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-sm font-medium text-slate-500">{resources.length} resources found</p>
        <button
          type="button"
          onClick={() => setFilters(defaultFilters)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
        >
          Reset filters
        </button>
      </div>

      {loading ? (
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-[290px] animate-pulse rounded-[22px] border border-slate-200 bg-white" />)}
        </div>
      ) : (
        <div className="mt-5 grid gap-5 xl:grid-cols-3">
          {resources.map((resource) => <ResourceCard key={resource._id} resource={resource} />)}
        </div>
      )}
    </section>
  );
}
