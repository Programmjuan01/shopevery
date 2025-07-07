import os, uuid, datetime, requests
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
from flask import Flask, jsonify, request, send_from_directory, current_app
from flask_jwt_extended import (
    JWTManager, jwt_required, get_jwt_identity, create_access_token
)
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from auth import auth_bp                    # Blueprint de login/registro

# -------- Configuración -------------------------------------------------
app = Flask(__name__, static_folder=".", static_url_path="")
app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET", "cambia-esto")
app.config["MONGODB_URI"]    = os.getenv("MONGODB_URI")

CORS(app, supports_credentials=True)
jwt = JWTManager(app)

# -------- Base de datos (solo colección de productos aquí) --------------
client = MongoClient(app.config["MONGODB_URI"])
db = client["shopeverydb"]
products_col = db["products"]

# -------- Frontend estático ---------------------------------------------
@app.get("/")
def root():
    return send_from_directory(app.static_folder, "index.html")

# -------- Endpoints de productos ----------------------------------------

@app.get("/api/products")
def list_products():
    """
    Devuelve un JSON con todos los productos:
        [
          {"id":"…", "title":"…", "price":123.4, "image":"url"},
          …
        ]
    En caso de error en MongoDB devuelve 500 + JSON
        {"error":"db_error","detail":"…"}
    """
    try:
        prods = products_col.find()
        return jsonify([
            {
                "id":    str(p["_id"]),         # ← _id a texto
                "title": p.get("title", ""),
                "price": p.get("price", 0),
                "image": p.get("image", "")
            }
            for p in prods
        ])
    except PyMongoError as e:
        app.logger.exception(e)                 # lo verás en consola
        return jsonify(error="db_error", detail=str(e)), 500
    except Exception as e:
        app.logger.exception(e)
        return jsonify(error="internal", detail=str(e)), 500

# @app.get("/api/products")
# def list_products():
#     prods = products_col.find()
#     return jsonify([
#         {
#             "id":    p["_id"],
#             "title": p["title"],
#             "price": p["price"],
#             "image": p["image"]
#         } for p in prods
#     ])

@app.post("/api/products")
@jwt_required()
def create_product():
    uid  = get_jwt_identity()
    data = request.json

    prod_id = str(uuid.uuid4())
    products_col.insert_one({
        "_id":      prod_id,
        "title":    data["title"],
        "price":    int(float(data["price"]) * 100),
        "image":    data["image"],
        "owner_id": uid
    })
    return jsonify({"msg": "Publicado", "id": prod_id})

# -------- Pago Nequi (opcional) -----------------------------------------
WOMPI_PUB  = os.getenv("WOMPI_PUBLIC")
WOMPI_PRIV = os.getenv("WOMPI_PRIVATE")
_ACCEPT = {"token": None, "date": None}

def _acceptance_token():
    today = datetime.date.today()
    if _ACCEPT["date"] == today:
        return _ACCEPT["token"]
    r = requests.get(f"https://sandbox.wompi.co/v1/merchants/{WOMPI_PUB}")
    _ACCEPT.update({
        "token": r.json()["data"]["presigned_acceptance"]["acceptance_token"],
        "date":  today
    })
    return _ACCEPT["token"]

@app.post("/api/pay/nequi")
def pay_nequi():
    body  = request.json
    cents = int(float(body["amount"]) * 100)
    ref   = str(uuid.uuid4())[:12].upper()

    payload = {
        "amount_in_cents": cents, "currency": "COP", "reference": ref,
        "customer_email": body["email"],
        "payment_method_type": "NEQUI",
        "payment_method": {"phone_number": body["phone"]},
        "redirect_url": "https://programmjuan01.github.io/shopevery/thanks.html",
        "acceptance_token": _acceptance_token()
    }
    r = requests.post("https://sandbox.wompi.co/v1/transactions",
                      json=payload, auth=(WOMPI_PRIV, ""))
    return jsonify({"checkout_url": r.json()["data"]["checkout_url"]})

# -------- Registrar Blueprint de auth  (SOLO una vez) -------------------
app.register_blueprint(auth_bp)

# --- USERS ---------------------------------------------------------
@app.get("/api/users/me")
@jwt_required()
def me():
    uid = get_jwt_identity()
    u = current_app.users_col.find_one({"_id": uid}, {"password":0})
    return jsonify(u)

@app.get("/api/users/search")
def user_search():
    q = request.args.get("q","").strip()
    pat = {"$regex": q, "$options":"i"} if q else {}
    users = current_app.users_col.find(
        {"name": pat}, {"password":0}
    ).limit(20)
    return jsonify([{"_id":u["_id"],"name":u["name"],"avatar":u.get("avatar","")} for u in users])

# --- MESSAGES ------------------------------------------------------
@app.get("/api/messages/<other_id>")
@jwt_required()
def get_chat(other_id):
    uid = get_jwt_identity()
    msgs = db["messages"].find({
        "$or":[ {"from":uid,"to":other_id},
                {"from":other_id,"to":uid} ]
    }).sort("ts", 1)
    return jsonify([{
        "from": m["from"],
        "to":   m["to"],
        "body": m["body"],
        "ts":   m["ts"]
    } for m in msgs])

@app.post("/api/messages")
@jwt_required()
def send_msg():
    uid = get_jwt_identity()
    data = request.json         # {to, body}
    db["messages"].insert_one({
        "_id": str(uuid.uuid4()),
        "from": uid,
        "to":   data["to"],
        "body": data["body"],
        "ts":   datetime.datetime.utcnow().isoformat()
    })
    return jsonify({"msg":"ok"})

# -------- Arranque ------------------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)

