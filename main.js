const SCALE_STEP = 1.1;
const layerBox = document.getElementById("layer_box");
const mapLayer = document.getElementById("map_layer");
const railLayer = document.getElementById("rail_layer");
let svgs = document.getElementById("rail_layer").children;

let settings;
fetch('./settings.json')
  .then(response => response.json())
  .then(data => {
    settings = data;
    const MIN_SIZE = settings.min_tile_size;
    const RATIO = settings.tile_ratio;
    const MAP_SIZE = settings.map_size;
    const MAX_LEVEL = settings.max_level;

    layerBox.style.width = MAP_SIZE[0] + "px";
    layerBox.style.height = MAP_SIZE[1] + "px";
    let min_scale = Math.min(window.innerWidth / MAP_SIZE[0], window.innerHeight / MAP_SIZE[1]);
    let scale = min_scale;
    layerBox.style.transform = `scale(${scale})`;
    load_rail_map("rail");

    let tile_list = [];
    function createTree(depth) {
      let node = { value: false, children: [] };
      if (depth > 0) { for (let _ = 0; _ < RATIO ** 2; _++) { node.children.push(createTree(depth - 1)) } }
      return node;
    }
    let is_loaded_list = createTree(MAX_LEVEL);

    ask_for_tile();
    loadtile_from_list();

    function geohash2xy(geohash) {
      let x = "";
      let y = "";
      for (let i = 0; i < geohash.length; i++) {
        if (i % 2 == 0) { y += geohash[i] }
        else { x += geohash[i] }
      }
      if (x == "") { x = "0" }
      if (y == "") { y = "0" }
      return [parseInt(x, RATIO), parseInt(y, RATIO)]
    }

    function xy2geohash(x, y, level) {
      x_str = x.toString(RATIO).padStart(level, "0");
      y_str = y.toString(RATIO).padStart(level, "0");
      let geohash = "";
      for (let k = 0; k < level; k++) { geohash += y_str[k] + x_str[k] }
      return geohash
    }

    function loadtile_from_list() {
      if (tile_list.length == 0) { setTimeout(loadtile_from_list, 200); return }
      /*node = is_loaded_list;
      for (let i = 0; i < tile_list[0].length; i += 2) { node = node.children[parseInt(tile_list[0][i + 1], RATIO)] }
      if (node.value) { setTimeout(loadtile_from_list, 50); return }*/
      let img_name = tile_list.shift();
      var img = document.createElement("img");
      img.src = `./tiles/${img_name}.png`;
      img.draggable = false;
      img.oncontextmenu = (e) => { return false; }
      level = Math.floor(img_name.length / 2)
      img.style.zIndex = level;
      img.style.width = MIN_SIZE * RATIO ** (MAX_LEVEL - level) + "px";
      img.style.height = MIN_SIZE * RATIO ** (MAX_LEVEL - level) + "px";
      let _ = geohash2xy(img_name)
      let x = _[0];
      let y = _[1];
      img.style.left = x * MIN_SIZE * RATIO ** (MAX_LEVEL - level) + "px";
      img.style.top = y * MIN_SIZE * RATIO ** (MAX_LEVEL - level) + "px";
      mapLayer.appendChild(img);
      img.onload = loadtile_from_list;
    }

    function load_rail_map( filename ) {
      let img = document.createElement("object");
      img.onload = () => {
        console.log(img.contentDocument.getElementsByTagName("path"));
        img.contentDocument.getElementsByTagName("path")[0].style.strokeWidth = 36 * min_scale / scale + "px"
      }
      img.data = `./resources/${filename}.svg`;
      img.type = "image/svg+xml";
      img.draggable = false;
      img.oncontextmenu = (e) => { return false }
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.position = "absolute";
      img.style.top = "0px";
      img.style.left = "0px";
      railLayer.appendChild(img);
    }

    function isInRect(filename) {

    }

    function ask_for_tile() {
      let centerX = (window.innerWidth / 2 - layerBox.offsetLeft) / scale;
      let centerY = (window.innerHeight / 2 - layerBox.offsetTop) / scale;

      let x = Math.floor(centerX / MIN_SIZE);
      let y = Math.floor(centerY / MIN_SIZE);
      let filename = xy2geohash(x, y, MAX_LEVEL);
      let node = is_loaded_list
      for (let i = 0; i <= filename.length; i += 2) {
        if (!(node.value)) {
          tile_list.push(filename.slice(0, i));
          node.value = true;
        };
        //tile_list.push(filename.slice(0, i)); //TODO: debug the former code
        node = node.children[parseInt(filename.slice(i - 2, i) | "0", RATIO)];
      }
    }

    window.addEventListener("resize", () => {
      min_scale = Math.min(window.innerWidth / layerBox.offsetWidth, window.innerHeight / layerBox.offsetHeight);
      if (scale < min_scale) {
        scale = min_scale;
        layerBox.style.transform = `scale(${scale})`;
        layerBox.style.top = "0px";
        layerBox.style.left = "0px";
      }
      if (layerBox.offsetLeft + layerBox.offsetWidth * scale < window.innerWidth) { layerBox.style.left = window.innerWidth - layerBox.offsetWidth * scale + "px" }
      if (layerBox.offsetTop + layerBox.offsetHeight * scale < window.innerHeight) { layerBox.style.top = window.innerHeight - layerBox.offsetHeight * scale + "px" }
      if (layerBox.offsetLeft > 0) { layerBox.style.left = "0px" }
      if (layerBox.offsetTop > 0) { layerBox.style.top = "0px" }
    })

    layerBox.addEventListener("wheel", (e) => {
      console.log(e.wheelDelta);
      var offsetX = layerBox.clientLeft - e.clientX;
      var offsetY = layerBox.clientTop - e.clientY;
      if (e.wheelDelta > 0) {
        let prescale = scale;
        scale *= SCALE_STEP;
        layerBox.style.left = (layerBox.offsetLeft + offsetX) * scale / prescale - offsetX + "px"
        layerBox.style.top = (layerBox.offsetTop + offsetY) * scale / prescale - offsetY + "px"
        layerBox.style.transform = `scale(${scale})`;
      } else {
        let prescale = scale;
        scale /= SCALE_STEP;
        if (scale < min_scale) { scale = min_scale }
        layerBox.style.transform = `scale(${scale})`;
        layerBox.style.left = Math.min(Math.max((layerBox.offsetLeft + offsetX) * scale / prescale - offsetX, window.innerWidth - layerBox.offsetWidth * scale), 0) + "px";
        layerBox.style.top = Math.min(Math.max((layerBox.offsetTop + offsetY) * scale / prescale - offsetY, window.innerHeight - layerBox.offsetHeight * scale), 0) + "px";
      }
      setTimeout(ask_for_tile, 1);
    })

    layerBox.onmousedown = function (e) {
      let left = layerBox.offsetLeft;
      let top = layerBox.offsetTop;
      let startX = e.clientX;
      let startY = e.clientY;

      layerBox.onmousemove = function (event) {
        layerBox.style.left = Math.min(Math.max(event.clientX - startX + left, window.innerWidth - layerBox.offsetWidth * scale), 0) + "px";
        layerBox.style.top = Math.min(Math.max(event.clientY - startY + top, window.innerHeight - layerBox.offsetHeight * scale), 0) + "px";
        setTimeout(ask_for_tile, 1);
      }
    }

    document.addEventListener("mouseup", () => {
      layerBox.onmousemove = null;
    })

    window.onload = function () { };

  });