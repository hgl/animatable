// Copyright 2014 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
//     You may obtain a copy of the License at
//
// http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//     See the License for the specific language governing permissions and
// limitations under the License.
//
// Changed by Glen Huang(hey.hgl at gmail) to use es2015 syntax
function cubic(a, b, c, d) {
	if (a < 0 || a > 1 || c < 0 || c > 1) {
		return linear;
	}
	return function(x) {
		let start = 0, end = 1;
		while (1) {
			let mid = (start + end) / 2;
			function f(a, b, m) { return 3 * a * (1 - m) * (1 - m) * m + 3 * b * (1 - m) * m * m + m * m * m};
			let xEst = f(a, c, mid);
			if (Math.abs(x - xEst) < 0.001) {
				return f(b, d, mid);
			}
			if (xEst < x) {
				start = mid;
			} else {
				end = mid;
			}
		}
	}
}

let Start = 1;
let Middle = 0.5;
let End = 0;

function step(count, pos) {
	return function(x) {
		if (x >= 1) {
			return 1;
		}
		let stepSize = 1 / count;
		x += pos * stepSize;
		return x - x % stepSize;
	}
}

let presets = {
	"ease": cubic(0.25, 0.1, 0.25, 1),
	"ease-in": cubic(0.42, 0, 1, 1),
	"ease-out": cubic(0, 0, 0.58, 1),
	"ease-in-out": cubic(0.42, 0, 0.58, 1),
	"step-start": step(1, Start),
	"step-middle": step(1, Middle),
	"step-end": step(1, End)
};

let numberString = "\\s*(-?\\d+\\.?\\d*|-?\\.\\d+)\\s*";
let cubicBezierRe = new RegExp("cubic-bezier\\(" + numberString + "," + numberString + "," + numberString + "," + numberString + "\\)");
let stepRe = /steps\(\s*(\d+)\s*,\s*(start|middle|end)\s*\)/;
let linear = function(x) { return x; };

export default function easingFunction(easing) {
    let cubicData = cubicBezierRe.exec(easing);
	if (cubicData) {
		return cubic.apply(this, cubicData.slice(1).map(Number));
	}
	let stepData = stepRe.exec(easing);
	if (stepData) {
		return step(Number(stepData[1]), {"start": Start, "middle": Middle, "end": End}[stepData[2]]);
	}
	let preset = presets[easing];
	if (preset) {
		return preset;
	}
	return linear;
}
