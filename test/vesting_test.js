const Vesting = artifacts.require("Vesting");
const Token = artifacts.require("Token");
const timeMachine = require('ganache-time-traveler');

contract('Vesting', (accounts) => {
    let token;
    let vestingInstance;
    let snapshot;
    let snapshotId;
    const SECONDS_PER_DAY = 86400;

    beforeEach(async () => {
        snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
        token = await Token.deployed({ from: accounts[0] });
        vestingInstance = await Vesting.new(token.address);
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    })

    it('should add user', async () => {
        const amount = 100;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

        const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

        assert.equal(checkBalance, amount, "didn't put token to user!!");
    });

    it('should add 2 users', async () => {
        const user_1 = accounts[1];
        const user_2 = accounts[2];
        const users = [user_1, user_2];
        const amounts = [100, 200];
        const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

        const checkBalance_1 = await vestingInstance.checkBalance.call(user_1);
        const checkBalance_2 = await vestingInstance.checkBalance.call(user_2);
        assert.equal(checkBalance_1, amounts[0], "didn't put token to user1!!")
        assert.equal(checkBalance_2, amounts[1], "didn't put token to user2!!")

    });
    it('should remove user', async () => {
        const amount = 100;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

        const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

        const removeUser = await vestingInstance.removeUser(accounts[1], { from: accounts[0] });

        const isUser = await vestingInstance.isUser.call(accounts[1]);

        assert.equal(isUser, false, "user is not removed!!");
    });
    it('should set vesting schedule', async () => {
        const vestingInstance = await Vesting.deployed();
        const startDate = 100;
        const cliffPeriod = 360;
        const interval = 90;
        const milestones = 5;

        const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

        const isSet = await vestingInstance.isSetVestingSchedule.call();

        assert.equal(isSet, true, "schedule is not set!!");
    });

    it('should withdraw', async () => {



        const JAN_1_2022 = 1640995200; //Start Date
        const DEC_1_2021 = 1638316800;


        const startDate = JAN_1_2022 / SECONDS_PER_DAY;
        const cliffPeriod = 60;
        const interval = 60;
        const milestones = 5;




        const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

        const amount = 10000;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });




        await timeMachine.advanceBlockAndSetTime(DEC_1_2021); // before start day ~ 1 month







        const claimedCase1 = await vestingInstance.tokenClaimed.call(accounts[1]);
        const withdrawCase1 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
        const remainedCase1 = await vestingInstance.tokenRemained.call(accounts[1]);
        assert.equal(claimedCase1, 0, "case1 wrong");
        assert.equal(withdrawCase1, 0, "case1 wrong");
        assert.equal(remainedCase1, 10000, "case1 wrong");

        await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in cliff day

        const claimedCase2 = await vestingInstance.tokenClaimed.call(accounts[1]);
        const withdrawCase2 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
        const remainedCase2 = await vestingInstance.tokenRemained.call(accounts[1]);
        assert.equal(claimedCase2, 0, "case2 wrong");
        assert.equal(withdrawCase2, 0, "case2 wrong");
        assert.equal(remainedCase2, 10000, "case2 wrong");

        await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 1


        const claimedCase3 = await vestingInstance.tokenClaimed.call(accounts[1]);
        const withdrawCase3 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
        const remainedCase3 = await vestingInstance.tokenRemained.call(accounts[1]);

        assert.equal(claimedCase3, 2000, "case3 wrong");
        assert.equal(withdrawCase3, 2000, "case3 wrong");
        assert.equal(remainedCase3, 8000, "case3 wrong");

        await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 2


        const claimedCase4 = await vestingInstance.tokenClaimed.call(accounts[1]);
        const withdrawCase4 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
        const remainedCase4 = await vestingInstance.tokenRemained.call(accounts[1]);

        assert.equal(claimedCase4, 4000, "case4 wrong");
        assert.equal(withdrawCase4, 4000, "case4 wrong");
        assert.equal(remainedCase4, 6000, "case4 wrong");




        console.log(await vestingInstance.whatday.call());

        await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });
        // dùng xong lệnh này thì timemachine về lại ngày hiện tại???
        console.log(await vestingInstance.whatday.call());



        //await timeMachine.advanceBlockAndSetTime(DEC_1_2021 + SECONDS_PER_DAY * 180);
        await vestingInstance.withdrawToken({ from: accounts[1] });
        //await timeMachine.advanceBlockAndSetTime(DEC_1_2021 + SECONDS_PER_DAY * 180);


        const claimedCase5 = await vestingInstance.tokenClaimed.call(accounts[1]);
        const withdrawCase5 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
        const remainedCase5 = await vestingInstance.tokenRemained.call(accounts[1]);

        console.log(claimedCase5);  //2000
        console.log(withdrawCase5); //2000
        console.log(remainedCase5); //8000



        // assert.equal(claimedCase5, 4000, "case4 wrong");
        // assert.equal(withdrawCase5, 0, "case4 wrong");
        // assert.equal(remainedCase5, 6000, "case4 wrong");




    });






});