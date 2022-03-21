const Vesting = artifacts.require("Vesting");

contract('Vesting', (accounts) => {
    it('should add user', async () => {
        const vestingInstance = await Vesting.deployed();
        const amount = 100;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

        const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

        assert.equal(checkBalance, amount, "didn't put token to user!!");
    });

    it('should add 2 users', async () => {
        const vestingInstance = await Vesting.deployed();
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
        const vestingInstance = await Vesting.deployed();
        const amount = 100;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

        const checkBalance = await vestingInstance.checkBalance.call(accounts[1]);

        const removeUser = await vestingInstance.removeUser(accounts[1], { from: accounts[0] });

        const isUser = await vestingInstance.isUser.call(accounts[1]);

        assert.equal(isUser, false, "user is not removed!!");
    });
    it('should set vesting schedule', async () => {
        // const vestingInstance = await Vesting.deployed();
        // const startDate = 100;
        // const cliffPeriod = 360;
        // const interval = 90;
        // const milestones = 5;

        // const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

        // const isSet = await vestingInstance.isSetVestingSchedule.call();

        // assert.equal(isSet, true, "schedule is not set!!");
    });

    it('should withdraw', async () => {
        const vestingInstance = await Vesting.deployed();
        const SECONDS_PER_DAY = 86400;

        const JAN_1_2022 = 1640995200 / SECONDS_PER_DAY; //Saturday, January 1, 2022 0:00:00 AM
        const MAR_2_2022 = 1646179200 / SECONDS_PER_DAY; // Cliff Date
        const JAN_1_2023 = 1672531200 / SECONDS_PER_DAY; // Before StartDate
        const JAN_1_2021 = 1609459200 / SECONDS_PER_DAY; // AfterVesting Date



        const startDate = JAN_1_2022;
        const cliffPeriod = 60;
        const interval = 60;
        const milestones = 5;


        const case1Date = MAR_2_2022; 
        const case2Date = JAN_1_2023;
        const case3Date = JAN_1_2021;           
        const case4Date = 0; // today                                 

        const setVesting = await vestingInstance.setVestingSchedule(startDate, cliffPeriod, interval, milestones, { from: accounts[0] });

        const amount = 10000;
        const addUser = await vestingInstance.addUser(accounts[1], amount, { from: accounts[0] });

        const claimedCase1 = await vestingInstance.tokenClaimed.call(accounts[1],case1Date);
        const withdrawCase1 = await vestingInstance.tokenCanWithdraw.call(accounts[1],case1Date);
        const remainedCase1 = await vestingInstance.tokenRemained.call(accounts[1],case1Date);

        const claimedCase2 = await vestingInstance.tokenClaimed.call(accounts[1], case2Date);
        const withdrawCase2 = await vestingInstance.tokenCanWithdraw.call(accounts[1], case2Date);
        const remainedCase2 = await vestingInstance.tokenRemained.call(accounts[1], case2Date);
        
        const claimedCase3 = await vestingInstance.tokenClaimed.call(accounts[1], case3Date);
        const withdrawCase3 = await vestingInstance.tokenCanWithdraw.call(accounts[1], case3Date);
        const remainedCase3 = await vestingInstance.tokenRemained.call(accounts[1], case3Date);

        const claimedCase4 = await vestingInstance.tokenClaimed.call(accounts[1], case4Date);
        const withdrawCase4 = await vestingInstance.tokenCanWithdraw.call(accounts[1], case4Date);
        const remainedCase4 = await vestingInstance.tokenRemained.call(accounts[1], case4Date);


        assert.equal(claimedCase1,2000,"case1 wrong");
        assert.equal(withdrawCase1,2000,"case1 wrong");
        assert.equal(remainedCase1,8000,"case1 wrong");

        assert.equal(claimedCase2,10000,"case2 wrong");
        assert.equal(withdrawCase2,10000,"case2 wrong");
        assert.equal(remainedCase2,0,"case2 wrong");

        assert.equal(claimedCase3,0,"case3 wrong");
        assert.equal(withdrawCase3,0,"case3 wrong");
        assert.equal(remainedCase3,10000,"case3 wrong");

        assert.equal(claimedCase4,2000,"case4 wrong"); // ~~ 21_MAR_2022
        assert.equal(withdrawCase4,2000,"case4 wrong");
        assert.equal(remainedCase4,8000,"case4 wrong");

        



    });






});