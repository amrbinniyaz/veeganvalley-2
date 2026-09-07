# The Living Valley — real-time 3D journey

Route: `/3d-journey/`. The existing `/farm-to-bottle/` HTML, script and stylesheet
are unchanged. The new route links back to that illustrated version.

The requested 3D world is implemented in the project's installed Three.js engine.
The scroll-world skill's video pipeline was considered, but neither Monid nor
Higgsfield is installed here. This version uses no generated video, paid rendering,
external models or additional dependencies.

## Scene and camera

`src/modules/farmWorldGeometry.js` constructs four connected miniature scenes in
one coordinate system: orchard and growing beds, harvest crate, an open glasshouse
with a hydraulic juice press, and the existing branded bottle geometry. The scenery
uses matte sage materials and warm cream terrain, with directional shadows and fog.
Static geometry is merged by material into 23 draw calls. A green apple travels
from the orchard through the harvest to the press. Pressure and juice flow follow
the same scroll position, and the final bottle turns towards the camera.

`src/lib/worldFlight.js` supplies continuous camera, look-target and apple curves.
Chapter centres are at x = 0, 24, 48 and 72. Camera positions stay above the terrain.
The portrait lens pulls back and shifts composition down, rather than clipping a
landscape video. The scene itself renders at the viewport's current dimensions.

`src/modules/farmWorld.js` owns one WebGL renderer. It caps pixel density, limits
coarse-pointer rendering to roughly 30 fps, pauses while the document is hidden,
handles context loss, and disposes its resources. Reduced motion renders static
chapter views without floating props or camera interpolation. Labels load
asynchronously without delaying navigation. Existing illustrations remain visible
until the first WebGL frame and provide a fallback when WebGL is unavailable.

`src/world-journey.js` retains native horizontal touch scrolling, smooth wheel
navigation, chapter arrows, keyboard navigation and direct chapter hashes.
`src/styles/world-journey.css` builds on the illustrated stylesheet without modifying
it. Scene copy and controls float over the full-screen 3D environment.

## Validation

- Production build emits home, illustrated journey and 3D journey routes.
- Geometry checked for finite coordinates and valid triangle indices.
- Continuous camera sampled across the route; chapter targets and bounds checked.
- Apple endpoint verified at the press, and static draw-call budget checked.
- Original illustrated page hashes verified unchanged.
- New local route responds with HTTP 200.
- Browser visual/interaction QA was not performed. Automatic preview opening
  timed out; the new route remains available directly on port 3003.

## Produce refinement

`src/lib/produceGeometry.js` supplies custom fruit and vegetable meshes: apples
with five subtle lobes and recessed stems, curved and lightly ridged cucumbers,
carrots with rounded shoulders and tapered roots, and pointed lemons. Vertex
colours provide restrained skin variation and growth markings; no new image
assets or texture downloads are required. Folded leaves include fine central
veins on hero fruit, and carrots have branching, feathery foliage.

The harvest arrangement uses two apples to leave more room around the cucumber
and carrots. Orchard apples use a lower-resolution version of the same shape.
Mesh validation checks finite coordinates, index bounds, and outward-facing
normals. The assembled world has 23 static batches and about 131,000 vertices.

## Homepage opening

The branded opening lives on `/` only. It is a logo-only animation controlled by
`src/modules/homeIntro.js` and `src/styles/home-intro.css`. It waits for the logo,
fonts and hero images, then lifts the pale curtain to reveal the homepage. There
is no bottle, canvas or video in the opening. Skip, reduced motion, an eight-second
watchdog, focus restoration and idempotent cleanup remain supported.

The 3D route opens directly and has no intro markup or controller. Homepage-only
placement and loading lifecycle checks pass, as does the production build.
