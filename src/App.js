/*global chrome*/
import logo from './logo.svg';
import './App.css';
import hatCowboy from './assets/accessories/hat_cowboy.png';
import hatParty from './assets/accessories/hat_party.png';
import hatChef from './assets/accessories/hat_chef.png';

const hats = {
  cowboy: hatCowboy,
  party: hatParty,
  chef: hatChef
};

function App() {
  const onItemClick = (key) => {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      console.log('send message from popup', key)
      chrome.tabs.sendMessage(tabs[0].id, {hat: key}, function(response) {
          console.log('popup responded')
      });
  });
  }
  return (
    <div className="App p-4 bg-gray-50 w-64">
      <div className="text-center font-medium mb-2">Cryptochum</div>
      <div className="h-36 flex flex-wrap -mx-2 mb-4">
        {Object.keys(hats).map(hat => (
          <div key={hat} className="w-1/3 h-20 flex items-center justify-center px-2 border border-transparent hover:border-blue-300 cursor-pointer transition-all" onClick={() =>onItemClick(hat)}>
            <div className="p-1 h-full">
              <img src={hats[hat]} alt={hat} className="h-full object-contain"/>
            </div>
          </div>
        ))}
        <div className="w-1/3 h-20 flex items-center justify-center px-2 border border-transparent hover:border-blue-300 cursor-pointer transition-all" onClick={() =>onItemClick('')}>
            <div className="p-1 h-full flex items-center justify-center">
              <em>None</em>
            </div>
        </div>
      </div>
    </div>
  );
}

export default App;
