import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import {taskDbSchema, TaskDetail, TaskId, TaskListItem} from "./types/task";
import dayjs from 'dayjs';
import NotFoundError from "./errors/notFoundError";

const getDatabaseClient = (): DocumentClient => {
    return new DynamoDB.DocumentClient();
};

const getTableName = (): string => {
    const tableName = process.env.TASKS_TABLE_NAME;
    if (!tableName) {
        throw new Error('Missing table name');
    }
    return tableName;
};

export const storeTask = async (
    taskDetail: TaskDetail,
) => {
    const nowUnixMilliseconds = dayjs().valueOf();
    const autoFields = {
        creationTime: nowUnixMilliseconds,
    };

    const itemBody = {
        ...autoFields,
        ...taskDetail
    };

    const putParams = {
        TableName: getTableName(),
        Item: itemBody,
    };
    console.info('Going to store task:\n', JSON.stringify(putParams, null, 2));
    await getDatabaseClient().put(putParams).promise();
};

export const getTasksList = async (
): Promise<TaskListItem[]> => {
    const scanParams: DocumentClient.ScanInput = {
        TableName: getTableName(),
    };
    const data = await getDatabaseClient().scan(scanParams).promise();
    if (!data || !data.Items || data.Count === 0) {
        return [];
    }
    return data.Items.map((item) : TaskListItem => {
        const taskFromDb = taskDbSchema.parse(item);
        return {
            id: taskFromDb.id,
            title: taskFromDb.title,
        }
    });
};


export const deleteTask = async (
    taskId: TaskId
): Promise<void> => {
    const taskDetail = await getTaskDetail(taskId);
    if (!taskDetail) {
        throw new NotFoundError(taskId);
    }
    const deleteParams: DocumentClient.DeleteItemInput = {
        TableName: getTableName(),
        Key: {
            id: taskDetail.id,
            title: taskDetail.title,
        },
    };
    await getDatabaseClient().delete(deleteParams).promise();
};


export const getTaskDetail = async (
    taskId: TaskId
): Promise<TaskDetail|null> => {
    const getParams: DocumentClient.QueryInput = {
        TableName: getTableName(),
        ExpressionAttributeNames: {
            '#id': 'id',
        },
        ExpressionAttributeValues: {
            ':id': taskId,
        },
        KeyConditionExpression: '#id = :id',
    };
    const data = await getDatabaseClient().query(getParams).promise();
    if (!data || !data.Items || data.Count === 0) {
        return null;
    }
    if (data.Count !== 1) {
        throw new Error('More than one item found for task ID: ' + taskId);
    }
    const taskFromDb = taskDbSchema.parse(data.Items[0]);
    return {
        id: taskFromDb.id,
        title: taskFromDb.title,
        description: taskFromDb.description,
    };
};

