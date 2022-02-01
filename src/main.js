const {Blockchain, Transaction} = require('./blockchain')
const EC = require('elliptic').ec
const ec = new EC('secp256k1')
const dotenv = require('dotenv').config()

const myKey = ec.keyFromPrivate(process.env.PRIVATE_KEY)
const myWalletAddress = myKey.getPublic('hex')

let cookieCoin = new Blockchain()

const tx1 = new Transaction(myWalletAddress, "address2", 10)
tx1.signTransaction(myKey)
cookieCoin.addTransaction(tx1)

for (let i = 0; i < 5; i++) {
	console.log('\n Starting the miner...')
	cookieCoin.minePendingTransactions(myWalletAddress)
	console.log("Balance of Cookie is " + cookieCoin.getBalanceOfAddress(myWalletAddress));
}

console.log("Balance of Cookie is " + cookieCoin.getBalanceOfAddress(myWalletAddress));