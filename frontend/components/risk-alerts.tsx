"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Bell, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useAccount } from "wagmi";
import { useContracts } from "@/hooks/useContracts";
import { toast } from "sonner";

const ALERT_TYPES = {
  0: {
    label: "Risco de Portfólio",
    description: "Alerta quando o risco do portfólio exceder o limite",
  },
  1: {
    label: "Risco de Protocolo",
    description: "Alerta quando um protocolo específico apresentar alto risco",
  },
  2: {
    label: "Risco de Mercado",
    description: "Alerta quando o risco geral do mercado aumentar",
  },
  3: {
    label: "Liquidação",
    description: "Alerta quando posições estiverem próximas da liquidação",
  },
  4: {
    label: "Volatilidade",
    description: "Alerta quando a volatilidade exceder o limite",
  },
};

export function RiskAlerts() {
  const { address, isConnected } = useAccount();
  const { createAlert, isLoading, raw } = useContracts();

  // Usar dados reais do contrato ou mock para demonstração
  const activeAlerts = raw?.activeAlerts || [];

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: "",
    threshold: "",
  });
  const [creating, setCreating] = useState(false);

  const handleCreateAlert = async () => {
    if (!newAlert.type || !newAlert.threshold) {
      toast.error("Fill in all fields");
      return;
    }

    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    try {
      setCreating(true);

      const alertType = parseInt(newAlert.type);
      const threshold = parseFloat(newAlert.threshold);

      console.log("🔄 Criando alerta...", {
        type: alertType,
        threshold,
        address,
      });

      await createAlert(alertType, threshold);

      toast.success("Alerta criado com sucesso!");

      // Reset form
      setNewAlert({ type: "", threshold: "" });
      setIsCreateDialogOpen(false);
    } catch (err: unknown) {
      console.error("❌ Error creating alert:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error creating alert";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const getAlertTypeInfo = (type: number) => {
    return (
      ALERT_TYPES[type as keyof typeof ALERT_TYPES] || {
        label: "Tipo Desconhecido",
        description: "Tipo de alerta não reconhecido",
      }
    );
  };

  if (!isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Bell className="h-5 w-5 text-yellow-400" />
            Alertas de Risco
          </CardTitle>
          <CardDescription className="text-slate-400">
            Conecte sua carteira no topo da página para configurar alertas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-yellow-500/50 bg-yellow-500/10">
            <Bell className="h-4 w-4 text-yellow-400" />
            <AlertDescription className="text-yellow-400">
              ⚠️ Carteira não conectada. Use o botão de conexão no header da
              página.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando alertas...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de Risco
            </CardTitle>
            <CardDescription>
              Gerencie seus alertas de risco personalizados
            </CardDescription>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Alert</DialogTitle>
                <DialogDescription>
                  Configure a custom alert to monitor specific risks
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Tipo de Alerta</Label>
                  <Select
                    value={newAlert.type}
                    onValueChange={(value) =>
                      setNewAlert((prev) => ({ ...prev, type: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALERT_TYPES).map(([value, info]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium">{info.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {info.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Limite (%)</Label>
                  <Input
                    id="threshold"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    placeholder="Ex: 75"
                    value={newAlert.threshold}
                    onChange={(e) =>
                      setNewAlert((prev) => ({
                        ...prev,
                        threshold: e.target.value,
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    O alerta será ativado quando o risco exceder este limite
                  </p>
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert} disabled={creating}>
                  {creating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Criar Alerta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {activeAlerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Nenhum alerta configurado
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Criar Primeiro Alerta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {activeAlerts.map((alertId, index) => {
              const mockAlert = {
                id: alertId,
                type: index % 5,
                threshold: 50 + index * 10,
                isActive: true,
                createdAt: new Date(
                  Date.now() - index * 24 * 60 * 60 * 1000
                ).toISOString(),
              };
              const typeInfo = getAlertTypeInfo(mockAlert.type);
              return (
                <div
                  key={String(mockAlert.id)}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={mockAlert.isActive ? "default" : "secondary"}
                      >
                        {mockAlert.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="font-medium">{typeInfo.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {mockAlert.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {typeInfo.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span>Limite: {mockAlert.threshold}%</span>
                    {mockAlert.createdAt && (
                      <span className="text-muted-foreground">
                        {new Date(mockAlert.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RiskAlerts;
