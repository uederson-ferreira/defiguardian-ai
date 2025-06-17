import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { 
    CrossChainHedge,
    HedgeAutomation,
    ChainlinkCCIPAdapter,
    MockERC20,
    MockPriceFeed
} from "../typechain-types";

describe("CrossChainHedge System", function () {
    let hedgeContract: CrossChainHedge;
    let automationContract: HedgeAutomation;
    let ccipAdapter: ChainlinkCCIPAdapter;
    let mockToken: MockERC20;
    let mockPriceFeed: MockPriceFeed;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;

    const SEPOLIA_CHAIN_ID = 11155111;
    const FUJI_CHAIN_ID = 43113;
    const INITIAL_PRICE = ethers.utils.parseUnits("2000", 8); // $2000 USD
    const MIN_PRICE = ethers.utils.parseUnits("1900", 8);
    const MAX_PRICE = ethers.utils.parseUnits("2100", 8);
    const REBALANCE_THRESHOLD = 500; // 5%

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy mock contracts
        const MockERC20 = await ethers.getContractFactory("MockERC20");
        mockToken = await MockERC20.deploy("Mock USDC", "USDC", 6);
        await mockToken.deployed();

        const MockPriceFeed = await ethers.getContractFactory("MockPriceFeed");
        mockPriceFeed = await MockPriceFeed.deploy(INITIAL_PRICE);
        await mockPriceFeed.deployed();

        // Deploy main contracts
        const CrossChainHedge = await ethers.getContractFactory("CrossChainHedge");
        hedgeContract = await CrossChainHedge.deploy(
            mockPriceFeed.address,
            mockToken.address
        );
        await hedgeContract.deployed();

        const HedgeAutomation = await ethers.getContractFactory("HedgeAutomation");
        automationContract = await HedgeAutomation.deploy(hedgeContract.address);
        await automationContract.deployed();

        const ChainlinkCCIPAdapter = await ethers.getContractFactory("ChainlinkCCIPAdapter");
        ccipAdapter = await ChainlinkCCIPAdapter.deploy(owner.address); // Mock router address
        await ccipAdapter.deployed();

        // Configure bridge adapters
        await hedgeContract.configureChain(
            FUJI_CHAIN_ID,
            mockPriceFeed.address,
            ccipAdapter.address
        );

        // Mint tokens para teste
        await mockToken.mint(user1.address, ethers.utils.parseUnits("10000", 6));
        await mockToken.mint(user2.address, ethers.utils.parseUnits("10000", 6));
        
        // Aprova tokens para o contrato
        await mockToken.connect(user1).approve(
            hedgeContract.address,
            ethers.constants.MaxUint256
        );
        await mockToken.connect(user2).approve(
            hedgeContract.address,
            ethers.constants.MaxUint256
        );
    });

    describe("Configuração Inicial", function () {
        it("Deve configurar corretamente os contratos", async function () {
            expect(await hedgeContract.priceFeed()).to.equal(mockPriceFeed.address);
            expect(await hedgeContract.hedgeToken()).to.equal(mockToken.address);
            expect(await automationContract.hedgeContract()).to.equal(hedgeContract.address);
        });

        it("Deve configurar corretamente as chains", async function () {
            const fujiConfig = await hedgeContract.chainConfigs(FUJI_CHAIN_ID);
            expect(fujiConfig.priceFeed).to.equal(mockPriceFeed.address);
            expect(fujiConfig.bridgeAdapter).to.equal(ccipAdapter.address);
            expect(fujiConfig.isActive).to.be.true;
        });
    });

    describe("Criação de Posições", function () {
        it("Deve criar posição de hedge corretamente", async function () {
            const amount = ethers.utils.parseUnits("1000", 6);
            const tx = await hedgeContract.connect(user1).createHedgePosition(
                amount,
                INITIAL_PRICE,
                SEPOLIA_CHAIN_ID
            );
            
            await tx.wait();
            
            const position = await hedgeContract.hedgePositions(user1.address, 0);
            expect(position.amount).to.equal(amount);
            expect(position.targetPrice).to.equal(INITIAL_PRICE);
            expect(position.chainId).to.equal(SEPOLIA_CHAIN_ID);
            expect(position.isActive).to.be.true;
        });

        it("Deve falhar ao criar posição com amount zero", async function () {
            await expect(
                hedgeContract.connect(user1).createHedgePosition(
                    0,
                    INITIAL_PRICE,
                    SEPOLIA_CHAIN_ID
                )
            ).to.be.revertedWith("Invalid amount");
        });
    });

    describe("Automação", function () {
        beforeEach(async function () {
            // Configura automação para user1
            await automationContract.connect(user1).configureAutomation(
                MIN_PRICE,
                MAX_PRICE,
                REBALANCE_THRESHOLD,
                [SEPOLIA_CHAIN_ID, FUJI_CHAIN_ID]
            );
        });

        it("Deve detectar necessidade de upkeep quando preço cai abaixo do mínimo", async function () {
            await mockPriceFeed.setPrice(MIN_PRICE.sub(1));
            
            const [needsUpkeep, performData] = await automationContract.checkUpkeep("0x");
            expect(needsUpkeep).to.be.true;
            
            const decoded = ethers.utils.defaultAbiCoder.decode(
                ["address", "uint256", "uint256"],
                performData
            );
            expect(decoded[0]).to.equal(user1.address);
        });

        it("Deve executar upkeep corretamente", async function () {
            await mockPriceFeed.setPrice(MIN_PRICE.sub(1));
            
            const [, performData] = await automationContract.checkUpkeep("0x");
            await automationContract.performUpkeep(performData);
            
            // Verifica se nova posição foi criada
            const position = await hedgeContract.hedgePositions(user1.address, 0);
            expect(position.isActive).to.be.true;
        });
    });

    describe("Cross-Chain Bridge", function () {
        it("Deve iniciar bridge para Avalanche corretamente", async function () {
            const amount = ethers.utils.parseUnits("1000", 6);
            const tx = await hedgeContract.connect(user1).createHedgePosition(
                amount,
                INITIAL_PRICE,
                FUJI_CHAIN_ID
            );
            
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === "CrossChainHedgeInitiated");
            
            expect(event).to.not.be.undefined;
            expect(event?.args?.sourceChainId).to.equal(SEPOLIA_CHAIN_ID);
            expect(event?.args?.targetChainId).to.equal(FUJI_CHAIN_ID);
        });

        it("Deve estimar fees corretamente", async function () {
            const amount = ethers.utils.parseUnits("1000", 6);
            const fees = await ccipAdapter.estimateFees(FUJI_CHAIN_ID, amount);
            expect(fees).to.be.gt(0);
        });
    });

    describe("Rebalanceamento", function () {
        beforeEach(async function () {
            // Cria posições em ambas as chains
            const amount = ethers.utils.parseUnits("1000", 6);
            await hedgeContract.connect(user1).createHedgePosition(
                amount,
                INITIAL_PRICE,
                SEPOLIA_CHAIN_ID
            );
            await hedgeContract.connect(user1).createHedgePosition(
                amount,
                INITIAL_PRICE,
                FUJI_CHAIN_ID
            );
        });

        it("Deve detectar necessidade de rebalanceamento", async function () {
            // Simula diferença de preço significativa
            await mockPriceFeed.setPrice(INITIAL_PRICE.mul(106).div(100)); // +6%
            
            const [needsUpkeep] = await automationContract.checkUpkeep("0x");
            expect(needsUpkeep).to.be.true;
        });

        it("Deve executar rebalanceamento entre chains", async function () {
            await mockPriceFeed.setPrice(INITIAL_PRICE.mul(106).div(100));
            
            const [, performData] = await automationContract.checkUpkeep("0x");
            const tx = await automationContract.performUpkeep(performData);
            
            const receipt = await tx.wait();
            const event = receipt.events?.find(e => e.event === "RebalanceTriggered");
            
            expect(event).to.not.be.undefined;
            expect(event?.args?.sourceChain).to.equal(SEPOLIA_CHAIN_ID);
            expect(event?.args?.targetChain).to.equal(FUJI_CHAIN_ID);
        });
    });
}); 