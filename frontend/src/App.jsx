import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const API_URL = "http://localhost:5000";

function App() {
  // =========================
  // TASK STATE
  // =========================

  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");

  // =========================
  // USER STATE
  // =========================

  const [user, setUser] = useState(null);

  // =========================
  // AUTH STATE
  // =========================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  // =========================
  // GET AUTH HEADERS
  // =========================

  const getAuthHeaders = async () => {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      throw new Error("User is not logged in");
    }

    return {
      "Content-Type": "application/json",
      Authorization:
        "Bearer " + data.session.access_token,
    };
  };

  // =========================
  // GET CURRENT USER
  // =========================

  useEffect(() => {
    const getUser = async () => {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error(
          "Session error:",
          error
        );
        return;
      }

      if (data.session) {
        console.log(
          "Current user:",
          data.session.user
        );

        setUser(data.session.user);
      }
    };

    getUser();

    // Listen for login/logout changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          setTasks([]);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // =========================
  // SIGN UP
  // =========================

  const signUp = async () => {
    if (!email || !password) {
      setMessage(
        "Please enter email and password"
      );
      return;
    }

    const { data, error } =
      await supabase.auth.signUp({
        email: email,
        password: password,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    console.log(
      "Signup response:",
      data
    );

    setMessage(
      "Account created successfully! Please check your email if confirmation is required."
    );
  };

  // =========================
  // LOGIN
  // =========================

  const login = async () => {
    if (!email || !password) {
      setMessage(
        "Please enter email and password"
      );
      return;
    }

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    console.log(
      "Login response:",
      data
    );

    setUser(data.user);

    setMessage("Login successful!");

    setEmail("");
    setPassword("");
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = async () => {
    const { error } =
      await supabase.auth.signOut();

    if (error) {
      setMessage(error.message);
      return;
    }

    setUser(null);
    setTasks([]);
    setMessage("Logged out successfully");
  };

  // =========================
  // READ - GET USER'S TASKS
  // =========================

  const loadTasks = async () => {
    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks",
        {
          method: "GET",
          headers: headers,
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.error ||
          "Failed to load tasks"
        );
      }

      const data =
        await response.json();

      setTasks(data);
    } catch (error) {
      console.error(
        "Error fetching tasks:",
        error
      );
    }
  };

  // =========================
  // LOAD TASKS WHEN USER LOGS IN
  // =========================

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // =========================
  // CREATE - ADD TASK
  // =========================

  const addTask = async () => {
    if (!title.trim()) {
      return;
    }

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks",
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({
            title: title,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.error ||
          "Failed to create task"
        );
      }

      const newTask =
        await response.json();

      setTasks((previousTasks) => [
        ...previousTasks,
        newTask,
      ]);

      setTitle("");
    } catch (error) {
      console.error(
        "Error adding task:",
        error
      );

      setMessage(error.message);
    }
  };

  // =========================
  // UPDATE - EDIT TASK
  // =========================

  const editTask = async (
    id,
    oldTitle
  ) => {
    const newTitle = prompt(
      "Enter new task title:",
      oldTitle
    );

    if (
      !newTitle ||
      !newTitle.trim()
    ) {
      return;
    }

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "PATCH",
          headers: headers,
          body: JSON.stringify({
            title: newTitle,
          }),
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.error ||
          "Failed to update task"
        );
      }

      const updatedTask =
        await response.json();

      setTasks((previousTasks) =>
        previousTasks.map((task) =>
          task.id === updatedTask.id
            ? updatedTask
            : task
        )
      );
    } catch (error) {
      console.error(
        "Error updating task:",
        error
      );

      setMessage(error.message);
    }
  };

  // =========================
  // DELETE - DELETE TASK
  // =========================

  const deleteTask = async (id) => {
    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "DELETE",
          headers: headers,
        }
      );

      if (!response.ok) {
        const errorData =
          await response.json();

        throw new Error(
          errorData.error ||
          "Failed to delete task"
        );
      }

      setTasks((previousTasks) =>
        previousTasks.filter(
          (task) => task.id !== id
        )
      );
    } catch (error) {
      console.error(
        "Error deleting task:",
        error
      );

      setMessage(error.message);
    }
  };

  // =========================
  // UI
  // =========================

  return (
    <div>
      {/* =========================
          AUTHENTICATION
      ========================== */}

      {!user ? (
        <div>
          {isLogin ? (
            <>
              <h1>Login</h1>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <button onClick={login}>
                Login
              </button>

              <p>{message}</p>

              <button
                onClick={() => {
                  setIsLogin(false);
                  setMessage("");
                }}
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              <h1>Create Account</h1>

              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) =>
                  setEmail(
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
              />

              <br />
              <br />

              <button onClick={signUp}>
                Create Account
              </button>

              <p>{message}</p>

              <button
                onClick={() => {
                  setIsLogin(true);
                  setMessage("");
                }}
              >
                Already have an account?
                Login
              </button>
            </>
          )}
        </div>
      ) : (
        /* =========================
           TASK MANAGER
        ========================== */

        <div>
          <h1>My Task Manager</h1>

          <p>
            Logged in as:{" "}
            <strong>
              {user.email}
            </strong>
          </p>

          <button onClick={logout}>
            Logout
          </button>

          <hr />

          <input
            type="text"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            placeholder="Enter a task"
          />

          <button onClick={addTask}>
            Add Task
          </button>

          <h2>Tasks</h2>

          {tasks.length === 0 ? (
            <p>
              No tasks yet. Add your first
              task!
            </p>
          ) : (
            <ul>
              {tasks.map((task) => (
                <li key={task.id}>
                  {task.title}

                  {" "}

                  <button
                    onClick={() =>
                      editTask(
                        task.id,
                        task.title
                      )
                    }
                  >
                    Edit
                  </button>

                  {" "}

                  <button
                    onClick={() =>
                      deleteTask(
                        task.id
                      )
                    }
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default App;