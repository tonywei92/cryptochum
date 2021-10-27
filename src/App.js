/*global chrome*/
import { useState, useEffect } from 'react';
import messageConstants from './constants/message_types';
import './App.css';
import './Animation.scss';

const sendMessage = (payload) => {
  if (!chrome.runtime) {
    console.log('currently not running as chrome extension');
    return;
  }

  chrome.runtime.sendMessage(payload, function (response) {
    console.log(response);
  });

  chrome.tabs.query({currentWindow: true, active: true}, function (tabs){
    var activeTab = tabs[0];
    chrome.tabs.sendMessage(activeTab.id, payload);
   });
}

function App() {
  const [characterProp, setCharacterProp] = useState({stats:{ happy: 0, health: 0, hunger: 0}});
  const [character, setCharacter] = useState();
  const [characters, setCharacters] = useState([]);
  const onItemClick = (char) => {
    sendMessage({ type: messageConstants.CHARACTER, character: char, })
    setCharacter(char);
  }

  const giveCarrot = () => {
    sendMessage({type: messageConstants.GIVE_CARROT})
  }

  useEffect(() => {
    console.log('useEffect')
    if (!chrome.runtime) {
      console.log('currently not running as chrome extension');
      return;
    }
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        console.log("get message from content", request);
        if (request.hasOwnProperty('type')) {
          if (request.type === messageConstants.STATS) {
            setCharacterProp({...characterProp, stats: { ...characterProp.stats, ...request.stats}})
          }
          if (request.type === messageConstants.CHARACTERS) {
            setCharacters(request.characters)
          }
          if (request.type === messageConstants.CHARACTER_CURRENT) {
            console.log("messageConstants.CHARACTER_CURRENT", request)
            if(request.character){
              setCharacter(request.character)
            }
          }
        }
      });
    sendMessage({ type: messageConstants.REQUEST_STATS })
    sendMessage({ type: messageConstants.REQUEST_CHARACTERS })
    sendMessage({ type: messageConstants.REQUEST_CHARACTER_CURRENT })

  }, [])
  return (
    <div className="App p-4 bg-gray-50 w-64">
      <div className="menu top-0 right-0 text-sm transition-all">
        <div className="font-medium mb-2">Cryptochum</div>
        <div className="flex -mx-2 items-center mb-2">
          <div className="w-20 px-2 text-left">fun</div>
          <div className="flex-1 px-2 h-4 bg-green-50 rounded">
            <div className="bg-green-500 h-full" style={{ width: characterProp.stats.happy + "%" }}>
            </div>
          </div>
          <div className="w-16 px-2">{characterProp.stats.happy + "%"}</div>
        </div>
        <div className="flex -mx-2 items-center mb-2">
          <div className="w-20 px-2 text-left">hunger</div>
          <div className="flex-1 h-4 bg-green-50 rounded px-2"><div className="bg-green-500 h-full" style={{ width: characterProp.stats.hunger + "%" }}>
          </div>
          </div>
          <div className="w-16 px-2">{characterProp.stats.hunger + "%"}</div>
        </div>
        <div className="flex -mx-2 items-center mb-2">
          <div className="w-20 px-2 text-left">health</div>
          <div className="flex-1 h-4 bg-green-50 rounded px-2"><div className="bg-green-500 h-full" style={{ width: characterProp.stats.health + "%" }}>
          </div>
          </div>
          <div className="w-16 px-2">{characterProp.stats.health + "%"}</div>
        </div>
        <div className="flex -mx-2 items-center mb-2">
          <div className="px-2 flex justify-center items-center w-full">
            { character && <button className="text-white font-medium text-center bg-yellow-500 text-sm px-2 py-1 border-b-4 border-yellow-900 hover:border-yellow-700" onClick={giveCarrot}>Give carrot! 🥕</button> }
          </div>
        </div>
      </div>

      <div className="h-36 flex flex-wrap -mx-2 mb-4">
        {console.log('characters', characters)}
        {characters.map(character => (
          <div key={character.name} className="w-1/3 flex items-center justify-center px-2 border border-transparent hover:border-blue-300 cursor-pointer transition-none" onClick={() => onItemClick(character)}>
            <div className="p-1 char-canvas" style={
              {
                backgroundImage: `url(${character.http_link})`,
              }
            }>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
