import os
from flask import Flask, request, jsonify
from flask_socketio import SocketIO, emit
from flask_cors import CORS
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy

from .config import Config

db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app, resources={r"/*": {"origins": "*"}})

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    from .routes import auth_bp, upload_bp

    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(upload_bp, url_prefix='/upload')

    socketio = SocketIO(app, cors_allowed_origins="*")

    if not os.path.exists(app.config.get('UPLOAD_FOLDER')):
        os.makedirs(app.config.get('UPLOAD_FOLDER'))
    
    return app, socketio