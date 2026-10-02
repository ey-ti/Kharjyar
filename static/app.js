const titleInput =
    document.getElementById("title");

const amountInput =
    document.getElementById("amount");


/* -------------------------
   تبدیل اعداد فارسی
------------------------- */

function toEnglishNumbers(value) {

    return String(value)

        .replace(
            /[۰-۹]/g,
            char =>
                "۰۱۲۳۴۵۶۷۸۹".indexOf(char)
        )

        .replace(
            /[٠-٩]/g,
            char =>
                "٠١٢٣٤٥٦٧٨٩".indexOf(char)
        );
}


/* -------------------------
   فرمت تومان
------------------------- */

function money(value) {

    return Number(value)
        .toLocaleString("fa-IR");
}


/* -------------------------
   دریافت هزینه‌ها
------------------------- */

async function loadExpenses() {

    const response =
        await fetch("/api/expenses");

    const expenses =
        await response.json();


    renderExpenses(expenses);
}


/* -------------------------
   ثبت هزینه
------------------------- */

async function addExpense() {

    const title =
        titleInput.value.trim();


    const amount =
        Number(
            toEnglishNumbers(
                amountInput.value
            ).replace(/,/g, "")
        );


    if (!title) {

        alert(
            "عنوان هزینه را وارد کن."
        );

        return;
    }


    if (!amount || amount <= 0) {

        alert(
            "مبلغ صحیح وارد کن."
        );

        return;
    }


    const response =
        await fetch(
            "/api/expenses",
            {

                method: "POST",

                headers: {
                    "Content-Type":
                        "application/json"
                },

                body: JSON.stringify({

                    title: title,

                    amount: amount

                })

            }
        );


    const result =
        await response.json();


    if (!response.ok) {

        alert(
            result.error ||
            "خطا در ثبت هزینه"
        );

        return;
    }


    titleInput.value = "";

    amountInput.value = "";


    await loadExpenses();
}


/* -------------------------
   نمایش هزینه‌ها
------------------------- */

function renderExpenses(expenses) {

    const list =
        document.getElementById(
            "expenseList"
        );


    const today =
        expenses.length > 0
            ? expenses[0].date
            : "";


    document.getElementById(
        "todayDate"
    ).textContent =
        today;


    if (!expenses.length) {

        list.innerHTML = `
            <div class="empty">
                هنوز هزینه‌ای ثبت نشده.
            </div>
        `;

        document.getElementById(
            "todayTotal"
        ).textContent =
            "۰ تومان";

        return;
    }


    let todayTotal = 0;


    expenses.forEach(expense => {

        if (expense.date === today) {

            todayTotal +=
                expense.amount;
        }

    });


    document.getElementById(
        "todayTotal"
    ).textContent =
        money(todayTotal) +
        " تومان";


    list.innerHTML =
        expenses.map(expense => `

            <div class="expense">

                <div>

                    <div class="expense-title">

                        ${escapeHtml(
                            expense.title
                        )}

                    </div>


                    <div class="expense-date">

                        ${expense.date}

                    </div>

                </div>


                <div>

                    <span class="expense-amount">

                        ${money(
                            expense.amount
                        )}
                        تومان

                    </span>


                    <button
                        class="delete"
                        onclick="
                            deleteExpense(
                                ${expense.id}
                            )
                        "
                    >
                        حذف
                    </button>

                </div>

            </div>

        `).join("");
}


/* -------------------------
   حذف
------------------------- */

async function deleteExpense(id) {

    if (
        !confirm(
            "این هزینه حذف شود؟"
        )
    ) {

        return;
    }


    await fetch(
        `/api/expenses/${id}`,
        {
            method: "DELETE"
        }
    );


    await loadExpenses();
}


/* -------------------------
   امنیت نمایش عنوان
------------------------- */

function escapeHtml(text) {

    return String(text)
        .replace(
            /[&<>"']/g,
            char => ({

                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                '"': "&quot;",
                "'": "&#039;"

            }[char])
        );
}


/* -------------------------
   شروع
------------------------- */

loadExpenses();