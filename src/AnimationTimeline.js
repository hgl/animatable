export default class AnimationTimeline {
	constructor(originTime) {
		this._ticking = false;
		this._animations = [];
		this._originTime = originTime;
		this._currentTime = performance.now();
	}

	play(effect = null) {
		let anim = new Animation(effect, this);
		this._addAnimation(anim);
		anim.play();
		return anim;
	}

	getAnimations() {
		return this._animations.slice();
	}

	get currentTime() {
		if (this._currentTime === null) {
			Promise.resolve().then(() => {
				if (!this._ticking) this._currentTime = null;
			});
			return this._currentTime = performance.now() - this._originTime;
		}
		return this._currentTime;
	}

	_setAbsoluteTime(time) {
		this._currentTime = time - this._originTime;
	}

	_startTicking() {
		if (this._ticking || !this._hasRunningAnimation()) return;
		this._ticking = true;
		requestAnimationFrame(this._tick.bind(this));
	}

	_hasRunningAnimation() {
		return this._animations.some(anim => anim.playState === "running");
	}

	_tick(time) {
		this._setAbsoluteTime(time);
		let anims = this._animations;
		let hasRunningAnim = false;
		for (let i = 0; i < anims.length; i++) {
			let anim = anims[i];
			anim._update();
			if (anim.playState === "running") hasRunningAnim = true;
		}
		if (!hasRunningAnim) {
			this._ticking = false;
			this._currentTime = null;
			return;
		}
		requestAnimationFrame(this._tick.bind(this));
	}

	_removeAnimation(anim) {
		let i = this._animations.indexOf(anim);
		if (i === -1) return;
		this._animations.splice(i, 1);
	}

	_addAnimation(newAnim) {
		let index = 0;
		let anims = this._animations;
		for (var i = 0; i < anims.length; i++) {
			let anim = anims[i];
			if (newAnim === anim) return;
			if (newAnim._sequenceNumber > anim._sequenceNumber) index = i + 1;
		}
		anims.splice(i, 0, newAnim);
	}
}
