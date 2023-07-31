import { v4 as uuidv4 } from 'uuid';
import { TaskId } from '../types/task'

export const generateId = () : TaskId => {
    return uuidv4();
}