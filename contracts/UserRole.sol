pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";

// compile success??

contract UserRole is Ownable {
    struct User {
        bool isUser;
        uint256 amount;
    }
    mapping(address => User) private _users;

    event AddUser(address indexed account, uint256 indexed amount);
    event AddManyUser(address[] indexed accounts, uint256[] indexed amounts);
    event RemoveUser(address indexed account);

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

    function addManyUser(address[] memory accounts, uint256[] memory amounts)
        public
        onlyOwner
        returns (bool ok)
    {
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
