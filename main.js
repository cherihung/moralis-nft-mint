const Alpine = window.Alpine;
const appId = window.appId;
const serverUrl = window.serverUrl;
const windowParam = new URLSearchParams(document.location.search)
const CONTRACT_ADDRESS = windowParam.get('contract') || window.contract_address;

// const SAMPLE_NFT_URI = 'https://ipfs.moralis.io:2053/ipfs/QmQjF27mYRuYDZ46nmAv5e4pK37mjNCbZKbc24jzjdkXZp';
// const SAMPLE_NFT_METADATA = 'https://ipfs.moralis.io:2053/ipfs/QmeRPHnUvsiPvRK95o8UUE6ejieeqvsd8aRa2nyYEHyG8s';
const SAMPLE_NFT_URI = null;
const SAMPLE_NFT_METADATA = null;

Moralis.start({ serverUrl, appId });

const web3 = new Web3(window.ethereum);

let mainDom, contractDom, walletDom, loginBtnDom;

const currentState = Alpine.reactive({
  userAddr: undefined,
  contract: CONTRACT_ADDRESS
})

/** Login user, authenticate with MetaMask */
async function login() {
  let user = await Moralis.User.current();
  if (!user) {
    try {
      user = await Moralis.authenticate({ signingMessage: "Welcome you!" });
      currentState.userAddr = user.get('ethAddress');
    } catch (error) {
      console.log(error)
    }
  } else {
    currentState.userAddr = user.get('ethAddress');
    console.log('already logged in')
  }
}

/** Logout user **/
async function logOut() {
  await Moralis.User.logOut();
  currentState.userAddr = undefined;
  console.log("logged out");
}

/** get all NFTs to my smart contract **/
async function getAllNFTs() {
  const options = { address: CONTRACT_ADDRESS, chain: "rinkeby" };
  const response = await Moralis.Web3API.token.getAllTokenIds(options);
  const NFTdata = response.result;
  console.log(response)
  for (const item in NFTdata) {
    renderNFT(NFTdata[item])
  }
}

/** render each NFT **/
async function renderNFT(nft) {
  const tokenId = truncateAddress(nft.token_id);
  const tokenForBtn = nft.token_id.slice(0, 6);
  const tokenAddress = nft.token_address;
  const tokenAddDisplay = truncateAddress(tokenAddress);
  let tokenMetaData = JSON.parse(nft.metadata);
  // backup fetch from token_uri directly if backlog problem still exist on polygon
  // https://forum.moralis.io/t/metadata-returning-null/4343/8
  if (!tokenMetaData) {
    try {
      const _metaData = await fetch(nft.token_uri);
      tokenMetaData = await _metaData.json()
    } catch (err) {
      console.log('cannot get metadata from uri');
      tokenMetaData = {
        image: "https://dummyimage.com/100x100/000/fff&text=fake",
        name: 'oops',
        description: 'oops oops'
      }
    }
  }

  const { image, description, name } = tokenMetaData;
  const col = document.createElement('div');
  col.className = 'col';

  const displayHtml = `<div
      class="border border-gray-300 rounded-md overflow-hidden group-hover:opacity-75" style="width:250px;height:250px">
        <img src="${image}" class="w-full h-full object-center object-cover">
      </div>
      <div class="mt-4 flex">
        <div>
          <h3 class="text-md text-gray-800 font-semibold">${name}</h3>
          <p class="mt-1 text-sm text-gray-700">${description}</p>
          <p class="text-sm text-gray-700">Contract Address: ${tokenAddDisplay}</p>
          <p class="text-sm text-gray-700">TokenId: ${tokenId}</p>
          <p class="text-sm mt-2">
          <a href="https://testnets.opensea.io/assets/${tokenAddress}/${tokenId}" 
            class="text-blue-600 hover:text-blue-400" 
            role="button">Opensea >> </a></p>
          <p class="mt-2 text-sm">
            <button 
              class="btn-resync text-gray-400 hover:text-blue-400" 
              data-id="${nft.token_id}" id="btn-${tokenForBtn}" 
              type="button">Resync
            Metadata</button>
          </p>
        </div>
      </div>`
  col.innerHTML = displayHtml;
  mainDom.appendChild(col);
  document.getElementById(`btn-${tokenForBtn}`).onclick = resyncMetadata;
}

/** resync metadata **/
async function resyncMetadata(event) {
  const tokenId = event.currentTarget.getAttribute('data-id')
  const options = {
    address: CONTRACT_ADDRESS,
    token_id: tokenId,
    flag: "metadata",
  };
  const metadata = await Moralis.Web3API.token.reSyncMetadata(options);

  console.log('resynced: ', metadata);
}

/** upload NFT to IFPS  **/
async function upload() {
  const fileInput = document.getElementById("nftUpload_input");
  const data = fileInput.files[0];
  if (!data) {
    alert("no file chosen");
    return;
  }
  console.log('uploading....')
  addLoadingState();
  const file = new Moralis.File(data.name, data);
  await file.saveIPFS();
  removeLoadingState();
  const imageURI = file.ipfs();
  console.log('sucess:uploaded', file.hash())
  setNewNFTLocation(imageURI);
}

/** generate metadata JSON file for new token */
async function generateTokenMeta() {
  const imageUri = document.getElementById('ifps_imageUri_input').value;
  const name = document.getElementById('nftName_input').value;
  const description = document.getElementById('nftDescription_input').value;
  if (!imageUri || !name || !description) {
    alert('missing required info');
    return;
  }
  const metadata = {
    name,
    description,
    image: imageUri
  }
  console.log('generating...')
  addLoadingState();
  const metadataFile = new Moralis.File(`metadata.json`, { base64: btoa(JSON.stringify(metadata)) });
  await metadataFile.saveIPFS();
  removeLoadingState();
  const metadataURI = metadataFile.ipfs();
  console.log('success: generated:', metadataURI)
  setNewNFTMetadataJsonLocation(metadataURI);
}

/** trigger minting new token */
async function mint() {
  const metadataURI = document.getElementById('nftMetadata_input').value;
  const _amount = document.getElementById('nftAmount_input').value;
  if (!metadataURI || !_amount) {
    alert('missing required info');
    return;
  }
  const amount = parseInt(_amount);
  console.log('minting...', metadataURI);
  addLoadingState();
  const txt = await mintFinalToken(metadataURI, amount);
  removeLoadingState();
  notifySuccess(txt);
  console.log('success:minted', txt);
}

/** mint token on the eth chain **/
async function mintFinalToken(_uri, _amount) {
  const encodedFunction = web3.eth.abi.encodeFunctionCall({
    name: "mintToken",
    type: "function",
    inputs: [{
      type: 'string',
      name: 'tokenURI'
    }, {
      type: 'uint256',
      name: 'amount'
    }]
  }, [_uri, _amount]);

  const transactionParameters = {
    to: CONTRACT_ADDRESS,
    from: currentUser,
    data: encodedFunction
  };
  const txt = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters]
  });
  console.log('has minted', txt)
  return txt;
}

async function notifySuccess(value) {
  document.getElementById("newNFT_result").innerHTML = `<span>${value}</span>`;
}

function setNewNFTLocation(newVal) {
  document.getElementById('ifps_imageUri_input').value = newVal;
}

function setNewNFTMetadataJsonLocation(newVal) {
  document.getElementById('nftMetadata_input').value = newVal;
}

function truncateAddress(add) {
  return `${add.slice(0, 7)}......${add.slice(-7)}`
}

function addLoadingState() {
  document.getElementById('form-container').classList.add('opacity-25');
}

function removeLoadingState() {
  document.getElementById('form-container').classList.remove('opacity-25');
}

// initialize app
(async function init() {
  mainDom = document.getElementById('nft-grid');
  contractDom = document.getElementById('current-contract-address');
  walletDom = document.getElementById('wallet-id');
  loginBtnDom = document.getElementById('btn-login');

  Alpine.effect(() => {
    walletDom.innerText = currentState.userAddr ? 'Using Wallet: ' + truncateAddress(currentState.userAddr) : '';
    currentState.userAddr && loginBtnDom.setAttribute('disabled', true);
    !currentState.userAddr && loginBtnDom.removeAttribute('disabled');
    contractDom.innerText = currentState.contract;
  })

  await login();
  await getAllNFTs();
  // for testing purpose
  SAMPLE_NFT_URI && setNewNFTLocation(SAMPLE_NFT_URI);
  SAMPLE_NFT_METADATA && setNewNFTMetadataJsonLocation(SAMPLE_NFT_METADATA);
})()


// attach button action
document.getElementById('btn-login').onclick = login;
document.getElementById('btn-logout').onclick = logOut;
document.getElementById('btn-upload').onclick = upload;
document.getElementById('btn-create-metadata').onclick = generateTokenMeta;
document.getElementById('btn-mint').onclick = mint;