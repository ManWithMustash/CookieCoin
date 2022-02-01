const SHA256 = require("crypto-js/sha256")
const EC = require('elliptic').ec
const ec = new EC('secp256k1')

class Transaction {
	constructor(fromAddress, toAddress, amount) {
		this.fromAddress = fromAddress
		this.toAddress = toAddress
		this.amount = amount
	}

	calculateHash() {
		return SHA256(this.fromAddress + this.toAddress + this.amount).toString()
	}

	signTransaction(signingKey) {
		if (signingKey.getPublic('hex') !== this.fromAddress) {
			throw new Error("You cannot sign transactions for other wallets!")
		}

		const hashTx = this.calculateHash()
		const sig = signingKey.sign(hashTx, 'base64')
		this.signature = sig.toDER('hex')
	}

	isValid() {
		if (this.fromAddress === null) return true

		if (!this.signature || this.signature.length === 0) {
			throw new Error("No Signature in this Transaction!")
		}

		const publicKey = ec.keyFromPublic(this.fromAddress, 'hex')
		return publicKey.verify(this.calculateHash(), this.signature)
	}
}

class Block {
	constructor(timestamp, transactions, previous_hash = '') {
		this.timestamp = timestamp
		this.transactions = transactions
		this.previous_hash = previous_hash
		this.hash = this.calculateHash()
		this.nonce = 0
	}

	calculateHash() {
		return SHA256(+ this.previous_hash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString()
	}

	mineBlock(difficulty) {
		while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join("0")) {
			this.nonce++
			this.hash = this.calculateHash()
		}

		console.log("Mined Block Hash: " + this.hash + ", Nonce: " + this.nonce);
	}

	hasValidTransactions() {
		for (const tx of this.transactions) {
			if (!tx.isValid()) {
				return false
			}
		}

		return true
	}
}

class Blockchain {
	constructor() {
		this.chain = [this.createGenesisBlock()]
		this.difficulty = 2
		this.pendingTransactions = []
		this.reward = 100
	}

	createGenesisBlock() {
		return new Block("1/1/2022", "Genesis Block", "")
	}

	getLatestBlock() {
		return this.chain[this.chain.length - 1]
	}

	minePendingTransactions(miningRewardAdress) {
		const rewardTx = new Transaction(null, miningRewardAdress, this.reward)
		this.pendingTransactions.push(rewardTx)

		let block = new Block(Date.now(), this.pendingTransactions)
		block.mineBlock(this.difficulty)

		console.log("Block Mined Successfully");
		this.chain.push(block)
	}

	addTransaction(transaction) {

		if (!transaction.fromAddress || !transaction.toAddress) {
			throw new Error("Transaction must include from and to address!")
		}

		if (!transaction.isValid()) {
			throw new Error("Cannot add invalid transaction to the chain!")
		}

		this.pendingTransactions.push(transaction)
	}

	getBalanceOfAddress(address) {
		let balance = 0

		for (const block of this.chain) {
			for (const trans of block.transactions) {
				if (trans.fromAddress === address) {
					balance -= trans.amount
				}

				if (trans.toAddress === address) {
					balance += trans.amount
				}
			}
		}

		return balance
	}

	isChainValid() {
		for (let i = 1; i < this.chain.length; i++) {
			const currentBlock = this.chain[i]
			const previous_block = this.chain[i - 1]

			if (!currentBlock.hasValidTransactions()) {
				return false
			}

			if(currentBlock.hash !== currentBlock.calculateHash()) {
				return false
			}

			if(currentBlock.previous_hash !== previous_block.hash) {
				return false
			}
		}

		return true
	}
}

module.exports.Blockchain = Blockchain
module.exports.Transaction = Transaction