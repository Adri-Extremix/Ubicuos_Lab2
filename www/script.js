let tasklist = [];
const tasks_container = document.getElementById("tasks-container");

async function loadTasks() {
    try {
        const response = await fetch("/tasks/get");
        if (!response.ok) {
            throw new Error("Error al obtener el archivo JSON");
        }
        const jsonData = await response.json();
        return jsonData;
    } catch (error) {
        console.error("Error al obtener el JSON:", error);
    }
}

function render() {
    while (tasks_container.firstChild) {
        tasks_container.removeChild(tasks_container.firstChild);
    }
    for (const task of tasklist) {
        let newDiv = document.createElement("div");
        newDiv.classList.add("tarea");
        newDiv.id = task.id;
        newDiv.textContent = task.title;
        if (task.done) {
            newDiv.classList.add("vibrar");
            newDiv.style.animation = "none";
        }
        tasks_container.appendChild(newDiv);
    }
    añadirEventos();
}

function add() {
    const add_container = document.getElementById("task-name");
    for (const task of tasklist) {
        if (add_container.value == task.title) {
            throw new Error("La tarea ya existe");
        }
    }
    const nuevaTarea = {
        id:
            tasklist.reduce((maxId, currentTask) => {
                return currentTask.id > maxId ? currentTask.id : maxId;
            }, 0) + 1, // Esta función no funciona
        title: add_container.value,
        done: false,
    };
    tasklist.push(nuevaTarea);
    subirJSON();
    render();
}

function remove(tarea) {
    let id = tarea.getAttribute("id");
    let indice_borrar = tasklist.findIndex((element) => element.id == id);
    tasklist.splice(indice_borrar, 1);
    tarea.remove();
    subirJSON();
}

function toggleDone(tarea) {
    let id = tarea.getAttribute("id");
    let indice_toggle = tasklist.findIndex((element) => {
        return element.id == id;
    });
    tasklist[indice_toggle].done = true;
    subirJSON();
}

function añadirEventos() {
    const addButton = document.querySelector("#fab-add");
    addButton.addEventListener("touchend", add);

    document.querySelectorAll(".tarea").forEach((tarea) => {
        let startX;
        let startY;
        let diffX;
        let timeout;
        const minimo_desplazamiento = 0.05;
        const desplazamiento_eliminar = 0.3;
        let desplazado = false;
        let id = tarea.getAttribute("id");
        let indice_tasklist = tasklist.findIndex((element) => {
            return element.id == id;
        });
        let hecho = tasklist[indice_tasklist].done;

        function vibracion() {
            return setInterval(() => {
                if (!desplazado && !hecho) {
                    tarea.classList.add("vibrar");
                } else if (desplazado && !hecho) {
                    tarea.classList.remove("vibrar");
                }
            }, 10);
        }

        tarea.addEventListener("touchstart", (event) => {
            event.preventDefault();
            startX = event.targetTouches[0].clientX;
            startY = event.targetTouches[0].clientY;
            // Si se completan 2 segundos sin mover, solo de pulsar se completará
            timeout = setTimeout(() => {
                toggleDone(tarea);
                /* tarea.style.backgroundColor = "#46d037"; */
                hecho = true;
            }, 2000);
            time_vibracion = vibracion();
        });

        tarea.addEventListener("touchmove", (event) => {
            event.preventDefault();
            let currentX = event.targetTouches[0].clientX;
            let currentY = event.targetTouches[0].clientY;
            diffX = currentX - startX;
            let diffY = currentY - startY;
            const umbralMinimoX = window.innerWidth * minimo_desplazamiento;
            const umbralMinimoY = window.innerHeight * minimo_desplazamiento;
            if (
                Math.abs(diffX) > umbralMinimoX ||
                Math.abs(diffY) > umbralMinimoY
            ) {
                // Si se está realizando un desplazamiento se impide que se pueda mantener
                clearTimeout(timeout);

                tarea.style.transform = `translateX(${diffX}px)`;

                // Si el desplazamiento horizontal es mayor que el vertical y positivo
                if (Math.abs(diffX) > Math.abs(diffY) && diffX > 0) {
                    // Marcar como desplazado
                    desplazado = true;

                    // Aplicar retroalimentación visual
                }
            }
        });

        tarea.addEventListener("touchend", (event) => {
            event.preventDefault();
            // Si no se ha mantenido durante 2 segundos se quita el timeout
            clearTimeout(timeout);
            clearInterval(time_vibracion);
            if (!hecho) {
                console.log("He terminado de pulsar sin llegar a los 2s");
                tarea.classList.remove("vibrar");
            }
            // Si la tarea ha sido desplazada y no se ha colocado en su posición original
            const para_eliminar = window.innerWidth * desplazamiento_eliminar;
            if (desplazado && diffX > para_eliminar) {
                remove(tarea);
            } else {
                // Si no se suelta en una posición desplazada, restaurar la posición original
                tarea.style.transform = "translateX(0)";
            }
            // Restablecer el estado de desplazado
            desplazado = false;
        });
    });
}

function subirJSON() {
    let url = "/";
    let opciones_solicitud = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(tasklist),
    };

    fetch(url, opciones_solicitud)
        .then(function (response) {
            if (response.ok) {
                console.log("Datos enviados correctamente");
            } else {
                console.error("Error al enviar datos al servidor");
            }
        })
        .catch(function (error) {
            console.error("Error de red:", error);
        });
}

loadTasks().then((val) => {
    tasklist = val;
    render();
});
