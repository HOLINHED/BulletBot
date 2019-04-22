import { Message } from 'discord.js';
import { Bot } from '..';

export enum FILTER_ACTION { NOTHING, DELETE, SEND };

export interface filterAction {
    type: FILTER_ACTION;
    delay?: number;
    message?: any;
};

/**
 * executes single filter action
 *
 * @export
 * @param {Message} message
 * @param {filterAction} action
 * @returns
 */
export async function executeAction(message: Message, action: filterAction) {
    try {
        switch (action.type) {
            case FILTER_ACTION.NOTHING:
                return true;
            case FILTER_ACTION.DELETE:
                await message.delete(action.delay);
                return true;
            case FILTER_ACTION.SEND:
                await message.reply(action.message);
                return true;
            default:
                console.warn('unknown action:' + action);
                Bot.mStats.logError();
                return false;
        }
    } catch (e) {
        Bot.mStats.logError();
        return false;
    }
}

/**
 * executes array of filter actions using executeAction
 *
 * @export
 * @param {Message} message
 * @param {filterAction[]} actions
 */
export function executeActions(message: Message, actions: filterAction[]) {
    for (var i = 0; i < actions.length; i++) {
        executeAction(message, actions[i]);
    }
}