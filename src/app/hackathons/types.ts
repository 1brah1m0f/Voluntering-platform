export type DiscoveryMode = 'volunteering' | 'hackathons' | 'both';
export type HackathonFormat = 'online' | 'onsite' | 'hybrid';
export type HackathonLevel = 'all' | 'beginner' | 'experienced';
export interface Hackathon {
  id: string;
  title: string;
  organizer: string;
  format: HackathonFormat;
  location: string;
  deadline: string;
  start_date: string;
  end_date: string;
  team_min: number;
  team_max: number;
  prize: string;
  technologies: string[];
  themes: string[];
  level: HackathonLevel;
  eligibility: string;
  description: string;
  url: string;
  published: boolean;
  created_at: string;
}
export type HackathonInput = Omit<Hackathon, 'id' | 'created_at'>;
export type HackathonStage = 'saved' | 'forming_team' | 'registered' | 'submitted';
export interface HackathonEntry {
  hackathon_id: string;
  stage: HackathonStage;
}
