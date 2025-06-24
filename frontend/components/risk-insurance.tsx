'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Shield, Plus, Loader2, AlertTriangle, DollarSign, Calendar, CheckCircle } from 'lucide-react'
import useWeb3Contracts from '@/hooks/useWeb3Contracts'
import { CONTRACT_ADDRESSES, MOCK_PROTOCOLS } from '@/lib/web3-config'
import { toast } from 'sonner'

interface InsurancePolicy {
  id: string
  protocolAddress: string
  protocolName: string
  coverage: string
  premium: string
  isActive: boolean
  createdAt: string
  expiresAt: string
}

const MOCK_PROTOCOLS_LIST = [
  { address: MOCK_PROTOCOLS.MOCK_AAVE, name: 'Aave (Mock)' },
  { address: MOCK_PROTOCOLS.MOCK_COMPOUND, name: 'Compound (Mock)' },
  { address: MOCK_PROTOCOLS.MOCK_UNISWAP, name: 'Uniswap (Mock)' },
  { address: MOCK_PROTOCOLS.CURVE, name: 'Curve (Mock)' }
]

export function RiskInsurance() {
  const {
    createInsurancePolicy,
    getProtocolRisk,
    isConnected,
    account,
    loading: web3Loading,
    error: web3Error,
    initializeWeb3
  } = useWeb3Contracts()

  const [policies, setPolicies] = useState<InsurancePolicy[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newPolicy, setNewPolicy] = useState({
    protocolAddress: '',
    coverage: ''
  })
  const [creating, setCreating] = useState(false)
  const [protocolRisks, setProtocolRisks] = useState<Record<string, number>>({})

  const loadProtocolRisks = async () => {
    try {
      const risks: Record<string, number> = {}
      
      for (const protocol of MOCK_PROTOCOLS_LIST) {
        const risk = await getProtocolRisk(protocol.address)
        if (risk !== null) {
          risks[protocol.address] = risk
        }
      }
      
      setProtocolRisks(risks)
      console.log('✅ Riscos de protocolo carregados:', risks)
    } catch (err: any) {
      console.error('❌ Erro ao carregar riscos de protocolo:', err)
    }
  }

  const loadUserPolicies = async () => {
    if (!account) {
      setError('Nenhuma conta conectada')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando apólices do usuário...')
      
      // Mock data for demonstration (in real implementation, this would come from the contract)
      const mockPolicies: InsurancePolicy[] = [
        {
          id: '1',
          protocolAddress: MOCK_PROTOCOLS.MOCK_AAVE,
          protocolName: 'Aave (Mock)',
          coverage: '10.0',
          premium: '0.5',
          isActive: true,
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 23 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          protocolAddress: MOCK_PROTOCOLS.MOCK_COMPOUND,
          protocolName: 'Compound (Mock)',
          coverage: '5.0',
          premium: '0.25',
          isActive: true,
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          expiresAt: new Date(Date.now() + 27 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
      
      setPolicies(mockPolicies)
      console.log('✅ Apólices carregadas:', mockPolicies)

    } catch (err: any) {
      console.error('❌ Erro ao carregar apólices:', err)
      setError(err.message || 'Erro ao carregar apólices')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePolicy = async () => {
    if (!newPolicy.protocolAddress || !newPolicy.coverage) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    const coverage = parseFloat(newPolicy.coverage)
    if (isNaN(coverage) || coverage <= 0) {
      toast.error('A cobertura deve ser um número positivo')
      return
    }

    try {
      setCreating(true)
      
      console.log('🔄 Criando nova apólice de seguro...', {
        protocolAddress: newPolicy.protocolAddress,
        coverage
      })
      
      const txHash = await createInsurancePolicy(newPolicy.protocolAddress, newPolicy.coverage)
      
      if (txHash) {
        toast.success('Apólice de seguro criada com sucesso!', {
          description: `Transação: ${txHash.slice(0, 10)}...`
        })
        
        // Reset form and close dialog
        setNewPolicy({ protocolAddress: '', coverage: '' })
        setIsCreateDialogOpen(false)
        
        // Reload policies
        await loadUserPolicies()
      } else {
        toast.error('Falha ao criar apólice de seguro')
      }

    } catch (err: any) {
      console.error('❌ Erro ao criar apólice:', err)
      toast.error(err.message || 'Erro ao criar apólice de seguro')
    } finally {
      setCreating(false)
    }
  }

  const getProtocolName = (address: string) => {
    const protocol = MOCK_PROTOCOLS_LIST.find(p => p.address.toLowerCase() === address.toLowerCase())
    return protocol?.name || `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const calculatePremium = (coverage: string, protocolAddress: string) => {
    const coverageAmount = parseFloat(coverage)
    const risk = protocolRisks[protocolAddress] || 50 // Default 50% risk
    const basePremium = coverageAmount * 0.05 // 5% base premium
    const riskMultiplier = risk / 100
    return (basePremium * (1 + riskMultiplier)).toFixed(4)
  }

  const formatCurrency = (value: string) => {
    const num = parseFloat(value)
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }

  const getDaysUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffTime = expiry.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getRiskColor = (risk: number) => {
    if (risk < 30) return 'text-green-600'
    if (risk < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getRiskBadgeVariant = (risk: number): 'default' | 'secondary' | 'destructive' => {
    if (risk < 30) return 'default'
    if (risk < 70) return 'secondary'
    return 'destructive'
  }

  useEffect(() => {
    if (isConnected && account) {
      loadUserPolicies()
      loadProtocolRisks()
    }
  }, [isConnected, account])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguro de Risco
          </CardTitle>
          <CardDescription>
            Conecte sua carteira para gerenciar seguros de risco
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={initializeWeb3} className="w-full">
            Conectar Carteira
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (web3Loading || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Seguro de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Carregando seguros...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error || web3Error) {
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
            <AlertDescription>
              {error || web3Error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadUserPolicies} className="w-full mt-4">
            Tentar Novamente
          </Button>
        </CardContent>
      </Card>
    )
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
              Proteja seus investimentos DeFi com seguros personalizados
            </CardDescription>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Nova Apólice
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Criar Nova Apólice</DialogTitle>
                <DialogDescription>
                  Configure uma apólice de seguro para proteger seus investimentos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="protocol">Protocolo</Label>
                  <select
                    className="w-full p-2 border rounded-md"
                    value={newPolicy.protocolAddress}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, protocolAddress: e.target.value }))}
                  >
                    <option value="">Selecione um protocolo</option>
                    {MOCK_PROTOCOLS_LIST.map((protocol) => {
                      const risk = protocolRisks[protocol.address]
                      return (
                        <option key={protocol.address} value={protocol.address}>
                          {protocol.name} {risk ? `(Risco: ${risk.toFixed(1)}%)` : ''}
                        </option>
                      )
                    })}
                  </select>
                  {newPolicy.protocolAddress && protocolRisks[newPolicy.protocolAddress] && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Risco do protocolo:</span>
                      <Badge variant={getRiskBadgeVariant(protocolRisks[newPolicy.protocolAddress])}>
                        {protocolRisks[newPolicy.protocolAddress].toFixed(1)}%
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="coverage">Cobertura (AVAX)</Label>
                  <Input
                    id="coverage"
                    type="number"
                    min="0"
                    step="0.1"
                    placeholder="Ex: 10.0"
                    value={newPolicy.coverage}
                    onChange={(e) => setNewPolicy(prev => ({ ...prev, coverage: e.target.value }))}
                  />
                  {newPolicy.coverage && newPolicy.protocolAddress && (
                    <div className="text-sm text-muted-foreground">
                      Prêmio estimado: {formatCurrency(calculatePremium(newPolicy.coverage, newPolicy.protocolAddress))} AVAX
                    </div>
                  )}
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreatePolicy} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Apólice
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
            <p className="text-muted-foreground mb-4">Nenhuma apólice de seguro ativa</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Criar Primeira Apólice
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {policies.map((policy) => {
              const daysUntilExpiry = getDaysUntilExpiry(policy.expiresAt)
              const protocolRisk = protocolRisks[policy.protocolAddress]
              
              return (
                <div key={policy.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{policy.protocolName}</h4>
                      {policy.isActive ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    
                    {protocolRisk && (
                      <Badge variant={getRiskBadgeVariant(protocolRisk)}>
                        Risco: {protocolRisk.toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Cobertura
                      </div>
                      <div className="font-medium">{formatCurrency(policy.coverage)}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <DollarSign className="h-3 w-3" />
                        Prêmio
                      </div>
                      <div className="font-medium">{formatCurrency(policy.premium)}</div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Criada em
                      </div>
                      <div className="font-medium">
                        {new Date(policy.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-1 text-muted-foreground mb-1">
                        <Calendar className="h-3 w-3" />
                        Expira em
                      </div>
                      <div className={`font-medium ${
                        daysUntilExpiry < 7 ? 'text-red-600' : 
                        daysUntilExpiry < 30 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {daysUntilExpiry} dias
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Protocolo: {policy.protocolAddress.slice(0, 10)}...{policy.protocolAddress.slice(-8)}
                  </div>
                </div>
              )
            })}
            
            <div className="pt-4 border-t">
              <Button onClick={loadUserPolicies} variant="outline" className="w-full">
                Atualizar Apólices
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RiskInsurance