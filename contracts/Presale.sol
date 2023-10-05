// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IMigrator.sol";
import "./interfaces/ISwapRouter.sol";

import 'hardhat/console.sol';

contract Presale is
    Initializable,
    PausableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");

    address public constant DEUS = 0xDE5ed76E7c05eC5e4572CfC88d1ACEA165109E44;
    address public constant USDC = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address public constant router = 0xAA23611badAFB62D37E7295A682D21960ac85A90;
    address public constant migrator =
        0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05;

    uint256 public totalUSDC;
    uint256 public totalDEUS;

    mapping(address => uint256) public userUSDC;
    mapping(address => uint256) public userDEUS;

    event Buy(
        address caller,
        uint256 USDCAmount,
        uint256 DEUSAmount,
        address receiver
    );

    function initialize(address _admin) external initializer {
        __Pausable_init();
        __AccessControlEnumerable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

        IERC20Upgradeable(USDC).approve(router, type(uint256).max);
        IERC20Upgradeable(DEUS).approve(migrator, type(uint256).max);
    }

    function pause() external onlyRole(PAUSER_ROLE) whenNotPaused {
        _pause();
    }

    function unpause() external onlyRole(UNPAUSER_ROLE) {
        _unpause();
    }

    function buy(
        uint256 amount,
        uint256 minAmountOut,
        uint160 sqrtPriceLimitX96,
        address receiver
    ) external whenNotPaused {
        IERC20Upgradeable(USDC).safeTransferFrom(
            msg.sender,
            address(this),
            amount
        );

        ISwapRouter(router).exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: USDC,
                tokenOut: DEUS,
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: sqrtPriceLimitX96
            })
        );

        uint256 DEUSBalance = IERC20Upgradeable(DEUS).balanceOf(address(this));
        require(DEUSBalance > minAmountOut, "!MinAmountOut");

        address[] memory tokens = new address[](1);
        tokens[0] = DEUS;

        uint256[] memory amounts = new uint256[](1);
        amounts[0] = DEUSBalance;

        IMigrator.MigrationPreference[]
            memory migrationPreferences = new IMigrator.MigrationPreference[](
                1
            );
        migrationPreferences[0] = IMigrator.MigrationPreference.SYMM;

        IMigrator(migrator).deposit(
            tokens,
            amounts,
            migrationPreferences,
            receiver
        );

        totalDEUS += DEUSBalance;
        totalUSDC += amount;
        userDEUS[receiver] += DEUSBalance;
        userUSDC[receiver] += amount;

        emit Buy(msg.sender, amount, DEUSBalance, receiver);
    }
}
