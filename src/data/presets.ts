export const DANCE_PRESETS: { name: string; shortName?: string; steps?: string }[] = [
  { name: 'Pas de basques', shortName: 'PDB' },
  { name: 'Pas de basques & High Cuts', shortName: 'PDB/HC' },
  { name: 'Highland Fling', shortName: 'Fling', steps: '4' },
  { name: 'Highland Fling', shortName: 'Fling', steps: '6' },
  { name: 'Sword Dance', shortName: 'Sword', steps: '2+1' },
  { name: 'Sword Dance', shortName: 'Sword', steps: '3+1' },
  { name: 'Seann Truibhas', shortName: 'ST', steps: '3+1' },
  { name: 'Seann Truibhas', shortName: 'ST', steps: '4+2' },
  { name: 'Strathspey & Highland Reel', shortName: 'Reel', steps: '2+2' },
  {
    name: 'Strathspey & Highland Reel & Half Tulloch',
    shortName: 'Reel & ½ Tulloch',
    steps: '2+4',
  },
  { name: 'Strathspey & Half Tulloch', shortName: '½ Tulloch' },
  { name: 'Barracks Johnnie', shortName: 'Johnnie', steps: '4' },
  { name: 'Highland Laddie', shortName: 'Laddie', steps: '4' },
  { name: 'Scottish Lilt', shortName: 'Lilt', steps: '4' },
  { name: "Flora MacDonald's Fancy", shortName: 'Flora', steps: '4' },
  { name: 'Village Maid', steps: '4' },
  { name: 'Blue Bonnets', steps: '4' },
  { name: 'Earl of Errol', shortName: 'Earl', steps: '4' },
  { name: 'Scotch Measure', steps: '4' },
  { name: 'Irish Jig', shortName: 'Jig', steps: '3+1' },
  { name: 'Irish Jig', shortName: 'Jig', steps: '4+1' },
  { name: 'Sailors Hornpipe', shortName: 'Hornpipe', steps: '4' },
  { name: 'Broadsword' },
  { name: 'Choreography' },
]

export const CATEGORY_PRESETS: string[] = [
  'Primary',
  'Beginner',
  'Novice',
  'Intermediate',
  'Premier',
  'Restricted Premier',
  'Premier Special',
]

export const GROUP_PRESETS: string[] = [
  '7 & Under 10 Years',
  '10 & Under 12 Years',
  '12 & Under 14 Years',
  '14 & Under 16 Years',
  '16 & Under 18 Years',
  '18 & Under 21 Years',
  '21 Years & Over',
]

export const BLOCK_PRESETS: string[] = ['Morning', 'Afternoon', 'Evening']

export const EVENT_PRESETS: string[] = ['Registration', 'Results']

export const EVENT_CATEGORY_BUCKETS: string[][] = [
  ['Primary', 'Beginner', 'Novice'],
  ['Intermediate', 'Premier', 'Restricted Premier', 'Premier Special'],
]
