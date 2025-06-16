import { body, query, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

// Função para validar endereços Ethereum
const isValidEthereumAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

// Função para validar IDs de chain
const isValidChainId = (chainId: number): boolean => {
  const validChainIds = [1, 43114]; // Ethereum Mainnet e Avalanche C-Chain
  return validChainIds.includes(chainId);
};

// Middleware para validar resultados
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      errors: errors.array()
    });
    return res.status(400).json({
      error: 'Validation Error',
      details: errors.array()
    });
  }
  next();
};

// Validações para análise de contrato
export const validateContractAnalysis = [
  body('contractAddress')
    .trim()
    .notEmpty()
    .withMessage('O endereço do contrato é obrigatório')
    .custom((value) => {
      if (!isValidEthereumAddress(value)) {
        throw new Error('Endereço de contrato inválido');
      }
      return true;
    }),
  body('chainId')
    .isInt()
    .withMessage('Chain ID deve ser um número inteiro')
    .custom((value) => {
      if (!isValidChainId(value)) {
        throw new Error('Chain ID não suportado');
      }
      return true;
    }),
  validate
];

// Validações para monitoramento de mercado
export const validateMarketMonitoring = [
  body('assets')
    .isArray()
    .withMessage('O campo assets deve ser um array')
    .notEmpty()
    .withMessage('O array de assets não pode estar vazio')
    .custom((assets: string[]) => {
      if (!assets.every(isValidEthereumAddress)) {
        throw new Error('Um ou mais endereços de token são inválidos');
      }
      return true;
    }),
  validate
];

// Validações para detecção de anomalias
export const validateAnomalyDetection = [
  body()
    .custom((value) => {
      const requiredFields = ['price', 'volume', 'liquidity', 'transactions'];
      const hasAtLeastOne = requiredFields.some(field => Array.isArray(value[field]) && value[field].length > 0);
      if (!hasAtLeastOne) {
        throw new Error('Pelo menos um conjunto de dados (price, volume, liquidity, transactions) deve ser fornecido');
      }
      return true;
    }),
  body('price')
    .optional()
    .isArray()
    .withMessage('O campo price deve ser um array de números')
    .custom((value) => {
      if (!value.every((n: any) => typeof n === 'number' && !isNaN(n))) {
        throw new Error('Todos os valores de price devem ser números válidos');
      }
      return true;
    }),
  body('volume')
    .optional()
    .isArray()
    .withMessage('O campo volume deve ser um array de números')
    .custom((value) => {
      if (!value.every((n: any) => typeof n === 'number' && !isNaN(n))) {
        throw new Error('Todos os valores de volume devem ser números válidos');
      }
      return true;
    }),
  body('liquidity')
    .optional()
    .isArray()
    .withMessage('O campo liquidity deve ser um array de números')
    .custom((value) => {
      if (!value.every((n: any) => typeof n === 'number' && !isNaN(n))) {
        throw new Error('Todos os valores de liquidity devem ser números válidos');
      }
      return true;
    }),
  body('transactions')
    .optional()
    .isArray()
    .withMessage('O campo transactions deve ser um array de números')
    .custom((value) => {
      if (!value.every((n: any) => typeof n === 'number' && !isNaN(n))) {
        throw new Error('Todos os valores de transactions devem ser números válidos');
      }
      return true;
    }),
  validate
];

// Validações para chat
export const validateChat = [
  body('message')
    .trim()
    .notEmpty()
    .withMessage('A mensagem é obrigatória')
    .isLength({ max: 1000 })
    .withMessage('A mensagem deve ter no máximo 1000 caracteres'),
  body('context')
    .optional()
    .isObject()
    .withMessage('O contexto deve ser um objeto válido'),
  validate
];

// Validações para parâmetros de rota
export const validateRouteParams = {
  // Validação de endereço
  address: param('address')
    .trim()
    .custom((value) => {
      if (!isValidEthereumAddress(value)) {
        throw new Error('Endereço inválido');
      }
      return true;
    }),

  // Validação de número de bloco
  blockNumber: param('blockNumber')
    .trim()
    .isInt({ min: 0 })
    .withMessage('Número do bloco deve ser um inteiro não negativo'),

  // Validação de hash de transação
  txHash: param('txHash')
    .trim()
    .matches(/^0x[a-fA-F0-9]{64}$/)
    .withMessage('Hash de transação inválido')
};

// Validações para parâmetros de query
export const validateQueryParams = {
  // Validação de limite
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser um número entre 1 e 100'),

  // Validação de página
  page: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número maior que 0'),

  // Validação de ordenação
  sort: query('sort')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Ordenação deve ser "asc" ou "desc"')
}; 