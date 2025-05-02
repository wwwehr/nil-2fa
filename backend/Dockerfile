FROM public.ecr.aws/lambda/python:3.13.2025.05.01.13-x86_64

COPY . .

RUN pip install -r requirements.txt

CMD ["app.handler"]
