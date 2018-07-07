export function is(data) {
	return function(type) {
		return Object.prototype.toString.call(data) === `[object ${type}]`;
	}
}
