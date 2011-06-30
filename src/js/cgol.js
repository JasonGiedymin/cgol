(function() {
  /* CGOL */
  /* Notes */
  /* Utilities */  var $, CgolBasic, Queue, init;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
  $ = function(element_id) {
    return document.getElementById(element_id);
  };
  /* Classes */
  Queue = (function() {
    function Queue(_stagnant_generation_limit, _stagnant_population_flux, _silence) {
      this._stagnant_generation_limit = _stagnant_generation_limit != null ? _stagnant_generation_limit : 10;
      this._stagnant_population_flux = _stagnant_population_flux != null ? _stagnant_population_flux : .01;
      this._silence = _silence != null ? _silence : false;
      this._queue = [];
    }
    Queue.prototype.clear = function() {
      return this._queue = [];
    };
    Queue.prototype.getSize = function() {
      return console.log(this._queue.length);
    };
    Queue.prototype.push = function(value) {
      return this._queue.push(value);
    };
    Queue.prototype.getLast = function() {
      return this._queue[this._queue.length - 1];
    };
    Queue.prototype.getData = function() {
      return this._queue;
    };
    Queue.prototype.getSnapshot = function(snapshot_size) {
      var _queue_size;
      if (snapshot_size == null) {
        snapshot_size = this._stagnant_generation_limit;
      }
      if (this._queue.length <= 2) {
        return [1, 100];
      }
      _queue_size = this._queue.length - 1;
      if (_queue_size >= snapshot_size) {
        return this._queue.slice(_queue_size - snapshot_size, _queue_size);
      } else {
        return this._queue;
      }
    };
    Queue.prototype.getFlux = function() {
      var compareNumbers, _curr_flux, _max_index, _max_population, _min_population, _population_data;
      compareNumbers = function(a, b) {
        return a - b;
      };
      _population_data = this.getSnapshot();
      _population_data.sort(compareNumbers);
      _max_index = _population_data.length - 1;
      _min_population = _population_data[0];
      _max_population = _population_data[_max_index];
      if (_min_population === 0 || _max_population === 0) {
        return 0;
      }
      _curr_flux = 1 - (_min_population / _max_population);
      return _curr_flux.toFixed(3);
    };
    Queue.prototype.isPopulationStagnant = function(_max_flux) {
      var _curr_flux;
      if (_max_flux == null) {
        _max_flux = this._stagnant_population_flux;
      }
      _curr_flux = this.getFlux();
      if (_curr_flux <= _max_flux && !this._silence) {
        console.log("Stagnant flux: " + _curr_flux + ".");
        return true;
      } else {
        return false;
      }
    };
    return Queue;
  })();
  CgolBasic = (function() {
    function CgolBasic(_rows, _cols, _interval_limit, _cycle) {
      this._rows = _rows != null ? _rows : 50;
      this._cols = _cols != null ? _cols : 100;
      this._interval_limit = _interval_limit != null ? _interval_limit : 5000;
      this._cycle = _cycle != null ? _cycle : true;
      /* Toggles */
      this._manual = false;
      this._realtime_view = true;
      this._calculate_stagnation = true;
      this._speed = 1;
      this._cell_size = "huge";
      /* Vars - don't touch */
      this._world_table = [];
      this._world_table_last = [];
      this._worlds_with_life = [];
      this._is_running = false;
      this._worlds_tested = 0;
      this._interval = 0;
      this._timer = null;
      this._stagnant_generation_limit = 10;
      this._stagnant_population_flux = .011;
      this._populations = new Queue(this._stagnant_generation_limit, this._stagnant_population_flux, this._manual);
      if (typeof canvas != "undefined" && canvas !== null) {
        this._context = canvas.getContext('2d');
      }
      this._image = this._context.createImageData(this._cols, this._rows);
      this._pixels = this._image.data;
    }
    CgolBasic.prototype.setupWorld = function() {
      var string_buffer, x, y, _ref, _ref2;
      string_buffer = [];
      for (y = 0, _ref = this._rows; (0 <= _ref ? y < _ref : y > _ref); (0 <= _ref ? y += 1 : y -= 1)) {
        this._world_table[y] = [];
        string_buffer.push('<tr>');
        for (x = 0, _ref2 = this._cols; (0 <= _ref2 ? x < _ref2 : x > _ref2); (0 <= _ref2 ? x += 1 : x -= 1)) {
          string_buffer.push('<div id="c' + y + '_' + x + '" class="cell off #{@_cell_size}"></div>');
          this._world_table[y][x] = 0;
        }
        string_buffer.push('</div>');
      }
      return $("simulation").innerHTML = string_buffer.join("");
    };
    CgolBasic.prototype.calculate_world = function() {
      var b, c, cell, l, r, start_date, t, x, y, z, _current_population, _ref, _ref2;
      start_date = new Date();
      c = 0;
      _current_population = 0;
      z = [];
      t = this._rows - 1;
      for (y = 0, _ref = this._rows; (0 <= _ref ? y < _ref : y > _ref); (0 <= _ref ? y += 1 : y -= 1)) {
        z[y] = [];
        b = y === (this._rows - 1) ? 0 : y + 1;
        l = this._cols - 1;
        for (x = 0, _ref2 = this._cols; (0 <= _ref2 ? x < _ref2 : x > _ref2); (0 <= _ref2 ? x += 1 : x -= 1)) {
          cell = $("c" + y + '_' + x);
          r = x === this._cols - 1 ? 0 : x + 1;
          c = this._world_table[t][l] + this._world_table[t][x] + this._world_table[t][r] + this._world_table[y][l] + this._world_table[y][r] + this._world_table[b][l] + this._world_table[b][x] + this._world_table[b][r];
          switch (c) {
            case 3:
              z[y][x] = 1;
              if (this._realtime_view) {
                this.drawNode(y, x, "on");
              }
              _current_population++;
              break;
            case 2:
              z[y][x] = this._world_table[y][x];
              break;
            default:
              if (this._realtime_view) {
                this.drawNode(y, x, "off");
              }
              z[y][x] = 0;
          }
          l = x;
        }
        t = y;
      }
      this._populations.push(_current_population);
      this._world_table = z;
      this._interval++;
      if (this._interval >= this._interval_limit) {
        if (!this._cycle) {
          clearInterval(this._timer);
        } else {
          this._worlds_tested++;
          this._interval = 0;
          this._populations.clear();
          this.clearWorld();
          this.doPattern();
          this.drawCurrentWorld();
        }
        return this.printStatus(start_date);
      } else {
        if (!this._realtime_view) {
          if ((this._interval / 100) % 2 === 0 || (this._interval / 100) % 2 === 1) {
            this.printStatus(start_date);
            this.drawCurrentWorld();
          }
        } else {
          this.printStatus(start_date);
        }
        if (this._populations.isPopulationStagnant(this._stagnant_population_flux) && this._calculate_stagnation) {
          if (!this._manual && this._cycle) {
            this._worlds_tested++;
            this.clearWorld();
            this._interval = 0;
            this._populations.clear();
            this.doPattern();
            return this.drawCurrentWorld();
          }
        }
      }
    };
    CgolBasic.prototype.printStatus = function(start_date) {
      return $("time").innerHTML = "[" + (Math.round(1000 / (new Date() - start_date))) + "]fps, Step:[" + this._interval + "], Pop:[" + (this._populations.getLast()) + "], World:[" + this._worlds_tested + "], Flux:[" + (this._populations.getFlux()) + "].";
    };
    CgolBasic.prototype.doPattern = function(pattern) {
      var start_x, start_y, x, y, _ref, _ref2, _ref3;
      if (pattern == null) {
        pattern = "rand";
      }
      switch (pattern) {
        case "rand":
          for (y = 0, _ref = this._rows; (0 <= _ref ? y < _ref : y > _ref); (0 <= _ref ? y += 1 : y -= 1)) {
            for (x = 0, _ref2 = this._cols; (0 <= _ref2 ? x < _ref2 : x > _ref2); (0 <= _ref2 ? x += 1 : x -= 1)) {
              if (Math.random() > Math.random()) {
                this._world_table[y][x] = 1;
              }
            }
          }
          break;
        case "oscillator":
          this._world_table[2][1] = 1;
          this._world_table[2][2] = 1;
          this._world_table[2][3] = 1;
          break;
        case "beehive":
          this._world_table[2][2] = 1;
          this._world_table[2][3] = 1;
          this._world_table[3][1] = 1;
          this._world_table[3][4] = 1;
          this._world_table[4][2] = 1;
          this._world_table[4][3] = 1;
          break;
        case "toad":
          this._world_table[2][2] = 1;
          this._world_table[2][3] = 1;
          this._world_table[2][4] = 1;
          this._world_table[3][1] = 1;
          this._world_table[3][2] = 1;
          this._world_table[3][3] = 1;
          break;
        case "data":
          _ref3 = [25, 25], start_x = _ref3[0], start_y = _ref3[1];
          this._world_table[start_y + 2][start_x + 2] = 1;
          this._world_table[start_y + 2][start_x + 3] = 1;
          this._world_table[start_y + 2][start_x + 4] = 1;
          this._world_table[start_y + 3][start_x + 1] = 1;
          this._world_table[start_y + 3][start_x + 2] = 1;
          this._world_table[start_y + 3][start_x + 3] = 1;
      }
      return this._world_table_last = this._world_table;
    };
    CgolBasic.prototype.clearWorld = function() {
      var cell, x, y, _ref, _results;
      _results = [];
      for (y = 0, _ref = this._rows; (0 <= _ref ? y < _ref : y > _ref); (0 <= _ref ? y += 1 : y -= 1)) {
        _results.push((function() {
          var _ref, _results;
          _results = [];
          for (x = 0, _ref = this._cols; (0 <= _ref ? x < _ref : x > _ref); (0 <= _ref ? x += 1 : x -= 1)) {
            cell = $("c" + y + '_' + x);
            _results.push(this._world_table[y][x] = 0);
          }
          return _results;
        }).call(this));
      }
      return _results;
    };
    CgolBasic.prototype.drawCurrentWorld = function() {
      var cell, x, y, _current_population, _ref, _ref2;
      _current_population = 0;
      for (y = 0, _ref = this._rows; (0 <= _ref ? y < _ref : y > _ref); (0 <= _ref ? y += 1 : y -= 1)) {
        for (x = 0, _ref2 = this._cols; (0 <= _ref2 ? x < _ref2 : x > _ref2); (0 <= _ref2 ? x += 1 : x -= 1)) {
          cell = $("c" + y + '_' + x);
          if (this._world_table[y][x] === 1) {
            this.drawNode(y, x, "on");
            _current_population++;
          } else {
            this.drawNode(y, x, "off");
          }
        }
      }
      return this._populations.push(_current_population);
    };
    CgolBasic.prototype.drawNode = function(y, x, state, size, node_css_class, node_css_first, view_type) {
      var cell, pixel_index;
      if (y == null) {
        y = 0;
      }
      if (x == null) {
        x = 0;
      }
      if (state == null) {
        state = "off";
      }
      if (size == null) {
        size = this._cell_size;
      }
      if (node_css_class == null) {
        node_css_class = "cell";
      }
      if (node_css_first == null) {
        node_css_first = "first";
      }
      if (view_type == null) {
        view_type = "html";
      }
      switch (view_type) {
        case "html":
          cell = $("c" + y + '_' + x);
          if (x === 0) {
            return cell.className = "" + node_css_class + " " + state + " " + size + " " + node_css_first;
          } else {
            return cell.className = "" + node_css_class + " " + state + " " + size;
          }
          break;
        case "canvas":
          pixel_index = (y * this._cols + x) * 4;
          if (state === "on") {
            this._pixels[pixel_index] = 0;
            this._pixels[pixel_index + 1] = 0;
            this._pixels[pixel_index + 2] = 0;
            this._pixels[pixel_index + 3] = 255;
          } else {
            this._pixels[pixel_index] = 255;
            this._pixels[pixel_index + 1] = 255;
            this._pixels[pixel_index + 2] = 255;
            this._pixels[pixel_index + 3] = 255;
          }
          return this._context.putImageData(this._image, 0, 0);
      }
    };
    CgolBasic.prototype.toggle = function() {
      if (this._is_running) {
        $("toggle").innerHTML = "Start";
        clearInterval(this._timer);
        return this._is_running = !this._is_running;
      } else {
        $("toggle").innerHTML = "Stop";
        this._timer = setInterval((__bind(function() {
          return this.calculate_world();
        }, this)), this._speed);
        return this._is_running = !this._is_running;
      }
    };
    CgolBasic.prototype.reset = function() {
      this._is_running = false;
      this._worlds_tested++;
      this.clearWorld();
      this._interval = 0;
      this._populations.clear();
      return this.drawCurrentWorld();
    };
    CgolBasic.prototype.randomSetup = function() {
      this._is_running = false;
      this._worlds_tested++;
      this.clearWorld();
      this._interval = 0;
      this._populations.clear();
      if (!this._manual) {
        this.doPattern();
      }
      return this.drawCurrentWorld();
    };
    CgolBasic.prototype.dataSetup = function() {
      this.doPattern("data");
      return this.drawCurrentWorld();
    };
    CgolBasic.prototype.toggleCell = function(y, x) {
      this._world_table[y][x] = this._world_table[y][x] === 0 ? 1 : 0;
      if (this._world_table[y][x] === 1) {
        return this.drawNode(y, x, "on");
      } else {
        return this.drawNode(y, x, "off");
      }
    };
    CgolBasic.prototype.autoStart = function() {
      this.setupWorld();
      if (!this._manual) {
        this.doPattern();
        this.toggle();
      }
      return this.drawCurrentWorld();
    };
    CgolBasic.prototype.stepApp = function() {
      if (!this._realtime_view) {
        console.log("Realtime view was not requested but stepping requires it. App is overriding the setting to yes.");
        this._realtime_view = true;
      }
      return this.calculate_world();
    };
    return CgolBasic;
  })();
  init = function() {
    var cgolApp;
    cgolApp = new CgolBasic();
    cgolApp.autoStart();
    window.cgolApp = cgolApp;
    return $("simulation").onclick = function() {
      var clicked_html, x, y, _ref;
      clicked_html = typeof e != "undefined" && e !== null ? e.target : window.event.srcElement;
      if (clicked_html.nodeName === "DIV") {
        _ref = clicked_html.id.substr(1).split("_"), y = _ref[0], x = _ref[1];
        return cgolApp.toggleCell(y, x);
      }
    };
  };
  window.onload = function() {
    return init();
  };
  /* Buttons */
  window.toggleApp = function() {
    return cgolApp.toggle();
  };
  window.stepApp = function() {
    return cgolApp.stepApp();
  };
  window.randomSetup = function() {
    return cgolApp.randomSetup();
  };
  window.dataSetup = function() {
    return cgolApp.dataSetup();
  };
  window.resetApp = function() {
    return cgolApp.reset();
  };
}).call(this);
