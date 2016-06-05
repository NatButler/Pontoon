'use strict';

// GAME CLASS
class Game {
	constructor(config) {
		this.loStake = config.loStake;
		this.hiStake = config.hiStake;
		this.table = new Table(config.cardVals);
		this.banker;
		// this.rules; winning hands etc passed in config / require module
	}

	addPlayer(name) {
		var numPlayers = this.table.dealOrder.length;
		if (numPlayers < 8) {
			var id = 'P_' + numPlayers;
			this.table.addToTable(id);
			return this.table.players.store(id, new Player(id, name));
		}
	}

	cutForDealer() {
		var cutCards = [];
		while (!cutCards.length) {
			for (var i = 0, len = this.table.dealOrder.length; i < len; i++) {
				var cut = this.table.deck.cut(),
					player = this.table.players.lookup(this.table.dealOrder[i]);	
				cutCards.push( player.cutCards(cut) ); 
			}
			if ( findDuplicates(cutCards) ) { cutCards = []; }
		}
		this.table.dealer = 'P_' + highestCard(cutCards);
		return this.banker = this.table.dealer;
	}
}


// TABLE CLASS
class Table {
	constructor(cardVals) {
		this.players = new Dictionary();
		this.dealOrder = [];
		this.turn;
		this.dealer;
		this.hands = [];
		this.deck = new Deck({
			cardVals: cardVals
		});
	}

	addToTable(id) {
		return this.dealOrder.push(id);
	}

	playerBroke(id) {
		var idx = this.dealOrder.indexOf(id);
		this.dealOrder.splice(idx, 1);
	}

	setDealOrder() { // Sorts array so dealer is last
		var order = [],
			bankerIdx = this.dealOrder.indexOf(this.dealer);

		if (this.dealOrder.indexOf(this.dealer) !== this.dealOrder.length -1) {
			var start = this.dealOrder.splice(bankerIdx+1);
			this.dealOrder = start.concat(this.dealOrder);
		}
		return this.dealOrder;
	}

	deal(order, num) {
		var order = order ? order : this.dealOrder;
		do {
			for (var i = 0, len = order.length; i < len; i++) {
				var player = this.players.lookup(order[i]);
				player.hand.add( this.deck.deal(), order[i] );
			}
			num--;
		} while (num)
	}

	turns() {
		if (!this.turn) { this.turn = this.dealOrder[0]; } 
		else {
			var idx = this.dealOrder.indexOf(this.turn) + 1;
			this.turn = this.dealOrder[idx];
		}
		return this.turn;
	}

	addHand(id) {
		this.hands.push(id);
	}
}


// PLAYER CLASS
class Player {
	constructor(id, name, chips) {
		this.name = name;
		this.id = id;
		this.chips = chips ? chips : 5000;
		this.hand = new Hand();
		this.bets = [];
	}

	cutCards(card) {
		this.cutCard = card;
		return this.cutCard.cutVal;
	}

	bet(stake) {
		this.chips -= stake;
		this.bets.push(stake);
		return this.betTotal();
	}

	betTotal() {
		return this.bets.reduce(sum, 0);
	}

	bust() {
		this.hand = new Hand();
		this.bets = [];
	}
}


// CARD CLASS
class Card {
	constructor(rank, suit, cutVal, val) {
		this.rank = rank;
		this.suit = suit;
		this.value = val;
		this.cutVal = cutVal;
	}

	name() {
		return this.rank + this.suit;
	}
}


// DECK CLASS
class Deck {
	constructor(config) {
		this.suits = ['C', 'D', 'H', 'S'];
		this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
		this.cards = new Array(this.suits.length * this.ranks.length);
		this.cutVals = new Dictionary({ "A": 14, "2": 2, "3": 3, "4": 4, "5": 5, "6": 6, "7": 7, "8": 8, "9": 9, "T": 10, "J": 11, "Q": 12, "K": 13 });
		this.cardVals = config.cardVals;
		this.buildDeck();
	}

	cardAt(pos) {
		return this.cards[pos];
	}

	setCardAt(pos, card) {
		this.cards[pos] = card;
	}

	buildDeck() {
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

	shuffle(amount) {
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

	splitPoint(len) {
		return randomInt( Math.ceil(len / 2) - 3, Math.ceil(len / 2) + 3 );
	}

	cut() {
		return this.cardAt( randomInt(0, this.cards.length-1) );
	}

	deal() {
		return this.cards.pop();
	}

	returnToDeck(hand) {
		forEach( hand, card => this.cards.unshift(card) );
	}
}


// HAND CLASS
class Hand {
	constructor(cards) {
		this.cards = cards ? cards : [];
		this.value;
		this.state;
		this.name;
	}

	add(card, id) {
		this.cards.push(card);
		$.publish('dealt', [id, this]);
	}
}


// DICTIONARY CLASS
class Dictionary {
	constructor(startValues) {
		this.values = startValues || {};
	}

	store(name, value) {
		return this.values[name] = value;
	}

	lookup(name) {
		return this.values[name];
	}

	contains(name, val) {
		var val = val ? this.values.val : this.values;
		return Object.prototype.propertyIsEnumerable.call(val, name);
	}

	each(action) {
		forEachIn(this.values, action);
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
		if (Object.prototype.propertyIsEnumerable.call(object, property)) {
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