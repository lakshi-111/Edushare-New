export default function ContactPage() {
  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-soft">
        <h1 className="text-3xl font-bold text-slate-900">Contact</h1>
        <p className="mt-3 text-slate-600">
          Use the in-app inquiry flow on each resource to contact its uploader. For system-level issues, email support@edushare.local.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {[
            ['General support', 'support@edushare.local'],
            ['Admin team', 'admin@edushare.local'],
            ['Uploads', 'uploads@edushare.local']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">{label}</p>
              <p className="mt-2 font-semibold text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
