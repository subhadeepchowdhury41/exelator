
from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
upload_bp = Blueprint('upload', __name__, url_prefix='/upload')