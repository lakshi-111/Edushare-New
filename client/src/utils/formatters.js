export function formatCurrency(value = 0) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'LKR',
    maximumFractionDigits: 0
  }).format(Number(value || 0));
}

export function formatCompactNumber(value = 0) {
  return new Intl.NumberFormat('en', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(Number(value || 0));
}

export function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function formatFileSize(bytes = 0) {
  const size = Number(bytes || 0);
  if (size < 1024) return `${size} B`;
  if (size < 1024 ** 2) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 ** 3) return `${(size / 1024 ** 2).toFixed(1)} MB`;
  return `${(size / 1024 ** 3).toFixed(1)} GB`;
}

export function getFileTypeLabel(fileType = '') {
  const normalized = String(fileType || '').toLowerCase();
  if (normalized.includes('pdf')) return 'PDF';
  if (normalized.includes('presentation') || normalized.includes('powerpoint') || normalized.includes('ppt')) return 'PPT';
  if (normalized.includes('word') || normalized.includes('document') || normalized.includes('doc')) return 'DOC';
  if (normalized.includes('image')) return 'Image';
  if (normalized.includes('sheet') || normalized.includes('excel') || normalized.includes('csv') || normalized.includes('xls')) return 'Sheet';
  return normalized ? normalized.toUpperCase() : 'File';
}

export function getVerificationSteps() {
  return ['pending', 'verified', 'approved', 'paid'];
}

export function formatVerificationLabel(status = 'pending') {
  const labels = {
    pending: 'Pending',
    verified: 'Verified',
    approved: 'Approved',
    paid: 'Paid',
    rejected: 'Rejected'
  };
  return labels[status] || 'Pending';
}

export function getVerificationProgress(status = 'pending') {
  const order = getVerificationSteps();
  if (status === 'rejected') return 0;
  const index = order.indexOf(status);
  if (index === -1) return 25;
  return ((index + 1) / order.length) * 100;
}

export function getStatusBadgeClasses(status = 'pending') {
  const classes = {
    pending: 'bg-amber-100 text-amber-700',
    verified: 'bg-sky-100 text-sky-700',
    approved: 'bg-emerald-100 text-emerald-700',
    paid: 'bg-green-100 text-green-700',
    rejected: 'bg-rose-100 text-rose-700'
  };
  return classes[status] || classes.pending;
}
