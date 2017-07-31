//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);
router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({extended : false}));
var messages = [];
var sockets = [];




router.get('/webhook',function(req,res){
  
  if(req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'minhasenha123' ){
    console.log('validação ok!');
    res.status(200).send(req.query['hub.challenge']);
    
  }
  else{
    console.log('validação falhou');
    res.sendStatus(403);
  }
});

router.post('/webhook',function(req,res){
  var data = req.body;
  if(data && data.object === 'page'){
   
   //percorrer todas as entradas
    
    data.entry.forEach(function(entry){
     var pageID = entry.id;
     var timeOfEvent = entry.time;
      
      //percorrer todas as mensagens
      entry.messaging.forEach(function(event){
        if(event.message){
          trataMensagem(event);
        }
      })
     
   })
  res.sendStatus(200);  
    
  }

  
});

function trataMensagem(event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMensagem = event.timestamp;
  var message = event.message;
  console.log('mensagem recebida do usuário %d pela pagina %d ',senderID,recipientID);
  
  var messageID =message.mid;
  var messageText = message.text;
  var attachments = message.attachments; 
  
    
  if(messageText){
   
   
   
    switch (messageText) {
      case 'oi':
        sendTextMessage(senderID,'Olá eu sou um Robô assistente, é um prazer conhecer você!!!');
        sendTextMessage(senderID,'Qual seu primeiro nome ??');

        break;
      case 'Oi':
        sendTextMessage(senderID,'Olá eu sou um Robô assistente, é um prazer conhecer você!!!');
        sendTextMessage(senderID,'Qual seu primeiro nome ??');

        break;
        
      case 'Olá':
        sendTextMessage(senderID,'Olá eu sou um Robô assistente, é um prazer conhecer você!!!');
       sendTextMessage(senderID,'Qual seu primeiro nome ??');

      
         
        case 'Obrigado':
          sendTextMessage(senderID,'Eu que agradeço <3');
          break;
        
  
         case 'Xau':
          sendTextMessage(senderID,'Até logo, volte quando quiser conversar <3');
         
        break;
        
        case 'Danilo':
        sendTextMessage(senderID,'Olá Danilo, o Douglas meu contou muito sobre você e gostaria de particiar do Clan ST <3 ');
        break;
      
      case 'Sim':
         sendTextMessage(senderID,'Que ótimo!!');
         break;
      case 'Christian':
        sendTextMessage(senderID, 'Olá Christian, como vai seu irmão ?');
      break;
        
      default:
         sendTextMessage(senderID,'Desculpe não entendi, estou em fase de testes e logo vou aprender a conversar!!!');
    }
  }
  else if(attachments){
    //tratamento dos anexos
    console.log('olha que legal me mandaram anexos');
  }
}

function sendTextMessage(recipientId,messageText){
  var messageData ={
    recipient :{
      id:recipientId
    },
    message:{
      text:messageText
    }
  };
  callSendAPI(messageData);
}


function callSendAPI(messageData){
  request({
    uri:'https://graph.facebook.com/v2.9/me/messages',
    qs: {access_token :'EAAHjEA9kmSIBAFib3yTsZBvEwEHK3z3lPQ6DMY1QhWZAXpDVDmoraHusHK7RrnqlHe3R4NieTRqdNHUzTOoQZAQ9AJymXUYklqKR3OtvF82XdNWgwfGMUKE5qG9N9JY895ZBGipKZAQFQYVYxEBbgEL0O4HJcMOHZCTZAVE8ToxaQZDZD'},
     method : 'POST',
     json: messageData
  
     
  },function (error,response,body){
    if(!error && response.statusCode == 200){
      console.log('mensagem enviada com sucesso');
      var recipientID =body.recipient_id;
      var messageID = body.message_id;
    }
    else{
      console.log('não foi possivel enviar a mensagem');
      console.log(error);
    }
  });
    
  
  
}









io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});
