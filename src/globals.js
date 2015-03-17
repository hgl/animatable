import AnimationTimeline from "./AnimationTimeline";
import KeyframeEffect from "./KeyframeEffect";
import Animation from "./Animation";

window.AnimationTimeline = AnimationTimeline;
window.Animation = Animation;
window.KeyframeEffect = KeyframeEffect;
document.timeline = new AnimationTimeline(0);
