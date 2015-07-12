var MAINMENU_PARTICLE_MAX_DISTANCE = 600;

var MainMenu = function(){
	this.particles = [];
}

MainMenu.prototype.init = function(){
	this.logoSquare = new fabric.Rect({
		width: 100,
		height: 100,
		fill: theme.blocks.green.outer,
		visible: false,
		left: canvas.width / 2,
		top: canvas.height / 2,
		originX: "center",
		originY: "center"
	});

	this.logoInner = new fabric.Rect({
		width: this.logoSquare.width * theme.innerBlockScale,
		height: this.logoSquare.height * theme.innerBlockScale,
		fill: theme.blocks.green.inner,
		visible: false, 
		left: canvas.width/2,
		top: canvas.height/2,
		originX: "center",
		originY: "center",
		visible: false
	})

	this.logoText = new fabric.Text("Squares", {
		left: canvas.width/2,
		top: canvas.height/2 + 70,
		fontSize: 25,
		fontFamily: "Scada",
		visible: false,
		originX: "center"
	})
	this.startButton = createButton(canvas.width / 2, canvas.height * 0.8, "Начать игру", function(){
	 	setScene(GameScreen);
	});

	canvas.add(this.startButton);
	canvas.add(this.logoSquare);
	canvas.add(this.logoInner);
	canvas.add(this.logoText);
} 

MainMenu.prototype.generateParticle = function(){
	var angle = Math.random() * 2 * Math.PI;
	var colors = [theme.blocks.green.inner, theme.blocks.blue.inner, theme.blocks.orange.inner];
	var particle = new fabric.Rect({
		width: 10,
		height: 10,
		fill: colors[Math.random() * colors.length |0],
		opacity: 0.0,
		angle: angle * 180 / Math.PI,
		left: this.logoSquare.left + MAINMENU_PARTICLE_MAX_DISTANCE * Math.cos(angle),
		top: this.logoSquare.top + MAINMENU_PARTICLE_MAX_DISTANCE * Math.sin(angle),
		originX: "center",
		originY: "center"
	});
	canvas.add(particle);
	particle.sendToBack();

	particle.animate({
		opacity: 1.0,
		left: canvas.width/2 - 5,
		top: canvas.height/2 - 5
	}, {
		duration: 1000,
		onComplete: function(){
			canvas.remove(particle);
		},
		easing: fabric.util.ease.easeOutCubic
	});
}


MainMenu.prototype.show = function(){
	this.logoSquare.setVisible(true);
	this.logoInner.setVisible(true);
	this.logoText.setVisible(true);
	var self = this;
	this.timer = setInterval(function(){
		self.generateParticle();
	}, 5);
}

MainMenu.prototype.hide = function(callback){
	clearInterval(this.timer);
	this.startButton.animate("opacity", 0, {duration: 500});
	this.logoText.animate("opacity", 0, {duration: 500});
	var self = this;
	setTimeout(function(){
		self.logoSquare.animate({scaleX: 0, scaleY: 0}, {duration: 400});
		self.logoInner.animate({scaleX: 0, scaleY: 0}, {duration: 400, onComplete: function(){
			canvas.remove(self.startButton);
			canvas.remove(self.logoText);
			canvas.remove(self.logoSquare);
			canvas.remove(self.logoInner);
			callback();
		}});
	}, 650);
}
