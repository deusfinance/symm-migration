// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

interface IMigrator {
    enum MigrationPreference {
        BALANCED, // 0
        DEUS, // 1
        SYMM // 2
    }

    function deposit(
        address[] memory tokens,
        uint256[] memory amounts,
        MigrationPreference[] memory migrationPreferences,
        address receiver
    ) external;
}
