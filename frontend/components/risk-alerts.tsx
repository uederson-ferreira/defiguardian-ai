'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Bell, Plus, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import useWeb3Contracts from '@/hooks/useWeb3Contracts'
import { toast } from 'sonner'

interface RiskAlert {
  id: number
  type: number
  threshold: number
  isActive: boolean
  createdAt?: string
}

const ALERT_TYPES = {
  0: { label: 'Risco de Portfólio', description: 'Alerta quando o risco do portfólio exceder o limite' },
  1: { label: 'Risco de Protocolo', description: 'Alerta quando um protocolo específico apresentar alto risco' },
  2: { label: 'Risco de Mercado', description: 'Alerta quando o risco geral do mercado aumentar' },
  3: { label: 'Liquidação', description: 'Alerta quando posições estiverem próximas da liquidação' },
  4: { label: 'Volatilidade', description: 'Alerta quando a volatilidade exceder o limite' }
}

export function RiskAlerts() {
  const {
    createAlert,
    getUserAlerts,
    isConnected,
    account,
    loading: web3Loading,
    error: web3Error,
    initializeWeb3
  } = useWeb3Contracts()

  const [alerts, setAlerts] = useState<RiskAlert[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newAlert, setNewAlert] = useState({
    type: '',
    threshold: ''
  })
  const [creating, setCreating] = useState(false)

  const loadUserAlerts = async () => {
    if (!account) {
      setError('Nenhuma conta conectada')
      return
    }

    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Carregando alertas do usuário...')
      
      const userAlerts = await getUserAlerts()
      
      if (userAlerts) {
        // Convert alert IDs to alert objects (mock data for demo)
        const alertObjects: RiskAlert[] = userAlerts.map((alertId, index) => ({
          id: alertId,
          type: index % 5, // Distribute across alert types
          threshold: 50 + (index * 10), // Mock thresholds
          isActive: true,
          createdAt: new Date(Date.now() - index * 24 * 60 * 60 * 1000).toISOString()
        }))
        
        setAlerts(alertObjects)
        console.log('✅ Alertas carregados:', alertObjects)
      } else {
        setAlerts([])
      }

    } catch (err: any) {
      console.error('❌ Erro ao carregar alertas:', err)
      setError(err.message || 'Erro ao carregar alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAlert = async () => {
    if (!newAlert.type || !newAlert.threshold) {
      toast.error('Por favor, preencha todos os campos')
      return
    }

    const threshold = parseFloat(newAlert.threshold)
    if (isNaN(threshold) || threshold < 0 || threshold > 100) {
      toast.error('O limite deve ser um número entre 0 e 100')
      return
    }

    try {
      setCreating(true)
      
      console.log('🔄 Criando novo alerta...', {
        type: parseInt(newAlert.type),
        threshold
      })
      
      const txHash = await createAlert(parseInt(newAlert.type), threshold)
      
      if (txHash) {
        toast.success('Alerta criado com sucesso!', {
          description: `Transação: ${txHash.slice(0, 10)}...`
        })
        
        // Reset form and close dialog
        setNewAlert({ type: '', threshold: '' })
        setIsCreateDialogOpen(false)
        
        // Reload alerts
        await loadUserAlerts()
      } else {
        toast.error('Falha ao criar alerta')
      }

    } catch (err: any) {
      console.error('❌ Erro ao criar alerta:', err)
      toast.error(err.message || 'Erro ao criar alerta')
    } finally {
      setCreating(false)
    }
  }

  const getAlertTypeInfo = (type: number) => {
    return ALERT_TYPES[type as keyof typeof ALERT_TYPES] || {
      label: 'Tipo Desconhecido',
      description: 'Tipo de alerta não reconhecido'
    }
  }

  const getThresholdColor = (threshold: number) => {
    if (threshold < 30) return 'text-green-600'
    if (threshold < 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getBadgeVariant = (threshold: number): 'default' | 'secondary' | 'destructive' => {
    if (threshold < 30) return 'default'
    if (threshold < 70) return 'secondary'
    return 'destructive'
  }

  useEffect(() => {
    if (isConnected && account) {
      loadUserAlerts()
    }
  }, [isConnected, account])

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Risco
          </CardTitle>
          <CardDescription>
            Conecte sua carteira para gerenciar alertas de risco
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
    )
  }

  if (error || web3Error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Alertas de Risco
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || web3Error}
            </AlertDescription>
          </Alert>
          <Button onClick={loadUserAlerts} className="w-full mt-4">
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
              <Bell className="h-5 w-5" />
              Alertas de Risco
            </CardTitle>
            <CardDescription>
              Gerencie seus alertas de risco personalizados
            </CardDescription>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Alerta</DialogTitle>
                <DialogDescription>
                  Configure um alerta personalizado para monitorar riscos específicos
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="alert-type">Tipo de Alerta</Label>
                  <Select value={newAlert.type} onValueChange={(value) => setNewAlert(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de alerta" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ALERT_TYPES).map(([value, info]) => (
                        <SelectItem key={value} value={value}>
                          <div>
                            <div className="font-medium">{info.label}</div>
                            <div className="text-sm text-muted-foreground">{info.description}</div>
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
                    onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: e.target.value }))}
                  />
                  <p className="text-sm text-muted-foreground">
                    O alerta será ativado quando o risco exceder este limite
                  </p>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleCreateAlert} disabled={creating}>
                  {creating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Criar Alerta
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Nenhum alerta configurado</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              Criar Primeiro Alerta
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => {
              const typeInfo = getAlertTypeInfo(alert.type)
              return (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{typeInfo.label}</h4>
                      {alert.isActive ? (
                        <Badge variant="default" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex items-center gap-1">
                          <XCircle className="h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {typeInfo.description}
                    </p>
                    {alert.createdAt && (
                      <p className="text-xs text-muted-foreground">
                        Criado em {new Date(alert.createdAt).toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>
                  
                  <div className="text-right">
                    <Badge variant={getBadgeVariant(alert.threshold)}>
                      Limite: {alert.threshold}%
                    </Badge>
                  </div>
                </div>
              )
            })}
            
            <div className="pt-4 border-t">
              <Button onClick={loadUserAlerts} variant="outline" className="w-full">
                Atualizar Alertas
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default RiskAlerts