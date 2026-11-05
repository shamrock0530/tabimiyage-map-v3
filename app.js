
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

// ===== Ver.3.0 商品編集・購入数量管理 =====

// 購入済み数量を増減する
function changePurchased(id, amount) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const current = Number(product.purchased) || 0;
  const limit = Number(product.quantity) || 0;

  product.purchased = Math.max(
    0,
    Math.min(limit, current + amount)
  );

  saveProducts();
  renderProducts();
}

// 商品名・購入予定数量を編集する
function editProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const name = prompt("商品名を編集", product.name);
  if (name === null) return;

  const newName = name.trim();
  if (!newName) {
    alert("商品名を入力してください。");
    return;
  }

  const quantity = prompt(
    "購入予定数量を入力",
    String(product.quantity)
  );
  if (quantity === null) return;

  const count = Number(quantity);
  if (!Number.isSafeInteger(count) || count < 1) {
    alert("1以上の整数を入力してください。");
    return;
  }

  product.name = newName;
  product.quantity = count;
  product.purchased = Math.min(product.purchased, count);

  saveProducts();
  renderProducts();
}

// 商品を削除する
function deleteProduct(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  if (!confirm(`「${product.name}」を削除しますか？`)) {
    return;
  }

  products = products.filter(item => item.id !== id);
  saveProducts();
  renderProducts();
}

// 商品一覧を操作ボタン付きに更新
renderProducts = function () {
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

  const selectedProducts = products.filter(
    product => product.tripId === select.value
  );

  if (selectedProducts.length === 0) {
    const message = document.createElement("p");
    message.textContent =
      "この旅行の商品はまだ登録されていません。";
    list.appendChild(message);
    return;
  }

  selectedProducts.forEach(product => {
    const card = document.createElement("div");
    card.style.padding = "14px 0";
    card.style.borderBottom = "1px solid #ddd";

    const title = document.createElement("strong");
    title.textContent = product.name;

    const quantity = document.createElement("p");
    quantity.textContent =
      `購入予定 ${product.quantity}個 / 購入済み ${product.purchased}個`;

    const actions = document.createElement("div");
    actions.style.display = "flex";
    actions.style.flexWrap = "wrap";
    actions.style.gap = "8px";

    const buttons = [
      ["−1", () => changePurchased(product.id, -1)],
      ["＋1", () => changePurchased(product.id, 1)],
      ["編集", () => editProduct(product.id)],
      ["削除", () => deleteProduct(product.id)]
    ];

    buttons.forEach(([label, action]) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = label;
      button.style.padding = "8px 12px";
      button.style.border = "1px solid #ccc";
      button.style.borderRadius = "8px";
      button.style.background = "#fff";
      button.addEventListener("click", action);
      actions.appendChild(button);
    });

    card.append(title, quantity, actions);
    list.appendChild(card);
  });
};

// ===== Ver.3.0 Googleマップ店舗リンク =====

// GoogleマップのURLを確認する
function validMapLink(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return url.protocol === "https:" &&
      (
        host === "maps.app.goo.gl" ||
        host === "goo.gl" ||
        host === "google.com" ||
        host.endsWith(".google.com") ||
        host === "google.co.jp" ||
        host.endsWith(".google.co.jp")
      );
  } catch {
    return false;
  }
}

// 店舗のGoogleマップURLを登録・変更する
function editMapLink(id) {
  const product = products.find(item => item.id === id);
  if (!product) return;

  const input = prompt(
    "Googleマップの店舗URLを入力してください",
    product.mapLink || ""
  );

  if (input === null) return;

  const url = input.trim();

  if (url && !validMapLink(url)) {
    alert("Googleマップの共有URLを入力してください。");
    return;
  }

  product.mapLink = url;
  saveProducts();
  renderProducts();
}

// Googleマップで店舗を開く
function openMapLink(id) {
  const product = products.find(item => item.id === id);
  if (!product || !validMapLink(product.mapLink || "")) {
    alert("店舗のGoogleマップURLが登録されていません。");
    return;
  }

  window.open(product.mapLink, "_blank", "noopener,noreferrer");
}

// 既存の商品一覧表示に店舗ボタンを追加する
const previousRenderProducts = renderProducts;

renderProducts = function () {
  previousRenderProducts();

  const list = document.getElementById("productList");
  if (!list) return;

  const selectedTripId =
    document.getElementById("productTrip")?.value;

  const cards = Array.from(list.children);
  const selectedProducts = products.filter(
    product => product.tripId === selectedTripId
  );

  selectedProducts.forEach((product, index) => {
    const card = cards[index];
    if (!card) return;

    const actions = card.lastElementChild;
    if (!actions) return;

    const editButton = document.createElement("button");
    editButton.type = "button";
    editButton.textContent = "📍 店舗URL登録";
    editButton.style.padding = "8px 12px";
    editButton.style.border = "1px solid #ccc";
    editButton.style.borderRadius = "8px";
    editButton.style.background = "#fff";
    editButton.addEventListener(
      "click",
      () => editMapLink(product.id)
    );
    actions.appendChild(editButton);

    if (validMapLink(product.mapLink || "")) {
      const mapButton = document.createElement("button");
      mapButton.type = "button";
      mapButton.textContent = "🗺️ 地図を開く";
      mapButton.style.padding = "8px 12px";
      mapButton.style.border = "1px solid #ccc";
      mapButton.style.borderRadius = "8px";
      mapButton.style.background = "#fff";
      mapButton.addEventListener(
        "click",
        () => openMapLink(product.id)
      );
      actions.appendChild(mapButton);
    }
  });
};

// ===== Ver.3.0 商品写真管理 =====
// 写真はIndexedDBに保存します。

const PHOTO_DB_NAME = "tabimiyage-map-v3-photos";
const PHOTO_STORE = "photos";

function openPhotoDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(PHOTO_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(PHOTO_STORE)) {
        db.createObjectStore(PHOTO_STORE);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function savePhoto(productId, file) {
  const db = await openPhotoDB();

  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).put(file, productId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

async function getPhoto(productId) {
  const db = await openPhotoDB();

  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readonly");
      const request = tx.objectStore(PHOTO_STORE).get(productId);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } finally {
    db.close();
  }
}

async function deletePhoto(productId) {
  const db = await openPhotoDB();

  try {
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      tx.objectStore(PHOTO_STORE).delete(productId);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}

// 写真の選択・撮影・変更
function selectProductPhoto(productId) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      await savePhoto(productId, file);
      renderProducts();
    } catch (error) {
      console.error(error);
      alert("写真を保存できませんでした。");
    }
  });

  input.click();
}

// 写真の削除
async function removeProductPhoto(productId) {
  if (!confirm("この商品の写真を削除しますか？")) {
    return;
  }

  try {
    await deletePhoto(productId);
    renderProducts();
  } catch (error) {
    console.error(error);
    alert("写真を削除できませんでした。");
  }
}

// 商品一覧に写真と操作ボタンを追加
const renderProductsBeforePhotos = renderProducts;

renderProducts = function () {
  renderProductsBeforePhotos();

  const list = document.getElementById("productList");
  const select = document.getElementById("productTrip");
  if (!list || !select) return;

  const selectedProducts = products.filter(
    product => product.tripId === select.value
  );

  const cards = Array.from(list.children);

  selectedProducts.forEach(async (product, index) => {
    const card = cards[index];
    if (!card) return;

    const photoArea = document.createElement("div");
    photoArea.style.margin = "10px 0";

    const actions = card.lastElementChild;

    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.textContent = "📷 写真を登録・変更";
    addButton.style.padding = "8px 12px";
    addButton.style.marginRight = "8px";
    addButton.addEventListener(
      "click",
      () => selectProductPhoto(product.id)
    );

    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "写真を削除";
    removeButton.style.padding = "8px 12px";
    removeButton.addEventListener(
      "click",
      () => removeProductPhoto(product.id)
    );

    if (actions) {
      actions.append(addButton, removeButton);
    }

    card.insertBefore(photoArea, actions);

    try {
      const file = await getPhoto(product.id);
      if (!file || !card.isConnected) return;

      const image = document.createElement("img");
      const url = URL.createObjectURL(file);

      image.src = url;
      image.alt = product.name;
      image.style.width = "120px";
      image.style.height = "120px";
      image.style.objectFit = "cover";
      image.style.borderRadius = "10px";

      image.onload = () => URL.revokeObjectURL(url);
      image.onerror = () => URL.revokeObjectURL(url);

      photoArea.appendChild(image);
    } catch (error) {
      console.error("写真の読み込みに失敗", error);
    }
  });
};


