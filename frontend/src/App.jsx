import { useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [user, setUser] = useState(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isLogin, setIsLogin] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Loading states
  const [loading, setLoading] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [actionTaskId, setActionTaskId] = useState(null);

  // Dark mode
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem("darkMode") === "true";
  });

  // Save dark mode preference
  useEffect(() => {
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // --------------------------------------------------
  // AUTHENTICATION HEADERS
  // --------------------------------------------------

  const getAuthHeaders = async () => {
    const { data, error } =
      await supabase.auth.getSession();

    if (error || !data.session) {
      throw new Error(
        "Your session has expired. Please log in again."
      );
    }

    return {
      "Content-Type": "application/json",
      Authorization:
        "Bearer " + data.session.access_token,
    };
  };

  // --------------------------------------------------
  // CHECK CURRENT USER
  // --------------------------------------------------

  useEffect(() => {
    const getUser = async () => {
      const { data, error } =
        await supabase.auth.getSession();

      if (error) {
        console.error("Session error:", error);

        setMessage(
          "Unable to restore your session. Please log in again."
        );

        return;
      }

      if (data.session) {
        setUser(data.session.user);
      }
    };

    getUser();

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

  // --------------------------------------------------
  // SIGN UP
  // --------------------------------------------------

  const signUp = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage(
        "Please enter both email and password."
      );
      return;
    }

    if (password.length < 6) {
      setMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
        });

      if (error) {
        throw new Error(error.message);
      }

      console.log("Signup response:", data);

      setMessage(
        "Account created successfully! Please check your email if confirmation is required."
      );

      setPassword("");
    } catch (error) {
      console.error("Signup error:", error);

      setMessage(
        error.message ||
        "Unable to create your account."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGIN
  // --------------------------------------------------

  const login = async () => {
    if (!email.trim() || !password.trim()) {
      setMessage(
        "Please enter both email and password."
      );
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw new Error(error.message);
      }

      setUser(data.user);
      setMessage("Login successful!");

      setEmail("");
      setPassword("");
    } catch (error) {
      console.error("Login error:", error);

      setMessage(
        error.message ||
        "Unable to log in. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOGOUT
  // --------------------------------------------------

  const logout = async () => {
    setLoading(true);

    try {
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        throw new Error(error.message);
      }

      setUser(null);
      setTasks([]);
      setMessage("Logged out successfully.");
    } catch (error) {
      console.error("Logout error:", error);

      setMessage(
        error.message ||
        "Unable to log out. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // LOAD TASKS
  // --------------------------------------------------

  const loadTasks = async () => {
    setLoadingTasks(true);

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks",
        {
          method: "GET",
          headers,
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to load tasks.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      setTasks(data);
      setMessage("");
    } catch (error) {
      console.error(
        "Error fetching tasks:",
        error
      );

      setMessage(
        error.message ||
        "Unable to connect to the server. Make sure the backend is running."
      );
    } finally {
      setLoadingTasks(false);
    }
  };

  // --------------------------------------------------
  // LOAD TASKS WHEN USER LOGS IN
  // --------------------------------------------------

  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  // --------------------------------------------------
  // ADD TASK
  // --------------------------------------------------

  const addTask = async () => {
    if (!title.trim()) {
      setMessage("Please enter a task.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            title: title.trim(),
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to create task.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
      }

      const newTask =
        await response.json();

      setTasks((previousTasks) => [
        newTask,
        ...previousTasks,
      ]);

      setTitle("");
      setMessage("");
    } catch (error) {
      console.error(
        "Error adding task:",
        error
      );

      setMessage(
        error.message ||
        "Unable to add task. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // EDIT TASK
  // --------------------------------------------------

  const editTask = async (
    id,
    oldTitle
  ) => {
    const newTitle = window.prompt(
      "Enter new task title:",
      oldTitle
    );

    if (
      !newTitle ||
      !newTitle.trim()
    ) {
      return;
    }

    setActionTaskId(id);
    setMessage("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            title: newTitle.trim(),
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to update task.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
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

      setMessage(
        error.message ||
        "Unable to update task."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  // --------------------------------------------------
  // COMPLETE / INCOMPLETE TASK
  // --------------------------------------------------

  const toggleTask = async (
    id,
    currentCompleted
  ) => {
    setActionTaskId(id);
    setMessage("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            completed: !currentCompleted,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to update task.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
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
        "Error toggling task:",
        error
      );

      setMessage(
        error.message ||
        "Unable to update task."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  // --------------------------------------------------
  // CHANGE PRIORITY
  // --------------------------------------------------

  const changePriority = async (
    id,
    newPriority
  ) => {
    setActionTaskId(id);
    setMessage("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "PATCH",
          headers,
          body: JSON.stringify({
            priority: newPriority,
          }),
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to update priority.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
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
        "Error changing priority:",
        error
      );

      setMessage(
        error.message ||
        "Unable to change priority."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  // --------------------------------------------------
  // DELETE TASK
  // --------------------------------------------------

  const deleteTask = async (id) => {
    const confirmed =
      window.confirm(
        "Are you sure you want to delete this task?"
      );

    if (!confirmed) {
      return;
    }

    setActionTaskId(id);
    setMessage("");

    try {
      const headers =
        await getAuthHeaders();

      const response = await fetch(
        API_URL + "/tasks/" + id,
        {
          method: "DELETE",
          headers,
        }
      );

      if (!response.ok) {
        let errorMessage =
          "Failed to delete task.";

        try {
          const errorData =
            await response.json();

          errorMessage =
            errorData.error || errorMessage;
        } catch {
          // Response wasn't JSON
        }

        throw new Error(errorMessage);
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

      setMessage(
        error.message ||
        "Unable to delete task."
      );
    } finally {
      setActionTaskId(null);
    }
  };

  // --------------------------------------------------
  // SEARCH + FILTER
  // --------------------------------------------------

  const filteredTasks =
    tasks.filter((task) => {
      const matchesSearch =
        task.title
          .toLowerCase()
          .includes(
            search.toLowerCase()
          );

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" &&
          !task.completed) ||
        (statusFilter === "completed" &&
          task.completed);

      const matchesPriority =
        priorityFilter === "all" ||
        task.priority === priorityFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesPriority
      );
    });

  // --------------------------------------------------
  // DASHBOARD STATISTICS
  // --------------------------------------------------

  const totalTasks = tasks.length;

  const completedTasks =
    tasks.filter(
      (task) => task.completed
    ).length;

  const activeTasks =
    totalTasks - completedTasks;

  const highPriorityTasks =
    tasks.filter(
      (task) =>
        task.priority === "high" &&
        !task.completed
    ).length;

  // --------------------------------------------------
  // LOGIN / SIGNUP SCREEN
  // --------------------------------------------------

  if (!user) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center px-4 transition-colors duration-300 ${darkMode
          ? "dark bg-slate-950"
          : "bg-slate-100"
          }`}
      >
        <div className="w-full max-w-md">

          {/* LOGO / TITLE */}

          <div className="text-center mb-8">

            <div className="text-5xl mb-4">
              ✓
            </div>

            <h1 className="text-4xl font-bold text-slate-800 dark:text-white">
              Task Manager
            </h1>

            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Organize your work. Get things done.
            </p>

          </div>

          {/* AUTH CARD */}

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-transparent dark:border-slate-800">

            {isLogin ? (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Welcome back
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Login to continue to your tasks.
                </p>

                <div className="space-y-4">

                  {/* EMAIL */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      disabled={loading}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      disabled={loading}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !loading
                        ) {
                          login();
                        }
                      }}
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                    />
                  </div>

                  {/* LOGIN */}

                  <button
                    onClick={login}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading
                      ? "Logging in..."
                      : "Login"}
                  </button>

                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                  Don't have an account?
                </p>

                <button
                  disabled={loading}
                  onClick={() => {
                    setIsLogin(false);
                    setMessage("");
                  }}
                  className="w-full mt-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-lg transition"
                >
                  Create an account
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">
                  Create account
                </h2>

                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Start organizing your tasks today.
                </p>

                <div className="space-y-4">

                  {/* EMAIL */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Email
                    </label>

                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      disabled={loading}
                      onChange={(e) =>
                        setEmail(
                          e.target.value
                        )
                      }
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                    />
                  </div>

                  {/* PASSWORD */}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Password
                    </label>

                    <input
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      disabled={loading}
                      onChange={(e) =>
                        setPassword(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key === "Enter" &&
                          !loading
                        ) {
                          signUp();
                        }
                      }}
                      className="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
                    />
                  </div>

                  {/* SIGN UP */}

                  <button
                    onClick={signUp}
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 rounded-lg transition"
                  >
                    {loading
                      ? "Creating account..."
                      : "Create Account"}
                  </button>

                </div>

                <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
                  Already have an account?
                </p>

                <button
                  disabled={loading}
                  onClick={() => {
                    setIsLogin(true);
                    setMessage("");
                  }}
                  className="w-full mt-2 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium py-3 rounded-lg transition"
                >
                  Login
                </button>
              </>
            )}

            {/* MESSAGE */}

            {message && (
              <div className="mt-5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg p-3 text-sm">
                {message}
              </div>
            )}

          </div>

          {/* THEME TOGGLE */}

          <div className="flex justify-center mt-5">

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              {darkMode
                ? "☀️ Light Mode"
                : "🌙 Dark Mode"}
            </button>

          </div>

        </div>
      </div>
    );
  }

  // --------------------------------------------------
  // MAIN TASK MANAGER
  // --------------------------------------------------

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${darkMode
        ? "dark bg-slate-950"
        : "bg-slate-100"
        }`}
    >

      {/* HEADER */}

      <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">

        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">

          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              My Task Manager
            </h1>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Welcome back, {user.email}
            </p>
          </div>

          <div className="flex items-center gap-3">

            {/* DARK MODE */}

            <button
              onClick={() =>
                setDarkMode(!darkMode)
              }
              className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium px-4 py-2 rounded-lg transition"
            >
              {darkMode
                ? "☀️ Light"
                : "🌙 Dark"}
            </button>

            {/* LOGOUT */}

            <button
              onClick={logout}
              disabled={loading}
              className="border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium px-4 py-2 rounded-lg transition"
            >
              {loading
                ? "Logging out..."
                : "Logout"}
            </button>

          </div>

        </div>

      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">

        {/* DASHBOARD STATISTICS */}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">

          {/* TOTAL */}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Total Tasks
            </p>

            <p className="text-3xl font-bold text-slate-800 dark:text-white mt-2">
              {totalTasks}
            </p>
          </div>

          {/* ACTIVE */}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Active
            </p>

            <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400 mt-2">
              {activeTasks}
            </p>
          </div>

          {/* COMPLETED */}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Completed
            </p>

            <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-2">
              {completedTasks}
            </p>
          </div>

          {/* HIGH PRIORITY */}

          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              High Priority
            </p>

            <p className="text-3xl font-bold text-red-500 dark:text-red-400 mt-2">
              {highPriorityTasks}
            </p>
          </div>

        </div>

        {/* ADD TASK */}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6">

          <h2 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">
            Add a new task
          </h2>

          <div className="flex flex-col sm:flex-row gap-3">

            <input
              type="text"
              value={title}
              disabled={loading}
              onChange={(e) =>
                setTitle(
                  e.target.value
                )
              }
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !loading
                ) {
                  addTask();
                }
              }}
              placeholder="What needs to be done?"
              className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-100 dark:disabled:bg-slate-700"
            />

            <button
              onClick={addTask}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold px-6 py-3 rounded-lg transition"
            >
              {loading
                ? "Adding..."
                : "+ Add Task"}
            </button>

          </div>

        </div>

        {/* SEARCH AND FILTERS */}

        <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 mb-6">

          <div className="flex flex-col lg:flex-row gap-3">

            <input
              type="text"
              placeholder="🔍 Search tasks..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white placeholder-slate-400 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            />

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">
                All Tasks
              </option>

              <option value="active">
                Active
              </option>

              <option value="completed">
                Completed
              </option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) =>
                setPriorityFilter(
                  e.target.value
                )
              }
              className="border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-white rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">
                All Priorities
              </option>

              <option value="low">
                Low
              </option>

              <option value="medium">
                Medium
              </option>

              <option value="high">
                High
              </option>
            </select>

          </div>

        </div>

        {/* TASK HEADER */}

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-xl font-bold text-slate-800 dark:text-white">
            Tasks
          </h2>

          <span className="text-sm text-slate-500 dark:text-slate-400">
            {filteredTasks.length} shown
          </span>

        </div>

        {/* LOADING */}

        {loadingTasks ? (

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-12 text-center">

            <div className="text-3xl mb-3">
              ⏳
            </div>

            <p className="text-slate-500 dark:text-slate-400">
              Loading your tasks...
            </p>

          </div>

        ) : filteredTasks.length === 0 ? (

          /* EMPTY STATE */

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-12 text-center">

            <div className="text-4xl mb-3">
              📋
            </div>

            <h3 className="font-semibold text-slate-700 dark:text-slate-200">
              No tasks found
            </h3>

            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Try changing your search or filters.
            </p>

          </div>

        ) : (

          /* TASK LIST */

          <div className="space-y-3">

            {filteredTasks.map(
              (task) => (

                <div
                  key={task.id}
                  className={`bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-sm transition hover:shadow-md ${task.completed
                    ? "border-slate-200 dark:border-slate-800"
                    : "border-slate-300 dark:border-slate-700"
                    }`}
                >

                  <div className="flex flex-col md:flex-row md:items-center gap-4">

                    {/* CHECKBOX + TITLE */}

                    <div className="flex items-center gap-3 flex-1 min-w-0">

                      <input
                        type="checkbox"
                        checked={
                          task.completed
                        }
                        disabled={
                          actionTaskId ===
                          task.id
                        }
                        onChange={() =>
                          toggleTask(
                            task.id,
                            task.completed
                          )
                        }
                        className="w-5 h-5 accent-indigo-600 cursor-pointer disabled:cursor-not-allowed"
                      />

                      <span
                        className={`text-base break-words ${task.completed
                          ? "line-through text-slate-400"
                          : "text-slate-800 dark:text-slate-200"
                          }`}
                      >
                        {task.title}
                      </span>

                    </div>

                    {/* PRIORITY */}

                    <div className="flex items-center gap-2">

                      <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                        Priority
                      </span>

                      <select
                        value={
                          task.priority
                        }
                        disabled={
                          actionTaskId ===
                          task.id
                        }
                        onChange={(e) =>
                          changePriority(
                            task.id,
                            e.target.value
                          )
                        }
                        className={`text-sm font-semibold rounded-full px-3 py-1.5 border outline-none ${task.priority ===
                          "high"
                          ? "bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900"
                          : task.priority ===
                            "medium"
                            ? "bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400 border-yellow-200 dark:border-yellow-900"
                            : "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400 border-green-200 dark:border-green-900"
                          }`}
                      >

                        <option value="low">
                          Low
                        </option>

                        <option value="medium">
                          Medium
                        </option>

                        <option value="high">
                          High
                        </option>

                      </select>

                    </div>

                    {/* ACTIONS */}

                    <div className="flex gap-2">

                      <button
                        onClick={() =>
                          editTask(
                            task.id,
                            task.title
                          )
                        }
                        disabled={
                          actionTaskId ===
                          task.id
                        }
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:bg-slate-100 dark:disabled:bg-slate-800 text-slate-700 dark:text-slate-200 transition"
                      >
                        {actionTaskId ===
                          task.id
                          ? "..."
                          : "Edit"}
                      </button>

                      <button
                        onClick={() =>
                          deleteTask(
                            task.id
                          )
                        }
                        disabled={
                          actionTaskId ===
                          task.id
                        }
                        className="px-3 py-2 text-sm font-medium rounded-lg border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-950 disabled:bg-red-50 dark:disabled:bg-red-950 text-red-600 dark:text-red-400 transition"
                      >
                        Delete
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

        {/* MESSAGE */}

        {message && (
          <div className="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300">
            {message}
          </div>
        )}

      </main>
    </div>
  );
}

export default App;