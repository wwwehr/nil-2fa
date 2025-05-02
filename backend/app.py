import serverless_wsgi

from flask import Flask
from flask import redirect, abort
from authlib.integrations.flask_client import OAuth


import os


app = Flask(__name__)
app.secret_key = os.environ["FLASK_SECRET"]
app.config.from_object("config")

OAUTH_CALLBACK_URL = os.environ["OAUTH_CALLBACK_URL"]
AUTHORIZED_URL = os.environ["AUTHORIZED_URL"]

CONF_URL = "https://accounts.google.com/.well-known/openid-configuration"
oauth = OAuth(app)
oauth.register(
    name="google",
    server_metadata_url=CONF_URL,
    client_kwargs={"scope": "openid email profile"},
)

@app.route("/login/<name>")
def login(name):
    client = oauth.create_client(name)
    if not client:
        abort(404)

    return client.authorize_redirect(OAUTH_CALLBACK_URL)


@app.route("/auth/<name>")
def auth(name):
    client = oauth.create_client(name)
    if not client:
        abort(404)

    token = client.authorize_access_token()
    id_token = token.get("id_token")

    response = redirect(AUTHORIZED_URL)
    response.set_cookie(
        "auth_token",
        id_token,
        httponly=False,  # MUST HAVE so that we can read it on the client
        secure=True,  # Requires HTTPS in production
        samesite="Lax",
    )
    return response

def handler(event, context):
    return serverless_wsgi.handle_request(app, event, context)
