import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Play, RotateCcw, Trophy, TrendingUp, Award, Eye, Clock } from "lucide-react";
import { useGameStore } from "@/store/useGameStore";
import { GAME_CONFIG, GAME_BADGES, GameScoreRecord, GameBadgeDefinition } from "@/types";
type GameStatus = "idle" | "preview" | "playing" | "ended";
interface WordCard {
 id: number;
 pairId: number;
 word: string;
 category: "left" | "right";
 isFlipped: boolean;
 isMatched: boolean;
}
interface WordPair {
 left: string;
 right: string;
}
const wordPairs: WordPair[] = [
 { left: "太阳", right: "☀️" },
 { left: "月亮", right: "🌙" },
 { left: "星星", right: "⭐" },
 { left: "花朵", right: "🌸" },
 { left: "树木", right: "🌳" },
 { left: "大海", right: "🌊" },
 { left: "火焰", right: "🔥" },
 { left: "彩虹", right: "🌈" },
 { left: "小猫", right: "🐱" },
 { left: "小狗", right: "🐶" },
 { left: "小鸟", right: "🐦" },
 { left: "鱼儿", right: "🐟" },
 { left: "兔子", right: "🐰" },
 { left: "蝴蝶", right: "🦋" },
 { left: "蜜蜂", right: "🐝" },
 { left: "爱心", right: "❤️" },
 { left: "礼物", right: "🎁" },
 { left: "音乐", right: "🎵" },
 { left: "书本", right: "📚" },
 { left: "篮球", right: "🏀" },
 { left: "足球", right: "⚽" },
 { left: "苹果", right: "🍎" },
 { left: "香蕉", right: "🍌" },
 { left: "西瓜", right: "🍉" },
];
const PREVIEW_DURATION = 5;
const GAME_DURATION = GAME_CONFIG.wordMatch.duration;
const PAIRS_PER_ROUND = 6;
function shuffleArray<T>(arr: T[]): T[] {
 const shuffled = [...arr];
 for (let i = shuffled.length - 1; i > 0; i--) {
 const j = Math.floor(Math.random() * (i + 1));
 [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
 }
 return shuffled;
}
function createCards(): WordCard[] {
 const selectedPairs = shuffleArray(wordPairs).slice(0, PAIRS_PER_ROUND);
 const leftCards: WordCard[] = selectedPairs.map((pair, idx) => ({
 id: idx * 2,
 pairId: idx,
 word: pair.left,
 category: "left",
 isFlipped: true,
 isMatched: false,
 }));
 const rightCards: WordCard[] = selectedPairs.map((pair, idx) => ({
 id: idx * 2 + 1,
 pairId: idx,
 word: pair.right,
 category: "right",
 isFlipped: true,
 isMatched: false,
 }));
 return [...shuffleArray(leftCards), ...shuffleArray(rightCards)];
}
export default function WordMatchGame() {
 const navigate = useNavigate();
 const userProfile = useGameStore((s) => s.userProfile);
 const recordGameScore = useGameStore((s) => s.recordGameScore);
 const getHighScore = useGameStore((s) => s.getHighScore);
 const getGameScoreHistory = useGameStore((s) => s.getGameScoreHistory);
 const [status, setStatus] = useState<GameStatus>("idle");
 const [score, setScore] = useState(0);
 const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
 const [previewLeft, setPreviewLeft] = useState(PREVIEW_DURATION);
 const [cards, setCards] = useState<WordCard[]>(createCards);
 const [selectedIds, setSelectedIds] = useState<number[]>([]);
 const [matchedPairs, setMatchedPairs] = useState(0);
 const [isChecking, setIsChecking] = useState(false);
 const [newlyEarnedBadges, setNewlyEarnedBadges] = useState<string[]>([]);
 const [showScoreRecorded, setShowScoreRecorded] = useState(false);
 const [round, setRound] = useState(1);
 const highScore = useMemo(() => getHighScore("wordMatch"), [getHighScore]);
 const scoreHistory = useMemo(() => getGameScoreHistory("wordMatch"), [getGameScoreHistory]);
 const earnedBadgesForGame = useMemo(() => GAME_BADGES.filter((b) => b.gameType === "wordMatch" &&
 userProfile?.earnedBadges.includes(b.id)), [userProfile]);
 const totalPairs = cards.filter((c) => c.category === "left").length;
 const clearTimers = useCallback(() => {
 // no persistent intervals here;
 }, []);
 useEffect(() => {
 return () => clearTimers();
 }, [clearTimers]);
 useEffect(() => {
 if (status !== "preview")
 return;
 if (previewLeft <= 0) {
 setCards((prev) => prev.map((c) => ({ ...c, isFlipped: false })));
 setStatus("playing");
 startGameTimer();
 return;
 }
 const timer = setTimeout(() => {
 setPreviewLeft((prev) => prev - 1);
 }, 1000);
 return () => clearTimeout(timer);
 }, [status, previewLeft]);
 const startGameTimer = useCallback(() => {
 setTimeLeft(GAME_DURATION);
 }, []);
 useEffect(() => {
 if (status !== "playing")
 return;
 if (timeLeft <= 0) {
 endGame();
 return;
 }
 const timer = setTimeout(() => {
 setTimeLeft((prev) => prev - 1);
 }, 1000);
 return () => clearTimeout(timer);
 }, [status, timeLeft]);
 const endGame = useCallback(() => {
 setStatus("ended");
 }, []);
 useEffect(() => {
 if (status === "playing" && matchedPairs === totalPairs && matchedPairs > 0) {
 const roundBonus = round * 50;
 setScore((prev) => prev + roundBonus);
 if (round < 4) {
 setTimeout(() => {
 nextRound();
 }, 800);
 }
 else {
 setTimeout(() => {
 endGame();
 }, 800);
 }
 }
 }, [matchedPairs, totalPairs, status, round]);
 const nextRound = useCallback(() => {
 setCards(createCards());
 setSelectedIds([]);
 setMatchedPairs(0);
 setIsChecking(false);
 setRound((prev) => prev + 1);
 setPreviewLeft(PREVIEW_DURATION);
 setStatus("preview");
 }, []);
 useEffect(() => {
 if (status === "ended" && !showScoreRecorded) {
 const earned = recordGameScore("wordMatch", Math.max(score, 0));
 setNewlyEarnedBadges(earned);
 setShowScoreRecorded(true);
 }
 }, [status, score, recordGameScore, showScoreRecorded]);
 const startGame = useCallback(() => {
 setScore(0);
 setCards(createCards());
 setSelectedIds([]);
 setMatchedPairs(0);
 setIsChecking(false);
 setNewlyEarnedBadges([]);
 setShowScoreRecorded(false);
 setRound(1);
 setPreviewLeft(PREVIEW_DURATION);
 setStatus("preview");
 }, []);
 const handleCardClick = (cardId: number) => {
 if (status !== "playing")
 return;
 if (isChecking)
 return;
 const card = cards.find((c) => c.id === cardId);
 if (!card || card.isFlipped || card.isMatched)
 return;
 if (selectedIds.includes(cardId))
 return;
 const newSelected = [...selectedIds, cardId];
 setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, isFlipped: true } : c)));
 setSelectedIds(newSelected);
 if (newSelected.length === 2) {
 setIsChecking(true);
 const [firstId, secondId] = newSelected;
 const firstCard = cards.find((c) => c.id === firstId)!;
 const secondCard = cards.find((c) => c.id === secondId)!;
 if (firstCard.pairId === secondCard.pairId &&
 firstCard.category !== secondCard.category) {
 const basePoints = 100;
 const timeBonus = Math.floor(timeLeft / 2);
 const totalPoints = basePoints + timeBonus;
 setTimeout(() => {
 setCards((prev) => prev.map((c) => c.id === firstId || c.id === secondId
 ? { ...c, isMatched: true }
 : c));
 setScore((prev) => prev + totalPoints);
 setMatchedPairs((prev) => prev + 1);
 setSelectedIds([]);
 setIsChecking(false);
 }, 500);
 }
 else {
 setTimeout(() => {
 setCards((prev) => prev.map((c) => c.id === firstId || c.id === secondId
 ? { ...c, isFlipped: false }
 : c));
 setSelectedIds([]);
 setIsChecking(false);
 }, 1000);
 }
 }
 };
 const formatDate = (isoStr: string) => {
 const d = new Date(isoStr);
 return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
 };
 if (!userProfile)
 return null;
 return (<div className="min-h-screen bg-adventure-cream pb-8">
 <div className="max-w-lg mx-auto px-4 pt-6">
 <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 mb-4">
 <button onClick={() => navigate("/adventure-break")} className="w-10 h-10 rounded-full bg-white shadow-card flex items-center justify-center cursor-pointer hover:shadow-card-hover transition-shadow">
 <ArrowLeft className="w-5 h-5 text-adventure-blue"/>
 </button>
 <div>
 <h1 className="section-title text-2xl">🧩 词语配对</h1>
 <p className="font-body text-sm text-adventure-blue/60">
 找出相关的词语对，越快得分越高！
 </p>
 </div>
 </motion.div>

 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card-adventure mb-4 !p-4">
 <div className="grid grid-cols-4 gap-2">
 <div className="flex flex-col items-center">
 <span className="font-body text-xs text-adventure-blue/60 mb-1">
 得分
 </span>
 <span className="font-display text-xl text-adventure-orange">
 {Math.max(score, 0)}
 </span>
 </div>
 <div className="flex flex-col items-center">
 <span className="font-body text-xs text-adventure-blue/60 mb-1">
 回合
 </span>
 <span className="font-display text-xl text-adventure-pink">
 {round}/4
 </span>
 </div>
 <div className="flex flex-col items-center">
 <span className="font-body text-xs text-adventure-blue/60 mb-1">
 {status === "preview" ? "记忆" : status === "playing" ? "时间" : "完成"}
 </span>
 <span className={`font-display text-xl ${timeLeft <= 10 && status === "playing"
 ? "text-red-500 animate-pulse"
 : "text-adventure-blue"}`}>
 {status === "preview" ? `${previewLeft}s` : status === "playing" ? `${timeLeft}s` : "✓"}
 </span>
 </div>
 <div className="flex flex-col items-center">
 <span className="font-body text-xs text-adventure-blue/60 mb-1">
 最高分
 </span>
 <span className="font-display text-xl text-adventure-teal">
 {highScore}
 </span>
 </div>
 </div>
 {status === "playing" && (<div className="mt-3 pt-3 border-t border-adventure-orange/10">
 <div className="flex items-center justify-between mb-1">
 <span className="font-body text-xs text-adventure-blue/60">
 配对进度
 </span>
 <span className="font-display text-sm text-adventure-orange">
 {matchedPairs}/{totalPairs}
 </span>
 </div>
 <div className="w-full h-2 bg-amber-100 rounded-full overflow-hidden">
 <motion.div className="h-full bg-gradient-to-r from-adventure-teal to-adventure-teal/70 rounded-full" initial={{ width: 0 }} animate={{ width: `${(matchedPairs / totalPairs) * 100}%` }} transition={{ duration: 0.3, ease: "easeOut" }} />
 </div>
 </div>)}
 </motion.div>

 <AnimatePresence mode="wait">
 {status === "idle" && (<motion.div key="idle" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card-adventure text-center">
 <div className="text-6xl mb-4">🧩📚</div>
 <h2 className="font-display text-2xl text-adventure-blue mb-2">
 准备好了吗？
 </h2>
 <div className="text-left mb-6 space-y-3">
 <div className="flex items-start gap-2 font-body text-sm text-adventure-blue/70">
 <Eye className="w-5 h-5 shrink-0 mt-0.5 text-adventure-teal"/>
 <div>
 <p className="font-medium">记忆阶段（{PREVIEW_DURATION}秒）</p>
 <p className="text-adventure-blue/50">
 记住每个词语对的位置
 </p>
 </div>
 </div>
 <div className="flex items-start gap-2 font-body text-sm text-adventure-blue/70">
 <Clock className="w-5 h-5 shrink-0 mt-0.5 text-adventure-orange"/>
 <div>
 <p className="font-medium">游戏阶段（{GAME_DURATION}秒）</p>
 <p className="text-adventure-blue/50">
 点击两个相关词语配对得分
 </p>
 </div>
 </div>
 <div className="flex items-start gap-2 font-body text-sm text-adventure-blue/70">
 <Trophy className="w-5 h-5 shrink-0 mt-0.5 text-adventure-gold"/>
 <div>
 <p className="font-medium">共 4 回合，每回合 {PAIRS_PER_ROUND} 对词语</p>
 <p className="text-adventure-blue/50">
 每回合完成奖励 50×回合数 额外分数
 </p>
 </div>
 </div>
 </div>
 <button onClick={startGame} className="btn-adventure w-full">
 <Play className="w-5 h-5"/>
 开始游戏
 </button>
 </motion.div>)}

 {(status === "preview" || status === "playing") && (<motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
 {status === "preview" && (<motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-3">
 <span className="inline-block bg-gradient-to-r from-adventure-teal to-adventure-blue text-white font-display text-sm px-4 py-1.5 rounded-full">
 👀 记住位置！{previewLeft}s 后开始
 </span>
 </motion.div>)}

 <div className="grid grid-cols-4 gap-2">
 {cards.map((card) => (<motion.div key={card.id} className="aspect-square cursor-pointer" onClick={() => handleCardClick(card.id)} whileTap={{ scale: 0.95 }}>
 <div className="relative w-full h-full" style={{ perspective: 600 }}>
 <motion.div className="absolute inset-0" animate={{
 rotateY: card.isFlipped || card.isMatched ? 180 : 0,
 }} transition={{ duration: 0.35 }} style={{ transformStyle: "preserve-3d" }}>
 <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-adventure-blue to-adventure-blue-light flex items-center justify-center shadow-card" style={{ backfaceVisibility: "hidden" }}>
 <span className="text-2xl">❓</span>
 </div>
 <div className={`absolute inset-0 rounded-xl flex items-center justify-center border-2 ${card
 .isMatched
 ? "bg-adventure-teal/20 border-adventure-teal"
 : "bg-white border-adventure-pink"}`} style={{
 backfaceVisibility: "hidden",
 transform: "rotateY(180deg)",
 }}>
 <span className={`text-lg font-display text-center px-1 ${card.category === "left"
 ? "text-adventure-blue"
 : "text-adventure-orange"}`}>
 {card.word}
 </span>
 {card.isMatched && (<span className="absolute top-0.5 right-1 text-adventure-teal text-xs">
 ✓
 </span>)}
 </div>
 </motion.div>
 </div>
 </motion.div>))}
 </div>
 </motion.div>)}

 {status === "ended" && (<motion.div key="ended" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="card-adventure text-center bg-gradient-to-b from-adventure-gold/10 to-adventure-orange/5 border-2 border-adventure-gold/40">
 <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
 <span className="text-6xl block mb-3">🎉</span>
 <h3 className="font-display text-3xl text-adventure-blue mb-1">
 游戏结束！
 </h3>
 {score > highScore ? (<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{
 type: "spring",
 stiffness: 300,
 delay: 0.4,
 }} className="inline-block bg-gradient-to-r from-adventure-gold to-adventure-orange text-white font-display text-sm px-4 py-1 rounded-full mb-4">
 🏆 新纪录！
 </motion.div>) : (<p className="font-body text-sm text-adventure-blue/60 mb-4">
 最高分: {highScore}
 </p>)}
 </motion.div>

 <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-white/70 rounded-xl p-4 mb-4">
 <div className="flex items-center justify-center gap-2 mb-2">
 <Trophy className="w-6 h-6 text-adventure-gold"/>
 <span className="font-display text-5xl text-adventure-orange">
 {Math.max(score, 0)}
 </span>
 <span className="font-display text-lg text-adventure-blue/60">
 分
 </span>
 </div>
 <p className="font-body text-xs text-adventure-blue/50 mt-2">
 完成了 {round - 1} 回合
 </p>
 </motion.div>

 <AnimatePresence>
 {newlyEarnedBadges.length > 0 && (<motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="mb-4">
 <div className="flex items-center justify-center gap-2 mb-2">
 <Award className="w-5 h-5 text-adventure-gold"/>
 <span className="font-display text-adventure-blue">
 解锁新徽章！
 </span>
 </div>
 <div className="flex justify-center gap-3">
 {newlyEarnedBadges.map((badgeId) => {
 const badge = GAME_BADGES.find((b) => b.id === badgeId);
 return badge ? (<motion.div key={badge.id} initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{
 type: "spring",
 stiffness: 250,
 delay: 0.6,
 }} className="w-16 h-16 rounded-full bg-gradient-to-br from-adventure-gold to-adventure-orange flex items-center justify-center shadow-lg" title={badge.name}>
 <span className="text-3xl">{badge.emoji}</span>
 </motion.div>) : null;
 })}
 </div>
 </motion.div>)}
 </AnimatePresence>

 <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="flex gap-3 mb-4">
 <button onClick={startGame} className="btn-adventure flex-1">
 <RotateCcw className="w-4 h-4"/>
 再来一次
 </button>
 <button onClick={() => navigate("/adventure-break")} className="btn-ghost flex-1">
 返回
 </button>
 </motion.div>

 {scoreHistory.length > 0 && (<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1 }}>
 <div className="flex items-center justify-center gap-2 mb-2">
 <TrendingUp className="w-4 h-4 text-adventure-teal"/>
 <span className="font-body text-sm text-adventure-blue/60">
 历史记录（最近10局）
 </span>
 </div>
 <div className="bg-white/50 rounded-xl p-3 max-h-32 overflow-y-auto">
 <div className="space-y-1">
 {scoreHistory.map((record: GameScoreRecord, idx: number) => (<div key={record.id} className={`flex justify-between items-center px-2 py-1 rounded-lg text-sm ${idx === 0 && record.score === highScore
 ? "bg-adventure-gold/20"
 : ""}`}>
 <span className="font-body text-adventure-blue/70">
 {formatDate(record.playedAt)}
 </span>
 <div className="flex items-center gap-2">
 {idx === 0 && record.score === highScore && (<span className="text-xs">👑</span>)}
 <span className="font-display text-adventure-orange">
 {record.score}
 </span>
 </div>
 </div>))}
 </div>
 </div>
 </motion.div>)}
 </motion.div>)}
 </AnimatePresence>

 {earnedBadgesForGame.length > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="card-adventure mt-6 !p-4">
 <div className="flex items-center gap-2 mb-3">
 <Award className="w-5 h-5 text-adventure-gold"/>
 <span className="font-display text-adventure-blue">
 已获徽章
 </span>
 </div>
 <div className="flex gap-3 flex-wrap">
 {earnedBadgesForGame.map((badge: GameBadgeDefinition) => (<div key={badge.id} className="flex flex-col items-center" title={`${badge.name} - ${badge.description}`}>
 <div className="w-14 h-14 rounded-full bg-gradient-to-br from-adventure-gold to-adventure-orange flex items-center justify-center shadow-md">
 <span className="text-2xl">{badge.emoji}</span>
 </div>
 <span className="font-body text-xs text-adventure-blue/60 mt-1">
 {badge.name}
 </span>
 </div>))}
 </div>
 </motion.div>)}
 </div>
 </div>);
}

