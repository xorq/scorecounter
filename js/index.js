function formatDate(d) { 
  var d = parseInt(d)
  var d = new Date(d);
  var daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var dd = d.getDate();
  var addZero = function(v){
  	return ( dd < 10 ) ? '0' + dd : dd;
  }
  if ( dd < 10 ) dd = '0' + dd;
  var mm = d.getMonth() + 1;
  if ( mm < 10 ) mm = '0' + mm;
  var yy = d.getFullYear() % 100;
  if ( yy < 10 ) yy = '0' + yy;
  var hh = d.getHours() % 100;
  if ( hh < 10 ) hh = '0' + hh;
  var min = d.getMinutes() % 100;
  if ( min < 10 ) min = '0' + min;
  return daysOfWeek[d.getDay()].substr(0,3) + ' ' + dd + '/' + mm + '/' + yy + ' - ' + hh + ':' + min
};

function getDuration(s) {
	var years = Math.floor( s / 31557600)
	var days = Math.floor( (s % 31557600) / 86400 );
	var hours = Math.floor( ((s % 31557600) % 86400) / 3600 ) ;
	var minutes = Math.floor( (((s % 31557600) % 86400 ) % 3600) / 60);
	var seconds = Math.floor((((s % 31557600) % 86400 ) % 3600 ) % 60);

	function returnResult(years, days, hours, minutes) {
		var times = ['y', 'd', 'h', 'm', 's']
		var result = '';
		_.each(arguments, function(a , b){
			result += a ? a + times[b] + ' ' : '';
		})
		return result
	}
	return returnResult(years, days, hours, minutes) + seconds + 's'
};

//console.log(getDuration(1000000000))
 /*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
window.isTouchDevice =  (/android|webos|iphone|ipod|ipad|blackberry|iemobile/i.test(navigator.userAgent.toLowerCase()) )
var clickEvent = window.isTouchDevice ? 'touchstart' : 'click';

/**
 * Games (collection of Game models)
 *    Game (name, sessions (collection of Session models))
 *       Session (id, players (collection of Player models))
 *          Player (id, name, score)
 */

var Player = Backbone.Model.extend({
	defaults: {
		id: Number(new Date),
		name: '',
		score: [0],
		timestamps: [Number(new Date)]
	},

	sync: function() {
		this.trigger('change');
	},
});

var Players = Backbone.Collection.extend({

	model: Player,

	sync: function() {
		this.trigger('change');
	}
});

var Session = Backbone.Model.extend({
	defaults: {
		id: Number(new Date),
		//timestamp: (new Date).toLocaleDateString() + ' ' + (new Date).toLocaleTimeString(),
		players: (new Players([new Player({id: Number(new Date)})])),
		toDelete: false,
		startTime: 0,
		finishTime: 0,
		pauseTime: 0,
		paused: 0,
	},

	sync: function() {
		this.trigger('change');
	}
});

var Sessions = Backbone.Collection.extend({
	model: Session,
	initialize: function() {
	},
	sync: function() {
		this.trigger('change');
	}
});

var Game = Backbone.Model.extend({

	defaults: {
		id: Number(new Date),
		name: 'Game',
		sessions: {},//(new Sessions(new Session({id: Number(new Date)}))),
		toDelete: false
	},

	sync: function() {
		this.trigger('change');
	}
});

var Games = Backbone.Collection.extend({
	model: Game,

	initialize: function(options) {
		this.load()
		this.listenTo(this, 'change', this.sync);
		this.listenTo(this, 'add', this.sync);
		this.listenTo(this, 'remove', this.sync);
	},

	load: function() {	
		var data = $.parseJSON(localStorage.getItem('games'));
		this.reset(_.map(data, function(item, id){
			sessionsCollection = new Sessions(_.map(item.sessions, function(session,idx){
				playersCollection = new Players(_.map(session.players, function(player, idp){
					if (typeof(player.score) == 'number'){
						player.timestamps = _.map(Array(player.score), function(a, b) {
							return session.id + b * 120000 + 60001 * idp
						})
						player.score = _.map(Array(player.score), function(a, b) {
							return 1
						})
					}
					return new Player(player)
				}));
				return new Session({pauseTime: session.pauseTime, paused: session.paused, startTime:session.startTime, finishTime:session.finishTime, id: session.id, players:playersCollection})
			}));
			return (new Game({name:item.name, sessions:sessionsCollection, id: item.id}))
		}));
	},

	sync: function() {
		//console.log('saved to localstorage')
		localStorage.setItem('games', JSON.stringify(this));
	}
});

/*Views --------------------------------  */

var GamesView = Backbone.View.extend({
	el: $('.games'),
	events: {
		'click .btn-add-game': 'addGame',
		'click .btn-ok' : 'saveNewName'

		//'click .btn-edit-game': 'editGame'
	},

	saveNewName: function() {
		console.log($('.game-name').val())
		$('.game-name').val()
	},

	addGame: function(e) {
		var master = this;
		e.preventDefault();
		var modalLink = $('.modalLink');
		$('.modalLink').css('display', 'block')
		var pop = modalLink.popup();
		pop.popup('open', {positionTo: '#popup-position'});
		modalLink.one({
			popupafterclose: function(event, ui) { 
				modalLink.popup('destroy'); 
			}
		});
		$('.game-name').focus();
		
		$('.game-name').keyup(function(event){
		    if(event.keyCode == 13){
		        $('.btn-ok').click();
		    }
		});

		$('.btn-ok').one('click', function() {
			modalLink.popup('close')
			master.createGame($('.game-name').val());
			$('.game-name').val('');
			$('.btn-cancel').off('click')
			$('.modalLink').css('display', 'none')
		})
		$('.btn-cancel').one('click', function() {
			modalLink.popup('close')
			$('.game-name').val('');
			$('.btn-ok').off('click')
			$('.modalLink').css('display', 'none')
		})
	},

	initialize: function() {
		this.collection.load()
		if (!this.collection.length) {
			this.collection.add(new Game()) 
			this.render()
		}
	},

	deleteAll: function() {
		this.undelegateEvents();
		this.$el.removeData().unbind();
	},

	changed: function() {
		this.initialize();
		this.render();
		this.trigger('change')
	},

	render: function() {
		var master = this;
		var gamesHolder = $('.games', this.$el);

		gamesHolder.empty();
		this.collection.each(function(item, id) {
			var gameView = (new GameView({model: item}))
			gameView.render().$el.appendTo(gamesHolder);
			master.listenTo(gameView, 'change', master.changed);
			master.listenTo(gameView, 'delete', master.deleted);
			gamesHolder.enhanceWithin();
		})
		//Swip functions
		$('.games').css('display','block');
			$('.ui-listview li > a')
		.on('touchstart', function(e) {
			$('.ui-listview li > a.open').css('left', '0px').removeClass('open') // close em all
			$(e.currentTarget).addClass('open')
			x = e.originalEvent.targetTouches[0].pageX // anchor point
		})
		.on('touchmove', function(e) {
			var change = e.originalEvent.targetTouches[0].pageX - x
			change = Math.min(Math.max(-100, change), 100) // restrict to -100px left, 0px right
			e.currentTarget.style.left = change + 'px'
			 // disable scroll once we hit 10px horizontal slide
		})
		.on('touchend', function(e) {
			var left = parseInt(e.currentTarget.style.left)
			var new_left;
			if (left < -35) {
				new_left = '-100px'
			} else if (left > 35) {
				new_left = '100px'
			} else {
				new_left = '0px'
			}
			// e.currentTarget.style.left = new_left
			$(e.currentTarget).animate({left: new_left}, 200)
			
		});
	},
	createGame: function(gameName) {
		if (!gameName) {
			var gameName = window.prompt('Name?');
		}

		if (!gameName) {
			return
		}

		var alreadyExists = _.filter(this.collection.models, function(item) { return item.attributes.name == gameName }).length > 0;
		if (alreadyExists) {
			window.alert('This game already exists')
			return
		}
		this.collection.add(new Game({id: Number(new Date), name: gameName}));
		this.trigger('change');
		this.render();
	}
});


var GameView = Backbone.View.extend({
	template: _.template($('#gameTemplate').text()),
	events: {
		'click .delete-btn': 'del',
		'click .edit-btn': 'editName',
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;

	},

	del: function() {
		var confirmed = window.confirm('are you sure ?')
		if (confirmed) {
			this.model.destroy();
			this.trigger('change');
		}
	},
	editName: function() {
		var oldName = this.model.get('name');
		var newName = window.prompt('what name ?')
		this.model.set('name', newName ? newName : oldName);
		//this.render();
		this.trigger('change')
	},

	/*showSessions: function() {
		this.trigger('left');
		console.log('requested sessions of game of ID:' + this.model.get('id'));
	},*/
});

var SessionsView = Backbone.View.extend({
	el: $('.sessions'),
	events: {
		'click .btn-add-session': 'addSession',
		'click .btn-add-game': 'addSession'
	},
	//template: _.template($('#sessionsTemplate').text()),

	changed: function() {
		this.trigger('change');
	},

	deleted: function() {
		this.render(this.gameID);
		this.trigger('delete');
		this.trigger('change');
	},

	duplicate: function(item){
		//this.collection.add(new Session({players: new Players({item.players.toJSON()})}));
		var session = item.toJSON();
		playersCollection = new Players(_.map(session.players.toJSON(), function(player, idp){
				player.score = [];
				player.timestamps = [];
				return new Player({id: player.id, score: player.score, name:player.name})
			}));
		var laSession = new Session({pauseTime: 0, paused: 0, startTime:0, finishTime:0, id: Number(new Date), players:playersCollection})
		this.collection.add(laSession);
		this.trigger('change');
		this.render(this.gameID);
	},

	render: function(gameID) {
		this.gameID = gameID
		var master = this;
		var sessionsHolder = $('.sessions', this.$el);
		sessionsHolder.empty();
		this.collection.each(function(item, id) {
			var sessionView = (new SessionView({model: item}))
			sessionView.render(gameID).$el.appendTo(sessionsHolder);
			master.listenTo(sessionView, 'change', master.changed);
			master.listenTo(sessionView, 'delete', master.deleted);
			master.listenTo(sessionView, 'duplicate', master.duplicate);
		})
		$('.sessions').css('display','block');
		$('#session-editor').attr('href','#sessionseditor?' + gameID);

		//Swip functions
		$('.sessions').css('display','block');
		$('.ui-listview li > a')
		.on('touchstart', function(e) {
			//console.log(e.originalEvent.pageX)
			$('.ui-listview li > a.open').css('left', '0px').removeClass('open') // close em all
			$(e.currentTarget).addClass('open')
			x = e.originalEvent.targetTouches[0].pageX // anchor point
		})
		.on('touchmove', function(e) {
			var change = (e.originalEvent.targetTouches[0].pageX - x)
			change = Math.min(Math.max(-100, change), 100) // restrict to -100px left, 0px right
			e.currentTarget.style.left = change + 'px'
			// disable scroll once we hit 10px horizontal slide
		})
		.on('touchend', function(e) {
			var left = parseInt(e.currentTarget.style.left)
			var new_left;
			if (left < -35) {
				new_left = '-100px'
			} else if (left > 35) {
				new_left = '100px'
			} else {
				new_left = '0px'
			}
			// e.currentTarget.style.left = new_left
			$(e.currentTarget).animate({left: new_left}, 200)
		});

	},
	addSession: function() {
		this.collection.add(new Session({id: Number(new Date), players: new Players(new Player({id: Number(new Date)}))}));
		this.trigger('change');
		this.render(this.gameID);

	}
});

var SessionView = Backbone.View.extend({
	template: _.template($('#sessionTemplate').text()),
	events: {
		'click .delete-btn' : 'deleteSession',
		'click .new-btn' : 'newGame'
	},

	render: function(gameID) {
		var playersNames = _.pluck(this.model.get('players').toJSON(), 'name')
		var scores = _.pluck(this.model.get('players').toJSON(), 'score')
		var titleString = formatDate(Number(new Date(this.model.get('id')))).substr(4,5) + ' - ' + _.map(playersNames, function(name, index){
			return name + ' ' + _.reduce(scores[index], function(memo, num){ return memo + num; }, 0)
		}).join(' - ')
		this.$el.html(this.template({
			gameID: gameID,
			id: this.model.get('id'),
			timestamp: titleString,
			timer: this.model.get('startTime') && !this.model.get('finishTime')
		}));
		return this;
	}, 
	changed: function() {
		this.trigger('change');
	},
	addedPlayer: function() {
		this.trigger('change')
		this.showSession()
	},
	deleteSession: function() {
		var confirmed = window.confirm('Sure ?');
		if (!confirmed) {
			return
		}
		this.model.destroy();
		this.trigger('delete');
	},
	newGame: function() {
		this.trigger('duplicate', this.model);
	}
});

var PlayersView = Backbone.View.extend({
	el: $('.players'),
	events: {
		'click .btn-add-player': 'addPlayer',
		'click .btn-reset-scores': 'resetScores',
		'click .btn-delete-last-record': 'deleteLastRecord',
		'click .session-title': 'pauseButton',
		'click .btn-session-function': 'sessionFunction'
	},

	template: _.template($('#playersTemplate').text()),
	
	resetTimer: function() {
		var sure = window.confirm('sure ?');
		if (!sure){
			return
		}
		this.model.set('finishTime', 0);
		this.model.set('startTime', 0);
		this.model.set('paused', 0);
		this.model.set('pauseTime', 0);
		clearInterval(appScore.app.timer);
		this.trigger('change');
		this.render();
	},

	pauseTimer: function() {
		this.model.set('paused', Number(new Date))
		clearInterval(appScore.app.timer);
		appScore.app.timer = null;
	},

	continueTimer: function() {
		this.model.set('pauseTime', this.model.get('pauseTime') + Number(new Date) - this.model.get('paused'))
		this.model.set('paused', 0)
		this.render();
		this.showTimer();
	},

	pauseButton: function() {
		var currentState = this.getState();
		if (currentState == 'started') {
			$('.session-title').css('color','red').html($('.session-title').html() + ' (PAUSED)')
			this.pauseTimer();
			return
		};
		if (currentState == 'paused') {
			$('.session-title').css('color','white')
			this.continueTimer();
			return
		}
	},

	finishSession: function() {
		var finished = window.confirm('Finish Session ?');
		if (!finished){
			return
		}
		this.model.set('finishTime', Number(new Date));
		if (this.model.get('paused')) {
			this.model.set('pauseTime', this.model.get('pauseTime') + Number(new Date) - this.model.get('paused'));
			this.model.set('paused', 0);
		}
		clearInterval(appScore.app.timer);
		this.trigger('change');
		this.render();
	},

	startSession: function() {
		if (!this.model.get('startTime')) {
			var master = this;
			this.model.set('startTime', Number(new Date))
			this.trigger('change')
			this.render();
		}
	},

	showTimer: function() {
		var master = this;
		var displayTimer = function() {
			$('.session-title').html(getDuration( master.model.get('startTime') && (0.001 * ( (master.model.get('finishTime') || Number(new Date)) - (master.model.get('startTime') + master.model.get('pauseTime') + (master.model.get('paused') ? Number(new Date) - master.model.get('paused') : 0) )  ) )))
		};
		displayTimer();

		clearInterval(appScore.app.timer);
		appScore.app.timer = null;

		if (this.getState() == 'started') {
			clearInterval(appScore.app.timer);
			appScore.app.timer = setInterval(function(){
				displayTimer();
			},1000)
		}
	},

	drawFunctionButton: function() {
		var startTime = this.model.get('startTime');
		var finishTime = this.model.get('finishTime');
		var buttonLabel = startTime && !finishTime ? 'Finish' : 'Start';
		var buttonLabel = finishTime ? 'Reset' : buttonLabel;
		$('.btn-session-function').html(buttonLabel)
		var state = this.getState();
		(state == 'started') || (state =='finished') ? $('.btn-add-player').css('display','none') :  $('.btn-add-player').css('display','block')
	},

	sessionFunction: function() {
		var startTime = this.model.get('startTime');
		var finishTime = this.model.get('finishTime');
		var buttonLabel = startTime && !finishTime ? 'Finish' : 'Start';
		var buttonLabel = finishTime ? 'Reset' : buttonLabel;
		$('.btn-session-function').html(buttonLabel)
		if (buttonLabel == 'Finish') {
			this.finishSession();
			return
		};
		if (buttonLabel == 'Start') {
			this.startSession();
			return
		};
		if (buttonLabel == 'Reset') {
			this.resetTimer();
			return
		};
	},

	getState: function() {
		var startTime = this.model.get('startTime');
		var finishTime = this.model.get('finishTime');
		var paused = this.model.get('paused');
		var stopTime = this.model.get('stopTime');
		//var pauseTime = this.model.get('pauseTime');
		if (startTime && paused) {
			return 'paused'
		};
		if (startTime && finishTime) {
			return 'finished'
		};
		if (!startTime && !finishTime) {
			return 'not_started'
		};
		if (startTime && !finishTime) {
			return 'started'
		};
	},

	changed: function() {
		this.trigger('change');
		var master = this;
		setTimeout(function() {master.displayChart()}, 0);
	},
	removedPlayer: function() {
		var master = this;
		var playersHolder = $('.players', this.$el);
		playersHolder.empty();

		this.model.get('players').each(function(item, id) {
			var playerView = (new PlayerView({model: item}))
			playerView.render().$el.appendTo(playersHolder);
			master.listenTo(playerView, 'change', master.changed);
			master.listenTo(playerView, 'delete', master.removedPlayer);
			master.listenTo(playerView, 'start', master.startSession);
		})
		this.trigger('change');
	},

	resetScores: function() {

		var conf = window.confirm('Reset Scores?');
		if (!conf) {
			return
		}
		this.model.get('players').each(function(item, id) {
			item.set('score', []);
			item.set('timestamps', []);
		})
		this.trigger('change');
		this.render();
	},

	deleteLastRecord: function() {
		console.log('deleting')
		var master = this;
		//determining what is the last timestamp
		var allLabels = [];
		_.each(_.pluck(this.model.get('players').toJSON(),'timestamps'), function(item){
			allLabels = _.union(allLabels, item)
		})

		var lastTimestamp = allLabels.sort()[allLabels.length - 1]
		console.log(allLabels)
		console.log(lastTimestamp)
		//delete the record for that Last timestamp
		this.model.get('players').each(function(item, idx) {
			console.log(item)
			var timestamps = item.get('timestamps');
			var score = item.get('score');
			if (timestamps[timestamps.length - 1] == lastTimestamp) {
				timestamps.splice(-1,1)
				score.splice(-1,1)
			}
		})

		this.trigger('change');
		this.render();
	},

	render: function() {
		var master = this;

		clearInterval(appScore.app.timer);
		appScore.app.timer = 0;

		this.listenTo(this.model, 'change', this.changed);

		var master = this;
		var playersHolder = $('.players', this.$el);
		playersHolder.empty();
		this.model.get('players').each(function(item, id) {
			var playerView = (new PlayerView({model: item}))
			playerView.render().$el.appendTo(playersHolder);
			master.listenTo(playerView, 'change', master.changed);
			master.listenTo(playerView, 'delete', master.removedPlayer);
			master.listenTo(playerView, 'start', master.startSession);
		})
		$('.players').css('display','block');

		this.showTimer();

		setTimeout(_.bind(master.displayChart, master),0)
		if (this.getState() == 'paused') {
			$('.session-title').css('color','red').html($('.session-title').html() + ' (PAUSED)')
		} else {
			$('.session-title').css('color','white');
		};
		this.drawFunctionButton();
	},

	displayChart: function(){
		try {
			_.each(appScore.app.chart, function(item, id){
				console.log('cleared ' + item.id)
				item.clear()
			})
			console.log('chart cleareddd')
		} catch(err){
			console.log('no chart')
		}
		//Chart.defaults.global.responsive = false;
		var master = this;
		var allLabels = [];
		_.each(_.pluck(master.model.get('players').toJSON(),'timestamps'), function(item){
			allLabels = _.union(allLabels, item)
		})
		allLabels.sort()	

		var results = _.map(master.model.get('players').toJSON(), function(label, i){
			var modifiedIncrements = _.map(allLabels, function(label, ind){
				var index = _.indexOf(_.pluck(master.model.get('players').toJSON(),'timestamps')[i], label);
				return index == -1 ? 0 : _.pluck(master.model.get('players').toJSON(),'score')[i][index]
			})

			var results = _.map(modifiedIncrements, function(inc, index){
					return _.reduce(modifiedIncrements.slice(0,index + 1), function(memo, num){ return memo + num; }, 0)
				})
			
			return results
		})

		var listOfColors = ['white', 'red', 'pink', 'orange', 'green', 'yellow', 'blue'];
		var allFormattedLabels = _.map(allLabels, function(val){
			return formatDate(String(val)).slice(String(val).length + 1, String(val).length + 10)
		});

		dataset = _.map(results, function(result, index){

			return {
				fillColor : "rgba(0,194,132,0.2)",
				strokeColor : listOfColors[index],
				pointColor : listOfColors[index],//"#fff",
				pointStrokeColor : listOfColors[index],
				data : result
			}
		})
		var buyerData = {
			labels :  allFormattedLabels,//["January","February","March","April","May","June"],
			datasets : dataset
		}
	    var buyers = $('#buyers').get(0).getContext('2d');
	    buyers.canvas.width = $(window).width();
		buyers.canvas.height = $(window).width();
		if (appScore.app.chart){
			_.each(appScore.app.chart, function(item, id){
				console.log('chart cleared number ' + item.id)
				item.clear();
				item.destroy();	
			})
			appScore.app.chart = [];
		}
    	appScore.app.chart.push(new Chart(buyers).Line(buyerData, {responsive: false, bezierCurve: false, animation: false}));
		console.log('chart number ' + appScore.app.chart.id)
	},

	addPlayer: function() {	
		var master = this;
		var playersHolder = $('.players', this.$el);
		playersHolder.empty();

		this.model.get('players').add((new Player({id: Number(new Date), timestamps:[], score:[]})));
		this.model.get('players')
		this.model.get('players').each(function(item, id) {
			var playerView = (new PlayerView({model: item}))
			playerView.render().$el.appendTo(playersHolder);
			master.listenTo(playerView, 'change', master.changed);
			master.listenTo(playerView, 'delete', master.removedPlayer);
		})
		this.trigger('change');
		$('.player-name').focus()
		//this.render();
	}

});

var PlayerView = Backbone.View.extend({

	template: _.template($('#playerTemplate').text()),
	events: {
		'click .player-name': 'deleteName',
		'change .player-name': 'rename',
		'click .plus': 'plus',
		'click .minus': 'minus',
		'touchstart .plus': 'vibrate',
		'touchstart .minus': 'vibrate',
		'click .btn-remove': 'delete',
		'keyup .player-name': 'rename'
	},

	vibrate: function() {
		navigator.vibrate(200)
	},

	render: function() {
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	incrementScore: function(increment) {
		var currentScore = this.model.get('score');
		currentScore.push(increment);
		this.model.set('score', currentScore);
		var currentTimestamps = this.model.get('timestamps');
		currentTimestamps.push(Number(new Date))
		this.model.set('timestamps', currentTimestamps);
		($('.score', this.$el)).text(_.reduce(currentScore, function(memo, num){ return memo + num; }, 0));
		this.trigger('change');
	},

	plus: function() {
		this.incrementScore( 1 );
		//this.trigger('start');
	},

	minus: function() {
		this.incrementScore( -1 );
		//this.trigger('start');
	},

	delete: function() {
		var conf = window.confirm('Delete Player ' + this.model.get('name') + '?')
		if (conf) {
			this.model.destroy();
			this.trigger('delete');
		}
	},

	deleteName: function() {
		//$('.player-name', this.$el).val('');
	},

	rename: function() {
		var newName = $('.player-name', this.$el).val();
		this.model.set('name', newName);
		this.trigger('change');
	}
});

var appScore = {};

appScore.app = {
	activeViews: [],
	timer: 0,
	chart: [],
	pop: [],
	gamesCollection: (new Games()),

	// Application Constructor
	initialize: function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	
	// 'load', 'deviceready', 'offline', and 'online'.
	undelegateAll: function() {
		_.each(this.activeViews, function(view) {
			try {
				view.undelegateEvents();
				$(view.el).removeData().unbind(); 
			} catch(err) {
				console.log(err)
			}
		})
		this.activeViews = []
	},

	games: function(event, args) {
		console.log(appScore.app.activeViews)
		this.undelegateAll();
		this.bindEvents();

		this.gamesCollection.load();
		var view = new GamesView({ collection: this.gamesCollection })
		this.activeViews.push( view );
		view.render();
		$('.app-name').html('ScoreKeeper')

	},

	sessions: function(event, args) {

		this.undelegateAll();
		
		this.bindEvents();
		this.gamesCollection.load();
		var view = new SessionsView({ collection: (this.gamesCollection.get(args[1])).get('sessions') });
		this.activeViews.push( view );
		view.render(args[1]);
		$('.title').html(this.gamesCollection.get(args[1]).get('name'))
		$('.btn-back').attr('href','#games')
		this.gamesCollection.listenTo(view, 'change', this.gamesCollection.sync)

	},

	session: function(event, args) {
		this.undelegateAll();
		this.bindEvents();
		this.gamesCollection.load();
		var view = new PlayersView({ model: (this.gamesCollection.get(args[1])).get('sessions').get(args[2]) });
		this.activeViews.push( view );
		
		view.render(args[2]);
		this.gamesCollection.listenTo(view, 'change', this.gamesCollection.sync)

		//Unelegant changes to the header
		$('.btn-back').attr('href','#sessions?' + args[1])

	},

	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
		//document.addEventListener("DOMContentLoaded", function() { console.log('dom loaded')})
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicitly call 'app.receivedEvent(...);'
	onDeviceReady: function() {
		/*$(".myMenu ul li a").on("touchend", function(event) {
  window.location.href = $(this).attr("href");
});*/
		FastClick.attach(document.body);
		app.receivedEvent('deviceready');
	},
	// Update DOM on a Received Event
	receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');
		console.log('Received Event: ' + id);
	}
};

appScore.router = new $.mobile.Router(
	{
		"#games": { handler: "games", events: "bs"},	
		"#sessions[?](\\d+)": { handler: "sessions", events: "bs"},
		"#session[?](\\d+)[?](\\d+)": { handler: "session", events: "bs"},			
	},
	appScore.app
);

