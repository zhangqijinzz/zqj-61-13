import { create } from 'zustand'
import { UserProfile, CharacterType, GameType, GameScoreRecord, ScenarioResult, Mission, TreeHolePost, Reply, GAME_BADGES } from '@/types'
import { treeHolePosts } from '@/data/treeHolePosts'
import { defaultMissions } from '@/data/missions'

const STORAGE_KEY = 'dad-adventure-state'

function getTitleByLevel(level: number): string {
  if (level <= 2) return '初出茅庐的爸爸'
  if (level <= 4) return '渐入佳境的爸爸'
  if (level <= 6) return '得心应手的爸爸'
  return '传说中的超级爸爸'
}

function saveToLocalStorage(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function loadFromLocalStorage(): GameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  return null
}

interface GameState {
  userProfile: UserProfile | null
  scenarioResults: ScenarioResult[]
  missions: Mission[]
  posts: TreeHolePost[]
}

interface GameActions {
  createProfile: (characterType: CharacterType, nickname: string) => void
  completeScenario: (scenarioId: string, choices: { sceneId: string; optionId: string }[]) => void
  unlockSkill: (skillId: string) => void
  toggleMission: (missionId: string) => void
  addMission: (mission: Mission) => void
  removeMission: (missionId: string) => void
  addPost: (post: TreeHolePost) => void
  addReplyToPost: (postId: string, reply: Reply) => void
  togglePostLike: (postId: string) => void
  recordGameScore: (gameType: GameType, score: number) => string[]
  getHighScore: (gameType: GameType) => number
  getGameScoreHistory: (gameType: GameType) => GameScoreRecord[]
  markContractCompletionCelebrated: () => void
  checkAllMissionsCompleted: () => boolean
  resetGame: () => void
}

type StoreType = GameState & GameActions

const savedState = loadFromLocalStorage()

export const useGameStore = create<StoreType>()((set, get) => ({
  userProfile: savedState?.userProfile ?? null,
  scenarioResults: savedState?.scenarioResults ?? [],
  missions: savedState?.missions ?? [],
  posts: savedState?.posts ?? treeHolePosts,

  createProfile: (characterType, nickname) => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      characterType,
      nickname,
      level: 1,
      title: '初出茅庐的爸爸',
      createdAt: new Date().toISOString(),
      completedScenarios: [],
      unlockedSkills: [],
      completedMissions: [],
      earnedBadges: [],
      gameScores: [],
      hasCelebratedContractCompletion: false,
    }
    set({ 
      userProfile: profile,
      missions: defaultMissions.map((m) => ({ ...m })),
    })
    saveToLocalStorage(get())
  },

  completeScenario: (scenarioId, choices) => {
    const state = get()
    if (!state.userProfile) return

    const result: ScenarioResult = {
      scenarioId,
      choices,
      completedAt: new Date().toISOString(),
    }

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)

    set({
      scenarioResults: [...state.scenarioResults, result],
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        completedScenarios: [...state.userProfile.completedScenarios, scenarioId],
      },
    })
    saveToLocalStorage(get())
  },

  unlockSkill: (skillId) => {
    const state = get()
    if (!state.userProfile) return

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)

    set({
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        unlockedSkills: [...state.userProfile.unlockedSkills, skillId],
        earnedBadges: [...state.userProfile.earnedBadges, `${skillId}-badge`],
      },
    })
    saveToLocalStorage(get())
  },

  toggleMission: (missionId) => {
    const state = get()
    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission) return

    const willBeCompleted = !mission.completed
    let newCompletedMissions = [...(state.userProfile?.completedMissions ?? [])]

    if (willBeCompleted) {
      if (!newCompletedMissions.includes(missionId)) {
        newCompletedMissions.push(missionId)
      }
    } else {
      newCompletedMissions = newCompletedMissions.filter((id) => id !== missionId)
    }

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: newCompletedMissions,
      }
    }

    set({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, completed: !m.completed } : m
      ),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addMission: (mission) => {
    const state = get()
    set({ missions: [...state.missions, mission] })
    saveToLocalStorage(get())
  },

  removeMission: (missionId) => {
    const state = get()

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: state.userProfile.completedMissions.filter(
          (id) => id !== missionId
        ),
      }
    }

    set({
      missions: state.missions.filter((m) => m.id !== missionId),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addPost: (post) => {
    const state = get()
    set({ posts: [post, ...state.posts] })
    saveToLocalStorage(get())
  },

  addReplyToPost: (postId, reply) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
      ),
    })
    saveToLocalStorage(get())
  },

  togglePostLike: (postId) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ),
    })
    saveToLocalStorage(get())
  },

  recordGameScore: (gameType, score) => {
    const state = get()
    if (!state.userProfile) return []

    const record: GameScoreRecord = {
      id: `score-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      gameType,
      score,
      playedAt: new Date().toISOString(),
    }

    const newScores = [...state.userProfile.gameScores, record]
    const currentHigh = Math.max(
      ...state.userProfile.gameScores
        .filter((s) => s.gameType === gameType)
        .map((s) => s.score),
      0
    )

    const newlyEarnedBadges: string[] = []
    let newBadges = [...state.userProfile.earnedBadges]

    if (score > currentHigh) {
      GAME_BADGES.forEach((badge) => {
        if (
          badge.gameType === gameType &&
          score >= badge.threshold &&
          !newBadges.includes(badge.id)
        ) {
          newBadges.push(badge.id)
          newlyEarnedBadges.push(badge.id)
        }
      })
    }

    set({
      userProfile: {
        ...state.userProfile,
        gameScores: newScores,
        earnedBadges: newBadges,
      },
    })
    saveToLocalStorage(get())
    return newlyEarnedBadges
  },

  getHighScore: (gameType) => {
    const state = get()
    if (!state.userProfile) return 0
    const gameScores = state.userProfile.gameScores.filter(
      (s) => s.gameType === gameType
    )
    if (gameScores.length === 0) return 0
    return Math.max(...gameScores.map((s) => s.score))
  },

  getGameScoreHistory: (gameType) => {
    const state = get()
    if (!state.userProfile) return []
    return state.userProfile.gameScores
      .filter((s) => s.gameType === gameType)
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .slice(0, 10)
  },

  markContractCompletionCelebrated: () => {
    const state = get()
    if (!state.userProfile) return
    set({
      userProfile: {
        ...state.userProfile,
        hasCelebratedContractCompletion: true,
      },
    })
    saveToLocalStorage(get())
  },

  checkAllMissionsCompleted: () => {
    const state = get()
    if (state.missions.length === 0) return false
    return state.missions.every((m) => m.completed)
  },

  resetGame: () => {
    set({
      userProfile: null,
      scenarioResults: [],
      missions: [],
      posts: treeHolePosts,
    })
    localStorage.removeItem(STORAGE_KEY)
  },
}))
