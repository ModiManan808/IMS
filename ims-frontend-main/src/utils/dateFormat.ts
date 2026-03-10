/**
 * Formats a date string or Date to dd/mm/yyyy.
 * Handles DATEONLY strings (e.g. "2026-03-10"), ISO strings, and Date objects.
 */
export function formatDate(value: string | Date | null | undefined): string {
    if (!value) return '—';
    // For DATEONLY strings like "2026-03-10" parse directly to avoid timezone shift
    const str = String(value);
    const dateonlyMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateonlyMatch) {
        return `${dateonlyMatch[3]}/${dateonlyMatch[2]}/${dateonlyMatch[1]}`;
    }
    // Fallback for full ISO/Date objects
    const d = new Date(value);
    if (isNaN(d.getTime())) return '—';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
}
