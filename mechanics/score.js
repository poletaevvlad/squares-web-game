var _highScore;
function getHighScore(){
	if (typeof _highScore == "undefined"){
		var value = localStorage["high-score"];
		if (typeof value == "undefined"){
			value = 0;
		}
		_highScore = parseInt(value);
	}
	return _highScore;
}

function setHighScore(value){
	_highScore = value;
	localStorage["high-score"] = value;
}

// function getQueryParams(qs) {
//     qs = qs.split('+').join(' ');
//     var params = {},
//         tokens,
//         re = /[?&]?([^=]+)=([^&]*)/g;
//     while (tokens = re.exec(qs)) {
//         params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
//     }
//     return params;
// }


// var initAPI;console.log(windows.VK);
// if (window.VK){
// 	initAPI = function(callback){
// 		VK.init(function(){
// 			console.log(getQueryParams(location.search)["api_result"])
// 		}, function(){
// 			console.log("123");
// 			delete VK;
// 			callback();
// 		})
// 	}
// }else{
// 	initAPI = function(callback){ callback(); }
// }
