export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function statusTone(
  status: string,
): 'neutral' | 'live' | 'success' | 'warning' | 'danger' | 'accent' {
  switch (status) {
    case 'live':
    case 'approved':
    case 'accepted':
    case 'active':
      return status === 'live' ? 'live' : 'success';
    case 'pending':
    case 'draft':
      return 'warning';
    case 'rejected':
    case 'declined':
    case 'expired':
    case 'inactive':
      return 'danger';
    case 'closed':
      return 'accent';
    default:
      return 'neutral';
  }
}
