const Token = artifacts.require('Token');
const Vesting = artifacts.require('Vesting');
//const Pool = artifacts.require("Pool");

module.exports = async function (deployer) {
  await deployer.deploy(Token);
  const token = await Token.deployed();
  await deployer.deploy(Vesting);
  // await deployer.deploy(Pool, token.address);
};
