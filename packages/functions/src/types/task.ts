import * as z from 'zod';

export const taskId = z.string({
    required_error: 'Task id is required',
}).uuid('Task id expected format is uuid');
const taskTitle = z.string().min(1);
const taskDescription = z.string().max(1000000)

export const taskToBeCreated = z.object({
   title: taskTitle,
   description: taskDescription,
});

export const taskDetail = z.object({
    id: taskId,
    title: taskTitle,
    description: taskDescription,
});

export const taskListItem = z.object({
    id: taskId,
    title: taskTitle,
});

export const taskDbSchema = z.object({
    id: taskId,
    title: taskTitle,
    description: taskDescription,
    creationTime: z.number(),
});

export type TaskDetail = z.infer<
    typeof taskDetail
>;
export type TaskListItem = z.infer<
    typeof taskListItem
>;
export type TaskToBeCreated = z.infer<
    typeof taskToBeCreated
>;
export type TaskDbSchema = z.infer<
    typeof taskDbSchema
>;
export type TaskId = z.infer<typeof taskId>;
export type TaskDescription = z.infer<typeof taskId>;
export type TaskTitle = z.infer<typeof taskTitle>;
