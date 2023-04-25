<template>
	<a-config-provider :locale="locale">
		<div class="container">
			<div class="three-ref" id="threeRef"></div>
			<footer class="footer">
				<a-button type="primary" @click="saveData">保存</a-button>
			</footer>
		</div>

		<a-modal title="标签修改" v-model:visible="isVisible" @ok="editLabelOk">
			<a-input v-model:value="editValue"></a-input>
		</a-modal>
	</a-config-provider>
</template>

<script lang="ts">
interface PointData {
	code: String;
	label: string;
	x: Number;
	y: Number;
	z: Number;
	left: Number;
	top: Number;
}

import { createPoint, createLine, updateLine } from './service/three-service';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextureLoader } from 'three/src/loaders/TextureLoader';
import { CSS2DRenderer, CSS2DObject } from 'three/examples/jsm/renderers/CSS2DRenderer';
import { defineComponent, TableHTMLAttributes } from 'vue';
import zhCN from 'ant-design-vue/es/locale/zh_CN';

let scene: THREE.Scene,
	camera: THREE.Camera,
	renderer: THREE.WebGLRenderer,
	labelRenderer: CSS2DRenderer,
	controls: OrbitControls,
	mesh: THREE.Mesh;

export default defineComponent({
	name: 'ThreeComponent',
	data() {
		return {
			dialogTableData: [],
			container: null,
			requestAnimationId: null,
			locale: zhCN,
			isVisible: false,
			editingLabel: '',
			editValue: ''
		};
	},
	props: {
		pointList: Array,
		modelSrc: {
			type: String,
			default: '/static/111.jpeg'
		}
	},
	mounted() {
		this.container = document.getElementById('threeRef');
		this.container.addEventListener('dblclick', this.onMouseClick);
		this.initThree();
		this.animate();

		window.addEventListener('resize', this.windowResize);
	},
	unmounted() {
		cancelAnimationFrame(this.requestAnimationId);
		window.removeEventListener('resize', this.windowResize);
	},
	methods: {
		initThree() {
			scene = new THREE.Scene();
			//
			let point = new THREE.PointLight(0xffffff);
			point.position.set(400, 200, 300);
			scene.add(point);

			//
			let ambient = new THREE.AmbientLight(0x444444);
			scene.add(ambient);

			//
			let width = this.container.offsetWidth;
			let height = this.container.offsetHeight;
			let k = width / height;
			let s = 500;

			//
			camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 500);
			camera.position.set(0, 0, s); //
			camera.lookAt(scene.position); //

			//
			renderer = new THREE.WebGLRenderer({
				antialias: true,
				logarithmicDepthBuffer: true,
				alpha: true
			});
			renderer.setPixelRatio(window.devicePixelRatio);
			renderer.setSize(width, height); //
			renderer.setClearColor(0xb9d3ff, 1); //
			this.container.appendChild(renderer.domElement); //

			labelRenderer = new CSS2DRenderer();
			labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight);
			labelRenderer.domElement.style.position = 'absolute';
			labelRenderer.domElement.style.top = '0';
			labelRenderer.domElement.style.userSelect = 'none';
			this.container.appendChild(labelRenderer.domElement);

			controls = new OrbitControls(camera, labelRenderer.domElement); //
			//
			controls.enableDamping = true;
			controls.enableRotate = false;
			// 操作键位设置
			controls.mouseButtons = {
				LEFT: THREE.MOUSE.PAN,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.ROTATE
			};

			const loader = new TextureLoader();
			loader.load(
				this.modelSrc,
				(obj) => {
					const img = obj.image;
					const height = img.height;
					const width = img.width;
					const material = new THREE.MeshBasicMaterial({
						map: obj
						// side: THREE.DoubleSide
					});
					const geomatry = new THREE.PlaneGeometry(width, height);
					mesh = new THREE.Mesh(geomatry, material);
					scene.add(mesh);
					setTimeout(() => {
						try {
							const localData = JSON.parse(localStorage.getItem('localThreeData'));
							this.dialogTableData = localData || [];
							this.loadPoint(this.dialogTableData);
						} catch {}
					}, 100);
				},
				undefined,
				() => {
					console.error('模型加载错误');
				}
			);
		},
		animate() {
			controls && controls.update();
			renderer && renderer.render(scene, camera);
			labelRenderer && labelRenderer.render(scene, camera);
			this.requestAnimationId = requestAnimationFrame(this.animate);
		},
		onMouseClick(event) {
			var raycaster = new THREE.Raycaster();
			var mouse = new THREE.Vector2();
			mouse.x = (event.layerX / this.container.clientWidth) * 2 - 1;
			mouse.y = -(event.layerY / this.container.clientHeight) * 2 + 1;
			raycaster.setFromCamera(mouse, camera);
			const intersects = raycaster.intersectObjects(scene.children, true);
			this.addPoint(intersects);
		},
		addPoint(intersects) {
			if (!intersects[0]) {
				this.$message.warning('请标注有效点位');
				return;
			}
			let point = intersects[0].point;

			const code = Date.now() + '';
			const data = {
				code: code,
				label: '新建标记',
				point
			};
			const { labelObject, labelDiv } = this.createLabelObj(data);
			scene.add(labelObject);
			const { pointObject } = createPoint(data.code, data.point);
			scene.add(pointObject);

			this.dialogTableData.push({
				label: '新建标记',
				code: code,
				x: data.point.x,
				y: data.point.y,
				z: data.point.z,
				left: 0,
				top: 0
			});
			setTimeout(() => {
				const { lineObject } = createLine(data.code, labelDiv, data.point);
				scene.add(lineObject);
				this.addEvent(data.code, labelDiv);
			}, 50);
		},
		loadPoint(pointList) {
			pointList.forEach((item) => {
				const data = {
					alarmLevels: item.alarmLevels,
					code: item.code,
					label: item.label,
					point: {
						x: item.x,
						y: item.y,
						z: item.z,
						left: item.left,
						top: item.top
					}
				};
				const { labelObject, labelDiv } = this.createLabelObj(data);
				scene.add(labelObject);
				const { pointObject } = createPoint(data.code, data.point);
				scene.add(pointObject);
				setTimeout(() => {
					const { lineObject } = createLine(data.code, labelDiv, data.point);
					scene.add(lineObject);
					this.addEvent(data.code, labelDiv);
				}, 50);
			});
		},
		labelChange(row) {
			const arr = scene.children.filter((i) => i.name === row.code);
			const nameP = arr[0].element.querySelector('.word-wrap');
			nameP.innerText = row.label;
		},
		onInput(row) {
			this.labelChange(row);
		},
		addEvent(id, ele) {
			let clientx = 0,
				clienty = 0,
				offsetleft = 0,
				offsettop = 0,
				offsetl = 0,
				offsett = 0;
			ele.addEventListener('mousedown', (e) => {
				controls.enabled = false;
				clientx = e.clientX;
				clienty = e.clientY;
				//获取左部和顶部的偏移量
				offsetleft = ele.offsetLeft;
				offsettop = ele.offsetTop;
				// !!! 这里只能使用window 或者dom 不能使用ele
				// 1
				this.container.onmousemove = (el) => {
					el.preventDefault();
					const offsetx = el.clientX;
					const offsety = el.clientY;
					//计算移动后的左偏移量和顶部的偏移量
					offsetl = offsetx - (clientx - offsetleft);
					offsett = offsety - (clienty - offsettop);
					ele.style.left = offsetl + 'px';
					ele.style.top = offsett + 'px';
					updateLine(ele, id);
				};
				// 2
				this.container.onmouseup = () => {
					controls.enabled = true;
					// 3
					this.container.onmousemove = null;
					this.container.onmouseup = null;

					const activePoint = this.dialogTableData.filter((item) => item.code === id);
					if (activePoint.length) {
						activePoint[0].left = offsetl;
						activePoint[0].top = offsett;
					}
				};
			});
		},
		deletePoint(code) {
			const index = this.dialogTableData.findIndex((item) => item.code === code);
			this.dialogTableData.splice(index, 1);
			const arr = scene.children.filter((i) => i.name === code);
			arr.forEach((i) => scene.remove(i));
		},
		// 创建展示容器
		createLabelObj(data) {
			const code = data.code;
			const point = data.point;
			let labelDiv = document.createElement('div'); //创建div容器
			labelDiv.className = 'laber_name';
			labelDiv.style.left = point.left + 'px';
			labelDiv.style.top = point.top + 'px';
			const wrapDiv = document.createElement('div');

			wrapDiv.className = 'wrap-div';
			// 创建打字特效风洞信息标签
			const label = data.label || '新建标点';
			const p = document.createElement('p');
			p.className = 'word-wrap';
			p.innerText = label;
			wrapDiv.appendChild(p);

			const editBtn = document.createElement('i');
			editBtn.className = 'iconfont icon-compile';
			editBtn.addEventListener('mousedown', () => {
				this.editLabel(code);
			});

			const deleteBtn = document.createElement('i');
			deleteBtn.className = 'iconfont icon-delete';
			deleteBtn.addEventListener('mousedown', () => {
				this.deletePoint(code);
			});

			wrapDiv.appendChild(editBtn);
			wrapDiv.appendChild(deleteBtn);

			labelDiv.appendChild(wrapDiv);

			// 生成展示窗口
			let labelObject = new CSS2DObject(labelDiv);
			labelObject.name = code;
			labelObject.position.set(point.x, point.y, point.z);

			return { labelObject, labelDiv };
		},
		//
		windowResize() {
			const { clientWidth, clientHeight } = this.container;

			renderer.setSize(clientWidth, clientHeight);
			camera.aspect = clientWidth / clientHeight;
			camera.updateProjectionMatrix();
			labelRenderer.setSize(clientWidth, clientHeight);
		},
		saveData() {
			console.log(this.dialogTableData);
			const localData = JSON.stringify(this.dialogTableData);
			localStorage.setItem('localThreeData', localData);
			this.$message.success('保存成功！');
		},
		editLabel(code) {
			this.editingLabel = code;
			const arr = scene.children.filter((i) => i.name === code);
			const nameP = arr[0].element.querySelector('.word-wrap');
			this.editValue = nameP.innerText;
			this.isVisible = true;
		},
		editLabelOk() {
			const activeLabel: PointData[] = this.dialogTableData.filter((item) => item.code === this.editingLabel);
			if (activeLabel.length) {
				activeLabel[0].label = this.editValue;
				this.labelChange({
					code: this.editingLabel,
					label: this.editValue
				});
				this.isVisible = false;
			}
		}
	}
});
</script>
<style scoped>
.container {
	padding: 20px;
}
.three-ref {
	width: 900px;
	height: 450px;
	margin: 0 auto 30px;
	background: #fff;
	position: relative;
	overflow: hidden;
}
.bot-table {
	margin-bottom: 20px;
}
.footer {
	text-align: center;
}
</style>

<style lang="scss">
.three-ref {
	.default_point {
		&::before {
			content: ' ';
			position: absolute;
			z-index: 2;
			left: -3px;
			top: -3px;
			width: 6px;
			height: 6px;
			background-color: #333;
			border-radius: 50%;
		}
	}
	.line {
		width: 0px;
		height: 100%;
		top: 0px;
		left: 0px;
		border-left: 2px dashed rgba(0, 0, 0, 0.6);
		position: absolute;
	}
	.laber_name {
		// border: 1px solid #6bd2ff;
		border-radius: 4px;
		overflow: hidden;
		width: 180px;
		height: 32px;
		font-size: 16px;
		cursor: move;
	}
	.wrap-div {
		background: rgba(95, 124, 186, 0.6);
		height: 100%;
		display: flex;
		.iconfont {
			color: #fff;
			font-size: 14px;
			line-height: 32px;
			cursor: pointer;
			&:first-of-type {
				margin-right: 8px;
			}
		}
	}
	.red-div {
		line-height: 32px;
		color: #fff;
		text-align: center;
		background: rgba(247, 90, 90, 0.6);
		height: 100%;
	}
	.yellow-div {
		line-height: 32px;
		color: #fff;
		text-align: center;
		background: rgba(247, 166, 62, 0.6);
		height: 100%;
	}
	.word-wrap {
		width: 140px;
		line-height: 32px;
		color: #fff;
		text-align: center;
		margin: 0;
	}
	.fd-img {
		width: 100%;
		height: calc(100% - 100px);
		border-top: 1px solid #6bd2ff;
		background: rgba(0, 115, 230, 0.7) url('/static/fd01.png') 0 50% no-repeat;
		background-size: cover;
	}
	.fd-status {
		position: relative;
		text-align: center;
		font-size: 14px;
		line-height: 32px;
		z-index: 1;

		&:before {
			position: absolute;
			top: 7px;
			left: 0;
			width: 100%;
			height: 18px;
			content: '';
			z-index: -1;
			background-color: #fff;
		}

		&.running:after {
			position: absolute;
			animation: changeLeftToRight 4s ease 0s infinite;
			top: 7px;
			width: 30%;
			height: 18px;
			content: '';
			z-index: -1;
			background-color: #00ff00;
		}

		&.error {
			&:after {
				background-color: #ff0000;
			}
		}
	}
	.footer-btn {
		padding: 8px 0;
		text-align: center;
	}
}
@keyframes changeLeftToRight {
	0% {
		left: 0%;
		width: 10%;
	}

	25% {
		left: 0%;
		width: 30%;
	}

	50% {
		left: 90%;
		width: 10%;
	}

	75% {
		left: 30%;
		width: 40%;
	}

	100% {
		left: 0%;
		width: 10%;
	}
}
</style>
