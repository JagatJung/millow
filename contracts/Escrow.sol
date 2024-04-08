//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

interface IERC721 {
    function transferFrom(
        address _from,
        address _to,
        uint256 _id
    ) external;
}

contract Escrow {
    address public nftAddress; 
    address payable public seller;
    address public inspector;
    address public lender;

    mapping(uint256 => bool) public isListed;
    mapping(uint256 => uint256) public purchasPrice;
    mapping(uint256 => uint256) public escrowAmount;
    mapping(uint256 => address) public buyer;
    mapping(uint256=> bool) public inspectorPassed;
    mapping(uint256 => mapping(address => bool)) public approval;
    
    modifier OnlySeller(){
        require(msg.sender == seller, "only seller can sell stuff");
        _;
    }

    modifier onlyBuyers(uint256 _nftID) {
        require(msg.sender == buyer[_nftID], "only buyers can buy");
        _;
    }    

    modifier onlyInspector() {
        require(msg.sender == inspector, "Only inpector can see this");
        _;
    }

    constructor(address _nftAddress, address payable _seller, address _inspector, address _lender) {
        nftAddress = _nftAddress;
        seller = _seller;
        inspector = _inspector;
        lender = _lender;   
    }


    function list(uint256 _nftID, address _buyers, uint256 _purchasePrice, uint256 _escrowAmount) public payable OnlySeller {
        //transer NFT from seller to this contract
        IERC721(nftAddress).transferFrom(msg.sender, address(this), _nftID);
        isListed[_nftID] = true;
        purchasPrice[_nftID] = _purchasePrice;
        escrowAmount[_nftID] = _escrowAmount;
        buyer[_nftID] = _buyers;
    }

    //put property under contract
    function depositEarnest(uint256 _nftID) public payable onlyBuyers(_nftID) {
        require(msg.value >=escrowAmount[_nftID]);
    }

    //approve sale 
    function approveSale(uint256 _nftID) public {
        approval[_nftID][msg.sender] = true;
    }

    //updates inspection status
    function updateInspectionStatus(uint256 _nftID, bool _passed) public onlyInspector {
        inspectorPassed[_nftID] = _passed;
    }



    function finalizeSales(uint256 _nftID) public {
        require(inspectorPassed[_nftID]);
        require(approval[_nftID][buyer[_nftID]]);
        require(approval[_nftID][seller]);
        require(approval[_nftID][lender]);
        require(address(this).balance >= purchasPrice[_nftID]);

        isListed[_nftID] = false;

        (bool sucess, ) = payable(seller).call{value:address(this).balance}("");
        require(sucess);

        IERC721(nftAddress).transferFrom(address(this), buyer[_nftID], _nftID);
    } 

    function cancelSale(uint256 _nftID) public{
        if(inspectorPassed[_nftID]) {
            payable(seller).transfer(address(this).balance);
        } else {
            payable(buyer[_nftID]).transfer(address(this).balance);
        }
    } 

    receive() external payable {}

    function getBalance() public view returns(uint256) {
        return address(this).balance;
    } 
}
