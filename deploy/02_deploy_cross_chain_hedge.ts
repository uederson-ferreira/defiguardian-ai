import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const CHAINLINK_CCIP_ROUTER: { [key: string]: string } = {
    avalanche: '0x0b63fE56972b11c8f8c0cA2E445C63eDb4c8E6da',
    fuji: '0x554472a2720e5e7d5d3c817529aba05eed5f82d8',
    sepolia: '0xD0daae2231E9CB96b94C8512223533293C3693Bf'
};

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts } = hre;
    const { deploy } = deployments;
    const { deployer } = await getNamedAccounts();

    // Obtém o endereço do router CCIP baseado na rede
    const routerAddress = CHAINLINK_CCIP_ROUTER[hre.network.name];
    if (!routerAddress) {
        throw new Error(`Router CCIP não configurado para a rede ${hre.network.name}`);
    }

    console.log(`Deployando CrossChainHedge na rede ${hre.network.name}...`);
    console.log(`Usando CCIP Router: ${routerAddress}`);

    // Deploy CrossChainHedge
    const crossChainHedge = await deploy('CrossChainHedge', {
        from: deployer,
        args: [routerAddress],
        log: true,
        waitConfirmations: 1
    });

    console.log(`CrossChainHedge deployado em: ${crossChainHedge.address}`);

    // Verifica o contrato se não estiver na rede de teste local
    if (hre.network.name !== 'hardhat' && hre.network.name !== 'localhost') {
        try {
            await hre.run('verify:verify', {
                address: crossChainHedge.address,
                constructorArguments: [routerAddress]
            });
            console.log('Contrato verificado com sucesso no Etherscan');
        } catch (error) {
            console.log('Erro na verificação do contrato:', error);
        }
    }
};

export default func;
func.tags = ['CrossChainHedge']; 