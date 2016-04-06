'use strict';

// DICTIONARY CONSTRUCTOR
function Dictionary(startValues) {
	this.values = startValues || {};
}

Dictionary.prototype.store = function(name, value) {
	return this.values[name] = value;
}

Dictionary.prototype.lookup = function(name) {
	return this.values[name];
}

Dictionary.prototype.contains = function(name, val) {
	var val = val ? this.values.val : this.values;
	return Object.prototype.propertyIsEnumerable.call(val, name);
}

Dictionary.prototype.each = function(action) {
	forEachIn(this.values, action);
}


// CARD CONSTRUCTOR
function Card(rank, suit, cutVal, val) {
	this.rank = rank;
	this.suit = suit;
	this.value = val;
	this.cutVal = cutVal;
}

Card.prototype.name = function() {
	return this.rank + this.suit;
}


// DECK CONSTRUCTOR
function Deck(config) {
	this.suits = ['C', 'D', 'H', 'S'];
	this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	this.cards = new Array(this.suits.length * this.ranks.length);
	this.cutVals = new Dictionary({ "A": 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13 });
	this.cardVals = config.cardVals;
	this.buildDeck();
}

Deck.prototype.cardAt = function(pos) {
	return this.cards[pos];
}

Deck.prototype.setCardAt = function(pos, card) {
	this.cards[pos] = card;
}

Deck.prototype.buildDeck = function() {
	for (var s = 0; s < this.suits.length; s++) {
		for (var r = 0; r < this.ranks.length; r++) {
			this.setCardAt( 
				s * this.ranks.length + r, 
				new Card(
					this.ranks[r],
					this.suits[s],
					this.cutVals.lookup(this.ranks[r]),
					this.cardVals.lookup(this.ranks[r])
				) 
			);
		}
	}
}

Deck.prototype.shuffle = function(amount) {
	var amount = amount ? amount : 7,
		len = this.cards.length;

	for (var i = 0; i < amount; i++) {
		var	split = this.splitPoint(len),
			deckL = this.cards,
			deckR = deckL.splice( split, len - split ),
			shuffledDeck = [];

		for (var j = 0; j < len;) {
			if (deckL.length) { riffle( deckL, randomInt(1,2) ) }
			if (deckR.length) { riffle( deckR, randomInt(1,2) ) }

			function riffle(side, num) {
				var num = (num > side.length) ? --num : num;
				for (var k = 0; k < num; k++) {
					shuffledDeck.push( side.shift() );
					j++;
				}
			}
		}
		this.cards = shuffledDeck;
	}
}

Deck.prototype.splitPoint = function(len) {
	return randomInt( Math.ceil(len / 2) - 3, Math.ceil(len / 2) + 3 );
}

Deck.prototype.cut = function() {
	return this.cardAt( randomInt(0, this.cards.length-1) );
}

Deck.prototype.deal = function(order, amount) {
	do {
		for (var i = 0, len = order.length; i < len; i++) {
			var player = pontoon.players.lookup(order[i]);
			player.hand.add( this.cards.pop(), order[i] );
		}
		amount--;
	} while (amount)
}

Deck.prototype.returnToDeck = function(hand) {
	forEach(hand, card => this.cards.unshift(card) );
}


// GAME CONSTRUCTOR
function Game(config) {
	this.loStake = config.loStake;
	this.hiStake = config.hiStake;
	this.table = new Table(config.cardVals);
	this.players = new Dictionary();
}

Game.prototype.setStakes = function(lo, hi) {
	this.loStake = lo;
	this.hiStake = hi;
}

Game.prototype.addPlayer = function(name) {
	var numPlayers = this.table.dealOrder.length;
	if (numPlayers < 8) {
		var id = 'P_' + numPlayers;
		this.table.addToTable(id);
		return this.players.store(id, new Player(id, name));
	}
}


// TABLE CONSTRUCTOR
function Table(cardVals) {
	this.dealOrder = [];
	this.turn;
	this.banker;
	this.hands = [];

	this.deck = new Deck({
		cardVals: cardVals
	});
}

Table.prototype.addToTable = function(id) {
	return this.dealOrder.push(id);
}

Table.prototype.removeFromTable = function(id) {
	var idx = this.dealOrder.indexOf(id);
	this.dealOrder.splice(id, 1);
}

Table.prototype.determineDealer = function() {
	var cutCards = [];
	while (!cutCards.length) {
		pontoon.players.each(function(id, player) { 
			cutCards.push( player.cutDeck() ); 
		});
		if ( findDuplicates(cutCards) ) { cutCards = []; }
	}
	return this.banker = 'P_'+highestCard(cutCards); // use .reduce()?
}

Table.prototype.setDealOrder = function() {
	var order = [],
		bankerIdx = this.dealOrder.indexOf(this.banker);

	if (this.dealOrder.indexOf(this.banker) !== this.dealOrder.length -1) {
		var start = this.dealOrder.splice(bankerIdx+1);
		this.dealOrder = start.concat(this.dealOrder);
	}
	return this.dealOrder;
}

Table.prototype.deal = function() {
	this.deck.deal(this.dealOrder);
}

Table.prototype.turns = function() {
	if (!this.turn) { this.turn = this.dealOrder[0]; } 
	else {
		var idx = this.dealOrder.indexOf(this.turn) + 1;
		this.turn = this.dealOrder[idx];
	}
	return this.turn;
}

Table.prototype.addHand = function(id) {
	this.hands.push(id);
}


// PLAYER CONSTRUCTOR
function Player(id, name, chips) { 	
	this.name = name;
	this.id = id;
	this.chips = chips ? chips : 5000;
	this.hand = new Hand();
	this.bets = [];
}

Player.prototype.cutDeck = function() {
	this.cutCard = pontoon.table.deck.cut();
	return this.cutCard.cutVal;
}

Player.prototype.bet = function(val) {
	this.chips -= val;
	this.bets.push(val);
	return this.bets[this.bets.length-1];
}

Player.prototype.betTotal = function() {
	return this.bets.reduce(sum, 0);
}

Player.prototype.bust = function() {
	pontoon.table.deck.returnToDeck(this.hand.cards);
	this.hand = new Hand();
	pontoon.players.lookup(pontoon.table.banker).chips += this.betTotal();
	this.bets = [];
}


// HAND CONSTRUCTOR
function Hand(card) {
	this.cards = card ? [card] : [];
	this.value;
	this.state;
	this.name;
}

Hand.prototype.add = function(card, id) {
	this.cards.push(card);
	this.total(id);
	$.publish('deal', [id, this]);
}

Hand.prototype.total = function(id) { // Needs refactoring
	var handVal = 0,
		handLen = this.cards.length,
		aces = 0;

	for (var i = 0; i < handLen; i++) {
		if (this.cards[i].rank == 'A') { aces++; }
		handVal += this.cards[i].value;
	}

	if (handLen < 2) {
		this.value = handVal;
		this.name = handVal.toString();
	}

	else if (handLen === 2) {
		if (handVal === 21) {
			this.value = handVal;
			this.name = 'Pontoon';
		} 
		else if (this.cards[0].rank === this.cards[1].rank) {
			if (aces) {
				this.value = hasAces(this);
				this.name = handVal.toString();
			} 
			else {
				this.value = handVal;
				this.name = handVal.toString();
			}
		} 
		else if (aces) {
			this.value = handVal;
			this.name = handVal.toString();
			this.state = '(Soft)';
		} 
		else {
			this.value = handVal;
			this.name = handVal.toString();
		}
	}

	else if (handLen > 2) {
		if (handVal > 21 && aces === 0) {
			this.value = handVal;
			this.state = 'Bust';
			this.name = 'Bust';
		} 
		else if (handVal >= 21 && aces) {
			this.value = hasAces(this);
			this.name = handVal.toString();
			if (this.value > 21) {
				this.state = 'Bust';
				this.name = 'Bust';
			} 
			else if (handLen === 5) {
				this.state = '';
				this.name = '5 card trick';
			} 
			else if (this.value === 21) {
				this.name = '21';
				this.state = '';
			}
		} 
		else if (handVal < 21 && aces) {
			this.value = handVal;
			this.name = handVal.toString();
			this.state = '(Soft)';
		} 
		else if (handVal <= 21 && handLen === 5) {
			this.state = '';
			this.name = '5 card trick';
		}
		else if (handVal === 21) {
			this.value = handVal;
			if (handLen < 5  && aces === 0) {
				this.name = '21';
				this.state = '';
			} 
			else if (handLen < 5 && aces) {
				this.name = handVal.toString();
			}
		} 
		else {
			this.value = handVal;
			this.state = '';
			this.name = handVal.toString();
		}
	}

	function hasAces(hand) {
		for (var i = 1; i <= aces; i++) {
			if ( (handVal - (10 * i)) <= 21 ) {
				if (i === 1 && aces === 2) { hand.state = '(Soft)'; } 
				else { hand.state = '(Hard)'; }
				return handVal -= (10 * i);
			}
		}
		return handVal;
	}
}


// UTILITY FUNCTIONS
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

function sum(acc, item) {
	return acc + item;
}

function forEach(arr, action) {
	for (var i = 0, len = arr.length; i < len; i++) {
		action(arr[i]);
	}
}

function forEachIn(object, action) {
	for (var property in object) {
		if (Object.prototype.propertyIsEnumerable.call(object, property)) { // Object.prototype.hasOwnProperty.call(object, property)
			action(property, object[property]);
		}
	}
}

function findDuplicates(arr) {
	var newArr = arr.slice().sort();
	for (var i = 0, len = arr.length; i < len; i++) {
		if (i > 0 && newArr[i] === newArr[i-1]) { return true; }
	}
}

function highestCard(arr) { // Returns index of highest value: use .reduce()?
	var max = arr[0], idx = 0;
	for (var i = 1, len = arr.length; i < len; i++) {
	    if (arr[i] > max) {
	        idx = i;
	        max = arr[i];
	    }
	}
	return idx;
}