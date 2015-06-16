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

var app = {
	// Application Constructor
	initialize: function() {
		this.bindEvents();
	},
	// Bind Event Listeners
	//
	// Bind any events that are required on startup. Common events are:
	// 'load', 'deviceready', 'offline', and 'online'.
	bindEvents: function() {
		document.addEventListener('deviceready', this.onDeviceReady, false);
	},
	// deviceready Event Handler
	//
	// The scope of 'this' is the event. In order to call the 'receivedEvent'
	// function, we must explicitly call 'app.receivedEvent(...);'
	onDeviceReady: function() {
		app.receivedEvent('deviceready');
	},
	// Update DOM on a Received Event
	receivedEvent: function(id) {
		var parentElement = document.getElementById(id);
		var listeningElement = parentElement.querySelector('.listening');
		var receivedElement = parentElement.querySelector('.received');

		listeningElement.setAttribute('style', 'display:none;');
		receivedElement.setAttribute('style', 'display:block;');

		console.log('Received Event: ' + id);
	}
};




/**
 * Games (collection of Game models)
 *    Game (name, sessions (collection of Session models))
 *       Session (timestamp, players (collection of Player models))
 *          Player (id, name, score)
 */

/*
var games = [{name:"Game", sessions: [
  { timestamp: 2434, players: [ 
  	 {name: 'Dan', score: 1 },
  	 {name: 'Alo', score: 0 }
  	]
  }, {
  	timestamp: 234234, players: [
  	]
  }
]}, { name: '9ball', sessions: [
  { timestamp: 2434, players: [ 
  	 {name: 'Dan', score: 1 },
  	 {name: 'Alo', score: 0 }
  	]
  }, {
  	timestamp: 234234, players: [
  	]
  }
  ]}
]
*/

var Player = Backbone.Model.extend({
	defaults: {
		id: 0,
		name: 'A',
		score: 0
	},

	sync: function() {},
});

var Players = Backbone.Collection.extend({

	model: Player,

	sync: function() {
		this.trigger('change');
	}
});

var Session = Backbone.Model.extend({
	defaults: {
		timestamp: (new Date).toJSON(),
		players: (new Players([new Player])).toJSON()
	},

	sync: function() {
		this.trigger('change');
	}
});

var Sessions = Backbone.Collection.extend({
	model: Session,
	initialize: function() {
		//this.listenTo(this, 'change', this.sync);
		//this.listenTo(this, 'add', this.sync);
		//this.listenTo(this, 'remove', this.sync);
	},
	sync: function() {
		this.trigger('change');
	}

});

var Game = Backbone.Model.extend({

	defaults: {
		name: 'Game',
		sessions: (new Sessions(new Session)).toJSON()
	},

	addSession: function() {
		this.add('sessions', new Session({timestamp:(new Date).toJSON()}))
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
		this.reset(_.each(data, function(item, id){
			return (new Game(item))
		}));
	},

	sync: function() {
		localStorage.setItem('games', JSON.stringify(this));
	}
});

/*Views --------------------------------  

var GameView = Backbone.View.extend({
	model: Game,
	el: $('.app'),
	events: {
		'click .add-player': 'addPlayer'
	},

	initialize: function() {
		this.model.collection.load()
		this.listenTo(this.model.collection, 'remove', this.render);
		this.listenTo(this.model.collection, 'add', this.render);
	},

	render: function() {
		var playersHolder = $('.players', this.$el);	
		playersHolder.empty();
		this.model.collection.each(function(p, id) {
			(new PlayerView({ model: p})).render().$el.appendTo(playersHolder);
		});
		return this;
	},

	addPlayer: function() {
		var newPlayerName = String.fromCharCode(65 + this.model.collection.length);
		this.model.set('collection', new Player({ id: this.model.collection.length + 1, name: newPlayerName, score: 0}));
		this.render();
	}
});
*/


var GamesView = Backbone.View.extend({
	el: $('.app'),
	events: {
		'click .add-game': 'addGame'
	},

	initialize: function() {
		this.collection.load()
		if (!this.collection.length) {
			this.collection.add(new Game({id:0})) 
			this.render()
		}
		this.listenTo(this.collection, 'remove', this.render);
		this.listenTo(this.collection, 'add', this.render);
		this.listenTo(this.collection, 'change', this.render);
	},

	render: function() {
		var gamesHolder = $('.games', this.$el);
		gamesHolder.empty();
		this.collection.each(function(item, id) {
			(new GameView({model: item})).render().$el.appendTo(gamesHolder);
		})
	},

	addGame: function() {
		var gameName = $('.game-name').val();
		if (!gameName) {
			return
		}

		var alreadyExists = _.filter(this.collection.models, function(item) { return item.attributes.name == gameName }).length > 0;
		if (alreadyExists) {
			return
		}
		console.log(this.collection);
		this.collection.add(new Game({ name: gameName }));
		this.render()
	}

});

var GameView = Backbone.View.extend({
	template: _.template($('#gamesTemplate').text()),
	events: {
		'click .btn-delete-game': 'remove',
		'click .btn-edit-game-name': 'editName',
		'click .btn-game-name': 'showSessions',
	},

	render: function() {
		$('.sessions').empty();
		this.$el.html(this.template(this.model.toJSON()));
		return this;
	},

	remove: function() {
		var confirmed = window.confirm('are you sure ?')
		if (confirmed) {
			this.model.trigger('change');
			this.model.destroy();		
			this.render();
		}
	},

	editName: function() {
		var newName = window.prompt('what name ?')
		this.model.set('name', newName);
	},

	changed: function() {
		this.model.trigger('change');
		this.render();
		this.showSessions();
	},

	showSessions: function() {
		var sessionsHolder = $('.sessions');
		sessionsHolder.empty();
		var sessions = (new SessionsView({collection: this.model.get('sessions')}));
		sessions.render().$el.appendTo(sessionsHolder);
		this.listenTo(sessions, 'change', this.changed);
	},
});

var SessionView = Backbone.View.extend({
	template: _.template($('#sessionTemplate').text()),
	events: {
		'click .btn-session': 'showSession',
	},
	render: function() {
		console.log(this.model.toJSON())
		this.$el.html(this.template((this.model.toJSON())));
		return this;
	}, 
	changed: function() {
		this.model.trigger('change');
		this.render();
		//this.showSessions();
	},
	showSession: function() {

		this.model.set('timestamp', (new Date()).toJSON())
		console.log(this.model)
		this.model.trigger('change');
		this.trigger('change');
		this.render();
		/*this.model.players[0].name='caca';
		this.model.players.push((new Player()).toJSON());
		this.trigger('change');
		console.log(this.model);
		master = this;
		var playersHolder = $('.players');
		playersHolder.empty();
		console.log(this.model)
		var players = (new PlayersView({collection: this.model.players}));
		players.render().$el.appendTo(playersHolder);
		this.listenTo(players, 'change', this.changed);*/
	}
});

var PlayersView = Backbone.View.extend({

	events: {
		'click .btn-add-player': 'addPlayer',
	},
	template: _.template($('#playersTemplate').text()),
	render: function() {
		var master = this;
		var playersHolder = $('.players');
		playersHolder.empty();
		var dat = _.each(this.collection, function(item, id) {
			console.log(item);
			return (new PlayerView({model: item})).render().$el.appendTo(playersHolder);
		})
		this.$el.html(this.template(dat));
		return this;
	},
	addPlayer: function() {	
		this.collection.push((new Player({timestamp: (new Date).toJSON()})).toJSON());
		this.trigger('change');
	}
});


var SessionsView = Backbone.View.extend({

	events: {
		'click .btn-add-session': 'addSession',
	},
	template: _.template($('#sessionsTemplate').text()),
	changed: function() {
		console.log('changed sessions')
		this.trigger('change');
	},
	render: function() {
		var master = this;
		console.log(this.collection)
		var sessionsHolder = $('.sessions');
		sessionsHolder.empty();
		var dat = _.each(this.collection, function(item, id) {
			var newSession = (new SessionView({model: new Session(item)}));
			newSession.render().$el.appendTo(sessionsHolder);
			master.listenTo(newSession, 'change', master.changed);
		})
		this.$el.html(this.template(dat));
		return this;
	},
	addSession: function() {	
		this.collection.push((new Session({timestamp: (new Date).toJSON()})).toJSON());
		this.changed();
	}
});

var PlayerView = Backbone.View.extend({
	template: _.template($('#playerTemplate').text()),
	events: {
		'change .name': 'rename',
		'click .plus': 'plus',
		'click .minus': 'minus',
		'click .remove': 'remove'
	},

	render: function() {
		this.$el.html(this.template(this.model));
		return this;
	},

	incrementScore: function(increment) {
		var newScore = (this.model.score ? parseInt(this.model.get('score')) : 0) + increment;
		this.model.set('score', newScore);
		$('.score', this.$el).html(newScore)
	},

	plus: function() {
		this.incrementScore( 1 );
	},

	minus: function() {
		this.incrementScore( -1 );
	},

	remove: function() {
		this.model.destroy();
	},

	rename: function() {
		var newName = $('.name', this.$el).val();
		this.model.set('name', newName);
	}
});

console.log(localStorage.games);

var games = new GamesView({ collection: new Games });
games.render();


