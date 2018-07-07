import Tone from './Tone'
import { is } from './helper'


// 吉他和弦推导类
export default class GuitarChord {
	constructor() {
		// 吉他的最大品格数
		this.fretLength = 15;
		// 构建1到6弦的初始音
		this.initialTone = [
			new Tone('3.', 1, 0),
			new Tone('7', 2, 0),
			new Tone('5', 3, 0),
			new Tone('2', 4, 0),
			new Tone('.6', 5, 0),
			new Tone('.3', 6, 0)
		];
		// 用于吉他上所有位置对应的音
		this.toneMap = [];
		// 从1到6弦，从品数的低到高，依次计算每个位置的音
		for (let string = 1; string <= this.initialTone.length; string++) {
			this.toneMap[string] = [];
			for (let fret = 0; fret <= this.fretLength; fret++) {
				this.toneMap[string].push(this.initialTone[string - 1].step(fret));
			}
		}
	}
	// 在指定的品格数范围内，查找某个音在某根弦的音域下所有的品格位置
	/*
	 * @param key 搜寻的音（字符串形式）
	 * @param toneArray 音域数组，即某根弦上所有单音类按顺序组成的数组
	 * @param fretStart 搜寻的最低品格数
	 * @param fretEnd 搜寻的最高品格数
	 */
	findFret(key, stringIndex, fretStart, fretEnd) {
		const toneArray = this.toneMap[stringIndex]
		key = key.replace(/\./g, '');
		let fretArray = [];
		fretStart = fretStart ? fretStart : 0;
		fretEnd = fretEnd ? (fretEnd + 1) : toneArray.length;
		for (let i = fretStart; i < fretEnd; i++) {
			if (is(toneArray[i])('Array')) {
				let toneStringArray = toneArray[i].map((item) => {
					return item.toneNormal;
				});
				if (toneStringArray.includes(key)) {
					fretArray.push(i);
				}
			} else {
				if (toneArray[i].toneString.replace(/\./g, '') === key) {
					fretArray.push(i);
				}
			}
		}
		return fretArray;
	}

	// 递归遍历范围内的指定和弦的所有位置组合
	/*
	 * @param stringIndex 当前遍历到的弦的序号
	 * @param toneIndex 上一根弦使用的音的序号（用于相邻的两根弦的音不重复）
	 * @param fretStart 遍历的最低品格数
	 * @param fretEnd 遍历的最高品格数
	 * @param preResult 上一根弦确定的音的结果
	 * @param positionSave 保存该轮递归的结果
	 */
	calc(stringIndex, toneIndex, fretStart, fretEnd, preResult, positionSave) {
		let result = false;
		// 从和弦音的数组里逐个选出音进行试探
		for (let i = 0; i < this.chordTone.length; i++) {
			// 相邻的上一根弦已使用的音不做本次计算
			if (i !== toneIndex) {
				let resultNext = false;
				let toneKey = this.chordTone[i];
				// 在品格范围内查找当前音的位置
				let fret = this.findFret(toneKey, stringIndex, fretStart, fretEnd);
				// 品格范围内存在该音
				if (fret.length > 0) {
					// 记录该音的位置，几弦几品与音的数字描述
					let resultNow = {
						string: stringIndex,
						fret: fret[0],
						key: toneKey
					}
					// 在本次记录上保存上一根弦的结果，方便回溯
					resultNow.pre = preResult ? preResult : null;
					// 保存本次结果
					positionSave.push(resultNow);
					// 设置该弦上的结果标记
					resultNext = true;
					// 没有遍历完所有6根弦，则继续往下一根弦计算，附带上本次的结果记录
					if (stringIndex < this.initialTone.length) {
						let nextStringIndex = stringIndex + 1;
						// 该弦上的结果的有效标记，取决上它后面的弦的结果均有效
						resultNext = resultNext && this.calc(nextStringIndex, i, fretStart, fretEnd, resultNow, positionSave);
					} else {
						// 所有弦均遍历成功，代表递归结果有效
						resultNext = true;
					}
					// 在该弦的计算结果无效，吐出之前保存的该弦结果
					if (!resultNext) {
						positionSave.pop();
					}
				} else {
					// 品格范围内不存在该音
					resultNext = false;
				}
				// 任意一个和弦里的音，能在该弦取得有效结果，则该弦上的结果有效
				result = result || resultNext;
			}
		};
		return result;
	}
	// 和弦组成音完整性过滤
	integrityFilter(preResult) {
		return preResult.filter((chordItem) => {
			let keyCount = [...new Set(chordItem.map(item => item.key).filter(key => key != null))].length;
			return keyCount === this.chordTone.length;
		});
	}
	// 按弦手指数量过滤
	fingerFilter(preResult) {
		return preResult.filter((chordItem) => {
			// 按弦的最小品位
			let minFret = Math.min.apply(null, chordItem.map(item => item.fret).filter(fret => (fret != null)));
			// 记录需要的手指数量
			let fingerNum = minFret > 0 ? 1 : 0;
			chordItem.forEach((item) => {
				if (item.fret != null && item.fret > minFret) {
					fingerNum++;
				}
			});
			return fingerNum <= 4;
		});
	}
	// 根音条件过滤
	rootToneFilter(preResult) {
		let nextResult = new Set();
		preResult.forEach((item) => {
			// 允许发声的弦的总数，初始为6
			let realStringLength = 6;
			// 从低音弦到高音弦遍历，不符合根音条件则禁止其发声
			for (var i = item.length - 1; i >= 0; i--) {
				if (item[i].key !== this.rootTone) {
					item[i].fret = null;
					item[i].key = null;
					realStringLength--;
				} else {
					break;
				}
			}
			if (realStringLength >= 4) {
				// 去重复
				nextResult.add(JSON.stringify(item));
			}
		});
		// 去重后的Set解析成对应数组返回
		return [...nextResult].map(item => JSON.parse(item));
	}
	// 和弦指法过滤器
	filter(positionSave) {
		// 从6弦开始回溯记录的和弦指法结果，拆解出所有指法组合
		let allResult = positionSave.filter((item) => {
			return item.string === this.initialTone.length
		}).map((item) => {
			let resultItem = [{
				string: item.string,
				fret: item.fret,
				key: item.key
			}];
			while (item.pre) {
				item = item.pre;
				resultItem.unshift({
					string: item.string,
					fret: item.fret,
					key: item.key
				});
			}
			return resultItem;
		});
		if (allResult.length > 0) {
			// 依次调用各个过滤器
			return this.integrityFilter(this.fingerFilter(this.rootToneFilter(allResult)));
		} else {
			return [];
		}
	}
	// 和弦指法计算入口
	chord() {
		let chordTone;
		if (is(arguments[0])('Array')) {
			chordTone = arguments[0];
		} else {
			chordTone = Array.prototype.slice.apply(arguments).map((item) => {
				let tone = new Tone(item.toString());
				return tone.flat + tone.sharp + tone.key;
			});
		}
		// 和弦组成音
		this.chordTone = chordTone;
		// 根音
		this.rootTone = chordTone[0];
		this.chordResult = [];
		let fretArray = [];
		// 查找和弦里的音可能存在的品格位置，保存至fretArray
		chordTone.forEach((item) => {
			for (let i = 1; i < this.toneMap.length; i++) {
				fretArray = fretArray.concat(this.findFret(item, i));
			}
		});
		fretArray = [...new Set(fretArray)];
		// 品格位置从小到大排序
		fretArray.sort((a, b) => {
			return a - b;
		});
		// 从低把位到高把位，计算范围内的所有该和弦指法
		for (let i = 0; i < fretArray.length; i++) {
			let fretStart = fretArray[i];
			// 在不需要使用大横按时，即在最低的把位计算时，可把计算的品格范围扩大一格
			let fretEnd = fretStart > 0 ? (fretStart + 4) : (fretStart + 5);
			// 最高范围不能超过吉他的最高品格数
			if (fretEnd <= this.fretLength) {
				let positionSave = [];
				// 从1弦开始启动递归计算
				if (this.calc(1, null, fretStart, fretEnd, null, positionSave)) {
					// 单次结果过滤并保存
					this.chordResult.push(...this.filter(positionSave));
				}
			}
		}
		// 结果去重
		let result = [...new Set(this.chordResult.map(item => JSON.stringify(item)))].map(item => JSON.parse(item));
		return result;
	}
}
