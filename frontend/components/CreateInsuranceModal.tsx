/**
 * MÓDULO: Modal para Criar Seguro
 * LOCALIZAÇÃO: components/CreateInsuranceModal.tsx
 * DESCRIÇÃO: Modal para criar apólices de seguro DeFi
 */

"use client";

import { useState } from "react";
import useWeb3Contracts from "@/hooks/useWeb3Contracts";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Shield,
  Loader2,
  DollarSign,
  CheckCircle,
} from "lucide-react";

// Protocolos disponíveis para seguro
const INSURANCE_PROTOCOLS = [
  {
    name: "Uniswap V3",
    address: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    description: "Seguro contra impermanent loss",
    riskLevel: "Baixo",
    premium: "2.5%",
  },
  {
    name: "Aave",
    address: "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2",
    description: "Seguro contra default de protocolo",
    riskLevel: "Médio",
    premium: "4.0%",
  },
  {
    name: "Compound",
    address: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
    description: "Seguro contra liquidação forçada",
    riskLevel: "Médio",
    premium: "3.5%",
  },
  {
    name: "Curve",
    address: "0xD51a44d3FaE010294C616388b506AcdA1bfAAE46",
    description: "Seguro contra depeg de stablecoin",
    riskLevel: "Alto",
    premium: "6.0%",
  },
];

// Períodos de cobertura
const COVERAGE_PERIODS = [
  { label: "30 dias", value: "30", multiplier: 1 },
  { label: "90 dias", value: "90", multiplier: 0.9 },
  { label: "180 dias", value: "180", multiplier: 0.8 },
  { label: "365 dias", value: "365", multiplier: 0.7 },
];

interface CreateInsuranceModalProps {
  trigger?: React.ReactNode;
  children?: React.ReactNode; // 🔧 FIX: Adicionado children
}

export function CreateInsuranceModal({
  trigger,
  children,
}: CreateInsuranceModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form states
  const [selectedProtocol, setSelectedProtocol] = useState<string>("");
  const [coverageAmount, setCoverageAmount] = useState<string>("");
  const [coveragePeriod, setCoveragePeriod] = useState<string>("");

  const { createInsurancePolicy, isConnected } = useWeb3Contracts();

  const handleSubmit = async () => {
    if (!selectedProtocol || !coverageAmount) {
      return;
    }

    try {
      setIsLoading(true);

      // Converter coverage para wei (assumindo 18 decimais)
      const coverageWei = (parseFloat(coverageAmount) * 1e18).toString();

      await createInsurancePolicy(selectedProtocol, coverageWei);

      // Reset form
      setSelectedProtocol("");
      setCoverageAmount("");
      setCoveragePeriod("");
      setIsOpen(false);
    } catch (error) {
      console.error("Erro ao criar seguro:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedProtocolData = INSURANCE_PROTOCOLS.find(
    (p) => p.address === selectedProtocol
  );
  const selectedPeriodData = COVERAGE_PERIODS.find(
    (p) => p.value === coveragePeriod
  );

  // Calcular premium
  const calculatePremium = () => {
    if (!selectedProtocolData || !coverageAmount || !selectedPeriodData)
      return 0;

    const baseAmount = parseFloat(coverageAmount);
    const basePremium =
      baseAmount *
      (parseFloat(selectedProtocolData.premium.replace("%", "")) / 100);
    const finalPremium = basePremium * selectedPeriodData.multiplier;

    return finalPremium;
  };

  const premium = calculatePremium();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || trigger || (
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Shield className="mr-2 h-4 w-4" />
            Criar Seguro
          </Button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg bg-slate-800 border-slate-700 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Criar Apólice de Seguro DeFi
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Proteja seus investimentos contra riscos de protocolos DeFi
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {!isConnected && (
            <Card className="bg-yellow-500/10 border-yellow-500/20">
              <CardContent className="p-4">
                <p className="text-yellow-400 text-sm">
                  ⚠️ Conecte sua carteira para criar seguros
                </p>
              </CardContent>
            </Card>
          )}

          {/* Protocolo */}
          <div className="space-y-2">
            <Label htmlFor="protocol" className="text-sm font-medium">
              Protocolo para Segurar
            </Label>
            <Select
              value={selectedProtocol}
              onValueChange={setSelectedProtocol}
            >
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione um protocolo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {INSURANCE_PROTOCOLS.map((protocol) => (
                  <SelectItem
                    key={protocol.address}
                    value={protocol.address}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{protocol.name}</span>
                        <span className="text-xs text-blue-400">
                          {protocol.premium}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        {protocol.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor de Cobertura */}
          <div className="space-y-2">
            <Label htmlFor="coverage" className="text-sm font-medium">
              Valor de Cobertura (USDC)
            </Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                id="coverage"
                type="number"
                step="0.01"
                placeholder="1000.00"
                value={coverageAmount}
                onChange={(e) => setCoverageAmount(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white"
              />
              <span className="absolute right-3 top-3 text-sm text-slate-400">
                USDC
              </span>
            </div>
          </div>

          {/* Período de Cobertura */}
          <div className="space-y-2">
            <Label htmlFor="period" className="text-sm font-medium">
              Período de Cobertura
            </Label>
            <Select value={coveragePeriod} onValueChange={setCoveragePeriod}>
              <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                {COVERAGE_PERIODS.map((period) => (
                  <SelectItem
                    key={period.value}
                    value={period.value}
                    className="text-white hover:bg-slate-700"
                  >
                    <div className="flex items-center justify-between w-full">
                      <span>{period.label}</span>
                      {period.multiplier < 1 && (
                        <span className="text-xs text-green-400">
                          -{Math.round((1 - period.multiplier) * 100)}% desconto
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Preview da Apólice */}
          {selectedProtocolData && coverageAmount && coveragePeriod && (
            <Card className="bg-slate-700/50 border-slate-600">
              <CardContent className="p-4 space-y-3">
                <h4 className="font-medium text-white flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-400" />
                  Preview da Apólice
                </h4>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Protocolo:</span>
                    <span className="text-white">
                      {selectedProtocolData.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Cobertura:</span>
                    <span className="text-white">${coverageAmount} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Período:</span>
                    <span className="text-white">{coveragePeriod} dias</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Taxa Base:</span>
                    <span className="text-white">
                      {selectedProtocolData.premium}
                    </span>
                  </div>
                  {selectedPeriodData && selectedPeriodData.multiplier < 1 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Desconto:</span>
                      <span className="text-green-400">
                        -{Math.round((1 - selectedPeriodData.multiplier) * 100)}
                        %
                      </span>
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-600 pt-3 mt-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-slate-300">
                      Premium Total:
                    </span>
                    <span className="font-bold text-white text-lg">
                      ${premium.toFixed(2)} USDC
                    </span>
                  </div>
                </div>

                {/* Risk Level Indicator */}
                <div className="flex items-center gap-2 pt-2">
                  <span className="text-slate-400 text-sm">
                    Nível de Risco:
                  </span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      selectedProtocolData.riskLevel === "Baixo"
                        ? "bg-green-500/20 text-green-400"
                        : selectedProtocolData.riskLevel === "Médio"
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                    }`}
                  >
                    {selectedProtocolData.riskLevel}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-blue-500/10 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-blue-400 text-sm font-medium">
                    Cobertura Automática
                  </p>
                  <p className="text-blue-300 text-xs">
                    Seu seguro será ativado automaticamente após a confirmação
                    da transação. Em caso de sinistro, o pagamento será
                    processado automaticamente via smart contract.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              !isConnected ||
              !selectedProtocol ||
              !coverageAmount ||
              !coveragePeriod ||
              isLoading
            }
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Criando Apólice...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Criar Seguro (${premium.toFixed(2)} USDC)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
