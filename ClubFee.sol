// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract ClubFee {
    address public owner;

    struct Member {
        string name;
        uint totalPaid;
        bool isRegistered;
    }

    mapping(address => Member) public members;
    address[] public memberList;

    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute.");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    // 관리자 : 회원 등록
    function registerMember(address _addr, string calldata _name) public onlyOwner {
        require(!members[_addr].isRegistered, "Member already registered.");
        members[_addr] = Member({
            name: _name,
            totalPaid: 0,
            isRegistered: true
        });
        memberList.push(_addr);
    }

    // 회원: 회비 납부
    function payFee() public payable {
        require(members[msg.sender].isRegistered, "Not a registered member.");
        require(msg.value > 0, "Must send ETH greater than 0.");
        members[msg.sender].totalPaid += msg.value;
    }

    // 회원: 내 정보 조회
    function getMyInfo() public view returns (string memory, uint) {
        require(members[msg.sender].isRegistered, "Not a registered member.");
        Member memory m = members[msg.sender];
        return (m.name, m.totalPaid);
    }

    // 관리자: 회원 전체 조회
    function getAllMembers() public view onlyOwner returns (address[] memory) {
        return memberList;
    }

    // 관리자: 특정 회원 정보 조회
    function getMemberInfo(address _addr) public view onlyOwner returns (string memory, uint) {
        require(members[_addr].isRegistered, "Member not registered.");
        Member memory m = members[_addr];
        return (m.name, m.totalPaid);
    }

    // 관리자: 회비 출금
    function withdraw(uint _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient contract balance.");
        payable(owner).transfer(_amount);
    }

    // 컨트랙트 잔액 조회
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
