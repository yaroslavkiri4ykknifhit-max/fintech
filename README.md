# FinTrack — Учёт доходов и расходов (React + Vite)

Красивое, отзывчивое веб-приложение для учёта личных финансов, созданное по дизайну из Figma (стиль iOS приборной панели с интерактивными графиками и карточками). 

Приложение поддерживает как ручное управление операциями, так и автоматическое **распознавание чеков по фотографии** через интеграцию с Groq Vision API. Данные сохраняются локально либо синхронизируются в реальном времени с **Google Sheets**.

---

## 🚀 Возможности

1. **Dashboard (Главная):**
   - Отображение баланса в виде кредитной карты Mastercard из Figma.
   - Сводные данные доходов и расходов за месяц.
   - История последних 10 транзакций с автоматическим сопоставлением бренд-иконок (YouTube, GitHub, Dribbble, Food, Shopping и др.).
2. **Аналитика и Графики (Statistics):**
   - Интерактивный недельный график расходовMon-Sun (по субботам подсвечивается акцентным цветом).
   - Расчет среднего показателя расходов.
   - Анализ расходов по категориям.
3. **Распознавание чеков через Groq Vision API:**
   - Загрузка чеков (фото или файл).
   - Отправка в модель `llama-4-scout-17b-16e-instruct` (или Llama 3.2 Vision).
   - Извлечение суммы, продавца, даты и категории.
   - Редактирование и подтверждение распознанных данных перед записью.
4. **Синхронизация с Google Sheets:**
   - Два режима: LocalStorage (по умолчанию, настройка не требуется) и безопасный Google Sheets Sync.

---

## 🛠 Установка и Запуск

### 1. Клонирование и установка зависимостей:
```bash
npm install
```

### 2. Настройка окружения (`.env`):
Создайте файл `.env` в корневом каталоге и настройте ключи:
```env
# Рекомендуемый способ (чтение/запись через Apps Script)
VITE_GOOGLE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec

# Прямой API способ (только для чтения публичных таблиц)
VITE_GOOGLE_SHEETS_API_KEY=
VITE_GOOGLE_SHEETS_SPREADSHEET_ID=

# Ключ Groq API для распознавания чеков
VITE_GROQ_API_KEY=gsk_...
VITE_GROQ_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
```
*(Если ключи не заданы, приложение будет автоматически работать в офлайн-режиме LocalStorage и симулировать сканирование чеков с красивым лоадером).*

### 3. Запуск локального сервера:
```bash
npm run dev
```

### 4. Сборка для GitHub Pages (Production):
```bash
npm run build
```

---

## 📝 Настройка Google Sheets API (Безопасный прокси)

Чтобы безопасно записывать данные в Google Sheets с клиентского SPA-приложения без раскрытия приватных ключей Google Cloud, настройте простой прокси-скрипт Google Apps Script.

### Инструкция:
1. Создайте пустую Google Таблицу.
2. Переименуйте первый лист в **`transactions`**, а второй в **`settings`**.
3. В листе `transactions` вставьте заголовки в первую строку (A1:G1):
   `id`, `type`, `amount`, `category`, `date`, `description`, `createdAt`
4. В листе `settings` добавьте заголовки в первую строку:
   `currentBalance`, `currency`
   А во вторую строку добавьте стартовый баланс: `521985`, `$`
5. Откройте **Расширения (Extensions) -> Apps Script**.
6. Удалите стандартный код и вставьте следующий скрипт:

```javascript
function doGet(e) {
  var action = e.parameter.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var txSheet = sheet.getSheetByName("transactions");
  if (!txSheet) {
    txSheet = sheet.insertSheet("transactions");
    txSheet.appendRow(["id", "type", "amount", "category", "date", "description", "createdAt"]);
  }
  
  var settingsSheet = sheet.getSheetByName("settings");
  if (!settingsSheet) {
    settingsSheet = sheet.insertSheet("settings");
    settingsSheet.appendRow(["currentBalance", "currency"]);
    settingsSheet.appendRow([521985.00, "$"]);
  }
  
  if (action === "read") {
    var txData = txSheet.getDataRange().getValues();
    var transactions = [];
    
    for (var i = 1; i < txData.length; i++) {
      var row = txData[i];
      transactions.push({
        id: row[0].toString(),
        type: row[1].toString(),
        amount: parseFloat(row[2]) || 0,
        category: row[3].toString(),
        date: row[4].toString(),
        description: row[5] ? row[5].toString() : "",
        createdAt: row[6] ? row[6].toString() : new Date().toISOString()
      });
    }
    
    var settingsData = settingsSheet.getDataRange().getValues();
    var settings = { currentBalance: 521985.00, currency: "$" };
    if (settingsData.length > 1) {
      settings.currentBalance = parseFloat(settingsData[1][0]) || 0;
      settings.currency = settingsData[1][1] || "$";
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      transactions: transactions,
      settings: settings
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var postData = JSON.parse(e.postData.contents);
  var action = postData.action;
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  
  var txSheet = sheet.getSheetByName("transactions");
  var settingsSheet = sheet.getSheetByName("settings");
  
  if (action === "add") {
    var tx = postData.transaction;
    
    txSheet.appendRow([
      tx.id,
      tx.type,
      tx.amount,
      tx.category,
      tx.date,
      tx.description,
      tx.createdAt
    ]);
    
    var settingsData = settingsSheet.getDataRange().getValues();
    var currentBalance = 0;
    var currency = "$";
    if (settingsData.length > 1) {
      currentBalance = parseFloat(settingsData[1][0]) || 0;
      currency = settingsData[1][1] || "$";
    }
    
    var change = tx.type === "income" ? tx.amount : -tx.amount;
    var newBalance = currentBalance + change;
    
    settingsSheet.getRange(2, 1).setValue(newBalance);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      transaction: tx,
      settings: { currentBalance: newBalance, currency: currency }
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "delete") {
    var idToDelete = postData.id;
    var txData = txSheet.getDataRange().getValues();
    var deletedTx = null;
    
    for (var i = 1; i < txData.length; i++) {
      if (txData[i][0].toString() === idToDelete.toString()) {
        deletedTx = {
          type: txData[i][1],
          amount: parseFloat(txData[i][2]) || 0
        };
        txSheet.deleteRow(i + 1);
        break;
      }
    }
    
    if (deletedTx) {
      var settingsData = settingsSheet.getDataRange().getValues();
      var currentBalance = parseFloat(settingsData[1][0]) || 0;
      var currency = settingsData[1][1] || "$";
      
      var change = deletedTx.type === "income" ? -deletedTx.amount : deletedTx.amount;
      var newBalance = currentBalance + change;
      
      settingsSheet.getRange(2, 1).setValue(newBalance);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        settings: { currentBalance: newBalance, currency: currency }
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "Transaction not found" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  if (action === "update_settings") {
    var settings = postData.settings;
    settingsSheet.getRange(2, 1).setValue(parseFloat(settings.currentBalance) || 0);
    settingsSheet.getRange(2, 2).setValue(settings.currency || "$");
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      settings: settings
    })).setMimeType(ContentService.MimeType.JSON);
  }
  
  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid action" }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

7. Нажмите **Начать развертывание (Deploy) -> Новое развертывание**.
8. Выберите конфигурацию:
   - **Тип:** Веб-приложение (Web app).
   - **Запуск от имени:** Я (оф. владелец таблицы).
   - **Доступ:** Кто угодно (Anyone).
9. Скопируйте полученную ссылку на веб-приложение и вставьте её в настройки приложения FinTrack или в переменную `.env` (`VITE_GOOGLE_APPS_SCRIPT_URL`).
