const Vesting = artifacts.require("Vesting");
const Token = artifacts.require("Token");
const { assert } = require('chai');
const timeMachine = require('ganache-time-traveler');
const truffleAssert = require('truffle-assertions');

contract('Vesting', (accounts) => {
    let token;
    let vestingInstance;
    let snapshot;
    let snapshotId;
    let today;
    const SECONDS_PER_DAY = 86400;
    const MILISECONDS_IN_DAY = 86400000;
    beforeEach(async () => {
        snapshot = await timeMachine.takeSnapshot();
        snapshotId = snapshot['result'];
        token = await Token.deployed({ from: accounts[0] });
        vestingInstance = await Vesting.new(token.address);
        today = Math.floor(snapshot['id'] / MILISECONDS_IN_DAY);
    });

    afterEach(async () => {
        await timeMachine.revertToSnapshot(snapshotId);
    });




    describe("Schedule", () => {
        it('should set vesting schedule', async () => {
            const startDate = 100;
            const cliffPeriod = 360;
            const interval = 90;
            const milestones = 5;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            const isSet = await vestingInstance.isSetVestingSchedule.call();
            assert.equal(isSet, true, "schedule is not set!!");
        });
        it('should not set vesting schedule because of invalid input', async () => {
            const startDate = 100;
            const cliffPeriod = 360;
            const interval = 90;
            const milestones = 5;

            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(0, cliffPeriod, interval, milestones, { from: accounts[0] }),
                "Vesting: Invalid input!");
            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, 0, interval, milestones, { from: accounts[0] }),
                "Vesting: Invalid input!");
            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, cliffPeriod, 0, milestones, { from: accounts[0] }),
                "Vesting: Invalid input!");
            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, 0, { from: accounts[0] }),
                "Vesting: Invalid input!");

        });

        it('should not set vesting schedule because of invalid cliff period', async () => {
            const startDate = 100;
            const cliffPeriod = 360;
            const interval = 85; // 360 % 85 != 0
            const milestones = 5;

            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] }),
                "Vesting: Invalid cliff period");

        });
        it('should not set vesting schedule because already set schedule', async () => {
            const startDate = 100;
            const cliffPeriod = 360;
            const interval = 90;
            const milestones = 5;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });


            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] }),
                "Vesting: can't set schedule yet");

        });

    });


    describe("User", () => {

        const cliffPeriod = 360;
        const interval = 90;
        const milestones = 5;


        it('should add user', async () => {
            const startDate = today + 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const checkBalance = await vestingInstance.vestingOf.call(accounts[1]);

            assert.equal(checkBalance["remain"], amount, "didn't put token to user!!");
        });
        it('should not add user when not set account', async () => {
            const startDate = today + 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            const amount = 0;

            await truffleAssert.reverts(vestingInstance.addUser(accounts[1], amount, { from: accounts[0] }), "Vesting: Insufficient amount");

        });
        it('should not add account because totaluseramount > totalamount', async () => {

            total = await token.totalSupply.call();

            const startDate = today + 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            const amount = total + 1;

            await truffleAssert.reverts(vestingInstance.addUser(accounts[1], amount, { from: accounts[0] }), "Vesting: Not enough token");

        });

        it('should add 2 users', async () => {
            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1, user_2];
            const amounts = [100, 200];
            const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

            const checkBalance_1 = await vestingInstance.vestingOf.call(user_1);
            const checkBalance_2 = await vestingInstance.vestingOf.call(user_2);
            assert.equal(checkBalance_1["remain"], amounts[0], "didn't put token to user1!!");
            assert.equal(checkBalance_2["remain"], amounts[1], "didn't put token to user2!!");

        });
        it('should not add 2 users because arrays are not equal length', async () => {
            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1];
            const amounts = [100, 200];

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: Not equal length");

        });
        it('should not add user after start date', async () => {
            const startDate = 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const amount = 100;
            await truffleAssert.reverts(vestingInstance.addUser(accounts[1], amount, { from: accounts[0] }), "Vesting: Can't add user after Start Date");

        });
        it('should not add 2 users because array is null', async () => {
            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [];
            const amounts = [];

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: null array input");

        });

        it('should not add 2 users because amount is zero', async () => {
            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1, user_2];
            const amounts = [0, 300];

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: Insufficient amount");

        });
        it('should remove user', async () => {
            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });


            const removeUser = await vestingInstance.removeUser(accounts[1], { from: accounts[0] });

            const isUser = await vestingInstance.isUser.call(accounts[1]);

            assert.equal(isUser, false, "user is not removed!!");
        });


    });

    describe("User Token", () => {
        const cliffPeriod = 60;
        const interval = 60;
        const milestones = 5;
        it('should return correct tokencanwithdraw', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });
            const startDate = today + 30;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const amount = 10000;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });
            const withdrawCase1 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase1, 0, "case1 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in cliff day
            const withdrawCase2 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase2, 0, "case2 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 1
            const withdrawCase3 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase3, 2000, "case3 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 2
            const withdrawCase4 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase4, 4000, "case4 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 3
            const withdrawCase5 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase5, 6000, "case5 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 4
            const withdrawCase6 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase6, 8000, "case6 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 5
            const withdrawCase7 = await vestingInstance.amountCanWithdraw.call(accounts[1]);
            assert.equal(withdrawCase7, 10000, "case7 wrong");

        });

        it('should return vestingOf() properly', async () => {
            const startDate = today + 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });


            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const checkBalance = await vestingInstance.vestingOf.call(accounts[1]);

            assert.equal(checkBalance["remain"], amount, "didn't put token to user!!");


        });
        it('should not return vestingOf() because not owner or user', async () => {
            const startDate = today + 1;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });


            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            await truffleAssert.reverts(vestingInstance.vestingOf.call(accounts[1], { from: accounts[2] }), "Vesting: Not owner or user");


        });
    });

    describe("Token Transfer", () => {
        const cliffPeriod = 60;
        const interval = 60;
        const milestones = 5;
        const amount = 10000;
        it('should claimed ', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });

            const startDate = today + 1;

            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            await timeMachine.advanceTimeAndBlock(today + SECONDS_PER_DAY * 181);


            const withdrawCase1 = await vestingInstance.withdrawToken.call({ from: accounts[1] });
            //Nếu ko gọi hàm call thì timemachine trả về thời gian hiện tại nên
            //ko thể withdraw được
            assert.equal(withdrawCase1, 6000, "case1 wrong");



        });

        it('should not claimed because of insufficient amount to withdraw', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });

            const startDate = today + 1;

            await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });


            await truffleAssert.reverts(vestingInstance.withdrawToken({ from: accounts[1] }), "Vesting: Insufficient amount to withdraw");

        })
    });
});