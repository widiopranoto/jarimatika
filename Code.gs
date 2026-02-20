function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000); // Wait up to 10 seconds for other processes to finish

  try {
    var sheetUrl = "https://docs.google.com/spreadsheets/d/1BBhLf8ZFPASNXVuajFhIH95ztipLT1ngANhVZkl_auY/edit?usp=sharing";
    var ss = SpreadsheetApp.openByUrl(sheetUrl);
    var sheet = ss.getSheets()[0]; // Use the first sheet

    // Ensure headers exist
    var headers = ["timestamp", "username", "level", "xp", "score", "lastupdated"];
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var username = data.username;
    var timestamp = new Date();

    if (!username) {
      return response({status: "error", message: "Username is required"});
    }

    // Find user row
    var lastRow = sheet.getLastRow();
    var userRowIndex = -1;
    var values = [];

    if (lastRow > 1) {
      values = sheet.getRange(2, 2, lastRow - 1, 1).getValues(); // Column B (Username)
      for (var i = 0; i < values.length; i++) {
        if (values[i][0] == username) {
          userRowIndex = i + 2; // +2 because of header and 0-based index
          break;
        }
      }
    }

    if (action === "login") {
      if (userRowIndex === -1) {
        // Create new user
        var defaultLevel = JSON.stringify({add: 1, sub: 1, mul: 1, div: 1});
        sheet.appendRow([timestamp, username, defaultLevel, 0, 0, timestamp]);
        return response({
          status: "success",
          data: {
            username: username,
            level: JSON.parse(defaultLevel),
            xp: 0,
            score: 0
          }
        });
      } else {
        // Return existing user data
        var userData = sheet.getRange(userRowIndex, 1, 1, 6).getValues()[0];
        // Parse level if it's a string, otherwise use it directly
        var levelData = userData[2];
        try {
            if (typeof levelData === 'string') levelData = JSON.parse(levelData);
        } catch(e) {
            levelData = {add: 1, sub: 1, mul: 1, div: 1}; // Fallback
        }

        return response({
          status: "success",
          data: {
            username: userData[1],
            level: levelData,
            xp: userData[3],
            score: userData[4]
          }
        });
      }
    } else if (action === "update") {
      if (userRowIndex === -1) {
        return response({status: "error", message: "User not found"});
      }

      // Update fields if provided
      // Columns: 1=Time, 2=User, 3=Level, 4=XP, 5=Score, 6=LastUpdate

      if (data.level) sheet.getRange(userRowIndex, 3).setValue(JSON.stringify(data.level));
      if (data.xp !== undefined) sheet.getRange(userRowIndex, 4).setValue(data.xp);
      if (data.score !== undefined) sheet.getRange(userRowIndex, 5).setValue(data.score);

      sheet.getRange(userRowIndex, 6).setValue(timestamp); // Update LastUpdated

      return response({status: "success", message: "Progress saved"});
    }

  } catch (error) {
    return response({status: "error", message: error.toString()});
  } finally {
    lock.releaseLock();
  }
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}

function setup() {
  // Helper function to setup the sheet if needed manually
  var sheetUrl = "https://docs.google.com/spreadsheets/d/1BBhLf8ZFPASNXVuajFhIH95ztipLT1ngANhVZkl_auY/edit?usp=sharing";
  var ss = SpreadsheetApp.openByUrl(sheetUrl);
  var sheet = ss.getSheets()[0];
  var headers = ["timestamp", "username", "level", "xp", "score", "lastupdated"];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}
