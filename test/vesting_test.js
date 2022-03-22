const Vesting = artifacts.require("Vesting");
const Token = artifacts.require("Token");
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
    // let catchRevert = require("./exception").catchRevert;
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

    describe("User", () => {
        it('should add user', async () => {
            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

            assert.equal(checkBalance, amount, "didn't put token to user!!");
        });
        it('should not add user', async () => {
            const amount = 0;

            await truffleAssert.reverts(vestingInstance.addUser(accounts[1], amount, { from: accounts[0] }), "Vesting: Insufficient amount");

        });


        it('should add 2 users', async () => {
            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1, user_2];
            const amounts = [100, 200];
            const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

            const checkBalance_1 = await vestingInstance.checkBalance.call(user_1);
            const checkBalance_2 = await vestingInstance.checkBalance.call(user_2);
            assert.equal(checkBalance_1, amounts[0], "didn't put token to user1!!");
            assert.equal(checkBalance_2, amounts[1], "didn't put token to user2!!");

        });
        it('should not add 2 users because arrays are not equal length', async () => {
            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1];
            const amounts = [100, 200];
            //   const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: Not equal length");

        });
        it('should not add 2 users because array is null', async () => {
            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [];
            const amounts = [];
            //   const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: null array input");

        });

        it('should not add 2 users because amount is zero', async () => {
            const user_1 = accounts[1];
            const user_2 = accounts[2];
            const users = [user_1, user_2];
            const amounts = [0, 300];
            //   const addManyUser = await vestingInstance.addManyUser(users, amounts, { from: accounts[0] });

            await truffleAssert.reverts(vestingInstance.addManyUser(users, amounts, { from: accounts[0] }), "Vesting: Insufficient amount");

        });
        it('should remove user', async () => {
            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

            const removeUser = await vestingInstance.removeUser(accounts[1], { from: accounts[0] });

            const isUser = await vestingInstance.isUser.call(accounts[1]);

            assert.equal(isUser, false, "user is not removed!!");
        });
        it('should not remove user when vesting', async () => {
            const amount = 100;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const startDate = 1; // small start day
            const cliffPeriod = 360;
            const interval = 90;
            const milestones = 5;
            await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            await truffleAssert.reverts(vestingInstance.removeUser(accounts[1], { from: accounts[0] }), "Vesting: can't remove user when vesting");

        });

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
            const startDate = 0;
            const cliffPeriod = 360;
            const interval = 90;
            const milestones = 5;

            // const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });


            await truffleAssert.reverts(
                vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] }),
                "Vesting: Invalid input!");

        });

        it('should not set vesting schedule because of invalid cliff period', async () => {
            const startDate = 100;
            const cliffPeriod = 360;
            const interval = 85; // 360 % 85 != 0
            const milestones = 5;

            // const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });


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

    describe("User Token", () => {
        it('should return correct tokenclaimed, tokencanwithdraw, tokenremained', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });

            const startDate = today + 30;
            const cliffPeriod = 60;
            const interval = 60;
            const milestones = 5;



            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

            const amount = 10000;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

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


            // bởi vì timetraveller trả về lại thời gian hiện tại nên function withdraw chưa test được
            // trước mắt là test các giá trị tokenClaimed, tokenCanWithdraw, tokenRemained khi ở 
            // mốc thời gian khác nhau

            //await vestingInstance.withdrawToken({ from: accounts[1] });

            //////
            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 3

            const claimedCase5 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase5 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase5 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase5, 6000, "case5 wrong");
            assert.equal(withdrawCase5, 6000, "case5 wrong");
            assert.equal(remainedCase5, 4000, "case5 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 4

            const claimedCase6 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase6 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase6 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase6, 8000, "case6 wrong");
            assert.equal(withdrawCase6, 8000, "case6 wrong");
            assert.equal(remainedCase6, 2000, "case6 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60); // in milestone 5

            const claimedCase7 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase7 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase7 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase7, 10000, "case7 wrong");
            assert.equal(withdrawCase7, 10000, "case7 wrong");
            assert.equal(remainedCase7, 0, "case7 wrong");

        });

        it('should return vestingOf() properly', async () => {
            const amount = 10000;
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const result = await vestingInstance.vestingOf.call(accounts[1]);
            assert.equal(result["claim"], 0, "claim value wrong");
            assert.equal(result["remain"], 10000, "remain value wrong");


        });
    });

    describe("Token Transfer", () => {
        it('should claimed ', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });

            const startDate = today - 180;
            const cliffPeriod = 60;
            const interval = 60;
            const milestones = 5;
            const amount = 10000;
            const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

            const claimedCase1 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase1 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase1 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase1, 6000, "case1 wrong");
            assert.equal(withdrawCase1, 6000, "case1 wrong");
            assert.equal(remainedCase1, 4000, "case1 wrong");

            await vestingInstance.withdrawToken({ from: accounts[1] });

            const claimedCase2 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase2 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase2 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase2, 6000, "case2 wrong");
            assert.equal(withdrawCase2, 0, "case2 wrong");
            assert.equal(remainedCase2, 4000, "case2 wrong");

            await timeMachine.advanceTimeAndBlock(SECONDS_PER_DAY * 60);

            const claimedCase3 = await vestingInstance.tokenClaimed.call(accounts[1]);
            const withdrawCase3 = await vestingInstance.tokenCanWithdraw.call(accounts[1]);
            const remainedCase3 = await vestingInstance.tokenRemained.call(accounts[1]);

            assert.equal(claimedCase3, 8000, "case3 wrong");
            assert.equal(withdrawCase3, 2000, "case3 wrong");
            assert.equal(remainedCase3, 2000, "case3 wrong");

        });

        it('should not claimed because of insufficient amount to withdraw', async () => {
            await token.transfer(vestingInstance.address, 1000000000, { from: accounts[0] });

            const startDate = today;
            const cliffPeriod = 60;
            const interval = 60;
            const milestones = 5;
            const amount = 10000;
            await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });
            await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });


            await truffleAssert.reverts(vestingInstance.withdrawToken({ from: accounts[1] }), "Vesting: Insufficient amount to withdraw");

        })

    });



});