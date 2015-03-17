import easingFunction from "./easingFunction";
import * as style from "./style";

export default class KeyframeEffect {
	constructor(target, frames, options) {
		this.target = target;
		this._assignOptions(options);
		this._computeTiming();
		this.setFrames(frames);
	}

	_assignOptions(options) {
		let creating = true;
		let effect = this;
		let timing = {
			_delay: 0,
			get delay() {
				return this._delay;
			},
			set delay(delay) {
				delay = Number(delay);
				if (!isFinite(delay)) {
					throw new TypeError("delay must be a number");
				}
				this._delay = delay;
			},
			_endDelay: 0,
			get endDelay() {
				return this._delay;
			},
			set endDelay(endDelay) {
				endDelay = Number(endDelay);
				if (!isFinite(endDelay)) {
					throw new TypeError("endDelay must be a number");
				}
				this._endDelay = endDelay;
			},
			_fill: "none",
			get fill() {
				return this._fill;
			},
			set fill(fill) {
				fill = String(fill);
				switch (fill) {
				case "none":
				case "backwards":
				case "forwards":
				case "both":
				case "auto":
					break;
				default:
					throw new TypeError('fill mode must be one of "none", "backwards", "forwards", "both", "auto"');
				}
				if (fill === this._fill) return;
				this._fill = fill;
				if (
					creating ||
					!effect._animation ||
					effect._animation.playState === "running"
				) {
					return;
				}
				effect._update();
			},
			_iterationStart: 0,
			get iterationStart() {
				return this._iterationStart;
			},
			set iterationStart(iterationStart) {
				iterationStart = Number(iterationStart);
				if (!isFinite(iterationStart)) {
					throw new TypeError("iterationStart must be a number");
				}
				this._iterationStart = iterationStart;
			},
			_iterations: 1,
			get iterations() {
				return this._iterations;
			},
			set iterations(iterations) {
				this._iterations = Number(iterations);
			},
			_duration: 0,
			get duration() {
				return this._duration;
			},
			set duration(duration) {
				if (typeof duration === "number") {
					this._duration = Number(duration);
					return;
				}
				this._duration = String(duration);
			},
			_direction: "normal",
			get direction() {
				return this._direction;
			},
			set direction(direction) {
				direction = String(direction);
				switch (direction) {
				case "normal":
				case "reverse":
				case "alternate":
				case "alternate-reverse":
					break;
				default:
					throw new TypeError('direction must be one of "normal", "reverse", "alternate", "alternate-reverse"');
				}
				this._direction = direction;
			},
			_easing: "linear",
			_easingFunction: easingFunction("linear"),
			get easing() {
				return this._easing;
			},
			set easing(easing) {
				easing = String(easing);
				this._easing = easing;
				this._easingFunction = easingFunction(easing);
			}
		};
		let frame = {
			_name: "",
			get name() {
				return this._name;
			},
			set name(name) {
				this._name = String(name);
			},
			_iterationComposite: "replace",
			get iterationComposite() {
				return this._iterationComposite;
			},
			set iterationComposite(iterationComposite) {
				iterationComposite = String(iterationComposite);
				switch(iterationComposite) {
				case "replace":
				case "accumulate":
					break;
				default:
					throw new TypeError('iterationComposite must be one of "replace", "accumulate"')
				}
				this._iterationComposite = iterationComposite;
			},
			_composite: "replace",
			get composite() {
				return this._composite;
			},
			set composite(composite) {
				composite = String(composite);
				switch(composite) {
				case "replace":
				case "add":
				case "accumulate":
					break;
				default:
					throw new TypeError('composite must be one of "replace", "add", "accumulate"')
				}
				this._composite = composite;
			},
			spacing: "distribute",
			get spacing() {
				return this._spacing;
			},
			set spacing(spacing) {
				this._spacing = String(spacing);
			},
		};
		if (typeof options === "number" && !isNaN(options)) {
			timing.duration = options;
		} else if (options) {
			["delay", "endDelay", "fill", "iterationStart", "iterations", "duration", "direction", "easing"].forEach(name => {
				let val = options[name];
				if (val !== undefined) timing[name] = val;
			});
			["name", "iterationComposite", "composite", "spacing"].forEach(name => {
				let val = options[name];
				if (val !== undefined) frame[name] = val;
			});
		}
		creating = false;
		this.timing = timing;
		copyProperties(this, frame);
	}

	_computeTiming() {
		let timing = this.timing;
		let effect = this;
		let computed = Object.create(timing);
		copyProperties(computed, {
			get iterationStart() {
				let iterationStart = timing.iterationStart;
				if (iterationStart < 0) return 0;
				return iterationStart;
			},
			get iterations() {
				let iterations = timing.iterations;
				if (isNaN(iterations) || iterations < 0) return 1;
				return iterations;
			},
			get duration() {
				let duration = timing.duration;
				if (
					typeof duration !== "number" ||
					isNaN(duration) || duration < 0
				) {
					return 0;
				}
				return duration;
			},
			startTime: 0,
			get endTime() {
				return this.startTime + this.delay + this.activeDuration +
					this.endDelay;
			},
			get activeDuration() {
				return this.duration * this.iterations;
			},
			get localTime() {
				let inheritedTime = this._inheritedTime();
				if (inheritedTime === null) return null;
				return inheritedTime - this.startTime;
			},
			_inheritedTime() {
				if (!effect._animation) return null;
				return effect._animation.currentTime;
			},
			get timeFraction() {
				let transformedTime = this._transformedTime();
				if (transformedTime === null) return null;
				if (this.duration === 0) {
					let t = Object.create(this);
					Object.defineProperty(t, "duration", {value: 1});
					if (this.localTime < this.delay) {
						return t._transformedTime();
					}
					let normalizedActiveDuration = t.activeDuration;
					let localTime = this.delay + normalizedActiveDuration;
					Object.defineProperty(t, "localTime", {value: localTime});
					return t._transformedTime();
				}
				return transformedTime / this.duration;
			},
			_transformedTime() {
				let directedTime = this._directedTime();
				if (directedTime === null) return null;
				let duration = this.duration;
				if (duration === Infinity) return directedTime;
				let iterationFraction = duration === 0 ?
					0 : directedTime / duration;
				let scaledFraction = this._easingFunction(iterationFraction);
				if (scaledFraction === 0) return 0;
				return scaledFraction * duration;
			},
			_directedTime() {
				let iterationTime = this._iterationTime();
				if (iterationTime === null) return null;
				let direct;
				switch (this.direction) {
				case "normal":
					direct = "forwards";
					break;
				case "reverse":
					direct = "reverse";
					break;
				default:
					let d = this.currentIteration;
					if (this.direction === "alternate-reverse") d++;
					if (d === Infinity || d % 2 === 0) {
						direct = "forwards";
					} else {
						direct = "reverse";
					}
					break;
				}
				if (direct === "forwards") return iterationTime;
				return this.duration - iterationTime;
			},
			_iterationTime() {
				let scaledActiveTime = this._scaledActiveTime();
				if (scaledActiveTime === null) return null;
				if (this.duration === 0) return 0;
				if (
					scaledActiveTime - this._startOffset() === this.activeDuration &&
					this.iterations !== 0 &&
					(this.iterations + this.iterationStart) % 1 === 0
				) {
					return this.duration;
				}
				return scaledActiveTime % this.duration;
			},
			_scaledActiveTime() {
				let activeTime = this._activeTime();
				if (activeTime === null) return null;
				return activeTime + this._startOffset();
			},
			_activeTime() {
				switch (this._phase()) {
				case "before":
					switch (this.fill) {
					case "backwards":
					case "both":
						return 0;
					default:
						return null;
					}
				case "active":
					return this.localTime - this.delay;
				case "after":
					switch (this.fill) {
					case "forwards":
					case "both":
						return this.activeDuration;
					default:
						return null;
					}
				default:
					return null;
				}
			},
			_phase() {
				let localTime = this.localTime;
				if (localTime === null) return;
				if (localTime < this.delay) return "before";
				if (localTime < this.delay + this.activeDuration) return "active";
				return "after";
			},
			_startOffset() {
				if (this.iterationStart === 0) return 0;
				return this.iterationStart * this.duration;
			},
			get currentIteration() {
				let activeTime = this._activeTime();
				if (activeTime === null) return null;
				if (activeTime === 0) return Math.floor(this.iterationStart);
				if (this.duration === 0) {
					if (this.iterations === Infinity) return Infinity;
					return Math.ceil(this.iterationStart + this.iterations) - 1;
				}
				if (this._iterationTime() === this.duration) {
					return this.iterationStart + this.iterations - 1;
				}
				return Math.floor(this._scaledActiveTime() / this.duration);
			}
		});
		this.computedTiming = computed;
	}

	setFrames(frames) {
		this._frames = frames;
		this._normalizeFrames();
		let props = getProperties(this._frames);
		let segs = getSegments(props);
		this._properties = props;
		this._segments = segs;
	}

	_normalizeFrames(frames) {
		let effect = this;
		let frames = this._frames;
		let newFrames = [];
		if (!Array.isArray(frames)) frames = [frames];
		for (let i = 0; i < frames.length; i++) {
			let frame = frames[i];
			let newFrame = {
				_offset: null,
				get offset() {
					return this._offset;
				},
				set offset(offset) {
					if (offset == null) {
						this._offset = null;
						return;
					}
					offset = Number(offset);
					if (!isFinite(offset)) {
						throw new TypeError("keyframe offset must be a number or null");
					}
					this._offset = offset;
				},
				_easing: "linear",
				_easingFunction: easingFunction("linear"),
				get easing() {
					return this._easing;
				},
				set easing(easing) {
					easing = String(easing);
					this._easing = easing;
					this._easingFunction = easingFunction(easing);
				},
				_composite: effect.composite,
				get composite() {
					return this._composite;
				},
				set composite(composite) {
					if (composite == null) {
						this._composite = effect.composite;
						return;
					}
					composite = String(composite);
					switch(composite) {
					case "replace":
					case "add":
					case "accumulate":
						break;
					default:
						throw new TypeError('keyframe composite must be one of "replace", "add", "accumulate"')
					}
					this._composite = composite;
				}
			};
			Object.assign(newFrame, frame);
			newFrames.push(newFrame);
		}
		frames = newFrames;

		let prevOffset = null;
		let everyFrameHasOffset = true;
		for (let i = 0; i < frames.length; i++) {
			let frame = frames[i];
			let offset = frame.offset;
			if (offset === null) {
				everyFrameHasOffset = false;
				continue;
			}
			if (prevOffset !== null && offset < prevOffset) {
				throw new TypeError("keyframes are not loosely sorted by offset");
			}
			if (offset < 0 || offset > 1) {
				throw new TypeError("keyframe offset must be within 0 and 1");
			}
			prevOffset = offset;
		}

		if (!everyFrameHasOffset) spaceFrames(frames);
		this._frames = frames;
	}

	_update() {
		let frac = this.computedTiming.timeFraction;
		if (frac === null) {
			let names = Object.keys(this._properties);
			for (let i = 0; i < names.length; i++) {
				let name = names[i];
				style.remove(this.target, name);
			}
			return;
		}
		let segs = this._segments;
		for (let i = 0; i < segs.length; i++) {
			let seg = segs[i];
			let {name, start, end, easing, value} = seg;
			if (frac < start || frac > end) continue;
			let transformed = easing(frac);
			let val = value(transformed);
			style.set(this.target, name, val);
		}
	}
}

function copyProperties(target, source) {
	Object.getOwnPropertyNames(source).forEach(key => {
		let desc = Object.getOwnPropertyDescriptor(source, key);
		Object.defineProperty(target, key, desc);
	});
}

function spaceFrames(frames) {
	let len = frames.length;
	let last = frames[len - 1];
	if (last.offset === null) last.computedOffset = 1;
	if (len > 1) {
		let first = frames[0];
		if (first.offset === null) first.computedOffset = 0;
	}

	let prevIndex = 0;
	let prevOffset = frames[0].offset;
	for (let i = 1; i < len; i++) {
		let frame = frames[i];
		let offset = frame.offset;
		if (offset === null) continue;
		for (let j = 1, leng = i - prevIndex; j < leng; j++) {
			let computed = prevOffset + (offset - prevOffset) * j / leng;
			frames[prevIndex + j].computedOffset = computed;
		}
		prevIndex = i;
		prevOffset = offset;
	}
	return frames;
}

function getProperties(frames) {
	let props = {};
	for (let i = 0; i < frames.length; i++) {
		let frame = frames[i];
		let names = Object.keys(frame);
		for (let j = 0; j < names.length; j++) {
			let name = names[j];
			if (!isPropertyName(name)) continue;
			let segs = props[name];
			if (!segs) segs = props[name] = [];
			let seg = {
				offset: frame.computedOffset,
				easing: frame._easingFunction,
				value: frame[name],
			};
			segs.push(seg);
		}
	}
	return props;
}

function isPropertyName(name) {
	switch (name) {
	case "_offset":
	case "computedOffset":
	case "_easing":
	case "_easingFunction":
	case "_composite":
		return false;
	}
	return true;
}

function getSegments(props) {
	let newSegs = [];
	let names = Object.keys(props);
	for (let i = 0; i < names.length; i++) {
		let name = names[i];
		let segs = props[name];
		for (let j = 0; j < segs.length - 1; j++) {
			let seg = segs[j];
			let nextSeg = segs[j + 1];
			seg = {
				name: name,
				start: seg.offset,
				end: nextSeg.offset,
				easing: seg.easing,
				value: style.interpolate(name, seg.value, nextSeg.value)
			};
			newSegs.push(seg);
		}
	}
	return newSegs;
}
