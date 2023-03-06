<template>
	<div id="container"></div>
</template>

<script>
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { CSS2DObject, CSS2DRenderer } from 'three/examples/jsm/renderers/CSS2DRenderer'
export default {
	name: 'ThreeComponent',
	data() {
		return {
			group: null,
			camera: null,
			scene: null,
			renderer: null,
			labelRenderer: null,
			mesh: null,
			container: null,
			requestAnimationId: null,
			count: 1
		}
	},
	mounted() {
		this.container = document.getElementById('container')
		this.container.addEventListener('dblclick', this.onMouseClick)
		this.init()
		this.animate()

		window.addEventListener('resize', this.windowResize)
	},
	unmounted() {
		cancelAnimationFrame(this.requestAnimationId)
		window.removeEventListener('resize', this.windowResize)
	},
	methods: {
		init() {
			this.scene = new THREE.Scene()
			//
			let geometry = new THREE.BoxGeometry(100, 100, 100)
			let material = new THREE.MeshLambertMaterial({
				color: 0x0000ff
			})
			this.mesh = new THREE.Mesh(geometry, material)
			this.scene.add(this.mesh)
			//
			let point = new THREE.PointLight(0xffffff)
			point.position.set(400, 200, 300)
			this.scene.add(point)

			// 
			let ambient = new THREE.AmbientLight(0x444444)
			this.scene.add(ambient)

			// 
			let width = this.container.offsetWidth
			let height = this.container.offsetHeight
			let k = width / height
			let s = 200

			// 
			this.camera = new THREE.OrthographicCamera(-s * k, s * k, s, -s, 1, 200)
			this.camera.position.set(0, 0, 200) // 
			this.camera.lookAt(this.scene.position) // 

			// 
			this.renderer = new THREE.WebGLRenderer({
				antialias: true,
				logarithmicDepthBuffer: true,
				alpha: true
			})
			this.renderer.setPixelRatio(window.devicePixelRatio)
			this.renderer.setSize(width, height) // 
			this.renderer.setClearColor(0xb9d3ff, 1) //
			this.container.appendChild(this.renderer.domElement) // 

			this.labelRenderer = new CSS2DRenderer()
			this.labelRenderer.setSize(this.container.clientWidth, this.container.clientHeight)
			this.labelRenderer.domElement.style.position = 'absolute'
			this.labelRenderer.domElement.style.top = 0
			this.labelRenderer.domElement.style.userSelect = 'none'
			this.container.appendChild(this.labelRenderer.domElement)

			this.controls = new OrbitControls(this.camera, this.labelRenderer.domElement) // 创建控件对象
			// 
			this.controls.enableRotate = false
			// 
			this.controls.enableDamping = true
			// 
			this.controls.mouseButtons = {
				LEFT: THREE.MOUSE.PAN,
				MIDDLE: THREE.MOUSE.DOLLY,
				RIGHT: THREE.MOUSE.ROTATE
			}
			const render = () => {
				this.renderer.render(this.scene, this.camera)
				this.labelRenderer.render(this.scene, this.camera)
			}
			// 
			render()
		},
		animate() {
			this.controls && this.controls.update()
			this.renderer && this.renderer.render(this.scene, this.camera)
			this.labelRenderer && this.labelRenderer.render(this.scene, this.camera)
			this.requestAnimationId = requestAnimationFrame(this.animate)
		},
		onMouseClick(event) {
			var raycaster = new THREE.Raycaster()
			var mouse = new THREE.Vector2()
			mouse.x = (event.layerX / this.container.clientWidth) * 2 - 1
			mouse.y = -(event.layerY / this.container.clientHeight) * 2 + 1
			raycaster.setFromCamera(mouse, this.camera)
			const intersects = raycaster.intersectObjects(this.scene.children, true)
			console.log(event, intersects)
		},
		// 
		windowResize() {
			const { clientWidth, clientHeight } = this.container
			
			this.renderer.setSize(clientWidth, clientHeight)
			this.camera.aspect = clientWidth / clientHeight
			this.camera.updateProjectionMatrix()
			this.labelRenderer.setSize(clientWidth, clientHeight)
		}
	}
}
</script>
<style scoped>
#container {
	width: 100%;
	height: 100%;
	background: #fff;
	position: relative;
	overflow: hidden;
}
</style>
