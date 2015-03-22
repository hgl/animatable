import "./KeyframeEffect";
import "./timeline";

Element.prototype.animate = function (effect, options) {
	let effect = new KeyframeEffect(this, effect, options);
	return document.timeline.play(effect);
};

Element.prototype.getAnimations = function () {
	return document.timeline.getAnimations().filter(anim => {
		return anim.effect && anim.effect.target === this;
	}).sort((a, b) => a._sequenceNumber - b._sequenceNumber);
};
