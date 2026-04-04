import { useEffect, useMemo, useState } from 'react';
import { FileUp, Pencil, Trash2, UploadCloud } from 'lucide-react';
import api from '../utils/api';
import { EDU_SHARE_FACULTIES } from '../utils/faculties';

const initialForm = {
  title: '',
  description: '',
  faculty: 'Faculty of Computing',
  academicYear: '2025/2026',
  semester: 'Semester 1',
  moduleCode: '',
  priceType: 'free',
  price: ''
};

const facultyToCategory = {
  'Faculty of Computing': 'IT & Software',
  'Faculty of Business': 'Business',
  'Faculty of Engineering': 'Engineering',
  'Faculty of Architecture': 'Engineering',
  'Faculty of Humanities and Science': 'Science'
};

export default function ResourceUploadPage() {
  const [form, setForm] = useState(initialForm);
  const [file, setFile] = useState(null);
  const [myResources, setMyResources] = useState([]);
  const [editingId, setEditingId] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const isPaid = form.priceType === 'paid';

  const buttonLabel = useMemo(() => (editingId ? 'Update Resource' : 'Upload Resource'), [editingId]);

  async function loadResources() {
    const { data } = await api.get('/resources/my/list');
    setMyResources(data.resources || []);
  }

  useEffect(() => {
    loadResources().catch(() => {});
  }, []);

  function resetForm(clearFeedback = true) {
    setForm(initialForm);
    setFile(null);
    setEditingId('');
    if (clearFeedback) {
      setMessage('');
      setError('');
    }
  }

  function startEdit(resource) {
    setEditingId(resource._id);
    setFile(null);
    setMessage('Editing mode enabled. Update the details and save changes.');
    setError('');
    setForm({
      title: resource.title || '',
      description: resource.description || '',
      faculty: resource.faculty || 'Faculty of Computing',
      academicYear: resource.academicYear || '2025/2026',
      semester: resource.semester || 'Semester 1',
      moduleCode: resource.moduleCode || '',
      priceType: Number(resource.price || 0) > 0 ? 'paid' : 'free',
      price: Number(resource.price || 0) > 0 ? String(resource.price) : ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function deleteResource(resourceId) {
    const confirmed = window.confirm('Delete this resource?');
    if (!confirmed) return;

    try {
      await api.delete(`/resources/${resourceId}`);
      if (editingId === resourceId) resetForm(false);
      setMessage('Resource deleted successfully.');
      await loadResources();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not delete the resource.');
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    setError('');

    try {
      const payload = {
        title: form.title,
        description: form.description,
        faculty: form.faculty,
        category: facultyToCategory[form.faculty] || form.faculty,
        academicYear: form.academicYear,
        semester: form.semester,
        moduleCode: form.moduleCode.trim().toUpperCase(),
        price: isPaid ? Number(form.price || 0) : 0,
        tags: form.moduleCode ? [form.moduleCode.trim().toUpperCase(), form.faculty] : [form.faculty]
      };

      if (editingId) {
        await api.put(`/resources/${editingId}`, payload);
      } else {
        if (!file) throw new Error('Please choose a file before uploading.');

        const filePayload = new FormData();
        filePayload.append('file', file);

        const uploadRes = await api.post('/upload', filePayload, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });

        await api.post('/resources', {
          ...payload,
          fileUrl: uploadRes.data.fileUrl,
          fileName: uploadRes.data.fileName,
          fileSize: uploadRes.data.fileSize,
          fileType: uploadRes.data.fileType
        });
      }

      resetForm(false);
      setMessage(editingId ? 'Resource updated successfully.' : 'Resource uploaded successfully.');
      await loadResources();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Upload failed.');
    } finally {
      setBusy(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    const dropped = event.dataTransfer.files?.[0];
    if (dropped) setFile(dropped);
  }

  return (
    <section className="mx-auto max-w-4xl">
      <div className="mb-5 text-center lg:text-left">
        <h1 className="text-[44px] font-bold tracking-tight text-slate-900">Upload Resource</h1>
        <p className="mt-2 text-base text-slate-500">Share your study materials with others</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-slate-900">Upload File *</p>
          <label
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="mt-3 flex min-h-[220px] cursor-pointer flex-col items-center justify-center rounded-[18px] border border-dashed border-slate-300 bg-slate-50 px-6 text-center"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
              <UploadCloud size={22} />
            </div>
            <p className="mt-5 text-lg font-semibold text-slate-900">Drag and drop your file here</p>
            <p className="mt-2 text-sm text-slate-500">or click to browse</p>
            <span className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">Choose File</span>
            <input type="file" className="hidden" onChange={(event) => setFile(event.target.files?.[0] || null)} />
            <p className="mt-4 text-xs text-slate-400">Supported formats: PDF, DOC, DOCX, PPT, PPTX</p>
            {file && <p className="mt-3 text-sm font-medium text-brand-700">Selected: {file.name}</p>}
            {editingId && !file && <p className="mt-3 text-sm font-medium text-slate-500">Editing existing resource. File replacement is optional.</p>}
          </label>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-900">Resource Information</h2>

          <div className="mt-5 space-y-4">
            <label className="block">
              <p className="mb-2 text-sm font-semibold text-slate-900">Title *</p>
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="e.g., Introduction to Data Structures" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" required />
            </label>

            <label className="block">
              <p className="mb-2 text-sm font-semibold text-slate-900">Description</p>
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Provide a brief description of the resource content..." className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-brand-500" required />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Faculty *</p>
                <select value={form.faculty} onChange={(event) => setForm((current) => ({ ...current, faculty: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500">
                  {EDU_SHARE_FACULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Academic Year *</p>
                <select value={form.academicYear} onChange={(event) => setForm((current) => ({ ...current, academicYear: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500">
                  {['2025/2026', '2024/2025', '2023/2024'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Semester *</p>
                <select value={form.semester} onChange={(event) => setForm((current) => ({ ...current, semester: event.target.value }))} className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500">
                  {['Semester 1', 'Semester 2'].map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </label>
              <label>
                <p className="mb-2 text-sm font-semibold text-slate-900">Module Code *</p>
                <input value={form.moduleCode} onChange={(event) => setForm((current) => ({ ...current, moduleCode: event.target.value.toUpperCase() }))} placeholder="e.g., CS201" className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" required />
              </label>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold text-slate-900">Pricing *</p>
              <div className="flex items-center gap-6">
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="pricing" checked={form.priceType === 'free'} onChange={() => setForm((current) => ({ ...current, priceType: 'free', price: '' }))} />
                  Free
                </label>
                <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                  <input type="radio" name="pricing" checked={form.priceType === 'paid'} onChange={() => setForm((current) => ({ ...current, priceType: 'paid' }))} />
                  Paid
                </label>
              </div>
              {isPaid && (
                <input value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} type="number" min="0" step="0.01" placeholder="Enter price" className="mt-3 h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-brand-500" />
              )}
            </div>
          </div>
        </div>

        {(message || error) && (
          <div className={`rounded-xl px-4 py-3 text-sm ${error ? 'border border-rose-200 bg-rose-50 text-rose-700' : 'border border-emerald-200 bg-emerald-50 text-emerald-700'}`}>
            {error || message}
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">Cancel</button>
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-3 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60">
            <FileUp size={16} />
            {busy ? 'Saving...' : buttonLabel}
          </button>
        </div>
      </form>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-slate-900">My Uploaded Resources</h2>
            <p className="mt-1 text-sm text-slate-500">Edit or delete previously uploaded resources</p>
          </div>
        </div>

        <div className="space-y-4">
          {myResources.length ? myResources.map((resource) => (
            <div key={resource._id} className="rounded-[20px] border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-slate-900">{resource.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{resource.faculty} · {resource.moduleCode} · {resource.semester}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => startEdit(resource)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"><Pencil size={14} /> Edit</button>
                  <button type="button" onClick={() => deleteResource(resource._id)} className="inline-flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"><Trash2 size={14} /> Delete</button>
                </div>
              </div>
            </div>
          )) : (
            <div className="rounded-[20px] border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500">No uploads yet. Add your first study resource above.</div>
          )}
        </div>
      </section>
    </section>
  );
}
