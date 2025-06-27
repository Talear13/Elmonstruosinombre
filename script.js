// Grab elements
const homeScreen     = document.getElementById('home-screen');
const terminalScreen = document.getElementById('terminal-screen');
const terminalOutput = document.getElementById('terminal-output');
const logo           = document.getElementById('logo');

const cursorSymbol = '<?>';
const triggerCode  = 'laylalynngardner';

// Firebase DB
const dbRef = firebase.database().ref('chatLogs');

// Riddles & flow
const welcomeMessages = [
  "WELCOME. I WAS EXPECTING YOU.\n>> HAVEN'T A CLUE? \n>> LET'S PLAY A GAME JUST ME AND YOU... \n>> [Y/N]"
];
const riddles = [
  { text: "I BIND PEOPLE TOGETHER WITHOUT A CHAIN,\nI’M FELT BUT NEVER SEEN", answer: "love" },
  { text: "I HAUNT THE SILENCE AFTER WORDS THAT CUT TOO DEEP,\nA WHISPER BORN WHEN PRIDE ADMITS DEFEAT.", answer: "im sorry" },
  { text: "WHEN LIGHT IS GONE AND FEARS BEGIN,\nWHAT MAKES US DREAM AND FIGHT TO WIN?", answer: "hope" },
  { text: "BREAKS AND TRUTH WON’T SPEAK,\nWHO CROWNS THE LOUD AND STARVES THE WEAK?", answer: "unfairness" },
  { text: "WHEN SMILES DIE AND ECHOES STAY,\nWHO PAINTS THE SOUL IN SHADES OF GRAY?\nHINT:) - ANSWERS MAY OR MAY NOT REPEAT.. BUT SOME CAN HAVE EXCEPTIONS.", answer: "sorrow" },
  { text: "WHO CLAPS THE LOUDEST WHEN MASKS ARE WORN,\nBUT WILTS INSIDE, UNLOVED, FORLORN?", answer: ["envy", "sorrow"] }
];

let currentRiddle = 0;
let chatInputActive = false;

// Utilities
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}
function createCursor() {
  removeCursor();
  const c = document.createElement('span');
  c.textContent = cursorSymbol;
  c.classList.add('cursor');
  return c;
}
function removeCursor() {
  const ex = terminalOutput.querySelector('.cursor');
  if (ex) ex.remove();
}
async function typeText(txt, speed = 90) {
  removeCursor();
  for (let ch of txt) {
    terminalOutput.textContent += ch;
    await sleep(speed);
  }
  terminalOutput.appendChild(createCursor());
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}
function clearTerminal() {
  terminalOutput.innerHTML = '';
}

// Terminal start
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
      terminalOutput.textContent += `\n>>${k}\n`;
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
  window.addEventListener('keydown', function t(e) {
    if (chatInputActive) return; // skip if chat mode
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', t);
      removeCursor();
      const norm = ans.replace(/\s+/g, '').toLowerCase();
      if (norm.includes(triggerCode)) {
        activateChat();
        return;
      }
      const expected = riddles[currentRiddle].answer;
      const isCorrect = Array.isArray(expected)
        ? expected.some(a => ans.toLowerCase().includes(a))
        : ans.toLowerCase().includes(expected.toLowerCase());
      if (isCorrect) {
        currentRiddle++;
        if (currentRiddle < riddles.length) askRiddle();
        else typeText('\n>> good job my love, i knew you could do these simple riddles i made for you.');
      } else {
        typeText('\n>> INCORRECT.\n>> ');
        waitAnswer();
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      ans = ans.slice(0, -1);
      terminalOutput.textContent = terminalOutput.textContent.slice(0, -1);
    } else if (e.key.length === 1) {
      ans += e.key;
      terminalOutput.textContent += e.key.toUpperCase();
    }
  });
}
function handleInitialResponse() {
  askRiddle();
}

// ACTIVATE CHAT MODE
async function activateChat() {
  clearTerminal();
  await typeText('ACCESS GRANTED', 50);
  await sleep(2000);
  const dots = ['.','..','...','.','..','...'];
  for (let d of dots) {
    terminalOutput.textContent = 'LOADING CHAT LOGS' + d;
    await sleep(400);
  }
  clearTerminal();
  await typeText(">> Welcome my love, it seems you finally figured out one of the secrets of this forsaken piece of the internet.\n>> Type and press Enter.\n>> ");

  const line = document.createElement('div');
  line.classList.add('chat-line');

  const prompt = document.createElement('span');
  prompt.textContent = '>> ';

  const live = document.createElement('span');
  live.id = 'liveInput';

  const cursor = createCursor();

  line.appendChild(prompt);
  line.appendChild(live);
  line.appendChild(cursor);
  terminalOutput.appendChild(line);

  terminalOutput.scrollTop = terminalOutput.scrollHeight;
  chatInputActive = true;

  let buf = '';

  dbRef.off();
  dbRef.on('child_added', snap => {
    const msgLine = document.createElement('div');
    msgLine.textContent = `>> ${snap.val()}`;
    msgLine.style.marginTop = '10px';
    terminalOutput.insertBefore(msgLine, line);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });

  window.addEventListener('keydown', function inputHandler(e) {
    if (!chatInputActive) return;
    if (e.key === 'Enter') {
      if (buf.trim()) {
        dbRef.push(buf.trim());
      }
      buf = '';
      live.textContent = '';
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      buf = buf.slice(0, -1);
      live.textContent = buf;
    } else if (e.key.length === 1) {
      buf += e.key;
      live.textContent = buf;
    }
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  });
}

// Initialize
logo.addEventListener('click', startTerminal);
