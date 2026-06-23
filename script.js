const firebaseConfig = {
  apiKey: "AIzaSyAumaUZeeX34c6nMIfgD3Tc9A6lStl0Uq8",
  authDomain: "casamento-enrique-ellen.firebaseapp.com",
  projectId: "casamento-enrique-ellen",
  storageBucket: "casamento-enrique-ellen.firebasestorage.app",
  messagingSenderId: "1082790290477",
  appId: "1:1082790290477:web:90f5f21567b9a231d604a4",
};

let db = null;
let addDoc;
let collection;
let deleteDoc;
let doc;
let onSnapshot;
let runTransaction;
let serverTimestamp;

const firebaseReady = setupFirebase();

async function setupFirebase() {
  try {
    const firebaseApp = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js");
    const firestore = await import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js");
    const app = firebaseApp.initializeApp(firebaseConfig);

    db = firestore.getFirestore(app);
    addDoc = firestore.addDoc;
    collection = firestore.collection;
    deleteDoc = firestore.deleteDoc;
    doc = firestore.doc;
    onSnapshot = firestore.onSnapshot;
    runTransaction = firestore.runTransaction;
    serverTimestamp = firestore.serverTimestamp;
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

const weddingDate = new Date("2026-11-21T19:00:00-03:00");
const countdownFields = {
  days: document.getElementById("days"),
  hours: document.getElementById("hours"),
  minutes: document.getElementById("minutes"),
  seconds: document.getElementById("seconds"),
};

function pad(value) {
  return String(value).padStart(2, "0");
}

function updateCountdown() {
  if (!countdownFields.days || !countdownFields.hours || !countdownFields.minutes || !countdownFields.seconds) {
    return;
  }

  const now = new Date();
  const distance = Math.max(weddingDate.getTime() - now.getTime(), 0);
  const days = Math.floor(distance / (1000 * 60 * 60 * 24));
  const hours = Math.floor((distance / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((distance / (1000 * 60)) % 60);
  const seconds = Math.floor((distance / 1000) % 60);

  countdownFields.days.textContent = String(days).padStart(3, "0");
  countdownFields.hours.textContent = pad(hours);
  countdownFields.minutes.textContent = pad(minutes);
  countdownFields.seconds.textContent = pad(seconds);
}

updateCountdown();
setInterval(updateCountdown, 1000);

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    if (event.target.matches("a")) {
      siteNav.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.16 }
  );

  document.querySelectorAll(".reveal").forEach((element) => revealObserver.observe(element));
} else {
  document.querySelectorAll(".reveal").forEach((element) => element.classList.add("visible"));
}

const rsvpForm = document.getElementById("rsvp-form");
const rsvpStatus = document.getElementById("rsvp-status");
const giftsSection = document.getElementById("presentes");

if (rsvpForm && rsvpStatus) {
  rsvpForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const submitButton = rsvpForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Enviando confirmação...";
    }
    rsvpStatus.textContent = "Enviando sua confirmação...";

    const isFirebaseReady = await firebaseReady;
    if (!isFirebaseReady) {
      rsvpStatus.textContent = "O site abriu, mas o Firebase não carregou. Tente atualizar a página.";
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar confirmação";
      }
      return;
    }

    const formData = Object.fromEntries(new FormData(rsvpForm).entries());
    const rsvp = {
      ...formData,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(db, "rsvps"), rsvp);
      localStorage.setItem("enrique-ellen-rsvp", JSON.stringify({ ...formData, sentAt: new Date().toISOString() }));
      rsvpStatus.textContent = "Presença confirmada com carinho. Agora escolha um presente, se desejar.";
      rsvpForm.reset();
      giftsSection?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
      console.error(error);
      rsvpStatus.textContent = "Não foi possível enviar agora. Verifique as regras do Firebase e tente novamente.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Enviar confirmação";
      }
    }
  });
}

const messageForm = document.getElementById("message-form");
const messageWall = document.getElementById("message-wall");
const messageStatus = document.getElementById("message-status");
let storedMessages = [];

try {
  storedMessages = JSON.parse(localStorage.getItem("enrique-ellen-messages") || "[]");
} catch (error) {
  console.error(error);
  storedMessages = [];
}

function renderMessage(message) {
  if (!messageWall) return;

  const article = document.createElement("article");
  const text = document.createElement("p");
  const author = document.createElement("span");

  text.textContent = message.texto;
  author.textContent = message.autor;
  article.append(text, author);
  messageWall.prepend(article);
}

if (messageForm && messageWall && messageStatus) {
  storedMessages.forEach(renderMessage);

  messageForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const isFirebaseReady = await firebaseReady;
    if (!isFirebaseReady) {
      messageStatus.textContent = "O site abriu, mas o Firebase não carregou. Tente atualizar a página.";
      return;
    }

    const formData = Object.fromEntries(new FormData(messageForm).entries());
    const message = {
      autor: formData.autor.trim(),
      texto: formData.texto.trim(),
      createdAt: serverTimestamp(),
    };

    if (!message.autor || !message.texto) return;

    try {
      await addDoc(collection(db, "messages"), message);
      storedMessages.push({ autor: message.autor, texto: message.texto });
      localStorage.setItem("enrique-ellen-messages", JSON.stringify(storedMessages));
      renderMessage(message);
      messageStatus.textContent = "Mensagem enviada aos noivos.";
      messageForm.reset();
    } catch (error) {
      console.error(error);
      messageStatus.textContent = "Não foi possível enviar a mensagem agora. Tente novamente em instantes.";
    }
  });
}

const giftButtons = document.querySelectorAll(".gift-reserve");
const giftStatus = document.getElementById("gift-status");
const giftReservationForm = document.getElementById("gift-reservation-form");
const selectedGiftName = document.getElementById("selected-gift-name");
const closeGiftPanel = document.getElementById("close-gift-panel");
const pixBox = document.getElementById("pix-box");
const copyPixKey = document.getElementById("copy-pix-key");
const pixKey = document.getElementById("pix-key");
const reservedGifts = {};
let myReservedGifts = {};
let activeGift = "";

try {
  myReservedGifts = JSON.parse(localStorage.getItem("enrique-ellen-my-gifts") || "{}");
} catch (error) {
  console.error(error);
  myReservedGifts = {};
}

if (Array.isArray(myReservedGifts)) {
  myReservedGifts = {};
  saveMyGiftReservations();
}

function giftDocId(giftName) {
  return encodeURIComponent(giftName);
}

function saveMyGiftReservations() {
  localStorage.setItem("enrique-ellen-my-gifts", JSON.stringify(myReservedGifts));
}

function markGiftAvailable(button) {
  const giftItem = button.closest(".gift-item");
  const reservedBy = giftItem?.querySelector(".gift-reserved-by");

  giftItem?.classList.remove("is-reserved");
  if (reservedBy) reservedBy.textContent = "";
  button.disabled = false;
  button.classList.remove("reserved");
  button.textContent = "Reservar presente";
  button.setAttribute("aria-pressed", "false");
}

function markGiftReserved(button, reservation) {
  const giftItem = button.closest(".gift-item");
  const reservedBy = giftItem?.querySelector(".gift-reserved-by");
  const isMine = Boolean(myReservedGifts[reservation.giftName]);

  giftItem?.classList.add("is-reserved");
  if (reservedBy) reservedBy.textContent = `Reservado por ${reservation.name}`;
  button.classList.add("reserved");
  button.disabled = !isMine;
  button.textContent = isMine ? "Cancelar reserva" : "Indisponível";
  button.setAttribute("aria-pressed", String(isMine));
}

function closeReservationPanel() {
  if (!giftReservationForm) return;

  giftReservationForm.hidden = true;
  giftReservationForm.reset();
  if (pixBox) pixBox.hidden = true;
  activeGift = "";
}

function refreshGiftButtons() {
  giftButtons.forEach((button) => {
    const giftName = button.dataset.gift;
    const reservation = reservedGifts[giftName];

    if (reservation) {
      markGiftReserved(button, reservation);
    } else {
      markGiftAvailable(button);
    }
  });
}

if (giftStatus && giftReservationForm && selectedGiftName) {
  firebaseReady.then((isFirebaseReady) => {
    if (!isFirebaseReady) {
      giftStatus.textContent = "O site abriu, mas o Firebase não carregou. As reservas online ficam indisponíveis até atualizar.";
      return;
    }

    onSnapshot(
      collection(db, "giftReservations"),
      (snapshot) => {
        Object.keys(reservedGifts).forEach((giftName) => delete reservedGifts[giftName]);

        snapshot.forEach((document) => {
          const reservation = document.data();
          if (reservation.giftName) {
            reservedGifts[reservation.giftName] = reservation;
          }
        });

        refreshGiftButtons();
      },
      (error) => {
        console.error(error);
        giftStatus.textContent = "Não foi possível carregar as reservas online. Confira as regras do Firebase.";
      }
    );
  });

  giftButtons.forEach((button) => {
    const giftName = button.dataset.gift;
    button.setAttribute("aria-pressed", "false");

    button.addEventListener("click", async () => {
      const isFirebaseReady = await firebaseReady;
      if (!isFirebaseReady) {
        giftStatus.textContent = "O Firebase não carregou. Tente atualizar a página antes de reservar.";
        return;
      }

      if (reservedGifts[giftName]) {
        if (!myReservedGifts[giftName]) return;

        try {
          await deleteDoc(doc(db, "giftReservations", giftDocId(giftName)));
          delete myReservedGifts[giftName];
          saveMyGiftReservations();
          closeReservationPanel();
          giftStatus.textContent = `${giftName} teve a reserva cancelada.`;
        } catch (error) {
          console.error(error);
          giftStatus.textContent = "Não foi possível cancelar a reserva agora. Tente novamente.";
        }

        return;
      }

      activeGift = giftName;
      selectedGiftName.textContent = giftName;
      giftReservationForm.hidden = false;
      giftReservationForm.querySelector("input")?.focus();
      giftStatus.textContent = "";
    });
  });

  giftReservationForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitButton = giftReservationForm.querySelector('button[type="submit"]');

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Confirmando reserva...";
    }

    const isFirebaseReady = await firebaseReady;
    if (!isFirebaseReady) {
      giftStatus.textContent = "O Firebase não carregou. Tente atualizar a página antes de confirmar.";
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar reserva";
      }
      return;
    }

    if (!activeGift) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar reserva";
      }
      return;
    }

    const formData = new FormData(giftReservationForm);
    const reservation = {
      giftName: activeGift,
      name: formData.get("giftGuestName").trim(),
      phone: formData.get("giftGuestPhone").trim(),
      method: formData.get("giftMethod"),
      pixKey: formData.get("giftMethod") === "Pix" ? pixKey?.textContent || "" : "",
      pixHolder: formData.get("giftMethod") === "Pix" ? "Ellen Raquel Kuhnen" : "",
      reservedAt: serverTimestamp(),
    };

    if (!reservation.name || !reservation.phone) {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar reserva";
      }
      return;
    }

    try {
      await runTransaction(db, async (transaction) => {
        const reservationRef = doc(db, "giftReservations", giftDocId(activeGift));
        const reservationSnapshot = await transaction.get(reservationRef);

        if (reservationSnapshot.exists()) {
          throw new Error("gift-already-reserved");
        }

        transaction.set(reservationRef, reservation);
      });

      myReservedGifts[activeGift] = true;
      saveMyGiftReservations();
      giftStatus.textContent =
        reservation.method === "Pix"
          ? `${activeGift} reservado por ${reservation.name}. Chave Pix: ${reservation.pixKey}, titular Ellen Raquel Kuhnen.`
          : `${activeGift} reservado por ${reservation.name}. Entrega em mãos selecionada. Obrigado pelo carinho!`;
      closeReservationPanel();
    } catch (error) {
      console.error(error);
      giftStatus.textContent =
        error.message === "gift-already-reserved"
          ? "Este presente acabou de ser reservado por outra pessoa."
          : "Não foi possível reservar agora. Confira as regras do Firebase e tente novamente.";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = "Confirmar reserva";
      }
    }
  });

  closeGiftPanel?.addEventListener("click", () => {
    closeReservationPanel();
    giftStatus.textContent = "Reserva cancelada antes da confirmação.";
  });

  giftReservationForm.addEventListener("change", (event) => {
    if (event.target.name === "giftMethod" && pixBox) {
      pixBox.hidden = event.target.value !== "Pix";
    }
  });
}

copyPixKey?.addEventListener("click", async () => {
  if (!pixKey || !giftStatus) return;

  try {
    await navigator.clipboard.writeText(pixKey.textContent);
    giftStatus.textContent = "Chave Pix copiada.";
  } catch (error) {
    console.error(error);
    giftStatus.textContent = `Chave Pix: ${pixKey.textContent}`;
  }
});
