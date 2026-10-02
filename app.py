from flask import Flask, render_template, request, jsonify
import sqlite3
import jdatetime
from datetime import datetime
from zoneinfo import ZoneInfo

app = Flask(__name__)

DATABASE = "database.db"


# -----------------------------------
# اتصال به دیتابیس
# -----------------------------------

def get_db():

    connection = sqlite3.connect(DATABASE)

    connection.row_factory = sqlite3.Row

    return connection


# -----------------------------------
# ساخت جدول
# -----------------------------------

def init_database():

    db = get_db()

    db.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            amount INTEGER NOT NULL,
            shamsi_date TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)

    db.commit()

    db.close()


# -----------------------------------
# تاریخ شمسی ایران
# -----------------------------------

def get_today_shamsi():

    now = datetime.now(
        ZoneInfo("Asia/Tehran")
    )

    jalali = jdatetime.date.fromgregorian(
        date=now.date()
    )

    return jalali.strftime("%Y/%m/%d")


# -----------------------------------
# صفحه اصلی
# -----------------------------------

@app.route("/")
def index():

    return render_template(
        "index.html"
    )


# -----------------------------------
# دریافت هزینه‌ها
# -----------------------------------

@app.route("/api/expenses", methods=["GET"])
def get_expenses():

    db = get_db()

    expenses = db.execute("""
        SELECT
            id,
            title,
            amount,
            shamsi_date,
            created_at
        FROM expenses
        ORDER BY id DESC
    """).fetchall()

    db.close()

    result = []

    for expense in expenses:

        result.append({
            "id": expense["id"],
            "title": expense["title"],
            "amount": expense["amount"],
            "date": expense["shamsi_date"],
            "created_at": expense["created_at"]
        })

    return jsonify(result)


# -----------------------------------
# ثبت هزینه
# -----------------------------------

@app.route("/api/expenses", methods=["POST"])
def add_expense():

    data = request.get_json()

    title = str(
        data.get("title", "")
    ).strip()

    amount = data.get("amount")


    if not title:

        return jsonify({
            "error": "عنوان الزامی است"
        }), 400


    try:

        amount = int(amount)

    except:

        return jsonify({
            "error": "مبلغ نامعتبر است"
        }), 400


    if amount <= 0:

        return jsonify({
            "error": "مبلغ باید بیشتر از صفر باشد"
        }), 400


    now = datetime.now(
        ZoneInfo("Asia/Tehran")
    )

    shamsi_date = get_today_shamsi()

    created_at = now.strftime(
        "%Y-%m-%d %H:%M:%S"
    )


    db = get_db()

    cursor = db.execute("""
        INSERT INTO expenses
        (
            title,
            amount,
            shamsi_date,
            created_at
        )
        VALUES (?, ?, ?, ?)
    """, (
        title,
        amount,
        shamsi_date,
        created_at
    ))


    db.commit()

    expense_id = cursor.lastrowid

    db.close()


    return jsonify({
        "success": True,
        "id": expense_id,
        "title": title,
        "amount": amount,
        "date": shamsi_date
    })


# -----------------------------------
# حذف هزینه
# -----------------------------------

@app.route(
    "/api/expenses/<int:expense_id>",
    methods=["DELETE"]
)
def delete_expense(expense_id):

    db = get_db()

    db.execute(
        "DELETE FROM expenses WHERE id = ?",
        (expense_id,)
    )

    db.commit()

    db.close()

    return jsonify({
        "success": True
    })


# -----------------------------------
# اجرای برنامه
# -----------------------------------

init_database()


if __name__ == "__main__":

    app.run(
        debug=True,
        host="127.0.0.1",
        port=5000
    )