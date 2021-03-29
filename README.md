## `stre-ami-ng` : Streaming Volume Rendering using `AMI.js`

The goal is to *hopefully* be able to stream `nii.gz` files over a network and have them render dynamically using the `VolumeLoader` provided by `ami.js`. As usual documentation is no great shakes, plus I'm a newbie to the whole graphics thing.

Current plan of action is-
1. Figure out the structure of `nii` files to figure out how to  append them to each other *(if required)*
2. Write an async coroutine to retrieve chunks from a URL --> append them to each other and re-render.
3. Using this approach as opposed to sending pre-appended chunks from the server,
  - The render time becomes $$O(n^2)$$ compared to the data transfer becoming $$O(n^2)$$ in the latter case.
4. Figure out how Volume Rendering using Ray Marching works. Deep dive into volume rendering a scalar field.
