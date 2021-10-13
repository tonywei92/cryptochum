/* src/content.js */
/*global chrome*/
import React, { useEffect, useState, useMemo } from 'react';
import { throttle } from 'lodash';
import ReactDOM from 'react-dom';
import { motion, useAnimation } from "framer-motion"
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
  const [file, setFile] = useState(null);

  const charControls = useAnimation()
  const charLoveControls = useAnimation()
  const charEmotionControls = useAnimation()

  const [characterProp, setCharacterProp] = useState({
    state: STATE_IDLE,
    direction: DIRECTION_RIGHT,
    feeling: FEELING_SAD,
    emotion: "😶",
    stats: {
      fun: 0,
      health: 0,
      hunger: 0,
      cleanliness: 0,
      bladder: 0,
    }
  });

  const throttleSetCharacterProp = useMemo(
    () => throttle(async () => {
      setCharacterProp((states) => {
        console.log(states.stats.fun, (states.stats.fun + 1) > 3 ? FEELING_HAPPY : FEELING_SAD)
        return {
          ...states,
          feeling: (states.stats.fun + 1) > 3 ? FEELING_HAPPY : FEELING_SAD,
          stats: {
            ...states.stats,
            fun: states.stats.fun + 1,
          }
        }
      })

      await charLoveControls.start((custom, current) => {
        return {
          ...current,
          opacity: 1,
          transition: { ease: "linear" },
        }
      })

      return await charLoveControls.start((custom, current) => {
        return {
          ...current,
          opacity: 0,
          transition: { ease: "linear" },
        }
      })

    }, 3000)
    , []);


  const showEmotion = async () => {
    console.log('step', 1)
    await charEmotionControls.start((custom, current) => {
      return {
        ...current,
        opacity: 1,
        transition: {
          ease: "linear",
          duration: 0.01,
        }
      }
    })
    console.log('step', 2)
    await charEmotionControls.start((custom, current) => {
      return {
        ...current,
        opacity: 0,
        transition: {
          delay: 1,
          ease: "linear",
          duration: 0.01,
        }
      }
    })
    console.log('step', 3)

    await charEmotionControls.start((custom, current) => {
      return {
        ...current,
        opacity: 1,
        transition: {
          delay: 5,
          ease: "linear",
          duration: 0.01,
        }
      }
    })
    setCharacterProp(states => {
      const emotion = emotion_map[states.feeling][Math.floor(Math.random() * emotion_map[states.feeling].length)];
      return {
        ...states,
        emotion,
      }
    })
    showEmotion();
  }



  const emotion_map = {
    [FEELING_HAPPY]: ["😍", "🤗", "🤩"],
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
  }, [])

  const animDrop = async (callback) => {
    await charControls.start((custom, current) => ({
      ...current,
      left: 0,
      bottom: window.innerHeight,
    }))

    await charControls.start((custom, current) => {
      return {
        ...current,
        bottom: 0,
        transition: {
          type: "spring",
          stiffness: 100
        },
      }
    })
    if (callback) {
      callback();
    }
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

  const animJumping = async (callback) => {
    const { direction, runningLength } = getSafeMovingProp(100);
    setCharacterProp((states) => ({
      ...states,
      state: STATE_FREEZE,
      direction,
    }));


    charControls.start((custom, current) => {
      console.log("current", current)
      return {
        ...current,
        left: current.left + runningLength,
        transition: {
          duration: Math.abs(runningLength / 100),
          ease: 'linear'
        }
      }
    })

    await charControls.start((custom, current) => {
      return {
        ...current,
        bottom: current.bottom + 100,
        transition: {
          easing: 'easeOutCubic'
        }
      }
    })

    await charControls.start((custom, current) => {
      return {
        ...current,
        bottom: current.bottom - 100,
        transition: {
          easing: 'easeInQuad'
        }
      }
    })

    if (callback) {
      callback();
    }
  }


  const animRunning = async (callback) => {
    const { direction, runningLength } = getSafeMovingProp();

    setCharacterProp((states) => ({
      ...states,
      direction,
      state: STATE_RUNNING
    }));

    await charControls.start((custom, current) => {
      console.log("current", current)
      return {
        ...current,
        left: current.left + runningLength,
        transition: {
          duration: Math.abs(runningLength / 100),
          ease: 'linear'
        }
      }
    })
    if (callback) {
      callback();
    }
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

  return (
    <div className={'react-extension'}>
      <div className="menu top-0 right-0 text-sm transition-all">
        <button onClick={summon} className="rounded px-3 py-2 bg-blue-200 border border-blue-400">Summon char</button>
        <div className="flex items-center mb-2">
          <div className="w-20">anim state</div> {characterProp.state}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">feeling</div> {characterProp.feeling}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">fun</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{width:characterProp.stats.fun + "%"}}></div></div>&nbsp;{characterProp.stats.fun + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">hunger</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{width:characterProp.stats.hunger + "%"}}></div></div>&nbsp;{characterProp.stats.hunger + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">health</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{width:characterProp.stats.health + "%"}}></div></div>&nbsp;{characterProp.stats.health + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">cleanliness</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{width:characterProp.stats.cleanliness + "%"}}></div></div>&nbsp;{characterProp.stats.cleanliness + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">bladder</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{width:characterProp.stats.bladder + "%"}}></div></div>&nbsp;{characterProp.stats.bladder + "%"}
        </div>
      </div>
      <motion.div className="game" animate={charControls} style={{ left: "-300px", bottom: (window.innerHeight + 300) + "px" }}>
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
          <motion.span className="absolute" animate={charEmotionControls} style={{ width: '50px', top: 0, right: '-50px' }}>
            <div className="relative">
              <img src="https://tonywei92.github.io/fresh-data/bubble_text.png" alt="bubble-text" />
              <div className="absolute inset-0 flex items-center justify-center" style={{ top: '-16px' }}>
                <div>{characterProp.emotion}</div>
              </div>
            </div>
          </motion.span>
          <motion.span className="absolute" animate={charLoveControls} style={{ top: 0, left: 0, opacity: 0 }}>❤️</motion.span>
        </div>
      </motion.div>
    </div>
  )
}

const app = document.createElement('div');
document.body.appendChild(app);
ReactDOM.render(<ContentReact />, app);