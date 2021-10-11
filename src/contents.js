/* src/content.js */
/*global chrome*/
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import anime from 'animejs/lib/anime.es.js';
import './index.css';
import "./content.css";
import './Animation.scss';

const ContentReact = () => {
  const [file, setFile] = useState(null);
  useEffect(() => {
    if(!chrome.runtime){
      console.log('currently not running as chrome extension');
      return;
    }
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
          console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
  
          if (request.hasOwnProperty('file')){
            console.log(request)
            setFile(request.file)
          }
    });
  })

  useEffect(() => {

    anime({
      targets: '.react-extension__hat',
      translateY: 3,
      translateX: 1,
      loop: true,
      easing: 'easeInOutSine',
      direction: 'alternate'
    });

    anime({
      targets: '.react-extension__head',
      translateY: 2,
      loop: true,
      easing: 'easeInOutSine',
      direction: 'alternate'
    });

    anime({
      targets: '.react-extension__left_arm, .react-extension__right_arm',
      rotate: '5deg',
      loop: true,
      easing: 'easeInOutSine',
      direction: 'alternate'
    });
  }, [])
    return (
      <div className={'react-extension'}>
        <div className="game" style={{bottom:0}}>
          <div style={{position:'relative'}}>
            {/* <img src={arm} alt='left_arm' className="react-extension__left_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', left: 0, height: charsProps.armHeight + 'px'}} />
            <img src={arm} alt='right_arm' className="react-extension__right_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', right: 0, height: charsProps.armHeight + 'px', transform: 'scaleX(-1)'}} />
            <img src={body} alt='bo123' className="react-extension__body" style={{position: 'absolute', top: '90px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.bodyHeight + 'px'}}/>
            <img src={head} alt='he123' className="react-extension__head" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.headHeight + 'px', zIndex:100}} />
            {hat && <div style={{position: 'absolute', top: '-260px', zIndex: 10000, width: '150px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: '300px '}}><img src={hat} style={{width: '100%', position: 'absolute', 'bottom': 0}} alt='hat' className="react-extension__hat" /></div>} */}
            { file && <div className="char-canvas-large char-canvas-large__running h-20" style={
            {
              // height: "99px",
              backgroundImage: `url(${file.http_link})`,

            }
          }></div>}
            
          </div>
        </div>
      </div>
    )
}

const app = document.createElement('div');
document.body.appendChild(app);
ReactDOM.render(<ContentReact />, app);