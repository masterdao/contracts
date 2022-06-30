const fs = require('fs');
const path = require('path');
const config = require('../deployment.config')

function main() {
  const dirs = {
    deployments: path.resolve(__dirname, '../deployments')
  }

  if (fs.existsSync(dirs.deployments)) {
    const networks = fs.readdirSync(dirs.deployments);
    for (const network of networks) {
      buildArtifactForNetwork(path.join(dirs.deployments, network))
    }
  }
}

function buildArtifactForNetwork(dir) {
  const daoAddress = config.contracts.dao.address
  let sols = [daoAddress? null :'ERC20', 'DAOMintingPool', 'idovoteContract', 'idoCoinContract', 'swapContract'].filter(i => i);

  const out = {
    router: {
      address: config.contracts.swap.deploy.router
    },
  }

  if(daoAddress) {
    Object.assign(out, {
      dao: {
        address: daoAddress
      }
    })
  }

  for (const sol of sols) {
    try {
      const json = require(path.join(dir, sol + '.json'));
      const lite = {}
      lite.address = json.address
      lite.abi = json.abi
      out[sol] = lite
    } catch (e) {
      // just ignore error
    }
  }

  fs.writeFileSync(path.join(dir, 'artifact.js'), `var artifact=${JSON.stringify(out)}`)
}

main()