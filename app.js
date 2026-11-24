
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


async function deleteTrip(id) {
  const trip = trips.find(item => item.id === id);
  if (!trip) return;

  // この旅行に関連する商品を取得
  const relatedProducts = products.filter(
    item => String(item.tripId) === String(id)
  );

  const productIds = new Set(
    relatedProducts.map(item => String(item.id))
  );

  const relatedAllocations = allocations.filter(
    item => productIds.has(String(item.productId))
  );

  const message =
    "「" + trip.name + "」を削除しますか？\n\n" +
    "関連する商品：" + relatedProducts.length + "件\n" +
    "関連する数量割当：" + relatedAllocations.length + "件\n\n" +
    "関連する商品・写真・数量割当も削除されます。";

  if (!confirm(message)) return;

  // 関連する商品を削除
  products = products.filter(
    item => String(item.tripId) !== String(id)
  );

  // 旅行を削除
  trips = trips.filter(item => item.id !== id);

  // 関連する数量割当を削除
  allocations = allocations.filter(
    item => !productIds.has(String(item.productId))
  );

  // データを保存
  saveTrips();
  saveProducts();
  saveAllocations();

  // すべての関連画面を更新
  renderTrips();
  renderProducts();
  renderAllocations();

  // 関連する写真を削除
  let photoError = false;

  for (const product of relatedProducts) {
    try {
      await deletePhoto(product.id);
    } catch (error) {
      photoError = true;
      console.error("写真削除エラー", error);
    }
  }

  if (photoError) {
    alert(
      "旅行と商品は削除されましたが、" +
      "一部の写真データを削除できませんでした。"
    );
  }
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

  // 配布先への割当済み数量を確認
  const allocated = getAllocatedQuantity(product.id);

  if (count < allocated) {
    alert(
      "予定数量を変更できません。\n\n" +
      "現在の割当済み数量：" + allocated + "個\n" +
      "変更しようとした数量：" + count + "個\n\n" +
      "予定数量を減らす場合は、先に配布先への割当数量を調整してください。"
    );
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

// ===== Ver.3.0 Web画像貼り付け機能 =====

async function pasteProductPhoto(productId) {
  if (!navigator.clipboard || !navigator.clipboard.read) {
    alert("このブラウザは画像の貼り付けに対応していません。");
    return;
  }

  try {
    const items = await navigator.clipboard.read();

    for (const item of items) {
      const imageType = item.types.find(
        type => type.startsWith("image/")
      );

      if (!imageType) continue;

      const blob = await item.getType(imageType);
      await savePhoto(productId, blob);

      renderProducts();
      alert("画像を登録しました。");
      return;
    }

    alert(
      "コピーされた画像が見つかりません。\n" +
      "Webサイトの画像を右クリックして「画像をコピー」を選んでください。"
    );
  } catch (error) {
    console.error("画像貼り付けエラー", error);
    alert(
      "画像を貼り付けできませんでした。\n" +
      "ブラウザのクリップボードへのアクセスを許可してください。"
    );
  }
}

// 商品一覧に画像貼り付けボタンを追加
const renderProductsBeforePaste = renderProducts;

renderProducts = function () {
  renderProductsBeforePaste();

  const list = document.getElementById("productList");
  const select = document.getElementById("productTrip");

  if (!list || !select) return;

  const selectedProducts = products.filter(
    product => product.tripId === select.value
  );

  const cards = Array.from(list.children);

  selectedProducts.forEach((product, index) => {
    const card = cards[index];
    if (!card) return;

    const actions = card.lastElementChild;
    if (!actions) return;

    const pasteButton = document.createElement("button");
    pasteButton.type = "button";
    pasteButton.textContent = "📋 画像を貼り付け";
    pasteButton.style.padding = "8px 12px";
    pasteButton.style.marginTop = "8px";
    pasteButton.style.marginRight = "8px";

    pasteButton.addEventListener("click", () => {
      pasteProductPhoto(product.id);
    });

    actions.appendChild(pasteButton);
  });
};

// ===== Ver.3.0 JSONバックアップ機能 =====

// 写真データをJSONに保存できる形式へ変換
function photoToDataURL(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);

    reader.readAsDataURL(blob);
  });
}

// 写真を含むバックアップを作成
async function createBackup() {
  const button = document.getElementById("backupButton");

  if (button) {
    button.disabled = true;
    button.textContent = "バックアップ作成中...";
  }

  try {
    const photoData = {};

    // 商品ごとに写真を読み込む
    for (const product of products) {
      const photo = await getPhoto(product.id);

      if (photo) {
        photoData[product.id] = await photoToDataURL(photo);
      }
    }

    const backup = {
      app: "tabimiyage-map",
      version: "3.0",
      backupVersion: 1,
      createdAt: new Date().toISOString(),
      trips: trips,
      products: products,
      photos: photoData
    };

    const json = JSON.stringify(backup, null, 2);

    const blob = new Blob(
      [json],
      { type: "application/json;charset=utf-8" }
    );

    const url = URL.createObjectURL(blob);

    const date = new Date();
    const dateText =
      date.getFullYear() + "-" +
      String(date.getMonth() + 1).padStart(2, "0") + "-" +
      String(date.getDate()).padStart(2, "0");

    const link = document.createElement("a");
    link.href = url;
    link.download = "tabimiyage-backup-" + dateText + ".json";

    document.body.appendChild(link);
    link.click();
    link.remove();

    // ダウンロード開始後にURLを解放
    setTimeout(() => URL.revokeObjectURL(url), 60000);

  } catch (error) {
    console.error("バックアップ作成エラー", error);
    alert("バックアップを作成できませんでした。");
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = "💾 バックアップを保存";
    }
  }
}

// バックアップボタンを表示する
function addBackupButton() {
  const main = document.querySelector("main");
  if (!main || document.getElementById("backupButton")) return;

  const section = document.createElement("section");
  section.className = "card";
  section.style.marginTop = "20px";

  const heading = document.createElement("h2");
  heading.textContent = "データのバックアップ";

  const description = document.createElement("p");
  description.textContent =
    "旅行・商品・写真をまとめてJSONファイルに保存します。";

  const button = document.createElement("button");
  button.id = "backupButton";
  button.type = "button";
  button.textContent = "💾 バックアップを保存";
  button.style.padding = "12px 20px";
  button.style.background = "#176b57";
  button.style.color = "white";
  button.style.border = "0";
  button.style.borderRadius = "8px";

  button.addEventListener("click", createBackup);

  section.append(heading, description, button);
  main.appendChild(section);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addBackupButton);
} else {
  addBackupButton();
}

// ===== Ver.3.0 JSONバックアップ復元機能 =====

function dataURLToBlob(dataURL) {
  const parts = dataURL.split(",");
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64$/.exec(parts[0]);

  if (!match || parts.length !== 2) {
    throw new Error("写真データの形式が不正です。");
  }

  const binary = atob(parts[1]);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new Blob([bytes], { type: match[1] });
}

// JSONファイルを選択して内容を確認
async function selectBackupFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) return;

    try {
      const backup = JSON.parse(await file.text());

      if (
        backup.app !== "tabimiyage-map" ||
        backup.version !== "3.0" ||
        backup.backupVersion !== 1 ||
        !Array.isArray(backup.trips) ||
        !Array.isArray(backup.products) ||
        !backup.photos ||
        typeof backup.photos !== "object" ||
        Array.isArray(backup.photos)
      ) {
        throw new Error("対応していないバックアップファイルです。");
      }

      // 写真を事前に変換して形式を確認
      const restoredPhotos = new Map();

      for (const [id, dataURL] of Object.entries(backup.photos)) {
        if (
          typeof dataURL !== "string" ||
          !backup.products.some(product => String(product.id) === id)
        ) {
          throw new Error("写真と商品の対応が不正です。");
        }

        restoredPhotos.set(id, dataURLToBlob(dataURL));
      }

      const message =
        "バックアップの内容\n\n" +
        "旅行：" + backup.trips.length + "件\n" +
        "商品：" + backup.products.length + "件\n" +
        "写真：" + restoredPhotos.size + "枚\n\n" +
        "現在のデータ\n" +
        "旅行：" + trips.length + "件\n" +
        "商品：" + products.length + "件\n\n" +
        "現在のデータをバックアップの内容に置き換えます。\n" +
        "続行しますか？";

      if (!confirm(message)) return;

      await restoreBackupData(backup, restoredPhotos);

      alert("バックアップから復元しました。");

      location.reload();

    } catch (error) {
      console.error("バックアップ復元エラー", error);
      alert(
        "復元できませんでした。\n" +
        error.message
      );
    }
  });

  input.click();
}

// 旅行・商品・写真を復元
async function restoreBackupData(backup, restoredPhotos) {
  const db = await openPhotoDB();

  try {
    // 写真を1回のトランザクションで置き換える
    await new Promise((resolve, reject) => {
      const tx = db.transaction(PHOTO_STORE, "readwrite");
      const store = tx.objectStore(PHOTO_STORE);

      store.clear();

      for (const [id, blob] of restoredPhotos) {
        store.put(blob, id);
      }

      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    // 写真保存後に旅行・商品を置き換える
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(backup.trips)
    );

    localStorage.setItem(
      PRODUCT_KEY,
      JSON.stringify(backup.products)
    );

  } finally {
    db.close();
  }
}

// 復元ボタンを追加
function addRestoreButton() {
  const backupButton = document.getElementById("backupButton");
  if (!backupButton || document.getElementById("restoreButton")) return;

  const restoreButton = document.createElement("button");
  restoreButton.id = "restoreButton";
  restoreButton.type = "button";
  restoreButton.textContent = "📂 バックアップから復元";
  restoreButton.style.padding = "12px 20px";
  restoreButton.style.margin = "10px";
  restoreButton.style.background = "#ffffff";
  restoreButton.style.color = "#176b57";
  restoreButton.style.border = "1px solid #176b57";
  restoreButton.style.borderRadius = "8px";

  restoreButton.addEventListener("click", selectBackupFile);

  backupButton.parentElement.appendChild(restoreButton);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", addRestoreButton);
} else {
  addRestoreButton();
}

// ===== Ver.3.0 おみやげ配布先管理 =====

const RECIPIENT_KEY = "tabimiyage-map-v3-recipients";

// 配布先データを読み込む
function loadRecipients() {
  try {
    const data = JSON.parse(
      localStorage.getItem(RECIPIENT_KEY) || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("配布先データの読み込みエラー", error);
    return [];
  }
}

let recipients = loadRecipients();

// 配布先データを保存する
function saveRecipients() {
  localStorage.setItem(
    RECIPIENT_KEY,
    JSON.stringify(recipients)
  );
}

// 配布先を登録する
function addRecipient(name) {
  const trimmedName = name.trim();

  if (!trimmedName) {
    alert("配布先の名前を入力してください。");
    return;
  }

  if (recipients.some(
    recipient => recipient.name === trimmedName
  )) {
    alert("同じ名前の配布先が登録されています。");
    return;
  }

  recipients.push({
    id: crypto.randomUUID(),
    name: trimmedName
  });

  saveRecipients();
  renderRecipients();
}

// 配布先を削除する
function deleteRecipient(id) {
  const recipient = recipients.find(
    item => item.id === id
  );

  if (!recipient) return;

  if (!confirm(
    "「" + recipient.name + "」を削除しますか？"
  )) {
    return;
  }

  recipients = recipients.filter(
    item => item.id !== id
  );

  saveRecipients();
  renderRecipients();
}

// 配布先一覧を表示する
function renderRecipients() {
  const list = document.getElementById("recipientList");
  if (!list) return;

  list.replaceChildren();

  if (recipients.length === 0) {
    const message = document.createElement("p");
    message.textContent = "配布先はまだ登録されていません。";
    list.appendChild(message);
    return;
  }

  recipients.forEach(recipient => {
    const row = document.createElement("div");

    row.style.display = "flex";
    row.style.justifyContent = "space-between";
    row.style.alignItems = "center";
    row.style.gap = "12px";
    row.style.padding = "12px 0";
    row.style.borderBottom = "1px solid #dddddd";

    const name = document.createElement("span");
    name.textContent = recipient.name;

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "削除";
    button.style.padding = "8px 12px";

    button.addEventListener("click", () => {
      deleteRecipient(recipient.id);
    });

    row.append(name, button);
    list.appendChild(row);
  });
}

// 配布先登録画面を追加する
function addRecipientSection() {
  const main = document.querySelector("main");

  if (!main || document.getElementById("recipientForm")) {
    return;
  }

  const section = document.createElement("section");
  section.className = "card";
  section.style.marginTop = "20px";

  const heading = document.createElement("h2");
  heading.textContent = "🎁 おみやげの配布先";

  const form = document.createElement("form");
  form.id = "recipientForm";

  const input = document.createElement("input");
  input.id = "recipientName";
  input.type = "text";
  input.placeholder = "例：家族、友人A、会社";
  input.required = true;
  input.style.width = "100%";
  input.style.padding = "12px";
  input.style.marginBottom = "12px";

  const button = document.createElement("button");
  button.type = "submit";
  button.textContent = "配布先を登録";
  button.style.padding = "12px 20px";
  button.style.background = "#176b57";
  button.style.color = "white";
  button.style.border = "0";
  button.style.borderRadius = "8px";

  const list = document.createElement("div");
  list.id = "recipientList";
  list.style.marginTop = "20px";

  form.append(input, button);
  section.append(heading, form, list);
  main.appendChild(section);

  form.addEventListener("submit", event => {
    event.preventDefault();
    addRecipient(input.value);
    input.value = "";
  });

  renderRecipients();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    addRecipientSection
  );
} else {
  addRecipientSection();
}

// ===== Ver.3.0 商品ごとの配布先・数量管理 =====

const ALLOCATION_KEY = "tabimiyage-map-v3-allocations";

function loadAllocations() {
  try {
    const data = JSON.parse(
      localStorage.getItem(ALLOCATION_KEY) || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("割当データ読み込みエラー", error);
    return [];
  }
}

let allocations = loadAllocations();

function saveAllocations() {
  localStorage.setItem(
    ALLOCATION_KEY,
    JSON.stringify(allocations)
  );
}

// 商品に割り当てられた数量の合計
function getAllocatedQuantity(productId) {
  return allocations
    .filter(item => String(item.productId) === String(productId))
    .reduce((sum, item) => sum + item.quantity, 0);
}

// 配布先と数量を登録
function addAllocation(productId, recipientId, quantity) {
  const product = products.find(
    item => String(item.id) === String(productId)
  );
  const recipient = recipients.find(
    item => item.id === recipientId
  );

  if (!product || !recipient) {
    alert("商品または配布先が見つかりません。");
    return;
  }

  const count = Number(quantity);
  if (!Number.isSafeInteger(count) || count < 1) {
    alert("数量は1以上の整数で入力してください。");
    return;
  }

  const total = Number(product.quantity);
  if (
    !Number.isSafeInteger(total) ||
    getAllocatedQuantity(product.id) + count > total
  ) {
    alert("商品の予定数量を超えて割り当てることはできません。");
    return;
  }

  const existing = allocations.find(
    item =>
      String(item.productId) === String(product.id) &&
      item.recipientId === recipientId
  );

  if (existing) {
    existing.quantity += count;
  } else {
    allocations.push({
      id: crypto.randomUUID(),
      productId: product.id,
      recipientId,
      quantity: count
    });
  }

  saveAllocations();
  renderAllocations();
}

// 割当を削除
function deleteAllocation(id) {
  if (!confirm("この割当を削除しますか？")) return;

  allocations = allocations.filter(item => item.id !== id);
  saveAllocations();
  renderAllocations();
}

// 割当管理画面を表示
function renderAllocations() {
  const area = document.getElementById("allocationArea");
  if (!area) return;

  area.replaceChildren();

  if (products.length === 0) {
    area.textContent = "商品を登録すると割当ができます。";
    return;
  }

  products.forEach(product => {
    const card = document.createElement("div");
    card.style.padding = "15px";
    card.style.marginBottom = "15px";
    card.style.border = "1px solid #dddddd";
    card.style.borderRadius = "8px";

    const heading = document.createElement("h3");
    heading.textContent = product.name;
    card.appendChild(heading);

    const allocated = getAllocatedQuantity(product.id);
    const remaining = Number(product.quantity) - allocated;

    const summary = document.createElement("p");
    summary.textContent =
      "予定：" + product.quantity + "個 / " +
      "割当済：" + allocated + "個 / " +
      "未割当：" + remaining + "個";
    card.appendChild(summary);

    const related = allocations.filter(
      item => String(item.productId) === String(product.id)
    );

    related.forEach(item => {
      const recipient = recipients.find(
        r => r.id === item.recipientId
      );

      const row = document.createElement("div");
      row.style.padding = "6px 0";

      const label = document.createElement("span");
      label.textContent =
        (recipient ? recipient.name : "削除済みの配布先") +
        "：" + item.quantity + "個 ";

      const remove = document.createElement("button");
      remove.type = "button";
      remove.textContent = "割当削除";
      remove.addEventListener("click", () => {
        deleteAllocation(item.id);
      });

      row.append(label, remove);
      card.appendChild(row);
    });

    if (recipients.length > 0) {
      const form = document.createElement("form");

      const select = document.createElement("select");
      recipients.forEach(recipient => {
        const option = document.createElement("option");
        option.value = recipient.id;
        option.textContent = recipient.name;
        select.appendChild(option);
      });

      const input = document.createElement("input");
      input.type = "number";
      input.inputMode = "numeric";
      input.min = "1";
      input.step = "1";
      input.value = "1";
      input.required = true;
      input.style.width = "70px";
      input.style.margin = "8px";

      const button = document.createElement("button");
      button.type = "submit";
      button.textContent = "割り当てる";

      form.append(select, input, button);
      form.addEventListener("submit", event => {
        event.preventDefault();
        addAllocation(product.id, select.value, input.value);
      });

      card.appendChild(form);
    }

    area.appendChild(card);
  });
}

// 割当管理セクションを追加
function addAllocationSection() {
  const main = document.querySelector("main");
  if (!main || document.getElementById("allocationArea")) return;

  const section = document.createElement("section");
  section.className = "card";
  section.style.marginTop = "20px";

  const heading = document.createElement("h2");
  heading.textContent = "📦 商品の配布先・数量割当";

  const area = document.createElement("div");
  area.id = "allocationArea";

  section.append(heading, area);
  main.appendChild(section);

  renderAllocations();
}

// 商品一覧を更新したとき、割当画面も更新
const previousRenderProductsForAllocation = renderProducts;
renderProducts = function() {
  previousRenderProductsForAllocation();
  renderAllocations();
};

// 配布先一覧を更新したとき、割当画面も更新
const previousRenderRecipientsForAllocation = renderRecipients;
renderRecipients = function() {
  previousRenderRecipientsForAllocation();
  renderAllocations();
};

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    addAllocationSection
  );
} else {
  addAllocationSection();
}

// ===== Ver.3.0 データ整合性管理 =====

// 存在しない商品・配布先の割当を整理する
function cleanupAllocations() {
  const validProductIds = new Set(
    products.map(product => String(product.id))
  );

  const validRecipientIds = new Set(
    recipients.map(recipient => recipient.id)
  );

  const before = allocations.length;

  allocations = allocations.filter(item =>
    validProductIds.has(String(item.productId)) &&
    validRecipientIds.has(item.recipientId)
  );

  if (before !== allocations.length) {
    saveAllocations();
  }
}

// 割当済みの配布先を削除する場合は確認する
deleteRecipient = function(id) {
  const recipient = recipients.find(
    item => item.id === id
  );

  if (!recipient) return;

  const related = allocations.filter(
    item => item.recipientId === id
  );

  const total = related.reduce(
    (sum, item) => sum + item.quantity, 0
  );

  let message =
    "「" + recipient.name + "」を削除しますか？";

  if (related.length > 0) {
    message +=
      "\n\n関連する商品割当：" + related.length + "件" +
      "\n割当数量：" + total + "個" +
      "\n\n関連する割当情報も削除されます。";
  }

  if (!confirm(message)) return;

  recipients = recipients.filter(
    item => item.id !== id
  );

  saveRecipients();
  cleanupAllocations();
  renderRecipients();
  renderAllocations();
};

// 商品保存時に不要な割当を整理する
const previousSaveProductsForIntegrity = saveProducts;

saveProducts = function() {
  previousSaveProductsForIntegrity();
  cleanupAllocations();
};

// 商品一覧の更新時にも整合性を確認する
const previousRenderProductsForIntegrity = renderProducts;

renderProducts = function() {
  cleanupAllocations();
  previousRenderProductsForIntegrity();
};

// 起動時にデータの整合性を確認する
function initializeAllocationIntegrity() {
  cleanupAllocations();
  renderAllocations();
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initializeAllocationIntegrity
  );
} else {
  initializeAllocationIntegrity();
}

// ===== Ver.3.0 不要な商品データの整理 =====

// 存在しない旅行に紐付く商品を検出
function findOrphanProducts() {
  const validTripIds = new Set(
    trips.map(trip => String(trip.id))
  );

  return products.filter(
    product => !validTripIds.has(String(product.tripId))
  );
}

// 不要な商品・写真・割当情報を整理
async function cleanupOrphanProducts() {
  const orphanProducts = findOrphanProducts();

  if (orphanProducts.length === 0) {
    alert("不要な商品データはありません。");
    return;
  }

  const names = orphanProducts
    .map(product => "・" + product.name)
    .join("\n");

  const message =
    "存在しない旅行に紐付く商品が見つかりました。\n\n" +
    names + "\n\n" +
    "対象商品：" + orphanProducts.length + "件\n\n" +
    "対象の商品・写真・数量割当を削除します。\n" +
    "正常な旅行や商品、配布先は削除しません。\n\n" +
    "整理を実行しますか？";

  if (!confirm(message)) return;

  const orphanIds = new Set(
    orphanProducts.map(product => String(product.id))
  );

  products = products.filter(
    product => !orphanIds.has(String(product.id))
  );

  allocations = allocations.filter(
    item => !orphanIds.has(String(item.productId))
  );

  saveProducts();
  saveAllocations();

  renderTrips();
  renderProducts();
  renderAllocations();

  let photoErrors = 0;

  for (const product of orphanProducts) {
    try {
      await deletePhoto(product.id);
    } catch (error) {
      photoErrors++;
      console.error("不要な写真の削除エラー", error);
    }
  }

  alert(
    orphanProducts.length + "件の商品データを整理しました。" +
    (photoErrors > 0
      ? "\n一部の写真を削除できませんでした。"
      : "")
  );
}

// データ整理ボタンを追加
function addOrphanCleanupButton() {
  const backupButton = document.getElementById("backupButton");

  if (
    !backupButton ||
    document.getElementById("orphanCleanupButton")
  ) return;

  const button = document.createElement("button");

  button.id = "orphanCleanupButton";
  button.type = "button";
  button.textContent = "不要なデータを確認・整理";
  button.style.padding = "12px 20px";
  button.style.margin = "10px";
  button.style.background = "#ffffff";
  button.style.color = "#555555";
  button.style.border = "1px solid #aaaaaa";
  button.style.borderRadius = "8px";

  button.addEventListener("click", cleanupOrphanProducts);

  backupButton.parentElement.appendChild(button);
}

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    addOrphanCleanupButton
  );
} else {
  addOrphanCleanupButton();
}


