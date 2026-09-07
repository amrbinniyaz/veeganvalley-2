import ScrollTrigger from "gsap/ScrollTrigger";

/**
 * The three clips in the insider section.
 *
 * Playback is tied to visibility rather than left running: three simultaneous
 * video decodes cost real CPU, and on a page whose whole point is a 60fps
 * scroll scrub, decoding footage nobody can see competes directly with the
 * thing the user is actually looking at.
 *
 * Autoplay only survives muted, so the clips start silent and the button
 * un-mutes. Un-muting one stops the others — three soundtracks at once is
 * never what anyone wants.
 */
/**
 * Which clips have a sound track, written by whichever script produced them.
 *
 * The page cannot determine this itself. A muted <video> decodes no audio, so
 * `webkitAudioDecodedByteCount` reads 0 for a silent clip and a sound-track
 * clip alike, and there is no cross-browser way to ask before playback. The
 * encoder knows for certain, so it records the answer and we read it.
 */
async function loadAudioMap() {
  try {
    const res = await fetch("/video/clips.json");
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export function initVideo() {
  const videos = [...document.querySelectorAll("[data-video]")];
  if (!videos.length) return;

  const play = (video) => {
    const attempt = video.play();
    // Autoplay rejection is normal (a background tab, an aggressive policy)
    // and is not worth surfacing.
    attempt?.catch?.(() => {});
  };

  videos.forEach((video) => {
    video.muted = true;
    video.pause();

    ScrollTrigger.create({
      trigger: video,
      start: "top bottom",
      end: "bottom top",
      onEnter: () => play(video),
      onEnterBack: () => play(video),
      onLeave: () => video.pause(),
      onLeaveBack: () => video.pause(),
    });

    const button = video.parentElement?.querySelector("[data-video-button]");
    if (!button) return;

    // Hidden until the manifest says otherwise: a control that does nothing is
    // worse than no control, and silent placeholder clips are the common case.
    button.hidden = true;

    button.addEventListener("click", () => {
      const unmuting = video.muted;

      if (unmuting) {
        videos.forEach((other) => {
          if (other === video) return;
          other.muted = true;
          other.parentElement
            ?.querySelector("[data-video-button]")
            ?.classList.remove("is-unmuted");
        });
      }

      video.muted = !unmuting;
      button.classList.toggle("is-unmuted", unmuting);
      button.setAttribute("aria-label", unmuting ? "Mute video" : "Unmute video");

      // Browsers may have paused a clip that was never allowed to autoplay;
      // a click is a user gesture, so this is the moment it can start.
      if (unmuting) play(video);
    });
  });

  /* Reveal the toggle only on clips the encoder recorded as having sound. */
  loadAudioMap().then((map) => {
    if (!map) return;
    videos.forEach((video) => {
      const name = (video.currentSrc || video.src).split("/").pop() ?? "";
      const key = name.replace(/\.mp4$/, "");
      const button = video.parentElement?.querySelector("[data-video-button]");
      if (button && map[key]?.audio) button.hidden = false;
    });
  });
}
