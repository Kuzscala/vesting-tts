// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract Vesting is Ownable {
    using SafeERC20 for IERC20;

    IERC20 private _token;
    address tokenAddress;

    uint32 private constant SECONDS_PER_DAY = 24 * 60 * 60; 
    //mapping(address => bool)private isUser;

    uint32 private _startDate;
    uint32 private _cliffPeriod; /* Duration of the cliff, with respect to the grant start day, in days. */
    uint32 private _interval; /* Duration in days of the vesting interval. */
    uint32 private _milestones;
    bool private _isSetSchedule;



    struct User {
        bool isUser; //TODO không cần, check xem có phải user trong pool hay không thì dùng u.amount > 0 là được. hàm remove set u.amount = 0
        uint256 amount;
        uint256 amountClaimed;
        //bool hasSchedule;
    }
    mapping(address => User) private _users;
    //mapping(address => vestingSchedule) private _vestingSchedules;


    //TODO event bên dưới khai báo hết lên đây đi e, uint256 thì không cần indexed thôi
    event AddUser(address indexed account, uint256 indexed amount);
    event AddManyUser(address[] indexed accounts, uint256[] indexed amounts);
    event RemoveUser(address indexed account);



    constructor(address token) {
        require(token != address(0), "Vesting: token address must not be 0");
        _token = IERC20(token);
        tokenAddress = token; // fix later
        _isSetSchedule=false;
    }

    modifier onlyUser() {
        //  require(); /* */
        _;
    }

    //TODO indexed làm gì?
    event SetVestingSchedule(        
        uint32 indexed startDate,
        uint32 indexed cliffPeriod,
        uint32 indexed interval,
        uint32 milestones
    );

    function setVestingSchedule(
        uint32 startDate,
        uint32 cliffPeriod,
        uint32 interval,
        uint32 milestones
    ) public returns (bool ok) {
        //TODO check xem vesting pool đã đc set trước đó chưa. Không set schedule 2 lần
        //exception string theo format: tên contract : text. Ở constructor a có viết mẫu đấy.
        require(
            startDate > 0 && cliffPeriod > 0 && interval > 0 && milestones > 0,
            "Invalid input!"
        );
        require(cliffPeriod % interval == 0, "Invalid cliff period");

        _startDate=startDate;
        _cliffPeriod=cliffPeriod;
        _interval=interval;
        _milestones=milestones;
        _isSetSchedule=true;

        emit SetVestingSchedule(          
            startDate,
            cliffPeriod,
            interval,
            milestones
        );
        return true;
    }

    event WithdrawToken();

    function withdrawToken() public onlyUser returns(bool ok) {
        require(_tokenCanWithdraw(msg.sender) > 0);

        //Dùng safeTransfer thay vì transfer
        bool txn = _token.transfer(msg.sender,_tokenCanWithdraw(msg.sender));

        emit WithdrawToken();

        return txn;

    }

    function vestingOf(address account) public view onlyUser onlyOwner returns (uint256 claim,uint256 remain) {
        return (_tokenClaimed(account),_tokenRemained(account));
    }

///// Calculating section

    function _today() private view returns (uint32 dayNumber) {
        return uint32(block.timestamp / SECONDS_PER_DAY);
    }


    function _tokenRemained(address account) private view returns (uint256){

        uint32 onday = _today();
        User memory user = _users[account];


        //if user has no schedule or before cliff, then full
        if(!_isSetSchedule || onday < _startDate + _cliffPeriod){
            return user.amount;
        }
        //if after end of vesting, return total - amountClaimed
        else if(onday >= _startDate + _interval * _milestones){
            return uint256(0);
        }
        // otherwise, calcute
        else{
            uint32 daysVested = onday - _startDate;
            uint32 effectiveDaysVested = (daysVested / _interval) * _interval;

           // uint256 vested = user.amount * effectiveDaysVested / // not done yet
        }
      //  return (user.amount - effectiveDaysVested);  //hơi đụt but fix later
        return uint256(0);
    }
    function _tokenClaimed(address account) private view returns(uint256){
        
        //User memory user = _users[account];

        return (_users[account].amount - _tokenRemained(account));

    }

    function _tokenCanWithdraw(address account) private view returns(uint256){
        return uint256(0);
    }


    
    ///////// User Handle

    function addUser(address account, uint256 amount)
        public
        onlyOwner
        returns (bool ok)
    {
        _users[account].isUser = true;
        _users[account].amount = amount;
        emit AddUser(account, amount);
        return true;
    }

    function isUser(address account) public view onlyOwner returns (bool) {
        return _users[account].isUser;
    }

    function checkBalance(address account)
        public
        view
        onlyOwner
        returns (uint256)
    {
        return _users[account].amount;
    }

    // function checkSchedule(address account)public view onlyOwner returns (bool) {
    //     return _users[account].hasSchedule;
    // } 

    //TODO hàm này trong vòng for gọi lại addUser là được mà? ko cần event AddManyUser đâu.
    function addManyUser(address[] memory accounts, uint256[] memory amounts)
        public
        onlyOwner
        returns (bool ok)
    {
        //require acc, amount length > 0
        require(accounts.length == amounts.length);

        address account;
        for (uint256 index = 0; index < accounts.length; index++) {
            account = accounts[index];

            _users[account].isUser = true;
            //_users[account].amount = amounts[index];
        }
        emit AddManyUser(accounts, amounts);
        return true;
    }

    function removeUser(address account) public onlyOwner returns (bool ok) {
        //require(); /* trước ngày bắt đầu vesting contract */

        _users[account].isUser = false;
        _users[account].amount = 0;
        emit RemoveUser(account);
        return true;
    }
}
