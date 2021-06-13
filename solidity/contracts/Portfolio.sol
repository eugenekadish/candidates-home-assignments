// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./interfaces/IERC20Token.sol";

contract Portfolio {
    struct TokenView {
        address token;
        uint256 balance;
        uint256 allowance;
    }

    event EmergencyWithdrawal(
        address indexed from,
        address indexed to,
        bool success,
        uint256 remaining
    );

    address owner;
    address[] tokens;

    constructor() {
        owner = msg.sender;
    }

    modifier isOwner() {
        require(
            msg.sender == owner,
            "error caller is not the portfolio manager"
        );

        _;
    }

    function addToken(address token) public isOwner() {
        // NOTE: Would be good here to verify the address is of one of the
        // supported interfaces (in this case ERC20). Although this would be an
        // improvement, it does not take away from the functionality as the
        // manager has the ability to remove any address.

        bool inList = false;
        uint256 length = tokens.length;

        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == token) {
                inList = true;

                break;
            }
        }

        require(!inList, "error token previously contained in portfolio");

        tokens.push(token);
    }

    function removeToken(address token) public isOwner() {
        uint256 length = tokens.length;

        uint256 j = length;
        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == token) {
                j = i;

                break;
            }
        }

        require(j < length, "error token is not contained in portfolio");

        for (uint256 i = j; i < length - 1; i++) {
            tokens[i] = tokens[i + 1];
        }

        tokens.pop();
    }

    function withdraw(
        address token,
        address buyer,
        uint256 amount
    ) public isOwner() {
        IERC20Token tok = IERC20Token(token);

        bool inList = false;
        uint256 length = tokens.length;

        for (uint256 i = 0; i < length; i++) {
            if (tokens[i] == token) {
                inList = true;

                break;
            }
        }

        require(inList, "error token not contained in portfolio");

        uint256 balance = tok.balanceOf(owner);

        require(
            amount <= balance,
            "error token owner does not have large enough balance"
        );

        // NOTE: For a portfolio that has full control of the tokens (intention
        // on calling transfer with the portfolio contract address),
        // an alternative implementation, could call approve here to be the
        // token owner and withdraw on behalf of the portfolio owner.

        uint256 allowance = tok.allowance(owner, address(this));

        require(
            amount <= allowance,
            "error token portfolio does not have large enough allowance"
        );

        bool transferFrom = tok.transferFrom(owner, buyer, amount);

        require(transferFrom, "error transferring token amount to buyer");
    }

    // NOTE: The method does not allow you to specify a withdrawal address, so
    // that the tokens end up back in the wallet of the owner. Since this is an
    // emergency and for the duration of this transaction they are in control of
    // their keys, it seemed safer to me being less dynamic was better here.

    function withdrawAll() public isOwner() {
        uint256 length = tokens.length;

        for (uint256 i = 0; i < length; i++) {
            IERC20Token tok = IERC20Token(tokens[i]);

            uint256 balance = tok.balanceOf(owner);
            uint256 allowance = tok.allowance(owner, address(this));

            uint256 amount = balance > allowance ? allowance : balance;

            // NOTE: There is a shortcoming here where any owned token that
            // throws an exception may prevent the withdrawal of the entire
            // portfolio. In such cases unfortunately the owner of the portfolio
            // will have to remove the faulty token in a separate call to
            // `removeToken`.

            bool transferFrom = tok.transferFrom(owner, owner, amount);
            uint256 remaining = tok.allowance(owner, address(this));

            if (transferFrom && remaining == 0) {
                continue;
            }

            emit EmergencyWithdrawal(
                address(this),
                owner,
                transferFrom,
                remaining
            );
        }
    }

    function show() public view returns (TokenView[] memory) {
        uint256 length = tokens.length;
        TokenView[] memory assetList = new TokenView[](length);

        for (uint256 i = 0; i < length; i++) {
            // NOTE: As mentioned in the `addToken` method. Any address that
            // is not an ERC20 can be checked outside of the portfolio
            // contract and removed.

            IERC20Token tok = IERC20Token(tokens[i]);

            assetList[i] = TokenView(
                address(tok),
                tok.balanceOf(owner),
                tok.allowance(owner, address(this))
            );
        }

        return assetList;
    }
}
