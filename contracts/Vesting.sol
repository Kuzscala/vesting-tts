// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./Token.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract Vesting {
    using SafeERC20 for IERC20;

    IERC20 private _token;

    constructor (address token) {
        require(token != address(0), "Vesting: token address must not be 0");
        _token = IERC20(token);
    }
}