import { HardhatRuntimeEnvironment } from 'hardhat/types';
import { DeployFunction } from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts, ethers, deployConfig: cfg } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();
  const {
    contracts: { tool },
  } = cfg;

  await deploy(tool.name, {
    from: deployer,
    args: [],
  });
};

export default func;
