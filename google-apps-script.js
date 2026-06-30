/**
 * =========================================================================
 * GOOGLE APPS SCRIPT FOR CHILL OUT EXPENSE TRACKER (FULLY HOSTED VERSION)
 * =========================================================================
 * 
 * คำแนะนำในการติดตั้งและใช้งานระบบโฮสต์สมบูรณ์แบบ ( hosted ) :
 * 
 * 1. เปิดเบราว์เซอร์แล้วไปที่: https://script.google.com
 * 2. คลิกปุ่ม "โครงการใหม่" (New Project)
 * 3. ลบโค้ดเดิมทั้งหมดในไฟล์ Code.gs ออกให้หมด
 * 4. คัดลอกโค้ดทั้งหมดในไฟล์นี้ (google-apps-script.js) ไปวางในเครื่องมือแก้ไข Code.gs
 * 5. คลิกปุ่มเพิ่มไฟล์ (+) ในแถบเมนูด้านซ้าย -> เลือกสร้าง "HTML" -> ตั้งชื่อไฟล์ว่า: index
 *    (เมื่อสร้างเสร็จ ระบบจะสร้างไฟล์ชื่อ index.html ขึ้นมา)
 * 6. ดับเบิ้ลคลิกเปิดไฟล์หน้าเว็บ index-google-apps-script.html ในเครื่องคอมพิวเตอร์ของคุณ
 *    คัดลอกโค้ดทั้งหมด นำไปวางทับในไฟล์ index.html ของ Apps Script แล้วกดปุ่ม "บันทึก" ทั้งสองไฟล์
 * 7. วิธีการเผยแพร่เว็บแอป (Deploy Web App):
 *    - คลิกปุ่ม "การทำให้ใช้งานได้" (Deploy) มุมขวาบน -> เลือก "การทำให้ใช้งานได้ใหม่" (New deployment)
 *    - คลิกรูปฟันเฟือง (Select type) -> เลือก "แอปเว็บ" (Web app)
 *    - ตั้งค่าดังนี้:
 *      * คำอธิบาย (Description): Chill Out hosted App
 *      * เรียกใช้เป็น (Execute as): เลือก "ฉัน (อีเมลของคุณ)" (Me)
 *      * ผู้มีสิทธิ์เข้าถึง (Who has access): เลือก "ทุกคน" (Anyone)
 *    - คลิกปุ่ม "การทำให้ใช้งานได้" (Deploy)
 *    - กด "ให้สิทธิ์เข้าถึง" (Grant Access) และยืนยันอนุญาตสิทธิ์ความปลอดภัยต่างๆ ให้ครบถ้วน
 * 8. คัดลอก "URL ของเว็บแอป" (Web app URL) ที่ได้ (จะขึ้นต้นด้วย https://script.google.com/macros/s/...)
 *    นี่คือลิงก์อย่างเป็นทางการที่กลุ่ม Chill Out ของท่านสามารถเปิดเข้าบันทึกและเปิดดูสรุปได้ทันทีบนมือถือ!
 * 
 * =========================================================================
 */

// 1. ระบุ ID ของ Google Sheet ของคุณที่นี่ (คัดลอกจาก URL ของชีต)
var SPREADSHEET_ID = "1V97Io8E5UE20zH3iHtBMtDmUPnfK2kqweCaT3GwKyaU";
var SHEET_URL = "https://docs.google.com/spreadsheets/d/" + SPREADSHEET_ID + "/edit";

// รายชื่อสำหรับคำนวณหารค่าใช้จ่าย แก้ไขได้จากหลังบ้าน Apps Script
var PARTICIPANT_NAMES = [];
var NON_ALCOHOL_PARTICIPANTS = [];

// ถ้ามีคนมาไม่ครบทุกวัน ให้ระบุรายชื่อของวันนั้น เช่น
// var DAILY_PARTICIPANTS = { "2026-06-01": ['ปุ๋ย + แอม'], "2026-06-02": PARTICIPANT_NAMES };
var DAILY_PARTICIPANTS = {};
var SPLIT_CONFIG_KEY = "chillout_split_config_v2";

/**
 * ฟังก์ชันหลักที่ทำงานเมื่อเปิดลิงก์เว็บแอปผ่านบราวเซอร์ (GET Request)
 */
function doGet(e) {
  // ป้องกัน Error จากการเผลอกดปุ่ม "Run/เรียกใช้" ในหน้าต่างสคริปต์กูเกิลโดยตรง
  if (!e || !e.parameter) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family: sans-serif; padding: 30px; color: #2c3e35; text-align: center; background-color: #f7faf8; border-radius: 16px; margin: 40px auto; max-width: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); border: 1px solid #e2efe9;'>" +
      "<h2 style='color: #609975;'>⛺ แอปบันทึกค่าใช้จ่าย Chill Out ทำงานปกติ</h2>" +
      "<p style='color: #556b5e; line-height: 1.6;'>แอปพลิเคชันนี้ติดตั้งและทำงานได้อย่างสมบูรณ์แบบแล้วครับ!</p>" +
      "<p style='color: #889f92; font-size: 0.9rem;'><b>คำแนะนำ:</b> กรุณาเข้าใช้งานผ่าน <b>URL ของเว็บแอป (Web app URL)</b> ที่คุณได้รับจากการสร้างเวอร์ชันใช้งานจริง (Deploy) แทนการกดปุ่ม 'Run/เรียกใช้' ในหน้านี้โดยตรงครับ</p>" +
      "</div>"
    );
  }

  // หากมีพารามิเตอร์ callback หรือ action=getData แปลว่าหน้าเว็บแอปกำลังส่งขอข้อมูลสถิติ
  if (e.parameter.action === "sheetLink") {
    return getSheetLink(e);
  }

  if (e.parameter.action === "getSplitConfig") {
    return getSplitConfig(e);
  }

  if (e.parameter.action === "saveSplitConfig") {
    return saveSplitConfig(e);
  }

  if (e.parameter.callback || e.parameter.action === "getData") {
    return getDashboardData(e);
  }
  
  // มิฉะนั้น ให้เสิร์ฟหน้าเว็บแอป (index.html) ส่งกลับไปเปิดใช้งานบนจอผู้ใช้โดยตรง
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Chill Out Expense Tracker')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no');
}

/**
 * ฟังก์ชันหลักที่ทำงานเมื่อหน้าเว็บส่งบันทึกฟอร์มเข้ามา (POST Request)
 */
function doPost(e) {
  var result = {};
  
  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("ไม่พบข้อมูลที่ส่งเข้ามา (No post data received)");
    }
    
    var data = JSON.parse(e.postData.contents);
    
    var date = data.date;
    var payer = data.payer;
    var category = data.category;
    var details = data.details;
    var amount = data.amount;
    var remarks = data.remarks || "-";
    var imageBase64 = data.image; // ข้อมูลรูปภาพ base64 (หากมี)
    var imageName = data.imageName || ("receipt_" + new Date().getTime() + ".jpg");
    
    if (!date || !payer || !category || !details || !amount) {
      throw new Error("ข้อมูลไม่ครบถ้วน กรุณากรอกหัวข้อที่จำเป็นให้ครบ");
    }
    
    // จัดการอัปโหลดใบเสร็จลง Google Drive
    var receiptUrl = "ไม่ได้แนบรูปภาพ";
    
    if (imageBase64 && imageBase64.indexOf("base64,") > -1) {
      var folderName = "Chill Out Receipts";
      var folders = DriveApp.getFoldersByName(folderName);
      var folder;
      
      if (folders.hasNext()) {
        folder = folders.next();
      } else {
        folder = DriveApp.createFolder(folderName);
      }
      
      var contentType = imageBase64.split(",")[0].split(":")[1].split(";")[0];
      var base64Data = imageBase64.split(",")[1];
      var decodedBlob = Utilities.newBlob(Utilities.base64Decode(base64Data), contentType, imageName);
      
      var file = folder.createFile(decodedBlob);
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      
      receiptUrl = file.getUrl();
    }
    
    // เปิด Google Sheet เพื่อเขียนข้อมูลแถวใหม่
    var spreadsheet;
    var sheet;
    
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = spreadsheet.getSheets()[0];
    } catch(sheetError) {
      throw new Error("ไม่สามารถเปิด Google Sheet ตาม ID ที่กำหนดได้ กรุณาตรวจสอบ ID หรือสิทธิ์แชร์สเปรดชีต");
    }
    
    // หากเป็นชีตเปล่าไม่มีการเขียนมาก่อน ให้เพิ่มหัวข้อก่อน
    if (sheet.getLastRow() === 0) {
      var headers = [
        "วัน-เวลาที่บันทึกข้อมูล (Timestamp)", 
        "1. ณ. วันที่ใช้จ่าย", 
        "2. รายชื่อผู้จ่าย", 
        "3. ประเภทค่าใช้จ่าย", 
        "4. ระบุ (ประเภทค่าใช้จ่าย)", 
        "5. ยอดค่าใช้จ่าย (บาท)", 
        "6. หมายเหตุ", 
        "7. ลิงก์รูปภาพใบเสร็จ"
      ];
      sheet.appendRow(headers);
      
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#E2EFE9");
      headerRange.setHorizontalAlignment("center");
      sheet.setFrozenRows(1);
    }
    
    // บันทึกค่าลงชีต
    var timestamp = new Date();
    var newRow = [
      timestamp,
      date,
      payer,
      category,
      details,
      Number(amount),
      remarks,
      receiptUrl
    ];
    
    sheet.appendRow(newRow);
    
    // จัดรูปแบบฟอร์แมตช่องเงิน
    var lastRow = sheet.getLastRow();
    var amountCell = sheet.getRange(lastRow, 6);
    amountCell.setNumberFormat("#,##0.00");
    
    result = {
      status: "success",
      message: "บันทึกข้อมูลและใบเสร็จลงชีตสำเร็จ!",
      rowAdded: lastRow
    };
    
  } catch(error) {
    result = {
      status: "error",
      message: error.toString()
    };
  }
  
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function createApiResponse(e, result) {
  var callback = (e && e.parameter) ? e.parameter.callback : null;
  if (callback) {
    var callbackName = String(callback).replace(/[^\w.$]/g, "");
    return ContentService.createTextOutput(callbackName + "(" + JSON.stringify(result) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function normalizeSplitConfig(config) {
  var source = config && typeof config === "object" ? config : {};
  var rawPeople = Array.isArray(source.people) ? source.people : [];
  var rawNonDrinkers = Array.isArray(source.nonDrinkers) ? source.nonDrinkers : NON_ALCOHOL_PARTICIPANTS;
  var people = [];
  var nonDrinkers = [];

  rawPeople.forEach(function(name) {
    var cleanName = String(name || "").trim();
    if (cleanName && people.indexOf(cleanName) === -1) {
      people.push(cleanName);
    }
  });

  rawNonDrinkers.forEach(function(name) {
    var cleanName = String(name || "").trim();
    if (cleanName && people.indexOf(cleanName) !== -1 && nonDrinkers.indexOf(cleanName) === -1) {
      nonDrinkers.push(cleanName);
    }
  });

  return {
    people: people,
    nonDrinkers: nonDrinkers
  };
}

function getStoredSplitConfig() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(SPLIT_CONFIG_KEY);
  if (!raw) {
    return normalizeSplitConfig({ people: [], nonDrinkers: [] });
  }
  try {
    return normalizeSplitConfig(JSON.parse(raw));
  } catch (error) {
    return normalizeSplitConfig({ people: [], nonDrinkers: [] });
  }
}

function getSplitConfig(e) {
  return createApiResponse(e, {
    status: "success",
    config: getStoredSplitConfig()
  });
}

function saveSplitConfig(e) {
  var result;
  try {
    var payload = e && e.parameter ? JSON.parse(e.parameter.payload || "{}") : {};
    var config = normalizeSplitConfig(payload);
    PropertiesService.getScriptProperties().setProperty(SPLIT_CONFIG_KEY, JSON.stringify(config));
    result = { status: "success", config: config };
  } catch (error) {
    result = { status: "error", message: error.toString() };
  }
  return createApiResponse(e, result);
}
function getSheetLink(e) {
  var result;
  var password = e && e.parameter ? e.parameter.password : "";
  if (password === "Admin1234") {
    result = { status: "success", url: SHEET_URL };
  } else {
    result = { status: "error", message: "รหัสผ่านไม่ถูกต้อง" };
  }

  var callback = (e && e.parameter) ? e.parameter.callback : null;
  if (callback) {
    return ContentService.createTextOutput(callback + "(" + JSON.stringify(result) + ");")
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatExpenseDate(value) {
  if (value instanceof Date) {
    var y = value.getFullYear();
    var m = String(value.getMonth() + 1).padStart(2, '0');
    var d = String(value.getDate()).padStart(2, '0');
    return y + "-" + m + "-" + d;
  }
  return String(value || "");
}

function isAlcoholCategory(category) {
  var text = String(category || "");
  return text.indexOf("แอลกอฮอล์") > -1 && text.indexOf("ไม่มีแอลกอฮอล์") === -1;
}

function uniqueNames(names) {
  var seen = {};
  var result = [];
  for (var i = 0; i < names.length; i++) {
    var name = String(names[i] || "").trim();
    if (!name || seen[name]) continue;
    seen[name] = true;
    result.push(name);
  }
  return result;
}

function getParticipantsForDate(date, rows, participantNames) {
  var base = (DAILY_PARTICIPANTS[date] && DAILY_PARTICIPANTS[date].length)
    ? DAILY_PARTICIPANTS[date]
    : participantNames;
  var names = base.slice();
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].payer) names.push(rows[i].payer);
  }
  return uniqueNames(names);
}

function buildSettlementPlan(people) {
  var debtors = [];
  var creditors = [];
  for (var i = 0; i < people.length; i++) {
    var balance = Math.round(people[i].balance * 100) / 100;
    if (balance < -0.01) debtors.push({ name: people[i].name, amount: Math.abs(balance) });
    if (balance > 0.01) creditors.push({ name: people[i].name, amount: balance });
  }

  debtors.sort(function(a, b) { return b.amount - a.amount; });
  creditors.sort(function(a, b) { return b.amount - a.amount; });

  var settlements = [];
  var d = 0;
  var c = 0;
  while (d < debtors.length && c < creditors.length) {
    var amount = Math.min(debtors[d].amount, creditors[c].amount);
    amount = Math.round(amount * 100) / 100;
    if (amount > 0.01) {
      settlements.push({ from: debtors[d].name, to: creditors[c].name, amount: amount });
    }
    debtors[d].amount = Math.round((debtors[d].amount - amount) * 100) / 100;
    creditors[c].amount = Math.round((creditors[c].amount - amount) * 100) / 100;
    if (debtors[d].amount <= 0.01) d++;
    if (creditors[c].amount <= 0.01) c++;
  }
  return settlements;
}
function calculateSplitSummary(rows, splitConfig) {
  var config = normalizeSplitConfig(splitConfig || getStoredSplitConfig());
  var participantNames = config.people;
  var nonAlcoholParticipants = config.nonDrinkers;
  var byDate = {};
  var totals = {};
  var nonAlcoholMap = {};
  for (var n = 0; n < nonAlcoholParticipants.length; n++) {
    nonAlcoholMap[nonAlcoholParticipants[n]] = true;
  }

  for (var i = 0; i < rows.length; i++) {
    var row = rows[i];
    if (!byDate[row.date]) byDate[row.date] = [];
    byDate[row.date].push(row);
    if (!totals[row.payer]) totals[row.payer] = { paid: 0, share: 0, balance: 0 };
    totals[row.payer].paid += row.amount;
  }

  var dates = Object.keys(byDate).sort();
  var days = [];
  for (var d = 0; d < dates.length; d++) {
    var date = dates[d];
    var dayRows = byDate[date];
    var participants = getParticipantsForDate(date, dayRows, participantNames);
    var dayTotal = 0;
    var alcoholTotal = 0;
    var regularTotal = 0;
    var shares = {};

    for (var p = 0; p < participants.length; p++) {
      shares[participants[p]] = 0;
      if (!totals[participants[p]]) totals[participants[p]] = { paid: 0, share: 0, balance: 0 };
    }

    for (var r = 0; r < dayRows.length; r++) {
      var expense = dayRows[r];
      dayTotal += expense.amount;
      var alcoholExpense = isAlcoholCategory(expense.category);
      if (alcoholExpense) alcoholTotal += expense.amount;
      else regularTotal += expense.amount;

      var splitMembers = participants.slice();
      if (alcoholExpense) {
        splitMembers = splitMembers.filter(function(name) { return !nonAlcoholMap[name]; });
      }
      if (!splitMembers.length) splitMembers = participants.slice();
      var each = splitMembers.length ? expense.amount / splitMembers.length : 0;
      for (var s = 0; s < splitMembers.length; s++) {
        shares[splitMembers[s]] = (shares[splitMembers[s]] || 0) + each;
        if (!totals[splitMembers[s]]) totals[splitMembers[s]] = { paid: 0, share: 0, balance: 0 };
        totals[splitMembers[s]].share += each;
      }
    }

    days.push({ date: date, participants: participants, total: dayTotal, regularTotal: regularTotal, alcoholTotal: alcoholTotal, shares: shares });
  }

  var names = Object.keys(totals).sort();
  var people = [];
  for (var x = 0; x < names.length; x++) {
    var person = totals[names[x]];
    person.balance = person.paid - person.share;
    people.push({ name: names[x], paid: person.paid, share: person.share, balance: person.balance });
  }

  return { participants: participantNames, nonAlcoholParticipants: nonAlcoholParticipants, days: days, people: people, settlements: buildSettlementPlan(people) };
}

/**
 * ฟังก์ชันสแกนชีตเพื่อวิเคราะห์ข้อมูลแสดงบน Dashboard แบบเรียลไทม์
 */
function getDashboardData(e) {
  var result = {};
  
  try {
    var spreadsheet;
    var sheet;
    
    try {
      spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
      sheet = spreadsheet.getSheets()[0];
    } catch(sheetError) {
      throw new Error("ไม่สามารถเข้าถึงตารางชีตได้เพื่อวิเคราะห์สรุปยอด");
    }
    
    var lastRow = sheet.getLastRow();
    
    var totalAmount = 0;
    var byCategory = {};
    var byPayer = {};
    var recentTransactions = [];
    var expenseRows = [];
    var splitConfig = getStoredSplitConfig();
    
    if (lastRow > 1) {
      var range = sheet.getRange(2, 1, lastRow - 1, 8);
      var values = range.getValues();
      
      for (var i = 0; i < values.length; i++) {
        var row = values[i];
        var payer = row[2];
        var category = row[3];
        var amount = Number(row[5]);
        var expenseDate = formatExpenseDate(row[1]);
        
        if (isNaN(amount) || amount <= 0) continue;
        
        expenseRows.push({
          date: expenseDate,
          payer: payer,
          category: category,
          details: row[4],
          amount: amount,
          remarks: row[6]
        });
        
        totalAmount += amount;
        
        if (category) {
          byCategory[category] = (byCategory[category] || 0) + amount;
        }
        
        if (payer) {
          byPayer[payer] = (byPayer[payer] || 0) + amount;
        }
      }
      
      // เลือกข้อมูลล่าสุด 10 รายการย้อนหลัง
      var startIndex = Math.max(0, values.length - 10);
      for (var j = values.length - 1; j >= startIndex; j--) {
        var r = values[j];
        
        var formattedDate = formatExpenseDate(r[1]);
        
        recentTransactions.push({
          date: formattedDate,
          payer: r[2],
          category: r[3],
          details: r[4],
          amount: Number(r[5]),
          remarks: r[6],
          imageUrl: r[7]
        });
      }
    }
    
    result = {
      status: "success",
      total: totalAmount,
      byCategory: byCategory,
      byPayer: byPayer,
      sheetUrl: SHEET_URL,
      splitConfig: splitConfig,
      splitSummary: calculateSplitSummary(expenseRows, splitConfig),
      allExpenses: expenseRows,
      recent: recentTransactions
    };
    
  } catch(error) {
    result = {
      status: "error",
      message: error.toString()
    };
  }
  return createApiResponse(e, result);
}
