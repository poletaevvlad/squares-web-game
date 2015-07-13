"use strict";

var GameBlock = function(color){
	var randomColor = true;
	if (typeof color != "undefined"){
		if (! (color in GameBlock.colors)){
			console.error(color + " is not a valid block color.");
		}else{
			this.color = color;
			randomColor = false;
		}
	}

	if (randomColor){
		this.color = GameBlock.colors[GameBlock.colors.length * Math.random() |0];
	}
}
GameBlock.colors = ["green", "blue", "orange"];



var GameField = function(){
	this.width = 8;
	this.height = 12;

	this.nextRow = [];
	this.rowsGenerated = 0;
	this.columns = undefined;
	this.dropInterval = 0;
	this.initialRows = 3;

	this.blocksDeleted = 0;
	this.recordDeleted = getHighScore();

	this.startTime = 0;
	this.gameover = false;
}

GameField.prototype.setGraphics = function(graphics){
	this.graphics = graphics;
}

GameField.prototype.generateNextRow = function(){
	this.nextRow = [];
	for (var i = 0; i < this.width; i++){
		var block = new GameBlock();
		this.nextRow.push(block);
		this.graphics.initializeBlock(block);
	}
	this.rowsGenerated ++;
	this.graphics.displayNextRow(this.nextRow, this.getTimeForRow());

}

GameField.prototype.getTimeForRow = function(){
	return (1 - Math.atan(this.rowsGenerated / 6) / Math.PI * 2) * 1500 + 500;
}

GameField.prototype.start = function(){
	if (typeof this.graphics == undefined){
		console.error("Graphics object is not yet defined. Can't start the game.");
		return;
	}

	this.startTime = Date.now();

	this.columns = new Array(this.width);
	for (var i = 0; i < this.width; i++) {
		this.columns[i] = [];
		for (var j = 0; j < this.initialRows; j++){
			var block = new GameBlock;
			this.columns[i].push(block);
			this.graphics.initializeBlock(block);
			this.graphics.displayInitialBlock(block, i, j);
		}
	}

	this.generateNextRow();

	var self = this;

	function rowInterval(){
		var gameover = self.dropRow(function(){
			self.dropInterval = setTimeout(rowInterval, self.getTimeForRow());
		});
	}
	this.dropInterval = setTimeout(rowInterval, self.getTimeForRow());
}

GameField.prototype.dropRow = function(callback){
	var self = this
	this.graphics.dropRowPermission(function(){
		var positions = new Array(self.width);
		var maxPosition = 0;
		for (var i = 0; i < self.width; i++){
			positions[i] = self.columns[i].push(self.nextRow[i]) - 1;
			if (positions[i] > maxPosition) maxPosition = positions[i];
		}

		var gameover = maxPosition >= self.height;
		self.graphics.dropRow(self.nextRow, positions, function(){
			if (! gameover){
				self.generateNextRow();				
				callback();
			}else{
				self.gameover = true;
				var record = false;
				if (self.blocksDeleted > getHighScore()){
					setHighScore(self.blocksDeleted);
					record = true;
				}
				self.graphics.gameOver(record);
			}
		});		
	})
}

GameField.prototype.findGroup = function(column, row){
	var blocks = [];
	var positions = [];
	var self = this;
	function checkGroup(col, row, color){
		if (col < 0 || col >= self.width || row < 0 || row >= self.columns[col].length) return;
		var block = self.columns[col][row];

		if (blocks.indexOf(block) != -1) return;
		if (typeof color == "undefined"){
			color = block.color;
		}else{
			if (color != block.color) return;
		}

		blocks.push(block);
		positions.push({column: col, row: row});

		checkGroup(col - 1, row, color);
		checkGroup(col + 1, row, color);
		checkGroup(col, row - 1, color);
		checkGroup(col, row + 1, color);
	}
	checkGroup(column, row);

	var group = new Array(blocks.length);
	for (var i = 0; i < group.length; i++){
		group[i] = {
			block: blocks[i],
			column: positions[i].column,
			row: positions[i].row
		}
	} 
	return group;
}

GameField.prototype.clicked = function(column, row){
	if (this.gameover) return;
	var group = this.findGroup(column, row);
	if (group.length >= 3){

		// debugger;
		for (var i = 0; i < group.length; i++){
			delete this.columns[group[i].column][group[i].row];
		}
		var falling = [];
		for(var col = 0; col < this.width; col++){
			var removedBelow = 0;
			for (var row = 0; row < this.columns[col].length; row++){
				if (typeof this.columns[col][row] == "undefined"){
					removedBelow ++;
				}else if (removedBelow > 0){
					this.columns[col][row-removedBelow] = this.columns[col][row];

					falling.push({
						block: this.columns[col][row-removedBelow],
						from: {column: col, row: row},
						to: {column: col, row: row-removedBelow}
					})
				}
			}
			this.columns[col] = this.columns[col].splice(0, this.columns[col].length - removedBelow);
		}

		this.blocksDeleted += group.length;
		if (this.blocksDeleted > this.recordDeleted){
			this.graphics.setRecordCount(this.blocksDeleted);
		}
		var self = this;
		this.graphics.setRemovedCount(this.blocksDeleted);
		this.graphics.removeGroup(group, function(){
			if (falling.length > 0){
				self.graphics.blocksFallen(falling);
			}
		});
	}
}

GameField.prototype.requestDropPositions = function(){
	var res = new Array(this.width);
	for (var i = 0; i < this.width; i++){
		res[i] = this.columns[i].length;
	}
	return res;
}

GameField.prototype.needsRestart = function(){
	var blocks = []
	for (var col = 0; col < this.width; col++){
		for (var row = 0; row < this.columns[col].length; row++){
			blocks.push({
				block: this.columns[col][row],
				column: col,
				row: row
			})
		}
	}
	return blocks;
}
