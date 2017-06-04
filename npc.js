var globals = require('./globals.js');
var combat = require('./combat.js');
var coredata = globals.coredata;
var collmap = globals.collmap;
var general = require('./general.js');

///// Exports ///////////////////////////
module.exports = {
    npccontroller: function () {
        npccontroller();
    }
    , alerttimedown: function () {
        alerttimedown();
    }
};
///// Controllers ///////
function npccontroller() {
  for (var chunk in coredata.chunks){
    var cdn = coredata.chunks[chunk].npcs

        //// Dead Cleanup
    npcLoop:
    for (var npc in cdn) {
        if (cdn.hasOwnProperty(npc)) {
            for (var nearbyChunk in coredata.chunks){
              var surroundings = [chunk, 64];
              general.getDist(cdn[npc].pos, nearbyChunk, function(result){
                if (result[0] < surroundings[1]) {
                  surroundings = [nearbyChunk, result[0]];
                }
              });

            }
            if (surroundings[0] !== chunk){
              coredata.chunks[surroundings[0]].npcs[npc]=JSON.parse(JSON.stringify(cdn[npc]))
              delete cdn[npc];
              break npcLoop;
            }

            if (cdn[npc].state > 60) {
              if (cdn[npc].respawn <= 0){
                console.log("dead at ", cdn[npc].pos)
                cdn[npc].pos = cdn[npc].origin;
                console.log("spawn at ", cdn[npc].pos)
                cdn[npc].state = "000";
                cdn[npc].health = 100;
                cdn[npc].respawn = 200;
                if (cdn[npc].chunk !== chunk){
                  console.log(cdn[npc])
                  coredata.chunks[cdn[npc].chunk].npcs[npc]=JSON.parse(JSON.stringify(cdn[npc]))
                  delete cdn[npc];
                  break npcLoop;
                }
              }
              cdn[npc].respawn -= 1;
            };
        };
    };
    //// Normal Living
    for (var npc in cdn) {
        if (cdn.hasOwnProperty(npc)) {
            /////////////////////////////IF NORMAL///////////////
            if (cdn[npc].state == "000") {
                alertrange(npc, chunk, 25);
                var closetarget = getSurroundings(npc, chunk, 25);
                if (closetarget.length > 1 && closetarget[1] > 8) {
                    moveNpcTo(npc, chunk, parseInt(closetarget[2]), parseInt(closetarget[3]));
                }
                else if (closetarget[1] <= 8) {
                    dirToFace = dirToTarget(npc, chunk, parseInt(closetarget[2]), parseInt(closetarget[3]));
                    if (cdn[npc].dir == dirToFace) {
                        combat.attack(npc, chunk);
                    }
                    else {
                        cdn[npc].dir = dirToFace;
                    };
                } else if (cdn[npc].pos !== cdn[npc].origin){
                    //headhome(npc);
                    var none="none";
                };
            };
        };
    };
  }
};




//// FUNCTIONS ///////////////////
function alerttimedown() {
    var gp = coredata.players
    for (var player in gp) {
        if (gp.hasOwnProperty(player)) {
            if (gp[player].alerttimer > 0) {
                gp[player].alerttimer = parseInt(gp[player].alerttimer) - 1
            };
        };
    };
    for (var chunk in coredata.chunks){
      var gn = coredata.chunks[chunk].npcs;
      for (var npc in gn) {
          if (gn.hasOwnProperty(npc) > 0) {
              if (gn[npc].alerttimer) {
                  gn[npc].alerttimer = parseInt(gn[npc].alerttimer) - 1
              };
          };
      };
    };
};


function alertrange(npc, chunk, dist) {
    cdn = coredata.chunks[chunk].npcs[npc]
    var origin = cdn.pos;
    var dist = parseInt(dist) / 2;
    // in this function we are offsetting the view to the front of the player.
    var trueorig = [parseInt(origin.split(".")[0]), parseInt(origin.split(".")[1])];
    if (cdn.dir == "2") {
        var orig = [trueorig[0], trueorig[1] - dist + 1]
    };
    if (cdn.dir == "6") {
        var orig = [trueorig[0], trueorig[1] + dist - 1]
    };
    if (cdn.dir == "8") {
        var orig = [trueorig[0] - dist + 1, trueorig[1]]
    };
    if (cdn.dir == "4") {
        var orig = [trueorig[0] + dist - 1, trueorig[1]]
    };
    var gp = coredata.players
    for (var player in coredata.players) {
        if (gp.hasOwnProperty(player)) {
            var ppos = [gp[player].pos.split(".")[0], gp[player].pos.split(".")[1]];
            if (ppos[0] > orig[0] - dist && ppos[0] < parseInt(orig[0]) + dist && ppos[1] > orig[1] - dist && ppos[1] < parseInt(orig[1]) + dist && gp[player].team !== cdn.team && gp[player].state < 59) {
                //var cansee = isLineOfSight(trueorig, ppos)
                var cansee = true;
                if (cansee == true){
                    gp[player].alerttimer = 35;
                };
            };
        };
    };
    var gn = coredata.chunks[chunk].npcs;
    for (var npctar in gn) {
        if (gn.hasOwnProperty(npctar)) {
            var ppos = [gn[npctar].pos.split(".")[0], gn[npctar].pos.split(".")[1]];
            if (ppos[0] > orig[0] - dist && ppos[0] < parseInt(orig[0]) + dist && ppos[1] > orig[1] - dist && ppos[1] < parseInt(orig[1]) + dist && gn[npctar].team !== cdn.team && gn[npctar].state < 59) {
                gn[npctar].alerttimer = 35;
            };
        };
    };
};

function headhome(npc){
    console.log("HEAD HOME!")
    tar = coredata.npcs[npc].pos.split(".")
    moveNpcTo(npc, tar[0], tar[1])
};

function isLineOfSight(orig, target) {
    var xx = target[0] - orig[0];
    var yy = target[1] - orig[1];
    var slope = yy / xx;
    var offset = (slope * orig[0] - orig[1]) * -1;
    var cansee = true;
    if (Math.abs(slope) == Infinity) {
        if (yy > 0) {
            for (var i = 0; i < yy; i++) {
                yplus = orig[1] + i;
                if (collmap[orig[0] + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        }
        else {
            for (var i = 0; i > yy; i--) {
                yplus = orig[1] + i;
                if (collmap[orig[0] + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        };
    };
    if (slope == 0) {
        if (xx >= 0) {
            for (var i = 0; i < xx; i++) {
                xplus = orig[0] + i;
                if (collmap[xplus + "." + orig[1]] == 1) {
                    cansee = false;
                };
            };
        }
        else {
            for (var i = 0; i > xx; i--) {
                yplus = orig[0] + i;
                if (collmap[xplus + "." + orig[1]] == 1) {
                    cansee = false;
                };
            };
        };
    };
    if (Math.abs(xx) > Math.abs(yy)) {
        if (xx > 0) {
            for (var i = 0; i < xx; i++) {
                //Get Coords on line between points
                var xplus = orig[0] + i;
                var yplus = Math.floor(slope * xplus + offset);
                if (collmap[xplus + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        };
        if (xx < 0) {
            for (var i = 0; i > xx; i--) {
                //Get Coords on line between points
                var xplus = orig[0] + i;
                var yplus = Math.floor(slope * xplus + offset);
                if (collmap[xplus + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        };
    }
    else {
        if (yy > 0) {
            for (var i = 0; i < yy; i++) {
                //Get Coords on line between points
                var yplus = orig[1] + i;
                var xplus = Math.floor((yplus - offset) / slope);
                if (collmap[xplus + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        };
        if (yy < 0) {
            for (var i = 0; i > yy; i--) {
                //Get Coords on line between points
                var yplus = orig[1] + i;
                var xplus = Math.floor((yplus - offset) / slope);
                if (collmap[xplus + "." + yplus] == 1) {
                    cansee = false;
                };
            };
        };
    };
    //console.log(cansee);
    if (cansee == true) {
        return true;
    }
    else {
        return false;
    };

};


function getSurroundings(npc, chunk, dist) {
    var origin = coredata.chunks[chunk].npcs[npc].pos;
    var dist = parseInt(dist);
    var surroundings = ["none", dist];
    var orig = [origin.split(".")[0], origin.split(".")[1]];
    var gp = coredata.players
    for (var player in coredata.players) {
        if (gp.hasOwnProperty(player) && gp[player].alerttimer > 0 ) {
            var ppos = gp[player].pos;
            var ppsspl = gp[player].pos.split(".")
            general.getDist(origin, ppos, function(result){
              if (result[0] < surroundings[1]) {
                surroundings = [player, result[0], ppsspl[0], ppsspl[1]];
              }
              else if (result[0] == surroundings[1] && Math.floor((Math.random() * 2)) == 1) {
                surroundings = [player, result[0], ppsspl[0], ppsspl[1]];
              };
            });
        };
    };
    var gn = coredata.chunks[chunk].npcs;
    for (var npctar in gn) {
        if (gn.hasOwnProperty(npctar) && npctar !== npc && gn[npctar].alerttimer > 0) {
            var ppos = gn[npctar].pos;
            general.getDist(origin, ppos, function(result){
              if (result[0] < surroundings[1]) {
                surroundings = [npctar, result[0], ppsspl[0], ppsspl[1]];
              }
              else if (result[0] == surroundings[1] && Math.floor((Math.random() * 2)) == 1) {
                surroundings = [npctar, result[0], ppsspl[0], ppsspl[1]];
              };
            });
        };
    };
    if (surroundings[0] == "none") {
        surroundings = [];
    };
    return surroundings;
};

function isspaceclear(coord) {
    var gn = coredata.npcs;
    for (var npc in gn) {
        if (gn.hasOwnProperty(npc)) {
            console.log(gn[npc].pos, coord)
            if (gn[npc].pos == coord) {
                return false
            }
            else {
                return true
            };
        };
    };
};

function moveNpcTo(npc, chunk, tarx, tary) {
    var rate = 2;
    var npcpos = coredata.chunks[chunk].npcs[npc].pos.split(".");
    var npcx = npcpos[0];
    var npcy = npcpos[1];
    var newcoords = [];
    if (npcx > tarx) {
        var newcoord = (parseInt(npcx) - rate) + "." + npcy;
        if ("true" == "true") {
            newcoords[newcoords.length] = new Array(newcoord, "8");
        };
    }
    else if (npcx < tarx) {
        var newcoord = (parseInt(npcx) + rate) + "." + npcy;
        if ("true" == "true") {
            newcoords[newcoords.length] = new Array(newcoord, "4");
        };
    };
    if (npcy > tary) {
        var newcoord = npcx + "." + (parseInt(npcy) - rate);
        if ("true" == "true") {
            newcoords[newcoords.length] = new Array(newcoord, "2");
        };
    }
    else if (npcy < tary) {
        var newcoord = npcx + "." + (parseInt(npcy) + rate);
        if ("true" == "true") {
            newcoords[newcoords.length] = new Array(newcoord, "6");
        };
    };
    if (newcoords.length > 0) {
        var tar = newcoords[Math.floor(Math.random() * newcoords.length)];
        //coredata.npcs[npc].pos = tar[0];
        general.DoMovement(npc, chunk, tar[1], rate, true);
    };
};

function dirToTarget(npc, chunk, tarx, tary) {
    var npcpos = coredata.chunks[chunk].npcs[npc].pos.split(".");
    var npcx = npcpos[0];
    var npcy = npcpos[1];
    if (npcx > tarx) {
        return "8";
    }
    else if (npcx < tarx) {
        return "4";
    }
    else if (npcy > tary) {
        return "2";
    }
    else if (npcy < tary) {
        return "6";
    }
    else {
        return "2";
    };
};
