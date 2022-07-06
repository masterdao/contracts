// SPDX-License-Identifier: MIT

pragma solidity ^0.7.3;
pragma experimental ABIEncoderV2;
import "./IERC20.sol";
import "./SafeMath.sol";
import "./SafeERC20.sol";
import "./IUniswapFactory.sol";
import "./IUniswapPair.sol";
import "./IUniswapRouter02.sol";

contract swapContract {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    address public router;

    constructor(address router_) {
        router = router_;
    }

    function autoSwapTokens(
        address token0,
        address token1,
        uint256 amountIn,
        address to
    ) public {
        address[] memory path = new address[](2);
        path[0] = token0;
        path[1] = token1;
        IERC20(token0).safeApprove(router, amountIn);
        IUniswapRouter02(router).swapExactTokensForTokensSupportingFeeOnTransferTokens(
            amountIn,
            0,
            path,
            to,
            block.timestamp.add(600)
        );
    }

    function autoSwapEthToTokens(
        address token,
        uint256 amountIn,
        address to
    ) public {
        // generate the uniswap pair path of token -> weth
        address[] memory path = new address[](2);

        path[0] = IUniswapRouter02(router).WETH();
        path[1] = token;

        // make the swap
        IUniswapRouter02(router).swapExactETHForTokensSupportingFeeOnTransferTokens(
            amountIn,
            path,
            to,
            block.timestamp.add(600)
        );
    }
    function getamountOuts(uint256 collectType,uint256 amountIn, IERC20 DAOToken,address tokenB) public view returns(uint256) {
        address pair_;
        address[] memory path = new address[](2);
        uint256[] memory amountOuts;
        uint256 amountOut; 
        address factory = IUniswapRouter02(router).factory();
        if(collectType == 1){
            pair_ = IUniswapFactory(factory).getPair(IUniswapRouter02(router).WETH(), address(DAOToken));
            //计算本次购买数量
            path[0] = IUniswapRouter02(router).WETH();
            path[1] = address(DAOToken);
            amountOuts = IUniswapRouter02(router).getAmountsOut(amountIn, path);
        }
        else{
            pair_ = IUniswapFactory(factory).getPair(tokenB, address(DAOToken));
            //计算本次购买数量
            path[0] = tokenB;
            path[1] = address(DAOToken);
            amountOuts = IUniswapRouter02(router).getAmountsOut(amountIn, path);
        }
        amountOut = amountOuts[1];
    }
}
