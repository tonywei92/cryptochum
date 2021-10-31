/*global chrome*/

const messageConstants = {
  CHARACTER: 'CHARACTER',
  CHARACTER_CURRENT: 'CHARACTER_CURRENT',
  CHARACTERS: 'CHARACTERS',
  REQUEST_CHARACTER_CURRENT: 'REQUEST_CHARACTER_CURRENT',
  REQUEST_CHARACTERS: 'REQUEST_CHARACTERS',
  STATS: 'STATS',
  REQUEST_STATS: 'REQUEST_STATS',
  REQUEST_ADDRESS: 'REQUEST_ADDRESS',
  SET_ADDRESS: 'SET_ADDRESS',
  ADDRESS: 'ADDRESS',
}

let stats = {
  happy: 0,
  health: 0,
  hunger: 0,
};

let characters = [];

let character = null;

const sendMessage = (payload) => {
  // send to content
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    console.log(tabs)
    chrome.tabs.sendMessage(tabs[0].id, payload, function (response) {
      console.log(response);
    });
  })

  // send to popup
  chrome.runtime.sendMessage(payload);
}

let userAddress = ''

chrome.storage.sync.get(['address'], function(result) {
  userAddress = result.address;
  if(userAddress){
    sendMessage(messageConstants.ADDRESS, userAddress);
    fetchInfo(userAddress);
  }
})

chrome.runtime.onMessageExternal.addListener(
  function(request, sender, sendResponse) {
    if(request.type === messageConstants.SET_ADDRESS){
      fetchInfo(userAddress);
      chrome.storage.sync.set({address: request.address}, function(){
      })
      userAddress = request.address;
      sendMessage(messageConstants.ADDRESS, userAddress);
      fetchInfo();
    }
    console.log('from external', request, sender)
    sendResponse('TESTTT')
    return true;
  });
  

chrome.runtime.onMessage.addListener(function (message, callback) {
  console.log('background', message)
  if (message.hasOwnProperty('type')) {
    if (message.type === messageConstants.REQUEST_STATS) {
      sendMessage({ type: messageConstants.STATS, stats, })
    }

    if (message.type === messageConstants.REQUEST_CHARACTERS) {
      sendMessage({ type: messageConstants.CHARACTERS, characters, })
    }

    if (message.type === messageConstants.STATS) {
      stats = message.stats;
      sendMessage({type: messageConstants.STATS, stats})
    }

    // if (message.type === messageConstants.CHARACTER) {
    //   character = message.character;
    // }

    if (message.type === messageConstants.REQUEST_CHARACTER_CURRENT) {
      sendMessage({type: messageConstants.CHARACTER_CURRENT, character});
    }

    if (message.type === messageConstants.REQUEST_ADDRESS) {
      sendMessage({type: messageConstants.ADDRESS, address: userAddress});
    }
  }
});

const fetchInfo = (address) => {
  fetch(`https://onflow-queue.herokuapp.com/${address}`)
  .then(response => response.json())
  .then(data => {
    stats = data;
    console.log("DATA", data)
    sendMessage({type: messageConstants.STATS, stats})
  });

  // fetch('https://tonywei92.github.io/fresh-data/files.json')
  // .then(response => response.json())
  // .then(data => {
  //   characters = data;
  // });
}