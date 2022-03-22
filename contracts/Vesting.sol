// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
    using SafeERC20 for IERC20;

    uint32 private constant SECONDS_PER_DAY = 24 * 60 * 60;

    IERC20 private _token;

    address tokenAddress;

    uint32 private _startDate;
    uint32 private _cliffPeriod; /* Duration of the cliff, with respect to the grant start day, in days. */
    uint32 private _interval; /* Duration in days of the vesting interval. */
    uint32 private _milestones;
    bool private _isSetSchedule;

    struct User {
        uint256 amount;
        uint256 amountClaimed;
    }
    mapping(address => User) private _users;

    event AddUser(address indexed account, uint256 indexed amount);
    event AddManyUser(address[] indexed accounts, uint256[] amounts);
    event RemoveUser(address indexed account);
    event SetVestingSchedule(
        uint32 startDate,
        uint32 cliffPeriod,
        uint32 interval,
        uint32 milestones
    );
    event WithdrawToken();

    constructor(address token) {
        require(token != address(0), "Vesting: token address must not be 0");
        _token = IERC20(token);
        tokenAddress = token; // fix later
        _isSetSchedule = false;
    }

    modifier onlyUser() {
        //  require(); /* */
        _;
    }

    function setVestingSchedule(
        uint32 startDate,
        uint32 cliffPeriod,
        uint32 interval,
        uint32 milestones
    ) public returns (bool ok) {
        require(
            startDate > 0 && cliffPeriod > 0 && interval > 0 && milestones > 0,
            "Vesting: Invalid input!"
        );
        require(cliffPeriod % interval == 0, "Vesting: Invalid cliff period");
        require(_isSetSchedule == false, "Vesting: can't set schedule yet");

        _startDate = startDate;
        _cliffPeriod = cliffPeriod;
        _interval = interval;
        _milestones = milestones;
        _isSetSchedule = true;

        emit SetVestingSchedule(startDate, cliffPeriod, interval, milestones);
        return true;
    }

    function isSetVestingSchedule() public view returns (bool) {
        return _isSetSchedule;
    }

    function withdrawToken() public payable onlyUser returns (bool ok) {
        require(
            tokenCanWithdraw(msg.sender) > 0,
            "Vesting: Insufficient amount to withdraw"
        );


        _users[msg.sender].amountClaimed += tokenCanWithdraw(msg.sender);

        _token.safeTransfer(msg.sender, tokenCanWithdraw(msg.sender));

        emit WithdrawToken();

        return true;
    }

    function vestingOf(address account)
        public
        view
        onlyUser
        onlyOwner
        returns (uint256 claim, uint256 remain)
    {
        return (tokenClaimed(account), tokenRemained(account));
    }

    ///// Calculating section

    function _today() private view returns (uint32 dayNumber) {
        return uint32(block.timestamp / SECONDS_PER_DAY);
    }

    function tokenRemained(address account) public view returns (uint256) {
        uint32 onday = _today();
        User memory user = _users[account];

        //if user has no schedule or before cliff, then full
        if (!_isSetSchedule || onday < _startDate + _cliffPeriod) {
            return user.amount;
        }
        //if after end of vesting, return 0
        else if (onday >= _startDate + _interval * _milestones) {
            return uint256(0);
        }
        // otherwise, calcute
        else {
            uint32 daysVested = onday - _startDate;
            uint32 milestonesVested = (daysVested - _cliffPeriod) / _interval;

            uint256 vested = (user.amount * (milestonesVested + 1)) /
                _milestones;
            return (user.amount - vested);
        }
    }

    function tokenClaimed(address account) public view returns (uint256) {
        return (_users[account].amount - tokenRemained(account));
    }

    function tokenCanWithdraw(address account) public view returns (uint256) {
        return (tokenClaimed(account) - _users[account].amountClaimed);
    }

    ///////// User Handle Section

    function addUser(address account, uint256 amount)
        public
        onlyOwner
        returns (bool ok)
    {
        require(amount > 0, "Vesting: Insufficient amount");

        _users[account].amount = amount;
        _users[account].amountClaimed = 0;
        emit AddUser(account, amount);
        return true;
    }

    function isUser(address account) public view onlyOwner returns (bool) {
        return _users[account].amount > 0;
    }

    function checkBalance(address account)
        public
        view
        onlyOwner
        returns (uint256)
    {
        return _users[account].amount;
    }

    function checkClaimedAmount(address account)
        public
        view
        onlyOwner
        returns (uint256)
    {
        return _users[account].amountClaimed;
    }

    function addManyUser(address[] memory accounts, uint256[] memory amounts)
        public
        onlyOwner
        returns (bool ok)
    {
        //require acc, amount length > 0
        require(
            accounts.length > 0 && amounts.length > 0,
            "Vesting: null array input"
        );
        require(accounts.length == amounts.length, "Vesting: Not equal length");

        for (uint256 index = 0; index < accounts.length; index++) {
            addUser(accounts[index], amounts[index]);
        }
        return true;
    }

    function removeUser(address account) public onlyOwner returns (bool ok) {
        require( // can remove user if now is before vesting or schedule is not set
            _startDate >= (block.timestamp / SECONDS_PER_DAY) ||
                _startDate == 0,
            "Vesting: can't remove user when vesting"
        ); 

        _users[account].amount = 0;
        _users[account].amountClaimed = 0;
        emit RemoveUser(account);
        return true;
    }
}
