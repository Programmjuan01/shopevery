import os, requests, uuid, datetime, hmac, hashlib
from flask import Flask, request, jsonify

app = Flask(__name__)

WOMPI_PUB  = os.getenv("WOMPI_PUBLIC")
WOMPI_PRIV = os.getenv("WOMPI_PRIVATE")

# helper para  aceptar términos solo una vez por día
_ACCEPT_CACHE = {"token": None, "date": None}
def get_acceptance_token():
    today = datetime.date.today()
    if _ACCEPT_CACHE["date"] == today:
        return _ACCEPT_CACHE["token"]

    r = requests.get("https://sandbox.wompi.co/v1/merchants/{}".format(WOMPI_PUB))
    token = r.json()["data"]["presigned_acceptance"]["acceptance_token"]
    _ACCEPT_CACHE.update({"token": token, "date": today})
    return token

@app.post("/api/pay/nequi")
def create_nequi():
    body = request.json
    cents = int(float(body["amount"])*100)          # COP → centavos
    ref   = str(uuid.uuid4())[:12].upper()          # referencia única

    payload = {
      "amount_in_cents": cents,
      "currency": "COP",
      "reference": ref,
      "customer_email": body["email"],
      "payment_method_type": "NEQUI",
      "payment_method": { "phone_number": body["phone"] },
      "redirect_url": "https://programmjuan01.github.io/shopevery/thanks.html",
      "acceptance_token": get_acceptance_token()
    }

    r = requests.post(
        "https://sandbox.wompi.co/v1/transactions",
        json=payload,
        auth=(WOMPI_PRIV, "")
    )
    data = r.json()["data"]
    return jsonify({"checkout_url": data["checkout_url"]})
