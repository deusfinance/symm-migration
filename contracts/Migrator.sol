// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";

contract Migrator is
    Initializable,
    PausableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    enum Project {
        AUTO, // 0
        DEUS, // 1
        SYMM // 2
    }

    struct Migration {
        address user;
        address token;
        uint256 amount;
        uint256 timestamp;
        uint256 block;
        Project project;
    }

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");

    // total migrated amount by token address by project
    mapping(Project => mapping(address => uint256)) public totalMigratedAmount;

    // user migrated amount: project => user => token => amount
    mapping(Project => mapping(address => mapping(address => uint256)))
        public migratedAmount;

    // list of user migrations
    mapping(address => Migration[]) public migrations;

    event Migrate(
        address[] token,
        uint256[] amount,
        Project[] projects,
        address receiver
    );

    function initialize(address _admin) external initializer {
        __Pausable_init();
        __AccessControlEnumerable_init();

        _grantRole(PAUSER_ROLE, _admin);
        _grantRole(DEFAULT_ADMIN_ROLE, _admin);
    }

    function pause() external onlyRole(PAUSER_ROLE) whenNotPaused {
        _pause();
    }

    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    function migrate(
        address[] memory tokens,
        uint256[] memory amounts,
        Project[] memory projects,
        address receiver
    ) external whenNotPaused {
        for (uint256 i; i < tokens.length; ++i) {
            IERC20Upgradeable(tokens[i]).safeTransferFrom(
                msg.sender,
                address(this),
                amounts[i]
            );

            totalMigratedAmount[projects[i]][tokens[i]] += amounts[i];
            migratedAmount[projects[i]][receiver][tokens[i]] += amounts[i];

            migrations[receiver].push(
                Migration({
                    user: receiver,
                    token: tokens[i],
                    amount: amounts[i],
                    timestamp: block.timestamp,
                    block: block.number,
                    project: projects[i]
                })
            );
        }

        emit Migrate(tokens, amounts, projects, receiver);
    }

    function getUserMigrations(
        address user
    ) external view returns (Migration[] memory userMigrations) {
        userMigrations = new Migration[](migrations[user].length);
        for (uint256 i; i < userMigrations.length; ++i) {
            userMigrations[i] = migrations[user][i];
        }
    }
}
