const Token = artifacts.require('Token');
const UserRole = artifacts.require('UserRole');
const Vesting  = artifacts.require('Vesting');
//const Pool = artifacts.require("Pool");

module.exports = async function (deployer) {
  await deployer.deploy(Token);
  const token = await Token.deployed();
  await deployer.deploy(UserRole);
  await deployer.deploy(Vesting);

  // await deployer.deploy(Pool, token.address);
};
