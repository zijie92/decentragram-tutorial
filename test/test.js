const { assert } = require("chai")

const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  let decentragram

  before(async () => {
    decentragram = await Decentragram.deployed()
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address
      assert.notEqual(address, 0x0)
      assert.notEqual(address, '')
      assert.notEqual(address, null)
      assert.notEqual(address, undefined)
    })

    it('has a name', async () => {
      const name = await decentragram.name()
      assert.equal(name, 'Decentragram')
    })
  })

  describe('images', async() => {
    let result, imageCount
    const hash = 'abc123'

    before(async() => {
      result = await decentragram.uploadImage(hash, 'Image description', {from:author})
      imageCount = await decentragram.imageCount()

    })

    it('create images', async() =>{
      assert.equal(imageCount, 1)
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(event.hash, hash, 'Hash is correct')
      assert.equal(event.description, 'Image description', 'Description is correct')
      assert.equal(event.tipAmount, '0', 'tip amt is correct')
      assert.equal(event.author, author, 'author is correct')

      // Failure
      await decentragram.uploadImage('', 'Image Description', {from: author}).should.be.rejected
      await decentragram.uploadImage('abc123', '', {from: author}).should.be.rejected

    })

    it('list images', async() =>{
      const image = await decentragram.images(imageCount)
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct')
      assert.equal(image.hash, hash, 'Hash is correct')
      assert.equal(image.description, 'Image description', 'Description is correct')
      assert.equal(image.tipAmount, '0', 'tip amt is correct')
      assert.equal(image.author, author, 'author is correct')
    })

    it('allows users to tip images', async() => {
      let oldAuthorBalance
      oldAuthorBalance = await web3.eth.getBalance(author)
      oldAuthorBalance = new web3.utils.BN(oldAuthorBalance)

      result = await decentragram.tipImageOwner(imageCount, {from: tipper, value:web3.utils.toWei('1', 'Ether')})

      //Success
      const event = result.logs[0].args
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'Id is correct')
      assert.equal(event.description, 'Image description', 'Description is correct')
      assert.equal(event.tipAmount, '1000000000000000000', 'tip amt is correct')
      assert.equal(event.author, author, 'author is correct')

      let newAuthorBalance
      newAuthorBalance = await web3.eth.getBalance(author)
      newAuthorBalance = new web3.utils.BN(newAuthorBalance)

      let tipImageOwner
      tipImageOwner = web3.utils.toWei('1', 'Ether')
      tipImageOwner = new web3.utils.BN(tipImageOwner)

      const expectedBalance = oldAuthorBalance.add(tipImageOwner)
      assert.equal(newAuthorBalance.toString(), expectedBalance.toString())

      await decentragram.tipImageOwner(99,{from:tipper, value:web3.utils.toWei('1','Ether')}).should.be.rejected
    })

  })

})