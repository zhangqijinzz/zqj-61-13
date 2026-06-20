export type CharacterType = "knight" | "warrior" | "guardian" | "ranger"

export type GameType = "reaction" | "wordMatch"

export interface GameScoreRecord {
  id: string
  gameType: GameType
  score: number
  playedAt: string
}

export interface UserProfile {
  id: string
  characterType: CharacterType
  nickname: string
  level: number
  title: string
  createdAt: string
  completedScenarios: string[]
  unlockedSkills: string[]
  completedMissions: string[]
  earnedBadges: string[]
  gameScores: GameScoreRecord[]
  hasCelebratedContractCompletion: boolean
}

export interface Scenario {
  id: string
  title: string
  description: string
  ageRange: string
  theme: string
  difficulty: "easy" | "medium" | "hard"
  emoji: string
  scenes: Scene[]
}

export interface Scene {
  id: string
  narration: string
  backgroundEmotion: string
  options: Option[]
}

export interface Option {
  id: string
  text: string
  consequence: string
  feedback: string
  nextSceneId: string | null
  isRecommended: boolean
}

export interface Skill {
  id: string
  name: string
  description: string
  emoji: string
  category: string
  prerequisites: string[]
  steps: SkillStep[]
}

export interface SkillStep {
  title: string
  content: string
  tip: string
}

export interface Mission {
  id: string
  title: string
  description: string
  completed: boolean
  weekStart: string
  emoji: string
}

export interface TreeHolePost {
  id: string
  authorCharacter: CharacterType
  authorNickname: string
  content: string
  tags: string[]
  replies: Reply[]
  createdAt: string
  likes: number
}

export interface Reply {
  id: string
  authorCharacter: CharacterType
  authorNickname: string
  content: string
  createdAt: string
}

export interface ScenarioResult {
  scenarioId: string
  choices: { sceneId: string; optionId: string }[]
  completedAt: string
}

export interface GameBadgeDefinition {
  id: string
  name: string
  emoji: string
  description: string
  gameType: GameType
  threshold: number
}

export const GAME_BADGES: GameBadgeDefinition[] = [
  {
    id: "badge-reaction-bronze",
    name: "反应新手",
    emoji: "⚡",
    description: "反应点击挑战达到100分",
    gameType: "reaction",
    threshold: 100,
  },
  {
    id: "badge-reaction-silver",
    name: "闪电之手",
    emoji: "🌩️",
    description: "反应点击挑战达到300分",
    gameType: "reaction",
    threshold: 300,
  },
  {
    id: "badge-reaction-gold",
    name: "光速反应王",
    emoji: "💫",
    description: "反应点击挑战达到500分",
    gameType: "reaction",
    threshold: 500,
  },
  {
    id: "badge-wordMatch-bronze",
    name: "词语达人",
    emoji: "📚",
    description: "词语配对达到500分",
    gameType: "wordMatch",
    threshold: 500,
  },
  {
    id: "badge-wordMatch-silver",
    name: "记忆大师",
    emoji: "🧠",
    description: "词语配对达到1000分",
    gameType: "wordMatch",
    threshold: 1000,
  },
  {
    id: "badge-wordMatch-gold",
    name: "词汇至尊",
    emoji: "👑",
    description: "词语配对达到1500分",
    gameType: "wordMatch",
    threshold: 1500,
  },
]

export const GAME_CONFIG = {
  reaction: {
    name: "反应点击挑战",
    emoji: "⚡",
    description: "考验你的手速和反应！点击出现的目标，在30秒内获得尽可能高的分数。",
    duration: 30,
  },
  wordMatch: {
    name: "词语配对",
    emoji: "🧩",
    description: "锻炼你的记忆和联想能力！找出相关词语对，在规定时间内获得高分。",
    duration: 60,
  },
}
