# auth.py ────────────────────────────────────────────────────────────────
import os, uuid, datetime
from flask import Blueprint, request, jsonify, current_app
from flask_bcrypt import Bcrypt
from flask_jwt_extended import create_access_token
from pymongo import MongoClient
bcrypt  = Bcrypt()
auth_bp = Blueprint("auth", __name__, url_prefix="/api")   # ← /api/login, /api/register

# -----------------------------------------------------------------------
# Se ejecuta UNA sola vez al registrar el blueprint en app.py
# -----------------------------------------------------------------------
@auth_bp.record_once
def _setup(state):
    app = state.app
    bcrypt.init_app(app)                                   # conecta Bcrypt
    # Conexión global a MongoDB (puedes re-usar la del resto si lo prefieres)
    mongo_uri = app.config["MONGODB_URI"]
    app.mongo_client = MongoClient(mongo_uri)
    app.users_col    = app.mongo_client["shopeverydb"]["users"]

# -----------------------------------------------------------------------
# 1) REGISTRO  POST /api/register
# -----------------------------------------------------------------------
@auth_bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    name  = data.get("name","").strip()
    email = data.get("email","").strip().lower()
    pwd   = data.get("password","")

    if not (name and email and pwd):
        return jsonify({"msg":"Faltan datos"}), 400

    users = current_app.users_col
    if users.find_one({"email": email}):
        return jsonify({"msg":"Ese correo ya existe"}), 409

    hashed = bcrypt.generate_password_hash(pwd).decode()     # ← calcula hash
    users.insert_one({
        "_id":   str(uuid.uuid4()),
        "name":  name,
        "email": email,
        "password": hashed,          # ← GUARDA el hash
        "avatar": "",
        "bio":    ""
    })
    return jsonify({"msg":"Usuario registrado"})

# -----------------------------------------------------------------------
# 2) LOGIN  POST /api/login
#    → devuelve {token, uid, name}
# -----------------------------------------------------------------------
@auth_bp.post("/login")
def login():
    data  = request.get_json(silent=True) or {}
    users = current_app.users_col
    user  = users.find_one({"email": data.get("email", "").lower()})

    if not user or not bcrypt.check_password_hash(user["password"],
                                                  data.get("password", "")):
        return jsonify({"msg": "Credenciales incorrectas"}), 401

    token = create_access_token(
        identity=user["_id"],
        expires_delta=datetime.timedelta(days=1)
    )
    return jsonify({
        "token": token,
        "uid":   user["_id"],      # ← para que el frontend guarde su id
        "name":  user["name"]
    })



