import { getRatingLevel, type GuestProfile } from "@/lib/demo/progress";

export type DemoLeaderboardPlayer = {
  id: string;
  nickname: string;
  city: string;
  rating: number;
  winRate: number;
  streak: number;
  isGuest?: boolean;
};

const DEMO_PLAYERS: DemoLeaderboardPlayer[] = [
  {
    id: "queenline",
    nickname: "Queenline",
    city: "Moscow",
    rating: 1640,
    winRate: 67,
    streak: 5,
  },
  {
    id: "tempofox",
    nickname: "TempoFox",
    city: "Almaty",
    rating: 1525,
    winRate: 61,
    streak: 3,
  },
  {
    id: "novaknight",
    nickname: "NovaKnight",
    city: "Novosibirsk",
    rating: 1380,
    winRate: 58,
    streak: 2,
  },
  {
    id: "endgame-lab",
    nickname: "EndgameLab",
    city: "Astana",
    rating: 1160,
    winRate: 54,
    streak: 1,
  },
  {
    id: "pawnstorm",
    nickname: "PawnStorm",
    city: "Other",
    rating: 930,
    winRate: 48,
    streak: 0,
  },
];

export function buildLeaderboard(profile: GuestProfile | null) {
  const players = profile
    ? [
        ...DEMO_PLAYERS,
        {
          id: profile.id,
          nickname: profile.nickname,
          city: "Guest",
          rating: profile.rating,
          winRate: profile.wins === 0 && profile.losses === 0 ? 0 : Math.round(
            (profile.wins / (profile.wins + profile.losses + profile.draws)) *
              100,
          ),
          streak: profile.streak,
          isGuest: true,
        },
      ]
    : DEMO_PLAYERS;

  return [...players]
    .sort((first, second) => second.rating - first.rating)
    .map((player, index) => ({
      ...player,
      level: getRatingLevel(player.rating),
      rank: index + 1,
    }));
}
