import cv2
import numpy as np
import os, shutil
import json

map_path = 'resources/map_v2.png'
min_tile_size = 512
tile_ratio = 2

TILE_DIR = 'tiles'
SETTINGS_FILE = "settings.json"

def check_dir(dir_path: str) -> bool:
    """
    Check if the directory exists, if not, create it.
    Check if the directory is empty, if not, ask whether to delete it.
    :param dir_path: The directory path to check.
    :return: True if the directory is ready, False otherwise.
    """

    if not os.path.exists(dir_path):
        os.makedirs(dir_path)
        print(f"Directory {dir_path} created.")
    elif os.listdir(dir_path):
        while True:
            choice = input(f"The directory {dir_path} is not empty. Do you want to delete it? (y/n) ")
            if choice == 'y':
                shutil.rmtree(dir_path)
                os.makedirs(dir_path)
                break
            elif choice == 'n':
                return False
            else:
                print("Invalid choice. Please enter 'y' or 'n'.")
    print(f"Directory {dir_path} is ready.")
    return True

def tile_map(img_path: str, TILE_DIR: str, min_tile_size: int, tile_ratio: int) -> None:
    """
    Tile the map image into smaller tiles.
    :param img_path: The path of the map image.
    :param TILE_DIR: The directory to save the tiles.
    :param min_tile_size: The size of the smallest tile.
    :param tile_ratio: The ratio of the tile size to the next level tile size.
    :return: none.
    """

    if not check_dir(TILE_DIR):
        raise Exception("[ERROR] The tiles directory is not empty. Please delete it or choose another directory.")
    
    img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
    h, w, channels = img.shape
    print(f"Image size: {w}x{h}, Channels: {channels}")

    # get the maximum size of the tiles
    max_level = 0
    max_tile_size = min_tile_size
    while max_tile_size < max(h, w):
        max_tile_size *= tile_ratio
        max_level += 1

    with open(SETTINGS_FILE, "w") as f:
        json.dump({
            "min_tile_size": min_tile_size,
            "tile_ratio": tile_ratio,
            "map_size": [w, h],
            "max_level": max_level
            }, f, indent=2)

    # 补齐图片
    img = cv2.copyMakeBorder(img, 0, max_tile_size-h, 0, max_tile_size-w, cv2.BORDER_CONSTANT, value=[1, 1, 1, 0])

    print("Tiling the map...")
    size = max_tile_size
    for level in range(max_level+1):
        for i in range(h//size+bool(h%size)):
            for j in range(w//size+bool(w%size)):
                # crop
                tile = img[i*size:(i+1)*size, j*size:(j+1)*size]
                filename = ""
                _i = i
                _j = j
                for _ in range(level):
                    filename = str(_i%tile_ratio) + str(_j%tile_ratio) + filename
                    _i //= tile_ratio
                    _j //= tile_ratio
                
                #resize
                if level == max_level:
                    tile_resized = tile
                else:
                    tile_resized = np.empty((min_tile_size, min_tile_size, channels), np.uint8)
                    block_size = tile_ratio**(max_level-level)
                    for x in range(min_tile_size):
                        for y in range(min_tile_size):
                            box = tile[x*block_size:(x+1)*block_size, y*block_size:(y+1)*block_size]
                            pixel = np.around(box.mean(axis=(0,1),where=box!=[1,1,1,0])).astype(np.uint8)
                            tile_resized[x,y] = pixel
                
                cv2.imwrite(os.path.join(TILE_DIR, filename+".png"), tile_resized)
                print(f"Tile \"{filename}.png\" saved. Level: {level}/{max_level}, Number: {(w//size+bool(w%size))*i+j+1}/{(h//size+bool(h%size))*(w//size+bool(w%size))}")
        size //= tile_ratio

    

if __name__ == '__main__':
    tile_map(map_path, TILE_DIR, min_tile_size, tile_ratio)
    

