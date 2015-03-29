import "./AnimationTimeline";

Object.defineProperty(document, "timeline", {
	value: new AnimationTimeline(0),
	configurable: true,
	enumerable: true,
});
