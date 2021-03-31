<img src="https://user-images.githubusercontent.com/32961084/113201567-44f3ca00-9287-11eb-9bdb-f505710cdad9.png" width=75%>

## `stre-ami-ng` : Streaming Volume Rendering using ~~`AMI.js`~~ `three.js`
-----------------
## Setting Up
I had initial troubles while setting up the examples provided by `three.js` because of browser restrictions and `CORS Policies`.
Here's what you need to do *(with `python 3`)*
```bash
$ cd <into root of repo>
$ python -m http.server [port number (default 8000)]
```


## Update 
Well the current version works with the `NRRDLoader` provided in the `three.js` examples. Plus a simple `scene.add(mesh)` is enought to add a mesh to the existing render without breaking anything.
#### Observations
 - `OrbitControls` is way less computationally expensive as it doesn't need the perpetual `animate` loop unlike the `TrackballControls`
 - Increasing the `pixelRatio` increased the FPS for some weird reason.
 - Highly zoomed scene with a very narrow FOV leads to fewer artifacts.
 - The separately plotted meshes still have a distinct boundary. Might have to look into a custom shader to blend together.
 - The `shader.js` is almost an exact copy of `VolumeRenderShader.js` from `three.js` examples.

### `[29.3.21]`
The goal is to *hopefully* be able to stream `nii.gz` files over a network and have them render dynamically using the `VolumeLoader` provided by `ami.js`. As usual documentation is no great shakes, plus I'm a newbie to the whole graphics thing.

Current plan of action is-
1. Figure out the structure of `nii` files to figure out how to  append them to each other *(if required)*
2. Write an async coroutine to retrieve chunks from a URL --> append them to each other and re-render.
3. Using this approach as opposed to sending pre-appended chunks from the server,
  - The render time becomes O(n^2) compared to the data transfer becoming O(n^2) in the latter case.
4. Figure out how Volume Rendering using Ray Marching works. Deep dive into volume rendering a scalar field.

### Note
> This is not the problem where the rendering is offloaded to the server as discussed [here](https://discourse.threejs.org/t/server-side-rendering-and-sending-data-to-the-client-as-jpeg-or-png-with-client-side-interaction-data/14512/12).
