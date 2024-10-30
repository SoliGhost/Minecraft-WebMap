const SCALE_STEP = 1.1;
const mapBox = document.getElementById("map_box");

let settings;
fetch('./settings.json')
  .then(response => response.json())
  .then(data => {
    settings = data;
    mapBox.style.width = settings.map_size[0] + "px";
    mapBox.style.height = settings.map_size[1] + "px";
    let min_scale = Math.min(window.innerWidth / settings.map_size[0], window.innerHeight / settings.map_size[1]);
    let scale = min_scale;
    mapBox.style.transform = `scale(${scale})`;
    let tile_list = [""]
    ask_for_tile();
    loadtile_from_list();

    console.log(settings);

    function loadtile_from_list() {
      let img_name = tile_list.shift();
      var img = document.createElement("img");
      img.src = `./tiles/${img_name}.png`;
      img.draggable = false;
      img.oncontextmenu = (e) => { return false; }
      level = Math.floor(img_name.length / 2)
      img.style.width = settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) + "px";
      img.style.height = settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) + "px";
      let left = "";
      let top = "";
      for (let i = 0; i < img_name.length; i++) {
        if (i % 2 == 0) { top += img_name[i] }
        else { left += img_name[i] }
      }
      img.style.left = parseInt(left, settings.tile_ratio) * settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) + "px";
      img.style.top = parseInt(top, settings.tile_ratio) * settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) + "px";
      var container = mapBox;
      container.appendChild(img);
      if (tile_list.length > 0) { img.onload = () => {
        loadtile_from_list() }
      }
    }

    function ask_for_tile() {
      for (let level = 0; level <= settings.max_level; level++) {
        for (let i = 0; i * settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) < settings.map_size[0]; i++) {
          for (let j = 0; j * settings.min_tile_size * settings.tile_ratio ** (settings.max_level - level) < settings.map_size[1]; j++) {
            i_str = i.toString(settings.tile_ratio).padStart(level, "0");
            j_str = j.toString(settings.tile_ratio).padStart(level, "0");
            img_name = "";
            for (let k = 0; k < level; k++) { img_name += j_str[k] + i_str[k] }
            tile_list.push(img_name);
            console.log(img_name);
          }
        }
      }
    }

    window.addEventListener("resize", () => {
      min_scale = Math.min(window.innerWidth / mapBox.offsetWidth, window.innerHeight / mapBox.offsetHeight);
      if (scale < min_scale) {
        scale = min_scale;
        mapBox.style.transform = `scale(${scale})`;
        mapBox.style.top = "0px";
        mapBox.style.left = "0px";
      }
      if (mapBox.offsetLeft + mapBox.offsetWidth * scale < window.innerWidth) { mapBox.style.left = window.innerWidth - mapBox.offsetWidth * scale + "px" }
      if (mapBox.offsetTop + mapBox.offsetHeight * scale < window.innerHeight) { mapBox.style.top = window.innerHeight - mapBox.offsetHeight * scale + "px" }
      if (mapBox.offsetLeft > 0) { mapBox.style.left = "0px" }
      if (mapBox.offsetTop > 0) { mapBox.style.top = "0px" }
    })

    mapBox.addEventListener("wheel", (e) => {
      console.log(e.wheelDelta);
      var offsetX = mapBox.clientLeft - e.clientX;
      var offsetY = mapBox.clientTop - e.clientY;
      if (e.wheelDelta > 0) {
        let prescale = scale;
        scale *= SCALE_STEP;
        mapBox.style.left = (mapBox.offsetLeft + offsetX) * scale / prescale - offsetX + "px"
        mapBox.style.top = (mapBox.offsetTop + offsetY) * scale / prescale - offsetY + "px"
        mapBox.style.transform = `scale(${scale})`;
      } else {
        let prescale = scale;
        scale /= SCALE_STEP;
        if (scale < min_scale) { scale = min_scale }
        mapBox.style.transform = `scale(${scale})`;
        mapBox.style.left = Math.min(Math.max((mapBox.offsetLeft + offsetX) * scale / prescale - offsetX, window.innerWidth - mapBox.offsetWidth * scale), 0) + "px";
        mapBox.style.top = Math.min(Math.max((mapBox.offsetTop + offsetY) * scale / prescale - offsetY, window.innerHeight - mapBox.offsetHeight * scale), 0) + "px";
      }
    })

    mapBox.onmousedown = function (e) {
      let left = mapBox.offsetLeft;
      let top = mapBox.offsetTop;
      let startX = e.clientX;
      let startY = e.clientY;

      mapBox.onmousemove = function (event) {
        mapBox.style.left = Math.min(Math.max(event.clientX - startX + left, window.innerWidth - mapBox.offsetWidth * scale), 0) + "px";
        mapBox.style.top = Math.min(Math.max(event.clientY - startY + top, window.innerHeight - mapBox.offsetHeight * scale), 0) + "px";
      }
    }

    document.addEventListener("mouseup", () => {
      mapBox.onmousemove = null;
    })

    window.onload = function () { };

  });