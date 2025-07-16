// === MOBILE-COMPATIBLE SCRIPT ===

const homeScreen     = document.getElementById('home-screen');
const terminalScreen = document.getElementById('terminal-screen');
const terminalOutput = document.getElementById('terminal-output');
const logo           = document.getElementById('logo');
const mobileInput    = document.getElementById('mobile-input');

const cursorSymbol = '<?>';
const triggerCode  = 'ava';

// Firebase DB
const dbRef = firebase.database().ref('chatLogs');

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

async function startTerminal() {
  homeScreen.classList.add('hidden');
  terminalScreen.classList.remove('hidden');
  clearTerminal();
  await typeText(welcomeMessages[0]);
  focusMobileInput();
  waitYesNo(handleInitialResponse);
}

function focusMobileInput() {
  mobileInput.value = '';
  mobileInput.focus();
  mobileInput.setSelectionRange(mobileInput.value.length, mobileInput.value.length);
}

function waitYesNo(cb) {
  mobileInput.oninput = () => {
    const k = mobileInput.value.trim().toUpperCase();
    if (k === 'Y' || k === 'N') {
      mobileInput.value = '';
      removeCursor();
      terminalOutput.textContent += `\n>>${k}\n`;
      if (k === 'Y') cb();
      else typeText('>> GOODBYE.');
    }
  };
}

async function askRiddle() {
  const r = riddles[currentRiddle];
  await typeText(`\n${r.text}\n>> `);
  focusMobileInput();
  waitAnswer();
}

function waitAnswer() {
  mobileInput.value = '';
  focusMobileInput();
  mobileInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      removeCursor();
      const ans = mobileInput.value.trim();
      mobileInput.value = '';
      const norm = ans.replace(/\s+/g, '').toLowerCase();
      if (norm.includes(triggerCode)) {
        activateChat();
        return;
      }
      const expected = riddles[currentRiddle].answer;
      const isCorrect = Array.isArray(expected)
        ? expected.some(a => ans.toLowerCase().includes(a))
        : ans.toLowerCase().includes(expected.toLowerCase());
      terminalOutput.textContent += `\n>>${ans}\n`;
      if (isCorrect) {
        currentRiddle++;
        if (currentRiddle < riddles.length) askRiddle();
        else typeText('\n>> good job my love, i knew you could do these simple riddles i made for you.');
      } else {
        typeText('\n>> INCORRECT.\n>> ');
        waitAnswer();
      }
    }
  };
}

function handleInitialResponse() {
  askRiddle();
}

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

  mobileInput.value = '';
  focusMobileInput();
  mobileInput.oninput = () => {
    buf = mobileInput.value;
    live.textContent = buf;
  };

  mobileInput.onkeydown = (e) => {
    if (e.key === 'Enter') {
      if (buf.trim()) {
        dbRef.push(buf.trim());
      }
      buf = '';
      mobileInput.value = '';
      live.textContent = '';
    }
  };
}

// Init
logo.addEventListener('click', () => {
  focusMobileInput();
  startTerminal();
});
