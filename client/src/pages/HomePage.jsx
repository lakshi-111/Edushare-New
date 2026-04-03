import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../utils/api';
import ResourceCard from '../components/ResourceCard';

const defaultFilters = {
  search: '',
  faculty: '',
  academicYear: '',
  semester: '',
  moduleCode: '',
  sortBy: 'createdAt',
  sortOrder: 'desc'
};

const FACULTIES = ['', 'Computer Science', 'Mathematics', 'Chemistry', 'Physics', 'Business'];
const YEARS = ['', '2025/2026', '2024/2025', '2023/2024'];
const SEMESTERS = ['', 'Semester 1', 'Semester 2'];
const MODULES = ['', 'CS201', 'MATH101', 'CHEM201', 'CS301', 'PHYS202', 'BUS101'];

export default function HomePage() {
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
      <div className="mb-5">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Academic Resource Marketplace</h1>
        <p className="mt-2 text-base text-slate-500">Discover and download quality study materials</p>
      </div>

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
