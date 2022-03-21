const UserRole = artifacts.require("UserRole");

contract('UserRole', (accounts) => {
  it('should add user', async () => {
    const vestingInstance = await UserRole.deployed();
    //const balance = await metaCoinInstance.getBalance.call(accounts[0]);
    const amount = 100;
    const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });
    const isUser = await vestingInstance.isUser.call(accounts[1]);
    const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);
    assert.equal(isUser, true, "user didn't add!!!");

    assert.equal(checkBalance, amount, "didn't put token to user!!")
  });

  it('should add 2 users', async () => {
    const vestingInstance = await UserRole.deployed();
    //const balance = await metaCoinInstance.getBalance.call(accounts[0]);
    const user_1 = accounts[1];
    const user_2 = accounts[2];
    const users = [user_1, user_2];
    const amounts = [100, 200];
    const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });
    const isUser_1 = await vestingInstance.isUser.call(user_1);
    const isUser_2 = await vestingInstance.isUser.call(user_2);
    const checkBalance_1 = await vestingInstance.checkBalance.call(user_1);
    const checkBalance_2 = await vestingInstance.checkBalance.call(user_2);

    //assert.equal(isUser_1, true, "user1 didn't add!!!");
    //assert.equal(isUser_2, true, "user2 didn't add!!!");

    console.log(checkBalance_2);

    assert.equal(checkBalance_1, amounts[0], "didn't put token to user1!!")
    assert.equal(checkBalance_2, amounts[1], "didn't put token to user2!!")

  });
  // it('should call a function that depends on a linked library', async () => {
  //   const metaCoinInstance = await MetaCoin.deployed();
  //   const metaCoinBalance = (await metaCoinInstance.getBalance.call(accounts[0])).toNumber();
  //   const metaCoinEthBalance = (await metaCoinInstance.getBalanceInEth.call(accounts[0])).toNumber();

  //   assert.equal(metaCoinEthBalance, 2 * metaCoinBalance, 'Library function returned unexpected function, linkage may be broken');
  // });
  // it('should send coin correctly', async () => {
  //   const metaCoinInstance = await MetaCoin.deployed();

  //   // Setup 2 accounts.
  //   const accountOne = accounts[0];
  //   const accountTwo = accounts[1];

  //   // Get initial balances of first and second account.
  //   const accountOneStartingBalance = (await metaCoinInstance.getBalance.call(accountOne)).toNumber();
  //   const accountTwoStartingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();

  //   // Make transaction from first account to second.
  //   const amount = 10;
  //   await metaCoinInstance.sendCoin(accountTwo, amount, { from: accountOne });

  //   // Get balances of first and second account after the transactions.
  //   const accountOneEndingBalance = (await metaCoinInstance.getBalance.call(accountOne)).toNumber();
  //   const accountTwoEndingBalance = (await metaCoinInstance.getBalance.call(accountTwo)).toNumber();


  //   assert.equal(accountOneEndingBalance, accountOneStartingBalance - amount, "Amount wasn't correctly taken from the sender");
  //   assert.equal(accountTwoEndingBalance, accountTwoStartingBalance + amount, "Amount wasn't correctly sent to the receiver");
  // });
});