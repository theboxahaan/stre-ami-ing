<img src="https://user-images.githubusercontent.com/32961084/113201567-44f3ca00-9287-11eb-9bdb-f505710cdad9.png" width=75%>

## `stre-ami-ng` : Streaming Volume Rendering using ~~`AMI.js`~~ `three.js`
-----------------
## Setting Up
I had initial troubles while setting up the examples provided by `three.js` because of browser restrictions and `CORS Policies`.
Here's what you need to do *(with `python 3`)*
```bash
$ cd <into root of repo>
$ python -m http.server [port number[9000] (default 8000)]
```
Get served by navigating to `http://localhost:<port[9000] or 8000>/index.html`

|isothreshold1|isothreshold2|
|-------------|-------------|
|<img width="535" alt="Screenshot 2021-04-02 at 2 11 20 AM" src="https://user-images.githubusercontent.com/32961084/113352282-a7b59600-9359-11eb-9101-3ef1f0d6cf37.png">|<img width="535" alt="Screenshot 2021-04-02 at 2 11 13 AM" src="https://user-images.githubusercontent.com/32961084/113352294-aab08680-9359-11eb-983f-7701cd4a49f8.png">|
> The full `.nrrd` file can be found at [https://threejs.org/examples/models/nrrd/stent.nrrd](https://threejs.org/examples/models/nrrd/stent.nrrd)

## Chunking the `.nrrd` file
The splitting of the full `nrrd` file into chunks was done using the `pynrrd` library in python 3.
```python
>>> import numpy as np
>>> import nrrd
>>> data, header = nrrd.read('stent.nrrd')
>>> data.dtype
dtype('float32')
>>> data.shape
(128, 128, 256)
>>> data_seg = np.split(data, 4, axis=1)
>>> for c, i in enumerate(data_seg):
    ... nrrd.write(f'stent_{c}.nrrd', i, header={'type': 'float', 'endian': 'little',\ 
    'encoding': 'gzip'}, index_ordering = 'C')
```
This snippet basically splits the data into four parts along the `y-axis` each of size 32.

> ***The `type` specified in the header of the `nrrd` file has to be of type `float` i.e `float32` to work with the current poc. Also, the `encoding` needs to be set to `little`.***

--------------
## ToDo
- Implement quality selection for selecting - float precision `highp, mediump, lowp`, antialiasing, `float relative_step_size` etc. which can set the tradeoff btw quality and performance.
- Data-shape based settings for camera frustum, rendering depth `MAX_STEPS` etc.
- Look into mesh *merging* for optimizations
- Set up a feedback loop for "adaptive streaming"


--------------
## Update

### Observations
The rendering pipeline works as follows - 
```
   load data --> create 3D texture of data --> create Material using texture --> create boxGeometry / Mesh with Material --> add to Scene --> render
```
Hypothesis - The only way of getting a seamless render btw two different boxGeo's is by creating a new one entirely, or by adding points repeatedly to the same one and re-rendering.

Trying the first approach.

> Question that needs to be answered - Since Texture3D's arg is a `TypeArray` will simple, appending to the trick ?

#### First Try
1. Create a `TypeArray` from data received over socket.
2. Append data received over socket to the same `TypeArray`

### `[3.4.21]`
Turns out, for proper LUT function, the scalar value needs to be rescaled to between `0` and `1`.
So, that is achieved by dividing the entire array with the max value. i.e.
```python
# arr is the 3D numpy array containing the scalar field
>>> arr = arr/arr.max()
```
#### Observations
- This decreases FPS by a significant measure.
- Need more efficient shader code
- Textures need to be more efficient *(if possible)*

### `[2.4.21]`
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
