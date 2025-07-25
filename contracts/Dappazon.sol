// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.9;

contract Dappazon {
    address public owner; 

    constructor() {
        owner = msg.sender;
    }

    struct Item {
        uint256 id;
        string name;
        string category;
        string image;
        uint256 cost;
        uint256 raiting;
        uint256 stock;
    }

    struct Order {
        uint256 time;
        Item item;
    }

    mapping(uint256 => Item) public items;
    mapping(address => mapping(uint256 => Order)) public orders;
    mapping(address => uint256) public orderCount;

    event Buy(address buyer, uint256 orderId, uint256 itemId);
    event List(string name, uint256 cost, uint256 quantity);

    modifier onlyOwner () {
        require(msg.sender == owner);
        _;
    }

    function list(
        uint256 _id,
        string memory _name,
        string memory _category,
        string memory _image,
        uint256 _cost,
        uint256 _rating,
        uint256 _stock
    ) public onlyOwner {
        // Create Item
        Item memory item = Item(
            _id,
            _name,
            _category,
            _image,
            _cost,
            _rating,
            _stock
        );

        // Add Item to mapping
        items[_id] = item;

        // Emit event
        emit List(_name, _cost, _stock);
    }

    function buy(uint256 _id) public payable {
        //Get the item to be purchased
        Item memory item = items[_id];

        //Require tx amount to be greater
        require(msg.value >= item.cost);

        //require item stock
        require(item.stock > 0);

        //Create the order 
        Order memory order = Order(block.timestamp, item);

        //Update order count
        orderCount[msg.sender]++;
        orders[msg.sender][orderCount[msg.sender]] = order;


        //Reduce stock count 
        items[_id].stock = item.stock - 1;

        //emit event 
        emit Buy(msg.sender, orderCount[msg.sender], item.id);
    }

    function withDraw() public payable {
        (bool s, ) = owner.call{value: address(this).balance}("");
        require(s);
    }
}
