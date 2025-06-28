"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Shield,
  Plus,
  Loader2,
  AlertTriangle,
  DollarSign,
  Calendar,
  CheckCircle,
} from "lucide-react";
import { useAccount } from "wagmi";
import useWeb3Contracts from "@/hooks/useWeb3Contracts";
import { MOCK_PROTOCOLS } from "@/lib/web3-config";
import { toast } from "sonner";

interface InsurancePolicy {
  id: string;
  protocolAddress: string;
  protocolName: string;
  coverage: string;
  premium: string;
  isActive: boolean;
  createdAt: string;
  expiresAt: string;
}

const MOCK_PROTOCOLS_LIST = [
  { address: MOCK_PROTOCOLS.MOCK_AAVE, name: "Aave (Mock)" },
  { address: MOCK_PROTOCOLS.MOCK_COMPOUND, name: "Compound (Mock)" },
  { address: MOCK_PROTOCOLS.MOCK_UNISWAP, name: "Uniswap (Mock)" },
  { address: MOCK_PROTOCOLS.CURVE, name: "Curve (Mock)" },
];

export function RiskInsurance() {
  const { address, isConnected } = useAccount();
  const { createInsurancePolicy, loading, error } = useWeb3Contracts();

  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    protocol: "",
    coverage: "",
    premium: "",
  });
  const [protocolRisks, setProtocolRisks] = useState<Record<string, number>>(
    {}
  );

  const loadProtocolRisks = useCallback(async () => {
    try {
      const risks: Record<string, number> = {};

      for (const protocol of MOCK_PROTOCOLS_LIST) {
        // Mock risk data for demonstration
        const risk = Math.floor(Math.random() * 100);
        if (risk !== null) {
          risks[protocol.address] = risk;
        }
      }

      setProtocolRisks(risks);
      console.log("✅ Protocol risks loaded:", risks);
    } catch (err: unknown) {
      console.error("❌ Error loading protocol risks:", err);
    }
  }, []);

  // Mock data for demonstration
  const mockPolicies: InsurancePolicy[] = useMemo(
    () => [
      {
        id: "1",
        protocolAddress: MOCK_PROTOCOLS.MOCK_AAVE,
        protocolName: "Aave (Mock)",
        coverage: "10.0",
        premium: "0.5",
        isActive: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(
          Date.now() + 23 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
      {
        id: "2",
        protocolAddress: MOCK_PROTOCOLS.MOCK_COMPOUND,
        protocolName: "Compound (Mock)",
        coverage: "5.0",
        premium: "0.25",
        isActive: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        expiresAt: new Date(
          Date.now() + 27 * 24 * 60 * 60 * 1000
        ).toISOString(),
      },
    ],
    []
  );

  const handleCreatePolicy = async () => {
    if (!newPolicy.protocol || !newPolicy.coverage || !newPolicy.premium) {
      toast.error("Fill in all fields");
      return;
    }

    if (!address) {
      toast.error("Connect your wallet first");
      return;
    }

    try {
      setCreating(true);

      const coverage = parseFloat(newPolicy.coverage);
      const premium = parseFloat(newPolicy.premium);

      console.log("🔄 Creating insurance policy...", {
        protocol: newPolicy.protocol,
        coverage,
        premium,
        address,
      });

      await createInsurancePolicy(newPolicy.protocol, coverage.toString());

      toast.success("Insurance policy created successfully!");

      // Reset form
      setNewPolicy({ protocol: "", coverage: "", premium: "" });
      setIsCreateDialogOpen(false);

      // Reload policies
      setPolicies(mockPolicies);
    } catch (err: unknown) {
      console.error("❌ Error creating policy:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Error creating insurance policy";
      toast.error(errorMessage);
    } finally {
      setCreating(false);
    }
  };

  const calculatePremium = (coverage: string, protocolAddress: string) => {
    const coverageAmount = parseFloat(coverage);
    const risk = protocolRisks[protocolAddress] || 50; // Default 50% risk
    const basePremium = coverageAmount * 0.05; // 5% base premium
    const riskMultiplier = risk / 100;
    return (basePremium * (1 + riskMultiplier)).toFixed(4);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num);
  };

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getRiskBadgeVariant = (
    risk: number
  ): "default" | "secondary" | "destructive" => {
    if (risk < 30) return "default";
    if (risk < 70) return "secondary";
    return "destructive";
  };

  useEffect(() => {
    if (isConnected && address) {
      // For demo purposes, use mock data
      setPolicies(mockPolicies);
      loadProtocolRisks();
    }
  }, [isConnected, address, mockPolicies, loadProtocolRisks]);

  if (!isConnected) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Risk Insurance
          </CardTitle>
          <CardDescription className="text-slate-400">
            Connect your wallet at the top of the page to manage insurance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <Shield className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-400">
              ⚠️ Wallet not connected. Use the connection button in the page
              header.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  if (loading || creating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Insurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Loading insurance...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguro de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button
            onClick={() => setPolicies(mockPolicies)}
            className="w-full mt-4"
          >
            Try Again
          </Button>
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
              <Shield className="h-5 w-5" />
              Seguro de Risco
            </CardTitle>
            <CardDescription>
              Protect your DeFi investments with custom insurance
            </CardDescription>
          </div>

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Create New Policy</DialogTitle>
                <DialogDescription>
                  Configure an insurance policy to protect your
                  investments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocol</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newPolicy.protocol}
                    onChange={(e) =>
                      setNewPolicy((prev) => ({
                        ...prev,
                        protocol: e.target.value,
                      }))
                    }
                  >
                    <option value="">Select a protocol</option>
                    {MOCK_PROTOCOLS_LIST.map((protocol) => {
                      const risk = protocolRisks[protocol.address];
                      return (
                        <option key={protocol.address} value={protocol.address}>
                          {protocol.name}{" "}
                          {risk ? `(Risk: ${risk.toFixed(1)}%)` : ""}
                        </option>
                      );
                    })}
                  </select>
                  {newPolicy.protocol && protocolRisks[newPolicy.protocol] && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Protocol risk:
                      </span>
                      <Badge
                        variant={getRiskBadgeVariant(
                          protocolRisks[newPolicy.protocol]
                        )}
                      >
                        {protocolRisks[newPolicy.protocol].toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="coverage">Coverage (AVAX)</Label>
                  <Input
                    id="coverage"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ex: 10.0"
                    value={newPolicy.coverage}
                    onChange={(e) =>
                      setNewPolicy((prev) => ({
                        ...prev,
                        coverage: e.target.value,
                      }))
                    }
                  />
                  {newPolicy.coverage && newPolicy.protocol && (
                    <div className="text-sm text-muted-foreground">
                      Estimated premium:{" "}
                      {formatCurrency(
                        calculatePremium(newPolicy.coverage, newPolicy.protocol)
                      )}{" "}
                      AVAX
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreatePolicy} disabled={creating}>
                  {creating && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create Policy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {policies.length === 0 ? (
          <div className="text-center py-8">
            <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              No active insurance policies
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Create First Policy
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => {
              const daysUntilExpiry = getDaysUntilExpiry(policy.expiresAt);
              const protocolRisk = protocolRisks[policy.protocolAddress];

              return (
                <div
                  key={policy.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{policy.protocolName}</h4>
                      {policy.isActive ? (
                        <Badge
                          variant="default"
                          className="flex items-center gap-1"
                        >
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>

                    {protocolRisk && (
                      <Badge variant={getRiskBadgeVariant(protocolRisk)}>
                        Risk: {protocolRisk.toFixed(1)}%
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Coverage
                      </div>
                      <div className="font-medium">
                        {formatCurrency(policy.coverage)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Premium
                      </div>
                      <div className="font-medium">
                        {formatCurrency(policy.premium)}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Created on
                      </div>
                      <div className="font-medium">
                        {new Date(policy.createdAt).toLocaleDateString("pt-BR")}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Expires in
                      </div>
                      <div
                        className={`font-medium ${
                          daysUntilExpiry < 7
                            ? "text-red-600"
                            : daysUntilExpiry < 30
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {daysUntilExpiry} days
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Protocolo: {policy.protocolAddress.slice(0, 10)}...
                    {policy.protocolAddress.slice(-8)}
                  </div>
                </div>
              );
            })}

            <div className="pt-4 border-t">
              <Button
                onClick={() => setPolicies(mockPolicies)}
                variant="outline"
                className="w-full"
              >
                Update Policies
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RiskInsurance;
