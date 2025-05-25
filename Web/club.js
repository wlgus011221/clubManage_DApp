let web3;
let contract;
let userAccount;
const contractAddress = '0x6028A58bfa2Cdd7b5E204f47997E31B91305209E';
const contractABI = [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [],
        "name": "getAllMembers",
        "outputs": [
            {
                "internalType": "address[]",
                "name": "",
                "type": "address[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getBalance",
        "outputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_addr",
                "type": "address"
            }
        ],
        "name": "getMemberInfo",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getMyInfo",
        "outputs": [
            {
                "internalType": "string",
                "name": "",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "",
                "type": "uint256"
            }
        ],
        "name": "memberList",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "name": "members",
        "outputs": [
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "totalPaid",
                "type": "uint256"
            },
            {
                "internalType": "bool",
                "name": "isRegistered",
                "type": "bool"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "payFee",
        "outputs": [],
        "stateMutability": "payable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_addr",
                "type": "address"
            },
            {
                "internalType": "string",
                "name": "_name",
                "type": "string"
            }
        ],
        "name": "registerMember",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "_amount",
                "type": "uint256"
            }
        ],
        "name": "withdraw",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Ganache RPC 주소 (기본값)
const ganacheRPC = 'http://127.0.0.1:7545'; 

console.log("ABI 로딩 확인:", contractABI);

window.addEventListener("load", async () => {
    web3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));

    console.log("웹3 공급자 확인:", web3.currentProvider);

    const accounts = await web3.eth.getAccounts();
    const walletSelection = document.getElementById("wallet-selection");

    accounts.forEach((addr, idx) => {
        walletSelection.innerHTML += `
            <div class="radio">
                <label><input type="radio" name="wallet" value="${addr}" ${idx === 0 ? 'checked' : ''}> ${addr}</label>
            </div>`;
    });

    document.querySelectorAll('input[name="wallet"]').forEach(radio => {
        radio.addEventListener('change', () => {
            userAccount = radio.value;
            logEvent(`지갑 변경됨: ${userAccount}`);
            init(); // 새 지갑으로 UI 업데이트
        });
    });

    userAccount = accounts[0];
    init();
});

// 이벤트 로그 출력
function logEvent(message) {
    const logDiv = document.getElementById("eventLog");
    logDiv.innerText += `[${new Date().toLocaleTimeString()}] ${message}\n`;
}

// 컨트랙트 잔액 조회
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

// 관리자 기능 : 회원 전체 조회
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

// 관리자 기능 : 회원 등록
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
        loadMembers(); // 회원 목록 새로고침
    } catch (err) {
        logEvent(`회원 등록 실패: ${err.message}`);
        document.getElementById('registerStatus').innerText = "회원 등록 실패: " + err.message;
    }
}

// 관리자 기능 : 회원 상세 조회 함수
async function getMemberInfo() {
    const addr = document.getElementById('memberDetailAddress').value.trim();
    if (!web3.utils.isAddress(addr)) {
        logEvent("유효한 이더리움 주소를 입력하세요.");
        return;
    }
    try {
        const memberData = await contract.methods.members(addr).call();
        // members가 구조체이면 배열이나 객체 형태로 반환됨
        let info = `회원 주소: ${addr}\n`;
        info += `이름: ${memberData.name || "정보 없음"}\n`;
        info += `등록 여부: ${memberData.isRegistered ? "등록됨" : "미등록"}\n`;
        info += `납부한 회비: ${web3.utils.fromWei(memberData.totalPaid || '0', 'ether')} ETH\n`;
        // 필요에 따라 추가 정보 출력

        document.getElementById('memberInfo').innerText = info;
        logEvent(`${addr} 회원 상세 정보 조회 완료.`);
    } catch (err) {
        logEvent(`회원 상세 조회 실패: ${err.message}`);
        document.getElementById('memberInfo').innerText = "회원 정보 조회 실패: " + err.message;
    }
}

// 관리자 기능 : 회비 출금
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
        loadContractBalance(); // 잔액 업데이트
    } catch (err) {
        logEvent(`출금 실패: ${err.message}`);
        document.getElementById('withdrawStatus').innerText = "출금 실패: " + err.message;
    }
}

// 일반 회원 기능 : 회비 납부
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

        // 납부 후 내 정보 새로고침
        getMyInfo();

    } catch (error) {
        payStatus.innerText = "납부 실패: " + error.message;
        logEvent("회비 납부 실패: " + error.message);
    }
}

// 일반 회원 기능 : 내 정보 조회
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


// 버튼 이벤트 등록 (init 함수 내부 또는 적절한 위치에 추가)
document.getElementById('registerMemberBtn').addEventListener('click', registerMember);
document.getElementById('getMemberInfoBtn').addEventListener('click', getMemberInfo);
document.getElementById('withdrawBtn').addEventListener('click', withdraw);

document.getElementById('payFeeBtn').addEventListener('click', payFee);
document.getElementById('getMyInfoBtn').addEventListener('click', getMyInfo);

async function init() {
    try {
        contract = new web3.eth.Contract(contractABI, contractAddress);

        const owner = await contract.methods.owner().call();
        logEvent(`컨트랙트 소유자: ${owner}`);

        if (owner.toLowerCase() === userAccount.toLowerCase()) {
            $('#adminSection').show();
            $('#userSection').hide();
            await loadMembers();
        } else if (await contract.methods.members(userAccount).call().then(m => m.isRegistered)) {
            $('#adminSection').hide();
            $('#userSection').show();
        } else {
            $('#adminSection').hide();
            $('#userSection').hide();
            logEvent("선택된 지갑은 관리자도 아니고 등록된 회원도 아닙니다.");
            alert("선택된 지갑은 관리자도 아니고 등록된 회원도 아닙니다.")
        }

        await loadContractBalance();


        loadContractBalance();
    } catch (err) {
        console.error("init() 오류:", err);
        logEvent(`init() 오류 발생: ${err.message}`);
        $('#adminSection').hide();
        $('#userSection').hide();
    }
}

