import { expect } from "chai";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { CrossChainHedge, HedgeAutomation } from "../typechain-types";

describe("HedgeAutomation", function () {
    let hedgeContract: CrossChainHedge;
    let automationContract: HedgeAutomation;
    let owner: SignerWithAddress;
    let user1: SignerWithAddress;
    let user2: SignerWithAddress;
    
    // Mock price feed address (ETH/USD na Sepolia)
    const PRICE_FEED_ADDRESS = "0x694AA1769357215DE4FAC081bf1f309aDC325306";
    // Mock LINK token address (Sepolia)
    const LINK_TOKEN_ADDRESS = "0x779877A7B0D9E8603169DdbD7836e478b4624789";

    beforeEach(async function () {
        [owner, user1, user2] = await ethers.getSigners();

        // Deploy CrossChainHedge
        const CrossChainHedgeFactory = await ethers.getContractFactory("CrossChainHedge");
        hedgeContract = await CrossChainHedgeFactory.deploy(
            PRICE_FEED_ADDRESS,
            LINK_TOKEN_ADDRESS
        );
        await hedgeContract.deployed();

        // Deploy HedgeAutomation
        const HedgeAutomationFactory = await ethers.getContractFactory("HedgeAutomation");
        automationContract = await HedgeAutomationFactory.deploy(hedgeContract.address);
        await automationContract.deployed();
    });

    describe("Configuração", function () {
        it("Deve permitir que usuários configurem automação", async function () {
            const minPrice = ethers.utils.parseEther("1500"); // 1500 USD
            const maxPrice = ethers.utils.parseEther("2000"); // 2000 USD
            const threshold = 500; // 5%

            await automationContract.connect(user1).configureAutomation(
                minPrice,
                maxPrice,
                threshold
            );

            const config = await automationContract.automationConfigs(user1.address);
            expect(config.minPrice).to.equal(minPrice);
            expect(config.maxPrice).to.equal(maxPrice);
            expect(config.rebalanceThreshold).to.equal(threshold);
            expect(config.isActive).to.be.true;
        });

        it("Deve rejeitar configurações inválidas", async function () {
            const minPrice = ethers.utils.parseEther("2000");
            const maxPrice = ethers.utils.parseEther("1500");
            const threshold = 500;

            await expect(
                automationContract.connect(user1).configureAutomation(
                    minPrice,
                    maxPrice,
                    threshold
                )
            ).to.be.revertedWith("Invalid price range");
        });
    });

    describe("Desativação", function () {
        beforeEach(async function () {
            await automationContract.connect(user1).configureAutomation(
                ethers.utils.parseEther("1500"),
                ethers.utils.parseEther("2000"),
                500
            );
        });

        it("Deve permitir que usuários desativem automação", async function () {
            await automationContract.connect(user1).deactivateAutomation();
            
            const config = await automationContract.automationConfigs(user1.address);
            expect(config.isActive).to.be.false;
        });

        it("Deve rejeitar desativação de automação não ativa", async function () {
            await expect(
                automationContract.connect(user2).deactivateAutomation()
            ).to.be.revertedWith("Not active");
        });
    });

    describe("Checkupkeep", function () {
        beforeEach(async function () {
            await automationContract.connect(user1).configureAutomation(
                ethers.utils.parseEther("1500"),
                ethers.utils.parseEther("2000"),
                500
            );
        });

        it("Deve identificar necessidade de upkeep quando preço está fora do range", async function () {
            // Simula preço abaixo do mínimo
            await network.provider.send("evm_increaseTime", [3600]); // Avança 1 hora
            await network.provider.send("evm_mine");

            const [needsUpkeep, performData] = await automationContract.checkUpkeep("0x");
            expect(needsUpkeep).to.be.true;
        });
    });

    describe("Performupkeep", function () {
        beforeEach(async function () {
            // Configura automação para user1
            await automationContract.connect(user1).configureAutomation(
                ethers.utils.parseEther("1500"),
                ethers.utils.parseEther("2000"),
                500
            );

            // Aprova tokens para o contrato de hedge
            const tokenAmount = ethers.utils.parseEther("1000");
            await hedgeContract.connect(user1).approve(tokenAmount);
        });

        it("Deve executar hedge quando necessário", async function () {
            const performData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [user1.address, ethers.utils.parseEther("1400")] // Preço abaixo do mínimo
            );

            await expect(
                automationContract.performUpkeep(performData)
            ).to.emit(automationContract, "AutomationTriggered")
             .withArgs(user1.address, ethers.utils.parseEther("1400"), "Downside Protection");
        });

        it("Deve rejeitar upkeep para automação não ativa", async function () {
            await automationContract.connect(user1).deactivateAutomation();

            const performData = ethers.utils.defaultAbiCoder.encode(
                ["address", "uint256"],
                [user1.address, ethers.utils.parseEther("1400")]
            );

            await expect(
                automationContract.performUpkeep(performData)
            ).to.be.revertedWith("Automation not active");
        });
    });
}); 