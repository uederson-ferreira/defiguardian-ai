"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { MessageCircle, X, Send, Bot, Sparkles } from "lucide-react"

export function AIChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hello! I'm Eliza, your DeFi risk analysis assistant powered by ElizaOS. How can I help you analyze your portfolio risk today?",
      sender: "ai",
      timestamp: new Date(),
    },
  ])

  const handleSendMessage = () => {
    if (!message.trim()) return

    const newMessage = {
      id: messages.length + 1,
      text: message,
      sender: "user" as const,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage("")

    // Simulate AI response
    setTimeout(() => {
      const aiResponse = {
        id: messages.length + 2,
        text: "🤖 Based on your current portfolio analysis via ElizaOS, I notice your risk score is 65/100 (HIGH). Your Uniswap V3 position has increased smart contract risk due to recent protocol updates. Would you like me to suggest some risk mitigation strategies?",
        sender: "ai" as const,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, aiResponse])
    }, 1000)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-20 right-6 z-50 flex flex-col items-center">
        <div className="mb-2 px-3 py-1 bg-slate-900/90 backdrop-blur-sm rounded-full border border-purple-500/30">
          <span className="text-xs text-purple-300 font-medium flex items-center gap-1">
            <Bot className="h-3 w-3" />
            ElizaOS
          </span>
        </div>
        <Button
          onClick={() => setIsOpen(true)}
          className="h-14 w-14 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 shadow-lg relative"
          size="icon"
        >
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-yellow-300" />
          </div>
        </Button>
      </div>
    )
  }

  return (
    <Card className="fixed bottom-20 right-6 z-50 w-80 h-96 bg-slate-900/95 border-slate-700 backdrop-blur-md">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/eliza-avatar.svg" alt="Eliza" />
            <AvatarFallback className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs">
              <Bot className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <CardTitle className="text-sm font-medium text-white">Eliza AI</CardTitle>
            <Badge variant="outline" className="text-xs border-purple-500/50 text-purple-300 w-fit">
              ElizaOS
            </Badge>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(false)}
          className="h-6 w-6 text-slate-400 hover:text-white"
        >
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex flex-col h-full p-4">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
              {msg.sender === "ai" && (
                <Avatar className="h-6 w-6 mr-2 mt-1">
                  <AvatarImage src="/eliza-avatar.svg" alt="Eliza" />
                  <AvatarFallback className="bg-gradient-to-r from-purple-600 to-cyan-600 text-white text-xs">
                    <Bot className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg text-sm ${
                  msg.sender === "user" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-200 border border-purple-500/20"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Ask Eliza about your portfolio risk..."
            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-400"
            onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <Button onClick={handleSendMessage} size="icon" className="bg-purple-600 hover:bg-purple-700">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
