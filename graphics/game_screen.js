"use strict";

var GameScreen = function(){
	this.model = new GameField();
	this.model.setGraphics(this);
	this.blocksStep = 35;
	this.isFalling = false;
	this.isDropping = false;

	this.clicked = null;
	this.dropped = null;
	this.dropAsked = null;

	this.blocksGroup = null;

	this.displayedScore = 0;
	this.score = 0;
	this.displayedRecord = getHighScore();
	this.record = getHighScore();
	this.contersTimer = 0;

	this.interactive = true;
}

// --- View interface --- 

GameScreen.prototype.init = function(){
	this.blocksGroup = new fabric.Group([], {
		left: (canvas.width - this.blocksStep * (this.model.width - 1)) / 2,
		top: (canvas.height + this.blocksStep * (this.model.height - 1)) / 2,
		originX: "left",
		originY: "bottom"
	});
	canvas.add(this.blocksGroup);

	function createValueLabel(x, text, y){
		var label = new fabric.Text(text, {
			left: x,
			top: y,
			fontSize: 23,
			fontFamily: "Scada",
			visible: true,
			fill: theme.sidebarColor.value,
			originX: (x == 20) ? "left" : "right"
		});
		canvas.add(label);
		return label;
	}

	function createSidebarText(y, text, data, right){
		var label = new fabric.Text(text, {
			left: (! right)? 20: canvas.width-20,
			top: y,
			fontSize: 13,
			fontFamily: "Scada",
			visible: true,
			fill: theme.sidebarColor.label,
			originX: (! right)? "left": "right"
		});
		canvas.add(label);
		return {label: label, value: createValueLabel((! right)? 20: canvas.width-20, data, y+15)}
	}

	this.deletedCounter = createSidebarText(100, "удалено:", "0");
	this.recordCounter = createSidebarText(160, "рекорд:", getHighScore().toString());

	var timeLabel = new fabric.Text("время:", {
		left: canvas.width-20,
		top: 100,
		fontSize: 13,
		fontFamily: "Scada",
		visible: true,
		fill: theme.sidebarColor.label,
		originX: "right"
	});
	canvas.add(timeLabel);

	var digits = [createValueLabel(canvas.width-20 - 45, '0', 115),
	              createValueLabel(canvas.width-20 - 31, '0', 115),
	              createValueLabel(canvas.width-20 - 27, ':', 115),
	              createValueLabel(canvas.width-20 - 14, '0', 115),
	              createValueLabel(canvas.width-20 - 0, '0', 115)]


	this.timeCounter = {label: timeLabel, value: digits, group: new fabric.Group(digits)}

	this.initSideBarHidden();
}

GameScreen.prototype.show = function(){
	this.showSideBar();
	this.model.start();
	var self = this;
	this.contersTimer = setInterval(function(){
		self.updateCounters();
	}, 20);
}

GameScreen.prototype.hide = function(){

}

// --- Handling user input ---

GameScreen.prototype.onClick = function(e){
	if (! this.interactive) return;
	var x = e.clientX - this.blocksGroup.left + this.blocksStep / 2;
	var y = this.blocksGroup.top - e.clientY + this.blocksStep / 2;
	var column = x / this.blocksStep |0, row = y / this.blocksStep |0;
	if (this.isFalling || this.isDropping){
		this.clicked = {column: column, row: row};
	}else{
		this.model.clicked(column, row);
	}
}

GameScreen.prototype.dropFinished = function(){
	if (this.clicked != null){
		this.model.clicked(this.clicked.column, this.clicked.row);
		this.clicked = null;
	}

	if (this.dropped != null){
		this.dropRow(this.dropped.blocks, this.model.requestDropPositions(), this.dropped.callback);
		this.dropped = null;
	}

	if (this.dropAsked != null){
		this.dropAsked();
		this.dropAsked = null;
	}
}

// --- Gameplay interface --- 

GameScreen.prototype.initializeBlock = function(block){
	block.outerBox = new fabric.Rect({
		width: 30, 
		height: 30,
		fill: theme.blocks[block.color].outer,
		left: 0,
		top: 0,
		originX: "center",
		originY: "center"
	})

	block.innerBox = new fabric.Rect({
		width: block.outerBox.width * theme.innerBlockScale,
		height: block.outerBox.height * theme.innerBlockScale,
		fill: theme.blocks[block.color].inner,
		left: 0,
		top: 0,
		originX: "center",
		originY: "center"
	})

	block.box = new fabric.Group([block.outerBox, block.innerBox], {
		visible: false,
		originX: "center",
		originY: "center"
	});
	this.blocksGroup.add(block.box);
}

GameScreen.prototype.displayInitialBlock = function(block, row, position){
	block.box.setPositionByOrigin(new fabric.Point(row * this.blocksStep, - position * this.blocksStep),0,0);
	var self = this;
	setTimeout(function(){
		block.box.setVisible(true);
		block.box.setOpacity(0.0);
		block.box.animate("opacity", 1.0, {
			duration: 200
		})

		block.innerBox.set({width: block.outerBox.width, height: block.outerBox.height});
		setTimeout(function(){
			block.innerBox.animate({
				width: block.outerBox.width * theme.innerBlockScale,
				height: block.outerBox.height * theme.innerBlockScale
			}, {
				duration: 200
			})
		}, 300)
	}, 50 * (row + position));
}


GameScreen.prototype.displayNextRow = function(blocks, time){
	for (var i = 0; i < blocks.length; i++){
		var block = blocks[i];
		block.box.setVisible(true);
		block.innerBox.set({
			width: block.outerBox.width,
			height: block.outerBox.height
		});
		block.box.setScaleY(theme.nextBlocksHeight / block.outerBox.height);
		block.box.setPositionByOrigin(new fabric.Point(+ i * this.blocksStep, 
				- (this.model.height-1) * this.blocksStep - (this.blocksStep - block.outerBox.height)  - block.outerBox.height/2 - theme.nextBlocksHeight/2), 0, 0);
		block.box.setOpacity(0.0);
		block.box.animate("opacity", 1.0, {
			duration: time
		});
	}
}

GameScreen.prototype.dropRow = function(blocks, positions, callback){
	if (this.isFalling){
		this.dropped = {blocks: blocks, positions: positions, callback: callback}
	}else{
		this.isDropping = true;
		// this.droppingText.setFill("green");

		var self = this;
		var finishedNum = 0;
		for (var i = 0; i < blocks.length; i++){
			var newTop = - this.blocksStep * positions[i];
			blocks[i].box.animate("scaleY", 1.0, { duration: 100});
			blocks[i].box.animate("top", newTop, {
				duration: Math.abs(blocks[i].box.top - newTop) * theme.fallingSpeed,
				easing: fabric.util.ease.linear,
				onComplete: (function(block){
					return function(){
						block.innerBox.animate({
							height: block.outerBox.height * theme.innerBlockScale,
							width: block.outerBox.width * theme.innerBlockScale
						}, {
							duration: 200
						})
						
						finishedNum++;
						if (finishedNum >= blocks.length){
							callback();
							self.isDropping = false;
							// self.droppingText.setFill("red");
							self.dropFinished();
						}
					}
				})(blocks[i])
			})
		}
	}
}

GameScreen.prototype.removeGroup = function(group, callback){
	var removedCount = 0;
	var self = this;
	function r(i){
		return function (){
			group[i].block.box.animate({
				opacity: 0.0 
			}, {
				duration: 100,
				onComplete: function(){
					removedCount++;
					self.blocksGroup.remove(group[i].block.box);
					if (removedCount >= group.length){
						callback();
					}
				}
			})
		}
	}

	var x = group[0].column, y = group[0].row;
	for (var i = 0; i < group.length; i++){
		r(i)();

	}
}

GameScreen.prototype.blocksFallen = function(blocks){
	this.isFalling = true;
	// this.fallingText.setFill("green");
	var finishedNum = 0;
	var self = this;
	for (var i = 0; i < blocks.length; i++){
		var block = blocks[i];
		block.block.box.animate({
			top:  - block.to.row * this.blocksStep
		}, {
			duration: (block.from.row - block.to.row) * this.blocksStep * theme.fallingSpeed,
			easing: fabric.util.ease.linear,
			onComplete: function(){
				finishedNum ++;

				if (finishedNum >= blocks.length){
					self.isFalling = false;
					// self.fallingText.setFill("red");
					self.dropFinished();
				}
			}
		});
	}
}

GameScreen.prototype.dropRowPermission = function(callback){
	if (! this.isFalling && ! this.isDropping){
		callback();
	}else{
		this.dropAsked = callback;
	}
}

GameScreen.prototype.setRemovedCount = function(count){
	this.score = count;
}

GameScreen.prototype.setRecordCount = function(count){
	this.record = count;
}

GameScreen.prototype.updateCounters = function(){
	if (this.interactive){
		if (this.score > this.displayedScore){
			this.displayedScore++;
			this.deletedCounter.value.setText(this.displayedScore.toString());
		}
		if (this.record > this.displayedRecord){
			this.displayedRecord++;
			this.recordCounter.value.setText(this.displayedRecord.toString());
		}
		var time = (Date.now() - this.model.startTime) / 1000 |0;
		var seconds = time % 60, minutes = time / 60 |0;


		this.timeCounter.value[0].setText((minutes / 10 |0).toString());
		this.timeCounter.value[1].setText((minutes % 10).toString());
		this.timeCounter.value[3].setText((seconds / 10 |0).toString());
		this.timeCounter.value[4].setText((seconds % 10).toString());
	}
}

GameScreen.prototype.zoomOutField = function(callback){
	this.blocksGroup.animate({
		scaleX: 0.5,
		scaleY: 0.5,
		top: (canvas.height + this.blocksStep * (this.model.height - 1) * 0.5) / 2,
		left: 0.2 * canvas.width,

	}, {
		easing: fabric.util.ease.easeInQuart,
		duration: 500,
		onComplete: function(){
			if (typeof callback != "undefined"){
				callback();
			}
		}
	})
}

GameScreen.prototype.zoomInField = function(){
	this.blocksGroup.animate({
		scaleX: 1,
		scaleY: 1,
		top: (canvas.height + this.blocksStep * (this.model.height - 1)) / 2,
		left: (canvas.width - this.blocksStep * (this.model.width - 1)) / 2,

	}, {
		easing: fabric.util.ease.easeInQuart,
		duration: 500
	})
}

GameScreen.prototype.gameOver = function(record){
	var self = this;
	this.interactive = false;
	this.hideSideBar();
	this.zoomOutField(function(){
		self.gameOverTitle = new fabric.Text("Конец", {
			left: canvas.width * 3.5 / 7 + 150,
			top: 200,
			fontSize: 40,
			fontFamily: "Scada",
			fill: theme.gameOverTitleColor,
			opacity: 0.0
		});
		canvas.add(self.gameOverTitle);
		self.gameOverTitle.animate({ left: canvas.width * 3.5 / 7, opacity: 1.0}, {duration: 250});

		var time = (Date.now() - self.model.startTime) / 1000 |0;
		var minutes = time / 60 |0, seconds = time % 60;

		var text = "За ";
		if (minutes != 0){ 
			var minsEnding = ((minutes / 10 |0 % 10) == 1) ? "" : ((minutes % 10) == 1) ? "у" : ((minutes % 10 > 1) && (minutes % 10 < 5))? "ы": "";
			text += minutes + " минут" + minsEnding + " ";
		}
		if (seconds != 0){
			var secsEnding = ((seconds / 10 |0 % 10) == 1) ? "" : ((seconds % 10) == 1) ? "у" : ((seconds % 10 > 1) && (seconds % 10 < 5))? "ы": "";
			text += seconds + " секунд" + secsEnding + " ";
		}
		if (self.score == 0){
			text += "вы не удалили ни одного квадрата."; 
		}else{
			var scoreEnding = ((self.score / 10 |0 % 10) == 1) ? "ов" : ((self.score % 10) == 1) ? "" : ((self.score % 10 > 1) && (self.score % 10 < 5))? "а": "ов";
			text += "вы удалили " + self.score + " квадрат" + scoreEnding + ".";
		}

		if (record){
			text += "\nВы побили собственный рекорд";
		}

		self.gameOverText = new fabric.Text(text, {
			left: canvas.width * 3.5 / 7 + 150,
			top: 250,
			fontSize: 13,
			fontFamily: "Scada",
			fill: theme.gameOverTextColor,
			opacity: 0.0
		})
		canvas.add(self.gameOverText);
		self.gameOverText.animate({ left: canvas.width * 3.5 / 7, opacity: 1.0}, {duration: 250});

		self.repeatButton = createButton(canvas.width * 4.8 / 7+150, 350, "Заново", function(){
			self.showSideBar();
			self.hideGameOverView();
			self.zoomInField();
			self.restart();
		});
		canvas.add(self.repeatButton);
		self.repeatButton.setOpacity(0.0);
		self.repeatButton.animate({left: canvas.width * 4.8/7, opacity:1.0}, {duration:250});
	})
}

GameScreen.prototype.initSideBarHidden = function(){
	this.deletedCounter.label.setLeft(-this.deletedCounter.label.width);
	this.deletedCounter.value.setLeft(-this.deletedCounter.value.width);
	this.recordCounter.label.setLeft(-this.recordCounter.label.width);
	this.recordCounter.value.setLeft(-this.recordCounter.value.width);
	this.timeCounter.label.setLeft(canvas.width + this.timeCounter.label.width);
	this.timeCounter.group.setLeft(canvas.width + this.timeCounter.group.width);
}

GameScreen.prototype.hideSideBar = function(){
	function slideLeft(obj){
		obj.animate("left", -obj.width, {duration: 100})
	}

	var self = this;
	slideLeft(this.deletedCounter.label);
	setTimeout(function(){ slideLeft(self.deletedCounter.value); }, 30);
	setTimeout(function(){ slideLeft(self.recordCounter.label); }, 60);
	setTimeout(function(){ slideLeft(self.recordCounter.value); }, 90);

	function slideRight(obj){
		obj.animate("left", canvas.width + obj.width, {duration: 100})
	}
	slideRight(this.timeCounter.label);
	setTimeout(function(){ slideRight(self.timeCounter.group); }, 30);
}

GameScreen.prototype.showSideBar =function(){
	function slideFromLeft(obj){
		obj.animate("left", 20, {duration: 100})
	}

	var self = this;
	slideFromLeft(this.deletedCounter.label);
	setTimeout(function(){ slideFromLeft(self.deletedCounter.value); }, 30);
	setTimeout(function(){ slideFromLeft(self.recordCounter.label); }, 60);
	setTimeout(function(){ slideFromLeft(self.recordCounter.value); }, 90);

	function slideFromRight(obj){
		obj.animate("left", canvas.width - 20 - obj.width, {duration: 100})
	}
	this.timeCounter.label.animate("left", canvas.width - 20, {duration:100});
	setTimeout(function(){ slideFromRight(self.timeCounter.group); }, 30);
}


GameScreen.prototype.hideGameOverView =function(){
	function removeObj(obj){
		obj.animate({
			opacity: 0.0,
			left: obj.left + 50
		}, {
			duration: 100,
			onComplete: function(){
				canvas.remove(obj);
			}
		})
	}
	var self = this
	removeObj(self.gameOverTitle)
	setTimeout(function(){ removeObj(self.gameOverText); }, 50);
	setTimeout(function(){ removeObj(self.repeatButton); }, 100);
}

GameScreen.prototype.restart = function(){
	var self = this;
	var blocks = this.model.needsRestart();
	for (var i = 0; i < blocks.length; i++){
		setTimeout((function(i){
			return function(){
				blocks[i].block.box.animate("opacity", 0.0, {
					duration: 100,
					onComplete: function(){
						self.blocksGroup.remove(blocks[i].block.box);
					}
				})
			}
		})(i), 50 * (blocks[i].column + blocks[i].row));
	}

	this.displayedScore = this.score = 0;
	this.deletedCounter.value.setText("0");

	this.displayedRecord = this.record = getHighScore();
	this.recordCounter.value.setText(this.record.toString());

	this.timeCounter.value[0].setText("0");
	this.timeCounter.value[1].setText("0");
	this.timeCounter.value[3].setText("0");
	this.timeCounter.value[4].setText("0");

	self.model = new GameField();
	self.model.setGraphics(self);
	setTimeout(function(){
		self.model.start();
		self.interactive = true;
	}, 500)
}
