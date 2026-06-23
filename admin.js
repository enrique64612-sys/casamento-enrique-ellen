const firebaseConfig = {
  apiKey: "AIzaSyAumaUZeeX34c6nMIfgD3Tc9A6lStl0Uq8",
  authDomain: "casamento-enrique-ellen.firebaseapp.com",
  projectId: "casamento-enrique-ellen",
  storageBucket: "casamento-enrique-ellen.firebasestorage.app",
  messagingSenderId: "1082790290477",
  appId: "1:1082790290477:web:90f5f21567b9a231d604a4",
};

const ADMIN_PASSWORD = "21112026";

const login = document.getElementById("admin-login");
const dashboard = document.getElementById("admin-dashboard");
const loginForm = document.getElementById("admin-login-form");
const loginStatus = document.getElementById("admin-login-status");
const giftCount = document.getElementById("gift-count");
const rsvpCount = document.getElementById("rsvp-count");
const messageCount = document.getElementById("message-count");
const giftList = document.getElementById("admin-gifts");
const rsvpList = document.getElementById("admin-rsvps");
const messageList = document.getElementById("admin-messages");

let db = null;
let collection = null;
let onSnapshot = null;
let listenersStarted = false;

const firebaseReady = setupFirebase();

async function setupFirebase() {
  try {
    const firebaseApp = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firestore = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const app = firebaseApp.initializeApp(firebaseConfig);

    db = firestore.getFirestore(app);
    collection = firestore.collection;
    onSnapshot = firestore.onSnapshot;
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

function formatDate(value) {
  if (!value?.toDate) return "Data não registrada";
  return value.toDate().toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function showPanelError(message) {
  clearList(giftList, message);
  clearList(rsvpList, message);
  clearList(messageList, message);
}

function clearList(list, emptyText) {
  list.innerHTML = "";
  const empty = document.createElement("p");
  empty.className = "empty-state";
  empty.textContent = emptyText;
  list.append(empty);
}

function renderAdminCard(list, rows) {
  const card = document.createElement("article");
  card.className = "admin-card";

  rows.forEach(([label, value]) => {
    const row = document.createElement("p");
    const strong = document.createElement("strong");
    const span = document.createElement("span");

    strong.textContent = label;
    span.textContent = value || "-";
    row.append(strong, span);
    card.append(row);
  });

  list.append(card);
}

async function showDashboard() {
  login.hidden = true;
  dashboard.hidden = false;
  sessionStorage.setItem("enrique-ellen-admin", "ok");

  const isFirebaseReady = await firebaseReady;
  if (!isFirebaseReady) {
    showPanelError("O Firebase não carregou. Confira sua internet e atualize a página.");
    return;
  }

  startListeners();
}

function startListeners() {
  if (listenersStarted) return;
  listenersStarted = true;

  onSnapshot(
    collection(db, "giftReservations"),
    (snapshot) => {
      giftList.innerHTML = "";
      giftCount.textContent = String(snapshot.size);

      if (snapshot.empty) {
        clearList(giftList, "Nenhum presente reservado ainda.");
        return;
      }

      snapshot.forEach((document) => {
        const gift = document.data();
        renderAdminCard(giftList, [
          ["Presente", gift.giftName],
          ["Reservado por", gift.name],
          ["Telefone", gift.phone],
          ["Forma de presente", gift.method],
          ["Chave Pix", gift.pixKey],
          ["Titular Pix", gift.pixHolder],
          ["Data", formatDate(gift.reservedAt)],
        ]);
      });
    },
    (error) => {
      console.error(error);
      clearList(giftList, "Não foi possível carregar os presentes. Confira as regras do Firestore.");
    }
  );

  onSnapshot(
    collection(db, "rsvps"),
    (snapshot) => {
      rsvpList.innerHTML = "";
      rsvpCount.textContent = String(snapshot.size);

      if (snapshot.empty) {
        clearList(rsvpList, "Nenhuma presença confirmada ainda.");
        return;
      }

      snapshot.forEach((document) => {
        const rsvp = document.data();
        renderAdminCard(rsvpList, [
          ["Nome", rsvp.nome],
          ["Telefone", rsvp.telefone],
          ["Adultos", rsvp.adultos || rsvp.acompanhantes],
          ["Crianças", rsvp.criancas],
          ["Restrições", rsvp.restricoes],
          ["Mensagem", rsvp.mensagem],
          ["Data", formatDate(rsvp.createdAt)],
        ]);
      });
    },
    (error) => {
      console.error(error);
      clearList(rsvpList, "Não foi possível carregar as confirmações. Confira as regras do Firestore.");
    }
  );

  onSnapshot(
    collection(db, "messages"),
    (snapshot) => {
      messageList.innerHTML = "";
      messageCount.textContent = String(snapshot.size);

      if (snapshot.empty) {
        clearList(messageList, "Nenhuma mensagem enviada ainda.");
        return;
      }

      snapshot.forEach((document) => {
        const message = document.data();
        renderAdminCard(messageList, [
          ["Nome", message.autor],
          ["Mensagem", message.texto],
          ["Data", formatDate(message.createdAt)],
        ]);
      });
    },
    (error) => {
      console.error(error);
      clearList(messageList, "Não foi possível carregar as mensagens. Confira as regras do Firestore.");
    }
  );
}

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = new FormData(loginForm).get("password");

  if (password === ADMIN_PASSWORD) {
    showDashboard();
    return;
  }

  loginStatus.textContent = "Senha incorreta.";
});

if (sessionStorage.getItem("enrique-ellen-admin") === "ok") {
  showDashboard();
}
