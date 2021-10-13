/*global chrome*/
import { useState, useEffect } from 'react';
import Axios from 'axios';
import './App.css';
import './Animation.scss';

function App() {
  const onItemClick = (key) => {
    if (!chrome.tabs) {
      console.log('currently not running as chrome extension');
      return;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      console.log('send message from popup', key)
      chrome.tabs.sendMessage(tabs[0].id, { file: key }, function (response) {
        console.log('popup responded')
      });
    });
  }

  const [files, setFiles] = useState([]);

  const fetchData = async () => {
    const data = await Axios.get('https://tonywei92.github.io/fresh-data/files.json').then(response => response.data);
    setFiles(data);
  }

  useEffect(() => {
    fetchData()
  }, [])
  return (
    <div className="App p-4 bg-gray-50 w-64">
      <div className="text-center font-medium mb-2">Cryptochum</div>
      <div className="h-36 flex flex-wrap -mx-2 mb-4">
        {files.map(file => (
          <div key={file.name} className="w-1/3 flex items-center justify-center px-2 border border-transparent hover:border-blue-300 cursor-pointer transition-none" onClick={() => onItemClick(file)}>
            <div className="p-1 char-canvas" style={
              {
                backgroundImage: `url(${file.http_link})`,
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
