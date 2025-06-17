import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"

interface RiskIndicatorProps {
  score: number
  level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
  className?: string
}

export function RiskIndicator({ score, level, className }: RiskIndicatorProps) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "text-green-400"
      case "MEDIUM":
        return "text-yellow-400"
      case "HIGH":
        return "text-orange-400"
      case "CRITICAL":
        return "text-red-400"
      default:
        return "text-slate-400"
    }
  }

  const getProgressColor = (level: string) => {
    switch (level) {
      case "LOW":
        return "bg-green-400"
      case "MEDIUM":
        return "bg-yellow-400"
      case "HIGH":
        return "bg-orange-400"
      case "CRITICAL":
        return "bg-red-400"
      default:
        return "bg-slate-400"
    }
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-300">Overall Risk Score</span>
        <span className={cn("text-sm font-semibold", getRiskColor(level))}>{level}</span>
      </div>

      <div className="relative">
        <Progress value={score} className="h-3" />
        <div
          className={cn("absolute top-0 left-0 h-3 rounded-full transition-all", getProgressColor(level))}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-400">
        <span>0</span>
        <span className="font-mono">{score}/100</span>
        <span>100</span>
      </div>
    </div>
  )
}
