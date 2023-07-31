class NotFoundError extends Error {
    constructor(itemId?: string) {
        super('Item with id ' + itemId + ' not found');
    }
}

export default NotFoundError;
