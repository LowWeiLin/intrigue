
if (detectMobile()) {
  console.log = function(...args) {
    $('#debug').prepend($('<p></p>').text(args.join(' ') + '\n'));
  };
}

var Game = {
  display: null,
  map: {},
  engine: null,
  player: null,
  pedro: null,
  ananas: null,

  init: function() {

    if (detectMobile()) {
      // desktop default: 80 25
      ROT.DEFAULT_WIDTH = 30;
      ROT.DEFAULT_HEIGHT = 35;
    }
    console.log('mobile', detectMobile(), ROT.DEFAULT_WIDTH, ROT.DEFAULT_HEIGHT);

    this.display = new ROT.Display({
      spacing: 1.1
    });
    $('#game').append(this.display.getContainer());

    // prevent accidental selection of page elements
    this.display.getContainer().onselectstart = () => false;

    this._generateMap();

    var scheduler = new ROT.Scheduler.Simple();
    scheduler.add(this.player, true);
    scheduler.add(this.pedro, true);

    this.engine = new ROT.Engine(scheduler);
    this.engine.start();
  },

  _generateMap: function() {
    // width, height, options. defaults to those constants above
    var digger = new ROT.Map.Digger();
    var freeCells = [];

    var digCallback = function(x, y, value) {
      // walls are solid (assuming underground). value is 1 for those
      if (value) {
        return;
      }

      var key = x + "," + y;
      this.map[key] = ".";
      freeCells.push(key);
    }
    digger.create(digCallback.bind(this));

    this._generateBoxes(freeCells);
    this._drawWholeMap();

    this.player = this._createBeing(Player, freeCells);
    this.pedro = this._createBeing(Pedro, freeCells);
  },

  _createBeing: function(what, freeCells) {
    var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
    var key = freeCells.splice(index, 1)[0];
    var parts = key.split(",");
    var x = parseInt(parts[0]);
    var y = parseInt(parts[1]);
    return new what(x, y);
  },

  _generateBoxes: function(freeCells) {
    for (var i = 0; i < 10; i++) {
      var index = Math.floor(ROT.RNG.getUniform() * freeCells.length);
      var key = freeCells.splice(index, 1)[0];
      this.map[key] = "*";
      if (!i) {
        this.ananas = key;
      } /* first box contains an ananas */
    }
  },

  _drawWholeMap: function() {
    for (var key in this.map) {
      var parts = key.split(",");
      var x = parseInt(parts[0]);
      var y = parseInt(parts[1]);
      this.display.draw(x, y, this.map[key]);
    }
  }
};

var Player = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}

Player.prototype.getSpeed = function() {
  return 100;
}
Player.prototype.getX = function() {
  return this._x;
}
Player.prototype.getY = function() {
  return this._y;
}

Player.prototype.act = function() {
  pushInput(this.handler());
}

function detectMobile() {
 return window.innerWidth <= 1000 && window.innerHeight <= 1000;
}

Player.prototype.handler = function() {

  let directionFromTouch = e => {
    var x = e.changedTouches[0].clientX;
    var y = e.changedTouches[0].clientY;
    var maxX = $('#game').width();
    var maxY = $('#game').height();

    var left = x < maxX / 3;
    var right = x > maxX * 2/3;
    var top = y < maxY / 3;
    var bottom = y > maxY * 2 / 3;

    var direction;
    if (top) {
      if (!left && !right) {
        direction = 0;
      } else if (left) {
        direction = 7;
      } else {
        direction = 1;
      }
    } else if (bottom) {
      if (!left && !right) {
        direction = 4;
      } else if (left) {
        direction = 5;
      } else {
        direction = 3;
      }
    } else {
      if (!left && !right) {
        // TODO maybe this should be for opening boxes
        throw 'invalid direction';
      } else if (left) {
        direction = 6;
      } else {
        direction = 2;
      }
    }
    return ROT.DIRS[8][direction];
  }

  let directionFromMouse = e => {

    let there = vec2.fromValues(...Game.display.eventToPosition(e));
    let current = vec2.fromValues(this.getX(), this.getY());

    // what a crazy api
    let result = vec2.create();
    vec2.sub(result, there, current);

    // discretise
    result = vec2.normalize(result, result);
    result[0] = Math.round(result[0]);
    result[1] = Math.round(result[1]);

    return result;
  }

  let directionFromKeyboard = e => {
    var keyMap = {};
    keyMap[38] = 0;
    keyMap[33] = 1;
    keyMap[39] = 2;
    keyMap[34] = 3;
    keyMap[40] = 4;
    keyMap[35] = 5;
    keyMap[37] = 6;
    keyMap[36] = 7;

    var code = e.keyCode;
    /* one of numpad directions? */
    if (!(code in keyMap)) {
      return;
    }

    return ROT.DIRS[8][keyMap[code]];
  }

  let done = (e, dir) => {
    // TODO abstract over keycode handling, as all handlers call this
    if (!dir && e.keyCode != 13 && e.keyCode != 32) {
      // this catches the case where a key other than a direction is pressed
      // (dir is undefined) and the key wasn't space or enter. should go away
      // when we abstract over keycode handling
      return;
    }

    /* is there a free space? */
    var isCheckingBox = detectMobile() ? false : (e.keyCode == 13 || e.keyCode == 32);
    if (isCheckingBox) {
      this._checkBox();
      return;
    }

    // var dir = detectMobile() ? directionFromTouch(e) : directionFromMouse(e);
    var newX = this._x + dir[0];
    var newY = this._y + dir[1];
    var newKey = newX + "," + newY;
    if (!(newKey in Game.map)) {
      return;
    }

    Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y]);
    this._x = newX;
    this._y = newY;
    this._draw();
    popInput();
  };

  return {
    keydown: e => done(e.originalEvent, directionFromKeyboard(e.originalEvent)),
    mousedown: e => done(e.originalEvent, directionFromMouse(e.originalEvent)),
    touchstart: e => done(e.originalEvent, directionFromTouch(e.originalEvent)),
  };
}

Array.prototype.peek = function() {
  return this[this.length - 1];
};

let dialogueContinue = (function() {

  function done() {
    $('#dialogue').html('');
    popInput();
  }

  return {
    keydown: e => {
      var code = e.keyCode;
      if (code == 13 || code == 32) {
        done();
      }
    },
    mousedown: e => done(),
    touchstart: e => done(),
  };
})();

// Stack {name: handler}
var inputStack = [];
var allowedEvents = detectMobile() ? ['touchstart'] : ['mousedown', 'keydown'];

// handler is an object with the handleEvent function
function pushInput(handlers) {

  if (inputStack.length > 0) {
    current = inputStack.peek();

    // remove the current listeners; we can restore them later
    for (let k in current) {
      $(window).off(k);
    }
  }

  Game.engine.lock();

  // store new listeners and enable them
  var handler = allowedEvents.reduce((t, c) => {t[c] = handlers[c]; return t;}, {});
  inputStack.push(handler);

  for (let k of allowedEvents) {
    $(window).on(k, handlers[k]);
  }
}

function popInput() {
  if (inputStack.length === 0) {
    throw 'cannot pop empty input stack';
  }

  // get rid of the current event handlers
  for (let k in inputStack.pop()) {
    $(window).off(k);
  }

  // restore the previous handlers if there were any
  if (inputStack.length > 0) {
    for (let k of allowedEvents) {
      $(window).on(k, inputStack.peek()[k]);
    }
  }

  // this has to come last as unlocking causes the player to act again,
  // and that adds more handlers
  Game.engine.unlock();
}

Player.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "@", "#ff0");
}

Player.prototype._checkBox = function() {
  var key = this._x + "," + this._y;
  if (Game.map[key] != "*") {
    $('#dialogue').html("There is no box here! [press space to continue]");
    pushInput(dialogueContinue);
  } else if (key == Game.ananas) {
    alert("Hooray! You found an ananas and won this game.");
    Game.engine.lock();
  } else {
    $('#dialogue').html("This box is empty :-( [press space to continue]");
    pushInput(dialogueContinue);
  }
}

var Pedro = function(x, y) {
  this._x = x;
  this._y = y;
  this._draw();
}

Pedro.prototype.getSpeed = function() {
  return 100;
}

Pedro.prototype.act = function() {
  var x = Game.player.getX();
  var y = Game.player.getY();

  var passableCallback = function(x, y) {
    return (x + "," + y in Game.map);
  }
  var astar = new ROT.Path.AStar(x, y, passableCallback, {
    topology: 4
  });

  var path = [];
  var pathCallback = function(x, y) {
    path.push([x, y]);
  }
  astar.compute(this._x, this._y, pathCallback);

  path.shift();
  if (path.length == 1) {
    Game.engine.lock();
    alert("Game over - you were captured by Pedro!");
  } else {
    x = path[0][0];
    y = path[0][1];
    Game.display.draw(this._x, this._y, Game.map[this._x + "," + this._y]);
    this._x = x;
    this._y = y;
    this._draw();
  }
}

Pedro.prototype._draw = function() {
  Game.display.draw(this._x, this._y, "P", "red");
}

$(Game.init.bind(Game));
