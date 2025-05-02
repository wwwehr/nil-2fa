This deployment uses aws lambda (docker) functions using serverless.com to deploy.

Review `.env.sample`; all these vars need to be populated on your deployment machine

> Deployment cache
```shell
# (optionally) add a deployment bucket and update or remove config from serverless.yml
aws s3 mb --region us-east-1 s3://<your-bucket-name-in-serverless-yml>
```

> Deploy with
```shell
pnpm i
pnpm dlx serverless deploy
```
