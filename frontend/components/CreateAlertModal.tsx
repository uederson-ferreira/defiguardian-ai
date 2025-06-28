/**
 * MÓDULO: Modal para Criar Alertas
 * LOCALIZAÇÃO: components/CreateAlertModal.tsx
 * DESCRIÇÃO: Modal para configurar alertas de risco inteligentes
 */

"use client";

// Global type declaration
declare global {
  interface Window {
    refreshPortfolioData?: () => void;
  }
}

import { useState } from "react";
import { useContracts } from "@/hooks/useContracts";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Bell,
  Loader2,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Shield,
} from "lucide-react";

// Tipos de alerta
const ALERT_TYPES = [
  {
    id: "risk_threshold",
    name: "Risk Threshold",
    description: "Alert when risk score exceeds the limit",
    icon: AlertTriangle,
    color: "text-red-400",
  },
  {
    id: "portfolio_value",
    name: "Portfolio Value",
    description: "Alert for changes in total value",
    icon: TrendingUp,
    color: "text-green-400",
  },
  {
    id: "protocol_risk",
    name: "Protocol Risk",
    description: "Alert for changes in specific protocols",
    icon: Shield,
    color: "text-blue-400",
  },
];

// Canais de notificação
const NOTIFICATION_CHANNELS = [
  { id: "browser", name: "Browser Notification", enabled: true },
  { id: "email", name: "Email", enabled: false },
  { id: "webhook", name: "Webhook/Discord", enabled: false },
];

interface CreateAlertModalProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode; // 🔧 FIX: Adicionado children
}

export function CreateAlertModal({ trigger, children }: CreateAlertModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [alertType, setAlertType] = useState<string>("");
  const [threshold, setThreshold] = useState<number[]>([75]);
  const [customThreshold, setCustomThreshold] = useState<string>("");
  const [useCustomThreshold, setUseCustomThreshold] = useState(false);

  const { createAlert, isConnected } = useContracts();

  const handleSubmit = async () => {
    if (!alertType) {
      return;
    }

    try {
      setIsLoading(true);

      const finalThreshold = useCustomThreshold
        ? parseInt(customThreshold)
        : threshold[0];

      const getAlertTypeId = (type: string) => {
        switch (type) {
          case "risk_threshold":
            return 0;
          case "portfolio_value":
            return 1;
          case "protocol_risk":
            return 2;
          default:
            return 0;
        }
      };

      const alertTypeId = getAlertTypeId(alertType);
      await createAlert(alertTypeId, finalThreshold);

      // Trigger global refresh if available
      if (typeof window !== "undefined" && window.refreshPortfolioData) {
        setTimeout(() => {
          window.refreshPortfolioData?.();
        }, 1000);
      }

      // Reset form
      setAlertType("");
      setThreshold([75]);
      setCustomThreshold("");
      setUseCustomThreshold(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Error creating alert:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedAlertType = ALERT_TYPES.find((a) => a.id === alertType);
  const finalThreshold = useCustomThreshold
    ? parseInt(customThreshold) || 0
    : threshold[0];

  const getRiskLevel = (score: number) => {
    if (score <= 30)
      return {
        level: "Low",
        color: "text-green-400",
        bgColor: "bg-green-500/20",
      };
    if (score <= 60)
      return {
        level: "Moderate",
        color: "text-yellow-400",
        bgColor: "bg-yellow-500/20",
      };
    if (score <= 80)
      return {
        level: "High",
        color: "text-orange-400",
        bgColor: "bg-orange-500/20",
      };
    return {
      level: "Critical",
      color: "text-red-400",
      bgColor: "bg-red-500/20",
    };
  };

  const riskInfo = getRiskLevel(finalThreshold);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Bell className="mr-2 h-4 w-4" />
            Create Alert
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Configure Smart Alert
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Receive automatic notifications about important changes in your
            portfolio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isConnected && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Connect your wallet to create alerts
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tipo de Alerta */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Alert Type</Label>
            <div className="grid gap-3">
              {ALERT_TYPES.map((type) => {
                const Icon = type.icon;
                return (
                  <Card
                    key={type.id}
                    className={`cursor-pointer transition-all ${
                      alertType === type.id
                        ? "bg-purple-500/20 border-purple-500/50"
                        : "bg-slate-700/50 border-slate-600 hover:bg-slate-700/70"
                    }`}
                    onClick={() => setAlertType(type.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Icon className={`h-5 w-5 ${type.color} mt-0.5`} />
                        <div className="flex-1">
                          <h4 className="font-medium text-white">
                            {type.name}
                          </h4>
                          <p className="text-sm text-slate-400 mt-1">
                            {type.description}
                          </p>
                        </div>
                        {alertType === type.id && (
                          <CheckCircle className="h-5 w-5 text-purple-400" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Configuração do Threshold */}
          {alertType && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Trigger Threshold</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUseCustomThreshold(!useCustomThreshold)}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  {useCustomThreshold ? "Use Slider" : "Custom Value"}
                </Button>
              </div>

              {useCustomThreshold ? (
                <div className="space-y-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="75"
                    value={customThreshold}
                    onChange={(e) => setCustomThreshold(e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">
                    Enter a value between 0 and 100
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <Slider
                    value={threshold}
                    onValueChange={setThreshold}
                    max={100}
                    min={0}
                    step={5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>0% (No Risk)</span>
                    <span className="font-mono text-white">
                      {threshold[0]}%
                    </span>
                    <span>100% (Maximum Risk)</span>
                  </div>
                </div>
              )}

              {/* Risk Level Indicator */}
              <Card
                className={`${riskInfo.bgColor} border-${riskInfo.color.replace(
                  "text-",
                  ""
                )}/20`}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-300">
                      Risk Level:
                    </span>
                    <span className={`font-medium ${riskInfo.color}`}>
                      {riskInfo.level} ({finalThreshold}%)
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Preview do Alerta */}
          {selectedAlertType && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Bell className="h-4 w-4 text-yellow-400" />
                  Alert Preview
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="text-white">{selectedAlertType.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Threshold:</span>
                    <span className="text-white">{finalThreshold}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Sensitivity:</span>
                    <span className={riskInfo.color}>{riskInfo.level}</span>
                  </div>
                </div>

                <div className="border-t border-slate-600 pt-3 mt-3">
                  <p className="text-xs text-slate-400">
                    <strong>Example:</strong> You will receive an alert when your
                    risk score exceeds {finalThreshold}%, indicating {riskInfo.level.toLowerCase()}
                    risk level.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Canais de Notificação */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Notification Channels</Label>
            <div className="space-y-2">
              {NOTIFICATION_CHANNELS.map((channel) => (
                <div
                  key={channel.id}
                  className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
                >
                  <span className="text-sm text-white">{channel.name}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      channel.enabled
                        ? "bg-green-500/20 text-green-400"
                        : "bg-slate-600/20 text-slate-400"
                    }`}
                  >
                    {channel.enabled ? "Active" : "Coming Soon"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={!isConnected || !alertType || isLoading}
            className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Alert...
              </>
            ) : (
              <>
                <Bell className="mr-2 h-4 w-4" />
                Create Alert ({finalThreshold}%)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
