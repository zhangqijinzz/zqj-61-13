import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Play, RotateCcw, Trophy, TrendingUp, Award } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { GAME_CONFIG, GAME_BADGES, GameScoreRecord, GameBadgeDefinition } from "@/types"

type GameStatus = "idle" | "playing" | "ended"

interface Target {
  id: number
  x: number
  y: number
  emoji: string
  size: number
  points: number
}

const targetEmojis = ["⭐", "🌟", "💫", "✨", "🎯", "⚡", "🔥", "💎"]
const bonusEmojis = ["👑", "💖"]
const trapEmoji = "💣"

const GAME_DURATION = GAME_CONFIG.reaction.duration

export default function ReactionGame() {
  const navigate = useNavigate()
  const userProfile = useGameStore((s) => s.userProfile)
  const recordGameScore = useGameStore((s) => s.recordGameScore)
  const getHighScore = useGameStore((s) => s.getHighScore)
  const getGameScoreHistory = useGameStore((s) => s.getGameScoreHistory)

  const [status, setStatus] = useState<GameStatus>("idle")
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION)
  const [targets, setTargets] = useState<Target[]>([])
  const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([])
  const [showScoreRecorded, setShowScoreRecorded] = useState(false)

  const targetIdRef = useRef(0)
  const gameAreaRef = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const spawnRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const highScore = useMemo(() => getHighScore("reaction"), [getHighScore])
  const scoreHistory = useMemo(() => getGameScoreHistory("reaction"), [getGameScoreHistory])
  const earnedBadgesForGame = useMemo(
    () =>
      GAME_BADGES.filter(
        (b) => b.gameType === "reaction" && userProfile?.earnedBadges.includes(b.id)
      ),
    [userProfile]
  )

  const clearTimers = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }
    if (spawnRef.current) {
      clearInterval(spawnRef.current)
      spawnRef.current = null
    }
  }, [])

  const spawnTarget = useCallback(() => {
    if (!gameAreaRef.current) return
    const rect = gameAreaRef.current.getBoundingClientRect()
    const areaWidth = rect.width
    const areaHeight = rect.height

    const rand = Math.random()
    let emoji: string
    let points: number
    let size: number

    if (rand < 0.08) {
      emoji = trapEmoji
      points = -20
      size = 56
    } else if (rand < 0.2) {
      emoji = bonusEmojis[Math.floor(Math.random() * bonusEmojis.length)]
      points = 30
      size = 64
    } else {
      emoji = targetEmojis[Math.floor(Math.random() * targetEmojis.length)]
      points = 10
      size = 48 + Math.floor(Math.random() * 16)
    }

    const padding = size + 10
    const x = padding + Math.random() * (areaWidth - padding * 2)
    const y = padding + Math.random() * (areaHeight - padding * 2)

    const target: Target = {
      id: targetIdRef.current++,
      x,
      y,
      emoji,
      size,
      points,
    }

    setTargets((prev) => [...prev, target])

    const lifespan = 800 + Math.random() * 800
    setTimeout(() => {
      setTargets((prev) => prev.filter((t) => t.id !== target.id))
    }, lifespan)
  }, [])

  const endGame = useCallback(() => {
    clearTimers()
    setStatus("ended")
    setTargets([])
  }, [clearTimers])

  const startGame = useCallback(() => {
    setScore(0)
    setTimeLeft(GAME_DURATION)
    setTargets([])
    setNewlyEarnedBadges([])
    setShowScoreRecorded(false)
    setStatus("playing")

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    let spawnRate = 600
    spawnRef.current = setInterval(() => {
      spawnTarget()
      setScore((currentScore) => {
        const elapsed = GAME_DURATION - timeLeft
        if (elapsed > 10 && spawnRate > 400) {
          spawnRate = 450
        }
        if (elapsed > 20 && spawnRate > 300) {
          spawnRate = 350
        }
        return currentScore
      })
    }, spawnRate)
  }, [spawnTarget, endGame, timeLeft])

  useEffect(() => {
    return () => clearTimers()
  }, [clearTimers])

  useEffect(() => {
    if (status === "ended" && !showScoreRecorded) {
      const earned = recordGameScore("reaction", Math.max(score, 0))
      setNewlyEarnedBadges(earned)
      setShowScoreRecorded(true)
    }
  }, [status, score, recordGameScore, showScoreRecorded])

  const handleTargetClick = (target: Target) => {
    if (status !== "playing") return
    setScore((prev) => prev + target.points)
    setTargets((prev) => prev.filter((t) => t.id !== target.id))
  }

  const formatDate = (isoStr: string) => {
    const d = new Date(isoStr)
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`
  }

  if (!userProfile) return null

  return (
    <div className="min-h-screen bg-adventure-cream pb-8">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-4"
        >
          <button
            onClick={() => navigate("/adventure-break")}
            className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center cursor-pointer hover:shadow-card-hover transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-adventure-blue" />
          </button>
          <div>
            <h1 className="section-title text-2xl">⚡ 反应点击挑战</h1>
            <p className="font-body text-sm text-adventure-blue/60">
              点击闪光目标得分，避开炸弹！
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-adventure mb-4 !p-4"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center">
              <span className="font-body text-xs text-adventure-blue/60 mb-1">
                得分
              </span>
              <span className="font-display text-2xl text-adventure-orange">
                {Math.max(score, 0)}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body text-xs text-adventure-blue/60 mb-1">
                剩余时间
              </span>
              <span
                className={`font-display text-2xl ${
                  timeLeft <= 5 && status === "playing"
                    ? "text-red-500 animate-pulse"
                    : "text-adventure-blue"
                }`}
              >
                {timeLeft}s
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="font-body text-xs text-adventure-blue/60 mb-1">
                最高分
              </span>
              <span className="font-display text-2xl text-adventure-teal">
                {highScore}
              </span>
            </div>
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {status === "idle" && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-adventure text-center"
            >
              <div className="text-6xl mb-4">⚡🎯</div>
              <h2 className="font-display text-2xl text-adventure-blue mb-2">
                准备好了吗？
              </h2>
              <div className="text-left mb-6 space-y-2">
                <div className="flex items-center gap-2 font-body text-sm text-adventure-blue/70">
                  <span className="text-lg">⭐</span>
                  <span>普通目标：+10 分</span>
                </div>
                <div className="flex items-center gap-2 font-body text-sm text-adventure-blue/70">
                  <span className="text-lg">👑</span>
                  <span>奖励目标：+30 分</span>
                </div>
                <div className="flex items-center gap-2 font-body text-sm text-red-500/80">
                  <span className="text-lg">💣</span>
                  <span>炸弹陷阱：-20 分（注意避开！）</span>
                </div>
              </div>
              <button onClick={startGame} className="btn-adventure w-full">
                <Play className="w-5 h-5" />
                开始游戏
              </button>
            </motion.div>
          )}

          {status === "playing" && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div
                ref={gameAreaRef}
                className="relative w-full rounded-adventure-lg bg-gradient-to-br from-yellow-50 via-orange-50 to-pink-50 border-2 border-adventure-orange/20 overflow-hidden"
                style={{ height: "400px" }}
              >
                <AnimatePresence>
                  {targets.map((target) => (
                    <motion.div
                      key={target.id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25 }}
                      onClick={() => handleTargetClick(target)}
                      className="absolute cursor-pointer select-none"
                      style={{
                        left: target.x - target.size / 2,
                        top: target.y - target.size / 2,
                        width: target.size,
                        height: target.size,
                      }}
                      whileTap={{ scale: 0.8 }}
                    >
                      <div
                        className="w-full h-full flex items-center justify-center rounded-full shadow-lg"
                        style={{
                          fontSize: target.size * 0.6,
                          background:
                            target.points > 20
                              ? "linear-gradient(135deg, #FFD93D, #FFB5C2)"
                              : target.points < 0
                              ? "linear-gradient(135deg, #FF6B6B, #EE5A5A)"
                              : "linear-gradient(135deg, #FFE66D, #FFD93D)",
                        }}
                      >
                        {target.emoji}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {status === "ended" && (
            <motion.div
              key="ended"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="card-adventure text-center bg-gradient-to-b from-adventure-gold/10 to-adventure-orange/5 border-2 border-adventure-gold/40"
            >
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className="text-6xl block mb-3">🎉</span>
                <h3 className="font-display text-3xl text-adventure-blue mb-1">
                  游戏结束！
                </h3>
                {score > highScore ? (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      delay: 0.4,
                    }}
                    className="inline-block bg-gradient-to-r from-adventure-gold to-adventure-orange text-white font-display text-sm px-4 py-1 rounded-full mb-4"
                  >
                    🏆 新纪录！
                  </motion.div>
                ) : (
                  <p className="font-body text-sm text-adventure-blue/60 mb-4">
                    最高分: {highScore}
                  </p>
                )}
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-white/70 rounded-xl p-4 mb-4"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Trophy className="w-6 h-6 text-adventure-gold" />
                  <span className="font-display text-5xl text-adventure-orange">
                    {Math.max(score, 0)}
                  </span>
                  <span className="font-display text-lg text-adventure-blue/60">
                    分
                  </span>
                </div>
              </motion.div>

              <AnimatePresence>
                {newlyEarnedBadges.length > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mb-4"
                  >
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Award className="w-5 h-5 text-adventure-gold" />
                      <span className="font-display text-adventure-blue">
                        解锁新徽章！
                      </span>
                    </div>
                    <div className="flex justify-center gap-3">
                      {newlyEarnedBadges.map((badgeId) => {
                        const badge = GAME_BADGES.find((b) => b.id === badgeId)
                        return badge ? (
                          <motion.div
                            key={badge.id}
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{
                              type: "spring",
                              stiffness: 250,
                              delay: 0.6,
                            }}
                            className="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-gold to-adventure-orange flex items-center justify-center shadow-lg"
                            title={badge.name}
                          >
                            <span className="text-3xl">{badge.emoji}</span>
                          </motion.div>
                        ) : null
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="flex gap-3 mb-4"
              >
                <button onClick={startGame} className="btn-adventure flex-1">
                  <RotateCcw className="w-4 h-4" />
                  再来一次
                </button>
                <button
                  onClick={() => navigate("/adventure-break")}
                  className="btn-ghost flex-1"
                >
                  返回
                </button>
              </motion.div>

              {scoreHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-adventure-teal" />
                    <span className="font-body text-sm text-adventure-blue/60">
                      历史记录（最近10局）
                    </span>
                  </div>
                  <div className="bg-white/50 rounded-xl p-3 max-h-32 overflow-y-auto">
                    <div className="space-y-1">
                      {scoreHistory.map((record: GameScoreRecord, idx: number) => (
                        <div
                          key={record.id}
                          className={`flex justify-between items-center px-2 py-1 rounded-lg text-sm ${
                            idx === 0 && record.score === highScore
                              ? "bg-adventure-gold/20"
                              : ""
                          }`}
                        >
                          <span className="font-body text-adventure-blue/70">
                            {formatDate(record.playedAt)}
                          </span>
                          <div className="flex items-center gap-2">
                            {idx === 0 && record.score === highScore && (
                              <span className="text-xs">👑</span>
                            )}
                            <span className="font-display text-adventure-orange">
                              {record.score}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {earnedBadgesForGame.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="card-adventure mt-6 !p-4"
          >
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-adventure-gold" />
              <span className="font-display text-adventure-blue">
                已获徽章
              </span>
            </div>
            <div className="flex gap-3 flex-wrap">
              {earnedBadgesForGame.map((badge: GameBadgeDefinition) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center"
                  title={`${badge.name} - ${badge.description}`}
                >
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-adventure-gold to-adventure-orange flex items-center justify-center shadow-md">
                    <span className="text-2xl">{badge.emoji}</span>
                  </div>
                  <span className="font-body text-xs text-adventure-blue/60 mt-1">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
