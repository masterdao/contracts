import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  getChainId,
  getUnnamedAccounts,
}: HardhatRuntimeEnvironment) {
  const { deploy } = deployments;

  const { deployer } = await getNamedAccounts();

  const res = await deploy('src/token/ERC20.sol:ERC20', {
    from: deployer,
    args: ['DAO Token', 'DAO'],
  });
  console.log('deployed DAO', res.address);
};
export default func;
