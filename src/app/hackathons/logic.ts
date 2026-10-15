import type { Hackathon } from './types.ts';

export function hackathonMatches(h: Hackathon, filters: { query: string; format: string; level: string; technology: string; savedOnly: boolean; includeClosed: boolean }, saved: Set<string>, today: string) {
  const query = filters.query.trim().toLocaleLowerCase();
  return (filters.includeClosed || h.deadline >= today)
    && (!filters.savedOnly || saved.has(h.id))
    && (!filters.format || h.format === filters.format)
    && (!filters.level || h.level === 'all' || h.level === filters.level)
    && (!filters.technology || h.technologies.includes(filters.technology))
    && (!query || [h.title, h.organizer, h.location, ...h.themes, ...h.technologies].join(' ').toLocaleLowerCase().includes(query));
}

export const bakuToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Baku', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());

export function validHackathon(h: HackathonInputLike) {
  return !!h.title.trim() && !!h.organizer.trim() && !!h.description.trim()
    && /^https?:\/\/[^\s]+$/i.test(h.url)
    && !!h.deadline && !!h.start_date && !!h.end_date
    && h.deadline <= h.start_date && h.start_date <= h.end_date
    && Number.isInteger(h.team_min) && Number.isInteger(h.team_max)
    && h.team_min >= 1 && h.team_max >= h.team_min && h.team_max <= 100
    && (h.format === 'online' || !!h.location.trim());
}
type HackathonInputLike = Pick<Hackathon, 'title' | 'organizer' | 'description' | 'url' | 'deadline' | 'start_date' | 'end_date' | 'team_min' | 'team_max' | 'format' | 'location'>;
