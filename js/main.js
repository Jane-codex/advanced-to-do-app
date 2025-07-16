     // ================================
    //  Project Data & Initial Setup
    //  ===============================
    let projects = 
       JSON.parse(localStorage.getItem("projects")) || [
    { name: "Personal", tasks: [] },
    { name: "Work", tasks: [] },
  ];

  let currentProject = "Personal";

  
  document.addEventListener("DOMContentLoaded", () => {
 
          
  // =============== DOM ELEMENTS ===============
  const taskForm = document.getElementById("task-form");

  const taskInput = document.getElementById("task-input");

  const taskList = document.getElementById("task-list");

  const projectSelector = document.getElementById("project-selector");

  const listView = document.getElementById("list-view");

  const kanbanView = document.getElementById("kanban-view");

  const calendarView = document.getElementById("calendar-view");

  const viewButtons = document.querySelectorAll(".view-btn");

   const emptyImage = document.querySelector(".empty-images");

   const projectLabel = document.getElementById("current-project-label");

  

        // =============== FUNCTIONS 
         //  Save current projects to localStorage   ===============
    function saveProjects() {
    localStorage.setItem("projects", JSON.stringify(projects));
  }
                    
              // Get the current selected project
         function getCurrentProject() {
        let project = projects.find(p => p.name === currentProject);
        if (!project) {
        project = { name: currentProject, tasks: [] };
       projects.push(project);
        saveProjects();
      }
    return project;
      }

              // ==== Render list view of tasks =======
        function renderListView() {
          const project = getCurrentProject();
         taskList.innerHTML = "";

        if (!project || !Array.isArray(project.tasks) || project.tasks.length === 0) {
       if (emptyImage) emptyImage.style.display = "block";
        taskList.innerHTML = "<li>No tasks yet.</li>";
        return;
       }

        if (emptyImage) emptyImage.style.display = "none";

        project.tasks.forEach((task, index) => {
       const li = document.createElement("li");
       li.draggable = true;
       li.dataset.index = index;

    // Drag start
    li.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", index);
      li.classList.add("dragging");
    });

    // Drag end
    li.addEventListener("dragend", () => {
      li.classList.remove("dragging");
    });

           //=================================
     //  Format the task date for display 
      // =======================================
           let formattedDate = "No due date";
           if (task.dateTime) {
             formattedDate = new Date(task.dateTime).toLocaleString("en-US", {
             weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
             hour: "2-digit",
            minute: "2-digit",
            hour12: true,
           });
          }

    let taskText = `${task.text} - Due: ${formattedDate}`;

    // Duration
    if (task.completedAt && task.createdAt) {
      const created = new Date(task.createdAt);
      const completed = new Date(task.completedAt);
      const durationMinutes = Math.round((completed - created) / 60000);
      taskText += ` (⏱ ${durationMinutes} min)`;
    }

    li.textContent = taskText;

    // Highlight Overdue tasks?
    if (task.dateTime && new Date(task.dateTime) < new Date()) {
      li.style.color = "red";
    }

    // ======= 🗑️ Delete button for tasks =========
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "🗑️";
    deleteBtn.style.marginLeft = "10px";
    deleteBtn.addEventListener("click", () => {
      project.tasks.splice(index, 1);
      saveProjects();
      renderListView();
    });
    li.appendChild(deleteBtn);

    // ====== ➕ Add Subtask buroon =========
    const addSubBtn = document.createElement("button");
    addSubBtn.textContent = "+ Add Subtask";
    addSubBtn.style.marginLeft = "10px";
    addSubBtn.addEventListener("click", () => {
      const subText = prompt("Enter subtask:");
      if (!subText) return;
      if (!task.subtasks) task.subtasks = [];
      task.subtasks.push({ text: subText, done: false });
      saveProjects();
      renderListView();
    });
    li.appendChild(addSubBtn);

    // ✅ Display Subtasks if they exist
    if (task.subtasks && task.subtasks.length > 0) {
      const subList = document.createElement("ul");
      subList.style.marginTop = "10px";
      subList.style.marginLeft = "1rem";

      task.subtasks.forEach((subtask) => {
        const subItem = document.createElement("li");
          subItem.textContent = subtask.text;
          subItem.style.cursor = "pointer";

        // Apply the class conditionally
          if (subtask.done) {
    subItem.classList.add("subtask-done");
          } else {
       subItem.classList.remove("subtask-done");
           }

       subItem.addEventListener("click", () => {
    subtask.done = !subtask.done;
    saveProjects();
    renderListView();
      });
      /*   subItem.textContent = subtask.text;
        subItem.style.cursor = "pointer";
       subItem.className = subtask.done ? "subtask-complete" : "";


        subItem.addEventListener("click", () => {
          subtask.done = !subtask.done;
          saveProjects();
          renderListView();
        }); */

        subList.appendChild(subItem);
      });

      li.appendChild(subList);
    }

         taskList.appendChild(li);
      });

        //  Drag Over (container)
         taskList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const dragging = document.querySelector(".dragging");
       const afterElement = getDragAfterElement(taskList, e.clientY);
        if (afterElement == null) {
         taskList.appendChild(dragging);
          } else {
            taskList.insertBefore(dragging, afterElement);
            }
         });

       // Drop logic
         taskList.addEventListener("drop", (e) => {
          const oldIndex = e.dataTransfer.getData("text/plain");
          const newIndex = [...taskList.children].indexOf(document.querySelector(".dragging"));

       if (oldIndex !== newIndex) {
        const movedTask = project.tasks.splice(oldIndex, 1)[0];
        project.tasks.splice(newIndex, 0, movedTask);
       saveProjects();
             
        // == Initial render of the list view
       renderListView();
        }
      });
     }
         
        // ===== Helper function to determine where to dragged element =========
       function getDragAfterElement(container, y) {
      const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

       return draggableElements.reduce(
       (closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) {
        return { offset, element: child };
      } else {
        return closest;
      }
    },
    { offset: Number.NEGATIVE_INFINITY }
  ).element;
}
        
                 
      // ====== KANBAN VIEW RENDERING ==========
       function renderKanbanView() {
    const project = getCurrentProject();
    if (!project || !Array.isArray(project.tasks)) return;

    // Clear all columns before rendering fresh tasks
    ["todo", "in-progress", "done"].forEach(status => {
        const column = document.getElementById(`${status}-column`);
        if (column) column.innerHTML = "";
    });

          // Render each task in the appropriate colunm
         project.tasks.forEach((task, index) => {
        if (!task.text) return; // Skip empty tasks

        const li = document.createElement("li");
        li.textContent = task.text;
        li.draggable = true;
        li.dataset.index = index;
              
          // Enable drag start for task reordering 
           li.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", index);
            li.classList.add("dragging");
        });

        li.addEventListener("dragend", () => {
            li.classList.remove("dragging");
        });

        // Create dropdown for changing task status (To Do, In Progress, Done)
        const select = document.createElement("select");
        select.innerHTML = `
            <option value="todo" ${task.status === "todo" ? "selected" : ""}>To Do</option>
            <option value="in-progress" ${task.status === "in-progress" ? "selected" : ""}>In Progress</option>
            <option value="done" ${task.status === "done" ? "selected" : ""}>Done</option>
        `;
        select.addEventListener("change", () => {
            task.status = select.value;
            if (task.status === "done" && !task.completedAt) {
                task.completedAt = new Date().toISOString();
            }
            saveProjects();
            renderKanbanView();
        });

        li.appendChild(select);
              
        // Append the task to the correct column
        const column = document.getElementById(`${task.status}-column`);
        if (column) {
            column.appendChild(li);
        }
    });

    // Setup drag-and-drop behavior for each columns
    ["todo", "in-progress", "done"].forEach(status => {
        const column = document.getElementById(`${status}-column`);
        if (!column) return;

        column.addEventListener("dragover", (e) => {
            e.preventDefault();
            const afterElement = getDragAfterElement(column, e.clientY);
            const dragging = document.querySelector(".dragging");
            if (!dragging) return;

            if (afterElement == null) {
                column.appendChild(dragging);
            } else {
                column.insertBefore(dragging, afterElement);
            }
        });

        column.addEventListener("drop", (e) => {
            e.preventDefault();
            const draggedIndex = e.dataTransfer.getData("text/plain");
            const newStatus = column.dataset.status;
            const afterElement = getDragAfterElement(column, e.clientY);
            const task = project.tasks[draggedIndex];

            task.status = newStatus;

            // Remove and reinsert
            project.tasks.splice(draggedIndex, 1);
            const newIndex = afterElement
                ? parseInt(afterElement.dataset.index)
                : project.tasks.length;
            project.tasks.splice(newIndex, 0, task);

            saveProjects();
            renderKanbanView();
        });
    });
}

      // Helper for drag position
         function getDragAfterElement(container, y) {
           const draggableElements = [...container.querySelectorAll("li:not(.dragging)")];

            return draggableElements.reduce((closest, child) => {
             const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
             if (offset < 0 && offset > closest.offset) {
               return { offset: offset, element: child };
                 } else {
                 return closest;
               }
             }, { offset: Number.NEGATIVE_INFINITY }).element;
         }


             // ==== Render tasks grouped by date in a calendar-style view ======
       function renderCalendarView() {
    console.log("📅 Rendering Calendar View triggered");
    calendarView.innerHTML = ""; // Clear previous content

    const project = getCurrentProject();
    if (!project || !Array.isArray(project.tasks) || project.tasks.length === 0) {
        const p = document.createElement("p");
        p.textContent = "No tasks to display at the moment.";

        p.classList.add("empty-calendar-message");
        p.style.color = "#fff";
        calendarView.appendChild(p);
        return;
    }

    const grouped = {};
    project.tasks.forEach(task => {
        if (!task.dateTime) return;
        const dateOnly = task.dateTime.split("T")[0];
        if (!grouped[dateOnly]) grouped[dateOnly] = [];
        grouped[dateOnly].push(task);
    });

    if (Object.keys(grouped).length === 0) {
        const p = document.createElement("p");
        p.textContent = "No dated tasks available.";
        p.style.color = "#fff";
        calendarView.appendChild(p);
        return;
    }

    Object.keys(grouped).forEach(date => {
        const section = document.createElement("div");
        section.classList.add("calendar-card");
        

        const heading = document.createElement("h4");
        heading.textContent = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
            timeZone: "UTC",
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
        });
        heading.style.color = "#fff";
        section.appendChild(heading);

        grouped[date].forEach(task => {
            const formattedTime = task.dateTime
                ? new Date(task.dateTime).toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: true
                })
                : "";

            const p = document.createElement("p");
            p.textContent = `• ${task.text} - ${formattedTime}`;
            p.style.color = "#ddd";
            section.appendChild(p);
        });

        calendarView.appendChild(section);
         });
       }

  
         // ========= EVENT LISTENERS 
         // Add a new task when the form is submitted ========
         taskForm.addEventListener("submit", (e) => {
            e.preventDefault(); // rest of logic

       const taskText = taskInput.value.trim();
       if (!taskText) return;

       const taskDateInput = document.getElementById("task-date");
       const taskDateTime = taskDateInput ? taskDateInput.value : "";

       const project = getCurrentProject();

          project.tasks.push({
         text: taskText,
         dateTime: taskDateTime, // ✅ This must be saved properly
        status: "todo",
       createdAt: new Date().toISOString(),
      completedAt: null,
      subtasks: []
      });

        saveProjects();
       taskInput.value = "";
       if (taskDateInput) taskDateInput.value = "";
       renderListView();
    });

  
        projectSelector.addEventListener("change", () => {
             currentProject = projectSelector.value;

         localStorage.setItem("currentProject", currentProject);

     projectLabel.textContent = `Project: ${currentProject}`; 

            // Load saved project or default to "Personal"
   const savedProject = localStorage.getItem("currentProject");
      if (savedProject && projects.some(p => p.name === savedProject)) {
                currentProject = savedProject;
              projectSelector.value = currentProject;
              }
             
                 renderListView();
             });

         
           viewButtons.forEach(btn => {
            btn.addEventListener("click", () => {
            viewButtons.forEach(b => b.classList.remove("active"));
             btn.classList.add("active");

            const view = btn.textContent.trim();

             listView.style.display = "none";
             kanbanView.style.display = "none";
            calendarView.style.display = "none";

      if (view === "List") {
        listView.style.display = "block";
        renderListView();

      } else if (view === "Kanban") {
           kanbanView.style.display = "block";
               renderKanbanView();
     
      } else if (view === "Calendar") {
        calendarView.style.display = "block";
        renderCalendarView();
             }
          });
       });

       function renderProductivitySummary() {
      const allTasks = projects.flatMap(p => p.tasks);
      const today = new Date().toDateString();
      const doneToday = allTasks.filter(
       t => t.completedAt && new Date(t.completedAt).toDateString() === today
       );

        const summary = `
         <p>✅ Tasks completed today: ${doneToday.length}</p>
           `;

       document.getElementById("productivity-summary").innerHTML = summary;
            }


            // ===== Switch between List, Kanban, and Calendar Views ======
          function switchView(view) {
            listView.style.display = view === "list" ? "block" : "none";
            kanbanView.style.display = view === "kanban" ? "flex" : "none";
           calendarView.style.display = view === "calendar" ? "block" : "none";

        // Optional: Highlight active button if you want
             document.querySelectorAll(".view-btn").forEach((btn) => {
               btn.classList.remove("active");
                });

         const viewButtons = {
          list: 0,
        kanban: 1,
       calendar: 2,
       };

       const buttons = document.querySelectorAll(".view-btn");
         if (buttons[viewButtons[view]]) {
        buttons[viewButtons[view]].classList.add("active");
            }

                if (view === "list") renderListView();
                if (view === "kanban") renderKanbanView();
                if (view === "calendar") renderCalendarView();
                }

            document.addEventListener("keydown", (e) => {
         // ENTER to add task (when input is focused)
              if (e.key === "Enter" && document.activeElement === document.getElementById("task-input")) {
                 e.preventDefault();
                  document.getElementById("add-task-btn").click();
                }

      // Ctrl + 1 = List View
        if (e.ctrlKey && e.key === "1") {
         switchView("list");
       }

       // Ctrl + 2 = Kanban View
         if (e.ctrlKey && e.key === "2") {
          switchView("kanban");
        }

     // Ctrl + 3 = Calendar View
       if (e.ctrlKey && e.key === "3") {
         switchView("calendar");
        }
    });

              // ===== Register service worker for offline capabilities =======
          if ('serviceWorker' in navigator) {
            window.addEventListener("load", () => {
              navigator.serviceWorker
            .register("service-worker.js")
            .then((reg) => console.log("✅ Service Worker registered!", reg.scope))
            .catch((err) => console.error("❌ Service Worker registration failed:", err));
             });
            }
        
         window.getCurrentProject = getCurrentProject;
    });
  
             