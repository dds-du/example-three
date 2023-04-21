import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";

export function createPoint(code, point) {
	let pointDiv = document.createElement("div");
	pointDiv.className = `default_point`;
	pointDiv.setAttribute("name", code);
	let pointObject = new CSS2DObject(pointDiv);
	pointObject.name = code;
	pointObject.position.set(point.x, point.y, point.z);
	return { pointObject, pointDiv };
}

export function createLine(code, startObj, point) {
	const { length, deg } = calculationLenghtAndAngle(startObj);
	const lineDiv = document.createElement("div");
	lineDiv.className = `line_box`;
	lineDiv.setAttribute("name", code);
	const div = document.createElement("div");
	div.className = `line`;
	lineDiv.style.top = -length / 2 + "px";
	lineDiv.style.left = 0 + "px";
	lineDiv.style.height = length + "px";
	div.style.transformOrigin = `center bottom`;
	div.style.transform = `rotate(${deg}deg)`;
	lineDiv.appendChild(div);
	let lineObject = new CSS2DObject(lineDiv);
	lineObject.name = code;
	lineObject.position.set(point.x, point.y, point.z);
	return {
		lineDiv,
		lineObject
	};
}
export function updateLine(startObj, code) {
	const { length, deg } = calculationLenghtAndAngle(startObj);
	const dom = Array.from(document.getElementsByName(code)).find(
		(i) => i.className === "line_box"
	);
	if (dom) {
		const line = dom.childNodes[0];
		dom.style.top = -length / 2 + "px";
		dom.style.left = 0 + "px";
		dom.style.height = length + "px";
		line.style.transformOrigin = `center bottom`;
		line.style.transform = `rotate(${deg}deg)`;
	}
}
export function calculationLenghtAndAngle(el) {
	// clientHeight offsetTop 差距不大 边框像素问题
	// 左上角坐标
	var y_start1 = el.offsetTop - el.clientHeight / 2;
	var x_start1 = el.offsetLeft - el.clientWidth / 2 + 2;

	// // 右上角坐标
	var y_start2 = el.offsetTop - el.clientHeight / 2;
	var x_start2 = el.offsetLeft + el.clientWidth / 2 + 2;

	// // 左下角坐标
	var y_start3 = el.offsetTop + el.clientHeight / 2;
	var x_start3 = el.offsetLeft - el.clientWidth / 2;

	// // 右下角坐标
	var y_start4 = el.offsetTop + el.clientHeight / 2;
	var x_start4 = el.offsetLeft + el.clientWidth / 2;

	// //计算连线长度
	// 左上角长度
	var length1 = Math.sqrt(Math.pow(y_start1, 2) + Math.pow(x_start1, 2));
	// 右上角
	var length2 = Math.sqrt(Math.pow(y_start2, 2) + Math.pow(x_start2, 2));
	// 左下角
	var length3 = Math.sqrt(Math.pow(y_start3, 2) + Math.pow(x_start3, 2));
	// 右下角
	var length4 = Math.sqrt(Math.pow(y_start4, 2) + Math.pow(x_start4, 2));
	// //弧度值转换为角度值
	var deg = 0;
	var length = 0;
	switch (Math.min(length1, length2, length3, length4)) {
	case length1:
		deg = getYAngle(x_start1, y_start1, 1, 1);
		length = length1;
		break;
	case length2:
		deg = getYAngle(x_start2, y_start2, 1, 1);
		length = length2;
		break;
	case length3:
		deg = getYAngle(x_start3, y_start3, 1, 1);
		length = length3;
		break;
	case length4:
		deg = getYAngle(x_start4, y_start4, 1, 1);
		length = length4;
		break;

	default:
		deg = 0;
		break;
	}
	return {
		length,
		deg
	};
}
export function getYAngle(cx, cy, x2, y2) {
	let x = Math.abs(cx - x2);
	let y = Math.abs(cy - y2);
	let tan = x / y;
	let radina = Math.atan(tan); //用反三角函数求弧度
	// let angle = Math.floor(180 / (Math.PI / radina)) || 0; //将弧度转换成角度
	let angle = 180 / (Math.PI / radina) || 0; //将弧度转换成角度
	if (x2 > cx && y2 > cy) {
		// point在第四象限
		angle = -1 * angle;
	}
	if (x2 === cx && y2 > cy) {
		// point在y轴负方向上
		angle = 0;
	}
	if (x2 < cx && y2 > cy) {
		//point在第三象限
		// eslint-disable-next-line no-self-assign
		angle = angle;
	}
	if (x2 < cx && y2 === cy) {
		//point在x轴负方向
		angle = 90;
	}
	if (x2 < cx && y2 < cy) {
		// point在第二象限

		angle = 180 - angle;
	}
	if (x2 === cx && y2 < cy) {
		//point在y轴正方向上
		angle = 180;
	}
	if (x2 > cx && y2 < cy) {
		//point在第一象限
		angle = 180 + angle;
	}

	if (x2 > cx && y2 === cy) {
		//point在x轴正方向上
		angle = -90;
	}

	return angle;
}
// 空间转二维坐标
export function transPosition(position) {
	let world_vector = new THREE.Vector3(position.x, position.y, position.z);
	let vector = world_vector.project(this.camera);
	let width = this.dom.clientWidth / 2;
	let height = this.dom.clientHeight / 2;
	return {
		x: Math.round(vector.x * width + width),
		y: Math.round(-vector.y * height + height)
	};
}

/**
 * 获取标签连线所在位置
 * @param {*} el
 * @returns 上左 | 上右 | 下左 | 下右
 */
export function getLineMarkLabel(el) {
	// 左上角坐标
	const y_start1 = el.offsetTop - el.clientHeight / 2;
	const x_start1 = el.offsetLeft - el.clientWidth / 2 + 2;

	// // 右上角坐标
	const y_start2 = el.offsetTop - el.clientHeight / 2;
	const x_start2 = el.offsetLeft + el.clientWidth / 2 + 2;

	// // 左下角坐标
	const y_start3 = el.offsetTop + el.clientHeight / 2;
	const x_start3 = el.offsetLeft - el.clientWidth / 2;

	// // 右下角坐标
	const y_start4 = el.offsetTop + el.clientHeight / 2;
	const x_start4 = el.offsetLeft + el.clientWidth / 2;

	// //计算连线长度
	// 左上角长度
	const length1 = Math.sqrt(Math.pow(y_start1, 2) + Math.pow(x_start1, 2));
	// 右上角
	const length2 = Math.sqrt(Math.pow(y_start2, 2) + Math.pow(x_start2, 2));
	// 左下角
	const length3 = Math.sqrt(Math.pow(y_start3, 2) + Math.pow(x_start3, 2));
	// 右下角
	const length4 = Math.sqrt(Math.pow(y_start4, 2) + Math.pow(x_start4, 2));

	const lengthObj = {};
	lengthObj[length1] = '上左';
	lengthObj[length2] = '上右';
	lengthObj[length3] = '下左';
	lengthObj[length4] = '下右';

	const minLength = Math.min(length1, length2, length3, length4);

	return lengthObj[minLength];
}

/**
 * 防抖函数
 * @param {*} func 回调函数  必传
 * @param {*} wait 等待时长 默认500ms 可不传
 */
let timeOut;
export function debounce(func, wait = 500) {
	return function () {
		let content = this;
		let arg = arguments;
		if (timeOut) {
			clearTimeout(timeOut);
		}
		timeOut = setTimeout(() => {
			func.apply(content, arg);
		}, wait);
	};
}
