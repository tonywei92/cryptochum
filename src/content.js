/* src/content.js */
/*global chrome*/
import React, {useEffect, useState} from 'react';
import ReactDOM from 'react-dom';
import anime from 'animejs/lib/anime.es.js';
import "./content.css";
import body from './assets/characters/boy_1/body1.png';
import head from './assets/characters/boy_1/head1.png';
import arm from './assets/characters/boy_1/arm.png';

import hatCowboy from './assets/accessories/hat_cowboy.png';
import hatParty from './assets/accessories/hat_party.png';
import hatChef from './assets/accessories/hat_chef.png';

const hats = {
  cowboy: hatCowboy,
  party: hatParty,
  chef: hatChef
};

const charsProps = {
  headHeight: 100,
  bodyHeight: 200,
  armHeight: 100
}

const ContentReact = () => {
  const [hat, setHat] = useState(null);
  useEffect(() => {
    chrome.runtime.onMessage.addListener(
      function(request, sender, sendResponse) {
          console.log(sender.tab ?
                  "from a content script:" + sender.tab.url :
                  "from the extension");
  
          if (request.hasOwnProperty('hat')){
            setHat(hats[request.hat])
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
          <div style={{position:'relative', width: '200px'}}>
            <img src={arm} alt='left_arm' className="react-extension__left_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', left: 0, height: charsProps.armHeight + 'px'}} />
            <img src={arm} alt='right_arm' className="react-extension__right_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', right: 0, height: charsProps.armHeight + 'px', transform: 'scaleX(-1)'}} />
            <img src={body} alt='bo123' className="react-extension__body" style={{position: 'absolute', top: '90px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.bodyHeight + 'px'}}/>
            <img src={head} alt='he123' className="react-extension__head" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.headHeight + 'px', zIndex:100}} />
            {hat && <div style={{position: 'absolute', top: '-260px', zIndex: 10000, width: '150px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: '300px '}}><img src={hat} style={{width: '100%', position: 'absolute', 'bottom': 0}} alt='hat' className="react-extension__hat" /></div>}
          </div>
        </div>
      </div>
    )
}

const app = document.createElement('div');
document.body.appendChild(app);
ReactDOM.render(<ContentReact />, app);