import { useState, useEffect, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ArrowLeft, Zap, Puzzle, Trophy, TrendingUp } from "lucide-react"
import { useGameStore } from "@/store/useGameStore"
import { GAME_CONFIG, GAME_BADGES, GameType, GameBadgeDefinition } from "@/types"

export default function AdventureBreak() {
  const navigate = useNavigate()
  const userProfile = useGameStore((s) => s.userProfile)
  const getHighScore = useGameStore((s) => s.getHighScore)
  const checkAllMissionsCompleted = useGameStore((s) => s.checkAllMissionsCompleted)
  const markContractCompletionCelebrated = useGameStore((s) => s.markContractCompletionCelebrated)

  const [showCelebration, setShowCelebration] = useState(false)
  const [celebrationStep, setCelebrationStep] = useState(0)

  useEffect(() => {
    if (!userProfile) return
    const allCompleted = checkAllMissionsCompleted()
    if (allCompleted && !userProfile.hasCelebratedContractCompletion) {
      setShowCelebration(true)
      markContractCompletionCelebrated()
      setTimeout(() => setCelebrationStep(1), 1500)
      setTimeout(() => setCelebrationStep(2), 3500)
      setTimeout(() => {
        setShowCelebration(false)
      }, 6000)
    }
  }, [userProfile, checkAllMissionsCompleted, markContractCompletionCelebrated])

  const gameList = useMemo(
    () =>
      (Object.keys(GAME_CONFIG) as GameType[]).map((key) => {
        const config = GAME_CONFIG[key]
        const highScore = getHighScore(key)
        const badges = GAME_BADGES.filter((b) => b.gameType === key)
        const earnedBadges = badges.filter(
          (b) => userProfile?.earnedBadges.includes(b.id)
        )
        const nextBadge = badges.find(
          (b) => !userProfile?.earnedBadges.includes(b.id)
        )
        return {
          key,
          config,
          highScore,
          earnedBadges,
          nextBadge,
        }
      }),
    [getHighScore, userProfile]
  )

  if (!userProfile) return null

  return (
    <div className="min-h-screen bg-adventure-cream pb-8">
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-gradient-to-br from-adventure-gold via-adventure-orange to-adventure-pink flex items-center justify-center overflow-hidden"
          >
            <div className="absolute inset-0">
              {Array.from({ length: 30 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: `${Math.random() * 100}%`,
                    y: "110%",
                    opacity: 0,
                  }}
                  animate={{
                    y: "-10%",
                    opacity: [0, 1, 1, 0],
                  }}
                  transition={{
                    duration: 3 + Math.random() * 2,
                    delay: Math.random() * 1,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute text-4xl"
                  style={{ left: `${Math.random() * 100}%` }}
                >
                  {["🎉", "✨", "🎊", "⭐", "🌟", "💫"][i % 6]}
                </motion.div>
              ))}
            </div>

            <motion.div
              key={celebrationStep}
              initial={{ scale: 0, opacity: 0, rotate: -180 }}
              animate={{ scale: 1, opacity: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="relative z-10 text-center max-w-md px-6"
            >
              {celebrationStep === 0 && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    className="text-8xl mb-6"
                  >
                    🎉
                  </motion.div>
                  <h2 className="font-display text-4xl text-white mb-4 drop-shadow-lg">
                    契约达成！
                  </h2>
                  <p className="font-body text-xl text-white/90">
                    太棒了，你完成了所有契约任务！
                  </p>
                </>
              )}
              {celebrationStep === 1 && (
                <>
                  <motion.div
                    animate={{ rotate: [0, -10, 10, -10, 0] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="text-8xl mb-6"
                  >
                    🏆
                  </motion.div>
                  <h2 className="font-display text-4xl text-white mb-4 drop-shadow-lg">
                    你是超级爸爸！
                  </h2>
                  <p className="font-body text-xl text-white/90">
                    女儿一定感受到了你满满的爱 ❤️
                  </p>
                </>
              )}
              {celebrationStep === 2 && (
                <>
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="text-8xl mb-6"
                  >
                    🎮
                  </motion.div>
                  <h2 className="font-display text-4xl text-white mb-4 drop-shadow-lg">
                    冒险小憩
                  </h2>
                  <p className="font-body text-xl text-white/90">
                    来放松一下，玩两个轻松小游戏吧！
                  </p>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <button
            onClick={() => navigate("/home")}
            className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center cursor-pointer hover:shadow-card-hover transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-adventure-blue" />
          </button>
          <div>
            <h1 className="section-title text-2xl">🎮 冒险小憩</h1>
            <p className="font-body text-sm text-adventure-blue/60">
              放松一下，来玩两个轻松小游戏吧！
            </p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-adventure mb-6 bg-gradient-to-br from-adventure-blue/5 to-adventure-orange/5 border-2 border-adventure-gold/30"
        >
          <div className="flex items-center gap-3 mb-3">
            <Trophy className="w-6 h-6 text-adventure-gold" />
            <span className="font-display text-lg text-adventure-blue">
              游戏成就
            </span>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {gameList.map(({ key, earnedBadges, nextBadge, highScore }) => {
              const config = GAME_CONFIG[key]
              return (
                <div
                  key={key}
                  className="bg-white/60 rounded-xl p-3"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{config.emoji}</span>
                    <span className="font-display text-sm text-adventure-blue">
                      {config.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <TrendingUp className="w-4 h-4 text-adventure-teal" />
                    <span className="font-body text-sm text-adventure-teal">
                      最高: {highScore}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap">
                    {earnedBadges.map((badge: GameBadgeDefinition) => (
                      <span
                        key={badge.id}
                        title={badge.name}
                        className="text-lg"
                      >
                        {badge.emoji}
                      </span>
                    ))}
                    {nextBadge && (
                      <span
                        title={`${nextBadge.name} (${nextBadge.threshold}分)`}
                        className="text-lg opacity-40 grayscale"
                      >
                        {nextBadge.emoji}
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4"
        >
          {gameList.map(({ key, config, highScore, earnedBadges }, idx) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(`/adventure-break/${key}`)}
              className="card-adventure cursor-pointer overflow-hidden"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 ${
                    key === "reaction"
                      ? "bg-gradient-to-br from-yellow-100 to-orange-100"
                      : "bg-gradient-to-br from-teal-100 to-blue-100"
                  }`}
                >
                  {key === "reaction" ? (
                    <Zap className="w-8 h-8 text-adventure-orange" />
                  ) : (
                    <Puzzle className="w-8 h-8 text-adventure-teal" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-display text-xl text-adventure-blue">
                      {config.name}
                    </h3>
                    <span className="text-2xl">{config.emoji}</span>
                  </div>
                  <p className="font-body text-sm text-adventure-blue/60 mb-3 line-clamp-2">
                    {config.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-adventure-teal" />
                        <span className="font-body text-sm text-adventure-teal font-medium">
                          最高分: {highScore}
                        </span>
                      </div>
                      {earnedBadges.length > 0 && (
                        <div className="flex gap-1">
                          {earnedBadges.map((b) => (
                            <span key={b.id} className="text-base">
                              {b.emoji}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <span className="font-display text-sm text-adventure-orange">
                      开始游戏 →
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center"
        >
          <p className="font-body text-xs text-adventure-blue/40">
            💡 提示：达到指定分数可自动解锁对应徽章，在徽章墙查看哦！
          </p>
        </motion.div>
      </div>
    </div>
  )
}
