// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20 {
    address public holder;

    constructor() ERC20("VerySimpleToken", "VST") {
        holder = msg.sender;
        _mint(msg.sender, 10000 * (10**decimals()));
    }
}
