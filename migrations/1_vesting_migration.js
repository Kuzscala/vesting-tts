const Token = artifacts.require('Token');
const Pool = artifacts.require("Pool");

module.exports = async function (deployer) {
  await deployer.deploy(Token);
  const token = await Token.deployed();
  await deployer.deploy(Pool, token.address);
};
