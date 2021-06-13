const Token = artifacts.require('Token.sol');
const Portfolio = artifacts.require('Portfolio.sol');

function helperCheck(transaction, error, expectedError) {

    assert.equal(error, expectedError, 'error executing transaction');

    if (transaction === undefined) {
        return;
    }

    let receipt = transaction.receipt;

    console.log(` * Block hash: ${receipt.blockHash.substring(0, 8)}`);
    console.log(` * Transaction hash: ${receipt.blockHash.substring(0, 8)}`);
}

contract('Portfolio', (accounts) => {
    describe('a deployed contract', () => {

        let tokenIssuer, portfolioManager, arbitraryAccount;

        let tokenInstance1, tokenInstance2, tokenInstance3, portfolioInstance;

        beforeEach(async () => {

            let error = '';
            let transfer, addToken;

            tokenIssuer = accounts[0];

            portfolioManager = accounts[1];
            arbitraryAccount = accounts[2];

            tokenInstance1 = await Token.new(248, { from: tokenIssuer });
            tokenInstance2 = await Token.new(604, { from: tokenIssuer });
            tokenInstance3 = await Token.new(712, { from: tokenIssuer });

            portfolioInstance = await Portfolio.new({ from: portfolioManager });

            try {
                transfer = undefined;
                transfer = await tokenInstance1.transfer(portfolioManager, 48, { from: tokenIssuer });
            } catch (e) {
                error = e.reason;
            }

            helperCheck(transfer, error, '');

            try {
                transfer = undefined;
                transfer = await tokenInstance2.transfer(portfolioManager, 62, { from: tokenIssuer });
            } catch (e) {
                error = e.reason;
            }

            helperCheck(transfer, error, '');

            try {
                addToken = undefined;
                addToken = await portfolioInstance.addToken(tokenInstance1.address, { from: portfolioManager });
            } catch (e) {
                error = e.reason;
            }

            helperCheck(addToken, error, '');

            try {
                addToken = undefined;
                addToken = await portfolioInstance.addToken(tokenInstance2.address, { from: portfolioManager });
            } catch (e) {
                error = e.reason;
            }

            helperCheck(addToken, error, '');

            // Global view of the portfolio
            // const assets = await portfolioInstance.show(/* tokenInstance3 */);

            // console.log(assets);
        });

        it('...should allow the portfolio manager to withdraw tokens only that have been added to the portfolio and approved by them',
            async (/* done */) => {

                let error = '';
                let withdraw, approve;

                try {
                    withdraw = undefined;
                    withdraw = await portfolioInstance.withdraw(tokenInstance1.address, portfolioManager, 16, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(withdraw, error, 'error token portfolio does not have large enough allowance');

                error = '';

                try {
                    approve = undefined;
                    approve = await tokenInstance1.approve(portfolioInstance.address, 24, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(approve, error, '');

                try {
                    withdraw = undefined;
                    withdraw = await portfolioInstance.withdraw(tokenInstance1.address, portfolioManager, 16, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(withdraw, error, '');

                const tokenIssuerBalance1 = await tokenInstance1.balanceOf(tokenIssuer);
                const tokenIssuerBalance2 = await tokenInstance2.balanceOf(tokenIssuer);
                const tokenIssuerBalance3 = await tokenInstance3.balanceOf(tokenIssuer);

                assert.equal(tokenIssuerBalance1.toNumber(), 200, 'token issuer balance should be 200');
                assert.equal(tokenIssuerBalance2.toNumber(), 542, 'token issuer balance should be 542');
                assert.equal(tokenIssuerBalance3.toNumber(), 712, 'token issuer balance should be 712');

                const portfolioManagerBalance1 = await tokenInstance1.balanceOf(portfolioManager);
                const portfolioManagerBalance2 = await tokenInstance2.balanceOf(portfolioManager);
                const portfolioManagerBalance3 = await tokenInstance3.balanceOf(portfolioManager);

                // NOTE: Portfolio manager's balance stays the same, because the tokens were withdrawn to them.

                assert.equal(portfolioManagerBalance1.toNumber(), 48, 'portfolio manager balance should be 48');
                assert.equal(portfolioManagerBalance2.toNumber(), 62, 'portfolio manager balance should be 62');
                assert.equal(portfolioManagerBalance3.toNumber(), 0, 'portfolio manager balance should be 0');

                const portfolioManagerAllowance1 = await tokenInstance1.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance2 = await tokenInstance2.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance3 = await tokenInstance3.allowance(portfolioManager, portfolioInstance.address);

                assert.equal(portfolioManagerAllowance1.toNumber(), 8, 'portfolio mmanager allowance should be 8');
                assert.equal(portfolioManagerAllowance2.toNumber(), 0, 'portfolio mmanager allowance should be 0');
                assert.equal(portfolioManagerAllowance3.toNumber(), 0, 'portfolio mmanager allowance should be 0');
            });

        it('...should prevent withdrawals of tokens not approved by the manager or removed from the portfolio',
            async (/* done */) => {

                let error = '';
                let withdraw, approve, removeToken;

                try {
                    approve = undefined;
                    approve = await tokenInstance1.approve(portfolioInstance.address, 24, { from: arbitraryAccount });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(approve, error, '');

                try {
                    withdraw = undefined;
                    withdraw = await portfolioInstance.withdraw(tokenInstance1.address, portfolioManager, 16, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(withdraw, error, 'error token portfolio does not have large enough allowance');

                error = ''

                try {
                    approve = undefined;
                    approve = await tokenInstance1.approve(portfolioInstance.address, 24, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(approve, error, '');

                try {
                    removeToken = undefined;
                    removeToken = await portfolioInstance.removeToken(tokenInstance1.address, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(removeToken, error, '');

                try {
                    withdraw = undefined;
                    withdraw = await portfolioInstance.withdraw(tokenInstance1.address, portfolioManager, 16, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(withdraw, error, 'error token not contained in portfolio');

                const tokenIssuerBalance1 = await tokenInstance1.balanceOf(tokenIssuer);
                const tokenIssuerBalance2 = await tokenInstance2.balanceOf(tokenIssuer);
                const tokenIssuerBalance3 = await tokenInstance3.balanceOf(tokenIssuer);

                assert.equal(tokenIssuerBalance1.toNumber(), 200, 'token issuer balance should be 200');
                assert.equal(tokenIssuerBalance2.toNumber(), 542, 'token issuer balance should be 542');
                assert.equal(tokenIssuerBalance3.toNumber(), 712, 'token issuer balance should be 712');

                const portfolioManagerBalance1 = await tokenInstance1.balanceOf(portfolioManager);
                const portfolioManagerBalance2 = await tokenInstance2.balanceOf(portfolioManager);
                const portfolioManagerBalance3 = await tokenInstance3.balanceOf(portfolioManager);

                assert.equal(portfolioManagerBalance1.toNumber(), 48, 'portfolio manager balance should be 48');
                assert.equal(portfolioManagerBalance2.toNumber(), 62, 'portfolio manager balance should be 62');
                assert.equal(portfolioManagerBalance3.toNumber(), 0, 'portfolio manager balance should be 0');

                const portfolioManagerAllowance1 = await tokenInstance1.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance2 = await tokenInstance2.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance3 = await tokenInstance3.allowance(portfolioManager, portfolioInstance.address);

                assert.equal(portfolioManagerAllowance1.toNumber(), 24, 'portfolio mmanager allowance should be 24');
                assert.equal(portfolioManagerAllowance2.toNumber(), 0, 'portfolio mmanager allowance should be 0');
                assert.equal(portfolioManagerAllowance3.toNumber(), 0, 'portfolio mmanager allowance should be 0');
            });

        it('...should allow the portfolio manager to clear all assets in a single transaction',
            async (/* done */) => {

                let error = '';
                let withdrawAll, approve;

                try {
                    approve = undefined;
                    approve = await tokenInstance1.approve(portfolioInstance.address, 24, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(approve, error, '');

                try {
                    approve = undefined;
                    approve = await tokenInstance2.approve(portfolioInstance.address, 24, { from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(approve, error, '');

                try {
                    withdrawAll = undefined;
                    withdrawAll = await portfolioInstance.withdrawAll({ from: portfolioManager });
                } catch (e) {
                    error = e.reason;
                }

                helperCheck(withdrawAll, error, '');

                const portfolioManagerAllowance1 = await tokenInstance1.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance2 = await tokenInstance2.allowance(portfolioManager, portfolioInstance.address);
                const portfolioManagerAllowance3 = await tokenInstance3.allowance(portfolioManager, portfolioInstance.address);

                assert.equal(portfolioManagerAllowance1.toNumber(), 0, 'portfolio mmanager allowance should be 0');
                assert.equal(portfolioManagerAllowance2.toNumber(), 0, 'portfolio mmanager allowance should be 0');
                assert.equal(portfolioManagerAllowance3.toNumber(), 0, 'portfolio mmanager allowance should be 0');

                // Global view of the portfolio
                // const assets = await portfolioInstance.show(/* tokenInstance3 */);

                // console.log(assets);
            });
    });
});
