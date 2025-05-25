// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// 블록체인 기반 동호회 회비 관리 스마트 컨트랙트
contract ClubFee {
    address public owner;  // 컨트랙트 관리자(소유자)의 주소

    // 회원 정보 구조체
    struct Member {
        string name;        // 회원 이름
        uint totalPaid;     // 누적 납부 금액
        bool isRegistered;  // 등록 여부 확인
    }

    mapping(address => Member) public members;  // 회원 주소 -> 회원 정보 매핑
    address[] public memberList;               // 등록된 회원 주소 목록

    // 소유자만 접근할 수 있도록 제한하는 modifier
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can execute.");
        _;
    }

    // 생성자: 컨트랙트를 배포한 주소를 소유자로 설정
    constructor() {
        owner = msg.sender;
    }

    // 관리자: 새로운 회원 등록
    function registerMember(address _addr, string calldata _name) public onlyOwner {
        require(!members[_addr].isRegistered, "Member already registered.");  // 중복 등록 방지
        members[_addr] = Member({
            name: _name,
            totalPaid: 0,
            isRegistered: true
        });
        memberList.push(_addr);  // 회원 주소 목록에 추가
    }

    // 회원: 회비 납부 (ETH 전송)
    function payFee() public payable {
        require(members[msg.sender].isRegistered, "Not a registered member.");  // 등록 여부 확인
        require(msg.value > 0, "Must send ETH greater than 0.");  // 0 ETH 이상만 허용
        members[msg.sender].totalPaid += msg.value;  // 누적 납부액 증가
    }

    // 회원: 본인 정보 조회 (이름, 총 납부액)
    function getMyInfo() public view returns (string memory, uint) {
        require(members[msg.sender].isRegistered, "Not a registered member.");
        Member memory m = members[msg.sender];
        return (m.name, m.totalPaid);
    }

    // 관리자: 전체 회원 주소 목록 조회
    function getAllMembers() public view onlyOwner returns (address[] memory) {
        return memberList;
    }

    // 관리자: 특정 회원의 이름 및 납부 정보 조회
    function getMemberInfo(address _addr) public view onlyOwner returns (string memory, uint) {
        require(members[_addr].isRegistered, "Member not registered.");
        Member memory m = members[_addr];
        return (m.name, m.totalPaid);
    }

    // 관리자: 컨트랙트에 누적된 회비 출금
    function withdraw(uint _amount) public onlyOwner {
        require(address(this).balance >= _amount, "Insufficient contract balance.");  // 잔액 확인
        payable(owner).transfer(_amount);  // 소유자에게 출금
    }

    // 누구나: 컨트랙트 내 보유 ETH 잔액 조회
    function getBalance() public view returns (uint) {
        return address(this).balance;
    }
}
