FROM public.ecr.aws/lambda/python:3.13.2025.05.01.13-x86_64

COPY . ${LAMBDA_TASK_ROOT}
COPY requirements.txt  .
RUN pip3 install -r requirements.txt --target "${LAMBDA_TASK_ROOT}"

CMD ["app.handler"]
