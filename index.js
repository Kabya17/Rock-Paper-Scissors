const crypto = require('crypto');
const prompt = require('prompt-sync')();

class InputValidator {
    constructor(args) {
        this.args = args;
    }

    validate() {
        const moves = this.args;
        const uniqueMoves = new Set(moves);

        if (moves.length < 3) {
            return { valid: false, message: 'Error: You must provide at least 3 moves.' };
        }
        if (moves.length % 2 === 0) {
            return { valid: false, message: 'Error: Number of moves must be odd.' };
        }
        if (uniqueMoves.size !== moves.length) {
            return { valid: false, message: 'Error: Moves must be non-repeating.' };
        }

        return { valid: true, message: 'Valid input.' };
    }
}

class KeyGenerator {
    constructor() {
        this.key = this.generateKey();
    }
    generateKey() {
        return crypto.randomBytes(32).toString('hex');
    }
    generateHMAC(message) {
        const hmac = crypto.createHmac('sha3-256', this.key);
        hmac.update(message);
        return hmac.digest('hex');
    }
}

class GameRules {
    constructor(moves) {
        this.moves = moves;
        this.numMoves = moves.length;
        this.halfMoves = Math.floor(this.numMoves / 2);
    }
    determineOutcome(userMove, computerMove) {
        const userIndex = this.moves.indexOf(userMove);
        const computerIndex = this.moves.indexOf(computerMove);
        const result = Math.sign((userIndex - computerIndex + this.halfMoves + this.numMoves) % this.numMoves - this.halfMoves);

        switch(result) {
            case 1:
                return 'Win';
            case -1:
                return 'Lose';
            case 0:
                return 'Draw';
            default:
                throw new Error('Unexpected result');
        }
    }
}

class HelpTable {
    constructor(moves, gameRules) {
        this.moves = moves;
        this.gameRules = gameRules;
    }
    generateTable() {
        const numMoves = this.moves.length;
        const columnWidth = 12;
        console.log("\nHelp Table: Results are from the user's point of view.\n");
        let header = 'v PC\\User >'.padEnd(columnWidth);
        header += this.moves.map(move => move.padEnd(columnWidth)).join('');
        console.log(header);

        this.moves.forEach(userMove => {
            let row = userMove.padEnd(columnWidth);
            this.moves.forEach(computerMove => {
                const result = this.gameRules.determineOutcome(computerMove, userMove);
                row += result.padEnd(columnWidth);
            });
            console.log(row);
        });
    }
}

class Game {
    constructor(moves) {
        this.moves = moves;
        this.keyGen = new KeyGenerator();
        this.gameRules = new GameRules(moves);
        this.helpTable = new HelpTable(moves, this.gameRules);
        this.computerMove = moves[Math.floor(Math.random() * moves.length)];
    }

    start() {
        const hmac = this.keyGen.generateHMAC(this.computerMove);
        console.log(`HMAC: ${hmac}`);

        while (true) {
            console.log("\nAvailable moves:");
            this.moves.forEach((move, index) => console.log(`${index + 1} - ${move}`));
            console.log("0 - exit");
            console.log("? - help");
            const userInput = this.getUserInput();

            if (userInput === '0') {
                console.log("Goodbye!");
                process.exit(0);
            } else if (userInput === '?') {
                this.helpTable.generateTable();
            } else {
                const userMoveIndex = parseInt(userInput) - 1;
                if (userMoveIndex >= 0 && userMoveIndex < this.moves.length) {
                    const userMove = this.moves[userMoveIndex];
                    const result = this.gameRules.determineOutcome(userMove, this.computerMove);
                    console.log(`Your move: ${userMove}`);
                    console.log(`Computer's move: ${this.computerMove}`);
                    console.log(`Result: You ${result}!`);
                    console.log(`HMAC Key: ${this.keyGen.key}`);
                    break;
                } else {
                    console.log("Invalid input, please try again.");
                }
            }
        }
    }
    getUserInput() {
        return prompt("Enter your move: ");
    }
}

const moves = process.argv.slice(2);
const validator = new InputValidator(moves);
const validation = validator.validate();

if (!validation.valid) {
    console.error(validation.message);
    console.log("Example: node index.js rock paper scissors");
    process.exit(1); 
} else {
    console.log("Valid input! Starting the game...");
    console.log("Moves: ", moves.join(", "));
}

const game = new Game(moves);
game.start();
