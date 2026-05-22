export type DemoLeaderboardCityKey =
  | "moscow"
  | "almaty"
  | "novosibirsk"
  | "astana"
  | "other"
  | "guest";

export type DemoLeaderboardPlayer = {
  id: string;
  nickname: string;
  cityKey: DemoLeaderboardCityKey;
  rating: number;
  winRate: number;
  streak: number;
  clanTag: string;
  isGuest?: boolean;
};

export const DEMO_PLAYERS: DemoLeaderboardPlayer[] = [
  {
    id: "queenline",
    nickname: "Queenline",
    cityKey: "moscow",
    rating: 1640,
    winRate: 67,
    streak: 5,
    clanTag: "CROWN",
  },
  {
    id: "tempofox",
    nickname: "TempoFox",
    cityKey: "almaty",
    rating: 1525,
    winRate: 61,
    streak: 3,
    clanTag: "TEMPO",
  },
  {
    id: "novaknight",
    nickname: "NovaKnight",
    cityKey: "novosibirsk",
    rating: 1380,
    winRate: 58,
    streak: 2,
    clanTag: "SIB64",
  },
  {
    id: "endgame-lab",
    nickname: "EndgameLab",
    cityKey: "astana",
    rating: 1160,
    winRate: 54,
    streak: 1,
    clanTag: "NOMAD",
  },
  {
    id: "pawnstorm",
    nickname: "PawnStorm",
    cityKey: "other",
    rating: 930,
    winRate: 48,
    streak: 0,
    clanTag: "OPEN",
  },
  {
    id: "bishop-grid",
    nickname: "BishopGrid",
    cityKey: "novosibirsk",
    rating: 1315,
    winRate: 56,
    streak: 4,
    clanTag: "SIB64",
  },
  {
    id: "steppe-file",
    nickname: "SteppeFile",
    cityKey: "almaty",
    rating: 1220,
    winRate: 52,
    streak: 1,
    clanTag: "TEMPO",
  },
  {
    id: "rook-metro",
    nickname: "RookMetro",
    cityKey: "moscow",
    rating: 1185,
    winRate: 51,
    streak: 2,
    clanTag: "CROWN",
  },
  {
    id: "astana-pin",
    nickname: "AstanaPin",
    cityKey: "astana",
    rating: 1095,
    winRate: 49,
    streak: 0,
    clanTag: "NOMAD",
  },
];
