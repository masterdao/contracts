/** copy abis & types to dest directory */
const path = require('path');
const fs = require('fs');

async function main() {
    const contracts = [
        { artifact: 'token/ERC20.sol/ERC20', typings: 'token/ERC20', target: 'DAOERC20' },
        { artifact: 'DAOMintingPoolV2/DAOMintingPool.sol/DAOMintingPool', typings: 'DAOMintingPoolV2/DAOMintingPool', target: 'DAOMintingPool' },
        { artifact: 'IDO/ido.sol/idoCoinContract', typings: 'IDO/ido.sol/IdoCoinContract', target: 'IDO' },
        { artifact: 'IDO/idovote.sol/idovoteContract', typings: 'IDO/idovote.sol/IdovoteContract', target: 'IDOVoting' },
    ]
    const dirs = {
        artifacts: path.join(__dirname, '../artifacts/src'),
        types: path.join(__dirname, '../types'),
        dist: path.join(__dirname, '../tmp')
    }

    if (fs.existsSync(dirs.dist)) {
        fs.rmdirSync(dirs.dist, { force: true, recursive: true })
    }
    fs.mkdirSync(dirs.dist);
    fs.mkdirSync(path.join(dirs.dist, 'abi'))
    fs.mkdirSync(path.join(dirs.dist, 'types'))

    for (const contract of contracts) {
        const abi = {
            src: path.join(dirs.artifacts, contract.artifact + '.json'),
            dest: path.join(dirs.dist, 'abi', contract.target + '.json')
        }
        const typing = {
            src: path.join(dirs.types, contract.typings + '.ts'),
            dest: path.join(dirs.dist, 'types', contract.target + '.ts')
        }
        copyAbiSync(abi);
        copyTypeSync(typing);
        fs.copyFileSync(path.join(dirs.types, 'common.ts'), path.join(dirs.dist, 'types', 'common.ts'));
    }


}

function copyAbiSync({ src, dest }) {
    const json = require(src);
    fs.writeFileSync(dest, JSON.stringify(json.abi))
}

function copyTypeSync({ src, dest }) {
    const content = fs.readFileSync(src, 'utf8');
    fs.writeFileSync(dest, content.replace(/\".*?\/common\";/, '"./common";'), 'utf8');
}

main();