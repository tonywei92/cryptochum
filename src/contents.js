/* src/content.js */
/*global chrome*/
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { throttle } from 'lodash';
import ReactDOM from 'react-dom';
import anime from 'animejs/lib/anime.es.js';
import './index.css';
import "./content.css";
import './Animation.scss';

const STATE_IDLE = 'idle';
const STATE_FREEZE = 'freeze';
const STATE_RUNNING = 'running';
const STATE_JUMPING = 'jumping';
const DIRECTION_LEFT = 'left';
const DIRECTION_RIGHT = 'right';

const FEELING_HAPPY = 'happy';
const FEELING_SAD = 'sad';
const FEELING_DEPRESSED = 'depressed';
const FEELING_HUNGRY = 'hungry';

const ContentReact = () => {
  const gameRef = useRef()
  const charEmotionRef = useRef()
  const charLoveRef = useRef()
  const [file, setFile] = useState(null);
  const [characterProp, setCharacterProp] = useState({
    state: STATE_IDLE,
    direction: DIRECTION_RIGHT,
    feeling: FEELING_SAD,
    emotion: "😶",
    stats: {
      fun: 0,
      hunger: 0,

    }
  });

  const throttleSetCharacterProp = useMemo(
    () => throttle(() => {
      setCharacterProp((states) => {
        return {
          ...states,
          stats: {
            ...states.stats,
            fun: states.stats.fun + 1,
            feeling: (states.stats.fun + 1) > 10 ? FEELING_HAPPY : FEELING_SAD
          }
        }
      })

      return anime({
        targets: charLoveRef.current,
        keyframes: [
          { opacity: 0, duration: 250 },
          { opacity: 1, duration: 500 },
          { opacity: 0, duration: 250 },
        ],
        easing: "linear",
      })

    }, 3000)
    , []);


  const showEmotion = () => {
    // const emotion = emotion_map[characterProp.feeling][Math.floor(Math.random() * emotion_map[characterProp.feeling].length)];
    // setCharacterProp(states => ({
    //   ...states,
    //   emotion,
    // }))
    return anime({
      targets: charEmotionRef.current,
      opacity: 0,
      direction: "alternate",
      easing: "linear",
      loop: true,
      duration: 1000,
      // loopComplete: function (anim) {
      //   // setCharacterProp(states => {
      //   //   const emotion = emotion_map[states.feeling][Math.floor(Math.random() * emotion_map[states.feeling].length)];
      //   //   return {
      //   //     ...states,
      //   //     emotion,
      //   //   }
      //   // })
      // }
      // complete: function (anim) {
      //   console.log('completed')
      //   showEmotion();
      // }
    })
  }



  const emotion_map = {
    [FEELING_HAPPY]: ["☺️", "😍", "🤗", "🤩"],
    [FEELING_SAD]: ["😔", "🥺", "😕"]
  }


  const touchCharacter = (e) => {
    const x = e.clientX;
    const y = e.clientY;
    throttleSetCharacterProp()
  }

  useEffect(() => {
    showEmotion();
    if (!chrome.runtime) {
      console.log('currently not running as chrome extension');
      return;
    }
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        console.log(sender.tab ?
          "from a content script:" + sender.tab.url :
          "from the extension");

        if (request.hasOwnProperty('file')) {
          console.log(request)
          setFile(request.file)
        }
      });
  })

  const animDrop = (callback) => {
    anime({
      targets: gameRef.current,
      bottom: [window.innerHeight, 0],
      easing: 'spring(1, 80, 10, 0)',
      complete: function (anim) {
        if (callback) {
          callback();
        }
      }
    });
  }

  const animIdling = (callback) => {
    setCharacterProp((states) => ({
      ...states,
      state: STATE_IDLE
    }));
    const duration = Math.floor(Math.random() * 1000) + 500;
    setTimeout(() => {
      if (callback) {
        callback();
      }
    }, duration)
  }

  const getSafeMovingProp = (max) => {
    let directionIsSafe = false;
    const el = document.getElementsByClassName('game')[0];
    const elementLeftValue = el.getBoundingClientRect().left;
    const elementWidthValue = el.getBoundingClientRect().width;
    let direction = DIRECTION_RIGHT;
    let runningLength = 0;
    while (!directionIsSafe) {
      runningLength = Math.ceil(Math.random() * (max ? max : window.innerWidth)) * (Math.round(Math.random()) ? 1 : -1)
      if (Math.abs(runningLength) < 100) {
        continue;
      }
      if (runningLength < 0) {
        direction = DIRECTION_LEFT;
      }
      else {
        direction = DIRECTION_RIGHT;
      }
      if (direction === DIRECTION_LEFT) {
        if (elementLeftValue + runningLength >= 0) {
          directionIsSafe = true;
        }
      }

      if (direction === DIRECTION_RIGHT) {
        if ((elementLeftValue + elementWidthValue + runningLength) <= window.innerWidth) {
          directionIsSafe = true;
        }
      }

    }
    return {
      direction,
      runningLength,
    }
  }

  const animJumping = (callback) => {
    const { direction, runningLength } = getSafeMovingProp(100);
    setCharacterProp((states) => ({
      ...states,
      state: STATE_FREEZE,
      direction,
    }));
    anime({
      targets: gameRef.current,
      easing: 'linear',
      // duration: Math.abs(runningLength*5),
      left: {
        value: `+=${runningLength}`,
        duration: Math.abs(runningLength * 10),
        delay: 0,
      },
      bottom: [
        {
          value: '+=100',
          duration: 500,
          delay: 0,
          easing: 'easeOutCubic'
        },
        {
          value: '-=100',
          duration: 500,
          delay: 0,
          easing: 'easeInQuad'
        }
      ],
      changeComplete: function (anim) {
        if (callback) {
          callback();
        }
      }
    });
  }


  const animRunning = (callback) => {
    const { direction, runningLength } = getSafeMovingProp();

    setCharacterProp((states) => ({
      ...states,
      direction,
      state: STATE_RUNNING
    }));
    anime({
      easing: 'linear',
      targets: gameRef.current,
      left: `+=${runningLength}`,
      duration: Math.abs(runningLength * 10),
      changeComplete: function (anim) {
        if (callback) {
          callback();
        }
      }
    });
  }

  const randomBehaviour = () => {
    const states = [STATE_IDLE, STATE_JUMPING, STATE_RUNNING];
    const state = states[Math.floor(Math.random() * states.length)];
    switch (state) {
      case STATE_JUMPING:
        animJumping(() => animIdling(randomBehaviour));
        break;
      case STATE_RUNNING:
        // animJumping(() => animIdling(randomBehaviour));
        animRunning(() => animIdling(randomBehaviour));
        // animJumping(randomBehaviour);
        break;
      default:
        animIdling(randomBehaviour);
        // animJumping(randomBehaviour);
        break;
    }
  }

  const summon = () => {
    setFile({ http_link: 'https://bafybeidhe7yerp2aqwe2hypiim2ksroytwmb2ulvurozpyxtogilwcfgvy.ipfs.dweb.link/a07180503030601.png' })
    setCharacterProp(states => ({ ...states, state: STATE_IDLE }))
    animDrop(randomBehaviour);
  }

  useEffect(() => {
    // anime({
    //   targets: '.react-extension__head',
    //   translateY: 2,
    //   loop: true,
    //   easing: 'easeInOutSine',
    //   direction: 'alternate'
    // });

    // anime({
    //   targets: '.react-extension__left_arm, .react-extension__right_arm',
    //   rotate: '5deg',
    //   loop: true,
    //   easing: 'easeInOutSine',
    //   direction: 'alternate'
    // });
  }, [])
  return (
    <div className={'react-extension'}>
      <div className="menu top-0 right-0">
        <ul>
          <li>
            <button onClick={summon}>Summon first chars</button>
            <div>{characterProp.state}</div>
            <div>
              fun: {characterProp.stats.fun}
            </div>
          </li>
        </ul>
      </div>
      <div className="game" style={{ bottom: 0 }} ref={gameRef}>
        <div style={{ position: 'relative' }}>
          {/* <img src={arm} alt='left_arm' className="react-extension__left_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', left: 0, height: charsProps.armHeight + 'px'}} />
            <img src={arm} alt='right_arm' className="react-extension__right_arm" style={{position: 'absolute', top: (charsProps.headHeight + 10) + 'px', right: 0, height: charsProps.armHeight + 'px', transform: 'scaleX(-1)'}} />
            <img src={body} alt='bo123' className="react-extension__body" style={{position: 'absolute', top: '90px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.bodyHeight + 'px'}}/>
            <img src={head} alt='he123' className="react-extension__head" style={{position: 'absolute', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: charsProps.headHeight + 'px', zIndex:100}} />
            {hat && <div style={{position: 'absolute', top: '-260px', zIndex: 10000, width: '150px', marginLeft: 'auto', marginRight: 'auto', left: 0, right:0, height: '300px '}}><img src={hat} style={{width: '100%', position: 'absolute', 'bottom': 0}} alt='hat' className="react-extension__hat" /></div>} */}
          {file && <div onMouseMove={touchCharacter} className={`char-canvas-large char-canvas-large__${characterProp.state} ${characterProp.direction === DIRECTION_LEFT ? '-scale-x-1' : ''}`} style={
            {
              backgroundImage: `url(${file.http_link})`,
            }
          }></div>}
          <span className="absolute" ref={charEmotionRef} style={{ width: '50px', top: 0, right: '-50px' }}>
            <div className="relative">
              <img src="https://tonywei92.github.io/fresh-data/bubble_text.png" alt="bubble-text" />
              <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-16px' }}>
                <div>{characterProp.emotion}</div>
              </div>
            </div>
          </span>
          <span className="absolute" ref={charLoveRef} style={{ top: 0, left: 0, opacity: 0 }}>❤️</span>
        </div>
      </div>
    </div>
  )
}

const app = document.createElement('div');
document.body.appendChild(app);
ReactDOM.render(<ContentReact />, app);