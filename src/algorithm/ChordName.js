import Tone from './Tone'
import { is } from './helper'

// 和弦名称推导
export default class ChordName {
	// 获取两个音的间隔跨度
	getToneSpace(tonePre, toneNext) {
		let toneSpace = Tone.findKeyIndex(toneNext) - Tone.findKeyIndex(tonePre);
		return toneSpace = toneSpace < 0 ? toneSpace + 12 : toneSpace;
	}
	// 大三度
	isMajorThird(tonePre, toneNext) {
		return this.getToneSpace(tonePre, toneNext) === 4;
	}
	// 小三度
	isMinorThird(tonePre, toneNext) {
		return this.getToneSpace(tonePre, toneNext) === 3;
	}
	// 增三度
	isMajorMajorThird(tonePre, toneNext) {
		return this.getToneSpace(tonePre, toneNext) === 5;
	}
	// 减三度
	isMinorMinorThird(tonePre, toneNext) {
		return this.getToneSpace(tonePre, toneNext) === 2;
	}
	// 大三和弦
	isMajorChord(chordTone) {
		return this.isMajorThird(chordTone[0], chordTone[1]) && this.isMinorThird(chordTone[1], chordTone[2]);
	}
	// 小三和弦 m
	isMinorChord(chordTone) {
		return this.isMinorThird(chordTone[0], chordTone[1]) && this.isMajorThird(chordTone[1], chordTone[2]);
	}
	// 增三和弦 aug
	isAugmentedChord(chordTone) {
		return this.isMajorThird(chordTone[0], chordTone[1]) && this.isMajorThird(chordTone[1], chordTone[2]);
	}
	// 减三和弦 dim
	isDiminishedChord(chordTone) {
		return this.isMinorThird(chordTone[0], chordTone[1]) && this.isMinorThird(chordTone[1], chordTone[2]);
	}
	// 挂四和弦
	isSus4(chordTone) {
		return this.isMajorMajorThird(chordTone[0], chordTone[1]) && this.isMinorMinorThird(chordTone[1], chordTone[2]);
	}
	// 大小七和弦/属七和弦 7 / Mm7
	isMajorMinorSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isMajorChord(chordTone) && this.isMinorThird(chordTone[2], chordTone[3]);
	}
	// 小大七和弦 mM7
	isMinorMajorSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isMinorChord(chordTone) && this.isMajorThird(chordTone[2], chordTone[3]);
	}
	// 大七和弦 maj7 / M7
	isMajorMajorSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isMajorChord(chordTone) && this.isMajorThird(chordTone[2], chordTone[3]);
	}
	// 小七和弦 m7 / mm7
	isMinorMinorSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isMinorChord(chordTone) && this.isMinorThird(chordTone[2], chordTone[3]);
	}
	// 减七和弦 dim7
	isDiminishedSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isDiminishedChord(chordTone) && this.isMinorThird(chordTone[2], chordTone[3]);
	}
	// 半减七和弦 m7-5
	isHalfDiminishedSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isDiminishedChord(chordTone) && this.isMajorThird(chordTone[2], chordTone[3]);
	}
	// 增属七和弦  7#5 / M7+5
	isHalfAugmentedSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isAugmentedChord(chordTone) && this.isMinorMinorThird(chordTone[2], chordTone[3]);
	}
	// 增大七和弦 aug7 / Maj7#5
	isAugmentedSeventhChord(chordTone) {
		if (chordTone.length < 4) return false;
		return this.isAugmentedChord(chordTone) && this.isMinorThird(chordTone[2], chordTone[3]);
	}
	// 获取音对应的根音和弦名
	getKeyName(key) {
		let keyName = Tone.intervalMap[Tone.findKeyIndex(key)];
		if (is(keyName)('Array')) {
			keyName = /b/.test(key) ? keyName[1] : keyName[0];
		};
		return keyName;
	}
	// 计算和弦名
	getChordName(chordTone) {
		let rootKey = chordTone[0];
		// 和弦的字母名
		let chordRootName = this.getKeyName(rootKey);
		// 和弦字母后面的具体修饰名
		let suffix = '...';
		let suffixArr = [];
		// 三音和弦的遍历方法及对应修饰名
		let chord3SuffixMap = [{
			fn: this.isMajorChord,
			suffix: ''
		}, {
			fn: this.isMinorChord,
			suffix: 'm'
		}, {
			fn: this.isAugmentedChord,
			suffix: 'aug'
		}, {
			fn: this.isDiminishedChord,
			suffix: 'dim'
		}, {
			fn: this.isSus4,
			suffix: 'sus4'
		}];
		// 四音和弦的遍历方法及对应修饰名
		let chord4SuffixMap = [{
			fn: this.isMajorMinorSeventhChord,
			suffix: '7'
		}, {
			fn: this.isMinorMajorSeventhChord,
			suffix: 'mM7'
		}, {
			fn: this.isMajorMajorSeventhChord,
			suffix: 'maj7'
		}, {
			fn: this.isMinorMinorSeventhChord,
			suffix: 'm7'
		}, {
			fn: this.isDiminishedSeventhChord,
			suffix: 'dim7'
		}, {
			fn: this.isHalfDiminishedSeventhChord,
			suffix: 'm7-5'
		}, {
			fn: this.isHalfAugmentedSeventhChord,
			suffix: '7#5'
		}, {
			fn: this.isAugmentedSeventhChord,
			suffix: 'aug7'
		}];
		if (chordTone.length === 3) {
			suffixArr = chord3SuffixMap.find((item) => {
				return item.fn.call(this, chordTone);
			});
			suffix = suffixArr ? suffixArr.suffix : '';
		} else if (chordTone.length === 4) {
			suffixArr = chord4SuffixMap.find((item) => {
				return item.fn.call(this, chordTone);
			});
			suffix = suffixArr ? suffixArr.suffix : '';
		}
		// 拼接起来得到完整的和弦名
		return chordRootName + suffix;
	}
}
