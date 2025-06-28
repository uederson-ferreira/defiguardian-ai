// frontend/src/types/ethereum.d.ts
// Adicionar tipos para MetaMask/Ethereum

interface Window {
  ethereum?: {
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, callback: (...args: unknown[]) => void) => void;
    removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    isMetaMask?: boolean;
  };
}
