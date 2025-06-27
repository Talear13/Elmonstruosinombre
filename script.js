// Grab elements
const homeScreen     = document.getElementById('home-screen');
const terminalScreen = document.getElementById('terminal-screen');
const terminalOutput = document.getElementById('terminal-output');
const logo           = document.getElementById('logo');

const cursorSymbol = '<?>';
const triggerCode  = 'laylalynngardner'; // normalized

const welcomeMessages = [
  "WELCOME. I WAS EXPECTING YOU.\n>> HAVEN'T A CLUE? \n>> LET'S PLAY A GAME JUST ME AND YOU... \n>> [Y/N]"
];
const riddles = [
  { text: "I BIND PEOPLE TOGETHER WITHOUT A CHAIN,\nI’M FELT BUT NEVER SEEN", answer: "love" },
  { text: "I HAUNT THE SILENCE AFTER WORDS THAT CUT TOO DEEP,\nA WHISPER BORN WHEN PRIDE ADMITS DEFEAT.", answer: "im sorry" },
  { text: "WHEN LIGHT IS GONE AND FEARS BEGIN,\nWHAT MAKES US DREAM AND FIGHT TO WIN?", answer: "hope" },
  { text: "BREAKS AND TRUTH WON’T SPEAK,\nWHO CROWNS THE LOUD AND STARVES THE WEAK?", answer: "unfairness" },
  { text: "WHEN SMILES DIE AND ECHOES STAY,\nWHO PAINTS THE SOUL IN SHADES OF GRAY?\nHINT:) - ANSWERS MAY OR MAY NOT REPEAT.. BUT SOME CAN HAVE EXCEPTIONS.", answer: "sorrow" },
  { text: "WHO CLAPS THE LOUDEST WHEN MASKS ARE WORN,\nBUT WILTS INSIDE, UNLOVED, FORLORN?", answer: ["envy","sorrow"] }
];

let currentRiddle = 0;
const dbRef = firebase.database().ref('chatLogs');

// Utility
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function removeCursor() {
  const ex = terminalOutput.querySelector('.cursor');
  if (ex) ex.remove();
}
function createCursor(blinking = true) {
  const cursor = document.createElement('span');
  cursor.textContent = cursorSymbol;
  cursor.className = 'cursor';
  if (!blinking) cursor.classList.add('no-blink');
  return cursor;
}
async function typeText(txt, speed = 90) {
  removeCursor();
  for (let ch of txt) {
    terminalOutput.textContent += ch;
    await sleep(speed);
  }
  const cursor = createCursor();
  terminalOutput.appendChild(cursor);
}
function clearTerminal() {
  terminalOutput.innerHTML = '';
}

// Flow
async function startTerminal() {
  homeScreen.classList.add('hidden');
  terminalScreen.classList.remove('hidden');
  clearTerminal();
  await typeText(welcomeMessages[0]);
  waitYesNo(handleInitialResponse);
}

function waitYesNo(cb) {
  window.addEventListener('keydown', function h(e) {
    const k = e.key.toUpperCase();
    if (k === 'Y' || k === 'N') {
      window.removeEventListener('keydown', h);
      removeCursor();
      terminalOutput.innerHTML += `<br>>${k}<br>`;
      if (k === 'Y') cb();
      else typeText('>> GOODBYE.');
    }
  });
}

async function askRiddle() {
  const r = riddles[currentRiddle];
  await typeText(`\n${r.text}\n>> `);
  waitAnswer();
}

function waitAnswer() {
  let ans = '';
  const inputSpan = document.createElement('span');
  const cursor = createCursor();
  terminalOutput.appendChild(inputSpan);
  terminalOutput.appendChild(cursor);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;

  window.addEventListener('keydown', function t(e) {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', t);
      removeCursor();
      const norm = ans.replace(/\s+/g, '').toLowerCase();
      if (norm.includes(triggerCode)) {
        activateChat(); return;
      }
      const exp = riddles[currentRiddle].answer;
      const ok = Array.isArray(exp)
        ? exp.some(a => ans.toLowerCase().includes(a))
        : ans.toLowerCase().includes(exp.toLowerCase());
      if (ok) {
        currentRiddle++;
        if (currentRiddle < riddles.length) askRiddle();
        else typeText('\n>> GOOD JOB. YOU CRACKED THEM ALL.');
      } else {
        terminalOutput.innerHTML += '\n>> INCORRECT.\n>> ';
        waitAnswer();
      }
    }
    else if (e.key === 'Backspace') {
      e.preventDefault();
      ans = ans.slice(0, -1);
      inputSpan.textContent = ans.toUpperCase();
    }
    else if (e.key.length === 1) {
      ans += e.key;
      inputSpan.textContent = ans.toUpperCase();
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });
}

function handleInitialResponse() {
  askRiddle();
}

// — Chat Flow (Fully Live Input Fixed) —
async function activateChat() {
  clearTerminal();
  await typeText('ACCESS GRANTED', 50);
  await sleep(2000);
  const dots = ['.', '..', '...', '.', '..', '...'];
  for (let d of dots) {
    terminalOutput.textContent = 'LOADING CHAT LOGS' + d;
    await sleep(400);
  }
  clearTerminal();
  await typeText(">> Welcome to the chat log.\n>> Type and press Enter.\n>> ", 40);

  // Live input
  const inputDiv = document.createElement('div');
  inputDiv.className = 'chat-line';
  let inputBuffer = '';
  const cursor = createCursor();
  const textSpan = document.createElement('span');
  inputDiv.appendChild(document.createTextNode(">> "));
  inputDiv.appendChild(textSpan);
  inputDiv.appendChild(cursor);
  terminalOutput.appendChild(inputDiv);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;

  dbRef.off();
  dbRef.on('child_added', snap => {
    const msg = document.createElement('div');
    msg.textContent = `>> ${snap.val()}`;
    terminalOutput.insertBefore(msg, inputDiv);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });

  window.addEventListener('keydown', function chatInput(e) {
    if (e.key === 'Enter') {
      if (inputBuffer.trim()) {
        dbRef.push(inputBuffer.trim());
        inputBuffer = '';
        textSpan.textContent = '';
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      inputBuffer = inputBuffer.slice(0, -1);
      textSpan.textContent = inputBuffer;
    } else if (e.key.length === 1) {
      inputBuffer += e.key;
      textSpan.textContent = inputBuffer;
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });
}

// INIT
logo.addEventListener('click', startTerminal);
