const { expect } = require("chai")

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ID = 1
const NAME = "Shoes"
const CATEGORY = "Clothing"
const IMAGE = "https://ipfs.io/ipfs/QmTYEboq8raiBs7GTUg2yLXB3PMz6HuBNgNfSZBx5Msztg/shoes.jpg"
const COST = tokens(1)
const RATING = 4
const STOCK = 5

describe("Dappazon", () => {
  let dappazon;
  let deployer, buyer;

  
  beforeEach(async () => {
    // Setup accounts
    [deployer, buyer] = await ethers.getSigners()

    // Deploy contract
    const Dappazon = await ethers.getContractFactory("Dappazon")
    dappazon = await Dappazon.deploy()
  })

  describe("deployment", () => {
    it("sets the owner", async () => {
      expect(await dappazon.owner()).to.equal(deployer.address)
    })
  })

  describe("Listing", () => {
    let transaction

    beforeEach(async () => {
      // List a item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()
    })

    it("Returns item attributes", async () => {
      const item = await dappazon.items(ID)

      expect(item.id).to.equal(ID)
      expect(item.name).to.equal(NAME)
      expect(item.category).to.equal(CATEGORY)
      expect(item.image).to.equal(IMAGE)
      expect(item.cost).to.equal(COST)
      expect(item.rating).to.equal(RATING)
      expect(item.stock).to.equal(STOCK)
    })

    it("Emits List event", () => {
      expect(transaction).to.emit(dappazon, "List")
    })
  })

  describe('buying', () => {
    let transaction

    beforeEach(async () => {
      //List item
      transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      //buy item 
      transaction =  await dappazon.connect(buyer).buy(ID, {value: COST})
      await transaction.wait()
    })

    it('updates buyer order count', async () => {
      const result = await dappazon.orderCount(buyer.address)
      expect(result).to.be.equal(1)
    })

    it("Adds the order", async () => {
      const order = await dappazon.orders(buyer.address, 1)
      expect(order.time).to.be.greaterThan(0)
      expect(order.item.name).to.equal(NAME)
    })

    it('updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.be.equal(COST)
    })

    it('emits buy event', async () => {
      expect(transaction).to.emit(dappazon, 'Buy')
    })

  })

  describe('withdrawing', () => {
    let balanceBefore;
  
    beforeEach(async () => {
      // List a item
      let transaction = await dappazon.connect(deployer).list(ID, NAME, CATEGORY, IMAGE, COST, RATING, STOCK)
      await transaction.wait()

      // Buy a item
      transaction = await dappazon.connect(buyer).buy(ID, { value: COST })
      await transaction.wait()

      // Get Deployer balance before
      balanceBefore = await ethers.provider.getBalance(deployer.address)

      // Withdraw
      transaction = await dappazon.connect(deployer).withDraw()
      await transaction.wait()
    })

    it('updates the owner balance', async () => {
      const balanceAfter = await ethers.provider.getBalance(deployer.address)
      expect(balanceAfter).to.be.greaterThan(balanceBefore)
    })

    it('updates the contract balance', async () => {
      const result = await ethers.provider.getBalance(dappazon.address)
      expect(result).to.be.equal(0)
    })
  })

})
