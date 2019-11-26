# Forests (CMPT 361 Assignment 3 Problem 2 )

This project implements a scene renderer based on three.js. The available options for rendering include trees, grass, soil and sun. Additional features include perspective changing, allowing users to view the rendered scene from different perspectives and zoom in/out for closer views.

## Usage
To run this code locally, a local server is needed. (https://threejs.org/docs/#manual/en/introduction/How-to-run-things-locally)

There are multiple ways to open a server, the easiest way is to run the following command under this directory 
```
python -m SimpleHTTPServer
```
and open the following link in the web browser
```
http://localhost:8000/forest.html
```

## Features
* Rendered trees
* Grass growing out of ground gradually
* Natural lighting and shadows (shadows become more clear as the number of object decreases in the scene)
* Simulating Sun rising and falling
* Ground soil texture
* Skydome

## Animation Usage
* Use mouth to control the viewport
* Use middle button to zoom in and out.


## Acknowledge
* Three.js: https://threejs.org/
* Skydome rendering: https://threejs.org/examples/#webgl_water
* Tree rendering: https://codepen.io/leomanlapera/pen/EWBZLW
* Grass rendering: https://github.com/spacejack/terra
* Shadow modeling for instances: https://discourse.threejs.org/t/shadow-for-instances/7947
* Natural lighting: https://stackoverflow.com/questions/15478093/realistic-lighting-sunlight-with-three-js
* Soil texture: https://www.textures.com/

