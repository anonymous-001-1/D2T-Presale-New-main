// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "hardhat/console.sol";

interface IUniswapV2Router01 {
    function factory() external pure returns (address);

    function WETH() external pure returns (address);

    function addLiquidity(
        address tokenA,
        address tokenB,
        uint256 amountADesired,
        uint256 amountBDesired,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    )
        external
        returns (
            uint256 amountA,
            uint256 amountB,
            uint256 liquidity
        );

    function addLiquidityETH(
        address token,
        uint256 amountTokenDesired,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    )
        external
        payable
        returns (
            uint256 amountToken,
            uint256 amountETH,
            uint256 liquidity
        );

    function removeLiquidity(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountA, uint256 amountB);

    function removeLiquidityETH(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountToken, uint256 amountETH);

    function removeLiquidityWithPermit(
        address tokenA,
        address tokenB,
        uint256 liquidity,
        uint256 amountAMin,
        uint256 amountBMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountA, uint256 amountB);

    function removeLiquidityETHWithPermit(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountToken, uint256 amountETH);

    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function quote(
        uint256 amountA,
        uint256 reserveA,
        uint256 reserveB
    ) external pure returns (uint256 amountB);

    function getAmountOut(
        uint256 amountIn,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountOut);

    function getAmountIn(
        uint256 amountOut,
        uint256 reserveIn,
        uint256 reserveOut
    ) external pure returns (uint256 amountIn);

    function getAmountsOut(uint256 amountIn, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);

    function getAmountsIn(uint256 amountOut, address[] calldata path)
        external
        view
        returns (uint256[] memory amounts);
}

interface IUniswapV2Router02 is IUniswapV2Router01 {
    function removeLiquidityETHSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline
    ) external returns (uint256 amountETH);

    function removeLiquidityETHWithPermitSupportingFeeOnTransferTokens(
        address token,
        uint256 liquidity,
        uint256 amountTokenMin,
        uint256 amountETHMin,
        address to,
        uint256 deadline,
        bool approveMax,
        uint8 v,
        bytes32 r,
        bytes32 s
    ) external returns (uint256 amountETH);

    function swapExactTokensForTokensSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;

    function swapExactETHForTokensSupportingFeeOnTransferTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable;

    function swapExactTokensForETHSupportingFeeOnTransferTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external;
}

contract D2TPresale is Ownable, ReentrancyGuard {
    using SafeERC20 for ERC20;

    ERC20 public D2TToken;
    ERC20 public USDTToken;
    IUniswapV2Router02 public router;
    uint256 public presaleStartTime;
    uint256 public presaleEndTime;
    bool public isPresaleEnded = false;
    address private constant USDT_ADDRESS =
        0xdAC17F958D2ee523a2206206994597C13D831ec7;

    uint256[9] public TOKEN_AMOUNT = [
        35000000,
        105000000,
        175000000,
        262500000,
        350000000,
        437500000,
        525000000,
        612500000,
        700000000
    ];
    uint256[9] public TOKEN_PRICE = [
        40000,
        47500,
        49500,
        50500,
        52500,
        54500,
        57500,
        68500,
        64500
    ];
    uint256 public constant MINIMUM_TOKEN_COUNT = 1000;
    uint256 public constant MAXIMUM_TOKEN_COUNT = 50000000;
    uint256 public currentStep = 0;
    uint256 public totalSoldTokenAmount;

    mapping(address => uint256) public tokenBalance;

    bool public isClaimEnabled = false;

    event BoughtD2TTokens(uint256 amount, address);

    modifier isPresaleNotEnded() {
        require(!isPresaleEnded, "Presale is ended");
        require(block.timestamp <= presaleEndTime, "Presale is ended");
        _;
    }

    constructor(
        address _D2TTokenAddress,
        address _router,
        uint256 _duration
    ) {
        D2TToken = ERC20(_D2TTokenAddress);
        USDTToken = ERC20(USDT_ADDRESS);
        router = IUniswapV2Router02(_router);

        presaleStartTime = block.timestamp;
        presaleEndTime = block.timestamp + _duration * 1 days;
    }

    function deposit(uint256 amount) public onlyOwner {
        D2TToken.transferFrom(msg.sender, address(this), amount);
    }

    function closePresale() public onlyOwner {
        isPresaleEnded = true;
        presaleEndTime = block.timestamp;
    }

    function withdrawD2TToken(uint256 amount) public onlyOwner {
        uint256 balance = D2TToken.balanceOf(address(this));
        require(
            balance - amount > totalSoldTokenAmount,
            "Can't withdraw that much"
        );
        D2TToken.transfer(msg.sender, amount);
    }

    function enableClaim() public onlyOwner {
        isClaimEnabled = true;
    }

    function claim() public nonReentrant {
        require(block.timestamp > presaleEndTime, "Presale is in progress");
        require(isClaimEnabled, "Claim is not enabled");

        if (tokenBalance[msg.sender] == 0) return;

        D2TToken.transfer(msg.sender, tokenBalance[msg.sender]);
        tokenBalance[msg.sender] = 0;
    }

    function buyD2TTokenWithETH(uint256 tokenCount)
        public
        payable
        isPresaleNotEnded
    {
        require(
            tokenCount >= MINIMUM_TOKEN_COUNT &&
                tokenCount <= MAXIMUM_TOKEN_COUNT,
            "You have to buy more than 1000 tokens, less than 50000000 tokens"
        );

        uint256 USDTAmount = getUSDTAmount(tokenCount);
        uint256 ETHAmount = getETHAmount(USDTAmount);
        require(msg.value >= ETHAmount, "Insufficient ETH amount.");
        totalSoldTokenAmount += tokenCount;
        tokenBalance[msg.sender] += tokenCount * 10**D2TToken.decimals();
        if (totalSoldTokenAmount > TOKEN_AMOUNT[currentStep]) currentStep += 1;

        emit BoughtD2TTokens(tokenCount, msg.sender);
    }

    function buyD2TTokenWithUSDT(uint256 tokenCount) public isPresaleNotEnded {
        require(
            tokenCount >= MINIMUM_TOKEN_COUNT &&
                tokenCount <= MAXIMUM_TOKEN_COUNT,
            "You have to buy more than 1000 tokens, less than 50000000 tokens"
        );

        uint256 USDTAmount = getUSDTAmount(tokenCount);
        USDTToken.safeTransferFrom(msg.sender, address(this), USDTAmount);
        totalSoldTokenAmount += tokenCount;
        tokenBalance[msg.sender] += tokenCount * 10**D2TToken.decimals();
        if (totalSoldTokenAmount > TOKEN_AMOUNT[currentStep]) currentStep += 1;

        emit BoughtD2TTokens(tokenCount, msg.sender);
    }

    function getETHAmount(uint256 _usdtAmount) public view returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = USDT_ADDRESS;

        uint256[] memory result;
        result = router.getAmountsIn(_usdtAmount, path);

        return result[0];
    }

    function getUSDTAmount(uint256 tokenCount)
        public
        view
        isPresaleNotEnded
        returns (uint256)
    {
        uint256 USDTAmount;
        if (tokenCount + totalSoldTokenAmount > TOKEN_AMOUNT[currentStep]) {
            require(currentStep < 8, "Insufficient token amount.");
            uint256 tokenAmountForCurrentPrice = TOKEN_AMOUNT[currentStep] -
                totalSoldTokenAmount;
            USDTAmount =
                tokenAmountForCurrentPrice *
                TOKEN_PRICE[currentStep] +
                (tokenCount - tokenAmountForCurrentPrice) *
                TOKEN_PRICE[currentStep + 1];
        } else USDTAmount = tokenCount * TOKEN_PRICE[currentStep];
        return USDTAmount;
    }

    function balanceOf() public view returns (uint256[2] memory) {
        return [address(this).balance, USDTToken.balanceOf(address(this))];
    }

    function withdrawUSDT() public onlyOwner {
        //onlyOwner
        swapETHforUSDT();

        uint256 totalBalance = USDTToken.balanceOf(address(this));
        USDTToken.safeTransfer(msg.sender, totalBalance);
    }

    function swapETHforUSDT() private {
        uint256 ETHBalance = address(this).balance;
        if (ETHBalance == 0) return;

        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = USDT_ADDRESS;

        router.swapExactETHForTokensSupportingFeeOnTransferTokens{
            value: ETHBalance
        }(
            0, // accept any amount of USDT
            path,
            address(this),
            block.timestamp
        );
    }
}
