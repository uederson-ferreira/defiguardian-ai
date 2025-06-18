// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

//src/config/ChainlinkFeeds.sol

// ========== ChainlinkFeeds.sol ==========
library ChainlinkFeeds {
    
    // ========== MAINNET PRICE FEEDS ==========
    
    struct MainnetFeeds {
        address ETH_USD;               // 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419
        address BTC_USD;               // 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c
        address USDC_USD;              // 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6
        address USDT_USD;              // 0x3E7d1eAB13ad0104d2750B8863b489D65364e32D
        address DAI_USD;               // 0xAed0c38402CbF19F4b1E5C0EFcB8C7e91a3b8C91
        address LINK_USD;              // 0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c
        address UNI_USD;               // 0x553303d460EE0afB37EdFf9bE42922D8FF63220e
        address AAVE_USD;              // 0x547a514d5e3769680Ce22B2361c10Ea13619e8a9
        address COMP_USD;              // 0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5
        address CRV_USD;               // 0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f
        address LDO_USD;               // 0x4e844125952D32AcdF339BE976c98E22F6F318dB
        address WBTC_USD;              // 0x230E0321Cf38F09e247e50Afc7801EA2351fe56F
        address stETH_USD;             // 0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8
    }
    
    // ========== SEPOLIA PRICE FEEDS ==========
    
    struct SepoliaFeeds {
        address ETH_USD;               // 0x694AA1769357215DE4FAC081bf1f309aDC325306
        address BTC_USD;               // 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43
        address USDC_USD;              // 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E
        address DAI_USD;               // 0x14866185B1962B63C3EA9E03Bc1da838bab34C19
        address LINK_USD;              // 0xc59E3633BAAC79493d908e63626716e204A45EdF
        address UNI_USD;               // 0x2b5B2F1Da6c1A6a2F4C6f9EE6Fc43B04f5f9f6D6
    }
    
    // ========== FEED CONFIGURATIONS ==========
    
    struct FeedConfig {
        address feed;
        uint8 decimals;
        uint256 heartbeat;    // seconds
        string description;
    }
    
    // ========== GETTER FUNCTIONS ==========
    
    function getMainnetFeeds() internal pure returns (MainnetFeeds memory) {
        return MainnetFeeds({
            ETH_USD: 0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419,
            BTC_USD: 0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c,
            USDC_USD: 0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6,
            USDT_USD: 0x3E7d1eAB13ad0104d2750B8863b489D65364e32D,
            DAI_USD: 0xaED0c38402cBF19f4B1E5c0EFcb8C7E91a3B8C91, // ✅ CHECKSUM CORRIGIDO
            LINK_USD: 0x2c1d072e956AFFC0D435Cb7AC38EF18d24d9127c,
            UNI_USD: 0x553303d460EE0afB37EdFf9bE42922D8FF63220e,
            AAVE_USD: 0x547a514d5e3769680Ce22B2361c10Ea13619e8a9,
            COMP_USD: 0xdbd020CAeF83eFd542f4De03e3cF0C28A4428bd5,
            CRV_USD: 0xCd627aA160A6fA45Eb793D19Ef54f5062F20f33f,
            LDO_USD: 0x4e844125952D32AcdF339BE976c98E22F6F318dB,
            WBTC_USD: 0x230E0321Cf38F09e247e50Afc7801EA2351fe56F,
            stETH_USD: 0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8
        });
    }
    
    function getSepoliaFeeds() internal pure returns (SepoliaFeeds memory) {
        return SepoliaFeeds({
            ETH_USD: 0x694AA1769357215DE4FAC081bf1f309aDC325306,
            BTC_USD: 0x1b44F3514812d835EB1BDB0acB33d3fA3351Ee43,
            USDC_USD: 0xA2F78ab2355fe2f984D808B5CeE7FD0A93D5270E,
            DAI_USD: 0x14866185B1962B63C3Ea9E03Bc1da838bab34C19, // ✅ CHECKSUM CORRIGIDO
            LINK_USD: 0xc59E3633BAAC79493d908e63626716e204A45EdF,
            UNI_USD: 0x2b5B2F1Da6c1A6a2F4C6f9EE6Fc43B04f5f9f6D6  // ✅ CHECKSUM CORRIGIDO
        });
    }
    
    /**
     * @dev Retorna configuração de feed com heartbeat padrão
     */
    function getFeedConfig(address feed, string memory description) internal pure returns (FeedConfig memory) {
        return FeedConfig({
            feed: feed,
            decimals: 8,          // Padrão Chainlink
            heartbeat: 3600,      // 1 hora padrão
            description: description
        });
    }
    
    /**
     * @dev Retorna configurações para todos os feeds mainnet
     */
    function getAllMainnetConfigs() internal pure returns (FeedConfig[] memory) {
        MainnetFeeds memory feeds = getMainnetFeeds();
        FeedConfig[] memory configs = new FeedConfig[](13);
        
        configs[0] = getFeedConfig(feeds.ETH_USD, "ETH/USD");
        configs[1] = getFeedConfig(feeds.BTC_USD, "BTC/USD");
        configs[2] = getFeedConfig(feeds.USDC_USD, "USDC/USD");
        configs[3] = getFeedConfig(feeds.USDT_USD, "USDT/USD");
        configs[4] = getFeedConfig(feeds.DAI_USD, "DAI/USD");
        configs[5] = getFeedConfig(feeds.LINK_USD, "LINK/USD");
        configs[6] = getFeedConfig(feeds.UNI_USD, "UNI/USD");
        configs[7] = getFeedConfig(feeds.AAVE_USD, "AAVE/USD");
        configs[8] = getFeedConfig(feeds.COMP_USD, "COMP/USD");
        configs[9] = getFeedConfig(feeds.CRV_USD, "CRV/USD");
        configs[10] = getFeedConfig(feeds.LDO_USD, "LDO/USD");
        configs[11] = getFeedConfig(feeds.WBTC_USD, "WBTC/USD");
        configs[12] = getFeedConfig(feeds.stETH_USD, "stETH/USD");
        
        return configs;
    }
    
    /**
     * @dev Verifica se uma rede é suportada
     */
    function isNetworkSupported(uint256 chainId) internal pure returns (bool) {
        return chainId == 1 ||      // Mainnet
               chainId == 11155111; // Sepolia
    }
}