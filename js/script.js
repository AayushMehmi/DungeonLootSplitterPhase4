// Aayush Mehmi, 6/24/2026

const STORAGE_KEY = "lootSplitterState";
const STUDENT_ID = "aayushM";

let loot = [];
let partySize = 1;

document.getElementById("addLootButton").addEventListener("click", addLoot);
document.getElementById("splitLootButton").addEventListener("click", splitLoot);
document.getElementById("resetButton").addEventListener("click", resetAll);
document.getElementById("syncButton").addEventListener("click", syncToServer);
document.getElementById("loadButton").addEventListener("click", loadFromServer);

document.getElementById("partySize").addEventListener("input", function () {
    const enteredSize = parseInt(document.getElementById("partySize").value);

    if (!isNaN(enteredSize) && enteredSize >= 1) {
        partySize = enteredSize;
        saveState();
    }

    updateUI();
});

restoreState();
updateUI();

function saveState() {
    const appState = {
        loot: loot,
        partySize: partySize
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
}

function restoreState() {
    loot = [];
    partySize = 1;

    const savedState = localStorage.getItem(STORAGE_KEY);

    if (savedState === null) {
        document.getElementById("partySize").value = partySize;
        return;
    }

    try {
        const parsed = JSON.parse(savedState);

        if (typeof parsed === "object" && parsed !== null) {
            if (!isNaN(parsed.partySize) && parsed.partySize >= 1) {
                partySize = parseInt(parsed.partySize);
            }

            if (Array.isArray(parsed.loot)) {
                for (let i = 0; i < parsed.loot.length; i++) {
                    const item = parsed.loot[i];

                    if (isValidLootItem(item)) {
                        loot.push({
                            name: item.name,
                            value: parseFloat(item.value),
                            quantity: parseInt(item.quantity)
                        });
                    }
                }
            }
        }
    } catch (error) {
        loot = [];
        partySize = 1;
    }

    document.getElementById("partySize").value = partySize;
}

function isValidLootItem(item) {
    return (
        item !== null &&
        typeof item === "object" &&
        item.name !== "" &&
        !isNaN(item.value) &&
        item.value >= 0 &&
        !isNaN(item.quantity) &&
        item.quantity >= 1
    );
}

function addLoot() {
    const name = document.getElementById("lootName").value;
    const value = parseFloat(document.getElementById("lootValue").value);
    const quantity = parseInt(document.getElementById("lootQuantity").value);

    if (name === "") {
        document.getElementById("message").textContent =
            "Please enter a loot name.";
        return;
    }

    if (isNaN(value) || value < 0) {
        document.getElementById("message").textContent =
            "Please enter a valid loot value.";
        return;
    }

    if (isNaN(quantity) || quantity < 1) {
        document.getElementById("message").textContent =
            "Please enter a valid quantity.";
        return;
    }

    loot.push({
        name: name,
        value: value,
        quantity: quantity
    });

    document.getElementById("message").textContent =
        "Loot added successfully.";

    document.getElementById("lootName").value = "";
    document.getElementById("lootValue").value = "";
    document.getElementById("lootQuantity").value = "";

    saveState();
    updateUI();
}

function removeLoot(index) {
    loot.splice(index, 1);

    saveState();
    updateUI();
}

function splitLoot() {
    updateUI();
}

function resetAll() {
    loot = [];
    partySize = 1;

    document.getElementById("partySize").value = partySize;
    document.getElementById("message").textContent = "";
    document.getElementById("splitMessage").textContent = "";
    document.getElementById("serverMessage").textContent = "";

    localStorage.removeItem(STORAGE_KEY);

    updateUI();
}

function syncToServer() {
    const payload = {
        studentId: STUDENT_ID,
        state: {
            loot: loot,
            partySize: partySize
        }
    };

    fetch("https://goldtop.hopto.org/save/" + STUDENT_ID, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    })
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Server sync failed.");
        }

        return response.json();
    })
    .then(function (data) {
        if (data.status === "saved" && data.studentId === STUDENT_ID) {
            document.getElementById("serverMessage").textContent =
                "State synced to server successfully.";
        } else {
            document.getElementById("serverMessage").textContent =
                "Server response was not valid.";
        }
    })
    .catch(function () {
        document.getElementById("serverMessage").textContent =
            "Could not sync to server.";
    });
}

function loadFromServer() {
    fetch("https://goldtop.hopto.org/load/" + STUDENT_ID)
    .then(function (response) {
        if (!response.ok) {
            throw new Error("Server load failed.");
        }

        return response.json();
    })
    .then(function (data) {
        if (data.status === "empty" && data.studentId === STUDENT_ID) {
            document.getElementById("serverMessage").textContent =
                "No saved server data was found.";
            return;
        }

        if (
            data.status !== "loaded" ||
            data.studentId !== STUDENT_ID ||
            typeof data.state !== "object" ||
            data.state === null ||
            !Array.isArray(data.state.loot) ||
            isNaN(data.state.partySize) ||
            data.state.partySize < 1
        ) {
            document.getElementById("serverMessage").textContent =
                "Server data was invalid.";
            return;
        }

        const validatedLoot = [];

        for (let i = 0; i < data.state.loot.length; i++) {
            const item = data.state.loot[i];

            if (isValidLootItem(item)) {
                validatedLoot.push({
                    name: item.name,
                    value: parseFloat(item.value),
                    quantity: parseInt(item.quantity)
                });
            }
        }

        loot = validatedLoot;
        partySize = parseInt(data.state.partySize);

        document.getElementById("partySize").value = partySize;

        saveState();
        updateUI();

        document.getElementById("serverMessage").textContent =
            "State loaded from server successfully.";
    })
    .catch(function () {
        document.getElementById("serverMessage").textContent =
            "Could not load from server.";
    });
}

function updateUI() {
    const lootRows = document.getElementById("lootRows");

    let total = 0;

    lootRows.innerHTML = "";

    for (let i = 0; i < loot.length; i++) {
        total += loot[i].value * loot[i].quantity;

        let row = document.createElement("div");
        row.className = "loot-row";

        let nameCell = document.createElement("div");
        nameCell.className = "loot-cell";
        nameCell.innerText = loot[i].name;

        let valueCell = document.createElement("div");
        valueCell.className = "loot-cell";
        valueCell.innerText = "$" + loot[i].value.toFixed(2);

        let quantityCell = document.createElement("div");
        quantityCell.className = "loot-cell";
        quantityCell.innerText = loot[i].quantity;

        let actionCell = document.createElement("div");
        actionCell.className = "loot-cell loot-actions";

        let removeBtn = document.createElement("button");
        removeBtn.innerText = "Remove";

        removeBtn.addEventListener("click", function () {
            removeLoot(i);
        });

        actionCell.appendChild(removeBtn);

        row.appendChild(nameCell);
        row.appendChild(valueCell);
        row.appendChild(quantityCell);
        row.appendChild(actionCell);

        lootRows.appendChild(row);
    }

    const partyIsValid = !isNaN(partySize) && partySize >= 1;
    const lootExists = loot.length > 0;

    document.getElementById("totalLoot").textContent =
        total.toFixed(2);

    document.getElementById("finalTotal").textContent =
        total.toFixed(2);

    if (partyIsValid && lootExists) {
        document.getElementById("lootPerMember").textContent =
            (total / partySize).toFixed(2);
    } else {
        document.getElementById("lootPerMember").textContent =
            "0.00";
    }

    if (lootExists) {
        document.getElementById("noLootMessage").classList.add("hidden");
        document.getElementById("totalRow").classList.remove("hidden");
    } else {
        document.getElementById("noLootMessage").classList.remove("hidden");
        document.getElementById("totalRow").classList.add("hidden");
    }

    if (partyIsValid && lootExists) {
        document.getElementById("resultsPanel").classList.remove("hidden");
        document.getElementById("splitLootButton").disabled = false;
        document.getElementById("splitMessage").textContent = "";
    } else {
        document.getElementById("resultsPanel").classList.add("hidden");
        document.getElementById("splitLootButton").disabled = true;

        if (!partyIsValid && lootExists) {
            document.getElementById("splitMessage").textContent =
                "Please enter a valid party size.";
        } else {
            document.getElementById("splitMessage").textContent = "";
        }
    }
}