function createButton(x, y, text, callback){
	var button = new fabric.Rect({
		left: 0, top: 0,
		originX: "center", originY: "center",
		height: theme.button.height,
		width: theme.button.width,
		fill: theme.button.color.regular,
		rx: theme.button.height / 2,
		ry: theme.button.height / 2
	});

	var text = new fabric.Text(text, {
		left: 0, top: 0,
		originX: "center", originY: "center",
		fontSize: 12,
		fontFamily: "Scada",
		fill: theme.button.textColor
	})

	var group = new fabric.Group([button, text], {
		left: x, top:y,
		originX: "center", originY: "center"
	});
	group.isButton = true;
	group.onHover = function(){
		button.setFill(theme.button.color.hover);
	}
	group.onUnHover = function(){
		button.setFill(theme.button.color.regular);
	}
	group.onMouseDown = function(){
		button.setFill(theme.button.color.active);
	}
	group.onClick = function(){
		button.setFill(theme.button.color.hover);
		callback();
	}


	return group;
}