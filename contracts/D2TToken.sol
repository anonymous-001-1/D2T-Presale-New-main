// SPDX-License-Identifier: MIT

pragma solidity ^0.8.7;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract D2T is Ownable, ERC20 {
    using SafeMath for uint256;

    uint256 public constant MAX_SUPPLY = 1e9 * 10**18;

    constructor() ERC20("Dash2Trade", "D2T") {}

    function mint(address _to, uint256 _amount) external onlyOwner {
        require(_to != address(0), "Null address");
        require(totalSupply() + _amount < MAX_SUPPLY, "Max supply exceeded");

        _mint(_to, _amount);
    }

    function burn(address _from, uint256 _amount) external onlyOwner {
        require(_from != address(0), "Null address");
        _burn(_from, _amount);
    }
}
