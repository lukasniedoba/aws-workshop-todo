import { Duration } from 'aws-cdk-lib';
import {
  Alarm,
  ComparisonOperator,
  Dashboard,
  GraphWidget,
  LogQueryVisualizationType,
  LogQueryWidget,
  Metric,
} from 'aws-cdk-lib/aws-cloudwatch';
import { SnsAction } from 'aws-cdk-lib/aws-cloudwatch-actions';
import { StackContext, Api, Table, Function } from "sst/constructs";
import { Topic } from 'aws-cdk-lib/aws-sns';
import { EmailSubscription } from 'aws-cdk-lib/aws-sns-subscriptions';

export function API({ stack }: StackContext) {
  const errorChannelTopic = new Topic(stack, 'errorChannel');

  errorChannelTopic.addSubscription(
      new EmailSubscription(
          'niedoba.lukas@gmail.com'
      )
  );

  const tasksTable = new Table(stack, 'tasks', {
    fields: {
      id: "string",
      title: "string",
    },
    primaryIndex: {
      partitionKey: 'id',
      sortKey: 'title',
    },
  });

  const createTaskHandler = new Function(stack, 'createTask', {
    handler: 'packages/functions/src/todo.create',
    description: 'Create a new task',
    environment: {
      TASKS_TABLE_NAME: tasksTable.tableName,
    },
    bind: [tasksTable],
  });

  const getTasksListHandler = new Function(stack, 'getTasks', {
    handler: 'packages/functions/src/todo.list',
    description: 'Get tasks list',
    environment: {
      TASKS_TABLE_NAME: tasksTable.tableName,
    },
    bind: [tasksTable],
  });

  const getTaskDetailHandler = new Function(stack, 'getTask', {
    handler: 'packages/functions/src/todo.detail',
    description: 'Get task detail',
    environment: {
      TASKS_TABLE_NAME: tasksTable.tableName,
    },
    bind: [tasksTable],
  });

  const removeTaskHandler = new Function(stack, 'removeTask', {
    handler: 'packages/functions/src/todo.remove',
    description: 'Remove task',
    environment: {
      TASKS_TABLE_NAME: tasksTable.tableName,
    },
    bind: [tasksTable],
  });

  const api = new Api(stack, "api", {
    routes: {
      "POST /tasks": createTaskHandler,
      "GET /tasks": getTasksListHandler,
      "GET /tasks/{taskId}": getTaskDetailHandler,
      "DELETE /tasks/{taskId}": removeTaskHandler,
    },
  });

  stack.addOutputs({
    ApiEndpoint: api.url,
  });


  // Dashboard and alarms
  const generateIdErrorMetric = new Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    dimensionsMap: {
      FunctionName: createTaskHandler.functionName,
    },
    statistic: 'sum',
    label: createTaskHandler.functionName,
    period: Duration.minutes(1),
  });
  const storeOfferErrorMetric = new Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    dimensionsMap: {
      FunctionName: getTasksListHandler.functionName,
    },
    statistic: 'sum',
    label: getTasksListHandler.functionName,
    period: Duration.minutes(1),
  });
  const retrieveOffersErrorMetric = new Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    dimensionsMap: {
      FunctionName: getTaskDetailHandler.functionName,
    },
    statistic: 'sum',
    label: getTaskDetailHandler.functionName,
    period: Duration.minutes(1),
  });
  const removeOldOffersErrorMetric = new Metric({
    namespace: 'AWS/Lambda',
    metricName: 'Errors',
    dimensionsMap: {
      FunctionName: removeTaskHandler.functionName,
    },
    statistic: 'sum',
    label: removeTaskHandler.functionName,
    period: Duration.minutes(1),
  });

  const generateIdAlarm = new Alarm(stack, 'generate-id-alarm', {
    metric: generateIdErrorMetric,
    evaluationPeriods: 1,
    threshold: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    alarmDescription: `Error in function ${createTaskHandler.functionName}`,
  });
  generateIdAlarm.addAlarmAction(new SnsAction(errorChannelTopic));
  const storeOfferAlarm = new Alarm(stack, 'store-offer-alarm', {
    metric: storeOfferErrorMetric,
    evaluationPeriods: 1,
    threshold: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    alarmDescription: `Error in function ${getTasksListHandler.functionName}`,
  });
  storeOfferAlarm.addAlarmAction(new SnsAction(errorChannelTopic));
  const retrieveOffersAlarm = new Alarm(stack, 'retrieve-offers-alarm', {
    metric: retrieveOffersErrorMetric,
    evaluationPeriods: 1,
    threshold: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    alarmDescription: `Error in function ${getTaskDetailHandler.functionName}`,
  });
  retrieveOffersAlarm.addAlarmAction(new SnsAction(errorChannelTopic));
  const removeOldOffersAlarm = new Alarm(stack, 'remove-old-offers-alarm', {
    metric: removeOldOffersErrorMetric,
    evaluationPeriods: 1,
    threshold: 1,
    comparisonOperator: ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    alarmDescription: `Error in function ${removeTaskHandler.functionName}`,
  });
  removeOldOffersAlarm.addAlarmAction(new SnsAction(errorChannelTopic));

  const dashboard = new Dashboard(stack, 'dashboard', {
    dashboardName: `Todo-app-dashboard-${stack.stage}`,
  });
  dashboard.addWidgets(
      new GraphWidget({
        title: 'Function Errors',
        width: 24,
        height: 8,
        left: [
          removeOldOffersErrorMetric,
          retrieveOffersErrorMetric,
          storeOfferErrorMetric,
          generateIdErrorMetric,
        ],
      }),
      new GraphWidget({
        title: 'Function Invocations',
        width: 12,
        height: 8,
        left: [
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: createTaskHandler.functionName,
            },
            statistic: 'sum',
            label: createTaskHandler.functionName,
            period: Duration.minutes(1),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: getTasksListHandler.functionName,
            },
            statistic: 'sum',
            label: getTasksListHandler.functionName,
            period: Duration.minutes(1),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: getTaskDetailHandler.functionName,
            },
            statistic: 'sum',
            label: getTaskDetailHandler.functionName,
            period: Duration.minutes(1),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Invocations',
            dimensionsMap: {
              FunctionName: removeTaskHandler.functionName,
            },
            statistic: 'sum',
            label: removeTaskHandler.functionName,
            period: Duration.minutes(1),
          }),
        ],
      }),
      new GraphWidget({
        title: 'Function durations',
        width: 12,
        height: 8,
        left: [
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: createTaskHandler.functionName,
            },
            statistic: 'avg',
            label: createTaskHandler.functionName,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: getTasksListHandler.functionName,
            },
            statistic: 'avg',
            label: getTasksListHandler.functionName,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: getTaskDetailHandler.functionName,
            },
            statistic: 'avg',
            label: getTaskDetailHandler.functionName,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: removeTaskHandler.functionName,
            },
            statistic: 'avg',
            label: removeTaskHandler.functionName,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: createTaskHandler.functionName,
            },
            statistic: 'max',
            label: `Max ${createTaskHandler.functionName}`,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: getTasksListHandler.functionName,
            },
            statistic: 'max',
            label: `Max ${getTasksListHandler.functionName}`,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: getTaskDetailHandler.functionName,
            },
            statistic: 'max',
            label: `Max ${getTaskDetailHandler.functionName}`,
            period: Duration.seconds(5),
          }),
          new Metric({
            namespace: 'AWS/Lambda',
            metricName: 'Duration',
            dimensionsMap: {
              FunctionName: removeTaskHandler.functionName,
            },
            statistic: 'max',
            label: `Max ${removeTaskHandler.functionName}`,
            period: Duration.seconds(5),
          }),
        ],
      }),
      new LogQueryWidget({
        title: 'Errors from logs',
        view: LogQueryVisualizationType.TABLE,
        width: 24,
        height: 12,
        logGroupNames: [
          createTaskHandler.logGroup.logGroupName,
          getTasksListHandler.logGroup.logGroupName,
          getTaskDetailHandler.logGroup.logGroupName,
          removeTaskHandler.logGroup.logGroupName,
        ],
        queryLines: ['fields @message', 'filter @message like /(?i)error/'],
      })
  );
}
