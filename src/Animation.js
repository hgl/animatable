let sequenceNumber = 0;

window.Animation = class {
	constructor(effect = null, timeline = null) {
		this._sequenceNumber = sequenceNumber++;
		this._startTime = null;
		this.holdTime = null;
		this._pendingPlayTask = null;
		this._pendingPauseTask = null;
		this._prevCurrentTime = null;
		this._prevFinished = false;
		this.playbackRate = 1;
		this.ready = Promise.resolve(this);
		this._resolveReady = null;
		this._rejectReady = null;
		this.finished = new Promise((resolve, reject) => {
			this._resolveFinished = resolve;
			this._rejectFinished = reject;
		});
		this._timeline = null;
		this.timeline = timeline;
		this._effect = null;
		this.effect = effect;
	}

	_update() {
		if (this.effect) this.effect._update();
		this._updateFinishedState();
	}

	get timeline() {
		return this._timeline;
	}

	set timeline(timeline) {
		if (timeline === this._timeline) return;
		let time = this.currentTime;
		if (!timeline && this._timeline) this._resetPendingTasks();
		if (this._timeline) this._timeline._removeAnimation(this);
		if (timeline) timeline._addAnimation(this);
		this._timeline = timeline;
		if (time !== null) this._silentlySetCurrentTime(time);
		this._updateFinishedState();
		this._checkReady();
	}

	_resetPendingTasks() {
		if (this._pendingPlayTask) this._pendingPlayTask = null;
		if (this._pendingPauseTask) this._pendingPauseTask = null;
		this._rejectReady(new AbortError());
		this.ready = Promise.resolve(this);
		this._resolveReady = null;
		this._rejectReady = null;
	}

	get effect() {
		return this._effect;
	}

	set effect(effect) {
		if (effect === this._effect) return;
		if (!effect && this.effect) this._resetPendingTasks();
		// if (this._pendingPauseTask) ; TODO: reschedule task
		// if (this._pendingPlayTask) ; TODO: reschedule task
		if (effect) {
			if (effect._animation) effect._animation.effect = null;
			effect._animation = this;
		}
		if (this._effect) this._effect._animation = null;
		this._effect = effect;
		this._updateFinishedState();
		this._checkReady();
	}

	_timeliveActive() {
		return this.timeline && this.timeline.currentTime !== null;
	}

	play() {
		let hasPendingReadyPromise = false;
		if (this._pendingPlayTask) {
			this._pendingPlayTask = null;
			hasPendingReadyPromise = true;
		}
		if (this._pendingPauseTask) {
			this._pendingPauseTask = null;
			if (this._timeliveActive()) {
				this._startTime = this.timeline.current - this.holdTime / this.playbackRate;
				this.holdTime = null;
			}
			hasPendingReadyPromise = true;
		}
		let currentTime = this.currentTime
		if (this.playbackRate > 0) {
			if (
				currentTime === null ||
				currentTime < 0 ||
				currentTime >= this._effectEnd()
			) {
				this.holdTime = 0;
			}
		} else if (this.playbackRate < 0) {
			if (
				currentTime === null ||
				currentTime <= 0 ||
				currentTime > this._effectEnd()
			) {
				this.holdTime = this._effectEnd();
			}
		} else if (currentTime === null) {
			this.holdTime = 0;
		}
		if (this.holdTime === null) {
			if (hasPendingReadyPromise) this._resolveReady(this);
			return;
		}
		this._startTime = null;
		if (!hasPendingReadyPromise) {
			this.ready = new Promise((resolve, reject) => {
				this._resolveReady = resolve;
				this._rejectReady = reject;
			});
		}
		this._pendingPlayTask = () => {
			this._pendingPlayTask = null;
			if (this.holdTime === null) return;
			let startTime = this.timeline.currentTime;
			if (this.playbackRate !== 0) {
				startTime -= this.holdTime / this.playbackRate;
				this.holdTime = null;
			}
			this._startTime = startTime;
			this._resolveReady(this);
			this._updateFinishedState();
			this.timeline._startTicking();
		};
		if (!this._checkReady()) this._updateFinishedState();
	}

	_checkReady() {
		let ready = !!(this.effect && this._timeliveActive());
		if (this._pendingPlayTask && ready) {
			this.effect._update();
			this._pendingPlayTask();
		}
		return ready;
	}

	get startTime() {
		return this._startTime;
	}

	set startTime(startTime) {
		if (startTime !== null) {
			startTime = Number(startTime);
			if (isNaN(startTime)) startTime = null;
		}
		let timelineTime;
		if (!this._timeliveActive()) {
			timelineTime = null;
			if (startTime !== null) this.holdTime = null;
		} else {
			timelineTime = this.timeline.currentTime;
		}
		let prevCurrentTime = this.currentTime;
		this._startTime = startTime;
		if (startTime !== null) {
			if (this.playbackRate !== 0) this.holdTime = null;
		} else {
			this.holdTime = prevCurrentTime;
		}
		let hasPendingTask = false;
		if (this._pendingPlayTask) {
			this._pendingPlayTask = null;
			hasPendingTask = true;
		}
		if (this._pendingPauseTask) {
			this._pendingPauseTask = null;
			hasPendingTask = true;
		}
		if (hasPendingTask) this._resolveReady(this);
		this._updateFinishedState();
	}

	_effectEnd() {
		if (!this.effect) return 0;
		return this.effect.computedTiming.endTime;
	}

	_updateFinishedState() {
		let currentTime = this.currentTime;
		if (
			this.startTime !== null &&
			!(this._pendingPlayTask || this._pendingPauseTask)
		) {
			let end;
			if (
				this.playbackRate > 0 &&
				currentTime !== null &&
				currentTime >= (end = this._effectEnd())
			) {
				if (this._prevCurrentTime === null) {
					this.holdTime = end;
				} else {
					this.holdTime = Math.max(this._prevCurrentTime, end);
				}
			} else if (
				this.playbackRate < 0 &&
				currentTime !== null &&
				currentTime <= 0
			) {
				this.holdTime = 0;
			} else if (currentTime !== null && this.playbackRate !== 0) {
				this.holdTime = null;
			}
		}
		let finished = this.playState === "finished";
		if (finished && !this._prevFinished) {
			this._resolveFinished(this);
		} else if (!finished && this._prevFinished) {
			this.finished = new Promise((resolve, reject) => {
				this._resolveFinished = resolve;
				this._rejectFinished = reject;
			});
		}
		this._prevFinished = finished;
		this._prevCurrentTime = currentTime;
	}

	get playState() {
		if (this._pendingPlayTask || this._pendingPauseTask) return "pending";
		if (this.currentTime === null) return "idle";
		if (this.startTime === null) return "paused";
		if (
			this.playbackRate > 0 && this.currentTime >= this._effectEnd() ||
			this.playbackRate < 0 && this.currentTime <= 0
		) {
			return "finished";
		}
		return "running";
	}

	get currentTime() {
		if (this.holdTime !== null) return this.holdTime;
		if (!this._timeliveActive() || this.startTime === null) return null;
		return (this.timeline.currentTime - this.startTime) * this.playbackRate;
	}

	set currentTime(time) {
		if (time !== null) {
			time = Number(time);
			if (isNaN(time)) time = null;
		}
		this._silentlySetCurrentTime(time);
		if (this._pendingPauseTask) {
			this._pendingPauseTask = null;
			this._resolveReady(this);
		}
		this._updateFinishedState();
	}

	_silentlySetCurrentTime(time) {
		if (time === null) {
			if (this.currentTime !== null) {
				throw new TypeError("can not set non-idle animation's current time to null");
			}
			return;
		}
		if (
			this.holdTime !== null ||
			!this._timeliveActive() ||
			this.playbackRate === 0 ||
			this._pendingPauseTask
		) {
			this.holdTime = time;
		} else {
			this._startTime = this.timeline.currentTime - (time / this.playbackRate);
		}
		if (!this._timeliveActive()) this._startTime = null;
		this._prevCurrentTime = null;
	}

	pause() {
		if (this._pendingPauseTask) return;
		let hasPendingReadyPromise = false;
		if (this._pendingPlayTask) {
			this._pendingPlayTask = null;
			hasPendingReadyPromise = true;
		}
		this.holdTime = this.currentTime;
		if (!hasPendingReadyPromise) {
			this.ready = new Promise((resolve, reject) => {
				this._resolveReady = resolve;
				this._rejectReady = reject;
			});
		}
		this._pendingPauseTask = () => {
			this._pendingPauseTask = null;
			this.holdTime = this.currentTime;
			this._startTime = null;
			this._resolveReady(this);
			this._updateFinishedState();
		};
		Promise.resolve().then(() => {
			if (this._pendingPauseTask) this._pendingPauseTask();
		});
		this._updateFinishedState();
	}
}
