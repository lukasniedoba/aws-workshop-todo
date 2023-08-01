# AWS Workshop - example application

- [SST](https://sst.dev) app for the AWS workshop purposes

## Clonning the project

```bash
git clone https://github.com/lukasniedoba/aws-workshop-todo.git
cd aws-workshop-todo
```

## Edit project
- edit `stacks/MyStack.ts` and replace `errorChannelTopic` subscription with your email

## Deploying the project

```bash
# prepare AWS credentials
cp .aws/credentials.example .aws/credentials
# edit aws/credentials and replace placeholders with your Aws credentials

# building and running the container
docker build -t aws-workshop .
docker run -v ./.aws/:/root/.aws/ -v ${PWD}:/stack aws-workshop sleep infinity
docker exec -it container_id bash

# inside the container
npm install
npm run build
npm run deploy
```

## Removing the app
```bash
npm run remove
```

## Clean

```bash
rm -rf .sst
rm -rf node_modules
rm -rf packages/functions/node_modules
```

## Postman

Inside postman directory you can find postman collection with example requests.  

Postman link: https://www.postman.com/downloads/