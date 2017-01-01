var cheerio = require("cheerio");
var request = require("request");

var express = require("express");
var fs      = require("fs");

var app     = express();
app.use(express.static('public'));
var HTTP_SERVER = app.listen(80,function(){
	console.log("서버에 정상적으로 접속 하였습니다.\n");
});

var io  = require("socket.io").listen(HTTP_SERVER);
var gSocket;

io.sockets.on('connection',function(socket){
	gSocket=socket;
	OnSocket();
});


app.get("/",function(request,response){
	fs.readFile('index.html',function(err, data){
		response.writeHead(200,{'Content-Type':'text/html'});
		response.end(data);
	});
});

var List={
	Y:[],
	T:[]
};


var TwitchOptions={
	url:'https://api.twitch.tv/kraken/streams?limit=100&offset=179&game=&broadcaster_language=ko&on_site=1',
	headers:{
		'Client-ID':'[Twitch Client ID]'
	}
};


function OnSocket(){
	gSocket.on("get_List",function(data){
		gSocket.emit('send_List',{msg:List});
	});
	function getList(){
	var url="https://www.youtube.com/watch?v=IYUfiZ5fF0A&list=PLU12uITxBEPGpEPrYAxJvNDP6Ugx2jmUx";
	request(url, function(err, response, body){
		if(err){
			console.warn("유튜브 서버에 연결 할 수 없습니다.");
			throw err;
		}
		console.log("유튜브 서버에 정상적으로 연결 되었습니다.");

		var $ = cheerio.load(body);

		List.Y=[];

		$("li.yt-uix-scroller-scroll-unit").each(function(index){
			var th=$(this);
			List.Y[List.Y.length]={
				id   :th.attr("data-video-id"),
				user :th.attr("data-video-username"),
				img  :th.attr("data-thumbnail-url"),
				title:th.attr("data-video-title")
			}
		});
	});
	request(TwitchOptions,function(err, response, body){
		if(err){
			console.warn("트위치 서버에 연결 할 수 없습니다.");
			throw err;
		}
		console.log("트위치 서버에 정상적으로 연결 되었습니다.");

		var data=JSON.parse(body);
		List.T=[];
		for(var i=0; i<data.streams.length; i++){
			List.T[List.T.length]={
				id   :data.streams[i].channel.url,
				title:data.streams[i].channel.status,
				user :data.streams[i].channel.display_name,
				img  :data.streams[i].preview.medium
			};
		}
	});
	gSocket.emit('update_List');
	}
	getList();
	var Timer_getList=setInterval(getList,60000);
}
