# Image processing record

Built-in ImageGen was used to create five foreground luminance masks. The delivered portraits use the supplied originals; newly rendered portrait variants were not substituted. Original desktop files were not modified.

Applied mask prompt (one invocation for each of the five supplied portraits):

> Create an EXACT SEGMENTATION MASK for this provided image. Output ONLY a flat black and white mask, same 1086 by 1448 size and precise same original coordinates. Every pixel belonging to the person, hat, hair, hands, garments and held props must be PURE WHITE (#FFFFFF). Every pixel belonging to the cream paper background must be PURE BLACK (#000000). No portrait details, no gray face shading, no outlines, no text, no checkerboard. Preserve the exact original outer silhouette without moving, resizing, or changing pose. White foreground, black background. This opaque grayscale luminance mask will be used directly by CSS mask-image to preserve every original portrait pixel.

Delivered masks are in assets/images/masks and embedded in js/portraitMasks.js for offline file access. Per-image source dimensions and face landmarks are documented in js/portraitProfiles.json. WebP export provides file size optimization. The masks are generated approximations of the outer silhouette, not a claim of pixel-perfect manual segmentation.
