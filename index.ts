export type Tool = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon?: string;
  url?: string;
}
export const TOOLS = [
  {
    id: 'splits',
    name: 'Splits',
    description: 'Split registrants into groups with bib numbers',
    color: '#ffd323',
    icon: 'https://splits.scotdance.app/touchicon.png',
    url: 'https://splits.scotdance.app',
  },
  {
    id: 'challenge',
    name: 'Challenge',
    description: 'Motivate your progress',
    color: '#673ab7',
    icon: 'https://challenge.scotdance.app/touchicon.png',
    url: 'https://challenge.scotdance.app',
  },
  {
    id: 'scotdance',
    name: 'ScotDance.app',
    description: 'Highland dancing event tracker',
    color: '#1976d2',
    icon: 'https://scotdance.app/img/touchicon.png',
    url: 'https://scotdance.app',
  },
]
