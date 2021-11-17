/* src/content.js */
/*global chrome*/
import React, { useEffect, useMemo, useRef } from 'react';
import useState from 'react-usestateref';
import Axios from 'axios';
import { throttle } from 'lodash';
import ReactDOM from 'react-dom';
import { motion, useAnimation } from "framer-motion"
import './index.css';
import "./content.css";
import './Animation.scss';
import messageConstants from './constants/message_types';

const STATE_IDLE = 'idle';
const STATE_FREEZE = 'freeze';
const STATE_RUNNING = 'running';
const STATE_JUMPING = 'jumping';
const STATE_DESCTRUCTING = 'destructing';
const DIRECTION_LEFT = 'left';
const DIRECTION_RIGHT = 'right';

const FEELING_HAPPY = 'happy';
const FEELING_SAD = 'sad';
const FEELING_DEPRESSED = 'depressed';
const FEELING_HUNGRY = 'hungry';

const sendMessage = (payload) => {
  if (!chrome.runtime) {
    console.log('currently not running as chrome extension');
    return;
  }

  chrome.runtime.sendMessage(payload, function (response) {
    console.log(response);
  });
}

const MAX_ELEMENT_SEARCH_DEPTH = 10;
const MIN_ELEMENT_SEARCH_DEPTH = 5;
let elements = [];
for(let i = MAX_ELEMENT_SEARCH_DEPTH; i >= MIN_ELEMENT_SEARCH_DEPTH; i-- ){
  const elementsTest = document.querySelectorAll(`body ${"> * ".repeat(i) }`);
  if(elementsTest.length > 0){
    elements = elementsTest;
    break;
  }
}
console.log('elements', elements);

const ContentReact = () => {
  const [file, setFile] = useState(null);
  const characterElementRef = useRef();
  const carrotElementRef = useRef();
  const charControls = useAnimation()
  const carrotControl = useAnimation()
  const charLoveControls = useAnimation()
  const charEmotionControls = useAnimation()
  const [address, setAddress, addressRef] = useState(null)
  const [destroyedElements, setDestroyedElements] = useState([]);
  const stealContainer = useRef();

  const [characterProp, setCharacterProp, setCharacterPropRef] = useState({
    state: STATE_IDLE,
    dragging: false,
    direction: DIRECTION_RIGHT,
    feeling: FEELING_SAD,
    emotion: "😶",
    message: "",
    stats: {
      happy: 0,
      health: 0,
      hunger: 0,
    }
  });
  
  const destructive = async (callback) => {
    console.log('destructive')
    setCharacterProp((states) => ({
      ...states,
      state: STATE_RUNNING,
      direction: DIRECTION_RIGHT,
      message: "I'm stealing!"
    }));
    if(elements.length > 0){
      let el;
      let elIndex;
      do{
        elIndex = Math.floor(Math.random() * elements.length);
        el = elements[elIndex];
      }
      while(destroyedElements.indexOf(elIndex) > 0);
      console.log('element',elIndex, el)
      setDestroyedElements([...destroyedElements, elIndex])
      console.log('stealContainer', stealContainer.current, el)
      stealContainer.current.appendChild(el);
      await charControls.start(() => {
        return {
          x: -100,
          transition: {
            duration: 4,
          }
        }
      })
      el.remove();
      await charControls.start(() => {
        return {
          x: 0,
        }
      })
    }
    if (callback && !setCharacterPropRef.current.dragging) {
      callback();
    }
  }

  const giveCarrot = async () => {
    throttleSetCharacterProp('EAT', async function(){
        await carrotControl.start((custom, current) => {
          return {
            ...current,
            y: window.innerHeight - carrotElementRef.current.getBoundingClientRect().height,
            opacity: 1,
            transition: {
              ease: "linear",
              duration: 1,
            }
          }
        })
        await carrotControl.start((custom, current) => {
          return {
            ...current,
            y: -1000,
            x: (window.innerWidth / 2) - (carrotElementRef.current.getBoundingClientRect().width / 2),
            opacity: 0,
            transition: {
              y: {
                delay: 1,
                ease: "linear",
                duration:0.0001,
              },
              opacity: {
                delay: 1,
                duration: 0.6,
              }
            }
          }
        })
        setCharacterProp((characterProp) => ({
          ...characterProp,
          message: "🏥+5 🥕+10",
      }))
       
    })
    
  }

  const setNumberBoundary = (value, max = 100, min = 0) => {
    if (value > max) {
      value = max;
    }
    if (value < 0) {
      value = 0;
    }
    return value;
  }

  const throttleSetCharacterProp = useMemo(
    () => throttle(async(activity, callback) => {
        setCharacterProp((states) => {
          let happy = states.stats.happy;
          let hunger = states.stats.hunger;          
          let health = states.stats.health;          

          if(activity === 'PLAY'){
            happy = setNumberBoundary(states.stats.happy + 1)
            hunger = setNumberBoundary(states.stats.hunger - 2)
          }
          if(activity === 'EAT'){
            hunger = setNumberBoundary(states.stats.hunger + 5)
            health = setNumberBoundary(states.stats.hunger + 10)
          }
          
          const characterProp = {
            ...states,
            feeling: (states.stats.happy + 1) > 50 && (states.stats.hunger + 1) > 50 ? FEELING_HAPPY : FEELING_SAD,
            stats: {
              ...states.stats,
              happy,
              hunger,
              health,
            }
          }
          sendMessage({ type: messageConstants.STATS, stats: characterProp.stats })
          console.log('send to queue', {
            recipient: addressRef.current,
            activity,
          })
          Axios.post('https://onflow-queue.herokuapp.com', {
            recipient: addressRef.current,
            activity,
          })
          return characterProp;
        })

        await charLoveControls.start((custom, current) => {
          return {
            ...current,
            opacity: 1,
            transition: { ease: "linear" },
          }
        })

        await charLoveControls.start((custom, current) => {
          return {
            ...current,
            opacity: 0,
            transition: { ease: "linear" },
          }
        })
        await callback();
    }, 3000)
    , []);

  const handleCharacterDragStart = (event, info) => {
    charControls.stop()
    setCharacterProp((characterProp) => ({
      ...setCharacterPropRef.current,
      state: STATE_FREEZE,
      dragging: true
    }))
  }

  const handleCharacterDragEnd = async (event, info) => {
    setCharacterProp((characterProp) => ({
      ...setCharacterPropRef.current,
      dragging: false
    }))
    await charControls.start((custom, current) => {
      return {
        ...current,
        y: window.innerHeight - characterElementRef.current.getBoundingClientRect().height,
        transition: {
          type: "spring",
          stiffness: 100
        },
      }
    })
    randomBehaviour();
  }

  const showEmotion = async () => {
    let showMessage = false;
    if(setCharacterPropRef.current.message){
      showMessage = true;
    }
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
    
    console.log('showMessage', showMessage)
    if(showMessage){
      showMessage = false;
      console.log("SET MESSAGE EMPTY")
      setCharacterProp((characterProp) => ({
        ...setCharacterPropRef.current,
        message: ''
      }))
    }
    else{
      setCharacterProp(states => {
        const emotion = emotion_map[states.feeling][Math.floor(Math.random() * emotion_map[states.feeling].length)];
        return {
          ...states,
          emotion,
        }
      })
    }
    
    showEmotion();
    
  }



  const emotion_map = {
    [FEELING_HAPPY]: ["😍", "🤗", "🤩"],
    [FEELING_SAD]: ["😔", "🥺", "😕"]
  }


  const touchCharacter = (e) => {
    throttleSetCharacterProp('PLAY', async () => {
        setCharacterProp((characterProp) => ({
          ...characterProp,
          message: "😄+1 🥕-2",
      }))
    })
  }

  useEffect(() => {
    sendMessage({ type: messageConstants.REQUEST_STATS })
    carrotControl.start(() => {
      return {
        y: -100,
        x: (window.innerWidth / 2) - (carrotElementRef.current.getBoundingClientRect().width / 2),
      }
    })
    charControls.start((custom, current) => {
      return {
        ...current,
        x: -1000,
      }
    })
    showEmotion();
    if (!chrome.runtime) {
      setFile("https://bafybeiejyfiydin4nz74rtsr5cmakvfbpz4oots2wihjouxsesjnojkiqq.ipfs.dweb.link/a000f0703000000.png")
      summon();
      console.log('currently not running as chrome extension');
      return;
    }
    chrome.runtime.onMessage.addListener(
      function (request, sender, sendResponse) {
        console.log('request', request)
        console.log(sender.tab ?
          "from a content script:" + sender.tab.url :
          "from the extension");

        if (request.hasOwnProperty('type')) {
          // if (request.type === messageConstants.CHARACTER) {
          //   charControls.stop();
          //   setFile(request.character)
          //   summon();
          // }
          if (request.type === messageConstants.ADDRESS) {
            console.log('received address from background', request.address)
            setAddress(request.address);
          }
          if (request.type === messageConstants.STATS) {
            console.log('get stats message', request, request.type === messageConstants.STATS)
            setCharacterProp({
              ...setCharacterPropRef.current,
              stats: {
                ...setCharacterPropRef.current.stats,
                ...request.stats,
              }
            })

            setFile(request.stats.httpPetLink)
          }

          if (request.type === messageConstants.GIVE_CARROT) {
            giveCarrot();
          }
        }
      });
  }, [])

  const animDrop = async (callback) => {
    await charControls.start((custom, current) => ({
      ...current,
      y: -100,
      x: (window.innerWidth / 2) - (carrotElementRef.current.getBoundingClientRect().width / 2),
      transition: {
        duration:0.0001,
      }
    }))
    await charControls.start((custom, current) => ({
      ...current,
      y: window.innerHeight - characterElementRef.current.getBoundingClientRect().height,
      transition: {
        duration: 1,
      }
    }))

    await charControls.start((custom, current) => {
      return {
        ...current,
        y: window.innerHeight - characterElementRef.current.getBoundingClientRect().height,
        transition: {
          type: "spring",
          stiffness: 100
        },
      }
    })
    if (callback && !setCharacterPropRef.current.dragging) {
      callback();
    }
  }

  const animIdling = (callback) => {
    console.log('idling')
    setCharacterProp((states) => ({
      ...states,
      state: STATE_IDLE
    }));
    const duration = Math.floor(Math.random() * 1000) + 500;
    setTimeout(() => {
      console.log('setCharacterPropRef.current.dragging', setCharacterPropRef.current.dragging)
      if (callback && !setCharacterPropRef.current.dragging) {
        callback();
      }
    }, duration)
  }

  const getSafeMovingProp = (max, elementLeftValue) => {
    let directionIsSafe = false;
    const el = document.getElementsByClassName('game')[0];
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
    console.log('jumping')

    // charControls.start((custom, current) => {
    //   console.log("current run jump", current, runningLength)
    //   return {
    //     ...current,
    //     left: current.left + runningLength,
    //     transition: {
    //       duration: Math.abs(runningLength / 100),
    //       ease: 'linear',
    //       left: { type: "spring", stiffness: 100, delay:1, duration: 2, },
    //     },
    //   }
    // })

    await charControls.start((custom, current) => {
      const { direction, runningLength } = getSafeMovingProp(100, current.x);
      setCharacterProp((states) => ({
        ...states,
        state: STATE_FREEZE,
        direction,
      }));
      const frames = []

      frames.push(window.innerHeight - characterElementRef.current.getBoundingClientRect().height)
      frames.push(frames[frames.length - 1] - 100)
      frames.push(frames[frames.length - 1] + 100)
      return {
        ...current,
        x: current.x + runningLength,
        y: frames,
        transition: {
          easing: 'easeOutQuart',
          duration: Math.abs(runningLength / 100),
          // ease: 'easeOutCubic',
          y: {
            // times: [0, 0.25, 0.5, 1 ],
            easing: 'easeOutQuart',
          },
          x: { easing: "easeInQuad", duration: 0.8, },
        },
      }
    })

    // await charControls.start((custom, current) => {
    //   return {
    //     ...current,
    //     bottom: current.bottom - 100,
    //     transition: {
    //       easing: 'easeInQuad'
    //     }
    //   }
    // })
    if (callback && !setCharacterPropRef.current.dragging) {
      callback();
    }
  }


  const animRunning = async (callback) => {
    console.log('running')
    await charControls.start((custom, current) => {
      const { direction, runningLength } = getSafeMovingProp(100, current.x);

      setCharacterProp((states) => ({
        ...states,
        direction,
        state: STATE_RUNNING
      }));
      console.log("current", current)
      return {
        ...current,
        x: current.x + runningLength,
        transition: {
          duration: Math.abs(runningLength / 100),
          ease: 'linear'
        }
      }
    })
    console.log('running setCharacterPropRef.current.dragging', setCharacterPropRef.current.dragging)
    if (callback && !setCharacterPropRef.current.dragging) {
      callback();
    }
  }

  const randomBehaviour = () => {
    const states = [STATE_IDLE, STATE_JUMPING, STATE_RUNNING, STATE_RUNNING, STATE_RUNNING];
    console.log('characterProp.stats.happy',setCharacterPropRef.current.stats.happy,setCharacterPropRef.current.stats.happy < 50, )
    console.log('happiness', setCharacterPropRef.current.stats.happy, setCharacterPropRef.current.stats.hunger)
    if(setCharacterPropRef.current.stats.happy < 50 || setCharacterPropRef.current.stats.hunger < 50){
      states.push(STATE_DESCTRUCTING, STATE_DESCTRUCTING, STATE_DESCTRUCTING, STATE_DESCTRUCTING)
    }
    const state = states[Math.floor(Math.random() * (states.length-1))];
    switch (state) {
      case STATE_JUMPING:
        animJumping(() => animIdling(randomBehaviour));
        break;
      case STATE_RUNNING:
        // animJumping(() => animIdling(randomBehaviour));
        animRunning(() => animIdling(randomBehaviour));
        // animJumping(randomBehaviour);
        break;
      case STATE_DESCTRUCTING:
        destructive(() => animIdling(randomBehaviour))
        break;
      default:
        animIdling(() => randomBehaviour());
        // animJumping(randomBehaviour);
        break;
    }
  }

  const summon = () => {
    setCharacterProp(states => ({ ...states, state: STATE_IDLE }))
    animDrop(randomBehaviour);
  }

  useEffect(() => {
    if(file && address){
      summon();
    }
  }, [file, address])

  return (
    <div className={'react-extension'} style={{zIndex: 9999999999}}>
      <div className="menu top-0 right-0 text-sm transition-all hidden">
        <button onClick={destructive} className="rounded px-3 py-2 bg-blue-200 border border-blue-400">Destruct</button>
        <button onClick={summon} className="rounded px-3 py-2 bg-blue-200 border border-blue-400">Summon char</button>
        <button onClick={giveCarrot} className="rounded px-3 py-2 bg-blue-200 border border-blue-400">Give carrot</button>
        <div className="flex items-center mb-2">
          <div className="w-20">anim state</div> {characterProp.state}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">feeling</div> {characterProp.feeling}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">happy</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{ width: characterProp.stats.happy + "%" }}></div></div>&nbsp;{characterProp.stats.happy + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">hunger</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{ width: characterProp.stats.hunger + "%" }}></div></div>&nbsp;{characterProp.stats.hunger + "%"}
        </div>
        <div className="flex items-center mb-2">
          <div className="w-20">health</div>&nbsp;<div className="w-64 h-4 bg-green-50 rounded"><div className="bg-green-500 h-full" style={{ width: characterProp.stats.health + "%" }}></div></div>&nbsp;{characterProp.stats.health + "%"}
        </div>
      </div>
      <motion.div animate={carrotControl} style={{ position: 'absolute' }}><img style={{ width: "70px" }} ref={carrotElementRef} src="https://tonywei92.github.io/fresh-data/carrot.png" alt="carrot" /></motion.div>
      <motion.div drag onDragStart={handleCharacterDragStart} onDragEnd={handleCharacterDragEnd} className="game" animate={charControls}>
        <div style={{ position: 'relative' }} ref={characterElementRef}>
          {file && <div onMouseMove={touchCharacter} className={`char-canvas-large char-canvas-large__${characterProp.state} ${characterProp.direction === DIRECTION_LEFT ? '-scale-x-1' : ''}`} style={
            {
              backgroundImage: `url(${file})`,
            }
          }></div>}
          <motion.span className="absolute" animate={charEmotionControls} style={{ width: '80px', top: "-28px", right: '-50px' }}>
            <div className="relative">
              <img src="https://tonywei92.github.io/fresh-data/bubble_text.png" alt="bubble-text" />
              <div className="absolute flex items-center justify-center w-full h-full" style={{ top: '-16px' }}>
                <div className="leading-snug flex justify-center items-center text-center">{setCharacterPropRef.current.message ? <span className="text-xs">{setCharacterPropRef.current.message}</span>: setCharacterPropRef.current.emotion }</div>
              </div>
            </div>
          </motion.span>
          <motion.span className="absolute" animate={charLoveControls} style={{ top: 0, left: 0, opacity: 0 }}>❤️</motion.span>
        </div>
        <div ref={stealContainer} className="fixed bottom-10 left-16">
        </div>
      </motion.div>
    </div>
  )
}

const app = document.createElement('div');
document.body.appendChild(app);
ReactDOM.render(<ContentReact />, app);