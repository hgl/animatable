# Animatable

A polyfill for the [Web Animations](http://w3c.github.io/web-animations/) spec.


Implemented `AnimationTimeline`, `Animation`, `KeyframeEffect` (only its `AnimationEffect` part). All other code borrowed from [web-animations-next](https://github.com/web-animations/web-animations-next).

## Usage

```
$ npm install -g jspm
$ jspm install
$ make
```

Look for the `animatable.js` file in the root folder.

## Differences with web-animations-next:

- Closely follow the spec algorithms.
- Implement the new APIs.
- Live animation timing modification.

```js
var anim = elem.animate([
	{opacity: 1}, { opacity: 0 }
], { duration: 100, fill: "forwards"});
anim.finished.then(function () {
	anim.effect.timing.fill = "none";
	console.log(elem.style.opacity);
});
```

## Deviations from the spec

- Stop periodically updating the timeline if none of the associated animations is running.
  - But reading its current time should still give the correct result.
- Same limitations as web-animations-next (e.g., no additive animation).

## Caution

- Only manually tested. Very alpha.
- Written in es2015, require shims in older browsers.
