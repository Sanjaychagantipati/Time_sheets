// --- HELPER FORMATTING FUNCTIONS ---

export function formatDateFriendly(dateStr) {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  const d = new Date(parts[0], parts[1] - 1, parts[2]);
  const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' };
  return d.toLocaleDateString('en-US', options);
}

export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  let hours = parseInt(parts[0]);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // hour '0' should be '12'
  return `${hours}:${minutes} ${ampm}`;
}

export function formatMonthYearLabel(yearMonthStr) {
  if (!yearMonthStr) return '';
  const parts = yearMonthStr.split('-');
  const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}
