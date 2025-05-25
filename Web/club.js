let web3;              // Web3 인스턴스
let contract;          // 스마트 컨트랙트 객체
let userAccount;       // 현재 선택된 사용자 지갑 주소

// 배포된 스마트 컨트랙트 주소
const contractAddress = '0x6028A58bfa2Cdd7b5E204f47997E31B91305209E';

// 스마트 컨트랙트 ABI 정의 (함수 및 상태 변수 정의)
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "getAllMembers",       // 전체 회원 주소 배열 반환
        "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",          // 컨트랙트 잔액 반환
        "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "_addr", "type": "address" }],
        "name": "getMemberInfo",       // 특정 회원 주소에 대한 이름 및 납부금 반환
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyInfo",           // 호출한 사용자의 이름 및 납부금 반환
        "outputs": [
            { "internalType": "string", "name": "", "type": "string" },
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }],
        "name": "memberList",          // 인덱스로 회원 주소 반환
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "name": "members",             // 회원 주소를 키로 이름, 총납부금, 등록여부 반환
        "outputs": [
            { "internalType": "string", "name": "name", "type": "string" },
            { "internalType": "uint256", "name": "totalPaid", "type": "uint256" },
            { "internalType": "bool", "name": "isRegistered", "type": "bool" }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",               // 컨트랙트 소유자 주소 반환
        "outputs": [{ "internalType": "address", "name": "", "type": "address" }],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "payFee",              // 회비 납부 함수 (ETH와 함께 호출)
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "_addr", "type": "address" },
            { "internalType": "string", "name": "_name", "type": "string" }
        ],
        "name": "registerMember",      // 회원 등록 함수
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{ "internalType": "uint256", "name": "_amount", "type": "uint256" }],
        "name": "withdraw",            // 출금 함수
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Ganache의 로컬 RPC 주소
const ganacheRPC = 'http://127.0.0.1:7545'; 

console.log("ABI 로딩 확인:", contractABI);

// 브라우저가 로드되면 실행
window.addEventListener("load", async () => {
    // Web3 인스턴스 생성 및 공급자 설정
    web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

    console.log("웹3 공급자 확인:", web3.currentProvider);

    // 현재 계정 목록 가져오기
    const accounts = await web3.eth.getAccounts();
    const walletSelection = document.getElementById("wallet-selection");

    // 각 계정을 라디오 버튼으로 UI에 표시
    accounts.forEach((addr, idx) => {
        walletSelection.innerHTML += `
            <div class="radio">
                <label><input type="radio" name="wallet" value="${addr}" ${idx === 0 ? 'checked' : ''}> ${addr}</label>
            </div>`;
    });

    // 지갑 선택 시 계정 변경 처리
    document.querySelectorAll('input[name="wallet"]').forEach(radio => {
        radio.addEventListener('change', () => {
            userAccount = radio.value;
            logEvent(`지갑 변경됨: ${userAccount}`);
            init(); // 지갑 변경 시 초기화
        });
    });

    userAccount = accounts[0]; // 기본 계정 설정
    init(); // 초기화 실행
});

// 이벤트 로그를 화면에 출력하는 함수
function logEvent(message) {
    const logDiv = document.getElementById("eventLog");
    logDiv.innerText += `[${new Date().toLocaleTimeString()}] ${message}\n`;
}

// 컨트랙트 잔액을 조회해 표시
async function loadContractBalance() {
    try {
        const balanceWei = await web3.eth.getBalance(contractAddress);
        const balanceEth = web3.utils.fromWei(balanceWei, 'ether');
        document.getElementById('contractBalance').innerText = `${balanceEth} ETH`;
        logEvent(`컨트랙트 잔액: ${balanceEth} ETH`);
    } catch (err) {
        logEvent(`잔액 조회 오류: ${err.message}`);
    }
}

// 전체 회원 목록을 불러오는 관리자 기능
async function loadMembers() {
    try {
        const memberAddresses = await contract.methods.getAllMembers().call({ from: userAccount });
        const list = document.getElementById("memberList");
        list.innerHTML = '';

        memberAddresses.forEach(addr => {
            const li = document.createElement('li');
            li.className = 'list-group-item';
            li.innerText = addr;
            list.appendChild(li);
        });

        logEvent(`총 ${memberAddresses.length}명의 회원을 불러왔습니다.`);
    } catch (err) {
        logEvent("회원 목록 불러오기 오류: " + err.message);
    }
}

// 새로운 회원을 등록하는 관리자 기능
async function registerMember() {
    const addr = document.getElementById('newMemberAddress').value.trim();
    const name = document.getElementById('newMemberName').value.trim();

    if (!web3.utils.isAddress(addr)) {
        logEvent("유효한 이더리움 주소를 입력하세요.");
        document.getElementById('registerStatus').innerText = "유효한 주소를 입력하세요.";
        return;
    }
    if (name.length === 0) {
        logEvent("이름을 입력하세요.");
        document.getElementById('registerStatus').innerText = "이름을 입력하세요.";
        return;
    }

    try {
        await contract.methods.registerMember(addr, name).send({ from: userAccount, gas: 300000 });
        logEvent(`${addr} 회원 등록 완료 (이름: ${name})`);
        document.getElementById('registerStatus').innerText = "회원 등록 성공!";
        loadMembers(); // 목록 갱신
    } catch (err) {
        logEvent(`회원 등록 실패: ${err.message}`);
        document.getElementById('registerStatus').innerText = "회원 등록 실패: " + err.message;
    }
}

// 특정 회원의 상세 정보를 조회하는 관리자 기능
async function getMemberInfo() {
    const addr = document.getElementById('memberDetailAddress').value.trim();
    if (!web3.utils.isAddress(addr)) {
        logEvent("유효한 이더리움 주소를 입력하세요.");
        return;
    }
    try {
        const memberData = await contract.methods.members(addr).call();

        let info = `회원 주소: ${addr}\n`;
        info += `이름: ${memberData.name || "정보 없음"}\n`;
        info += `등록 여부: ${memberData.isRegistered ? "등록됨" : "미등록"}\n`;
        info += `납부한 회비: ${web3.utils.fromWei(memberData.totalPaid || '0', 'ether')} ETH\n`;

        document.getElementById('memberInfo').innerText = info;
        logEvent(`${addr} 회원 상세 정보 조회 완료.`);
    } catch (err) {
        logEvent(`회원 상세 조회 실패: ${err.message}`);
        document.getElementById('memberInfo').innerText = "회원 정보 조회 실패: " + err.message;
    }
}

// 관리자가 회비를 출금하는 함수
async function withdraw() {
    const amountEth = document.getElementById('withdrawAmount').value.trim();

    if (!amountEth || isNaN(amountEth) || Number(amountEth) <= 0) {
        logEvent("유효한 출금 금액을 입력하세요.");
        document.getElementById('withdrawStatus').innerText = "출금 금액을 확인하세요.";
        return;
    }

    const amountWei = web3.utils.toWei(amountEth, 'ether');

    try {
        await contract.methods.withdraw(amountWei).send({ from: userAccount, gas: 200000 });
        logEvent(`관리자가 ${amountEth} ETH 출금하였습니다.`);
        document.getElementById('withdrawStatus').innerText = `출금 완료: ${amountEth} ETH`;
        loadContractBalance(); // 잔액 갱신
    } catch (err) {
        logEvent(`출금 실패: ${err.message}`);
        document.getElementById('withdrawStatus').innerText = "출금 실패: " + err.message;
    }
}

// 일반 회원이 회비를 납부하는 기능
async function payFee() {
    const amountInput = document.getElementById('payAmount');
    const payStatus = document.getElementById('payStatus');

    let amountEth = amountInput.value;
    if (!amountEth || isNaN(amountEth) || amountEth <= 0) {
        payStatus.innerText = "유효한 회비 금액을 입력하세요.";
        return;
    }

    const amountWei = web3.utils.toWei(amountEth, 'ether');
    payStatus.innerText = "납부 처리 중...";

    try {
        await contract.methods.payFee().send({
            from: userAccount,
            value: amountWei,
            gas: 300000
        });

        payStatus.innerText = `성공적으로 ${amountEth} ETH 납부 완료!`;
        logEvent(`회비 ${amountEth} ETH 납부 완료 (계정: ${userAccount})`);
        amountInput.value = '';  // 입력 초기화

        getMyInfo(); // 내 정보 갱신
    } catch (error) {
        payStatus.innerText = "납부 실패: " + error.message;
        logEvent("회비 납부 실패: " + error.message);
    }
}

// 현재 사용자의 정보를 조회하는 기능
async function getMyInfo() {
    const myInfo = document.getElementById('myInfo');

    try {
        const info = await contract.methods.getMyInfo().call({ from: userAccount });
        const name = info[0];
        const totalPaid = info[1];

        let text = `주소: ${userAccount}\n`;
        text += `이름: ${name}\n`;
        text += `납부한 회비: ${web3.utils.fromWei(totalPaid, 'ether')} ETH\n`;

        myInfo.innerText = text;
        logEvent(`${userAccount} 내 정보 조회 완료.`);
    } catch (error) {
        myInfo.innerText = "내 정보 조회 실패: " + error.message;
        logEvent("내 정보 조회 실패: " + error.message);
    }
}

// 버튼 클릭 시 각 기능 연결
document.getElementById('registerMemberBtn').addEventListener('click', registerMember);
document.getElementById('getMemberInfoBtn').addEventListener('click', getMemberInfo);
document.getElementById('withdrawBtn').addEventListener('click', withdraw);
document.getElementById('payFeeBtn').addEventListener('click', payFee);
document.getElementById('getMyInfoBtn').addEventListener('click', getMyInfo);

// 초기화 함수: 사용자 권한에 따라 화면 분기 및 데이터 로드
async function init() {
    try {
        contract = new web3.eth.Contract(contractABI, contractAddress); // 컨트랙트 객체 생성

        const owner = await contract.methods.owner().call(); // 컨트랙트 소유자 확인
        logEvent(`컨트랙트 소유자: ${owner}`);

        if (owner.toLowerCase() === userAccount.toLowerCase()) {
            // 관리자
            $('#adminSection').show();
            $('#userSection').hide();
            await loadMembers();
        } else if (await contract.methods.members(userAccount).call().then(m => m.isRegistered)) {
            // 등록된 일반 회원
            $('#adminSection').hide();
            $('#userSection').show();
        } else {
            // 등록되지 않은 사용자
            $('#adminSection').hide();
            $('#userSection').hide();
            logEvent("선택된 지갑은 관리자도 아니고 등록된 회원도 아닙니다.");
            alert("선택된 지갑은 관리자도 아니고 등록된 회원도 아닙니다.")
        }

        await loadContractBalance(); // 컨트랙트 잔액 표시
        loadContractBalance(); // 중복이지만 별도 호출됨
    } catch (err) {
        console.error("init() 오류:", err);
        logEvent(`init() 오류 발생: ${err.message}`);
        $('#adminSection').hide();
        $('#userSection').hide();
    }
}
