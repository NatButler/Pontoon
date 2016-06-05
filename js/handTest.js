// Hand total test

function createHand(total, len) {
	var cards = [createCard(10, 'K'), createCard(11, 'A'), createCard(3, '3'), createCard(5, '5')];
	return new Hand(cards);
}

function createCard(val, rank) {
	return new Card(rank, 'D', null, val)
}

function handLen() {
	return Math.floor(Math.random() * 5) + 2  ;
}

function testHand(hand, expectedTotal) {
	var result = checkHand(hand);
	if (result.value !== expectedTotal) {
		console.log('Error:');
	}
	console.log(result);
}

testHand(createHand(), 19);