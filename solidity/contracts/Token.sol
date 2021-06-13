// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

contract Token {
    // https://gist.github.com/giladHaimov/8e81dbde10c9aeff69a1d683ed6870be#file-basicerc20-sol

    // string public constant name = "ERC20Basic";
    // string public constant symbol = "BSC";
    // uint8 public constant decimals = 18;

    event Approval(
        address indexed tokenOwner,
        address indexed spender,
        uint256 tokens
    );

    event Transfer(address indexed from, address indexed to, uint256 tokens);

    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowed;

    uint256 private total;

    constructor(uint256 _total) {
        total = _total;
        balances[msg.sender] = total;
    }

    function totalSupply() public view returns (uint256) {
        return total;
    }

    function balanceOf(address tokenOwner) public view returns (uint256) {
        return balances[tokenOwner];
    }

    function transfer(address receiver, uint256 numTokens)
        public
        returns (bool)
    {
        require(
            numTokens <= balances[msg.sender],
            "sender has insufficient funds"
        );

        balances[msg.sender] = balances[msg.sender] - numTokens;
        balances[receiver] = balances[receiver] + numTokens;

        emit Transfer(msg.sender, receiver, numTokens);

        return true;
    }

    // https://docs.google.com/document/d/1YLPtQxZu1UAvO9cZ1O2RPXBbT0mooh4DYKjA_jp-RLM/edit#

    function approve(address delegate, uint256 numTokens)
        public
        returns (bool)
    {
        allowed[msg.sender][delegate] = numTokens;

        emit Approval(msg.sender, delegate, numTokens);

        return true;
    }

    function allowance(address owner, address delegate)
        public
        view
        returns (uint256)
    {
        return allowed[owner][delegate];
    }

    function transferFrom(
        address owner,
        address buyer,
        uint256 numTokens
    ) public returns (bool) {
        require(numTokens <= balances[owner]);
        require(numTokens <= allowed[owner][msg.sender]);

        balances[owner] = balances[owner] - numTokens;
        allowed[owner][msg.sender] = allowed[owner][msg.sender] - numTokens;
        balances[buyer] = balances[buyer] + numTokens;

        emit Transfer(owner, buyer, numTokens);

        return true;
    }
}
