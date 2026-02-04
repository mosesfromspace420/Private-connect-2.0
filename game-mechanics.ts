/**
 * Game Mechanics for PrivateConnect Games
 * Includes Farm Paradise and Word Clash logic
 */

// Farm Paradise Types
export interface Crop {
  id: string;
  type: "wheat" | "corn" | "tomato" | "carrot" | "potato";
  plantedAt: number;
  harvestReadyAt: number;
  isHarvested: boolean;
  position: { x: number; y: number };
}

export interface Farm {
  userId: string;
  crops: Crop[];
  coins: number;
  level: number;
  totalHarvests: number;
  lastPlantedAt: number;
}

export interface GameLeaderboard {
  userId: string;
  username: string;
  score: number;
  level: number;
  rank: number;
}

// Crop growth times (in milliseconds)
const CROP_GROWTH_TIMES: Record<Crop["type"], number> = {
  wheat: 5 * 60 * 1000, // 5 minutes
  corn: 8 * 60 * 1000, // 8 minutes
  tomato: 10 * 60 * 1000, // 10 minutes
  carrot: 7 * 60 * 1000, // 7 minutes
  potato: 12 * 60 * 1000, // 12 minutes
};

// Crop rewards (coins)
const CROP_REWARDS: Record<Crop["type"], number> = {
  wheat: 10,
  corn: 15,
  tomato: 20,
  carrot: 18,
  potato: 25,
};

export function plantCrop(
  cropType: Crop["type"],
  position: { x: number; y: number },
): Crop {
  const now = Date.now();
  return {
    id: `crop_${now}_${Math.random()}`,
    type: cropType,
    plantedAt: now,
    harvestReadyAt: now + CROP_GROWTH_TIMES[cropType],
    isHarvested: false,
    position,
  };
}

export function isReadyToHarvest(crop: Crop): boolean {
  return !crop.isHarvested && Date.now() >= crop.harvestReadyAt;
}

export function getGrowthProgress(crop: Crop): number {
  if (crop.isHarvested) return 100;
  const totalTime = crop.harvestReadyAt - crop.plantedAt;
  const elapsedTime = Date.now() - crop.plantedAt;
  return Math.min(100, (elapsedTime / totalTime) * 100);
}

export function harvestCrop(crop: Crop): number {
  if (!isReadyToHarvest(crop)) return 0;
  return CROP_REWARDS[crop.type];
}

export function getTimeUntilHarvest(crop: Crop): number {
  if (crop.isHarvested) return 0;
  const timeLeft = crop.harvestReadyAt - Date.now();
  return Math.max(0, timeLeft);
}

// Word Clash Types
export interface WordPuzzle {
  id: string;
  word: string;
  hint: string;
  difficulty: "easy" | "medium" | "hard";
  date: string;
}

export interface WordGameScore {
  userId: string;
  puzzleId: string;
  score: number;
  timeSpent: number;
  completed: boolean;
}

// Word list for daily puzzles
const WORD_DATABASE = [
  { word: "PRIVACY", hint: "Your data protection", difficulty: "easy" as const },
  { word: "CONNECT", hint: "Social network action", difficulty: "easy" as const },
  { word: "DIGITAL", hint: "Online world", difficulty: "medium" as const },
  { word: "SECURITY", hint: "Safety online", difficulty: "medium" as const },
  { word: "ALGORITHM", hint: "Computer logic", difficulty: "hard" as const },
  { word: "ENCRYPTION", hint: "Secret code", difficulty: "hard" as const },
  { word: "NETWORK", hint: "Connected system", difficulty: "easy" as const },
  { word: "PLATFORM", hint: "Social media", difficulty: "medium" as const },
  { word: "COMMUNITY", hint: "Group of users", difficulty: "medium" as const },
  { word: "INNOVATION", hint: "New idea", difficulty: "hard" as const },
];

export function getDailyPuzzle(date: string): WordPuzzle {
  // Use date as seed for consistent daily puzzle
  const dateNum = new Date(date).getTime();
  const index = dateNum % WORD_DATABASE.length;
  const wordData = WORD_DATABASE[index];

  return {
    id: `puzzle_${date}`,
    word: wordData.word,
    hint: wordData.hint,
    difficulty: wordData.difficulty,
    date,
  };
}

export function calculateWordScore(
  word: string,
  userGuess: string,
  timeSpent: number,
  difficulty: "easy" | "medium" | "hard",
): number {
  const isCorrect = word.toUpperCase() === userGuess.toUpperCase();
  if (!isCorrect) return 0;

  const baseScore = {
    easy: 10,
    medium: 20,
    hard: 50,
  }[difficulty];

  // Bonus for speed (max 5 seconds for full bonus)
  const timeBonus = Math.max(0, 5000 - timeSpent) / 1000;
  const speedMultiplier = 1 + timeBonus * 0.1;

  return Math.round(baseScore * speedMultiplier);
}

// Trivia Types
export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "easy" | "medium" | "hard";
  category: string;
}

export interface TriviaScore {
  userId: string;
  questionId: string;
  score: number;
  answered: boolean;
}

export function calculateTriviaScore(
  difficulty: "easy" | "medium" | "hard",
  timeSpent: number,
  isCorrect: boolean,
): number {
  if (!isCorrect) return 0;

  const baseScore = {
    easy: 5,
    medium: 10,
    hard: 25,
  }[difficulty];

  // Bonus for speed (max 10 seconds for full bonus)
  const timeBonus = Math.max(0, 10000 - timeSpent) / 10000;
  const speedMultiplier = 1 + timeBonus * 0.2;

  return Math.round(baseScore * speedMultiplier);
}

// Leaderboard calculations
export function calculateLevel(totalScore: number): number {
  return Math.floor(totalScore / 100) + 1;
}

export function getScoreForNextLevel(currentLevel: number): number {
  return currentLevel * 100;
}

export function getProgressToNextLevel(totalScore: number): number {
  const currentLevel = calculateLevel(totalScore);
  const currentLevelScore = (currentLevel - 1) * 100;
  const nextLevelScore = currentLevel * 100;
  const progress = totalScore - currentLevelScore;
  const needed = nextLevelScore - currentLevelScore;
  return (progress / needed) * 100;
}
