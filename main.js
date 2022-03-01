const appId = window.appId;
const serverUrl = window.serverUrl;
const CONTRACT_ADDRESS = window.contract_address;
const SAMPLE_NFT_URI = 'https://ipfs.moralis.io:2053/ipfs/QmQjF27mYRuYDZ46nmAv5e4pK37mjNCbZKbc24jzjdkXZp';
const SAMPLE_NFT_METADATA = 'https://ipfs.moralis.io:2053/ipfs/QmeRPHnUvsiPvRK95o8UUE6ejieeqvsd8aRa2nyYEHyG8s';
Moralis.start({ serverUrl, appId });

const web3 = new Web3(window.ethereum);

let mainDom;
let currentUser;
/** Login user, authenticate with MetaMask */
async function login() {
  let user = Moralis.User.current();
  if (!user) {
    try {
      user = await Moralis.authenticate({ signingMessage: "Hello You!" })
      console.log(user)
      console.log(user.get('ethAddress'))
    } catch (error) {
      console.log(error)
    }
  } else {
    currentUser = user.get('ethAddress');
    console.log('already signed in to address ' + currentUser)
  }
}

/** Logout user **/
async function logOut() {
  await Moralis.User.logOut();
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
  const tokenId = nft.token_id;
  const tokenAddress = nft.token_address;
  const tokenAddDisplay = `${tokenAddress.slice(0, 7)}......${tokenAddress.slice(-7)}`
  const tokenMetaData = JSON.parse(nft.metadata);
  const { image, description, name } = tokenMetaData;
  const col = document.createElement('div');
  col.className = 'col';

  const displayHtml = `<div
      class="w-full min-h-80 border border-gray-300 aspect-w-1 aspect-h-1 rounded-md overflow-hidden group-hover:opacity-75">
        <img src="${image}" class="w-full h-full object-center object-cover">
      </div>
      <div class="mt-4 flex">
        <div>
          <h3 class="text-md text-gray-700">${name}</h3>
          <p class="mt-1 text-sm text-gray-500">${description}</p>
          <p class="text-sm text-gray-500">Contract Address: ${tokenAddDisplay}</p>
          <p class="text-sm text-gray-500">TokenId: ${tokenId}</p>
          <p class="text-sm mt-2">
          <a href="https://testnets.opensea.io/assets/${tokenAddress}/${tokenId}" 
            class="hover:text-emerald-400" 
            role="button">To Opensea >> </a></p>
        </div>
      </div>`
  col.innerHTML = displayHtml;
  mainDom.appendChild(col);
}

/** upload NFT to IFPS  **/
async function upload() {
  const fileInput = document.getElementById("nftUpload_input");
  const data = fileInput.files[0];
  if (!data) {
    alert("no file chosen");
    return;
  }
  const file = new Moralis.File(data.name, data);
  await file.saveIPFS();
  const imageURI = file.ipfs();
  console.log(imageURI, file.hash())
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
  const metadataFile = new Moralis.File(`metadata.json`, { base64: btoa(JSON.stringify(metadata)) });
  await metadataFile.saveIPFS();
  const metadataURI = metadataFile.ipfs();
  console.log(metadataURI)
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
  const txt = await mintFinalToken(metadataURI, amount).then(notifySuccess);
  console.log('Successfully minted', txt);
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

// initialize app
(async function init() {
  mainDom = document.getElementById('nft-grid');
  await login();
  await getAllNFTs();
  SAMPLE_NFT_URI && setNewNFTLocation(SAMPLE_NFT_URI);
  SAMPLE_NFT_METADATA && setNewNFTMetadataJsonLocation(SAMPLE_NFT_METADATA);
})()


// attach button action
document.getElementById('btn-login').onclick = login;
document.getElementById('btn-logout').onclick = logOut;
document.getElementById('btn-upload').onclick = upload;
document.getElementById('btn-create-metadata').onclick = generateTokenMeta;
document.getElementById('btn-mint').onclick = mint;