import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function ({
  deployments,
  getNamedAccounts,
  getChainId,
  getUnnamedAccounts,
}: HardhatRuntimeEnvironment) {
  //   const { deploy } = deployments;
  //   const { deployer } = await getNamedAccounts();
  //   console.log('deploy dao', deployer);
  //   const accounts = await getUnnamedAccounts();
  //   for (const acc of accounts) {
  //     console.log(acc);
  //   }
  // await deploy('token/ERC20.sol#ERC20', {
  //   from: deployer,
  //   args: [deployer],
  // });
};
export default func;
