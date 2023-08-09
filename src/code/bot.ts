import { random } from "lodash-es";
import type { PlayerAction, VisualGameState } from "./game_data";
import { filter_cards, get_combination } from "./cards";

export type BotConfig = {
    riskiness: number;
    randomness: number;
};

export function getBotAction(
    gameState: VisualGameState,
    config: BotConfig,
): PlayerAction {
    // Find the bot in the player list
    const bot = gameState.players.find((player) => player.you);
    if (!bot) throw new Error("Bot not found");

    const bot_log = (message: string) => {
        console.log(`[BOT ${bot.name}]: ${message}`);
    };

    // Determine the minimum bet
    const minBet = Math.max(
        ...gameState.players.map((player) => player.bet),
        0,
    );

    // If the bot has already folded, do nothing
    if (bot.state === "folded") {
        bot_log("I have already folded. No action taken.");
        return { type: "fold" };
    }

    // Evaluate the bot's hand
    const combination = get_combination(
        filter_cards([bot.card1, bot.card2, ...gameState.centerCards]),
    );

    // If the bot has no valid combination, it should fold
    if (combination.type === "none") {
        bot_log("I have no valid combination. Folding.");
        return { type: "fold" };
    }

    bot_log(`My combination is ${combination.combination}`);

    // Random factor to add unpredictability to the bot's decisions
    const randomFactor = random(0, 1, true);

    // big_raise is a percentage of the bot's remaining chips, based on its aggressiveness
    const big_raise = bot.remainingChips * config.riskiness;

    // Calculate how many players are still in the game
    const playersInGame = gameState.players.filter(
        (player) => player.state !== "folded",
    ).length;

    // Calculate the bot's chips as a percentage of the pot
    const botChipsPercentageOfPot = bot.remainingChips / gameState.pot;

    // Adjust the bot's aggressiveness based on the number of players and the size of the pot
    const adjustedAggressiveness =
        (config.riskiness / playersInGame) * botChipsPercentageOfPot;

    // Define the bot's betting strategy based on the combination base_score
    if (
        (combination.base_score >= 8 &&
            randomFactor < adjustedAggressiveness) ||
        (combination.base_score >= 6 && randomFactor < config.randomness)
    ) {
        // High value combination or medium value with some luck, bet high or raise
        const bet =
            bot.remainingChips > minBet + big_raise
                ? minBet + big_raise
                : bot.remainingChips;
        bot_log(
            `I have a high value combination or got lucky with a medium one. Betting ${bet}`,
        );
        return { type: "bet", bet: bet };
    } else if (
        (combination.base_score >= 4 &&
            randomFactor < adjustedAggressiveness) ||
        (combination.base_score >= 2 && randomFactor < config.randomness)
    ) {
        // Medium value combination or low value with some luck, call or check
        const bet = bot.remainingChips > minBet ? minBet : bot.remainingChips;
        bot_log(
            `I have a medium value combination or got lucky with a low one. Calling with ${bet}`,
        );
        return { type: "bet", bet: bet };
    } else if (combination.base_score < 2 && randomFactor < config.randomness) {
        // Low value combination but lucky, bluff by betting high
        const bet =
            bot.remainingChips > minBet + big_raise
                ? minBet + big_raise
                : bot.remainingChips;
        bot_log(
            `I have a low value combination but feeling lucky. Bluffing with ${bet}`,
        );
        return { type: "bet", bet: bet };
    } else {
        // Low value combination, fold or check
        const folding =
            bot.bet < minBet && filter_cards(gameState.centerCards).length > 3;
        const action = folding ? "Folding" : `Checking with bet ${minBet}`;
        bot_log(`I have a low value combination. ${action}`);
        return folding ? { type: "fold" } : { type: "bet", bet: minBet };
    }
}
