    // ========== SEPOLIA TESTNET ADDRESSES ==========
    
    struct SepoliaProtocols {
        address uniswapV3Factory;      // 0x0227628f3F023bb0B980b67D528571c95c6DaC1c
        address uniswapV3Router;       // 0x3bFA4769FB09eefC5a80d6E87c3B9C650f7Ae48E
        address aaveV3Pool;            // 0x6Ae43d3271ff6888e7Fc43Fd7321a503ff738951
        address aaveV3PoolProvider;    // 0x012bAC54348C0E635dCAc9D5FB99f06F24136C9A
        // ✅ NOVOS: Mock protocols para demo completa
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
        // ✅ NOVOS: Endereços mock para tokens não disponíveis
        address WBTC_MOCK;             // Mock token address
        address USDT_MOCK;             // Mock token address
        address AAVE_MOCK;             // Mock token address
        address COMP_MOCK;             // Mock token address
        address CRV_MOCK;              // Mock token address
        address LDO_MOCK;              // Mock token address
    }