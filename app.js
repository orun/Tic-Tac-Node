
/**
 * Module dependencies.
 */

var express = require('express');
var io = require('socket.io');

var app = module.exports = express.createServer();

var io = io.listen(app);
// Configuration

io.set('log level', 1); // Turn off annoying polling
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index');
});

app.listen(3000);
console.log("Tic-Tac-Toe server started on port %d in %s mode", app.address().port, app.settings.env);

var xo = 'x'; // change to whats available.
var o = false;
var m_players = [];
var i = 0; // How many connected players.

var grid = {
  '0-0': '', '0-1':'', '0-2':'',
  '1-0': '', '1-1':'', '1-2':'',
  '2-0': '', '2-1':'', '2-2': ''
}

io.sockets.on('connection', function(socket)
{
  console.log(grid);
  
  socket.on('client_connected', function(player)
  {
    player.id = socket.id;
    player.mark = xo;
    
    if(xo == 'x' && o == false) 
    {
      xo = 'o';
      o = true;
    }
    else
    {
      xo = 'spectator';
    }
    m_players[i] = player;
    i++;
    
    socket.emit('connect_1', player);
    //socket.emit('draw_board', board);
    io.sockets.emit('load',m_players);
  });
  
  socket.on('process_move', function(coords)
  {
    var n = 0;
    coords = coords.replace("#",'');
    
    // ToDo: Send in players mark instead of ugly loop
    while (n < m_players.length)
    {
      if (m_players[n].id == socket.id)
      {
        grid[coords] = m_players[n].mark;
      }
      n++;
    }
    
    console.log(grid);
    // Update clients with the move
    io.sockets.emit('mark', coords);
    
    // Win check
    if( (grid['0-0'] == grid['0-1'] && grid['0-1'] == grid['0-2'] && grid['0-0'] != '') || 
    (grid['1-0'] == grid['1-1'] && grid['1-1'] == grid['1-2'] && grid['1-0'] != '') ||
    (grid['2-0'] == grid['2-1'] && grid['2-1'] == grid['2-2'] && grid['2-0'] != '') ||
    
    (grid['0-0'] == grid['1-0'] && grid['1-0'] == grid['2-0'] && grid['0-0'] != '') ||
    (grid['0-1'] == grid['1-1'] && grid['1-1'] == grid['2-1'] && grid['0-1'] != '') ||
    (grid['0-2'] == grid['1-2'] && grid['1-2'] == grid['2-2'] && grid['0-2'] != '') ||
    
    (grid['0-0'] == grid['1-1'] && grid['1-1'] == grid['2-2'] && grid['0-0'] != '') ||
    (grid['2-0'] == grid['1-1'] && grid['1-1'] == grid['0-2'] && grid['2-0'] != '') 
    )
    {
      io.sockets.emit('gameover', xo);
    }
  });
  
  socket.on('disconnect', function()
   {
     var j = 0;
     var n = 0;
     var tmp = [];

     while (n < m_players.length)
     {
       if (m_players[j].id == socket.id)
       {
         if(m_players[j].mark == 'o')
         {
           xo = 'o';
           o = false;
         }
         if(m_players[j].mark == 'x')
         {
           xo = 'x';
         }
     	   n++;
     	 }
     	 
     	 if (n < m_players.length)
     	 {
     	   tmp[j] = m_players[n];
     	   j++;
     	   n++;
     	  }
     	}
     	
     	m_players = tmp;
     	i = j;
      io.sockets.emit('load', m_players);
   });
  
});