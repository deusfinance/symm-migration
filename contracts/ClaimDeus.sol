// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlEnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/interfaces/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ClaimDeus is
    Initializable,
    PausableUpgradeable,
    AccessControlEnumerableUpgradeable
{
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UNPAUSER_ROLE = keccak256("UNPAUSER_ROLE");
    bytes32 public constant DEPOSITOR_ROLE = keccak256("DEPOSITOR_ROLE");
    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    address public DEUS;
    bytes32 public merkleRoot;
    uint256 public deusBalance;

    // total claimed deus
    uint256 public totalClaimedDeus;
    // total claimed deus by user
    mapping(address => uint256) public claimedDeus;

    event Deposit(uint256 amount);
    event Claim(address user, uint256 amount);
    event SetMerkleRoot(bytes32 merkleRoot);

    error InvalidProof();
    error NotEnoughDEUS();

    function initialize(address DEUS_, bytes32 merkleRoot_, address admin) external initializer {
        __Pausable_init();
        __AccessControlEnumerable_init();

        DEUS = DEUS_;
        merkleRoot = merkleRoot_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    // ----------------- Restricted Functions -----------------

    function pause() external onlyRole(PAUSER_ROLE) whenNotPaused {
        _pause();
    }

    function unpause() external onlyRole(UNPAUSER_ROLE) {
        _unpause();
    }

    function setMerkleRoot(bytes32 merkleRoot_) external onlyRole(SETTER_ROLE) {
        merkleRoot = merkleRoot_;
        emit SetMerkleRoot(merkleRoot_);
    }

    function deposit(
        uint256 amount
    ) external whenNotPaused onlyRole(DEPOSITOR_ROLE) {
        IERC20Upgradeable(DEUS).safeTransferFrom(msg.sender, address(this), amount);
        deusBalance += amount;
        emit Deposit(amount);
    }

    // ----------------- Public Functions -----------------

    function claim(
        uint256 amount,
        bytes32[] memory proof
    ) external whenNotPaused {
        if (
            !MerkleProof.verify(
                proof,
                merkleRoot,
                keccak256(abi.encode(msg.sender, amount))
            )
        ) revert InvalidProof();

        uint256 claimableAmount = amount - claimedDeus[msg.sender];
        if(claimableAmount > deusBalance) revert NotEnoughDEUS();

        claimedDeus[msg.sender] = amount;

        IERC20Upgradeable(DEUS).safeTransfer(msg.sender, claimableAmount);
        deusBalance -= claimableAmount;
        totalClaimedDeus += claimableAmount;

        emit Claim(msg.sender, claimableAmount);
    }
}
