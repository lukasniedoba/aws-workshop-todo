import NotFoundError from "../errors/notFoundError";

export const createValidationErrorResponse = (issues: object[]) => {
    return {
        statusCode: 400,
        body: JSON.stringify({ errors: issues }),
    };
};

export const createNotFoundErrorResponse = (error: NotFoundError) => {
    return {
        statusCode: 404,
        body: JSON.stringify({ error: error.message }),
    };
};