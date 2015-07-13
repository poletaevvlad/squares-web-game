var canvas, scene, setScene;
window.onload = function(){
	canvas = new fabric.Canvas("game");
	canvas.selection = false;
	fabric.Object.prototype.selectable = false;
	canvas.renderOnAddRemove = false
	fabric.Object.prototype.transparentCorners = false;
	canvas.stateful = false;


	window.onResize = function(){
		canvas.setDimensions({
			width: window.innerWidth,
			height: window.innerHeight
		})
	}

	window.onResize();

	var drawTime = Date.now();
	function frame(){
		var dt = Date.now() - drawTime;
		drawTime += dt;

		canvas.renderAll();
		fabric.util.requestAnimFrame(frame, canvas.getElement());
	}
	frame();

	scene = null;
	setScene = function(sceneClass, attributes){
		function setCurrentScene(){
			scene = new sceneClass(attributes);
			scene.init();
			scene.show();
		}

		if (scene != null){
			scene.hide(setCurrentScene);
		}else{
			setCurrentScene();
		}	
	}

	var activeButton = null;
	canvas.on("mouse:move", function(e){
		if (e.target && e.target.isButton){
			if (activeButton == null) e.target.onHover();
			activeButton = e.target;
		}else{
			if (activeButton != null){
				activeButton.onUnHover();
				activeButton = null;
			}
		}
	})

	canvas.on("mouse:down", function(e){
		if (e.target && e.target.isButton){
			activeButton = e.target;
			activeButton.onMouseDown()
		}
	});

	canvas.on("mouse:up", function(e){
		if (activeButton != null && ! activeButton.clicked){
			activeButton.clicked = true;
			activeButton.onClick();
		}
	})

	
	setScene(MainMenu);
	window.onclick = function(e){
		if (scene != null && typeof scene.onClick != "undefined"){
			scene.onClick(e);
		}
	};
}

fabric.util.ease.linear = function (t, b, c, d) {
	return c*t/d + b;
};
