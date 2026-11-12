/**
 * QuizSection — Interactive multiple-choice quiz for a protocol.
 * Tracks score and shows per-question feedback. No persistence.
 */

import { useState } from 'react'
import { CheckCircle2, XCircle, RotateCcw, Trophy, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'motion/react'
import { GlassCard } from '../ui/GlassCard'
import { CyberButton } from '../ui/CyberButton'
import type { QuizSection as QuizSectionType, QuizQuestion } from '../../data/quizzes'

interface QuizSectionProps {
  quiz: QuizSectionType
  onFinish?: (score: number, total: number) => void
}

type AnswerState = 'unanswered' | 'correct' | 'incorrect'

interface QuestionState {
  selected: number | null
  state: AnswerState
}

export const QuizSection: React.FC<QuizSectionProps> = ({ quiz, onFinish }) => {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState<QuestionState[]>(
    quiz.questions.map(() => ({ selected: null, state: 'unanswered' }))
  )
  const [showResult, setShowResult] = useState(false)

  const q: QuizQuestion = quiz.questions[current]
  const qState = answers[current]
  const isAnswered = qState.state !== 'unanswered'
  const totalAnswered = answers.filter((a) => a.state !== 'unanswered').length
  const score = answers.filter((a) => a.state === 'correct').length
  const isLast = current === quiz.questions.length - 1

  const handleSelect = (index: number) => {
    if (isAnswered) return
    const isCorrect = index === q.correctIndex
    setAnswers((prev) => {
      const updated = [...prev]
      updated[current] = { selected: index, state: isCorrect ? 'correct' : 'incorrect' }
      return updated
    })
  }

  const handleNext = () => {
    if (isLast) {
      setShowResult(true)
      onFinish?.(score + (qState.state === 'correct' ? 1 : 0), quiz.questions.length)
    } else {
      setCurrent((c) => c + 1)
    }
  }

  const handleReset = () => {
    setCurrent(0)
    setAnswers(quiz.questions.map(() => ({ selected: null, state: 'unanswered' })))
    setShowResult(false)
  }

  if (showResult) {
    const pct = Math.round((score / quiz.questions.length) * 100)
    const emoji = pct >= 80 ? '🏆' : pct >= 60 ? '⭐' : '📚'
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-4"
      >
        <GlassCard className="p-8 text-center space-y-5">
          <div className="text-5xl">{emoji}</div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">
              {score} / {quiz.questions.length} Correct
            </h3>
            <p className="text-sm text-cyber-muted">
              {pct >= 80
                ? 'Excellent work! You have a solid grasp of this protocol.'
                : pct >= 60
                ? 'Good effort! Review the explanations for missed questions.'
                : 'Keep studying — network protocols take practice to master!'}
            </p>
          </div>

          {/* Score bar */}
          <div className="max-w-sm mx-auto">
            <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${pct >= 80 ? 'bg-cyber-neon' : pct >= 60 ? 'bg-cyber-blue' : 'bg-amber-400'}`}
              />
            </div>
            <div className="flex justify-between text-[11px] text-cyber-muted mt-1">
              <span>0%</span>
              <span className="font-mono font-bold text-white">{pct}%</span>
              <span>100%</span>
            </div>
          </div>

          {/* Per-question review */}
          <div className="text-left space-y-2 max-w-lg mx-auto">
            {quiz.questions.map((question, i) => {
              const ans = answers[i]
              return (
                <div
                  key={i}
                  className={`flex items-start gap-2 p-2.5 rounded-lg text-xs ${
                    ans.state === 'correct'
                      ? 'bg-emerald-500/10 border border-emerald-400/30'
                      : 'bg-red-500/10 border border-red-400/30'
                  }`}
                >
                  {ans.state === 'correct' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p className="text-cyber-text">{question.question}</p>
                    {ans.state === 'incorrect' && (
                      <p className="text-cyber-muted mt-0.5">
                        Correct: <strong className="text-emerald-400">{question.options[question.correctIndex]}</strong>
                      </p>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          <CyberButton variant="neon" onClick={handleReset} icon={<RotateCcw className="w-4 h-4" />}>
            Try Again
          </CyberButton>
        </GlassCard>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            animate={{ width: `${(totalAnswered / quiz.questions.length) * 100}%` }}
            className="h-full rounded-full bg-cyber-neon"
          />
        </div>
        <span className="text-xs font-mono text-cyber-muted">
          {current + 1} / {quiz.questions.length}
        </span>
        <Trophy className="w-4 h-4 text-cyber-neon" />
        <span className="text-xs font-mono text-cyber-neon">{score} pts</span>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, x: 15 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -15 }}
          transition={{ duration: 0.2 }}
        >
          <GlassCard className="p-5 space-y-5">
            <div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded mb-2 inline-block ${
                q.difficulty === 'beginner'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-400/30'
              }`}>
                {q.difficulty}
              </span>
              <h3 className="text-sm font-semibold text-white leading-relaxed">{q.question}</h3>
            </div>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((option, i) => {
                const isSelected = qState.selected === i
                const isCorrect = i === q.correctIndex
                let optStyle = 'border-white/15 bg-white/5 text-cyber-muted hover:border-white/30 hover:bg-white/10 hover:text-cyber-text cursor-pointer'

                if (isAnswered) {
                  if (isCorrect) {
                    optStyle = 'border-emerald-400/60 bg-emerald-500/15 text-emerald-300 cursor-default'
                  } else if (isSelected) {
                    optStyle = 'border-red-400/60 bg-red-500/15 text-red-300 cursor-default'
                  } else {
                    optStyle = 'border-white/10 bg-white/5 text-cyber-muted opacity-50 cursor-default'
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleSelect(i)}
                    disabled={isAnswered}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-all duration-150 ${optStyle}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className={`flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-bold mt-0.5 ${
                        isAnswered && isCorrect
                          ? 'border-emerald-400 bg-emerald-500/30 text-emerald-400'
                          : isAnswered && isSelected && !isCorrect
                          ? 'border-red-400 bg-red-500/30 text-red-400'
                          : 'border-white/20 bg-white/5 text-cyber-muted'
                      }`}>
                        {isAnswered && isCorrect ? '✓' : isAnswered && isSelected ? '✗' : String.fromCharCode(65 + i)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Explanation */}
            <AnimatePresence>
              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`p-3 rounded-lg border ${
                    qState.state === 'correct'
                      ? 'bg-emerald-500/10 border-emerald-400/30'
                      : 'bg-amber-500/10 border-amber-400/30'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {qState.state === 'correct' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div>
                      <span className={`text-xs font-semibold block mb-1 ${
                        qState.state === 'correct' ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {qState.state === 'correct' ? 'Correct!' : 'Not quite right.'}
                      </span>
                      <p className="text-xs text-cyber-muted leading-relaxed">{q.explanation}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {isAnswered && (
              <div className="flex justify-end">
                <CyberButton
                  variant="blue"
                  size="sm"
                  onClick={handleNext}
                  icon={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  {isLast ? 'See Results' : 'Next Question'}
                </CyberButton>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
