
// === TERMINAL INTERFACE CORE ===
const terminal = document.getElementById("terminal");
const output = document.getElementById("output");

const cursorSymbol = "<?>";
const CREATOR_ID = "creator_secret_key"; // Replace with secure token or use auth later

let isCreator = false;
let active = true;
let chatRef;

// === Firebase Setup ===
const db = firebase.database();
const chatLogsRef = db.ref("chatLogs");
const presenceRef = db.ref("presence");

// === UTILS ===
function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function clearOutput() {
  output.innerHTML = "";
}

function appendLine(text, isCursor = false) {
  const div = document.createElement("div");
  div.textContent = text;
  if (isCursor) div.classList.add("cursor");
  output.appendChild(div);
  output.scrollTop = output.scrollHeight;
}

function createCursor() {
  const cursor = document.createElement("span");
  cursor.textContent = cursorSymbol;
  cursor.classList.add("cursor");
  return cursor;
}

function notifyCreator() {
  if (isCreator) return;
  presenceRef.push({ timestamp: Date.now() });
}

function showPopup(text) {
  const popup = document.createElement("div");
  popup.textContent = text;
  popup.style.position = "fixed";
  popup.style.top = "10px";
  popup.style.left = "10px";
  popup.style.background = "#111";
  popup.style.color = "#0f0";
  popup.style.padding = "5px 10px";
  popup.style.fontFamily = "monospace";
  popup.style.border = "1px solid #0f0";
  popup.style.zIndex = 999;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 4000);
}

function listenForNewUsers() {
  presenceRef.on("child_added", snap => {
    showPopup(">> NEW USER ENTERED");
  });
}

function listenForChat() {
  chatRef = chatLogsRef;
  chatRef.on("child_added", snap => {
    if (!active) return;
    appendLine(">> " + snap.val());
  });
}

function sendMessage(msg) {
  chatRef.push(msg);
}

function deleteAllMessages() {
  chatRef.remove();
  clearOutput();
  appendLine("<?>");
}

// === MAIN START ===
async function initTerminal() {
  notifyCreator();
  appendLine(">> CONNECTION ESTABLISHED");
  await sleep(800);
  appendLine(">> CHAT MODE ENABLED");
  await sleep(500);
  output.appendChild(createCursor());
  listenForChat();

  let input = "";

  window.addEventListener("keydown", e => {
    if (!active) return;

    const cursor = document.querySelector(".cursor");
    if (cursor) cursor.remove();

    if (e.key === "Enter") {
      if (input.trim()) {
        if (input === "/clear" && isCreator) {
          deleteAllMessages();
        } else if (input === "/shutdown" && isCreator) {
          active = false;
          deleteAllMessages();
          document.body.style.background = "black";
          clearOutput();
          appendLine("<?>");
          return;
        } else {
          sendMessage(input);
        }
      }
      input = "";
    } else if (e.key === "Backspace") {
      e.preventDefault();
      input = input.slice(0, -1);
    } else if (e.key.length === 1) {
      input += e.key;
    }

    appendLine(">> " + input);
    output.appendChild(createCursor());
  });
}

// === Detect Creator Mode ===
window.addEventListener("load", () => {
  const url = new URL(window.location.href);
  if (url.searchParams.get("key") === CREATOR_ID) {
    isCreator = true;
    listenForNewUsers();
    showPopup(">> CREATOR MODE ENABLED");
  }
  initTerminal();
});
