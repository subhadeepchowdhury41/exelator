from flask import request
from flask_socketio import emit
import socketio

from utils.exelops import update_file_with_changes

clients = []

@socketio.on('connect')
def handle_connect():
    clients.append(request.sid)
    print(f"Client {request.sid} connected")

@socketio.on('disconnect')
def handle_disconnect():
    clients.remove(request.sid)
    print(f"Client {request.sid} disconnected")

@socketio.on('updateRows')
def handle_update_rows(data):
    emit('receiveUpdateRows', data, broadcast=True)
    update_file_with_changes(data, 'update')

@socketio.on('addRows')
def handle_add_rows(data):
    emit('receiveAddRows', data, broadcast=True)
    update_file_with_changes(data, 'add')


@socketio.on('deleteRows')
def handle_delete_rows(data):
    emit('receiveDeleteRows', data, broadcast=True)
    update_file_with_changes(data, 'delete')