import { extendEnvironment, HardhatUserConfig, subtask } from 'hardhat/config';
import { validate } from 'jsonschema';
import deepmerge from 'deepmerge';
import { HardhatRuntimeEnvironment } from 'hardhat/types';
import yaml from 'yaml';
import fs from 'fs';
import path from 'path';

declare module 'hardhat/types' {
  export interface HardhatRuntimeEnvironment {
    deployConfig: {
      accounts: string[];
      networks: {
        [key: string]: {
          url: string;
          overrides?: {};
        };
      };
      contracts: {
        dao: {
          name: string;
          deploy: {
            name: string;
            symbol: string;
          };
          address?: string;
          multsign: {
            enabled: boolean;
            accounts: string;
            count: number;
          };

          mint: {
            enabled: boolean;
            count: number;
          };

          airdrop: {
            enabled: boolean;
            count: number;
            whiteList: string[];
          };
        };
        vedao: {
          name: string;
          deploy: {};
          addPoolTypes: {
            enabled: boolean;
            items: Array<{ length: number; weight: number }>;
          };
          addPools: {
            enabled: boolean;
            items: Array<{
              lpToken: string;
              multiple: number;
              poolTypeId: number;
            }>;
          };
          addBonusToken: {
            enabled: true;
            items: Array<[string, string, number, number]>;
          };
        };
        voting: {
          name: string;
          deploy: any;
          setVoteTime: {
            enabled: boolean;
            value: number;
          };
          setPassingRate: {
            enabled: boolean;
            value: number;
          };
          setVotingRate: {
            enabled: boolean;
            value: number;
          };
        };
        swap: {
          name: string;
          deploy: {
            router: string;
          };
        };
        ido: {
          name: string;
          deploy: any;
          setPlan: {
            enabled: boolean;
            items: Array<number[]>;
          };
          setRegisterAmount: {
            enabled: boolean;
            value: number;
          };
          setIpoTime: {
            enabled: boolean;
            value: number;
          };
        };
      };
    };
  }
}

function loadYamlConfigSync(filename: string) {
  const cfgFile = path.join(process.cwd(), 'deployment.yaml');
  if (!fs.existsSync(cfgFile)) {
    throw `deployment configurtion file ${cfgFile} not exists`;
  }
  const content = fs.readFileSync(cfgFile, 'utf-8') || '{}';
  // TODO: replace environment variables
  return yaml.parse(content);
}

extendEnvironment((hre: HardhatRuntimeEnvironment) => {
  if (hre.deployments) {
    const dir = process.cwd();
    loadYamlConfigSync(path.join(process.cwd(), 'deployment.yaml'));
    const cfg = require(dir + '/deployment.config');
    const schema = require(dir + '/deployment.schema');
    if (schema) {
      const res = validate(cfg, schema);
      if (!res.valid) {
        const err = new Error(`deployment config validation error`) as any;
        err.details = res.errors;
        throw err;
      }
      console.log('valid', res.valid);
    }
    const { deployments } = hre;
    const networkname = deployments.getNetworkName();
    const network = cfg.networks[networkname];
    if (network?.overrides) {
      cfg.contracts = deepmerge(cfg.contracts, network.overrides);
    }
    hre.deployConfig = cfg;
  }
});
