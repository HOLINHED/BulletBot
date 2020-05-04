import { Client, Snowflake, UserResolvable } from 'discord.js';

import { Commands } from '../../../commands';
import { Database } from '../../database';
import { UserObject, userSchema } from '../../schemas/main/user';
import { LoadOptions } from '../../wrappers/docWrapper';
import { UserWrapper } from '../../wrappers/main/userWrapper';
import { CacheManager } from '../cacheManager';
import { FetchOptions } from '../collectionManager';

/**
 * Types that are resolvable to a UserWrapper
 */
export type UserWrapperResolvable = UserWrapper | UserResolvable;

/**
 * Hold the user model
 *
 * @export
 * @class UserManager
 * @extends {CacheManager<UserObject>}
 */
export class UserManager extends CacheManager<UserObject, UserWrapper> {

    private readonly client: Client;
    private readonly commandModule: Commands;

    /**
     * Creates an instance of UserManager.
     * 
     * @param {Database} database Database to get model from
     * @param {Client} client
     * @param {Commands} commandModule
     * @memberof UserManager
     */
    constructor(database: Database, client: Client, commandModule: Commands) {
        super(database, 'main', 'user', userSchema, UserWrapper);
        this.client = client;
        this.commandModule = commandModule;
    }

    /**
     * Generates a default user object with the provided user id
     *
     * @param {Snowflake} userID User id to generate a user object for
     * @returns
     * @memberof UserManager
     */
    getDefaultObject(userID: Snowflake): UserObject {
        return {
            id: userID,
            commandLastUsed: {}
        };
    };

    /**   
     * @param {Snowflake} id User id
     * @returns
     * @memberof UserManager
     */
    getCacheKey(id: Snowflake) {
        return id;
    }

    /**
     * Returns UserWrappers saved in cache
     *
     * @param {UserResolvable} user User to search cache for
     * @param {LoadOptions<UserObject>} [options] LoadOptions that should be passed to the wrapper
     * @returns
     * @memberof UserManager
     */
    get(user: UserResolvable, options?: LoadOptions<UserObject>) {
        let userID = this.client.users.resolveID(user);
        return this.getCached(options, userID);
    }

    /**
     * Searched the database and cache for a UserObject. 
     * If one isn't found and it's specified in the options a new UserObject is created
     *
     * @param {UserResolvable} user user to search for
     * @param {FetchOptions<UserObject>} [options] FetchOptions
     * @returns UserWrapper for the UserObject
     * @memberof UserManager
     */
    async fetch(user: UserResolvable, options?: FetchOptions<UserObject>) {
        let userObj = await this.fetchResolve(user);
        return this._fetch([userObj.id], [userObj, this.commandModule], [userObj.id], options);
    }

    /**
     * Just like the UserManager.resolve() function from Discord.js, but which fetches not yet cached users
     *
     * @param {UserResolvable} user User resolvable to be resolved
     * @returns
     * @memberof UserManager
     */
    async fetchResolve(user: UserResolvable) {
        let userObj = this.client.users.resolve(user);
        if (!userObj && typeof user === 'string')
            userObj = await this.client.users.fetch(user);
        return userObj
    }

    /**
     * Resolves UserWrapperResolvable to a UserWrapper
     *
     * @param {UserWrapperResolvable} user
     * @param {boolean} [fetch=false] If not cached GuildWrappers should be fetched
     * @returns
     * @memberof UserManager
     */
    async resolve(user: UserWrapperResolvable, fetch = false) {
        if (user instanceof UserWrapper) return user;
        if (fetch) return this.fetch(user, { fields: [] });
        return this.get(user, { fields: [] });
    }

}