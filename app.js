
"use strict";

// 旅みやげMAP Ver.3.0
// 旅行データはこの端末内に保存します。

const STORAGE_KEY = "tabimiyage-map-v3-trips";

function loadTrips() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const data = saved ? JSON.parse(saved) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("旅行データを読み込めません", error);
    return [];
  }
}

let trips = loadTrips();

function saveTrips() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
}

function addTrip(name, date) {
  const tripName = String(name || "").trim();

  if (!tripName) {
    alert("旅行名を入力してください。");
    return false;
  }

  const trip = {
    id: crypto.randomUUID(),
    name: tripName,
    date: date || "",
    createdAt: new Date().toISOString()
  };

  trips.push(trip);
  saveTrips();
  renderTrips();
  return true;
}

function deleteTrip(id) {
  const trip = trips.find(item => item.id === id);
  if (!trip) return;

  if (!confirm(`「${trip.name}」を削除しますか？`)) {
    return;
  }

  trips = trips.filter(item => item.id !== id);
  saveTrips();
  renderTrips();
}

function renderTrips() {
  const list = document.getElementById("tripList");
  if (!list) return;

  list.replaceChildren();

  if (trips.length === 0) {
    const message = document.createElement("p");
    message.textContent = "旅行はまだ登録されていません。";
    list.appendChild(message);
    return;
  }

  trips.forEach(trip => {
    const card = document.createElement("div");
    card.className = "trip-card";

    const title = document.createElement("strong");
    title.textContent = trip.name;

    const date = document.createElement("p");
    date.textContent = trip.date || "日付未設定";

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "削除";
    button.addEventListener("click", () => deleteTrip(trip.id));

    card.append(title, date, button);
    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("tripForm");
  if (!form) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("tripName").value;
    const date = document.getElementById("tripDate").value;

    if (addTrip(name, date)) {
      form.reset();
    }
  });

  renderTrips();
});
