
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



// ===== Ver.3.0 商品管理機能 =====

const PRODUCT_KEY = "tabimiyage-map-v3-products";

function loadProducts() {
  try {
    const saved = localStorage.getItem(PRODUCT_KEY);
    const data = saved ? JSON.parse(saved) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("商品データを読み込めません", error);
    return [];
  }
}

let products = loadProducts();

function saveProducts() {
  localStorage.setItem(PRODUCT_KEY, JSON.stringify(products));
}

function addProduct(tripId, name, quantity) {
  const productName = String(name || "").trim();
  const count = Number(quantity);

  if (!trips.some(trip => trip.id === tripId)) {
    alert("旅行を選択してください。");
    return false;
  }

  if (!productName || !Number.isSafeInteger(count) || count < 1) {
    alert("商品名と1個以上の購入予定数を入力してください。");
    return false;
  }

  products.push({
    id: crypto.randomUUID(),
    tripId: tripId,
    name: productName,
    quantity: count,
    purchased: 0,
    createdAt: new Date().toISOString()
  });

  saveProducts();
  renderProducts();
  return true;
}

function renderProducts() {
  const select = document.getElementById("productTrip");
  const list = document.getElementById("productList");
  if (!select || !list) return;

  const previous = select.value;
  select.replaceChildren();

  trips.forEach(trip => {
    const option = document.createElement("option");
    option.value = trip.id;
    option.textContent = trip.name;
    select.appendChild(option);
  });

  if (trips.some(trip => trip.id === previous)) {
    select.value = previous;
  }

  list.replaceChildren();

  const selectedId = select.value;
  const selectedProducts = products.filter(
    product => product.tripId === selectedId
  );

  if (selectedProducts.length === 0) {
    const message = document.createElement("p");
    message.textContent = "この旅行の商品はまだ登録されていません。";
    list.appendChild(message);
    return;
  }

  selectedProducts.forEach(product => {
    const card = document.createElement("div");
    card.className = "trip-card";
    card.style.padding = "12px 0";
    card.style.borderBottom = "1px solid #ddd";

    const title = document.createElement("strong");
    title.textContent = product.name;

    const quantity = document.createElement("p");
    quantity.textContent =
      `購入予定 ${product.quantity}個 / 購入済み ${product.purchased}個`;

    card.append(title, quantity);
    list.appendChild(card);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("productForm");
  const select = document.getElementById("productTrip");
  if (!form || !select) return;

  form.addEventListener("submit", event => {
    event.preventDefault();

    const name = document.getElementById("productName").value;
    const quantity = document.getElementById("productQuantity").value;

    if (addProduct(select.value, name, quantity)) {
      document.getElementById("productName").value = "";
      document.getElementById("productQuantity").value = "1";
    }
  });

  select.addEventListener("change", renderProducts);
  renderProducts();
});

// 旅行登録・削除時に商品表示も更新する
const originalRenderTrips = renderTrips;
renderTrips = function () {
  originalRenderTrips();
  renderProducts();
};
