import NotFoundError from "../errors/notFoundError";

export const createValidationErrorResponse = (issues: object[]) => {
    return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ errors: issues }),
    };
};

export const createNotFoundErrorResponse = (error: NotFoundError) => {
    return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: error.message }),
    };
};