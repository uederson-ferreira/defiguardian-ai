// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/config/Addresses.sol

// ========== Addresses.sol ==========
library Addresses {
    
    // ========== MAINNET ADDRESSES ==========
    
    // DeFi Protocols
    struct MainnetProtocols {
        address uniswapV3Factory;      // 0x1F98431c8aD98523631AE4a59f267346ea31F984
        address uniswapV3Router;       // 0xE592427A0AEce92De3Edee1F18E0157C05861564
        address aaveV3Pool;            // 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2
        address aaveV3PoolProvider;    // 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e
        address compoundV3USDC;        // 0xc3d688B66703497DAA19211EEdff47f25384cdc3
        address compoundV3ETH;         // 0xA17581A9E3356d9A858b789D68B4d866e593aE94
        address lidoStETH;             // 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84
        address lidoWithdrawals;       // 0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1
        address curveRegistry;         // 0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5
        address curveFactoryV2;        // 0xB9fC157394Af804a3578134A6585C0dc9cc990d4
        address balancerV2Vault;       // 0xBA12222222228d8Ba445958a75a0704d566BF2C8
        address makerDAOPSM;           // 0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A
        address yearnV2Registry;       // 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804
        address convexBooster;         // 0xF403C135812408BFbE8713b5A23a04b3D48AAE31
    }
    
    // Major ERC20 Tokens
    struct MainnetTokens {
        address WETH;                  // 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2
        address USDC;                  // 0xA0b86a33E6441b8c83Cc13E5C48A5e4D25EC7E1c
        address USDT;                  // 0xdAC17F958D2ee523a2206206994597C13D831ec7
        address DAI;                   // 0x6B175474E89094C44Da98b954EedeAC495271d0F
        address WBTC;                  // 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599
        address UNI;                   // 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
        address AAVE;                  // 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9
        address COMP;                  // 0xc00e94Cb662C3520282E6f5717214004A7f26888
        address CRV;                   // 0xD533a949740bb3306d119CC777fa900bA034cd52
        address CVX;                   // 0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B
        address LDO;                   // 0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32
        address LINK;                  // 0x514910771AF9Ca656af840dff83E8264EcF986CA
    }
    
    // ========== SEPOLIA TESTNET ADDRESSES ==========
    // 🔴 SUBSTITUIR ESTA SEÇÃO COMPLETA:
    
    struct SepoliaProtocols {
        address uniswapV3Factory;      // 0x0227628f3F023bb0B980b67D528571c95c6DaC1c
        address uniswapV3Router;       // 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
        address aaveV3Pool;            // 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
        address aaveV3PoolProvider;    // 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
        // ✅ ADICIONAR ESTES:
        address compoundV3Mock;        // Deploy via SepoliaSetup
        address lidoMock;              // Deploy via SepoliaSetup
        address curveMock;             // Deploy via SepoliaSetup
        address balancerMock;          // Deploy via SepoliaSetup
        address yearnMock;             // Deploy via SepoliaSetup
    }
    
    struct SepoliaTokens {
        address WETH;                  // 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14
        address USDC;                  // 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8
        address DAI;                   // 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357
        address LINK;                  // 0x779877A7B0D9E8603169DdbD7836e478b4624789
        address UNI;                   // 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984
        // ✅ ADICIONAR ESTES:
        address WBTC_MOCK;             // Mock token address
        address USDT_MOCK;             // Mock token address
        address AAVE_MOCK;             // Mock token address
        address COMP_MOCK;             // Mock token address
        address CRV_MOCK;              // Mock token address
        address LDO_MOCK;              // Mock token address
    }
    
    // ========== GETTER FUNCTIONS ========== (TAMBÉM ATUALIZAR)
    
    function getSepoliaProtocols() internal pure returns (SepoliaProtocols memory) {
        return SepoliaProtocols({
            uniswapV3Factory: 0x0227628f3F023bb0B980b67D528571c95c6DaC1c,
            uniswapV3Router: 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E,
            aaveV3Pool: 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951,
            aaveV3PoolProvider: 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A,
            // ✅ ADICIONAR ESTES:
            compoundV3Mock: address(0), // Será preenchido pelo SepoliaSetup
            lidoMock: address(0),       // Será preenchido pelo SepoliaSetup
            curveMock: address(0),      // Será preenchido pelo SepoliaSetup
            balancerMock: address(0),   // Será preenchido pelo SepoliaSetup
            yearnMock: address(0)       // Será preenchido pelo SepoliaSetup
        });
    }
    
    function getSepoliaTokens() internal pure returns (SepoliaTokens memory) {
        return SepoliaTokens({
            WETH: 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14,
            USDC: 0x94a9D9AC8a22534E3FaCa9F4e7F2E2cf85d5E4C8,
            DAI: 0xFF34B3d4Aee8ddCd6F9AFFFB6Fe49bD371b8a357,
            LINK: 0x779877A7B0D9E8603169DdbD7836e478b4624789,
            UNI: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984,
            // ✅ ADICIONAR ESTES:
            WBTC_MOCK: address(0),      // Será preenchido se necessário
            USDT_MOCK: address(0),      // Será preenchido se necessário
            AAVE_MOCK: address(0),      // Será preenchido se necessário
            COMP_MOCK: address(0),      // Será preenchido se necessário
            CRV_MOCK: address(0),       // Será preenchido se necessário
            LDO_MOCK: address(0)        // Será preenchido se necessário
        });
    }
    
    // ========== GETTER FUNCTIONS ==========
    
    function getMainnetProtocols() internal pure returns (MainnetProtocols memory) {
        return MainnetProtocols({
            uniswapV3Factory: 0x1F98431c8aD98523631AE4a59f267346ea31F984,
            uniswapV3Router: 0xE592427A0AEce92De3Edee1F18E0157C05861564,
            aaveV3Pool: 0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2,
            aaveV3PoolProvider: 0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e,
            compoundV3USDC: 0xc3d688B66703497DAA19211EEdff47f25384cdc3,
            compoundV3ETH: 0xA17581A9E3356d9A858b789D68B4d866e593aE94,
            lidoStETH: 0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84,
            lidoWithdrawals: 0x889edC2eDab5f40e902b864aD4d7AdE8E412F9B1,
            curveRegistry: 0x90E00ACe148ca3b23Ac1bC8C240C2a7Dd9c2d7f5,
            curveFactoryV2: 0xB9fC157394Af804a3578134A6585C0dc9cc990d4,
            balancerV2Vault: 0xBA12222222228d8Ba445958a75a0704d566BF2C8,
            makerDAOPSM: 0x89B78CfA322F6C5dE0aBcEecab66Aee45393cC5A,
            yearnV2Registry: 0x50c1a2eA0a861A967D9d0FFE2AE4012c2E053804,
            convexBooster: 0xF403C135812408BFbE8713b5A23a04b3D48AAE31
        });
    }
    
    function getMainnetTokens() internal pure returns (MainnetTokens memory) {
        return MainnetTokens({
            WETH: 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2,
            USDC: 0xA0B86a33e6441b8c83cC13E5c48A5e4d25eC7e1C,
            USDT: 0xdAC17F958D2ee523a2206206994597C13D831ec7,
            DAI: 0x6B175474E89094C44Da98b954EedeAC495271d0F,
            WBTC: 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599,
            UNI: 0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984,
            AAVE: 0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9,
            COMP: 0xc00e94Cb662C3520282E6f5717214004A7f26888,
            CRV: 0xD533a949740bb3306d119CC777fa900bA034cd52,
            CVX: 0x4e3FBD56CD56c3e72c1403e103b45Db9da5B9D2B,
            LDO: 0x5A98FcBEA516Cf06857215779Fd812CA3beF1B32,
            LINK: 0x514910771AF9Ca656af840dff83E8264EcF986CA
        });
    }
}

