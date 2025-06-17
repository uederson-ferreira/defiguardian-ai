import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Activity, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react"

const activities = [
  {
    id: 1,
    type: "deposit",
    protocol: "Uniswap V3",
    amount: "$5,230",
    status: "completed",
    time: "2 hours ago",
    icon: TrendingUp,
    color: "text-green-400",
  },
  {
    id: 2,
    type: "alert",
    protocol: "Aave",
    amount: "Risk Threshold",
    status: "warning",
    time: "4 hours ago",
    icon: AlertTriangle,
    color: "text-orange-400",
  },
  {
    id: 3,
    type: "withdrawal",
    protocol: "Compound",
    amount: "$2,100",
    status: "completed",
    time: "1 day ago",
    icon: TrendingDown,
    color: "text-red-400",
  },
  {
    id: 4,
    type: "analysis",
    protocol: "Portfolio",
    amount: "Risk Score Updated",
    status: "completed",
    time: "2 days ago",
    icon: Activity,
    color: "text-blue-400",
  },
]

export function RecentActivity() {
  return (
    <Card className="bg-slate-800/50 border-slate-700/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/30">
              <div className="flex items-center gap-3">
                <activity.icon className={`h-5 w-5 ${activity.color}`} />
                <div>
                  <p className="text-sm font-medium text-white">{activity.protocol}</p>
                  <p className="text-xs text-slate-400">{activity.amount}</p>
                </div>
              </div>
              <div className="text-right">
                <Badge variant={activity.status === "warning" ? "destructive" : "secondary"} className="mb-1">
                  {activity.status}
                </Badge>
                <p className="text-xs text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
