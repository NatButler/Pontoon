// HELPER FUNCTIONS
function randomInt(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}


// CARD CONSTRUCTOR
function Card(rank, suit, value) {
	this.rank = rank;
	this.suit = suit;
	if (value) { this.value = value; }
}


// DECK CONSTRUCTOR
function Deck() {
	this.suits = ['Clubs', 'Diamonds', 'Hearts', 'Spades'];
	this.ranks = ['A', '2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K'];
	this.cards = new Array(this.suits.length * this.ranks.length);
}

Deck.prototype.cardAt = function(pos) {
	return this.cards[pos];
}

Deck.prototype.setCardAt = function(pos, card) {
	this.cards[pos] = card;
}

Deck.prototype.buildDeck = function(game) {
	for (var s = 0; s < this.suits.length; s++) {
		for (var r = 0; r < this.ranks.length; r++) {
			var card = new Card(this.ranks[r], this.suits[s]);
			this.setCardAt(s * this.ranks.length + r, card);
		}
	}
	return this.cards;
}

Deck.prototype.shuffle = function(cards) {
	var newCards = this.cards,
		len = this.cards.length;

	for (var j = 0; j < 10; j++) {
		var spliceInt = randomInt( Math.ceil(len / 2) - 3, Math.ceil(len / 2) + 3 ),
			deckRight = newCards,
			deckLeft = deckRight.splice( 
				spliceInt, len - spliceInt
			),
			shuffledDeck = [];

		for (var i = 0; i < len; i++) {
			if (deckLeft.length) {
				shuffledDeck.push(deckLeft.pop());
			}

			if (deckRight.length) {
				shuffledDeck.push(deckRight.pop());
			}
		}

		newCards = shuffledDeck;
	}

	this.cards = newCards;
	return this.cards;
}

Deck.prototype.cut = function(cards) {
	return this.cardAt(randomInt(0, this.cards.length-1));
}

Deck.prototype.deal = function() {
	return this.cards.shift();
}

// HAND CONSTRUCTOR
function Hand() {

}