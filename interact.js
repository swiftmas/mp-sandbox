///// Exports ///////////////////////////
module.exports = {
  startDialog: function (interacter) {
    startDialog(interacter);
  },
  getDialog: function (interacter, path) {
    getDialog(interacter, path);
  },
  getUI: function (interacter, path) {
    getUI(interacter, path);
  },
  showCharacter: function (interacter) {
    showCharacter(interacter);
  }
};
//// Basically this is a mess and has a long way to go. I wanna have one feeding function do a bunch of commands based on a path given. Basically making it an api call. There are three ways to start:
// Client feeds just the interacters ID and the closest target is interacted with resulting in Speech or Looting,
// Client feeds back the interacter ID and a path denoting which specific dialog or loot action to perform( such as a speech tree or to perform a loot swap command)
// Client toggles the user inventory character pane. This is a special deal i may revise. it got its own function cause its a differnt keypress but it complicates things so this may change.

function getDialog(interacter, path){
  var verbageOptions = globals.dialogdb[path[0]][path[1]].textVariations.length - 1;
  var verbage = globals.dialogdb[path[0]][path[1]].textVariations[Math.round(Math.random() * verbageOptions)];
  var pointers = globals.dialogdb[path[0]][path[1]].pointers;
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["speech", verbage, pointers]);
}

function getUI(interacter, path){
  if (path[0] == "swap"){
    console.log("swapping path: " + path)
    //item1
    if (path[1] == "none"){ db1 = coredata } else { db1 = coredata.chunks[path[1]]}
    if (db1[path[2]][path[3]].inventory[path[4]] !== void 0){
      var item1 = db1[path[2]][path[3]].inventory[path[4]].name;
      var item1Quant = db1[path[2]][path[3]].inventory[path[4]].quantity;
    } else {
      //Create actual record for any empty spaces
      var item1 = "-"
      var item1Quant = 1
      for (var newi = db1[path[2]][path[3]].inventory.length; newi < 10; newi++){
        db1[path[2]][path[3]].inventory.push({"name": item1, "quantity": item1Quant})
      }
    }
    console.log(item1, item1Quant)
    //item2
    if (path[5] == "none"){ db2 = coredata } else { db2 = coredata.chunks[path[5]]}
    if (db2[path[6]][path[7]].inventory[path[8]] !== void 0){
      var item2 = db2[path[6]][path[7]].inventory[path[8]].name;
      var item2Quant = db2[path[6]][path[7]].inventory[path[8]].quantity;
    } else {
      //Create actual record for empty spaces
      var item2 = "-"
      var item2Quant = 1
      for (var newi = db2[path[6]][path[7]].inventory.length; newi < 10; newi++){
        db2[path[6]][path[7]].inventory.push({"name": item2, "quantity": item2Quant})
      }
    }
    console.log(item2, item2Quant)

    if (item1 == item2 && item1 !== "-"){
      if (path[3] == path[7] && path[4] == path[8]){
        var consumable = db1[path[2]][path[3]].inventory[path[4]].name
        if ( ["mana","gold","health"].indexOf(consumable.split(" ")[0]) > -1 ){
          switch (consumable.split(" ")[0]) {
            case "mana":
              coredata["players"][interacter]["mana"] += globals.weaponData[consumable].releaseDamage
              if (coredata["players"][interacter]["mana"] >= coredata["players"][interacter]["maxMana"]){ coredata["players"][interacter]["mana"] = coredata["players"][interacter]["maxMana"]}
              if (db1[path[2]][path[3]].inventory[path[4]].quantity > 1){
                db1[path[2]][path[3]].inventory[path[4]].quantity -= 1
              } else {
                db1[path[2]][path[3]].inventory[path[4]].quantity = 1
                db1[path[2]][path[3]].inventory[path[4]].name = "-"
              }
              break;
            case "health":
              coredata["players"][interacter]["health"] += globals.weaponData[consumable].releaseDamage
              if (coredata["players"][interacter]["health"] >= coredata["players"][interacter]["maxHealth"]){ coredata["players"][interacter]["health"] = coredata["players"][interacter]["maxHealth"]}
              if (db1[path[2]][path[3]].inventory[path[4]].quantity > 1){
                db1[path[2]][path[3]].inventory[path[4]].quantity -= 1
              } else {
                db1[path[2]][path[3]].inventory[path[4]].quantity = 1
                db1[path[2]][path[3]].inventory[path[4]].name = "-"
              }              break;
            case "gold":
              coredata["players"][interacter]["gold"] += db1[path[2]][path[3]].inventory[path[4]].quantity
              db1[path[2]][path[3]].inventory[path[4]].quantity = 1
              db1[path[2]][path[3]].inventory[path[4]].name = "-"
              break;
          }
        } else {console.log("cannot swap same item")}
      } else if ( ["mana","gold","health"].indexOf(db1[path[2]][path[3]].inventory[path[4]].name) > -1 ){
        db1[path[2]][path[3]].inventory[path[4]].name = "-"
        db1[path[2]][path[3]].inventory[path[4]].quantity = 1
        db2[path[6]][path[7]].inventory[path[8]].quantity += item1Quant
      }
    } else if ( item1 == "-" && item2Quant > 1 ){
      db1[path[2]][path[3]].inventory[path[4]].name = item2
      db1[path[2]][path[3]].inventory[path[4]].quantity = 1
      db2[path[6]][path[7]].inventory[path[8]].quantity -= 1
    } else {
      //SwapItem1
      db1[path[2]][path[3]].inventory[path[4]].name = item2
      db1[path[2]][path[3]].inventory[path[4]].quantity = item2Quant

      //SwapItem2
      db2[path[6]][path[7]].inventory[path[8]].name = item1
      db2[path[6]][path[7]].inventory[path[8]].quantity = item1Quant
    }
    //Go to start
    startDialog(interacter)
    return;
  }
  if (path[0] == "characterInteract"){
    console.log("swapping path: " + path)

/// Create empty spaces for anything thats not there in the full inventory space
    //item1 --------------------------------------------------------------------------
    var db1
    if (coredata[path[2]][path[3]][path[5]][path[4]] !== void 0){
      db1 = coredata[path[2]][path[3]][path[5]];
      console.log(db1[path[4]])
    } else {
      //Create actual record for any empty slots
      db1 = coredata[path[2]][path[3]][path[5]];
      for (var newi = db1.length; newi < 10; newi++){
        db1.push({"name": "-", "quantity": 1})
      }
    }
    //item2 -------------------------------------------------------------------------
    var db2
    if (coredata[path[7]][path[8]][path[10]][path[9]] !== void 0){
      db2 = coredata[path[7]][path[8]][path[10]];
      console.log(db2[path[9]])
    } else {
      //Create actual record for any empty slots
      db2 = coredata[path[7]][path[8]][path[10]];
      for (var newi = db2.length; newi < 10; newi++){
        db2.push({"name": "-", "quantity": 1})
      }
    }
    //---------------------------------------------------
    if (path[5] == "inventory" && path[10] == "inventory"){
      if (db1[path[4]].name == db2[path[9]].name && db1[path[4]].name !== "-"){
        if (path[3] == path[8] && path[4] == path[9]){
          var consumable = db1[path[4]].name
          if ( ["mana","gold","health"].indexOf(consumable.split(" ")[0]) > -1 ){
            switch (consumable.split(" ")[0]) {
              case "mana":
                coredata["players"][interacter]["mana"] += globals.weaponData[consumable].releaseDamage
                if (coredata["players"][interacter]["mana"] >= coredata["players"][interacter]["maxMana"]){ coredata["players"][interacter]["mana"] = coredata["players"][interacter]["maxMana"]}
                if (db1[path[4]].quantity > 1){
                  db1[path[4]].quantity -= 1
                } else {
                  db1[path[4]].quantity = 1
                  db1[path[4]].name = "-"
                }
                break;
              case "health":
                coredata["players"][interacter]["health"] += globals.weaponData[consumable].releaseDamage
                if (coredata["players"][interacter]["mana"] >= coredata["players"][interacter]["maxMana"]){ coredata["players"][interacter]["mana"] = coredata["players"][interacter]["maxMana"]}
                if (db1[path[4]].quantity > 1){
                  db1[path[4]].quantity -= 1
                } else {
                  db1[path[4]].quantity = 1
                  db1[path[4]].name = "-"
                }
                break;
              case "gold":
                coredata[path[2]][path[3]]["gold"] += db1[path[4]].quantity
                db1[path[4]].quantity = 1
                db1[path[4]].name = "-"
                break;
            }
          } else {console.log("cannot swap same item")}
        } else if ( ["mana","gold","health"].indexOf(db1[path[4]].name) > -1 ){
          db2[path[9]].quantity += db1[path[4]].quantity
          db1[path[4]].name = "-"
          db1[path[4]].quantity = 1
        }
      } else if (db1[path[4]].name == "-" && db2[path[9]].quantity > 1){
        db1[path[4]].name = db2[path[9]].name
        db1[path[4]].quantity = 1
        db2[path[9]].quantity -= 1
      } else {
        var item1 = db1[path[4]].name
        var item1Quant = db1[path[4]].quantity
        var item2 = db1[path[9]].name
        var item2Quant = db1[path[9]].quantity

        db1[path[4]].name = item2
        db1[path[4]].quantity = item2Quant
        db2[path[9]].name = item1
        db2[path[9]].quantity = item1Quant
      }
    } else if (path[5] == "abilities" && path[10] == "abilities") {
       var item1 = db1[path[4]].name
       var item2 = db2[path[9]].name
       db1[path[4]].name = item2
       db2[path[9]].name = item1
    }  else if (path[5] == "abilities" && path[10] == "inventory") {
       var item1 = db1[path[4]].name
       var item2 = db2[path[9]].name
       db1[path[4]].name = item2
       db2[path[9]].name = item1
    } else if (path[5] == "inventory" && path[10] == "abilities" && globals.weaponData[db1[path[4]].name].type == "skl") {
       var item1 = db1[path[4]].name
       var item2 = db2[path[9]].name
       db1[path[4]].name = item2
       db2[path[9]].name = item1
    }
    //Go to start
    showCharacter(interacter)
    return;
  }
}

function showLoot(interacter, name, chunk, nameType){
  db = coredata.chunks[chunk]
  var verbage = []
  var thing = db[nameType][name];
  var person = coredata.players[interacter];
  var pointers = []
  //console.log(thing,Object.keys(thing.inventory).length)
  for (var i = 0; i < thing.inventory.length; i++){
    var weapon =  globals.weaponData[thing.inventory[i].name]
    if (weapon.hasOwnProperty("chargeDamage") == false){ wpndmg = "" } else {wpndmg = Math.abs(weapon.chargeDamage + weapon.releaseDamage + weapon.projectileDamage + (weapon.chargeDamageMultiplier*weapon.chargeMinimum))}
    verbage.push([thing.inventory[i].name, thing.inventory[i].quantity, weapon.sprite, weapon.description, weapon.cooldown + weapon.chargeMinimum, weapon.type, wpndmg])
    pointers.push([chunk,nameType,name,i])
  }
  for (var i = verbage.length; i < 10; i++){
    verbage.push(["-","1","10.8.1.0.0","Empty","","",""])
    pointers.push([chunk,nameType,name,i])
  }
  for (var i = 0; i < person.inventory.length; i++){
    var weapon =  globals.weaponData[person.inventory[i].name]
    if (weapon.hasOwnProperty("chargeDamage") == false){ wpndmg = "" } else {wpndmg = Math.abs(weapon.chargeDamage + weapon.releaseDamage + weapon.projectileDamage + (weapon.chargeDamageMultiplier*weapon.chargeMinimum))}
    verbage.push([person.inventory[i].name, person.inventory[i].quantity, weapon.sprite, weapon.description, weapon.cooldown + weapon.chargeMinimum, weapon.type, wpndmg])
    pointers.push(["none","players",interacter,i])
  }
  for (var i = verbage.length; i < 20; i++){
    verbage.push(["-","1","10.8.1.0.0","Empty","","",""])
    pointers.push(["none","players",interacter,i - 10])
  }
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["loot", verbage, pointers]);
  //console.log(verbage)
}

function showCharacter(interacter){
  var verbage = []
  var person = coredata.players[interacter];
  var pointers = []
  // List Available abilities
  for (var i = 0; i < person.abilities.length; i++){
    var weapon =  globals.weaponData[person.abilities[i].name]
    if (weapon.hasOwnProperty("chargeDamage") == false){ wpndmg = "" } else {wpndmg = Math.abs(weapon.chargeDamage + weapon.releaseDamage + weapon.projectileDamage + (weapon.chargeDamageMultiplier*weapon.chargeMinimum))}
    verbage.push([person.abilities[i].name, 1, weapon.sprite, weapon.description, weapon.cooldown + weapon.chargeMinimum, weapon.type, wpndmg])
    pointers.push(["none","players",interacter,i,"abilities"])
  }
  // Fill in blank space
  for (var i = verbage.length; i < 10; i++){
    verbage.push(["-","1","10.8.1.0.0","Empty","","",""])
    pointers.push(["none","players",interacter,i,"abilities"])
  }
  for (var i = 0; i < person.inventory.length; i++){
    var weapon =  globals.weaponData[person.inventory[i].name]
    if (weapon.hasOwnProperty("chargeDamage") == false){ wpndmg = "" } else {wpndmg = Math.abs(weapon.chargeDamage + weapon.releaseDamage + weapon.projectileDamage + (weapon.chargeDamageMultiplier*weapon.chargeMinimum))}
    verbage.push([person.inventory[i].name, person.inventory[i].quantity, weapon.sprite, weapon.description, weapon.cooldown + weapon.chargeMinimum, weapon.type, wpndmg])
    pointers.push(["none","players",interacter,i,"inventory"])
  }
  for (var i = verbage.length; i < 20; i++){
    verbage.push(["-","1","10.8.1.0.0","Empty","","",""])
    pointers.push(["none","players",interacter,i - 10, "inventory"])
  }
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["character", verbage, pointers]);
  //console.log(verbage)
}

function showGrave(interacter, name, chunk, nameType){
  var verbage = ["You have bound","yourself to this grave.",". . . ","You will respawn here","If you die."]
  var pointers = ["exit"];
  listener.sockets.connected[interacter.slice(1)].emit('dialog', ["speech", verbage, pointers]);
  db[nameType][name].state = 67;
  coredata.players[interacter].health = coredata.players[interacter].maxHealth;
  var newpos = db[nameType][name].pos.split(".")[0] + "." + (parseInt(db[nameType][name].pos.split(".")[1]) + 6);
  coredata.players[interacter].origin = newpos;
}

function startDialog(interacter){
  var distance = 4;
  var player = coredata.players[interacter]
  var interacterTeam = player.team;
  var direction = player.dir;
  var atpos = player.pos.split(".");
  var at
  switch(direction){
    case "2":
      atpos[1] = parseInt(atpos[1]) - distance
      at = {"h": 6, "w": 6}
      break;
    case "6":
      atpos[1] = parseInt(atpos[1]) + distance
      at = {"h": 6, "w": 6}
      break;
    case "4":
      at = {"h": 6, "w": 6}
      atpos[0] = parseInt(atpos[0]) + distance
      break;
    case "8":
      atpos[0] = parseInt(atpos[0]) - distance
      at = {"h": 6, "w": 6}
      break;
  }
  atpos = atpos.join(".");
  general.Collission(atpos, at.w, at.h, function(result){
    for (hit in result[1]){
      var name = result[1][hit][0]
      var chunk = result[1][hit][1]
      var nameType = result[1][hit][2]
      if (chunk == "none"){ continue } else { db = coredata.chunks[chunk]}
      if (nameType == "colliders"){continue;};
      if (db[nameType][name].hasOwnProperty("singleMessage")){ getDialog(interacter, [db[nameType][name].properName, db[nameType][name].singleMessage]) };
      if (nameType == "entities" && db[nameType][name].hasOwnProperty("grave")){
        showGrave(interacter, name, chunk, nameType)
        moveQueue[interacter] = [interacter, null];
        break;
      }
      if (nameType == "entities" && db[nameType][name].hasOwnProperty("inventory")){
        if (db[nameType][name].state < 60){db[nameType][name].state = 67}
        showLoot(interacter, name, chunk, nameType)
        moveQueue[interacter] = [interacter, null];
        break;
      } else if (nameType == "entities"){ console.log("nothing to interact with");continue;};
      if (db[nameType][name].state >= 60 ){
        showLoot(interacter, name, chunk, nameType)
        break;
      }
      if (db[nameType][name].hasOwnProperty("team")){
        if (db[nameType][name].hasOwnProperty("properName")){
          getDialog(interacter, [db[nameType][name].properName, "start"])
          console.log("GetSpeachWith", name, db[nameType][name].properName)
        } else if (db[nameType][name].team == interacterTeam) {
          getDialog(interacter, ["TeamStandard", "start"])
          console.log("GetSpeachWith", name)
        }else{
          getDialog(interacter, ["NonTeamStandard", "start"])
          console.log("GetSpeachWith", name)
        }
      };
    };
  });
};
