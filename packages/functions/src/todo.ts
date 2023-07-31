import {createNotFoundErrorResponse, createValidationErrorResponse} from "./helpers/errorResponse";
import {TaskDetail, taskToBeCreated, taskId} from "./types/task";
import {generateId} from "./helpers/generateId";
import {APIGatewayProxyHandlerV2, APIGatewayProxyResultV2} from "aws-lambda";
import {deleteTask, getTaskDetail, getTasksList, storeTask} from "./repository";
import NotFoundError from "./errors/notFoundError";

export const create: APIGatewayProxyHandlerV2 = async (event) : Promise<APIGatewayProxyResultV2> => {
  let bodyStr: string = '{}';
  if (event.body) {
    bodyStr = event.body;
  }
  let parsedBody: object = {};
  try {
    parsedBody = JSON.parse(bodyStr);
  } catch (e) {
    return createValidationErrorResponse([
      { code: 'invalid_json', message: 'Invalid JSON' },
    ]);
  }
  const taskParsed =
      taskToBeCreated.safeParse(parsedBody);
  if (!taskParsed.success) {
    return createValidationErrorResponse(
        taskParsed.error.issues
    );
  }

  const taskDetail: TaskDetail = {
    id: generateId(),
    ...taskParsed.data,
  }

  await storeTask(taskDetail);

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskDetail),
  };
};

export const list: APIGatewayProxyHandlerV2 = async (event) : Promise<APIGatewayProxyResultV2> => {
  const tasksList = await getTasksList();
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tasksList),
  };
};

export const detail: APIGatewayProxyHandlerV2 = async (event) : Promise<APIGatewayProxyResultV2> => {
  if (!event.pathParameters) {
    throw new Error('Missing path parameters');
  }
  const taskIdParsed = taskId.safeParse(
      event.pathParameters.taskId
  );
  if (!taskIdParsed.success) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: taskIdParsed.error.issues }),
    };
  }
  const taskDetail = await getTaskDetail(taskIdParsed.data);
  if (!taskDetail) {
    return createNotFoundErrorResponse(new NotFoundError(taskIdParsed.data));
  }
  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(taskDetail),
  };
};

export const remove: APIGatewayProxyHandlerV2 = async (event) : Promise<APIGatewayProxyResultV2> => {
  if (!event.pathParameters) {
    throw new Error('Missing path parameters');
  }
  const taskIdParsed = taskId.safeParse(
      event.pathParameters.taskId
  );
  if (!taskIdParsed.success) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ errors: taskIdParsed.error.issues }),
    };
  }
  console.log("Going to delete item: " + taskIdParsed.data);
  try {
    await deleteTask(taskIdParsed.data);
  } catch (e) {
    if (e instanceof NotFoundError) {
      return createNotFoundErrorResponse(e);
    }
    throw e;
  }
  return {
    statusCode: 204,
  };
};