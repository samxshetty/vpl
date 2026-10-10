import { CirclePlay, CircleDot, Swords, Target } from "lucide-react";

export const standings = [
  { rank: 1, section: "5C", played: 12, gd: "+4", points: 85, form: ["W", "W", "L", "W"] },
  { rank: 2, section: "7B", played: 11, gd: "+2", points: 78, form: ["W", "D", "W", "W"] },
  { rank: 3, section: "3A", played: 12, gd: "-1", points: 72, form: ["L", "W", "W", "L"] },
  { rank: 4, section: "7A", played: 13, gd: "+5", points: 70, form: ["W", "W", "W", "D"] },
  { rank: 5, section: "5A", played: 10, gd: "0", points: 65, form: ["L", "L", "W", "W"] },
];

export const liveMatches = [
  {
    id: "m1",
    sport: "CRICKET",
    iconName: "circle-dot",
    state: "INNINGS 2",
    team1: "3A",
    team2: "5C",
    score: "112/4",
    target: "148/6",
    meta: "13.1 ov",
    highlight: "At Crease: Vignesh 42*(26) | Bowler: Praneeth 2/18",
    venue: "Main Ground",
    isLive: true,
  },
  {
    id: "m2",
    sport: "FOOTBALL",
    iconName: "circle-play",
    state: "HALF TIME",
    team1: "7A",
    team2: "3B",
    score: "2 - 1",
    meta: "45+2'",
    highlight: "34' Goal by Manish K. (7A)",
    venue: "Quadrangle Court",
    isLive: true,
  },
  {
    id: "m3",
    sport: "CHESS",
    iconName: "swords",
    state: "BOARD 1",
    team1: "7B",
    team2: "5D",
    score: "0 - 0",
    meta: "12m left",
    highlight: "Darshan S. (7B) vs Aditya K. (5D) • White +1.8 Adv",
    venue: "Indoor Hall",
    isLive: true,
  }
];

export const recentResults = [
  {
    id: "r1",
    sport: "CRICKET",
    team1: "5C",
    team2: "3E",
    result: "5C won by 4 wickets",
    score: "145/6 vs 144/9",
  },
  {
    id: "r2",
    sport: "FOOTBALL",
    team1: "3B",
    team2: "7C",
    result: "3B clinched 3-2 on penalties",
    score: "1 - 1 (FT)",
  },
  {
    id: "r3",
    sport: "BADMINTON",
    team1: "7A",
    team2: "5B",
    result: "7A won 2-0 sets",
    score: "21-18, 21-14",
  }
];
