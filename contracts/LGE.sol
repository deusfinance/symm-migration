// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

import "./interfaces/IMigrator.sol";
import "./interfaces/ISwapRouter.sol";

contract LGE is
    Initializable,
    PausableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");
    bytes32 public constant WITHDRAWER_ROLE = keccak256("WITHDRAWER_ROLE");
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    address public constant deus = 0xDE5ed76E7c05eC5e4572CfC88d1ACEA165109E44;
    address public constant usdc = 0xaf88d065e77c8cC2239327C5EDb3A432268e5831;
    address public constant router = 0xAA23611badAFB62D37E7295A682D21960ac85A90;
    address public constant migrator =
        0xe3b6CC7b76a7f67BBCcb66c010780bE0AF31Ff05;

    function initialize(address _admin) external initializer {
        __Pausable_init();
        __AccessControlEnumerable_init();

        _grantRole(DEFAULT_ADMIN_ROLE, _admin);

        IERC20Upgradeable(usdc).approve(router, type(uint256).max);
        IERC20Upgradeable(deus).approve(migrator, type(uint256).max);
    }

    function pause() external onlyRole(PAUSER_ROLE) whenNotPaused {
        _pause();
    }

    function unpause() external onlyRole(UNPAUSER_ROLE) {
        _unpause();
    }


    /*
        - Add event
        - Store total USDC and total DEUS
        - Total USDC & DEUS per user
    */

    function deposit(
        uint256 amount,
        uint256 minAmountOut,
        address[] memory tokens,
        uint256[] memory shares,
        IMigrator.MigrationPreference[] memory migrationPreferences,
        address receiver
    ) external {
        ISwapRouter(router).exactInputSingle(
            ISwapRouter.ExactInputSingleParams({
                tokenIn: usdc,
                tokenOut: deus,
                fee: 3000,
                recipient: address(this),
                deadline: block.timestamp,
                amountIn: amount,
                amountOutMinimum: minAmountOut,
                sqrtPriceLimitX96: 0
            })
        );

        uint256 deusBalance = IERC20Upgradeable(usdc).balanceOf(address(this));
        require(deusBalance > minAmountOut, "!MinAmountOut");

        uint256 totalShare = 0;
        for (uint256 i = 0; i < shares.length; ++i) {
            totalShare += shares[i];
        }

        uint256[] memory amounts = new uint256[](shares.length);
        for (uint256 i = 0; i < shares.length; ++i) {
            amounts[i] = (shares[i] * deusBalance) / totalShare;
        }

        IMigrator(migrator).deposit(
            tokens,
            amounts,
            migrationPreferences,
            receiver
        );
    }
}
