import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { EDU_SHARE_FACULTIES } from '../utils/faculties';

const PASSWORD_HELP =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special symbol.';

function mapFieldErrors(errors = []) {
  return errors.reduce((acc, error) => {
    if (!acc[error.param]) acc[error.param] = error.msg;
    return acc;
  }, {});
}

function isStrongPassword(password) {
  return (
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password)
  );
}

export default function SignUpPage() {
  const navigate = useNavigate();
  const { isAuthenticated, loading, login, refreshProfile, user } = useAuth();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    studentIdNumber: '',
    faculty: '',
    year: '',
    semester: ''
  });
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate(user?.role === 'admin' ? '/admin/dashboard' : '/browse', { replace: true });
    }
  }, [isAuthenticated, loading, navigate, user?.role]);

  function updateField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
    setError('');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    const newFieldErrors = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newFieldErrors.name = 'Name must be at least 2 characters.';
    }
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newFieldErrors.email = 'Please enter a valid email.';
    }
    if (!isStrongPassword(form.password)) {
      newFieldErrors.password = PASSWORD_HELP;
    }
    if (!form.confirmPassword) {
      newFieldErrors.confirmPassword = 'Please confirm your password.';
    }
    if (form.password !== form.confirmPassword) {
      newFieldErrors.confirmPassword = 'Passwords do not match.';
    }
    if (!form.studentIdNumber.trim()) {
      newFieldErrors.studentIdNumber = 'Student ID is required.';
    }
    if (!form.faculty.trim()) {
      newFieldErrors.faculty = 'Faculty is required.';
    }
    if (!form.year) {
      newFieldErrors.year = 'Academic year is required.';
    }
    if (!form.semester) {
      newFieldErrors.semester = 'Semester is required.';
    }

    if (Object.keys(newFieldErrors).length) {
      setFieldErrors(newFieldErrors);
      return;
    }

    setFieldErrors({});

    try {
      const { data } = await api.post('/auth/register', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        studentIdNumber: form.studentIdNumber.trim(),
        faculty: form.faculty.trim(),
        year: form.year,
        semester: form.semester
      });
      login(data);
      await refreshProfile().catch(() => {});
      navigate(data.user.role === 'admin' ? '/admin/dashboard' : '/browse');
    } catch (err) {
      const body = err.response?.data;
      if (body?.errors) {
        setFieldErrors(mapFieldErrors(body.errors));
      }
      setError(body?.message || 'Registration failed.');
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl px-4 py-16">
      <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Create account</h1>
        <p className="mt-2 text-slate-600">Create your student account with your academic details.</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <input type="text" placeholder="Full name" value={form.name} onChange={(event) => updateField('name', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              {fieldErrors.name && <p className="mt-1 text-xs text-rose-600">{fieldErrors.name}</p>}
            </div>
            <div>
              <input type="email" placeholder="Email" value={form.email} onChange={(event) => updateField('email', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              {fieldErrors.email && <p className="mt-1 text-xs text-rose-600">{fieldErrors.email}</p>}
            </div>
            <div>
              <input type="password" placeholder="Password" value={form.password} onChange={(event) => updateField('password', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              {fieldErrors.password && <p className="mt-1 text-xs text-rose-600">{fieldErrors.password}</p>}
            </div>
            <div>
              <input type="password" placeholder="Confirm password" value={form.confirmPassword} onChange={(event) => updateField('confirmPassword', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              {fieldErrors.confirmPassword && <p className="mt-1 text-xs text-rose-600">{fieldErrors.confirmPassword}</p>}
            </div>
            <div>
              <input type="text" placeholder="Student ID" value={form.studentIdNumber} onChange={(event) => updateField('studentIdNumber', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500" />
              {fieldErrors.studentIdNumber && <p className="mt-1 text-xs text-rose-600">{fieldErrors.studentIdNumber}</p>}
            </div>
            <div>
              <select value={form.faculty} onChange={(event) => updateField('faculty', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
                <option value="">Select faculty</option>
                {EDU_SHARE_FACULTIES.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
              {fieldErrors.faculty && <p className="mt-1 text-xs text-rose-600">{fieldErrors.faculty}</p>}
            </div>
            <div>
              <select value={form.year} onChange={(event) => updateField('year', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
                <option value="">Academic year</option>
                <option value="Year 1">Year 1</option>
                <option value="Year 2">Year 2</option>
                <option value="Year 3">Year 3</option>
                <option value="Year 4">Year 4</option>
              </select>
              {fieldErrors.year && <p className="mt-1 text-xs text-rose-600">{fieldErrors.year}</p>}
            </div>
            <div>
              <select value={form.semester} onChange={(event) => updateField('semester', event.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-brand-500">
                <option value="">Semester</option>
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
              </select>
              {fieldErrors.semester && <p className="mt-1 text-xs text-rose-600">{fieldErrors.semester}</p>}
            </div>
          </div>

          <p className="text-xs text-slate-500">Create a student account using your real university details.</p>
          <p className="text-xs text-slate-500">{PASSWORD_HELP}</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button type="submit" className="w-full rounded-xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">Sign up</button>
        </form>

        <p className="mt-6 text-sm text-slate-600">Already have an account? <Link className="font-semibold text-brand-700" to="/signin">Sign in</Link></p>
      </div>
    </main>
  );
}
